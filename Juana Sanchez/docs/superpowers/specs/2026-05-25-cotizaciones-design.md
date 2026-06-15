# Módulo Cotizaciones — Panel de Control Grupo Juana Sánchez

**Fecha:** 2026-05-25
**Estado:** Diseño aprobado · pendiente de plan de implementación
**Módulo nº:** 3 (tras Inventario y CRM)
**Alcance:** Módulo Cotizaciones completo de punta a punta, construido SOBRE los cimientos
y los módulos existentes (Inventario, CRM). No reconstruye nada de auth, multi-empresa,
app shell, selector de empresa, RLS ni PWA.

---

## 1. Contexto y objetivo

El Panel ya tiene cimientos (auth Supabase, multi-empresa por `company_id`, RLS con
helpers `is_owner()` / `accessible_company_ids()`, app shell con sidebar y selector de
empresa, PWA) y dos módulos completos: **Inventario** (`products`, precios, `stock_movements`)
y **CRM** (`customers`). Ver specs/plans previos en `docs/superpowers/`.

Cotizaciones es el **módulo nº3** del ROADMAP (`docs/superpowers/ROADMAP-modulos-panel.md`).
**Depende de:** Inventario (productos/precios) + CRM (cliente). Es la base para el módulo
Ventas, que más adelante convertirá una cotización aceptada en venta (reutilizando `quote_id`).

**Objetivo:** crear, editar, seguir e imprimir presupuestos por empresa, reutilizando
clientes (CRM) y productos (Inventario), replicando el patrón de los módulos previos.

## 2. Stack y patrón a reutilizar (NO se reconstruye)

- **Next.js 15 (App Router, TS) + Supabase + Vercel + shadcn/ui** — stack fijo.
- **Patrón Inventario/CRM** replicado 1:1:
  - `src/lib/<modulo>/queries.ts` (lecturas server), `actions.ts` (server actions con
    `revalidatePath`), lógica pura testeable aparte (TDD con Vitest).
  - Rutas en `src/app/(app)/<modulo>/`, componentes en `src/components/<modulo>/`.
  - Migraciones SQL versionadas en `supabase/migrations/` (siguientes: `0009`, `0010`).
  - RLS por `company_id` usando `accessible_company_ids()`.
  - Tipos regenerados a `src/types/db.ts`.
  - Lecturas filtradas por la empresa activa vía `getActiveCompany()` (cookie
    `active_company`, valor `"all"` o un `company_id`).
  - Entrada nueva en el `Sidebar`.
- **Deploy:** integrar por rama `main`; push a `main` redespliega en Vercel
  (repo `HaxelGG/juana-sanchez-panel`, proyecto Vercel git-conectado a `main`).

## 3. Decisiones tomadas (brainstorming 2026-05-25)

| Decisión | Elección |
|---|---|
| PDF / email | **Vista imprimible** (página limpia + impresión del navegador → "Guardar como PDF"). Sin PDF server-side ni email. |
| Impuestos | **IVA único por cotización**: campo `tax_rate %` (default 21, editable). |
| Numeración | **Correlativa por empresa y año**: `JS-2026-0001`. Serie independiente por empresa, reinicia cada año. |
| Aceptada → venta | **Solo cambia el estado** a `aceptada`. La conversión a venta (descuento de stock) la hará el módulo Ventas, reutilizando `quote_id`. |
| Descuento | **% por línea** (`discount_pct`, 0 por defecto). |

## 4. Modelo de datos

Migraciones nuevas `0009_quotes.sql` (esquema) y `0010_quotes_rls.sql` (RLS). Última
migración existente: `0008_crm_rls`.

### 4.1 Enum

```sql
create type public.quote_status as enum ('borrador', 'enviada', 'aceptada', 'rechazada', 'caducada');
```

### 4.2 Tablas

**`quotes`**
- `id` uuid pk default `gen_random_uuid()`
- `company_id` uuid not null → `companies(id)` on delete cascade
- `customer_id` uuid not null → `customers(id)` on delete restrict
- `number` text not null — formateado e inmutable, p. ej. `"JS-2026-0001"`
- `seq` integer not null — correlativo dentro de (empresa, año)
- `year` integer not null
- `status` `quote_status` not null default `'borrador'`
- `issue_date` date not null default `current_date`
- `valid_until` date
- `tax_rate` numeric(5,2) not null default 21
- `notes` text
- `subtotal` numeric(12,2) not null default 0 — base imponible (suma de subtotales de líneas)
- `tax_amount` numeric(12,2) not null default 0 — `subtotal * tax_rate/100`
- `total` numeric(12,2) not null default 0 — `subtotal + tax_amount`
- `created_by` uuid → `profiles(id)`
- `created_at` timestamptz not null default `now()`
- `updated_at` timestamptz not null default `now()`
- `unique (company_id, number)`

