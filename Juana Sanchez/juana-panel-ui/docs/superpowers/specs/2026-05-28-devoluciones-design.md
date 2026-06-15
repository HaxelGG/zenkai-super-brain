# Spec — Devoluciones (returns / refunds)

**Fecha:** 2026-05-28
**Terminal:** Frontend/Atelier (`frontend-atelier`)
**Estado:** Diseño aprobado — pendiente de revisión del usuario.

## 1. Resumen

Módulo nuevo para registrar **devoluciones parciales** de ventas: elegir qué piezas y
cantidades se devuelven de una venta, **reponer stock** (opcional por línea), registrar el
**reembolso en dinero**, y reflejarlo de forma **consistente** en los ingresos (Finanzas,
Analítica, Boutiques) como **contra-venta**. Módulo aislado `lib/devoluciones` + páginas
`/devoluciones`. Toca Ventas solo con un botón de entrada. Requiere migraciones `0032`/`0033`.

Decisiones tomadas (brainstorming):
- **Alcance:** parcial por línea (no solo venta completa).
- **Stock:** reponer con opción a no (por línea; p. ej. prenda dañada).
- **Reembolso:** solo dinero (importe + método); sin vales/saldo a favor.
- **Integración financiera:** contra-venta consistente (no "ingreso negativo").

## 2. Infra existente (verificada)

- `sales(status: sale_status pendiente|pagada|entregada|cancelada, total bruto IVA incl.,
  tax_rate, customer_id, channel, company_id, number, sale_date)`.
- `sale_items(sale_id, product_id, description, quantity, unit_price, discount_pct, line_subtotal)`.
- `stock_movements(product_id, type in|out|adjust, quantity int, reason, note)`; vista
  `product_stock` (security_invoker) = Σ in − Σ out. La venta descuenta con `out`; `cancelSale` repone con `in`.
- Finanzas `financeOverview(companyFilter, year)`: `salesRevenue` = Σ `sales.total` (pagada/entregada)
  por mes; COGS = Σ `sale_items.quantity × products.cost` (coste **actual**, aproximación).
  `financeSummary`: ingresos = salesRevenue + manualIncome; gastos = expenses;
  resultado = ingresos − gastos; margen = ingresos − cogs − gastos.
- Analítica `monthlyFinance` y `revenueByCompany` **derivan de** `financeOverview`.
  `salesByChannel` consulta `sales` por su cuenta.
- Boutiques `mayoristaSales` + `aggregateMayorista` → facturación por clienta (canal mayorista, pagada/entregada).
- `accessible_company_ids()` / `is_owner()` para RLS. Numeración: `sale_counters` + RPC
  `next_sale_seq` (security definer, valida empresa accesible).

## 3. Modelo de datos (migración `0032_sale_returns.sql`)

Reutiliza el enum `payment_method` para `refund_method`.

- **`sale_returns`** (cabecera):
  - `id uuid pk default gen_random_uuid()`
  - `company_id uuid not null references companies(id) on delete cascade`
  - `sale_id uuid not null references sales(id) on delete restrict`
  - `customer_id uuid not null references customers(id) on delete restrict` (denormalizado, para netear Boutiques sin join extra)
  - `number text not null`, `seq integer not null`, `year integer not null`
  - `return_date date not null default current_date`
  - `refund_method payment_method` (nullable)
  - `refund_amount numeric(12,2) not null default 0` (**bruto, IVA incl.**)
  - `reason text`, `notes text`
  - `created_by uuid references profiles(id)`, `created_at/updated_at timestamptz not null default now()`
  - `unique(company_id, number)`; índices en `company_id`, `sale_id`, `customer_id`, `return_date`.
- **`sale_return_items`** (líneas):
  - `id uuid pk`, `return_id uuid not null references sale_returns(id) on delete cascade`
  - `sale_item_id uuid not null references sale_items(id) on delete restrict`
  - `product_id uuid references products(id) on delete set null`, `description text not null`
  - `quantity numeric(12,2) not null check (quantity > 0)`
  - `unit_gross numeric(12,2) not null default 0`, `line_refund numeric(12,2) not null default 0`
  - `restock boolean not null default true`, `position integer not null default 0`
  - índice en `return_id`.
- **`sale_return_counters`** `(company_id, year, last_seq)` + RPC **`next_return_seq(p_company_id, p_year)`**
  — espejo exacto de `sale_counters`/`next_sale_seq` (security definer, valida empresa accesible).
  Numeración `{PREFIJO}-D-{año}-0001` vía `formatReturnNumber`.
