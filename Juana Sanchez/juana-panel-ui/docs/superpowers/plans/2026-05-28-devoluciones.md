# Devoluciones Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Registrar devoluciones parciales de ventas (por línea), reponer stock opcionalmente, registrar el reembolso en dinero y descontarlo de los ingresos de forma consistente (Finanzas, Analítica, Boutiques, Ventas).

**Architecture:** Módulo aislado `lib/devoluciones` (lógica pura testeada + queries + server actions) y páginas `/devoluciones`. Dos tablas nuevas (`sale_returns`, `sale_return_items`) + contador. El reembolso es **contra-venta derivada**: no se toca el estado de la venta ni se crean filas de "ingreso negativo"; los informes restan las devoluciones del periodo vía helpers puros compartidos. Reponer stock = `stock_movements` tipo `in` (mismo ledger que ya usa Ventas).

**Tech Stack:** Next.js 16 (App Router, server actions), Supabase (Postgres + RLS), TypeScript, Vitest, Tailwind v4, lucide-react. Spec: `docs/superpowers/specs/2026-05-28-devoluciones-design.md`.

---

## File Structure

**Create:**
- `supabase/migrations/0032_sale_returns.sql` — tablas + contador + RPC `next_return_seq`.
- `supabase/migrations/0033_sale_returns_rls.sql` — RLS por empresa accesible.
- `src/lib/devoluciones/return.ts` — lógica pura (aritmética, remaining, numeración, etiquetas).
- `src/lib/devoluciones/return.test.ts` — tests de `return.ts`.
- `src/lib/devoluciones/aggregate.ts` — agregación pura (mes/canal/clienta, COGS repuesto).
- `src/lib/devoluciones/aggregate.test.ts` — tests de `aggregate.ts`.
- `src/lib/devoluciones/queries.ts` — lecturas + fetchers de netteo.
- `src/lib/devoluciones/actions.ts` — `createReturn`, `deleteReturn`.
- `src/components/devoluciones/return-form.tsx` — formulario de alta (client).
- `src/components/devoluciones/return-list.tsx` — tabla/lista de devoluciones.
- `src/components/devoluciones/sale-returns-panel.tsx` — panel en la ficha de venta (botón + lista).
- `src/app/(app)/devoluciones/page.tsx` — lista + KPIs.
- `src/app/(app)/devoluciones/[id]/page.tsx` — ficha + eliminar.
- `src/app/(app)/devoluciones/nueva/page.tsx` — formulario (`?venta=<id>`).

**Modify:**
- `src/types/db.ts` — regenerar tipos (incluye tablas nuevas + `next_return_seq`).
- `src/lib/finanzas/queries.ts` — `financeOverview` resta devoluciones (ingresos + COGS repuesto).
- `src/lib/analitica/queries.ts` — `salesByChannel` resta devoluciones por canal.
- `src/lib/boutiques/queries.ts` — `listBoutiques`/`getBoutique` restan devoluciones por clienta.
- `src/lib/ventas/queries.ts` — `salesSummary` netea `totalAmount` y expone `returnedAmount`.
- `src/app/(app)/ventas/[id]/page.tsx` — añade `<SaleReturnsPanel>`.
- `src/components/app-shell/nav-config.tsx` — entrada `/devoluciones` (icono `Undo2`).

---

## Task 1: Migraciones (tablas, contador, RLS)

**Files:**
- Create: `supabase/migrations/0032_sale_returns.sql`
- Create: `supabase/migrations/0033_sale_returns_rls.sql`

- [ ] **Step 1: Crear `0032_sale_returns.sql`**

```sql
create table public.sale_returns (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  sale_id uuid not null references public.sales(id) on delete restrict,
  customer_id uuid not null references public.customers(id) on delete restrict,
  number text not null,
  seq integer not null,
  year integer not null,
  return_date date not null default current_date,
  refund_method public.payment_method,
  refund_amount numeric(12,2) not null default 0,
  reason text,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, number)
);

create table public.sale_return_items (
  id uuid primary key default gen_random_uuid(),
  return_id uuid not null references public.sale_returns(id) on delete cascade,
  sale_item_id uuid not null references public.sale_items(id) on delete restrict,
  product_id uuid references public.products(id) on delete set null,
  description text not null,
  quantity numeric(12,2) not null check (quantity > 0),
  unit_gross numeric(12,2) not null default 0,
  line_refund numeric(12,2) not null default 0,
  restock boolean not null default true,
  position integer not null default 0
);

create table public.sale_return_counters (
  company_id uuid not null references public.companies(id) on delete cascade,
  year integer not null,
  last_seq integer not null default 0,
  primary key (company_id, year)
);

create index on public.sale_returns (company_id);
create index on public.sale_returns (sale_id);
create index on public.sale_returns (customer_id);
create index on public.sale_returns (return_date);
create index on public.sale_return_items (return_id);

create function public.next_return_seq(p_company_id uuid, p_year int)
returns int language plpgsql security definer set search_path = public as $$
declare v_seq int;
begin
  if p_company_id not in (select public.accessible_company_ids()) then
    raise exception 'permiso denegado para la empresa %', p_company_id;
  end if;
  insert into public.sale_return_counters (company_id, year, last_seq)
    values (p_company_id, p_year, 1)
  on conflict (company_id, year)
    do update set last_seq = public.sale_return_counters.last_seq + 1
  returning last_seq into v_seq;
  return v_seq;
end; $$;
```

- [ ] **Step 2: Crear `0033_sale_returns_rls.sql`**

```sql
alter table public.sale_returns         enable row level security;
alter table public.sale_return_items    enable row level security;
alter table public.sale_return_counters enable row level security;

create policy "sale_returns por empresa accesible" on public.sale_returns for all to authenticated
  using (company_id in (select public.accessible_company_ids()))
  with check (company_id in (select public.accessible_company_ids()));

create policy "sale_return_items por devolución accesible" on public.sale_return_items for all to authenticated
  using (return_id in (select id from public.sale_returns where company_id in (select public.accessible_company_ids())))
  with check (return_id in (select id from public.sale_returns where company_id in (select public.accessible_company_ids())));
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0032_sale_returns.sql supabase/migrations/0033_sale_returns_rls.sql
git commit -m "feat(devoluciones): migraciones 0032/0033 (sale_returns + RLS)"
```

---

## Task 2: Aplicar migraciones y regenerar tipos

**Files:**
- Modify: `src/types/db.ts`

- [ ] **Step 1: Aplicar `0032` en la base de datos**

Usa la herramienta MCP de Supabase `apply_migration` (proyecto `hfwhrwdmwgdicpsfdvyq`):
- `name`: `0032_sale_returns`
- `query`: el contenido íntegro de `supabase/migrations/0032_sale_returns.sql`.

Expected: éxito sin error.