**`quote_items`**
- `id` uuid pk default `gen_random_uuid()`
- `quote_id` uuid not null → `quotes(id)` on delete cascade
- `product_id` uuid → `products(id)` on delete set null (nullable: línea libre si null)
- `description` text not null
- `quantity` numeric(12,2) not null default 1
- `unit_price` numeric(12,2) not null default 0
- `discount_pct` numeric(5,2) not null default 0
- `line_subtotal` numeric(12,2) not null default 0 — `quantity * unit_price * (1 - discount_pct/100)`
- `position` integer not null default 0 — orden de la línea

**`quote_counters`** (numeración atómica)
- `company_id` uuid not null → `companies(id)` on delete cascade
- `year` integer not null
- `last_seq` integer not null default 0
- `primary key (company_id, year)`

Índices: `quotes(company_id)`, `quotes(customer_id)`, `quote_items(quote_id)`.

### 4.3 RPC de numeración

```sql
create function public.next_quote_seq(p_company_id uuid, p_year int)
returns int language plpgsql security definer set search_path = public as $$
declare v_seq int;
begin
  insert into public.quote_counters (company_id, year, last_seq)
    values (p_company_id, p_year, 1)
  on conflict (company_id, year)
    do update set last_seq = public.quote_counters.last_seq + 1
  returning last_seq into v_seq;
  return v_seq;
end; $$;
```

Atómico (un solo `insert … on conflict … returning`), evita choques de numeración. Es
`security definer` para poder tocar `quote_counters` sin política RLS directa.

### 4.4 RLS (migración `0010_quotes_rls.sql`)

```sql
alter table public.quotes         enable row level security;
alter table public.quote_items    enable row level security;
alter table public.quote_counters enable row level security;  -- sin políticas: solo el RPC definer lo toca

create policy "quotes por empresa accesible" on public.quotes for all to authenticated
  using (company_id in (select public.accessible_company_ids()))
  with check (company_id in (select public.accessible_company_ids()));

create policy "quote_items por cotización accesible" on public.quote_items for all to authenticated
  using (quote_id in (
    select id from public.quotes where company_id in (select public.accessible_company_ids())
  ))
  with check (quote_id in (
    select id from public.quotes where company_id in (select public.accessible_company_ids())
  ));
```

## 5. Lógica pura testeable (TDD) — `src/lib/cotizaciones/quote.ts`

- `lineSubtotal(quantity, unitPrice, discountPct): number` — `quantity * unitPrice * (1 - discountPct/100)`, redondeado a 2 decimales.
- `quoteTotals(lines, taxRate): { subtotal, taxAmount, total }` — `subtotal` = suma de `lineSubtotal`; `taxAmount` = `subtotal * taxRate/100`; `total` = `subtotal + taxAmount`; todo a 2 decimales.
- `companyPrefix(name): string` — iniciales en mayúscula de cada palabra, máx 3 (p. ej. "Juana Sánchez" → "JS", "Lolikas" → "L", "Printellar" → "P").
- `formatQuoteNumber(prefix, year, seq): string` — `` `${prefix}-${year}-${String(seq).padStart(4,"0")}` `` → `"JS-2026-0001"`.
- `statusLabel(status): string` — Borrador / Enviada / Aceptada / Rechazada / Caducada.
- `isExpired(validUntil, status): boolean` — true si `validUntil` existe, es anterior a hoy y el estado no es `aceptada`/`rechazada`/`caducada` (sirve para la badge "vencida"; no cambia el estado).

Tests escritos primero, igual que `stock.ts` / `customer.ts`.

## 6. Capa de datos

- **`queries.ts`** (lecturas server, filtran por empresa activa):
  - `listQuotes(companyFilter)` — cotizaciones con `number`, cliente (nombre), `issue_date`, `status`, `total`, ordenadas por `issue_date` desc / `seq` desc. Filtra `.eq("company_id", …)` si no es `"all"`.
  - `getQuote(id)` — cabecera + líneas (`quote_items` ordenados por `position`) + nombre de cliente y datos de empresa (para imprimir).
  - `customersForCompany(companyId)` — clientes de la empresa, para el select del editor.
  - `productsForCompany(companyId)` — productos activos (id, name, price) para el picker de líneas.
  - `quotesSummary(companyFilter)` — `{ totalQuotes, acceptedCount, acceptedAmount }`.
- **`actions.ts`** (server actions, `revalidatePath`):
  - `createQuote(payload)` — calcula `year` desde `issue_date`, llama `next_quote_seq`, calcula `number` (con `companyPrefix` + `formatQuoteNumber`) y totales (con las funciones puras); inserta `quotes` y luego sus `quote_items` con `line_subtotal`/`position`. Si la inserción de items falla, borra la cotización (compensación). Devuelve `{ id }` o `{ error }`.
  - `updateQuote(id, payload)` — recalcula totales, actualiza la cabecera, **reemplaza** los items (borra los existentes e inserta los nuevos). No cambia `number`/`seq`/`year`. Devuelve `{ ok }` o `{ error }`.
  - `setQuoteStatus(id, status)` — cambia el estado. Devuelve `{ ok }` o `{ error }`.

  El `payload` del editor incluye: `company_id`, `customer_id`, `issue_date`, `valid_until`,
  `tax_rate`, `notes`, y un array de líneas `{ product_id|null, description, quantity, unit_price, discount_pct }`.

