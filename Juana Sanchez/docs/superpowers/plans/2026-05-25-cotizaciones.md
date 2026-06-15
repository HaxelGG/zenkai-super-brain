# Módulo Cotizaciones — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el módulo Cotizaciones (presupuestos con líneas, IVA único, numeración por empresa/año, estados y vista imprimible) sobre los cimientos + Inventario + CRM existentes, replicando su patrón.

**Architecture:** Tres tablas Supabase nuevas (`quotes`, `quote_items`, `quote_counters`) con RLS por `company_id` vía `accessible_company_ids()`, más un RPC `next_quote_seq` (security definer) para numeración atómica. Lógica pura testeada en `src/lib/cotizaciones/quote.ts` (subtotales, totales, número, estado). Lecturas en `queries.ts`, mutaciones en `actions.ts` (server actions que reciben un objeto `QuoteInput` serializable). Editor de líneas dinámico (client component) con totales en vivo. Vista imprimible en ruta propia sin app shell. Reutiliza clientes (CRM) y productos (Inventario). Deploy = push a `main`.

**Tech Stack:** Next.js 15 (App Router, TS), Supabase (`@supabase/ssr`), shadcn/ui + Tailwind, Vitest, Vercel. Todo ya instalado.

**Spec:** `docs/superpowers/specs/2026-05-25-cotizaciones-design.md`

---

## Prerrequisitos

- Cimientos + Inventario + CRM construidos y en producción (ver memoria del proyecto).
- Existen: helpers SQL `is_owner()`, `accessible_company_ids()`; tablas `companies`, `profiles`, `customers`, `products`; `getActiveCompany()` en `src/lib/active-company.ts`; clientes Supabase en `src/lib/supabase/`; Sidebar en `src/components/app-shell/sidebar.tsx` (entradas Inventario + Clientes).
- Última migración aplicada: `0008_crm_rls`. Las nuevas son `0009` y `0010`.
- Supabase project ref: `hfwhrwdmwgdicpsfdvyq`.
- Trabajar en una rama feature desde `main`. Todos los comandos desde `juana-sanchez-panel/`.

---

## File Structure

```
juana-sanchez-panel/
├── supabase/migrations/
│   ├── 0009_quotes.sql                       # enum, quotes, quote_items, quote_counters, RPC next_quote_seq, índices
│   └── 0010_quotes_rls.sql                    # RLS de cotizaciones
├── src/
│   ├── types/db.ts                            # MODIFY: regenerar tipos
│   ├── lib/cotizaciones/
│   │   ├── quote.ts                            # lógica pura
│   │   ├── quote.test.ts                       # tests
│   │   ├── queries.ts                          # lecturas
│   │   └── actions.ts                          # server actions (createQuote, updateQuote, setQuoteStatus)
│   ├── app/(app)/cotizaciones/
│   │   ├── page.tsx                            # lista + resumen
│   │   ├── nueva/page.tsx                      # alta (editor)
│   │   ├── [id]/page.tsx                       # ficha + acciones de estado
│   │   ├── [id]/editar/page.tsx                # edición (editor)
│   │   └── [id]/imprimir/page.tsx              # vista imprimible (sin shell)
│   └── components/
│       ├── app-shell/sidebar.tsx               # MODIFY: entrada "Cotizaciones"
│       ├── ui/textarea.tsx                      # shadcn (generado)
│       └── cotizaciones/
│           ├── summary-cards.tsx
│           ├── quote-table.tsx                  # client: buscador + filtros
│           ├── line-items-editor.tsx            # client: líneas dinámicas
│           ├── quote-editor.tsx                 # client: cabecera + líneas + totales en vivo
│           ├── quote-view.tsx                   # render cabecera+líneas+totales (ficha e imprimir)
│           └── status-actions.tsx               # client: cambio de estado
```

---

## Phase 1 — Base de datos

### Task 1: Migración del esquema de cotizaciones

**Files:**
- Create: `supabase/migrations/0009_quotes.sql`

- [ ] **Step 1: Escribir la migración**

Create `supabase/migrations/0009_quotes.sql`:
```sql
create type public.quote_status as enum ('borrador', 'enviada', 'aceptada', 'rechazada', 'caducada');

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  number text not null,
  seq integer not null,
  year integer not null,
  status public.quote_status not null default 'borrador',
  issue_date date not null default current_date,
  valid_until date,
  tax_rate numeric(5,2) not null default 21,
  notes text,
  subtotal numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, number)
);

create table public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  description text not null,
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  discount_pct numeric(5,2) not null default 0,
  line_subtotal numeric(12,2) not null default 0,
  position integer not null default 0
);

create table public.quote_counters (
  company_id uuid not null references public.companies(id) on delete cascade,
  year integer not null,
  last_seq integer not null default 0,
  primary key (company_id, year)
);

create index on public.quotes (company_id);
create index on public.quotes (customer_id);
create index on public.quote_items (quote_id);

-- Numeración atómica: devuelve el siguiente correlativo para (empresa, año)
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

- [ ] **Step 2: Aplicar la migración**

Vía Supabase MCP `apply_migration` name `0009_quotes`.
Expected: tablas, enum, RPC e índices creados sin error.

- [ ] **Step 3: Verificar**

Vía Supabase MCP `list_tables`: `quotes`, `quote_items`, `quote_counters` presentes en `public`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0009_quotes.sql
git commit -m "feat(db): quotes schema (quotes, items, counters, numbering rpc)"
```

### Task 2: RLS de cotizaciones

**Files:**
- Create: `supabase/migrations/0010_quotes_rls.sql`

- [ ] **Step 1: Escribir la migración de RLS**

Create `supabase/migrations/0010_quotes_rls.sql`:
```sql
alter table public.quotes         enable row level security;
alter table public.quote_items    enable row level security;
alter table public.quote_counters enable row level security;

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
Nota: `quote_counters` queda con RLS habilitada y SIN políticas a propósito — solo el RPC `next_quote_seq` (security definer) lo modifica.

- [ ] **Step 2: Aplicar la migración**

Vía Supabase MCP `apply_migration` name `0010_quotes_rls`.

- [ ] **Step 3: Verificar seguridad**

Vía Supabase MCP `get_advisors` (type `security`): sin avisos "RLS disabled" para `quotes`, `quote_items`, `quote_counters`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0010_quotes_rls.sql
git commit -m "feat(db): quotes RLS (isolation by company)"
```