- [ ] **Step 2: Aplicar `0033`**

`apply_migration` con `name`: `0033_sale_returns_rls`, `query`: contenido de `supabase/migrations/0033_sale_returns_rls.sql`.

Expected: éxito sin error.

- [ ] **Step 3: Regenerar tipos a `src/types/db.ts`**

Usa la herramienta MCP de Supabase `generate_typescript_types` (proyecto `hfwhrwdmwgdicpsfdvyq`) y **sobrescribe** `src/types/db.ts` con el resultado. Debe incluir `sale_returns`, `sale_return_items`, `sale_return_counters` y la función `next_return_seq`.

- [ ] **Step 4: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: PASS (sin errores nuevos). Si Supabase tipa `next_return_seq` con `Args`/`Returns`, no requiere cambios aquí.

- [ ] **Step 5: Commit**

```bash
git add src/types/db.ts
git commit -m "chore(devoluciones): tipos regenerados (sale_returns)"
```

---

## Task 3: Lógica pura `return.ts` (TDD)

**Files:**
- Create: `src/lib/devoluciones/return.test.ts`
- Create: `src/lib/devoluciones/return.ts`

- [ ] **Step 1: Escribir el test que falla**

```ts
import { describe, it, expect } from "vitest";
import {
  unitGross, lineRefund, returnTotals, remainingReturnable, formatReturnNumber, refundMethodLabel,
} from "./return";

describe("unitGross / lineRefund", () => {
  it("calcula el precio unitario bruto (IVA incl.) desde el subtotal de línea", () => {
    // line_subtotal=100 sobre 2 uds => neto unitario 50; con 21% IVA => 60.5
    expect(unitGross({ line_subtotal: 100, quantity: 2 }, 21)).toBe(60.5);
  });
  it("devuelve 0 si la cantidad original es 0", () => {
    expect(unitGross({ line_subtotal: 0, quantity: 0 }, 21)).toBe(0);
  });
  it("reembolso de línea = bruto unitario × cantidad devuelta (redondeo a 2)", () => {
    expect(lineRefund(60.5, 2)).toBe(121);
    expect(lineRefund(33.333, 3)).toBe(100);
  });
});

describe("returnTotals", () => {
  it("suma los reembolsos de línea", () => {
    expect(returnTotals([{ line_refund: 121 }, { line_refund: 10 }])).toBe(131);
  });
});

describe("remainingReturnable", () => {
  const items = [
    { id: "a", quantity: 3, line_subtotal: 300 },
    { id: "b", quantity: 1, line_subtotal: 100 },
  ];
  it("resta lo ya devuelto por línea", () => {
    const m = remainingReturnable(items, [{ sale_item_id: "a", quantity: 1 }]);
    expect(m.get("a")).toBe(2);
    expect(m.get("b")).toBe(1);
  });
  it("nunca es negativo", () => {
    const m = remainingReturnable(items, [{ sale_item_id: "a", quantity: 5 }]);
    expect(m.get("a")).toBe(0);
  });
});

describe("formatReturnNumber / refundMethodLabel", () => {
  it("numera con prefijo y secuencia de 4 dígitos", () => {
    expect(formatReturnNumber("JS", 2026, 7)).toBe("JS-D-2026-0007");
  });
  it("etiqueta el método de reembolso", () => {
    expect(refundMethodLabel("tarjeta")).toBe("Tarjeta");
    expect(refundMethodLabel(null)).toBe("—");
  });
});
```

- [ ] **Step 2: Ejecutar el test (debe fallar)**

Run: `npx vitest run src/lib/devoluciones/return.test.ts`
Expected: FAIL — `Cannot find module './return'`.

- [ ] **Step 3: Implementar `return.ts`**

```ts
export type RefundMethod = "efectivo" | "tarjeta" | "transferencia" | "bizum" | "otro";

const REFUND_METHOD_LABELS: Record<RefundMethod, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  bizum: "Bizum",
  otro: "Otro",
};

export function refundMethodLabel(method: RefundMethod | null): string {
  return method ? REFUND_METHOD_LABELS[method] : "—";
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Precio unitario bruto (IVA incl.) derivado del subtotal de la línea de venta. */
export function unitGross(item: { line_subtotal: number; quantity: number }, taxRate: number): number {
  if (!item.quantity) return 0;
  const netUnit = item.line_subtotal / item.quantity;
  return round2(netUnit * (1 + taxRate / 100));
}

export function lineRefund(unitGrossValue: number, qty: number): number {
  return round2(unitGrossValue * qty);
}

export function returnTotals(lines: { line_refund: number }[]): number {
  return round2(lines.reduce((sum, l) => sum + l.line_refund, 0));
}

export type SaleItemLite = { id: string; quantity: number; line_subtotal: number };
export type PriorReturnItem = { sale_item_id: string; quantity: number };

/** Mapa sale_item_id -> cantidad aún devolvible (vendida − ya devuelta), nunca < 0. */
export function remainingReturnable(saleItems: SaleItemLite[], prior: PriorReturnItem[]): Map<string, number> {
  const returned = new Map<string, number>();
  for (const p of prior) returned.set(p.sale_item_id, (returned.get(p.sale_item_id) ?? 0) + p.quantity);
  const out = new Map<string, number>();
  for (const it of saleItems) out.set(it.id, Math.max(0, it.quantity - (returned.get(it.id) ?? 0)));
  return out;
}

export function formatReturnNumber(prefix: string, year: number, seq: number): string {
  return `${prefix}-D-${year}-${String(seq).padStart(4, "0")}`;
}
```

- [ ] **Step 4: Ejecutar el test (debe pasar)**

Run: `npx vitest run src/lib/devoluciones/return.test.ts`
Expected: PASS (todos los `it`).

- [ ] **Step 5: Commit**

```bash
git add src/lib/devoluciones/return.ts src/lib/devoluciones/return.test.ts
git commit -m "feat(devoluciones): lógica pura de reembolso y remaining (TDD)"
```

---

## Task 4: Agregación pura `aggregate.ts` (TDD)

**Files:**
- Create: `src/lib/devoluciones/aggregate.test.ts`
- Create: `src/lib/devoluciones/aggregate.ts`

- [ ] **Step 1: Escribir el test que falla**

