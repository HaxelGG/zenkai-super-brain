# Módulo CRM — Panel de Control Grupo Juana Sánchez

**Fecha:** 2026-05-25
**Estado:** Diseño aprobado · pendiente de plan de implementación
**Módulo nº:** 2 (tras Inventario)
**Alcance:** Módulo CRM completo de punta a punta, construido SOBRE los cimientos ya
existentes. No reconstruye nada de auth, multi-empresa, app shell, selector de empresa,
RLS ni PWA.

---

## 1. Contexto y objetivo

El Panel de Control ya tiene cimientos funcionando (auth Supabase, multi-empresa por
`company_id`, RLS con helpers `is_owner()` / `accessible_company_ids()`, app shell con
sidebar y selector de empresa por cookie, PWA) y el primer módulo completo (Inventario).
Ver `docs/superpowers/specs/2026-05-25-panel-control-grupo-design.md` y
`docs/superpowers/plans/2026-05-25-panel-control-grupo.md`.

El CRM es el **módulo nº2** del ROADMAP (`docs/superpowers/ROADMAP-modulos-panel.md`).
Depende solo de los cimientos y es la base para Cotizaciones y Ventas más adelante.

**Objetivo:** una ficha única por cliente con su historial de interacciones, aislada por
empresa, replicando exactamente el patrón de Inventario para mantener la coherencia del
panel y la velocidad de los siguientes módulos.

## 2. Stack y patrón a reutilizar (NO se reconstruye)

- **Next.js 15 (App Router, TS) + Supabase + Vercel + shadcn/ui** — stack fijo del panel.
- **Patrón Inventario** que el CRM replica 1:1:
  - `src/lib/<modulo>/queries.ts` (lecturas server), `src/lib/<modulo>/actions.ts`
    (server actions con `revalidatePath`), lógica pura testeable en un módulo aparte
    (TDD con Vitest).
  - Rutas en `src/app/(app)/<modulo>/`, componentes en `src/components/<modulo>/`.
  - Migraciones SQL versionadas en `supabase/migrations/`.
  - RLS por `company_id` usando `accessible_company_ids()`.
  - Tipos regenerados a `src/types/db.ts`.
  - Las queries filtran por la empresa activa del selector vía `getActiveCompany()`
    (cookie `active_company`, valor `"all"` o un `company_id`).
  - Entrada nueva en el `Sidebar`.

## 3. Decisiones tomadas (brainstorming 2026-05-25)

| Decisión | Elección |
|---|---|
| Alcance del cliente | **Separados por empresa** (`company_id` + RLS), idéntico a Inventario. Un mismo cliente real que compre en dos marcas tendrá una ficha por empresa. |
| Embudo / etapas | **Estado simple** en el cliente: `lead → active → inactive`. El embudo comercial real (cotización enviada/aceptada) vive en Cotizaciones/Ventas, no aquí. |
| Importación | **No** en esta entrega — solo alta manual, como Inventario. Importación CSV/externa queda como mejora futura. |
| Contactos | **Sin tabla `contacts`** separada. Email/teléfono van en el propio cliente. Multi-contacto por cliente (tienda/mayorista) se añadirá después sin romper nada. |
| Etiquetas | **`tags` libres** como `text[]` en `customers`, filtrables. Sin tabla de etiquetas. |
| Interacciones | **Sí** — tabla `interactions` con timeline en la ficha. Es el corazón del CRM. |

## 4. Modelo de datos

Migración nueva `0006_crm.sql` (+ `0007_crm_rls.sql`), siguiendo la numeración del plan
de cimientos (última migración existente: `0005_inventory_rls`).

### 4.1 Enums

```sql
create type public.customer_type   as enum ('particular', 'tienda', 'mayorista');
create type public.customer_status as enum ('lead', 'active', 'inactive');
create type public.interaction_type as enum ('llamada', 'email', 'visita', 'whatsapp', 'otro');
```

### 4.2 Tablas

**`customers`**
- `id` uuid pk default `gen_random_uuid()`
- `company_id` uuid not null → `companies(id)` on delete cascade
- `name` text not null
- `type` `customer_type` not null default `'particular'`
- `status` `customer_status` not null default `'lead'`
- `email` text
- `phone` text
- `tags` text[] not null default `'{}'`
- `notes` text
- `created_by` uuid → `profiles(id)`
- `created_at` timestamptz not null default `now()`
- `updated_at` timestamptz not null default `now()`

**`interactions`**
- `id` uuid pk default `gen_random_uuid()`
- `customer_id` uuid not null → `customers(id)` on delete cascade
- `type` `interaction_type` not null
- `summary` text not null
- `occurred_at` timestamptz not null default `now()`
- `created_by` uuid → `profiles(id)`
- `created_at` timestamptz not null default `now()`

Índices: `customers(company_id)`, `interactions(customer_id)`.

### 4.3 RLS (migración `0007_crm_rls.sql`)

Mismo patrón que Inventario:

```sql
alter table public.customers    enable row level security;
alter table public.interactions enable row level security;

create policy "customers por empresa accesible" on public.customers for all to authenticated
  using (company_id in (select public.accessible_company_ids()))
  with check (company_id in (select public.accessible_company_ids()));

create policy "interactions por cliente accesible" on public.interactions for all to authenticated
  using (customer_id in (
    select id from public.customers where company_id in (select public.accessible_company_ids())
  ))
  with check (customer_id in (
    select id from public.customers where company_id in (select public.accessible_company_ids())
  ));
```

## 5. Estructura de archivos

```
src/lib/crm/
  customer.ts          # lógica pura testeable (parseTags, statusLabel, typeLabel)
  customer.test.ts     # tests (TDD, escritos primero)
  queries.ts           # listCustomers(filtro), getCustomer(id),
                       #   listInteractions(customerId), crmSummary(filtro)
  actions.ts           # createCustomer, updateCustomer, logInteraction
src/app/(app)/crm/
  page.tsx             # lista de clientes + resumen
  nuevo/page.tsx       # alta de cliente
  [id]/page.tsx        # ficha + timeline + registrar interacción
src/components/crm/
  summary-cards.tsx
  customer-table.tsx
  customer-form.tsx    # reutilizable alta/edición (como product-form)
  interaction-form.tsx
  interaction-timeline.tsx
supabase/migrations/
  0006_crm.sql
  0007_crm_rls.sql
```
+ entrada `{ href: "/crm", label: "Clientes", icon: Users }` en
`src/components/app-shell/sidebar.tsx`.

## 6. Lógica pura testeable (TDD)

`src/lib/crm/customer.ts` (tests primero, igual que `stock.ts`):
- `parseTags(input: string): string[]` — separa por comas, recorta espacios, deduplica
  (case-insensitive), descarta vacíos. Convierte el input libre del formulario al `text[]`.
- `statusLabel(status): string` y `typeLabel(type): string` — etiquetas en español para
  la UI (`lead → "Lead"`, `active → "Activo"`, `inactive → "Inactivo"`; `particular →
  "Particular"`, etc.).

## 7. Capa de datos

- **`queries.ts`** (lecturas server, filtran por empresa activa como Inventario):
  - `listCustomers(companyFilter)` — clientes ordenados por nombre; si `companyFilter !==
    "all"`, `.eq("company_id", companyFilter)`. Devuelve campos para la tabla.
  - `getCustomer(id)` — un cliente.
  - `listInteractions(customerId)` — interacciones del cliente, `occurred_at` desc.
  - `crmSummary(companyFilter)` — `{ totalCustomers, leadCount, activeCount }`.
- **`actions.ts`** (server actions, `revalidatePath`):
  - `createCustomer(formData)` — inserta con `company_id`, `created_by`, `tags` vía
    `parseTags`. Revalida `/crm`.
  - `updateCustomer(id, formData)` — actualiza + `updated_at`. Revalida `/crm/[id]` y `/crm`.
  - `logInteraction(customerId, formData)` — inserta una interacción con `created_by`.
    Revalida `/crm/[id]`.

## 8. Pantallas

1. **Lista de clientes** (`/crm`)
   - Tarjetas de resumen: total clientes, nº leads, nº activos.
   - Tabla con buscador (nombre/email/teléfono) y filtros por tipo, estado y etiqueta.
   - Badge de estado con color (lead/activo/inactivo). Respeta la empresa activa.
   - Botón "Nuevo cliente".
2. **Ficha de cliente** (`/crm/[id]`)
   - Datos del cliente (nombre, tipo, estado, email, teléfono, etiquetas, notas).
   - Formulario rápido "registrar interacción" (tipo + resumen + fecha) → inserta y refresca.
   - Timeline de interacciones (orden descendente).
   - Acceso a edición.
3. **Alta/edición** (`/crm/nuevo`, edición reutiliza el form)
   - `customer-form` reutilizable: empresa, nombre, tipo, estado, email, teléfono,
     etiquetas (texto libre separado por comas), notas. Mismo enfoque que `product-form`.

## 9. Criterios de éxito

- Doy de alta clientes de la empresa activa; el selector aísla la lista por empresa.
- Filtro por tipo/estado/etiqueta y busco por nombre/email/teléfono.
- Abro una ficha, registro una interacción y aparece en el timeline al instante.
- El resumen muestra total de clientes y nº de leads/activos.
- RLS impide ver clientes de otra empresa (verificable como owner cambiando de empresa).
- La lógica pura (`parseTags` y labels) tiene tests que pasan.

## 10. Fuera de alcance (explícito)

- Tabla `contacts` (multi-persona por cliente).
- Importación CSV o desde fuentes externas (Shopify, Google Contacts…).
- Embudo/pipeline kanban con etapas configurables.
- Recordatorios/follow-ups con fecha y asignación (eso vive en el módulo **Tareas**).
- Vínculo a cotizaciones/ventas (módulos posteriores del ROADMAP).
- Activación de roles/equipo (sigue preparada en cimientos, no se activa aquí).
