# Módulo Automatizaciones (motor de alertas) — Panel de Control Grupo Juana Sánchez

**Fecha:** 2026-05-26
**Estado:** Diseño aprobado · pendiente de plan de implementación
**Módulo nº:** 10 (ROADMAP "Automatizaciones IA"; este spec cubre el primer subsistema:
motor de alertas determinista. El segundo, "IA Tools" `/ia`, queda para otro ciclo.)
**Alcance:** Panel `/automatizaciones` que vigila los datos del panel y surge alertas
accionables en vivo (sin IA en runtime, sin cron, sin persistir alertas). Catálogo fijo de
reglas con umbrales configurables. No toca otros módulos ni el `sidebar.tsx`.

---

## 1. Contexto y objetivo

El Panel tiene cimientos + 9 módulos en producción (CRM, Cotizaciones, Ventas, Finanzas,
Analítica, Tareas, Comunicación, 2º Cerebro + los visuales de la otra terminal) y el sistema
Atelier. El módulo **Automatizaciones** es la primera mitad del ítem "Automatizaciones IA"
del ROADMAP: un **motor de alertas determinista** que evita revisar módulo por módulo.

**Decisión de descomposición:** "Automatizaciones IA" son dos subsistemas. Este spec cubre
**solo el motor de alertas** (determinista, sin IA). El asistente/herramientas IA (`/ia`)
tendrá su propio spec más adelante (requiere AI SDK + API key, fuera de alcance aquí).

**Objetivo:** ver de un vistazo qué requiere atención (stock, cobros, cotizaciones, tareas,
clientas) con reglas configurables por umbral, cada alerta enlazada a su módulo.

## 2. Stack y patrón a reutilizar (NO se reconstruye)

- **Next.js 16 + Supabase + Vercel + shadcn/ui + Atelier**. Sin nuevas dependencias, sin
  secretos nuevos, sin cron, sin edge functions, sin IA en runtime.
- Patrón de módulo: `src/lib/automatizaciones/{rules,rules.test,queries,actions}.ts`; rutas
  `src/app/(app)/automatizaciones/`; componentes `src/components/automatizaciones/`;
  migraciones versionadas (`0028`, `0029`); tipos en `src/types/db.ts`; lecturas filtradas
  por `getActiveCompany()`.
- **Atelier-native:** tokens (`ink`/`line`/`paper`/`elevated`), pills de severidad, sonner.
- **Deploy:** integrar por `main` con `git pull` antes de empujar (otra terminal en paralelo).
- **NO tocar `sidebar.tsx`** — la entrada `/automatizaciones` la enciende la terminal de diseño.

## 3. Decisiones tomadas (brainstorming 2026-05-26)

| Decisión | Elección |
|---|---|
| Subsistema | **Motor de alertas determinista** (no constructor genérico, no IA en runtime). |
| Configurabilidad | **Catálogo fijo** de reglas; el usuario activa/desactiva y ajusta umbral. |
| Estado de alertas | **En vivo, solo lectura** + enlace al módulo. No se persisten ni se descartan. |
| Config | Persistida **global del owner** (sin `company_id`), RLS `is_owner()`. |
| Datos vigilados | Por empresa activa (`getActiveCompany()` + RLS), como el resto. |
| Ejecución | Al vuelo en cada visita (sin cron / background). |

## 4. Catálogo de reglas (v1)

| `rule_key` | Detecta | Umbral (def.) | Severidad | Enlace |
|---|---|---|---|---|
| `stock_bajo` | productos con `stock ≤ low_stock_threshold` | — | alta | `/inventario` |
| `cotizaciones_por_caducar` | cotizaciones `borrador`/`enviada` con `valid_until ≤ hoy + N` (incluye ya vencidas) | N días (7) | media | detalle de cotización |
| `ventas_pendientes_cobro` | ventas `status='pendiente'` con `sale_date` anterior a hoy − N | N días (15) | alta | detalle de venta |
| `tareas_vencidas` | tareas `due_date < hoy` y `status ≠ 'hecha'` | — | media | `/tareas` |
| `clientas_inactivas` | clientas `status='active'` sin interacción ni venta desde hace > N días | N días (90) | baja | detalle/índice CRM |

Notas: las reglas operan **solo sobre tablas propias/núcleo** (`products`/`product_stock`,
`quotes`, `sales`, `tasks`, `customers`/`interactions`). No leen tablas de la otra terminal
(Manos/Círculo/Taller/Boutiques).

## 5. Modelo de datos

Migraciones `0028_automation_rules.sql` (tabla) y `0029_automation_rules_rls.sql` (RLS).
Última migración previa: `0027_wholesale_accounts` (otra terminal). Siguiente libre: `0028`.

### 5.1 Tabla `automation_rules` (config, global del owner)

- `rule_key` text **primary key** (uno de los `rule_key` del catálogo)
- `enabled` boolean not null default `true`
- `threshold` integer (nullable; solo aplica a reglas con umbral)
- `updated_at` timestamptz not null default `now()`

Sin `company_id`: es preferencia operativa del owner, no dato de empresa. Si una regla no
tiene fila, se usan los defaults del catálogo en código (regla activa, umbral por defecto).