### Task 3: Regenerar tipos TypeScript

**Files:**
- Modify: `src/types/db.ts`

- [ ] **Step 1: Generar los tipos**

Vía Supabase MCP `generate_typescript_types` (proyecto `hfwhrwdmwgdicpsfdvyq`). Sobrescribir `src/types/db.ts`.
Expected: incluye `quotes`, `quote_items`, `quote_counters`, el enum `quote_status` y la función `next_quote_seq`.

- [ ] **Step 2: Verificar build**

```bash
npm run build
```
Expected: compila sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/types/db.ts
git commit -m "chore(db): regenerate types with quotes tables"
```

---

## Phase 2 — Lógica pura (TDD)

### Task 4: Subtotales y totales

**Files:**
- Create: `src/lib/cotizaciones/quote.ts`
- Test: `src/lib/cotizaciones/quote.test.ts`

- [ ] **Step 1: Escribir el test que falla**

Create `src/lib/cotizaciones/quote.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { lineSubtotal, quoteTotals } from "./quote";

describe("lineSubtotal", () => {
  it("multiplica cantidad por precio sin descuento", () => {
    expect(lineSubtotal(3, 10, 0)).toBe(30);
  });
  it("aplica el descuento porcentual", () => {
    expect(lineSubtotal(2, 100, 10)).toBe(180);
  });
  it("redondea a 2 decimales", () => {
    expect(lineSubtotal(3, 9.99, 5)).toBe(28.47);
  });
});