```ts
import { describe, it, expect } from "vitest";
import {
  sumReturnsByMonth, restockedCogsByMonth, sumReturnsByChannel, sumReturnsByCustomer,
} from "./aggregate";

describe("sumReturnsByMonth", () => {
  it("agrupa reembolsos por mes (índice 1..12)", () => {
    const arr = sumReturnsByMonth([
      { return_date: "2026-01-10", refund_amount: 100 },
      { return_date: "2026-01-20", refund_amount: 50 },
      { return_date: "2026-03-01", refund_amount: 30 },
    ]);
    expect(arr).toHaveLength(13);
    expect(arr[1]).toBe(150);
    expect(arr[3]).toBe(30);
    expect(arr[2]).toBe(0);
  });
});

describe("restockedCogsByMonth", () => {
  it("agrupa coste repuesto (cantidad × coste) por mes", () => {
    const arr = restockedCogsByMonth([
      { return_date: "2026-02-05", quantity: 2, cost: 10 },
      { return_date: "2026-02-10", quantity: 1, cost: 5 },
    ]);
    expect(arr[2]).toBe(25);
  });
});

describe("sumReturnsByChannel", () => {
  it("agrupa por canal; null cuenta como 'tienda'", () => {
    const m = sumReturnsByChannel([
      { channel: "mayorista", refund_amount: 100 },
      { channel: null, refund_amount: 20 },
      { channel: "mayorista", refund_amount: 50 },
    ]);
    expect(m.get("mayorista")).toBe(150);
    expect(m.get("tienda")).toBe(20);
  });
});

describe("sumReturnsByCustomer", () => {
  it("agrupa reembolsos por clienta", () => {
    const m = sumReturnsByCustomer([
      { customer_id: "a", refund_amount: 100 },
      { customer_id: "a", refund_amount: 50 },
      { customer_id: "b", refund_amount: 20 },
    ]);
    expect(m.get("a")).toBe(150);
    expect(m.get("b")).toBe(20);
  });
});
```

- [ ] **Step 2: Ejecutar el test (debe fallar)**

Run: `npx vitest run src/lib/devoluciones/aggregate.test.ts`
Expected: FAIL — `Cannot find module './aggregate'`.

- [ ] **Step 3: Implementar `aggregate.ts`**

```ts
const monthOf = (d: string) => Number(d.slice(5, 7));

export type RefundRow = { return_date: string; refund_amount: number };
export type RestockedItemRow = { return_date: string; quantity: number; cost: number };
export type ChannelRefundRow = { channel: string | null; refund_amount: number };
export type CustomerRefundRow = { customer_id: string; refund_amount: number };

export function sumReturnsByMonth(rows: RefundRow[]): number[] {
  const out = new Array(13).fill(0);
  for (const r of rows) out[monthOf(r.return_date)] += Number(r.refund_amount);
  return out;
}

export function restockedCogsByMonth(items: RestockedItemRow[]): number[] {
  const out = new Array(13).fill(0);
  for (const it of items) out[monthOf(it.return_date)] += Number(it.quantity) * Number(it.cost);
  return out;
}

export function sumReturnsByChannel(rows: ChannelRefundRow[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) {
    const ch = r.channel ?? "tienda";
    m.set(ch, (m.get(ch) ?? 0) + Number(r.refund_amount));
  }
  return m;
}

export function sumReturnsByCustomer(rows: CustomerRefundRow[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) m.set(r.customer_id, (m.get(r.customer_id) ?? 0) + Number(r.refund_amount));
  return m;
}
```

- [ ] **Step 4: Ejecutar el test (debe pasar)**

Run: `npx vitest run src/lib/devoluciones/aggregate.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/devoluciones/aggregate.ts src/lib/devoluciones/aggregate.test.ts
git commit -m "feat(devoluciones): agregación pura por mes/canal/clienta (TDD)"
```

---

## Task 5: Lecturas `queries.ts`

**Files:**
- Create: `src/lib/devoluciones/queries.ts`

- [ ] **Step 1: Implementar `queries.ts`**

