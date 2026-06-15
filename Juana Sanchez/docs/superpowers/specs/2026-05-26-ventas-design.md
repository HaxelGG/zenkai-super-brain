# Módulo Ventas — Panel de Control Grupo Juana Sánchez

**Fecha:** 2026-05-26
**Estado:** Diseño aprobado · pendiente de plan de implementación
**Módulo nº:** 4 (tras Inventario, CRM, Cotizaciones)
**Alcance:** Módulo Ventas completo de punta a punta, sobre los cimientos y los módulos
existentes. No reconstruye nada de auth, multi-empresa, app shell, selector de empresa,
RLS ni PWA.

---

## 1. Contexto y objetivo

El Panel ya tiene cimientos (auth, multi-empresa por `company_id`, RLS con helpers
`is_owner()` / `accessible_company_ids()`, app shell, selector de empresa, PWA) y tres
módulos completos en producción: **Inventario** (`products`, `stock_movements`), **CRM**
(`customers`) y **Cotizaciones** (`quotes`, `quote_items`). Ver specs/plans en `docs/superpowers/`.

Ventas es el **módulo nº4** del ROADMAP. **Depende de:** Cotizaciones (conversión) +
Inventario (descuento de stock) + CRM (cliente). Su propósito es registrar ventas reales
que **descuentan stock automáticamente**, cerrando el bucle con Inventario.

## 2. Stack y patrón a reutilizar (NO se reconstruye)

- **Next.js 15 (App Router, TS) + Supabase + Vercel + shadcn/ui**.
- **Patrón Inventario/CRM/Cotizaciones** replicado 1:1: `src/lib/<modulo>/{queries,actions}.ts`
  + lógica pura testeable; rutas en `src/app/(app)/<modulo>/`; componentes en
  `src/components/<modulo>/`; migraciones versionadas (siguientes: `0012`, `0013`); RLS por
  `company_id` con `accessible_company_ids()`; tipos en `src/types/db.ts`; lecturas
  filtradas por `getActiveCompany()`; entrada en el `Sidebar`.
- **Deploy:** integrar por rama `main`; push a `main` redespliega en Vercel
  (`HaxelGG/juana-sanchez-panel`).
- **Numeración atómica:** mismo mecanismo que Cotizaciones (tabla de contadores + RPC
  `security definer` con guard de empresa).

## 3. Decisiones tomadas (brainstorming 2026-05-26)

| Decisión | Elección |
|---|---|
| Descuento de stock | **Al crear la venta**: `stock_movements` tipo `out` por cada línea con producto. **Cancelar** crea `in` (reverso). Líneas libres (sin producto) no mueven stock. |
| Origen | **Manual** en el panel, o convirtiendo una cotización. Sin TPV/Shopify. |
| Pago | **Estado** (`pendiente`/`pagada`/`entregada`/`cancelada`) + **método de pago** (`efectivo`/`tarjeta`/`transferencia`/`bizum`/`otro`) + **canal** (`tienda`/`online`/`feria`). |
| Devoluciones | **Solo cancelación de venta entera** (reingresa todo el stock). Sin devolución parcial por línea. |
| Cotización→Venta | Botón en cotizaciones **aceptadas** → venta nueva precargada (cliente, líneas, IVA, totales) como copia editable, guardando `quote_id`. |
| Edición | Las líneas **no son editables** tras crear la venta (sí estado/método de pago/notas). |

## 4. Modelo de datos

Migraciones `0012_sales.sql` (esquema + RPC) y `0013_sales_rls.sql` (RLS). Última migración
existente: `0011_quotes_hardening`.

### 4.1 Enums

```sql
create type public.sale_status   as enum ('pendiente', 'pagada', 'entregada', 'cancelada');
create type public.payment_method as enum ('efectivo', 'tarjeta', 'transferencia', 'bizum', 'otro');
create type public.sale_channel   as enum ('tienda', 'online', 'feria');
```

### 4.2 Tablas

**`sales`**
- `id` uuid pk default `gen_random_uuid()`
- `company_id` uuid not null → `companies(id)` on delete cascade
- `customer_id` uuid not null → `customers(id)` on delete restrict
- `quote_id` uuid → `quotes(id)` on delete set null (opcional: cotización de origen)
- `number` text not null — inmutable, p. ej. `"JS-V-2026-0001"`
- `seq` integer not null, `year` integer not null
- `status` `sale_status` not null default `'pendiente'`
- `sale_date` date not null default `current_date`
- `channel` `sale_channel`
- `payment_method` `payment_method`
- `tax_rate` numeric(5,2) not null default 21
- `notes` text
- `subtotal` numeric(12,2) not null default 0
- `tax_amount` numeric(12,2) not null default 0
- `total` numeric(12,2) not null default 0
- `created_by` uuid → `profiles(id)`
- `created_at` / `updated_at` timestamptz not null default `now()`
- `unique (company_id, number)`