describe("quoteTotals", () => {
  it("suma subtotales, calcula IVA y total", () => {
    const lines = [
      { quantity: 2, unit_price: 100, discount_pct: 0 }, // 200
      { quantity: 1, unit_price: 50, discount_pct: 10 },  // 45
    ];
    expect(quoteTotals(lines, 21)).toEqual({ subtotal: 245, taxAmount: 51.45, total: 296.45 });
  });
  it("con IVA 0 el total es la base", () => {
    const lines = [{ quantity: 1, unit_price: 100, discount_pct: 0 }];
    expect(quoteTotals(lines, 0)).toEqual({ subtotal: 100, taxAmount: 0, total: 100 });
  });
  it("sin líneas todo es 0", () => {
    expect(quoteTotals([], 21)).toEqual({ subtotal: 0, taxAmount: 0, total: 0 });
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

```bash
npm test
```
Expected: FAIL — `./quote` no existe.

- [ ] **Step 3: Implementar**

Create `src/lib/cotizaciones/quote.ts`:
```typescript
export type QuoteStatus = "borrador" | "enviada" | "aceptada" | "rechazada" | "caducada";

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function lineSubtotal(quantity: number, unitPrice: number, discountPct: number): number {
  return round2(quantity * unitPrice * (1 - discountPct / 100));
}

type TotalsLine = { quantity: number; unit_price: number; discount_pct: number };

export function quoteTotals(lines: TotalsLine[], taxRate: number): {
  subtotal: number; taxAmount: number; total: number;
} {
  const subtotal = round2(
    lines.reduce((sum, l) => sum + lineSubtotal(l.quantity, l.unit_price, l.discount_pct), 0)
  );
  const taxAmount = round2(subtotal * (taxRate / 100));
  const total = round2(subtotal + taxAmount);
  return { subtotal, taxAmount, total };
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

```bash
npm test
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/cotizaciones/quote.ts src/lib/cotizaciones/quote.test.ts
git commit -m "feat(cotizaciones): line subtotal + quote totals + tests"
```

### Task 5: Prefijo de empresa y número de cotización

**Files:**
- Modify: `src/lib/cotizaciones/quote.ts`
- Modify: `src/lib/cotizaciones/quote.test.ts`

- [ ] **Step 1: Añadir el test que falla**

Actualizar la línea de import en `src/lib/cotizaciones/quote.test.ts` a:
```typescript
import { lineSubtotal, quoteTotals, companyPrefix, formatQuoteNumber } from "./quote";
```
y añadir:
```typescript
describe("companyPrefix", () => {
  it("toma iniciales en mayúscula de cada palabra", () => {
    expect(companyPrefix("Juana Sánchez")).toBe("JS");
  });
  it("una sola palabra → una inicial", () => {
    expect(companyPrefix("Lolikas")).toBe("L");
    expect(companyPrefix("Printellar")).toBe("P");
  });
  it("máximo 3 iniciales y recorta espacios", () => {
    expect(companyPrefix("  Uno Dos Tres Cuatro ")).toBe("UDT");
  });
});

describe("formatQuoteNumber", () => {
  it("formatea con padding a 4 dígitos", () => {
    expect(formatQuoteNumber("JS", 2026, 1)).toBe("JS-2026-0001");
    expect(formatQuoteNumber("L", 2026, 42)).toBe("L-2026-0042");
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

```bash
npm test
```
Expected: FAIL — `companyPrefix`/`formatQuoteNumber` no exportados.

- [ ] **Step 3: Implementar**

Añadir a `src/lib/cotizaciones/quote.ts`:
```typescript
export function companyPrefix(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export function formatQuoteNumber(prefix: string, year: number, seq: number): string {
  return `${prefix}-${year}-${String(seq).padStart(4, "0")}`;
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

```bash
npm test
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/cotizaciones/quote.ts src/lib/cotizaciones/quote.test.ts
git commit -m "feat(cotizaciones): company prefix + quote number formatting + tests"
```

### Task 6: Etiqueta de estado y expiración

**Files:**
- Modify: `src/lib/cotizaciones/quote.ts`
- Modify: `src/lib/cotizaciones/quote.test.ts`

- [ ] **Step 1: Añadir el test que falla**

Actualizar el import en `src/lib/cotizaciones/quote.test.ts` a:
```typescript
import { lineSubtotal, quoteTotals, companyPrefix, formatQuoteNumber, statusLabel, isExpired } from "./quote";
```
y añadir:
```typescript
describe("statusLabel", () => {
  it("traduce los estados", () => {
    expect(statusLabel("borrador")).toBe("Borrador");
    expect(statusLabel("enviada")).toBe("Enviada");
    expect(statusLabel("aceptada")).toBe("Aceptada");
    expect(statusLabel("rechazada")).toBe("Rechazada");
    expect(statusLabel("caducada")).toBe("Caducada");
  });
});

describe("isExpired", () => {
  const hoy = "2026-05-25";
  it("vencida si valid_until es anterior a hoy y sigue abierta", () => {
    expect(isExpired("2026-05-01", "enviada", hoy)).toBe(true);
    expect(isExpired("2026-05-01", "borrador", hoy)).toBe(true);
  });
  it("no vencida si ya está aceptada/rechazada/caducada", () => {
    expect(isExpired("2026-05-01", "aceptada", hoy)).toBe(false);
    expect(isExpired("2026-05-01", "rechazada", hoy)).toBe(false);
    expect(isExpired("2026-05-01", "caducada", hoy)).toBe(false);
  });
  it("no vencida si no hay fecha o aún no pasó", () => {
    expect(isExpired(null, "enviada", hoy)).toBe(false);
    expect(isExpired("2026-06-01", "enviada", hoy)).toBe(false);
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

```bash
npm test
```
Expected: FAIL — `statusLabel`/`isExpired` no exportados.

- [ ] **Step 3: Implementar**

Añadir a `src/lib/cotizaciones/quote.ts`:
```typescript
const STATUS_LABELS: Record<QuoteStatus, string> = {
  borrador: "Borrador",
  enviada: "Enviada",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
  caducada: "Caducada",
};

export function statusLabel(status: QuoteStatus): string {
  return STATUS_LABELS[status];
}

export function isExpired(
  validUntil: string | null,
  status: QuoteStatus,
  today: string = new Date().toISOString().slice(0, 10)
): boolean {
  if (!validUntil) return false;
  if (status === "aceptada" || status === "rechazada" || status === "caducada") return false;
  return validUntil < today;
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

```bash
npm test
```
Expected: PASS (toda la suite, incluyendo Inventario y CRM).

- [ ] **Step 5: Commit**

```bash
git add src/lib/cotizaciones/quote.ts src/lib/cotizaciones/quote.test.ts
git commit -m "feat(cotizaciones): status label + expiry helper + tests"
```

---

## Phase 3 — Capa de datos

### Task 7: Queries de lectura

**Files:**
- Create: `src/lib/cotizaciones/queries.ts`

- [ ] **Step 1: Escribir las lecturas**

Create `src/lib/cotizaciones/queries.ts`:
```typescript
import { createClient } from "@/lib/supabase/server";
import type { QuoteStatus } from "./quote";

export type QuoteListRow = {
  id: string;
  number: string;
  status: QuoteStatus;
  issue_date: string;
  valid_until: string | null;
  total: number;
  customer: { name: string } | null;
};

export type QuoteItemRow = {
  id: string;
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  discount_pct: number;
  line_subtotal: number;
  position: number;
};

export async function listQuotes(companyFilter: string | "all"): Promise<QuoteListRow[]> {
  const supabase = await createClient();
  let q = supabase
    .from("quotes")
    .select("id,number,status,issue_date,valid_until,total,customer:customers(name)")
    .order("issue_date", { ascending: false })
    .order("seq", { ascending: false });
  if (companyFilter !== "all") q = q.eq("company_id", companyFilter);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    number: r.number,
    status: r.status as QuoteStatus,
    issue_date: r.issue_date,
    valid_until: r.valid_until,
    total: r.total,
    customer: r.customer as { name: string } | null,
  }));
}

export async function getQuote(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .select("*, customer:customers(name,email,phone), company:companies(name), items:quote_items(*)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function customersForCompany(companyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id,name")
    .eq("company_id", companyId)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function productsForCompany(companyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id,name,price")
    .eq("company_id", companyId)
    .eq("status", "active")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function quotesSummary(companyFilter: string | "all") {
  const quotes = await listQuotes(companyFilter);
  const totalQuotes = quotes.length;
  const accepted = quotes.filter((q) => q.status === "aceptada");
  const acceptedCount = accepted.length;
  const acceptedAmount = accepted.reduce((s, q) => s + q.total, 0);
  return { totalQuotes, acceptedCount, acceptedAmount };
}
```

- [ ] **Step 2: Verificar build**

```bash
npm run build
```
Expected: compila (si el join anidado se queja del tipo, usar el `as` en el map como arriba).

- [ ] **Step 3: Commit**

```bash
git add src/lib/cotizaciones/queries.ts
git commit -m "feat(cotizaciones): read queries + summary"
```

### Task 8: Server actions

**Files:**
- Create: `src/lib/cotizaciones/actions.ts`

- [ ] **Step 1: Escribir las actions**

Create `src/lib/cotizaciones/actions.ts`:
```typescript
"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  lineSubtotal, quoteTotals, companyPrefix, formatQuoteNumber, type QuoteStatus,
} from "./quote";

export type QuoteLineInput = {
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  discount_pct: number;
};

export type QuoteInput = {
  company_id: string;
  customer_id: string;
  issue_date: string;        // "YYYY-MM-DD"
  valid_until: string | null;
  tax_rate: number;
  notes: string | null;
  lines: QuoteLineInput[];
};

export async function createQuote(input: QuoteInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const year = Number(input.issue_date.slice(0, 4));

  const { data: company, error: cErr } = await supabase
    .from("companies").select("name").eq("id", input.company_id).single();
  if (cErr) return { error: cErr.message };

  const { data: seq, error: sErr } = await supabase
    .rpc("next_quote_seq", { p_company_id: input.company_id, p_year: year });
  if (sErr || seq == null) return { error: sErr?.message ?? "No se pudo numerar la cotización." };

  const number = formatQuoteNumber(companyPrefix(company.name), year, seq);
  const totals = quoteTotals(input.lines, input.tax_rate);

  const { data: quote, error: qErr } = await supabase.from("quotes").insert({
    company_id: input.company_id,
    customer_id: input.customer_id,
    number, seq, year,
    issue_date: input.issue_date,
    valid_until: input.valid_until,
    tax_rate: input.tax_rate,
    notes: input.notes,
    subtotal: totals.subtotal,
    tax_amount: totals.taxAmount,
    total: totals.total,
    created_by: user?.id ?? null,
  }).select("id").single();
  if (qErr) return { error: qErr.message };

  const itemsRows = input.lines.map((l, i) => ({
    quote_id: quote.id,
    product_id: l.product_id,
    description: l.description,
    quantity: l.quantity,
    unit_price: l.unit_price,
    discount_pct: l.discount_pct,
    line_subtotal: lineSubtotal(l.quantity, l.unit_price, l.discount_pct),
    position: i,
  }));
  if (itemsRows.length > 0) {
    const { error: iErr } = await supabase.from("quote_items").insert(itemsRows);
    if (iErr) {
      await supabase.from("quotes").delete().eq("id", quote.id);
      return { error: iErr.message };
    }
  }

  revalidatePath("/cotizaciones");
  return { id: quote.id };
}

export async function updateQuote(id: string, input: QuoteInput) {
  const supabase = await createClient();
  const totals = quoteTotals(input.lines, input.tax_rate);

  const { error: qErr } = await supabase.from("quotes").update({
    customer_id: input.customer_id,
    issue_date: input.issue_date,
    valid_until: input.valid_until,
    tax_rate: input.tax_rate,
    notes: input.notes,
    subtotal: totals.subtotal,
    tax_amount: totals.taxAmount,
    total: totals.total,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (qErr) return { error: qErr.message };

  const { error: dErr } = await supabase.from("quote_items").delete().eq("quote_id", id);
  if (dErr) return { error: dErr.message };

  const itemsRows = input.lines.map((l, i) => ({
    quote_id: id,
    product_id: l.product_id,
    description: l.description,
    quantity: l.quantity,
    unit_price: l.unit_price,
    discount_pct: l.discount_pct,
    line_subtotal: lineSubtotal(l.quantity, l.unit_price, l.discount_pct),
    position: i,
  }));
  if (itemsRows.length > 0) {
    const { error: iErr } = await supabase.from("quote_items").insert(itemsRows);
    if (iErr) return { error: iErr.message };
  }

  revalidatePath(`/cotizaciones/${id}`);
  revalidatePath("/cotizaciones");
  return { ok: true };
}

export async function setQuoteStatus(id: string, status: QuoteStatus) {
  const supabase = await createClient();
  const { error } = await supabase.from("quotes")
    .update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/cotizaciones/${id}`);
  revalidatePath("/cotizaciones");
  return { ok: true };
}
```

- [ ] **Step 2: Verificar build**

```bash
npm run build
```
Expected: compila. (El `.rpc("next_quote_seq", …)` está tipado por `db.ts`; `seq` es `number`.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/cotizaciones/actions.ts
git commit -m "feat(cotizaciones): server actions (create/update/setStatus)"
```

---

## Phase 4 — UI: lista

### Task 9: Sidebar + componente textarea

**Files:**
- Modify: `src/components/app-shell/sidebar.tsx`
- Create: `src/components/ui/textarea.tsx` (vía shadcn)

- [ ] **Step 1: Añadir el componente textarea de shadcn**

```bash
npx shadcn@latest add textarea
```
Expected: crea `src/components/ui/textarea.tsx`.

- [ ] **Step 2: Añadir la entrada al sidebar**

Modify `src/components/app-shell/sidebar.tsx`: añadir `FileText` al import de `lucide-react` y la entrada al array `NAV` (tras "Clientes"):
```tsx
import { Package, Users, FileText } from "lucide-react";

const NAV = [
  { href: "/inventario", label: "Inventario", icon: Package },
  { href: "/crm", label: "Clientes", icon: Users },
  { href: "/cotizaciones", label: "Cotizaciones", icon: FileText },
];
```
(Mantener el resto del archivo igual.)

- [ ] **Step 3: Verificar build**

```bash
npm run build
```
Expected: compila.

- [ ] **Step 4: Commit**

```bash
git add src/components/app-shell/sidebar.tsx src/components/ui/textarea.tsx components.json 2>/dev/null; git commit -m "feat(cotizaciones): sidebar entry + textarea component"
```

### Task 10: Tarjetas de resumen y tabla

**Files:**
- Create: `src/components/cotizaciones/summary-cards.tsx`
- Create: `src/components/cotizaciones/quote-table.tsx`

- [ ] **Step 1: Tarjetas de resumen**

Create `src/components/cotizaciones/summary-cards.tsx`:
```tsx
import { Card } from "@/components/ui/card";

export function SummaryCards({ totalQuotes, acceptedCount, acceptedAmount }:
  { totalQuotes: number; acceptedCount: number; acceptedAmount: number }) {
  const fmt = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
  const items = [
    { label: "Cotizaciones", value: String(totalQuotes) },
    { label: "Aceptadas", value: String(acceptedCount) },
    { label: "Importe aceptado", value: fmt.format(acceptedAmount) },
  ];
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {items.map((i) => (
        <Card key={i.label} className="p-4">
          <p className="text-sm text-neutral-500">{i.label}</p>
          <p className="text-2xl font-semibold">{i.value}</p>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Tabla con buscador y filtros**

Create `src/components/cotizaciones/quote-table.tsx`:
```tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { statusLabel, isExpired, type QuoteStatus } from "@/lib/cotizaciones/quote";
import type { QuoteListRow } from "@/lib/cotizaciones/queries";

const STATUS_VARIANT: Record<QuoteStatus, "default" | "secondary" | "outline" | "destructive"> = {
  borrador: "secondary",
  enviada: "default",
  aceptada: "default",
  rechazada: "destructive",
  caducada: "outline",
};

const fmt = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

export function QuoteTable({ quotes }: { quotes: QuoteListRow[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = quotes.filter((q) => {
    const t = search.trim().toLowerCase();
    const matchesSearch =
      !t || q.number.toLowerCase().includes(t) || (q.customer?.name ?? "").toLowerCase().includes(t);
    const matchesStatus = status === "all" || q.status === status;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Input
          aria-label="Buscar cotizaciones"
          placeholder="Buscar por número o cliente"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40" aria-label="Filtrar por estado"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="borrador">Borrador</SelectItem>
            <SelectItem value="enviada">Enviada</SelectItem>
            <SelectItem value="aceptada">Aceptada</SelectItem>
            <SelectItem value="rechazada">Rechazada</SelectItem>
            <SelectItem value="caducada">Caducada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-neutral-500">No hay cotizaciones que coincidan.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((q) => {
              const expired = isExpired(q.valid_until, q.status);
              return (
                <TableRow key={q.id}>
                  <TableCell>
                    <Link href={`/cotizaciones/${q.id}`} className="font-medium hover:underline">{q.number}</Link>
                  </TableCell>
                  <TableCell>{q.customer?.name ?? "—"}</TableCell>
                  <TableCell>{new Date(q.issue_date).toLocaleDateString("es-ES", { timeZone: "UTC" })}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[q.status]}>{statusLabel(q.status)}</Badge>
                    {expired && <Badge variant="outline" className="ml-2">Vencida</Badge>}
                  </TableCell>
                  <TableCell className="text-right">{fmt.format(q.total)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verificar build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/components/cotizaciones/summary-cards.tsx src/components/cotizaciones/quote-table.tsx
git commit -m "feat(cotizaciones): summary cards + quote table"
```

### Task 11: Página de lista

**Files:**
- Create: `src/app/(app)/cotizaciones/page.tsx`

- [ ] **Step 1: Escribir la página**

Create `src/app/(app)/cotizaciones/page.tsx`:
```tsx
import Link from "next/link";
import { listQuotes, quotesSummary } from "@/lib/cotizaciones/queries";
import { getActiveCompany } from "@/lib/active-company";
import { SummaryCards } from "@/components/cotizaciones/summary-cards";
import { QuoteTable } from "@/components/cotizaciones/quote-table";
import { Button } from "@/components/ui/button";

export default async function CotizacionesPage() {
  const company = await getActiveCompany();
  const [quotes, summary] = await Promise.all([listQuotes(company), quotesSummary(company)]);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cotizaciones</h1>
        <Button asChild><Link href="/cotizaciones/nueva">Nueva cotización</Link></Button>
      </div>
      <SummaryCards
        totalQuotes={summary.totalQuotes}
        acceptedCount={summary.acceptedCount}
        acceptedAmount={summary.acceptedAmount}
      />
      <QuoteTable quotes={quotes} />
    </div>
  );
}
```

- [ ] **Step 2: Verificar**

```bash
npm run dev
```
`/cotizaciones`: resumen en cero y "No hay cotizaciones que coincidan." sin errores. Parar con Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/cotizaciones/page.tsx"
git commit -m "feat(cotizaciones): list page + summary"
```

---

## Phase 5 — UI: editor

### Task 12: Editor de líneas dinámicas

**Files:**
- Create: `src/components/cotizaciones/line-items-editor.tsx`

- [ ] **Step 1: Escribir el componente**

Create `src/components/cotizaciones/line-items-editor.tsx`:
```tsx
"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { lineSubtotal } from "@/lib/cotizaciones/quote";
import type { QuoteLineInput } from "@/lib/cotizaciones/actions";

export type ProductOption = { id: string; name: string; price: number };

const fmt = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

export function LineItemsEditor({ lines, products, onChange }: {
  lines: QuoteLineInput[];
  products: ProductOption[];
  onChange: (lines: QuoteLineInput[]) => void;
}) {
  function update(i: number, patch: Partial<QuoteLineInput>) {
    onChange(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function addLine() {
    onChange([...lines, { product_id: null, description: "", quantity: 1, unit_price: 0, discount_pct: 0 }]);
  }
  function removeLine(i: number) {
    onChange(lines.filter((_, idx) => idx !== i));
  }
  function pickProduct(i: number, productId: string) {
    if (productId === "free") {
      update(i, { product_id: null });
      return;
    }
    const p = products.find((x) => x.id === productId);
    if (p) update(i, { product_id: p.id, description: p.name, unit_price: p.price });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        {lines.map((l, i) => (
          <div key={i} className="grid grid-cols-12 items-end gap-2 rounded-md border p-3">
            <div className="col-span-12 space-y-1 sm:col-span-3">
              <label className="text-xs text-neutral-500">Producto</label>
              <Select value={l.product_id ?? "free"} onValueChange={(v) => pickProduct(i, v)}>
                <SelectTrigger aria-label="Producto"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Línea libre</SelectItem>
                  {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-12 space-y-1 sm:col-span-3">
              <label className="text-xs text-neutral-500">Descripción</label>
              <Input value={l.description} onChange={(e) => update(i, { description: e.target.value })} required />
            </div>
            <div className="col-span-4 space-y-1 sm:col-span-1">
              <label className="text-xs text-neutral-500">Cant.</label>
              <Input type="number" step="0.01" min="0" value={l.quantity}
                onChange={(e) => update(i, { quantity: Number(e.target.value) })} />
            </div>
            <div className="col-span-4 space-y-1 sm:col-span-2">
              <label className="text-xs text-neutral-500">Precio</label>
              <Input type="number" step="0.01" min="0" value={l.unit_price}
                onChange={(e) => update(i, { unit_price: Number(e.target.value) })} />
            </div>
            <div className="col-span-4 space-y-1 sm:col-span-1">
              <label className="text-xs text-neutral-500">Desc. %</label>
              <Input type="number" step="0.01" min="0" max="100" value={l.discount_pct}
                onChange={(e) => update(i, { discount_pct: Number(e.target.value) })} />
            </div>
            <div className="col-span-8 text-right text-sm sm:col-span-1">
              {fmt.format(lineSubtotal(l.quantity, l.unit_price, l.discount_pct))}
            </div>
            <div className="col-span-4 sm:col-span-1">
              <Button type="button" variant="outline" size="sm" onClick={() => removeLine(i)}>Quitar</Button>
            </div>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" onClick={addLine}>Añadir línea</Button>
    </div>
  );
}
```

- [ ] **Step 2: Verificar build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/cotizaciones/line-items-editor.tsx
git commit -m "feat(cotizaciones): dynamic line items editor"
```

### Task 13: Editor de cotización (cabecera + totales) y página de alta

**Files:**
- Create: `src/components/cotizaciones/quote-editor.tsx`
- Create: `src/app/(app)/cotizaciones/nueva/page.tsx`

- [ ] **Step 1: Componente editor**

Create `src/components/cotizaciones/quote-editor.tsx`:
```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineItemsEditor, type ProductOption } from "./line-items-editor";
import { quoteTotals } from "@/lib/cotizaciones/quote";
import type { QuoteInput, QuoteLineInput } from "@/lib/cotizaciones/actions";

type Customer = { id: string; name: string };
const fmt = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

export type QuoteEditorDefaults = {
  customer_id?: string;
  issue_date?: string;
  valid_until?: string | null;
  tax_rate?: number;
  notes?: string | null;
  lines?: QuoteLineInput[];
};

export function QuoteEditor({ companyId, customers, products, defaults, action }: {
  companyId: string;
  customers: Customer[];
  products: ProductOption[];
  defaults?: QuoteEditorDefaults;
  action: (input: QuoteInput) => Promise<{ error?: string; id?: string; ok?: boolean }>;
}) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const [customerId, setCustomerId] = useState(defaults?.customer_id ?? "");
  const [issueDate, setIssueDate] = useState(defaults?.issue_date ?? today);
  const [validUntil, setValidUntil] = useState(defaults?.valid_until ?? "");
  const [taxRate, setTaxRate] = useState(defaults?.tax_rate ?? 21);
  const [notes, setNotes] = useState(defaults?.notes ?? "");
  const [lines, setLines] = useState<QuoteLineInput[]>(defaults?.lines ?? []);
  const [pending, setPending] = useState(false);

  const totals = quoteTotals(lines, taxRate);

  async function onSubmit() {
    if (!customerId) { alert("Selecciona un cliente."); return; }
    if (lines.length === 0) { alert("Añade al menos una línea."); return; }
    setPending(true);
    const res = await action({
      company_id: companyId,
      customer_id: customerId,
      issue_date: issueDate,
      valid_until: validUntil || null,
      tax_rate: taxRate,
      notes: notes || null,
      lines,
    });
    setPending(false);
    if (res?.error) { alert(res.error); return; }
    if (res?.id) router.push(`/cotizaciones/${res.id}`);
    else router.push("/cotizaciones");
  }

  return (
    <div className="space-y-6">
      <div className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Cliente</Label>
          <Select value={customerId} onValueChange={setCustomerId}>
            <SelectTrigger aria-label="Cliente"><SelectValue placeholder="Selecciona un cliente" /></SelectTrigger>
            <SelectContent>
              {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tax_rate">IVA %</Label>
          <Input id="tax_rate" type="number" step="0.01" min="0" value={taxRate}
            onChange={(e) => setTaxRate(Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="issue_date">Fecha</Label>
          <Input id="issue_date" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="valid_until">Válida hasta</Label>
          <Input id="valid_until" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Líneas</Label>
        <LineItemsEditor lines={lines} products={products} onChange={setLines} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div className="max-w-xs space-y-1 text-sm">
        <div className="flex justify-between"><span className="text-neutral-500">Base imponible</span><span>{fmt.format(totals.subtotal)}</span></div>
        <div className="flex justify-between"><span className="text-neutral-500">IVA ({taxRate}%)</span><span>{fmt.format(totals.taxAmount)}</span></div>
        <div className="flex justify-between font-semibold"><span>Total</span><span>{fmt.format(totals.total)}</span></div>
      </div>

      <Button onClick={onSubmit} disabled={pending}>{pending ? "Guardando…" : "Guardar cotización"}</Button>
    </div>
  );
}
```

- [ ] **Step 2: Página de alta**

Create `src/app/(app)/cotizaciones/nueva/page.tsx`:
```tsx
import { redirect } from "next/navigation";
import { getActiveCompany } from "@/lib/active-company";
import { customersForCompany, productsForCompany } from "@/lib/cotizaciones/queries";
import { createQuote } from "@/lib/cotizaciones/actions";
import { QuoteEditor } from "@/components/cotizaciones/quote-editor";

export default async function NuevaCotizacionPage() {
  const company = await getActiveCompany();
  if (company === "all") {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Nueva cotización</h1>
        <p className="text-sm text-neutral-500">Selecciona una empresa concreta en la cabecera para crear una cotización.</p>
      </div>
    );
  }
  const [customers, products] = await Promise.all([
    customersForCompany(company), productsForCompany(company),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Nueva cotización</h1>
      <QuoteEditor companyId={company} customers={customers} products={products} action={createQuote} />
    </div>
  );
}
```
Nota: el editor exige una empresa activa concreta (no "Todas") porque la cotización pertenece a una empresa y usa sus clientes/productos.

- [ ] **Step 3: Verificar**

```bash
npm run dev
```
Con una empresa activa, `/cotizaciones/nueva` muestra el formulario; añadir líneas actualiza los totales en vivo. Parar con Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add src/components/cotizaciones/quote-editor.tsx "src/app/(app)/cotizaciones/nueva/page.tsx"
git commit -m "feat(cotizaciones): quote editor + new quote page"
```

### Task 14: Página de edición

**Files:**
- Create: `src/app/(app)/cotizaciones/[id]/editar/page.tsx`

- [ ] **Step 1: Escribir la página**

Create `src/app/(app)/cotizaciones/[id]/editar/page.tsx`:
```tsx
import { getQuote, customersForCompany, productsForCompany } from "@/lib/cotizaciones/queries";
import { updateQuote } from "@/lib/cotizaciones/actions";
import { QuoteEditor } from "@/components/cotizaciones/quote-editor";

export default async function EditarCotizacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quote = await getQuote(id);
  const companyId = quote.company_id as string;
  const [customers, products] = await Promise.all([
    customersForCompany(companyId), productsForCompany(companyId),
  ]);
  const items = (quote.items ?? []) as Array<{
    product_id: string | null; description: string; quantity: number; unit_price: number; discount_pct: number; position: number;
  }>;
  const defaults = {
    customer_id: quote.customer_id as string,
    issue_date: quote.issue_date as string,
    valid_until: (quote.valid_until as string | null) ?? "",
    tax_rate: quote.tax_rate as number,
    notes: (quote.notes as string | null) ?? "",
    lines: [...items]
      .sort((a, b) => a.position - b.position)
      .map((it) => ({
        product_id: it.product_id,
        description: it.description,
        quantity: it.quantity,
        unit_price: it.unit_price,
        discount_pct: it.discount_pct,
      })),
  };
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Editar cotización {quote.number as string}</h1>
      <QuoteEditor
        companyId={companyId}
        customers={customers}
        products={products}
        defaults={defaults}
        action={updateQuote.bind(null, id)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verificar build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/cotizaciones/[id]/editar/page.tsx"
git commit -m "feat(cotizaciones): edit quote page"
```

---

## Phase 6 — UI: ficha, estados, vista imprimible

### Task 15: Vista de cotización, acciones de estado y ficha

**Files:**
- Create: `src/components/cotizaciones/quote-view.tsx`
- Create: `src/components/cotizaciones/status-actions.tsx`
- Create: `src/app/(app)/cotizaciones/[id]/page.tsx`

- [ ] **Step 1: Componente de vista (reutilizable ficha/imprimir)**

Create `src/components/cotizaciones/quote-view.tsx`:
```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const fmt = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString("es-ES", { timeZone: "UTC" }) : "—");

export type QuoteViewItem = {
  description: string; quantity: number; unit_price: number; discount_pct: number; line_subtotal: number; position: number;
};
export type QuoteViewData = {
  number: string;
  issue_date: string;
  valid_until: string | null;
  tax_rate: number;
  notes: string | null;
  subtotal: number;
  tax_amount: number;
  total: number;
  companyName: string;
  customerName: string;
  items: QuoteViewItem[];
};

export function QuoteView({ quote }: { quote: QuoteViewData }) {
  const items = [...quote.items].sort((a, b) => a.position - b.position);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <p className="text-lg font-semibold">{quote.companyName}</p>
          <p className="text-sm text-neutral-500">Cliente: {quote.customerName}</p>
        </div>
        <div className="text-sm">
          <p><span className="text-neutral-500">Nº:</span> <strong>{quote.number}</strong></p>
          <p><span className="text-neutral-500">Fecha:</span> {fmtDate(quote.issue_date)}</p>
          <p><span className="text-neutral-500">Válida hasta:</span> {fmtDate(quote.valid_until)}</p>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descripción</TableHead>
            <TableHead className="text-right">Cant.</TableHead>
            <TableHead className="text-right">Precio</TableHead>
            <TableHead className="text-right">Desc.</TableHead>
            <TableHead className="text-right">Subtotal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((it, i) => (
            <TableRow key={i}>
              <TableCell>{it.description}</TableCell>
              <TableCell className="text-right">{it.quantity}</TableCell>
              <TableCell className="text-right">{fmt.format(it.unit_price)}</TableCell>
              <TableCell className="text-right">{it.discount_pct}%</TableCell>
              <TableCell className="text-right">{fmt.format(it.line_subtotal)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="ml-auto max-w-xs space-y-1 text-sm">
        <div className="flex justify-between"><span className="text-neutral-500">Base imponible</span><span>{fmt.format(quote.subtotal)}</span></div>
        <div className="flex justify-between"><span className="text-neutral-500">IVA ({quote.tax_rate}%)</span><span>{fmt.format(quote.tax_amount)}</span></div>
        <div className="flex justify-between font-semibold"><span>Total</span><span>{fmt.format(quote.total)}</span></div>
      </div>

      {quote.notes && <div className="text-sm"><span className="text-neutral-500">Notas:</span> {quote.notes}</div>}
    </div>
  );
}
```

- [ ] **Step 2: Acciones de estado**

Create `src/components/cotizaciones/status-actions.tsx`:
```tsx
"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { setQuoteStatus } from "@/lib/cotizaciones/actions";
import type { QuoteStatus } from "@/lib/cotizaciones/quote";

const NEXT: { status: QuoteStatus; label: string }[] = [
  { status: "enviada", label: "Marcar enviada" },
  { status: "aceptada", label: "Marcar aceptada" },
  { status: "rechazada", label: "Marcar rechazada" },
  { status: "caducada", label: "Marcar caducada" },
];

export function StatusActions({ id, current }: { id: string; current: QuoteStatus }) {
  const router = useRouter();
  async function change(status: QuoteStatus) {
    const res = await setQuoteStatus(id, status);
    if (res?.error) { alert(res.error); return; }
    router.refresh();
  }
  return (
    <div className="flex flex-wrap gap-2">
      {NEXT.filter((n) => n.status !== current).map((n) => (
        <Button key={n.status} variant="outline" size="sm" onClick={() => change(n.status)}>{n.label}</Button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Página ficha**

Create `src/app/(app)/cotizaciones/[id]/page.tsx`:
```tsx
import Link from "next/link";
import { getQuote } from "@/lib/cotizaciones/queries";
import { statusLabel, isExpired, type QuoteStatus } from "@/lib/cotizaciones/quote";
import { QuoteView, type QuoteViewItem } from "@/components/cotizaciones/quote-view";
import { StatusActions } from "@/components/cotizaciones/status-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function CotizacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quote = await getQuote(id);
  const status = quote.status as QuoteStatus;
  const customer = quote.customer as { name: string } | null;
  const company = quote.company as { name: string } | null;
  const items = ((quote.items ?? []) as QuoteViewItem[]);
  const expired = isExpired(quote.valid_until as string | null, status);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{quote.number as string}</h1>
          <p className="text-sm text-neutral-500">
            <Badge variant="secondary">{statusLabel(status)}</Badge>
            {expired && <Badge variant="outline" className="ml-2">Vencida</Badge>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link href={`/cotizaciones/${id}/editar`}>Editar</Link></Button>
          <Button asChild variant="outline"><Link href={`/cotizaciones/${id}/imprimir`}>Imprimir</Link></Button>
        </div>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 font-medium">Cambiar estado</h2>
        <StatusActions id={id} current={status} />
      </Card>

      <Card className="p-4">
        <QuoteView quote={{
          number: quote.number as string,
          issue_date: quote.issue_date as string,
          valid_until: quote.valid_until as string | null,
          tax_rate: quote.tax_rate as number,
          notes: quote.notes as string | null,
          subtotal: quote.subtotal as number,
          tax_amount: quote.tax_amount as number,
          total: quote.total as number,
          companyName: company?.name ?? "—",
          customerName: customer?.name ?? "—",
          items,
        }} />
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: Verificar build**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/components/cotizaciones/quote-view.tsx src/components/cotizaciones/status-actions.tsx "src/app/(app)/cotizaciones/[id]/page.tsx"
git commit -m "feat(cotizaciones): quote detail page + status actions + view"
```

### Task 16: Vista imprimible

**Files:**
- Create: `src/app/(app)/cotizaciones/[id]/imprimir/page.tsx`
- Modify: `src/app/(app)/layout.tsx` (ocultar el shell al imprimir)

- [ ] **Step 1: Ocultar el app shell al imprimir**

Leer `src/app/(app)/layout.tsx`. Tiene un `<aside>` (sidebar + selector de empresa) y un `<main>`. Añadir la utilidad `print:hidden` a la clase del elemento `<aside>` para que NO aparezca en la impresión, y `print:p-0` al `<main>` para que el documento ocupe la página. Ejemplo (ajustar a las clases reales que tenga el archivo):
```tsx
// <aside className="border-b md:w-60 md:border-b-0 md:border-r">  ->  añadir print:hidden
<aside className="border-b md:w-60 md:border-b-0 md:border-r print:hidden">
// <main className="flex-1 p-4 md:p-8">  ->  añadir print:p-0
<main className="flex-1 p-4 md:p-8 print:p-0">
```
No cambiar nada más del layout. Así cualquier página imprime limpia, y la vista `/imprimir` (que solo renderiza el documento, sin botones) sale como un presupuesto limpio listo para "Guardar como PDF".

- [ ] **Step 2: Escribir la vista imprimible**

Create `src/app/(app)/cotizaciones/[id]/imprimir/page.tsx`:
```tsx
import { getQuote } from "@/lib/cotizaciones/queries";
import { QuoteView, type QuoteViewItem } from "@/components/cotizaciones/quote-view";

export default async function ImprimirCotizacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quote = await getQuote(id);
  const customer = quote.customer as { name: string } | null;
  const company = quote.company as { name: string } | null;
  const items = ((quote.items ?? []) as QuoteViewItem[]);

  return (
    <div className="mx-auto max-w-3xl bg-white p-8 text-neutral-900">
      <QuoteView quote={{
        number: quote.number as string,
        issue_date: quote.issue_date as string,
        valid_until: quote.valid_until as string | null,
        tax_rate: quote.tax_rate as number,
        notes: quote.notes as string | null,
        subtotal: quote.subtotal as number,
        tax_amount: quote.tax_amount as number,
        total: quote.total as number,
        companyName: company?.name ?? "—",
        customerName: customer?.name ?? "—",
        items,
      }} />
    </div>
  );
}
```
Nota: la ruta vive dentro de `(app)` (queda protegida por auth). El `print:hidden` del Step 1 oculta el sidebar al imprimir, así que esta página —que solo renderiza el documento— sale limpia con "Imprimir" → "Guardar como PDF". El contenedor `max-w-3xl` centra el documento.

- [ ] **Step 3: Verificar build e impresión**

```bash
npm run build
```
Opcional en `npm run dev`: abrir `/cotizaciones/[id]/imprimir` y en la vista previa de impresión del navegador confirmar que el sidebar no aparece.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(app)/cotizaciones/[id]/imprimir/page.tsx" "src/app/(app)/layout.tsx"
git commit -m "feat(cotizaciones): printable quote view + print-hidden shell"
```

---

## Phase 7 — Verificación, flujo end-to-end y deploy

### Task 17: Suite de tests, build y prueba manual

**Files:** (ninguno nuevo)

- [ ] **Step 1: Tests**

```bash
npm test
```
Expected: PASS — incluye los tests de `quote.test.ts` además de Inventario y CRM.

- [ ] **Step 2: Build**

```bash
npm run build
```
Expected: compila sin errores; rutas `/cotizaciones`, `/cotizaciones/nueva`, `/cotizaciones/[id]`, `/cotizaciones/[id]/editar`, `/cotizaciones/[id]/imprimir` presentes.

- [ ] **Step 3: Flujo end-to-end (dev)**

```bash
npm run dev
```
Login como owner, con una empresa concreta activa:
1. `/cotizaciones/nueva` → elegir cliente, añadir una línea desde un producto (prerellena precio) y una línea libre, poner descuento → los totales (base/IVA/total) cuadran → guardar → redirige a la ficha.
2. En la ficha: el número es `PREFIJO-AÑO-0001`; cambiar estado a "enviada" y luego "aceptada" → se refleja.
3. `/cotizaciones` → la cotización aparece; el resumen cuenta aceptadas e importe.
4. Editar la cotización (cambiar una cantidad) → totales recalculados.
5. "Imprimir" → vista limpia del documento.
6. Cambiar de empresa en el selector → la lista solo muestra cotizaciones de la empresa activa (aislamiento RLS).
Parar con Ctrl+C.

- [ ] **Step 4: Verificación RLS como owner**

Crear una cotización en "Juana Sánchez" y otra en "Lolikas"; con el selector en "Lolikas" solo se ve la de Lolikas; en "Todas" se ven ambas.

### Task 18: Merge a main y deploy

**Files:** (ninguno nuevo)

- [ ] **Step 1: Asegurar build + tests verdes** (Task 17 completada).

- [ ] **Step 2: Merge a main (rama de integración del deploy)**

```bash
git checkout main
git merge --ff-only <rama-feature>
```
Expected: fast-forward (la rama feature salió de main).

- [ ] **Step 3: Push (dispara deploy en Vercel)**

```bash
git push origin main
```
Expected: Vercel arranca un deployment de producción del commit nuevo.

- [ ] **Step 4: Verificar deploy y migraciones**

Vía Supabase MCP `list_migrations`: `0009_quotes` y `0010_quotes_rls` aplicadas.
Vía Vercel MCP `list_deployments` (projectId `prj_hIEU1GOM7JH457ZrWPxyYtcFBqkJ`, teamId `team_Zy4UDnbxRqU9SqD02b8uulQq`): el deployment del commit en estado READY.
Smoke test: `https://juana-sanchez-panel.vercel.app/cotizaciones` redirige a `/login` sin sesión (ruta desplegada y protegida).

---

## Notas de ejecución

- **Migraciones primero:** Tasks 1-3 antes de queries/actions (dependen de tablas, RPC y tipos).
- **RLS:** todas las lecturas/escrituras pasan por políticas; `quote_counters` solo lo toca el RPC `next_quote_seq` (security definer).
- **Empresa activa concreta para crear:** el editor requiere una empresa seleccionada (no "Todas"), porque la cotización pertenece a una empresa y usa sus clientes/productos.
- **Totales como snapshot:** se calculan con las funciones puras y se guardan en `quotes`/`quote_items`; la UI del editor los recalcula en vivo con las mismas funciones (sin divergencia).
- **Reutilización:** clientes vía `customers` (CRM), productos vía `products` (Inventario). No se recrea nada de esos módulos.
- **Siguiente módulo (fuera de este plan):** Ventas — convertirá una cotización aceptada en venta y descontará stock (reutilizando `quote_id`).
```