```ts
import { createClient } from "@/lib/supabase/server";
import type { SaleStatus, SaleChannel } from "@/lib/ventas/sale";
import { unitGross, remainingReturnable } from "./return";
import {
  sumReturnsByMonth, restockedCogsByMonth, sumReturnsByChannel, sumReturnsByCustomer,
} from "./aggregate";

export type ReturnListRow = {
  id: string;
  number: string;
  return_date: string;
  refund_amount: number;
  customerName: string | null;
  saleNumber: string | null;
  lines: number;
};

export async function listReturns(companyFilter: string | "all"): Promise<ReturnListRow[]> {
  const supabase = await createClient();
  let q = supabase
    .from("sale_returns")
    .select("id,number,return_date,refund_amount,customer:customers(name),sale:sales(number),items:sale_return_items(id)")
    .order("return_date", { ascending: false });
  if (companyFilter !== "all") q = q.eq("company_id", companyFilter);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    number: r.number as string,
    return_date: r.return_date as string,
    refund_amount: Number(r.refund_amount),
    customerName: (r.customer as { name: string } | null)?.name ?? null,
    saleNumber: (r.sale as { number: string } | null)?.number ?? null,
    lines: ((r.items as { id: string }[] | null) ?? []).length,
  }));
}

export async function listReturnsForSale(saleId: string): Promise<{ id: string; number: string; return_date: string; refund_amount: number }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sale_returns")
    .select("id,number,return_date,refund_amount")
    .eq("sale_id", saleId)
    .order("return_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    number: r.number as string,
    return_date: r.return_date as string,
    refund_amount: Number(r.refund_amount),
  }));
}

export async function getReturn(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sale_returns")
    .select("*, customer:customers(name), sale:sales(id,number), items:sale_return_items(*)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export type ReturnableItem = {
  sale_item_id: string;
  product_id: string | null;
  description: string;
  sold: number;
  remaining: number;
  unit_gross: number;
};
export type SaleForReturn = {
  id: string;
  number: string;
  status: SaleStatus;
  tax_rate: number;
  customer_name: string | null;
  items: ReturnableItem[];
} | null;

export async function getSaleForReturn(saleId: string): Promise<SaleForReturn> {
  const supabase = await createClient();
  const { data: sale } = await supabase
    .from("sales")
    .select("id,number,status,tax_rate,customer:customers(name)")
    .eq("id", saleId)
    .maybeSingle();
  if (!sale) return null;

  const { data: items, error: iErr } = await supabase
    .from("sale_items")
    .select("id,product_id,description,quantity,line_subtotal")
    .eq("sale_id", saleId)
    .order("position", { ascending: true });
  if (iErr) throw iErr;

  const { data: prior } = await supabase.from("sale_returns").select("id").eq("sale_id", saleId);
  const priorIds = (prior ?? []).map((p) => p.id as string);
  let priorItems: { sale_item_id: string; quantity: number }[] = [];
  if (priorIds.length > 0) {
    const { data: pit } = await supabase
      .from("sale_return_items")
      .select("sale_item_id,quantity")
      .in("return_id", priorIds);
    priorItems = (pit ?? []).map((p) => ({ sale_item_id: p.sale_item_id as string, quantity: Number(p.quantity) }));
  }

  const taxRate = Number(sale.tax_rate);
  const remaining = remainingReturnable(
    (items ?? []).map((i) => ({ id: i.id as string, quantity: Number(i.quantity), line_subtotal: Number(i.line_subtotal) })),
    priorItems,
  );

  return {
    id: sale.id as string,
    number: sale.number as string,
    status: sale.status as SaleStatus,
    tax_rate: taxRate,
    customer_name: (sale.customer as { name: string } | null)?.name ?? null,
    items: (items ?? []).map((i) => ({
      sale_item_id: i.id as string,
      product_id: i.product_id as string | null,
      description: i.description as string,
      sold: Number(i.quantity),
      remaining: remaining.get(i.id as string) ?? 0,
      unit_gross: unitGross({ line_subtotal: Number(i.line_subtotal), quantity: Number(i.quantity) }, taxRate),
    })),
  };
}

function yearBounds(year: number) {
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

/** Para Finanzas: reembolsos por mes y reversión de COGS de lo repuesto, por mes. */
export async function monthlyReturns(
  companyFilter: string | "all",
  year: number,
): Promise<{ refundByMonth: number[]; cogsReversalByMonth: number[] }> {
  const supabase = await createClient();
  const { start, end } = yearBounds(year);
  let rq = supabase.from("sale_returns").select("id,return_date,refund_amount").gte("return_date", start).lte("return_date", end);
  if (companyFilter !== "all") rq = rq.eq("company_id", companyFilter);
  const { data: returns, error } = await rq;
  if (error) throw error;

  const refundByMonth = sumReturnsByMonth(
    (returns ?? []).map((r) => ({ return_date: r.return_date as string, refund_amount: Number(r.refund_amount) })),
  );

  let cogsReversalByMonth = new Array(13).fill(0);
  const ids = (returns ?? []).map((r) => r.id as string);
  if (ids.length > 0) {
    const dateById = new Map((returns ?? []).map((r) => [r.id as string, r.return_date as string]));
    const { data: ritems, error: ie } = await supabase
      .from("sale_return_items")
      .select("return_id,quantity,product:products(cost)")
      .in("return_id", ids)
      .eq("restock", true);
    if (ie) throw ie;
    cogsReversalByMonth = restockedCogsByMonth(
      (ritems ?? []).map((it) => ({
        return_date: dateById.get(it.return_id as string) as string,
        quantity: Number(it.quantity),
        cost: Number((it.product as { cost: number } | null)?.cost ?? 0),
      })),
    );
  }
  return { refundByMonth, cogsReversalByMonth };
}

/** Para Analítica: devoluciones por canal (canal de la venta original). */
export async function returnsByChannel(companyFilter: string | "all", year: number): Promise<Map<string, number>> {
  const supabase = await createClient();
  const { start, end } = yearBounds(year);
  let q = supabase.from("sale_returns").select("refund_amount,sale:sales(channel)").gte("return_date", start).lte("return_date", end);
  if (companyFilter !== "all") q = q.eq("company_id", companyFilter);
  const { data, error } = await q;
  if (error) throw error;
  return sumReturnsByChannel(
    (data ?? []).map((r) => ({
      channel: (r.sale as { channel: SaleChannel | null } | null)?.channel ?? null,
      refund_amount: Number(r.refund_amount),
    })),
  );
}

/** Para Boutiques: devoluciones por clienta, solo de ventas canal mayorista. */
export async function returnsByCustomerMayorista(companyFilter: string | "all"): Promise<Map<string, number>> {
  const supabase = await createClient();
  let q = supabase.from("sale_returns").select("customer_id,refund_amount,sale:sales!inner(channel)").eq("sale.channel", "mayorista");
  if (companyFilter !== "all") q = q.eq("company_id", companyFilter);
  const { data, error } = await q;
  if (error) throw error;
  return sumReturnsByCustomer(
    (data ?? []).map((r) => ({ customer_id: r.customer_id as string, refund_amount: Number(r.refund_amount) })),
  );
}

/** Para Ventas: total devuelto de la empresa (todas las fechas), para netear el KPI de la lista. */
export async function returnedTotalForCompany(companyFilter: string | "all"): Promise<number> {
  const supabase = await createClient();
  let q = supabase.from("sale_returns").select("refund_amount");
  if (companyFilter !== "all") q = q.eq("company_id", companyFilter);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).reduce((sum, r) => sum + Number(r.refund_amount), 0);
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/devoluciones/queries.ts
git commit -m "feat(devoluciones): lecturas y fetchers de netteo (ingresos/canal/clienta)"
```

---

## Task 6: Server actions `actions.ts`

**Files:**
- Create: `src/lib/devoluciones/actions.ts`

- [ ] **Step 1: Implementar `actions.ts`**

