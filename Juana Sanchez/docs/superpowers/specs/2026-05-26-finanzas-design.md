# Módulo Finanzas / Revenue — Panel de Control Grupo Juana Sánchez

**Fecha:** 2026-05-26
**Estado:** Diseño aprobado · pendiente de plan de implementación
**Módulo nº:** 5 (tras Inventario, CRM, Cotizaciones, Ventas)
**Alcance:** Módulo Finanzas completo de punta a punta, sobre los cimientos y los módulos
existentes. No reconstruye nada de auth, multi-empresa, app shell, selector de empresa,
RLS, PWA ni el sistema de diseño Atelier (ya en `main`).

---

## 1. Contexto y objetivo

El Panel tiene cimientos + 4 módulos en producción (Inventario, CRM, Cotizaciones, Ventas)
y un **sistema de diseño "Atelier" ya fusionado en `main`** (tokens de marca crema/tinta,
Fraunces, acento por empresa, dark mode, toasts sonner, primitivas en `src/components/atelier/`).

Finanzas es el **módulo nº4 del ROADMAP**. **Depende de:** Ventas (ingresos) + Inventario
(costes). Propósito: la visión de dinero del grupo y por empresa — ingresos, gastos y margen.

## 2. Stack y patrón a reutilizar (NO se reconstruye)

- **Next.js 15 (App Router, TS) + Supabase + Vercel + shadcn/ui + Atelier**.
- **Patrón de módulo** (Inventario/CRM/Cotizaciones/Ventas): `src/lib/<modulo>/{queries,actions}.ts`
  + lógica pura testeable; rutas en `src/app/(app)/<modulo>/`; componentes en
  `src/components/<modulo>/`; migraciones versionadas (siguientes: `0014`, `0015`); RLS por
  `company_id` con `accessible_company_ids()`; tipos en `src/types/db.ts`; lecturas filtradas
  por `getActiveCompany()`; entrada en el `Sidebar`.
- **Deploy:** integrar por rama `main`; antes de empujar, `git pull` (otra terminal trabaja en
  paralelo en `frontend-atelier`). Push a `main` redespliega en Vercel.

## 3. Decisiones tomadas (brainstorming 2026-05-26)

| Decisión | Elección |
|---|---|
| Ingresos | **Ventas pagadas (automático)** + **ingresos manuales** (tabla `incomes`). |
| Categorías de gasto | **Lista fija** (enum): Mercancía, Marketing, Personal, Alquiler, Suministros, Logística, Comisiones, Impuestos, Otros. |
| Recurrentes | **Flag** `recurring` informativo/filtrable. Sin generación automática. |
| Conciliación | **Manual**. Sin importar extractos. |
| Márgenes | **Por empresa/periodo en el resumen**: ingresos − COGS − gastos. Sin desglose por producto (eso es Dashboards). |
| Moneda | **EUR** única. |

## 4. Modelo de datos

Migraciones `0014_finances.sql` (esquema) y `0015_finances_rls.sql` (RLS). Última migración
existente: `0013_sales_rls`.

### 4.1 Enum

```sql
create type public.expense_category as enum
  ('mercancia', 'marketing', 'personal', 'alquiler', 'suministros',
   'logistica', 'comisiones', 'impuestos', 'otros');
```

### 4.2 Tablas

**`expenses`**
- `id` uuid pk default `gen_random_uuid()`
- `company_id` uuid not null → `companies(id)` on delete cascade
- `category` `expense_category` not null
- `supplier` text (nullable)
- `amount` numeric(12,2) not null default 0
- `expense_date` date not null default `current_date`
- `recurring` boolean not null default false
- `note` text
- `created_by` uuid → `profiles(id)`
- `created_at` / `updated_at` timestamptz not null default `now()`

**`incomes`** (ingresos manuales no-venta)
- `id` uuid pk default `gen_random_uuid()`
- `company_id` uuid not null → `companies(id)` on delete cascade
- `concept` text not null
- `amount` numeric(12,2) not null default 0
- `income_date` date not null default `current_date`
- `note` text
- `created_by` uuid → `profiles(id)`
- `created_at` / `updated_at` timestamptz not null default `now()`

Índices: `expenses(company_id)`, `expenses(expense_date)`, `incomes(company_id)`, `incomes(income_date)`.

**Ingresos de ventas y COGS:** NO se almacenan — se derivan en lectura de `sales` (estado
`pagada`) y `sale_items` × `products.cost`. Sin tabla `revenue` ni duplicación.

### 4.3 RLS (`0015_finances_rls.sql`)

```sql
alter table public.expenses enable row level security;
alter table public.incomes  enable row level security;

create policy "expenses por empresa accesible" on public.expenses for all to authenticated
  using (company_id in (select public.accessible_company_ids()))
  with check (company_id in (select public.accessible_company_ids()));

create policy "incomes por empresa accesible" on public.incomes for all to authenticated
  using (company_id in (select public.accessible_company_ids()))
  with check (company_id in (select public.accessible_company_ids()));
```

## 5. Lógica pura (TDD) — `src/lib/finanzas/finance.ts`

- `expenseCategoryLabel(cat)` → Mercancía / Marketing / Personal / Alquiler / Suministros / Logística / Comisiones / Impuestos / Otros.
- `financeSummary({ salesRevenue, manualIncome, cogs, expenses })` → `{ ingresos, gastos, resultado, margen, margenPct }`:
  - `ingresos = salesRevenue + manualIncome`
  - `gastos = expenses`
  - `resultado = ingresos − gastos`
  - `margen = ingresos − cogs − gastos`
  - `margenPct = ingresos > 0 ? round2(margen / ingresos * 100) : 0`
  - todo redondeado a 2 decimales.