## 7. Pantallas

1. **Lista de cotizaciones** (`/cotizaciones`)
   - Tarjetas de resumen: nº total, nº aceptadas, importe aceptado (€).
   - Tabla con buscador (número/cliente) y filtros por estado y cliente. Respeta empresa activa.
   - Columnas: Número, Cliente, Fecha, Estado (badge por color), Total. Enlace a la ficha.
   - Botón "Nueva cotización".
2. **Editor** (`/cotizaciones/nueva` y edición reutiliza el componente)
   - Cabecera: cliente (select de clientes CRM de la empresa), fecha, validez, IVA % (default 21), notas.
   - **Líneas dinámicas** (componente cliente, estado en memoria): añadir línea eligiendo
     un producto de Inventario (prerellena descripción + `unit_price` desde `product.price`,
     editables) o línea libre (descripción + precio a mano); campos cantidad, precio, descuento %.
     Botón eliminar línea.
   - **Totales en vivo** (base, IVA, total) usando las funciones puras.
   - Guardar → `createQuote`/`updateQuote`.
3. **Ficha** (`/cotizaciones/[id]`)
   - Cabecera (número, cliente, fechas, estado badge — "vencida" si `isExpired`).
   - Tabla de líneas + totales.
   - Acciones de estado (`status-actions`): enviar, aceptar, rechazar, marcar caducada.
   - Enlaces: editar e imprimir.
4. **Vista imprimible** (`/cotizaciones/[id]/imprimir`)
   - Layout limpio **sin** sidebar/app shell (página propia), con nombre de empresa, datos
     de cliente, número, fechas, líneas, totales y notas. Pensada para "Imprimir" → "Guardar como PDF".

+ entrada `{ href: "/cotizaciones", label: "Cotizaciones", icon: FileText }` en
`src/components/app-shell/sidebar.tsx`.

## 8. Estructura de archivos

```
src/lib/cotizaciones/
  quote.ts            # lógica pura (lineSubtotal, quoteTotals, companyPrefix, formatQuoteNumber, statusLabel, isExpired)
  quote.test.ts       # tests (TDD)
  queries.ts          # listQuotes, getQuote, customersForCompany, productsForCompany, quotesSummary
  actions.ts          # createQuote, updateQuote, setQuoteStatus
src/app/(app)/cotizaciones/
  page.tsx            # lista + resumen
  nueva/page.tsx      # alta (editor)
  [id]/page.tsx       # ficha + acciones de estado
  [id]/editar/page.tsx# edición (editor)
  [id]/imprimir/page.tsx # vista imprimible (sin shell)
src/components/cotizaciones/
  summary-cards.tsx
  quote-table.tsx
  quote-editor.tsx    # cabecera del formulario; orquesta line-items-editor + totales
  line-items-editor.tsx # líneas dinámicas (producto/libre, cantidad, precio, descuento)
  quote-view.tsx      # render de cabecera+líneas+totales (reutilizado por ficha e imprimir)
  status-actions.tsx  # botones de cambio de estado
supabase/migrations/
  0009_quotes.sql
  0010_quotes_rls.sql
```

## 9. Criterios de éxito

- Creo una cotización para un cliente de la empresa activa, añado líneas (de inventario y libres) con descuentos %, y los totales (base/IVA/total) cuadran con la lógica pura.
- El número se asigna correlativo por empresa y año (`JS-2026-0001`) y es único por empresa.
- Cambio el estado (enviada/aceptada/rechazada/caducada) y se refleja en lista y ficha.
- Abro la vista imprimible y sale limpia (sin sidebar) para "Guardar como PDF".
- RLS aísla cotizaciones por empresa (verificable como owner cambiando de empresa).
- La lógica pura (subtotales, totales, número, prefijo, estado, expiración) tiene tests verdes.
- `npm run build` y `npm test` limpios.

## 10. Fuera de alcance (explícito)

- Generación de PDF server-side y envío por email.
- Conversión automática a venta / descuento de stock (eso es el módulo **Ventas**, reutilizará `quote_id`).
- IVA por línea (un único tipo por cotización).
- Multi-moneda (solo EUR).
- Caducidad automática por cron: el estado `caducada` se marca a mano; la ficha solo muestra "vencida" visualmente si pasó `valid_until`.
- Plantillas/branding avanzado de la vista imprimible (layout limpio funcional, sin diseñador de plantillas).