```ts
"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { companyPrefix } from "@/lib/cotizaciones/quote";
import { unitGross, lineRefund, returnTotals, remainingReturnable, formatReturnNumber, type RefundMethod } from "./return";

export type ReturnLineInput = { sale_item_id: string; quantity: number; restock: boolean };
export type ReturnInput = {
  sale_id: string;
  return_date: string;
  refund_method: RefundMethod | null;
  reason: string | null;
  notes: string | null;
  lines: ReturnLineInput[];
};

const REVALIDATE = ["/devoluciones", "/ventas", "/inventario", "/finanzas", "/analitica", "/boutiques"];
function revalidateAll(saleId: string) {
  for (const p of REVALIDATE) revalidatePath(p);
  revalidatePath(`/ventas/${saleId}`);
}

export async function createReturn(input: ReturnInput): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: sale, error: sErr } = await supabase
    .from("sales")
    .select("id,company_id,customer_id,number,status,tax_rate")
    .eq("id", input.sale_id)
    .single();
  if (sErr || !sale) return { error: "Venta no encontrada." };
  if (sale.status !== "pagada" && sale.status !== "entregada") {
    return { error: "Solo se puede devolver una venta pagada o entregada." };
  }

  const { data: items, error: iErr } = await supabase
    .from("sale_items")
    .select("id,product_id,description,quantity,line_subtotal")
    .eq("sale_id", input.sale_id);
  if (iErr) return { error: iErr.message };
  const itemById = new Map((items ?? []).map((i) => [i.id as string, i]));

  const { data: prior } = await supabase.from("sale_returns").select("id").eq("sale_id", input.sale_id);
  const priorIds = (prior ?? []).map((p) => p.id as string);
  let priorItems: { sale_item_id: string; quantity: number }[] = [];
  if (priorIds.length > 0) {
    const { data: pit } = await supabase.from("sale_return_items").select("sale_item_id,quantity").in("return_id", priorIds);
    priorItems = (pit ?? []).map((p) => ({ sale_item_id: p.sale_item_id as string, quantity: Number(p.quantity) }));
  }
  const remaining = remainingReturnable(
    (items ?? []).map((i) => ({ id: i.id as string, quantity: Number(i.quantity), line_subtotal: Number(i.line_subtotal) })),
    priorItems,
  );

  const taxRate = Number(sale.tax_rate);
  const chosen = input.lines.filter((l) => l.quantity > 0);
  if (chosen.length === 0) return { error: "Indica al menos una pieza a devolver." };

  const calc = [];
  for (const l of chosen) {
    const item = itemById.get(l.sale_item_id);
    if (!item) return { error: "Una línea no pertenece a esta venta." };
    const max = remaining.get(l.sale_item_id) ?? 0;
    if (l.quantity > max) return { error: `No puedes devolver más de ${max} de "${item.description}".` };
    const ug = unitGross({ line_subtotal: Number(item.line_subtotal), quantity: Number(item.quantity) }, taxRate);
    calc.push({
      sale_item_id: l.sale_item_id,
      product_id: item.product_id as string | null,
      description: item.description as string,
      quantity: l.quantity,
      unit_gross: ug,
      line_refund: lineRefund(ug, l.quantity),
      restock: l.restock,
    });
  }
  const refundAmount = returnTotals(calc);

  const year = Number(input.return_date.slice(0, 4));
  const { data: company, error: cErr } = await supabase.from("companies").select("name").eq("id", sale.company_id).single();
  if (cErr || !company) return { error: "Empresa no encontrada." };
  const { data: seq, error: seqErr } = await supabase.rpc("next_return_seq", { p_company_id: sale.company_id, p_year: year });
  if (seqErr || seq == null) return { error: seqErr?.message ?? "No se pudo numerar la devolución." };
  const number = formatReturnNumber(companyPrefix(company.name as string), year, seq as number);

  const { data: ret, error: rErr } = await supabase
    .from("sale_returns")
    .insert({
      company_id: sale.company_id,
      sale_id: sale.id,
      customer_id: sale.customer_id,
      number, seq: seq as number, year,
      return_date: input.return_date,
      refund_method: input.refund_method,
      refund_amount: refundAmount,
      reason: input.reason,
      notes: input.notes,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();
  if (rErr || !ret) return { error: rErr?.message ?? "No se pudo crear la devolución." };

  const itemRows = calc.map((c, idx) => ({
    return_id: ret.id,
    sale_item_id: c.sale_item_id,
    product_id: c.product_id,
    description: c.description,
    quantity: c.quantity,
    unit_gross: c.unit_gross,
    line_refund: c.line_refund,
    restock: c.restock,
    position: idx,
  }));
  const { error: itErr } = await supabase.from("sale_return_items").insert(itemRows);
  if (itErr) {
    await supabase.from("sale_returns").delete().eq("id", ret.id);
    return { error: itErr.message };
  }

  const movements = calc
    .filter((c) => c.restock && c.product_id)
    .map((c) => ({
      product_id: c.product_id as string,
      type: "in" as const,
      quantity: Math.round(c.quantity),
      reason: "devolución",
      note: `Devolución ${number}`,
      created_by: user?.id ?? null,
    }));
  if (movements.length > 0) {
    const { error: mErr } = await supabase.from("stock_movements").insert(movements);
    if (mErr) {
      await supabase.from("sale_returns").delete().eq("id", ret.id);
      return { error: mErr.message };
    }
  }

  revalidateAll(sale.id as string);
  return { id: ret.id as string };
}

export async function deleteReturn(id: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: ret, error: gErr } = await supabase
    .from("sale_returns")
    .select("number,sale_id,items:sale_return_items(product_id,quantity,restock)")
    .eq("id", id)
    .single();
  if (gErr || !ret) return { error: "Devolución no encontrada." };

  const items = (ret.items as { product_id: string | null; quantity: number; restock: boolean }[] | null) ?? [];
  const movements = items
    .filter((it) => it.restock && it.product_id)
    .map((it) => ({
      product_id: it.product_id as string,
      type: "out" as const,
      quantity: Math.round(Number(it.quantity)),
      reason: "reverso devolución",
      note: `Reverso devolución ${ret.number as string}`,
      created_by: user?.id ?? null,
    }));
  if (movements.length > 0) {
    const { error: mErr } = await supabase.from("stock_movements").insert(movements);
    if (mErr) return { error: mErr.message };
  }

  const { error: dErr } = await supabase.from("sale_returns").delete().eq("id", id);
  if (dErr) return { error: dErr.message };

  revalidateAll(ret.sale_id as string);
  return { ok: true };
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/devoluciones/actions.ts
git commit -m "feat(devoluciones): createReturn/deleteReturn (stock in/out + reverso)"
```

---

## Task 7: Integrar Finanzas (`financeOverview`)

**Files:**
- Modify: `src/lib/finanzas/queries.ts`

- [ ] **Step 1: Importar `monthlyReturns`**

En `src/lib/finanzas/queries.ts`, tras la línea `import { financeSummary, type ExpenseCategory } from "./finance";` añade:

```ts
import { monthlyReturns } from "@/lib/devoluciones/queries";
```

- [ ] **Step 2: Restar devoluciones a ventas y COGS**

En `financeOverview`, localiza el bloque (alrededor de la línea 112-113):

```ts
  const salesByMonth = new Array(13).fill(0);
  for (const s of sales ?? []) salesByMonth[monthOf(s.sale_date)] += Number(s.total);
```

Inmediatamente **después** de ese bucle, inserta:

```ts
  // Devoluciones (contra-venta consistente): restan ingresos y revierten COGS de lo repuesto.
  const { refundByMonth, cogsReversalByMonth } = await monthlyReturns(companyFilter, year);
  for (let m = 1; m <= 12; m++) {
    salesByMonth[m] -= refundByMonth[m];
    cogsByMonth[m] -= cogsReversalByMonth[m];
  }
```

(No se acota a 0: un mes puede quedar neto-negativo si las devoluciones superan las ventas de ese mes; el total anual sigue siendo correcto.)

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib/finanzas/queries.ts
git commit -m "feat(devoluciones): financeOverview neta ingresos y COGS por devoluciones"
```

---

## Task 8: Integrar Analítica, Boutiques y Ventas

**Files:**
- Modify: `src/lib/analitica/queries.ts`
- Modify: `src/lib/boutiques/queries.ts`
- Modify: `src/lib/ventas/queries.ts`

- [ ] **Step 1: Analítica `salesByChannel` resta devoluciones por canal**

En `src/lib/analitica/queries.ts` añade el import:

```ts
import { returnsByChannel } from "@/lib/devoluciones/queries";
```

En `salesByChannel`, sustituye el `return` final:

```ts
  return Array.from(acc.entries()).map(([channel, total]) => ({ channel: channel as SaleChannel, total }));