- **Sin trigger** de validación: la server action hereda `company_id` de la venta, valida el
  estado (`pagada/entregada`) y los importes; la RLS protege el alcance por empresa. (Más simple
  que un trigger y suficiente para un panel interno mono-empresa por sesión.)

## 4. RLS (migración `0033_sale_returns_rls.sql`)

- `enable row level security` en ambas tablas.
- `sale_returns`: policy `for all to authenticated`
  `using (company_id in (select accessible_company_ids()))`
  `with check (company_id in (select accessible_company_ids()))`.
- `sale_return_items`: policy por pertenencia al return accesible
  (`return_id in (select id from sale_returns where company_id in (select accessible_company_ids()))`),
  mismo patrón que `sale_items`.
- Crear/leer = cualquier usuario con acceso a la empresa (consistente con crear ventas; **no** solo-owner).

## 5. Contra-venta consistente (núcleo)

- La devolución **no cambia el estado de la venta** (sigue `pagada/entregada`); se compensa
  por separado y queda auditable.
- **Punto único `financeOverview`**: tras cargar `salesByMonth`, restar `monthlyReturns.refund[m]`;
  y a `cogsByMonth[m]`, restar el COGS de las líneas **repuestas** (`Σ quantity × products.cost`
  de `sale_return_items` con `restock=true`, agrupado por mes de `return_date`). Las líneas no
  repuestas (dañadas) **no** revierten COGS (la mercancía se pierde). → ingresos y margen netos correctos.
- **Analítica hereda gratis** vía `financeOverview` (`monthlyFinance`, `revenueByCompany`). Ajustes aparte:
  - `salesByChannel` (Analítica): restar devoluciones por canal (join return→`sale.channel`) en el periodo.
  - Boutiques (`aggregateMayorista`/queries): restar `refund_amount` por `customer_id` (solo ventas
    canal mayorista) → `facturacion` neta.
  - Ventas `salesSummary`: añadir `returnedAmount` (Σ refund del periodo cargado), netear `totalAmount`
    y exponer "devuelto" como dato propio.
- Helpers **puros** en `lib/devoluciones/aggregate.ts` (testeados):
  `sumReturnsByMonth(rows)`, `restockedCogsByMonth(rows)`, `sumReturnsByChannel(rows)`, `sumReturnsByCustomer(rows)`.

## 6. Lógica pura testeable (`lib/devoluciones/return.ts` + test)

- `unitGross(saleItem, taxRate)` = `(line_subtotal / quantity) × (1 + taxRate/100)`.
- `lineRefund(unitGross, qty)` = `round2(unitGross × qty)`.
- `returnTotals(lines)` = Σ `line_refund`.
- `remainingReturnable(saleItems, priorReturnItems)` → Map `sale_item_id → cantidad aún devolvible`
  (vendida − ya devuelta), nunca < 0.
- `formatReturnNumber(prefix, year, seq)` → `${prefix}-D-${year}-0001`.
- Etiquetas de motivo y método de reembolso.
- Tests: aritmética bruto/IVA, redondeo, "no devolver más de lo que queda", numeración.

## 7. Server actions (`lib/devoluciones/actions.ts`, "use server")

- **`createReturn(input)`**
  - input: `{ sale_id, return_date, refund_method, reason, notes, lines: [{ sale_item_id, quantity, restock }] }`.
  - Carga venta (status, tax_rate, company_id, customer_id, number) + `sale_items` + devoluciones previas.
    Valida: venta `pagada/entregada`; cada `qty > 0` y `≤ remaining`; al menos una línea.
  - **Recalcula importes en el servidor** desde `sale_items` (no confía en el cliente):
    `unit_gross`, `line_refund`, `refund_amount`.
  - Numera con `next_return_seq`. Inserta `sale_returns` + `sale_return_items`. **Rollback**
    (borra la cabecera) si fallan las líneas, como `createSale`.
  - Reposición: por líneas `restock=true` → insert `stock_movements` (`in`, reason `'devolución'`,
    note `Devolución {number}`). Rollback si falla (igual que `createSale`).
  - `revalidatePath`: `/devoluciones`, `/ventas/[sale_id]`, `/ventas`, `/inventario`, `/finanzas`, `/analitica`, `/boutiques`.
- **`deleteReturn(id)`** (borrado a un toque, con reverso)
  - Carga return + items + number. Por líneas `restock=true` → insert `stock_movements`
    (`out`, reason `'reverso devolución'`, note `Reverso devolución {number}`).
  - `delete sale_returns` (cascade borra items). El impacto en ingresos es **derivado** de
    `sale_returns` → se revierte solo. `revalidatePath` igual que arriba.