- Tipo `ExpenseCategory`. Tests escritos primero (como en módulos previos).

**Criterio de importes (vista de gestión, no fiscal):** ingresos de ventas = `sales.total`
(importe total cobrado, IVA incluido); gastos = importe registrado por el dueño tal cual.
Es una visión de caja/gestión coherente entre sí, no contabilidad fiscal. El desglose y la
liquidación de IVA quedan **fuera de alcance** (futuro módulo fiscal/Dashboards).

## 6. Capa de datos

- **`queries.ts`** (filtran por empresa activa + año):
  - `listExpenses(companyFilter, year)` — gastos del año, orden `expense_date` desc.
  - `listIncomes(companyFilter, year)` — ingresos manuales del año, orden `income_date` desc.
  - `getExpense(id)`.
  - `financeOverview(companyFilter, year)` — agrega por mes (1-12): ventas pagadas (suma de `sales.total` con `status='pagada'`), COGS (suma de `sale_items.line` coste = `quantity × products.cost` de las ventas pagadas), ingresos manuales (`incomes`), gastos (`expenses`); aplica `financeSummary` por mes y al total del año. Devuelve `{ year, months: [...12], totals }`.
- **`actions.ts`** (server actions, `revalidatePath`):
  - `createExpense(formData)`, `updateExpense(id, formData)`, `deleteExpense(id)`.
  - `createIncome(formData)`, `deleteIncome(id)`.

  Filtran/insertan por `company_id` de la empresa activa; `created_by` = usuario.

## 7. Pantallas

1. **Resumen** (`/finanzas`) — KPIs del año (Ingresos, Gastos, Resultado, Margen %) para la
   empresa activa, con **selector de año**; tabla **mes a mes** (Ingresos / COGS / Gastos /
   Resultado). Respeta la empresa activa (y "Todas" = agregado del grupo).
2. **Gastos** (`/finanzas/gastos`) — lista con filtros (categoría, recurrente, año) + alta
   (`/finanzas/gastos/nuevo`) y edición (`/finanzas/gastos/[id]/editar`) y borrado.
3. **Ingresos manuales** (`/finanzas/ingresos`) — lista del año + alta y borrado (formulario
   inline o página simple).

+ entrada `{ href: "/finanzas", label: "Finanzas", icon: Wallet }` en `src/components/app-shell/sidebar.tsx`
(cambio mínimo: un símbolo de import + una entrada NAV, para facilitar el merge con `frontend-atelier`).

## 8. UI — Atelier-native

Como el sistema **Atelier ya está en `main`**, Finanzas se construye con su lenguaje visual
desde el inicio (no genera deuda de armonización):
- Reutiliza las **primitivas** `src/components/atelier/*` (p. ej. `KPI`/`Money`) donde encajen
  para los KPIs y los importes. (Se consumen primitivas ya fusionadas; **no se editan**.)
- Para el resto, usa los **tokens** estables de `globals.css` (`text-ink-*`, `bg-surface`,
  `border-line`, `font-display`, señales `--good`/`--bad`, `tabular-nums`).
- Formularios con toasts (sonner) y skeleton loaders por ruta, coherente con los módulos ya
  rediseñados. (Las APIs exactas de las primitivas se verifican al escribir el plan; si alguna
  no encaja limpio, se usan los tokens directamente.)

## 9. Estructura de archivos

```
src/lib/finanzas/{finance.ts, finance.test.ts, queries.ts, actions.ts}
src/app/(app)/finanzas/
  page.tsx                      # resumen (KPIs + tabla mes a mes + selector de año)
  gastos/page.tsx               # lista de gastos + filtros
  gastos/nuevo/page.tsx         # alta de gasto
  gastos/[id]/editar/page.tsx   # edición de gasto
  ingresos/page.tsx             # lista + alta de ingresos manuales
src/components/finanzas/{overview, expense-table, expense-form, income-table, income-form}.tsx
supabase/migrations/{0014_finances.sql, 0015_finances_rls.sql}
```

## 10. Criterios de éxito

- Registro gastos (categoría, proveedor, recurrente) e ingresos manuales por empresa; aparecen en sus listas y en el resumen.
- El resumen muestra, por empresa y año (mes a mes y total): ingresos (ventas pagadas + manuales), COGS, gastos y resultado/margen, cuadrando con la lógica pura.
- Las ventas en estado `pagada` se reflejan como ingreso automáticamente (bucle con Ventas); el COGS usa `products.cost`.
- El selector de año cambia el periodo; "Todas las empresas" agrega el grupo.
- RLS aísla por empresa; la lógica pura (labels, `financeSummary`) tiene tests verdes; `npm run build` y `npm test` limpios.
- La UI usa el lenguaje Atelier (coherente con el panel ya rediseñado).

## 11. Fuera de alcance

- Conciliación bancaria / importación de extractos.
- Generación automática de gastos recurrentes (cron).
- Margen por producto / SKU y gráficos ricos (Dashboards/BI, módulo siguiente).
- Pagos parciales, presupuestos/forecast, multi-moneda.
- Edición de ingresos manuales (solo alta + borrado en esta entrega; corregir = borrar + crear).