```

por:

```ts
  const ret = await returnsByChannel(companyFilter, year);
  for (const [ch, amt] of ret) acc.set(ch, (acc.get(ch) ?? 0) - amt);
  return Array.from(acc.entries()).map(([channel, total]) => ({ channel: channel as SaleChannel, total }));
```

- [ ] **Step 2: Boutiques resta devoluciones por clienta**

En `src/lib/boutiques/queries.ts` añade el import:

```ts
import { returnsByCustomerMayorista } from "@/lib/devoluciones/queries";
```

En `listBoutiques`, tras `const accMap = new Map((accounts ?? []).map((a) => [a.customer_id, a]));` añade:

```ts
  const returnsByCust = await returnsByCustomerMayorista(companyFilter);
```

y en el `.map` de `customers`, cambia la propiedad `facturacion`:

```ts
      facturacion: m.facturacion,
```

por:

```ts
      facturacion: m.facturacion - (returnsByCust.get(c.id) ?? 0),
```

En `getBoutique`, tras `const m = aggregateMayorista(sales).get(customerId) ?? { facturacion: 0, pedidos: 0, ultima: null };` añade:

```ts
  const returnsByCust = await returnsByCustomerMayorista(customer.company_id);
  const mNet = { ...m, facturacion: m.facturacion - (returnsByCust.get(customerId) ?? 0) };
```

y cambia el `return` para usar `metrics: mNet` en lugar de `metrics: m`.

- [ ] **Step 3: Ventas `salesSummary` netea el total**

En `src/lib/ventas/queries.ts` añade el import:

```ts
import { returnedTotalForCompany } from "@/lib/devoluciones/queries";
```

Sustituye la función `salesSummary` completa por:

```ts
export async function salesSummary(companyFilter: string | "all") {
  const [sales, returnedAmount] = await Promise.all([
    listSales(companyFilter),
    returnedTotalForCompany(companyFilter),
  ]);
  const active = sales.filter((s) => s.status !== "cancelada");
  const totalSales = active.length;
  const grossAmount = active.reduce((sum, s) => sum + s.total, 0);
  const paidAmount = sales.filter((s) => s.status === "pagada").reduce((sum, s) => sum + s.total, 0);
  return { totalSales, totalAmount: grossAmount - returnedAmount, paidAmount, returnedAmount };
}
```

(La tarjeta de resumen existente muestra ahora el `totalAmount` neto de devoluciones; no se cambia `SummaryCards`. El cálculo financiero autoritativo está en Finanzas.)

- [ ] **Step 4: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/analitica/queries.ts src/lib/boutiques/queries.ts src/lib/ventas/queries.ts
git commit -m "feat(devoluciones): netteo consistente en Analítica, Boutiques y Ventas"
```

---

## Task 9: Componente `return-form.tsx`

**Files:**
- Create: `src/components/devoluciones/return-form.tsx`

- [ ] **Step 1: Implementar el formulario**