**`sale_items`**
- `id` uuid pk default `gen_random_uuid()`
- `sale_id` uuid not null → `sales(id)` on delete cascade
- `product_id` uuid → `products(id)` on delete set null (nullable: línea libre)
- `description` text not null
- `quantity` numeric(12,2) not null default 1
- `unit_price` numeric(12,2) not null default 0
- `discount_pct` numeric(5,2) not null default 0
- `line_subtotal` numeric(12,2) not null default 0
- `position` integer not null default 0

**`sale_counters`**: `company_id` → companies cascade, `year` int, `last_seq` int default 0, `primary key (company_id, year)`.

Índices: `sales(company_id)`, `sales(customer_id)`, `sales(quote_id)`, `sale_items(sale_id)`.

### 4.3 RPC y trigger (en `0012_sales.sql`)

```sql
create function public.next_sale_seq(p_company_id uuid, p_year int)
returns int language plpgsql security definer set search_path = public as $$
declare v_seq int;
begin
  if p_company_id not in (select public.accessible_company_ids()) then
    raise exception 'permiso denegado para la empresa %', p_company_id;
  end if;
  insert into public.sale_counters (company_id, year, last_seq)
    values (p_company_id, p_year, 1)
  on conflict (company_id, year)
    do update set last_seq = public.sale_counters.last_seq + 1
  returning last_seq into v_seq;
  return v_seq;
end; $$;

create function public.sales_check_customer_company()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.customers where id = new.customer_id and company_id = new.company_id) then
    raise exception 'El cliente % no pertenece a la empresa %', new.customer_id, new.company_id;
  end if;
  return new;
end; $$;

create trigger sales_customer_company_check
  before insert or update of customer_id, company_id on public.sales
  for each row execute function public.sales_check_customer_company();
```

### 4.4 RLS (`0013_sales_rls.sql`)

```sql
alter table public.sales         enable row level security;
alter table public.sale_items    enable row level security;
alter table public.sale_counters enable row level security;  -- sin políticas: solo el RPC definer

create policy "sales por empresa accesible" on public.sales for all to authenticated
  using (company_id in (select public.accessible_company_ids()))
  with check (company_id in (select public.accessible_company_ids()));

create policy "sale_items por venta accesible" on public.sale_items for all to authenticated
  using (sale_id in (select id from public.sales where company_id in (select public.accessible_company_ids())))
  with check (sale_id in (select id from public.sales where company_id in (select public.accessible_company_ids())));
```

## 5. El bucle con Inventario

- **`createSale`** inserta venta + líneas y luego, por cada línea **con `product_id`**, un
  `stock_movements` con `type='out'`, `quantity` = cantidad de la línea, `reason='venta'`,
  `note` con el nº de venta, `created_by` = usuario. Reutiliza la tabla `stock_movements`
  de Inventario **sin modificarla**.
- **`cancelSale`** cambia el estado a `cancelada` (terminal) y, por cada línea con producto,
  inserta un `stock_movements` `type='in'`, `reason='cancelación de venta'`, nota con el nº.
  **Guard:** solo revierte si el estado actual no era ya `cancelada` (evita doble reverso).
- El stock se sigue derivando de la vista `product_stock` (suma de movimientos), como en
  Inventario. No se edita ningún número de stock directamente.

## 6. Lógica pura (TDD) — `src/lib/ventas/sale.ts`

- **Reutiliza** `lineSubtotal` y `quoteTotals` de `@/lib/cotizaciones/quote` (Ventas depende
  de Cotizaciones por ROADMAP) y `companyPrefix` para el prefijo de empresa.
- Propias (con tests primero): `saleStatusLabel(status)` (Pendiente/Pagada/Entregada/Cancelada),
  `paymentMethodLabel(m)` (Efectivo/Tarjeta/Transferencia/Bizum/Otro),
  `channelLabel(c)` (Tienda/Online/Feria),
  `formatSaleNumber(prefix, year, seq)` → `` `${prefix}-V-${year}-${seq padStart 4}` `` (la `V` distingue de cotizaciones).
- Tipo `SaleStatus = 'pendiente'|'pagada'|'entregada'|'cancelada'`.

## 7. Capa de datos

- **`queries.ts`** (filtran por empresa activa):
  - `listSales(companyFilter)` — ventas con `number`, cliente, `sale_date`, `status`, `channel`, `total`, orden `sale_date` desc / `seq` desc.
  - `getSale(id)` — cabecera + líneas (`sale_items` por `position`) + cliente + empresa + (si hay) número de cotización origen.
  - `salesSummary(companyFilter)` — `{ totalSales (no canceladas), totalAmount (suma no canceladas), paidAmount (suma pagadas) }`.
  - `customersForCompany(companyId)` / `productsForCompany(companyId)` — reutilizadas de Cotizaciones (`@/lib/cotizaciones/queries`) o reexportadas.
  - `getQuoteForConversion(quoteId)` — cliente + líneas + tax_rate + notas de una cotización **aceptada**, para precargar el editor de venta.