### 5.2 RLS (`0029_automation_rules_rls.sql`)

```sql
alter table public.automation_rules enable row level security;

create policy "automation_rules solo owner" on public.automation_rules
  for all to authenticated
  using (public.is_owner())
  with check (public.is_owner());
```

(`is_owner()` ya existe en el esquema.) Los **datos vigilados** siguen protegidos por sus
propias RLS por empresa; la app además filtra por la empresa activa.

## 6. Lógica pura (TDD) — `src/lib/automatizaciones/rules.ts`

- **Catálogo** `RULES`: array de `{ key, label, category, hasThreshold, defaultThreshold, severity }`
  para las 5 reglas.
- `daysUntil(dateISO: string, today: Date): number` — días desde hoy hasta la fecha (negativo si pasó).
- `daysSince(dateISO: string, today: Date): number` — días transcurridos desde la fecha.
- `effectiveThreshold(config: Record<string, {enabled:boolean; threshold:number|null}>, key: string): number`
  — devuelve el umbral configurado o el `defaultThreshold` del catálogo.
- Filtros puros sobre filas ya cargadas (devuelven los ítems que disparan alerta):
  - `productsLowStock(rows: {id;name;stock;threshold}[]): AlertItem[]`
  - `quotesExpiring(rows: {id;number;valid_until;status}[], days, today): AlertItem[]`
  - `salesOverdue(rows: {id;number;sale_date;status}[], days, today): AlertItem[]`
  - `tasksOverdue(rows: {id;title;due_date;status}[], today): AlertItem[]`
  - `customersInactive(rows: {id;name;status}[], lastActivity: Record<string,string|null>, days, today): AlertItem[]`
- Tipo `AlertItem = { id: string; label: string; href: string; meta?: string }`.
- Tests escritos primero (Vitest), como en módulos previos.

## 7. Capa de datos

- **`queries.ts`** (filtran por empresa activa salvo config):
  - `getRulesConfig(): Promise<Record<string, {enabled:boolean; threshold:number|null}>>`
    — lee `automation_rules`.
  - `evaluateAlerts(companyFilter): Promise<AlertResult[]>` — para cada regla **activa**:
    hace el fetch filtrado por empresa + aplica el filtro puro correspondiente; devuelve
    `AlertResult { ruleKey, label, severity, count, items }` solo de reglas con `count > 0`.
    `clientas_inactivas` calcula `lastActivity` por clienta a partir de `interactions`
    (`occurred_at`) y `sales` (`sale_date`).
- **`actions.ts`** (server action, `revalidatePath`):
  - `updateRuleConfig(ruleKey, formData)` — upsert de `enabled` (+ `threshold` si aplica),
    `updated_at = now()`. Protegido por RLS owner-only.

## 8. Pantallas (Atelier-native)

1. **`/automatizaciones`** — cabecera (nº total de alertas activas) + botón "Ajustes".
   Tarjetas por regla con alerta: label, contador, pill de severidad y los primeros ítems
   (cada uno enlazado a su módulo). Estado "Todo en orden" si no hay alertas. Lectura por
   empresa activa ("Todas" = todas las accesibles).
2. **`/automatizaciones/ajustes`** — una fila por regla del catálogo: switch activar/desactivar
   + input de umbral (solo en reglas con umbral). Guarda vía `updateRuleConfig`. Solo owner.

## 9. Estructura de archivos

```
src/lib/automatizaciones/{rules.ts, rules.test.ts, queries.ts, actions.ts}
src/app/(app)/automatizaciones/{page.tsx, ajustes/page.tsx}
src/components/automatizaciones/
  alert-card.tsx        # tarjeta de una regla con sus ítems (server-friendly)
  alert-list.tsx        # lista de tarjetas + estado "todo en orden"
  rule-settings-form.tsx# client: switch + umbral por regla (toast)
supabase/migrations/{0028_automation_rules.sql, 0029_automation_rules_rls.sql}
```

## 10. Criterios de éxito

- En `/automatizaciones` veo las alertas activas de la empresa seleccionada, agrupadas por
  regla, con contador y enlaces a cada ítem; si no hay nada, "Todo en orden".
- En `/automatizaciones/ajustes` desactivo una regla o cambio un umbral y la lista cambia en
  consecuencia tras refresh.
- La config es del owner (RLS `is_owner()`); los datos vigilados se aíslan por empresa (RLS).
- La lógica pura (`daysUntil`, `daysSince`, `effectiveThreshold`, filtros de reglas) tiene
  tests verdes; `npm run build` y `npm test` limpios.
- UI en lenguaje Atelier; no toca `sidebar.tsx` ni archivos de otros módulos.

## 11. Fuera de alcance

- IA en runtime / asistente / generadores (módulo `/ia`, otro ciclo).
- Ejecución en segundo plano / cron / notificaciones (email/push).
- Persistir alertas, descartarlas o posponerlas (snooze).
- Acción "crear tarea" desde una alerta.
- Constructor genérico de reglas (entidad/campo/condición definidos por el usuario).
- Reglas sobre tablas de la otra terminal (Manos/Círculo/Taller/Boutiques).