```tsx
"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/atelier/field-error";
import { lineRefund, type RefundMethod } from "@/lib/devoluciones/return";
import { createReturn } from "@/lib/devoluciones/actions";
import type { SaleForReturn } from "@/lib/devoluciones/queries";

const METHODS: { value: RefundMethod; label: string }[] = [
  { value: "efectivo", label: "Efectivo" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "transferencia", label: "Transferencia" },
  { value: "bizum", label: "Bizum" },
  { value: "otro", label: "Otro" },
];

type LineState = { qty: number; restock: boolean };

export function ReturnForm({ sale }: { sale: NonNullable<SaleForReturn> }) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const [lines, setLines] = useState<Record<string, LineState>>(
    Object.fromEntries(sale.items.map((it) => [it.sale_item_id, { qty: 0, restock: true }])),
  );
  const [returnDate, setReturnDate] = useState(today);
  const [method, setMethod] = useState<RefundMethod>("efectivo");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const total = useMemo(
    () =>
      sale.items.reduce((sum, it) => {
        const qty = lines[it.sale_item_id]?.qty ?? 0;
        return sum + (qty > 0 ? lineRefund(it.unit_gross, qty) : 0);
      }, 0),
    [lines, sale.items],
  );

  function setLine(id: string, patch: Partial<LineState>) {
    setLines((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    const chosen = sale.items
      .map((it) => ({ sale_item_id: it.sale_item_id, quantity: lines[it.sale_item_id]?.qty ?? 0, restock: lines[it.sale_item_id]?.restock ?? true }))
      .filter((l) => l.quantity > 0);
    if (chosen.length === 0) {
      setError("Indica al menos una pieza a devolver.");
      return;
    }
    setBusy(true);
    const res = await createReturn({
      sale_id: sale.id,
      return_date: returnDate,
      refund_method: method,
      reason: reason.trim() || null,
      notes: notes.trim() || null,
      lines: chosen,
    });
    setBusy(false);
    if ("error" in res) {
      setError(res.error);
      toast.error("No se pudo registrar", { description: res.error });
      return;
    }
    toast.success("Devolución registrada");
    router.push(`/devoluciones/${res.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="border border-line">
        {sale.items.map((it) => {
          const st = lines[it.sale_item_id];
          const disabled = it.remaining <= 0;
          return (
            <div key={it.sale_item_id} className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-elevated px-4 py-3 last:border-0">
              <div className="min-w-0">
                <p className="truncate text-[14px] text-ink">{it.description}</p>
                <p className="font-mono text-[10.5px] text-ink-4">
                  Devolvible: {it.remaining} de {it.sold} · {it.unit_gross.toFixed(2)} €/ud
                </p>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-[12px] text-ink-3">
                  Cantidad
                  <input
                    type="number"
                    min={0}
                    max={it.remaining}
                    step={1}
                    disabled={disabled}
                    value={st?.qty ?? 0}
                    onChange={(e) => setLine(it.sale_item_id, { qty: Math.max(0, Math.min(it.remaining, Number(e.target.value))) })}
                    className="w-20 border border-line bg-paper px-2 py-1.5 text-sm text-ink disabled:opacity-40"
                  />
                </label>
                <label className="flex items-center gap-2 text-[12px] text-ink-3">
                  <input
                    type="checkbox"
                    checked={st?.restock ?? true}
                    disabled={disabled}
                    onChange={(e) => setLine(it.sale_item_id, { restock: e.target.checked })}
                    className="h-4 w-4 accent-[var(--brand)]"
                  />
                  Reponer
                </label>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-4">Fecha</span>
          <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className="block w-full border border-line bg-elevated px-2 py-1.5 text-sm text-ink" />
        </label>
        <label className="space-y-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-4">Método de reembolso</span>
          <select value={method} onChange={(e) => setMethod(e.target.value as RefundMethod)} className="block w-full border border-line bg-elevated px-2 py-1.5 text-sm text-ink">
            {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </label>
        <label className="space-y-1.5 sm:col-span-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-4">Motivo</span>
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Talla, defecto, cambio de opinión…" className="block w-full border border-line bg-elevated px-2 py-1.5 text-sm text-ink" />
        </label>
        <label className="space-y-1.5 sm:col-span-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-4">Notas</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="block w-full border border-line bg-elevated px-2 py-1.5 text-sm text-ink" />
        </label>
      </div>

      <div className="flex items-center justify-between border-t border-line pt-4">
        <span className="font-display text-lg text-ink">Reembolso: {total.toFixed(2)} €</span>
        <Button type="submit" disabled={busy}>{busy ? "Registrando…" : "Registrar devolución"}</Button>
      </div>
      <FieldError msg={error} />
    </form>
  );
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/devoluciones/return-form.tsx
git commit -m "feat(devoluciones): formulario de alta (líneas, reponer, preview)"
```

---

## Task 10: Componentes `return-list.tsx` y `sale-returns-panel.tsx`

**Files:**
- Create: `src/components/devoluciones/return-list.tsx`
- Create: `src/components/devoluciones/sale-returns-panel.tsx`

- [ ] **Step 1: Implementar `return-list.tsx`**

```tsx
import Link from "next/link";
import type { ReturnListRow } from "@/lib/devoluciones/queries";

export function ReturnList({ rows }: { rows: ReturnListRow[] }) {
  if (rows.length === 0) {
    return <p className="border border-line bg-elevated px-4 py-6 text-sm text-ink-4">Sin devoluciones registradas.</p>;
  }
  return (
    <div className="border border-line">
      {rows.map((r) => (
        <Link key={r.id} href={`/devoluciones/${r.id}`} className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-elevated px-4 py-3 transition-colors last:border-0 hover:bg-paper">
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[14px] text-ink">{r.number}</span>
            <span className="truncate font-mono text-[10.5px] text-ink-4">
              {r.customerName ?? "—"} · venta {r.saleNumber ?? "—"} · {r.lines} líneas
            </span>
          </span>
          <span className="flex items-center gap-4">
            <span className="font-mono text-[10.5px] text-ink-5">{r.return_date}</span>
            <span className="font-display text-[15px] text-ink tabular-nums">{r.refund_amount.toFixed(2)} €</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Implementar `sale-returns-panel.tsx` (server component)**

```tsx
import Link from "next/link";
import { getSaleForReturn, listReturnsForSale } from "@/lib/devoluciones/queries";
import { Button } from "@/components/ui/button";

export async function SaleReturnsPanel({ saleId }: { saleId: string }) {
  const [sale, returns] = await Promise.all([getSaleForReturn(saleId), listReturnsForSale(saleId)]);
  const returnable = !!sale && (sale.status === "pagada" || sale.status === "entregada") && sale.items.some((it) => it.remaining > 0);

  return (
    <div className="space-y-3 border border-line p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-ink">Devoluciones</h2>
        {returnable && (
          <Button asChild size="sm" variant="outline">
            <Link href={`/devoluciones/nueva?venta=${saleId}`}>Registrar devolución</Link>
          </Button>
        )}
      </div>
      {returns.length === 0 ? (
        <p className="text-sm text-ink-4">
          {returnable ? "Esta venta no tiene devoluciones." : "Sin devoluciones (la venta no es devolvible o ya está completa)."}
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {returns.map((r) => (
            <li key={r.id} className="flex items-center justify-between py-2 text-sm">
              <Link href={`/devoluciones/${r.id}`} className="text-ink underline-offset-2 hover:underline">{r.number}</Link>
              <span className="font-mono text-[11px] text-ink-4">{r.return_date} · {r.refund_amount.toFixed(2)} €</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/devoluciones/return-list.tsx src/components/devoluciones/sale-returns-panel.tsx
git commit -m "feat(devoluciones): lista y panel de devoluciones por venta"
```

---

## Task 11: Páginas `/devoluciones`

**Files:**
- Create: `src/app/(app)/devoluciones/page.tsx`
- Create: `src/app/(app)/devoluciones/[id]/page.tsx`
- Create: `src/app/(app)/devoluciones/nueva/page.tsx`

- [ ] **Step 1: Lista `/devoluciones/page.tsx`**

```tsx
import { getActiveCompany } from "@/lib/active-company";
import { listReturns } from "@/lib/devoluciones/queries";
import { PageHeader } from "@/components/atelier/page-header";
import { KpiGrid, KpiCard } from "@/components/atelier/kpi";
import { ReturnList } from "@/components/devoluciones/return-list";

export default async function DevolucionesPage() {
  const company = await getActiveCompany();
  const rows = await listReturns(company);
  const totalRefund = rows.reduce((sum, r) => sum + r.refund_amount, 0);

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Operaciones" title="Devoluciones" />
      <KpiGrid>
        <KpiCard label="Devoluciones" value={rows.length} index="nº" />
        <KpiCard label="Importe devuelto" value={`${totalRefund.toFixed(2)} €`} index="total" />
      </KpiGrid>
      <ReturnList rows={rows} />
    </div>
  );
}
```

- [ ] **Step 2: Ficha `/devoluciones/[id]/page.tsx`**

```tsx
import Link from "next/link";
import { getReturn } from "@/lib/devoluciones/queries";
import { deleteReturn } from "@/lib/devoluciones/actions";
import { refundMethodLabel, type RefundMethod } from "@/lib/devoluciones/return";
import { PageHeader } from "@/components/atelier/page-header";
import { DetailGrid, DetailField, DetailNotes } from "@/components/atelier/detail";
import { DeleteButton } from "@/components/atelier/delete-button";

type ReturnItem = { id: string; description: string; quantity: number; line_refund: number; restock: boolean };

export default async function DevolucionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ret = await getReturn(id);
  const sale = ret.sale as { id: string; number: string } | null;
  const customer = ret.customer as { name: string } | null;
  const items = ((ret.items ?? []) as ReturnItem[]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader eyebrow="Devolución" title={ret.number as string} />
        <DeleteButton
          action={deleteReturn.bind(null, id)}
          redirectTo="/devoluciones"
          confirm="¿Eliminar esta devolución? Se revierte la reposición de stock."
        />
      </div>

      <DetailGrid>
        <DetailField label="Venta">
          {sale ? <Link className="underline underline-offset-2" href={`/ventas/${sale.id}`}>{sale.number}</Link> : "—"}
        </DetailField>
        <DetailField label="Clienta">{customer?.name ?? "—"}</DetailField>
        <DetailField label="Fecha">{ret.return_date as string}</DetailField>
        <DetailField label="Método de reembolso">{refundMethodLabel(ret.refund_method as RefundMethod | null)}</DetailField>
        <DetailField label="Importe devuelto">{Number(ret.refund_amount).toFixed(2)} €</DetailField>
        <DetailField label="Motivo">{(ret.reason as string | null) ?? "—"}</DetailField>
      </DetailGrid>

      <div className="border border-line">
        {items.map((it) => (
          <div key={it.id} className="flex items-center justify-between border-b border-line bg-elevated px-4 py-3 last:border-0">
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-[14px] text-ink">{it.description}</span>
              <span className="font-mono text-[10.5px] text-ink-4">
                {Number(it.quantity)} ud · {it.restock ? "repuesto" : "no repuesto"}
              </span>
            </span>
            <span className="font-display text-[15px] text-ink tabular-nums">{Number(it.line_refund).toFixed(2)} €</span>
          </div>
        ))}
      </div>

      <DetailNotes notes={(ret.notes as string | null) ?? null} />
    </div>
  );
}
```

- [ ] **Step 3: Alta `/devoluciones/nueva/page.tsx`**

```tsx
import Link from "next/link";
import { getSaleForReturn } from "@/lib/devoluciones/queries";
import { PageHeader } from "@/components/atelier/page-header";
import { ReturnForm } from "@/components/devoluciones/return-form";

export default async function NuevaDevolucionPage({ searchParams }: { searchParams: Promise<{ venta?: string }> }) {
  const { venta } = await searchParams;
  const sale = venta ? await getSaleForReturn(venta) : null;

  function Aviso({ children }: { children: React.ReactNode }) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Devoluciones" title="Nueva devolución" />
        <p className="border border-line bg-elevated px-4 py-6 text-sm text-ink-4">{children}</p>
        <Link href="/ventas" className="text-sm text-ink underline underline-offset-2">Ir a Ventas</Link>
      </div>
    );
  }

  if (!venta) return <Aviso>Abre una devolución desde una venta: en la ficha de la venta, pulsa “Registrar devolución”.</Aviso>;
  if (!sale) return <Aviso>Venta no encontrada.</Aviso>;
  if (sale.status !== "pagada" && sale.status !== "entregada") return <Aviso>Solo se pueden devolver ventas pagadas o entregadas.</Aviso>;
  if (!sale.items.some((it) => it.remaining > 0)) return <Aviso>Esta venta ya está totalmente devuelta.</Aviso>;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={`Venta ${sale.number}`} title="Nueva devolución" />
      <p className="text-sm text-ink-4">Clienta: {sale.customer_name ?? "—"}</p>
      <ReturnForm sale={sale} />
    </div>
  );
}
```

- [ ] **Step 4: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(app\)/devoluciones/page.tsx src/app/\(app\)/devoluciones/\[id\]/page.tsx src/app/\(app\)/devoluciones/nueva/page.tsx
git commit -m "feat(devoluciones): páginas lista/ficha/alta"
```

---

## Task 12: Entrada desde Ventas + navegación

**Files:**
- Modify: `src/app/(app)/ventas/[id]/page.tsx`
- Modify: `src/components/app-shell/nav-config.tsx`

- [ ] **Step 1: Añadir el panel a la ficha de venta**

En `src/app/(app)/ventas/[id]/page.tsx` añade el import:

```tsx
import { SaleReturnsPanel } from "@/components/devoluciones/sale-returns-panel";
```

Y justo antes del `</div>` de cierre del contenedor raíz (después del último `</Card>`), inserta:

```tsx
      <SaleReturnsPanel saleId={id} />
```

- [ ] **Step 2: Añadir la entrada al nav**

En `src/components/app-shell/nav-config.tsx`:
1. Añade `Undo2` a la lista de imports de `lucide-react` (orden alfabético no requerido):

```tsx
  Undo2,
```

2. En la sección `"Operaciones"`, justo después de la entrada de `/ventas`, añade:

```tsx
      { href: "/devoluciones", label: "Devoluciones", icon: Undo2 },
```

- [ ] **Step 3: Verificar build completo**

Run: `npm run build`
Expected: PASS (compila sin errores de tipos ni de rutas).

- [ ] **Step 4: Commit**

```bash
git add "src/app/(app)/ventas/[id]/page.tsx" src/components/app-shell/nav-config.tsx
git commit -m "feat(devoluciones): entrada desde la ficha de venta + nav"
```

---

## Task 13: Verificación final, suite y despliegue

**Files:** (ninguno nuevo)

- [ ] **Step 1: Suite completa**

Run: `npm test`
Expected: PASS (incluye `return.test.ts` y `aggregate.test.ts`; sin romper los existentes).

- [ ] **Step 2: Build de producción**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Verificación manual (resumen)**

Con la app en marcha (`npm run dev`):
1. Crear una venta con 2+ líneas y marcarla `pagada`.
2. En la ficha de la venta → “Registrar devolución” → devolver 1 de una línea (reponer ✓) y otra con reponer ✗.
3. Comprobar: `/devoluciones` lista la devolución; `/inventario` subió el stock solo de la repuesta; `/finanzas` y `/analitica` muestran ingresos netos; `/boutiques` (si la venta es mayorista) netea la clienta.
4. Borrar la devolución desde su ficha → el stock repuesto vuelve a bajar (movimiento `out`) y los ingresos se recuperan.

- [ ] **Step 4: Desplegar (fast-forward de `main`)**

Sigue el flujo de despliegue del proyecto: `git fetch origin` → si `main` va por delante, `git merge origin/main --no-edit` (resolver, re-`npm run build`) → `git push -q origin frontend-atelier` → fast-forward de `main` vía la API de GitHub. Confirmar que Vercel publica.

---

## Self-Review

- **Spec coverage:** Modelo de datos (T1) ✓; RLS (T1) ✓; contador/numeración (T1, T3, T6) ✓; reembolso en dinero (T3, T6) ✓; parcial por línea (T3, T6, T9) ✓; restock con opción (T6, T9) ✓; contra-venta consistente en Finanzas/Analítica/Boutiques/Ventas (T7, T8) ✓; borrado con reverso (T6, T11) ✓; UI lista/ficha/alta (T11) ✓; entrada desde venta + nav (T12) ✓; tests (T3, T4, T13) ✓; fuera de alcance respetado (sin vales, sin tocar `sidebar.tsx`/`automatizaciones`) ✓.
- **Placeholder scan:** sin TBD/TODO; todo el código está completo.
- **Type consistency:** `SaleForReturn`/`ReturnableItem`/`ReturnListRow` definidos en `queries.ts` y consumidos igual en form/páginas; `ReturnInput`/`ReturnLineInput` definidos en `actions.ts` y construidos igual en el form; `monthlyReturns` devuelve `{ refundByMonth, cogsReversalByMonth }` y así se desestructura en Finanzas; `returnsByChannel`/`returnsByCustomerMayorista`/`returnedTotalForCompany` con las firmas usadas en Analítica/Boutiques/Ventas.