- **`actions.ts`** (server actions, `revalidatePath`):
  - `createSale(input)` — calcula `year`, llama `next_sale_seq`, número (`companyPrefix`+`formatSaleNumber`), totales (`quoteTotals`); inserta `sales` + `sale_items`; crea los `stock_movements` `out`; en fallo de líneas/movimientos, compensa borrando la venta. Devuelve `{ id }` o `{ error }`. Acepta `quote_id` opcional.
  - `setSaleStatus(id, status)` — cambia estado entre `pendiente`/`pagada`/`entregada` (sin efecto en stock). No permite poner `cancelada` por aquí (eso es `cancelSale`).
  - `cancelSale(id)` — pone `cancelada` y crea los `in` de reverso (con guard). Devuelve `{ ok }` o `{ error }`.

  `SaleInput`: `company_id`, `customer_id`, `quote_id|null`, `sale_date`, `channel`, `payment_method|null`, `tax_rate`, `notes|null`, `lines: { product_id|null, description, quantity, unit_price, discount_pct }[]`.

## 8. Pantallas

1. **Lista** (`/ventas`) — tarjetas (nº ventas, importe vendido [no canceladas], importe cobrado [pagadas]) + tabla con buscador (nº/cliente) y filtros (estado, canal). Badge de estado por color (cancelada distinguible). Respeta empresa activa. Botón "Nueva venta".
2. **Nueva venta** (`/ventas/nueva`) — editor (reutiliza `line-items-editor` de Cotizaciones): cliente, fecha, canal, método de pago, IVA %, notas, líneas dinámicas (producto de Inventario o libre, cantidad, precio, descuento %), totales en vivo. Acepta `?fromQuote=<id>`: precarga cliente + líneas + IVA + notas de la cotización aceptada y fija `quote_id`. Al guardar → `createSale` (descuenta stock).
3. **Ficha** (`/ventas/[id]`) — cabecera (nº, cliente, fecha, estado badge, canal, método de pago) + líneas + totales; acciones de estado (pendiente→pagada→entregada) y **Cancelar** (reingresa stock, terminal); si tiene origen, enlace a la cotización. Las líneas no se editan.
4. **Convertir cotización en venta** — botón "Convertir en venta" en la ficha de una cotización **aceptada** (`src/app/(app)/cotizaciones/[id]/page.tsx`) que enlaza a `/ventas/nueva?fromQuote=<id>`.

+ entrada `{ href: "/ventas", label: "Ventas", icon: ShoppingCart }` en `src/components/app-shell/sidebar.tsx`.

## 9. Estructura de archivos

```
src/lib/ventas/{sale.ts, sale.test.ts, queries.ts, actions.ts}
src/app/(app)/ventas/{page.tsx, nueva/page.tsx, [id]/page.tsx}
src/components/ventas/{summary-cards, sale-table, sale-editor, sale-view, sale-status-actions, sale-status-badge}.tsx
src/components/cotizaciones/line-items-editor.tsx   # reutilizado (no se modifica)
supabase/migrations/{0012_sales.sql, 0013_sales_rls.sql}
# modificación puntual: botón "Convertir en venta" en cotizaciones/[id]/page.tsx
```

## 10. Criterios de éxito

- Creo una venta (manual o desde cotización aceptada) para un cliente de la empresa activa; al guardarla, el stock de los productos baja (movimientos `out` visibles en la ficha del producto y en el resumen de Inventario).
- Cancelar la venta crea los `in` y el stock vuelve a su valor; cancelada es terminal y no duplica el reverso.
- El número es correlativo por empresa y año (`JS-V-2026-0001`) y único por empresa.
- Filtro por estado/canal y busco por nº/cliente; el resumen muestra importe vendido y cobrado.
- "Convertir en venta" desde una cotización aceptada precarga el editor y enlaza el `quote_id`.
- RLS aísla ventas por empresa; la lógica pura (labels, número) tiene tests verdes.
- `npm run build` y `npm test` limpios.

## 11. Fuera de alcance (explícito)

- Integración TPV/Shopify y conciliación.
- Edición de líneas tras crear la venta (corregir = cancelar + crear nueva).
- Devoluciones parciales por línea; notas de abono.
- Pagos parciales / múltiples pagos por venta.
- Reactivar una venta cancelada (estado terminal).
- Vista imprimible de la venta (se puede añadir luego, como en Cotizaciones).
- Informes por periodo / comparativas (eso es Dashboards/BI, módulo nº5).