## 8. Lecturas (`lib/devoluciones/queries.ts`)

- `listReturns(companyFilter)` → `{ id, number, return_date, customer.name, sale.number, refund_amount, lines }[]`.
- `getReturn(id)` → cabecera + items (+ sale + customer).
- `getSaleForReturn(saleId)` → venta + items + `remaining` por item (con devoluciones previas), para el
  formulario; `null` / venta no `pagada/entregada` → la página muestra aviso.
- Fetchers de netteo (filas crudas para los helpers puros): `monthlyReturns(companyFilter, year)`,
  `returnsByChannel(companyFilter, year)`, `returnsByCustomerMayorista(companyFilter)`.

## 9. UI / pantallas

- **`/devoluciones/page.tsx`** (server): cabecera editorial + KPIs (total devuelto del periodo,
  nº devoluciones, % sobre ventas) + lista.
- **`/devoluciones/[id]/page.tsx`** (server): ficha (`DetailGrid`), líneas con badge
  "repuesto / no repuesto", enlace a la venta, `<DeleteButton>` (reverso).
- **`/devoluciones/nueva/page.tsx`** (server, lee `?venta=<id>`): carga venta vía `getSaleForReturn`;
  si es inválida o no devolvible → aviso. Render `return-form`.
- Componentes (`components/devoluciones/`):
  - `return-form.tsx` (client): por línea, cantidad (máx = `remaining`), checkbox "reponer",
    preview del reembolso en vivo; selector de método; motivo/notas; validación inline (`field-error`).
  - `return-list.tsx` / filas; KPIs reusando `<Kpi>`.
- **Entrada desde Ventas** (único toque a páginas de Ventas): en `/ventas/[id]`, botón
  "Registrar devolución" (solo si `pagada/entregada` y `remaining > 0`) → `/devoluciones/nueva?venta=<id>`;
  + mini-lista "Devoluciones de esta venta".
- **Nav**: añadir entrada en `components/app-shell/nav-config.tsx` (href `/devoluciones`, icono `Undo2`),
  junto a la familia de Ventas. **No tocar `sidebar.tsx`** (regla de coordinación).

## 10. Seguridad / validación

- Importes **recalculados en el servidor** desde `sale_items` (el cliente solo manda `quantity` + `restock`).
- No exceder `remaining`; ≥ 1 línea; venta `pagada/entregada`; `company_id` heredado de la venta; RLS por empresa.
- Borrado siempre vía movimientos **compensatorios** (`out`); no se borra historial del ledger de stock.

## 11. Coordinación (otra terminal)

- Tablas nuevas aisladas (`sale_returns*`); migraciones `0032`/`0033` (la otra terminal usa `0040+`).
- Modifico módulos **míos**: Finanzas, Analítica, Boutiques, Ventas. **No** toco `lib/automatizaciones/**`,
  `automation_*` ni `sidebar.tsx`. Aviso del nuevo módulo y del netteo de ingresos por devoluciones.

## 12. Fuera de alcance v1 (YAGNI)

- Vales / saldo a favor (nota de crédito).
- Comisión por devolución / importe de reembolso distinto al de la línea.
- Multidivisa; devolución de una devolución; portal de la clienta / RMA / etiquetas de envío.
- Snapshot histórico de coste (el COGS sigue usando coste actual, como ya hace Finanzas hoy).

## 13. Testing

- `return.test.ts`: aritmética (bruto/IVA, redondeo), `remaining`, numeración.
- `aggregate.test.ts`: sumas por mes/canal/clienta, COGS repuesto.
- `npm run build` + `npm test`. Verificación manual: crear venta → devolver parcial → comprobar
  stock repuesto, ingresos netos en Finanzas/Analítica/Boutiques, y que **borrar** la devolución revierte.

## 14. Fases de implementación (resumen; el plan lo detalla)

1. Migraciones `0032` + `0033` + tipos (`types/db.ts`).
2. `return.ts` (puro) — TDD.
3. `aggregate.ts` (puro) — TDD.
4. `queries.ts` (lecturas + fetchers de netteo).
5. `actions.ts` (`createReturn` / `deleteReturn`).
6. Integración Finanzas (`financeOverview`) + tests.
7. Integración Analítica (`salesByChannel`) + Boutiques (`aggregateMayorista`) + Ventas (`salesSummary`).
8. Componentes + páginas + entrada en Ventas + nav.
9. Build + deploy.
