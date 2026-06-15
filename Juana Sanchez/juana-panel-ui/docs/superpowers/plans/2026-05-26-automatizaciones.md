# Automatizaciones (motor de alertas) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el módulo `/automatizaciones`: motor determinista de alertas en vivo sobre los datos del panel (stock bajo, cotizaciones por caducar, ventas pendientes de cobro, tareas vencidas, clientas inactivas), con un catálogo fijo de reglas de umbral configurable.

**Architecture:** Tabla `automation_rules` (config global del owner: on/off + umbral por regla, RLS `is_owner()`). Lógica pura testeable en `src/lib/automatizaciones/rules.ts` (catálogo + helpers de fechas + filtros por regla). `queries.ts` orquesta el fetch por empresa activa y aplica los filtros puros → `AlertResult[]`. UI Atelier en `src/components/automatizaciones/` y rutas `src/app/(app)/automatizaciones/`. Sin IA, sin cron, sin secretos nuevos; todo se calcula al vuelo con RLS.

**Tech Stack:** Next.js 16 (App Router, server actions), Supabase (Postgres + RLS + `is_owner()`), shadcn/ui, Atelier (tokens `ink`/`line`/`paper`/`elevated`, Badge), sonner, Vitest.

**Reglas del proyecto (obligatorias):** NO tocar `src/components/app-shell/sidebar.tsx` (la entrada la enciende la terminal de diseño). Namespace propio `automatizaciones`. Migraciones `0028`/`0029` (siguiente libre tras `0027_wholesale_accounts`). Integrar por `main`. Rama de trabajo: `feat/automatizaciones`. Supabase project_id: `hfwhrwdmwgdicpsfdvyq`.

---

## File Structure

- `supabase/migrations/0028_automation_rules.sql` — tabla de config.
- `supabase/migrations/0029_automation_rules_rls.sql` — RLS owner-only.
- `src/types/db.ts` — regenerado (añade `automation_rules`).
- `src/lib/automatizaciones/rules.ts` — catálogo + lógica pura (fechas, umbral, filtros).
- `src/lib/automatizaciones/rules.test.ts` — tests Vitest.
- `src/lib/automatizaciones/queries.ts` — `getRulesConfig`, `evaluateAlerts`.
- `src/lib/automatizaciones/actions.ts` — `updateRuleConfig`.
- `src/components/automatizaciones/alert-card.tsx` — tarjeta de una regla.
- `src/components/automatizaciones/alert-list.tsx` — grilla de tarjetas + estado vacío.
- `src/components/automatizaciones/rule-settings-form.tsx` — ajustes (client).
- `src/app/(app)/automatizaciones/page.tsx` — panel de alertas.
- `src/app/(app)/automatizaciones/ajustes/page.tsx` — ajustes.

---

### Task 1: Migración de esquema (`automation_rules`)

**Files:**
- Create: `supabase/migrations/0028_automation_rules.sql`
- DB: aplicar vía Supabase MCP `apply_migration` (project_id `hfwhrwdmwgdicpsfdvyq`)

- [ ] **Step 1: Escribir el archivo de migración**

Crear `supabase/migrations/0028_automation_rules.sql` con exactamente:

```sql
create table public.automation_rules (
  rule_key text primary key,
  enabled boolean not null default true,
  threshold integer,
  updated_at timestamptz not null default now()
);
```

- [ ] **Step 2: Aplicar la migración a la BD**

Usar MCP `apply_migration` con `project_id` = `hfwhrwdmwgdicpsfdvyq`, `name` = `automation_rules`, `query` = el SQL del Step 1. Esperado: éxito sin error.

- [ ] **Step 3: Verificar la tabla**

Usar MCP `execute_sql` (project_id `hfwhrwdmwgdicpsfdvyq`):

```sql
select to_regclass('public.automation_rules') as tabla;
```

Esperado: `automation_rules` (no nulo).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0028_automation_rules.sql
git commit -m "feat(automatizaciones): tabla automation_rules (config de reglas)"
```

---

### Task 2: Migración RLS + regenerar tipos

**Files:**
- Create: `supabase/migrations/0029_automation_rules_rls.sql`
- Modify: `src/types/db.ts` (regenerado)

- [ ] **Step 1: Escribir el archivo de migración RLS**

Crear `supabase/migrations/0029_automation_rules_rls.sql` con exactamente:

```sql
alter table public.automation_rules enable row level security;

create policy "automation_rules solo owner" on public.automation_rules
  for all to authenticated
  using (public.is_owner())
  with check (public.is_owner());
```

- [ ] **Step 2: Aplicar la migración**

Usar MCP `apply_migration` (project_id `hfwhrwdmwgdicpsfdvyq`, name `automation_rules_rls`, query = el SQL del Step 1). Esperado: éxito.

- [ ] **Step 3: Regenerar tipos**

Usar MCP `generate_typescript_types` (project_id `hfwhrwdmwgdicpsfdvyq`). Sobrescribir `src/types/db.ts` con el campo `types` devuelto (contenido literal, sin escapar, sin marcadores de conflicto). Debe contener `automation_rules`.

- [ ] **Step 4: Verificar build**

Run: `npm run build`
Expected: compila sin errores de TypeScript.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0029_automation_rules_rls.sql src/types/db.ts
git commit -m "feat(automatizaciones): RLS owner-only + tipos regenerados"
```

---

### Task 3: Lógica pura (TDD) — `rules.ts`

**Files:**
- Create: `src/lib/automatizaciones/rules.ts`
- Test: `src/lib/automatizaciones/rules.test.ts`

- [ ] **Step 1: Escribir el test que falla**

Crear `src/lib/automatizaciones/rules.test.ts` con exactamente:

```ts
import { describe, it, expect } from "vitest";
import {
  daysUntil, daysSince, effectiveThreshold,
  productsLowStock, quotesExpiring, salesOverdue, tasksOverdue, customersInactive,
} from "./rules";

const today = new Date("2026-05-26T12:00:00Z");

describe("daysUntil / daysSince", () => {
  it("calcula días de calendario, futuros y pasados", () => {
    expect(daysUntil("2026-05-29", today)).toBe(3);
    expect(daysUntil("2026-05-26", today)).toBe(0);
    expect(daysUntil("2026-05-20", today)).toBe(-6);
    expect(daysSince("2026-05-20", today)).toBe(6);
  });
});

describe("effectiveThreshold", () => {
  it("usa el umbral configurado o el default del catálogo", () => {
    expect(effectiveThreshold({ cotizaciones_por_caducar: { enabled: true, threshold: 14 } }, "cotizaciones_por_caducar")).toBe(14);
    expect(effectiveThreshold({}, "cotizaciones_por_caducar")).toBe(7);
    expect(effectiveThreshold({ clientas_inactivas: { enabled: true, threshold: null } }, "clientas_inactivas")).toBe(90);
  });
});

describe("productsLowStock", () => {
  it("marca productos con stock <= umbral (umbral > 0) y enlaza al detalle", () => {
    const items = productsLowStock([
      { id: "a", name: "Vestido", stock: 1, threshold: 3 },
      { id: "b", name: "Bolso", stock: 10, threshold: 3 },
      { id: "c", name: "Sin umbral", stock: 0, threshold: 0 },
    ]);
    expect(items.map((i) => i.id)).toEqual(["a"]);
    expect(items[0].href).toBe("/inventario/a");
  });
});

describe("quotesExpiring", () => {
  it("incluye borrador/enviada por caducar o vencidas; ignora cerradas y sin fecha", () => {
    const items = quotesExpiring([
      { id: "q1", number: "JS-1", valid_until: "2026-05-29", status: "enviada" },
      { id: "q2", number: "JS-2", valid_until: "2026-05-20", status: "borrador" },
      { id: "q3", number: "JS-3", valid_until: "2026-07-01", status: "enviada" },
      { id: "q4", number: "JS-4", valid_until: "2026-05-27", status: "aceptada" },
      { id: "q5", number: "JS-5", valid_until: null, status: "enviada" },
    ], 7, today);
    expect(items.map((i) => i.id)).toEqual(["q1", "q2"]);
  });
});

describe("salesOverdue", () => {
  it("marca ventas pendientes con más de N días de antigüedad", () => {
    const items = salesOverdue([
      { id: "s1", number: "V-1", sale_date: "2026-05-01", status: "pendiente" },
      { id: "s2", number: "V-2", sale_date: "2026-05-20", status: "pendiente" },
      { id: "s3", number: "V-3", sale_date: "2026-04-01", status: "pagada" },
    ], 15, today);
    expect(items.map((i) => i.id)).toEqual(["s1"]);
  });
});

describe("tasksOverdue", () => {
  it("marca tareas con fecha pasada y no hechas", () => {
    const items = tasksOverdue([
      { id: "t1", title: "Llamar", due_date: "2026-05-20", status: "pendiente" },
      { id: "t2", title: "Enviar", due_date: "2026-05-30", status: "pendiente" },
      { id: "t3", title: "Hecho", due_date: "2026-05-01", status: "hecha" },
      { id: "t4", title: "Sin fecha", due_date: null, status: "en_curso" },
    ], today);
    expect(items.map((i) => i.id)).toEqual(["t1"]);
  });
});

describe("customersInactive", () => {
  it("marca clientas activas sin actividad reciente o sin actividad alguna", () => {
    const items = customersInactive(
      [
        { id: "c1", name: "Ana", status: "active" },
        { id: "c2", name: "Bea", status: "active" },
        { id: "c3", name: "Cleo", status: "inactive" },
        { id: "c4", name: "Dani", status: "active" },
      ],
      { c1: "2026-01-01", c2: "2026-05-10", c3: null, c4: null },
      90,
      today,
    );
    expect(items.map((i) => i.id)).toEqual(["c1", "c4"]);
  });
});
```

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Run: `npm test -- rules.test`
Expected: FAIL (no existe `./rules`).

- [ ] **Step 3: Implementar la lógica mínima**

Crear `src/lib/automatizaciones/rules.ts` con exactamente:

```ts
export type Severity = "alta" | "media" | "baja";

export type RuleDef = {
  key: string;
  label: string;
  hasThreshold: boolean;
  defaultThreshold: number;
  severity: Severity;
};

export const RULES: RuleDef[] = [
  { key: "stock_bajo", label: "Stock bajo", hasThreshold: false, defaultThreshold: 0, severity: "alta" },
  { key: "cotizaciones_por_caducar", label: "Cotizaciones por caducar", hasThreshold: true, defaultThreshold: 7, severity: "media" },
  { key: "ventas_pendientes_cobro", label: "Ventas pendientes de cobro", hasThreshold: true, defaultThreshold: 15, severity: "alta" },
  { key: "tareas_vencidas", label: "Tareas vencidas", hasThreshold: false, defaultThreshold: 0, severity: "media" },
  { key: "clientas_inactivas", label: "Clientas inactivas", hasThreshold: true, defaultThreshold: 90, severity: "baja" },
];

export type RuleConfig = { enabled: boolean; threshold: number | null };
export type AlertItem = { id: string; label: string; href: string; meta?: string };

const MS_PER_DAY = 86_400_000;
function dayUTC(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function daysUntil(dateISO: string, today: Date): number {
  return Math.round((dayUTC(new Date(dateISO)) - dayUTC(today)) / MS_PER_DAY);
}

export function daysSince(dateISO: string, today: Date): number {
  return -daysUntil(dateISO, today);
}

export function effectiveThreshold(config: Record<string, RuleConfig>, key: string): number {
  const fallback = RULES.find((r) => r.key === key)?.defaultThreshold ?? 0;
  const t = config[key]?.threshold;
  return t == null ? fallback : t;
}

export function productsLowStock(
  rows: { id: string; name: string; stock: number; threshold: number }[],
): AlertItem[] {
  return rows
    .filter((r) => r.threshold > 0 && r.stock <= r.threshold)
    .map((r) => ({ id: r.id, label: r.name, href: `/inventario/${r.id}`, meta: `${r.stock} uds (mín. ${r.threshold})` }));
}

export function quotesExpiring(
  rows: { id: string; number: string; valid_until: string | null; status: string }[],
  days: number,
  today: Date,
): AlertItem[] {
  return rows
    .filter((r) => (r.status === "borrador" || r.status === "enviada") && r.valid_until != null && daysUntil(r.valid_until, today) <= days)
    .map((r) => {
      const d = daysUntil(r.valid_until as string, today);
      const meta = d < 0 ? `vencida hace ${-d} d` : d === 0 ? "vence hoy" : `vence en ${d} d`;
      return { id: r.id, label: r.number, href: `/cotizaciones/${r.id}`, meta };
    });
}

export function salesOverdue(
  rows: { id: string; number: string; sale_date: string; status: string }[],
  days: number,
  today: Date,
): AlertItem[] {
  return rows
    .filter((r) => r.status === "pendiente" && daysSince(r.sale_date, today) > days)
    .map((r) => ({ id: r.id, label: r.number, href: `/ventas/${r.id}`, meta: `${daysSince(r.sale_date, today)} d sin cobrar` }));
}

export function tasksOverdue(
  rows: { id: string; title: string; due_date: string | null; status: string }[],
  today: Date,
): AlertItem[] {
  return rows
    .filter((r) => r.status !== "hecha" && r.due_date != null && daysUntil(r.due_date, today) < 0)
    .map((r) => ({ id: r.id, label: r.title, href: `/tareas`, meta: `vencida hace ${-daysUntil(r.due_date as string, today)} d` }));
}

export function customersInactive(
  rows: { id: string; name: string; status: string }[],
  lastActivity: Record<string, string | null>,
  days: number,
  today: Date,
): AlertItem[] {
  return rows
    .filter((r) => r.status === "active")
    .filter((r) => {
      const la = lastActivity[r.id];
      return la == null || daysSince(la, today) > days;
    })
    .map((r) => {
      const la = lastActivity[r.id];
      const meta = la == null ? "sin actividad" : `${daysSince(la, today)} d inactiva`;
      return { id: r.id, label: r.name, href: `/crm/${r.id}`, meta };
    });
}
```

- [ ] **Step 4: Ejecutar el test para verificar que pasa**

Run: `npm test -- rules.test`
Expected: PASS (7 describes verdes).

- [ ] **Step 5: Commit**

```bash
git add src/lib/automatizaciones/rules.ts src/lib/automatizaciones/rules.test.ts
git commit -m "feat(automatizaciones): catálogo + lógica pura de reglas (fechas, umbral, filtros) con tests"
```

---

### Task 4: Capa de datos — `queries.ts` y `actions.ts`

**Files:**
- Create: `src/lib/automatizaciones/queries.ts`
- Create: `src/lib/automatizaciones/actions.ts`

**Contexto de reutilización:** `@/lib/inventory/queries` ya exporta `listProducts(companyFilter)` que devuelve productos con `stock` y `low_stock_threshold` (lectura, reutilizable). Las columnas reales: `quotes(id,number,valid_until,status,company_id)`, `sales(id,number,sale_date,status,company_id,customer_id)`, `tasks(id,title,due_date,status,company_id)`, `customers(id,name,status,company_id)`, `interactions(customer_id,occurred_at)`.

- [ ] **Step 1: Escribir `queries.ts`**

Crear `src/lib/automatizaciones/queries.ts` con exactamente:

```ts
import { createClient } from "@/lib/supabase/server";
import { listProducts } from "@/lib/inventory/queries";
import {
  RULES, effectiveThreshold,
  productsLowStock, quotesExpiring, salesOverdue, tasksOverdue, customersInactive,
  type RuleConfig, type AlertItem, type Severity,
} from "./rules";

export type AlertResult = {
  ruleKey: string;
  label: string;
  severity: Severity;
  count: number;
  items: AlertItem[];
};

export async function getRulesConfig(): Promise<Record<string, RuleConfig>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("automation_rules").select("rule_key,enabled,threshold");
  if (error) throw error;
  const map: Record<string, RuleConfig> = {};
  for (const r of data ?? []) map[r.rule_key] = { enabled: r.enabled, threshold: r.threshold };
  return map;
}

function ruleMeta(key: string) {
  return RULES.find((r) => r.key === key)!;
}

function isEnabled(config: Record<string, RuleConfig>, key: string): boolean {
  return config[key]?.enabled ?? true;
}

function pushResult(results: AlertResult[], key: string, items: AlertItem[]) {
  if (items.length === 0) return;
  const m = ruleMeta(key);
  results.push({ ruleKey: key, label: m.label, severity: m.severity, count: items.length, items });
}

export async function evaluateAlerts(companyFilter: string | "all"): Promise<AlertResult[]> {
  const supabase = await createClient();
  const config = await getRulesConfig();
  const today = new Date();
  const results: AlertResult[] = [];

  if (isEnabled(config, "stock_bajo")) {
    const products = await listProducts(companyFilter);
    pushResult(results, "stock_bajo", productsLowStock(
      products.map((p) => ({ id: p.id, name: p.name, stock: p.stock, threshold: p.low_stock_threshold })),
    ));
  }

  if (isEnabled(config, "cotizaciones_por_caducar")) {
    let q = supabase.from("quotes").select("id,number,valid_until,status,company_id").in("status", ["borrador", "enviada"]);
    if (companyFilter !== "all") q = q.eq("company_id", companyFilter);
    const { data, error } = await q;
    if (error) throw error;
    pushResult(results, "cotizaciones_por_caducar",
      quotesExpiring(data ?? [], effectiveThreshold(config, "cotizaciones_por_caducar"), today));
  }

  if (isEnabled(config, "ventas_pendientes_cobro")) {
    let q = supabase.from("sales").select("id,number,sale_date,status,company_id").eq("status", "pendiente");
    if (companyFilter !== "all") q = q.eq("company_id", companyFilter);
    const { data, error } = await q;
    if (error) throw error;
    pushResult(results, "ventas_pendientes_cobro",
      salesOverdue(data ?? [], effectiveThreshold(config, "ventas_pendientes_cobro"), today));
  }

  if (isEnabled(config, "tareas_vencidas")) {
    let q = supabase.from("tasks").select("id,title,due_date,status,company_id").neq("status", "hecha");
    if (companyFilter !== "all") q = q.eq("company_id", companyFilter);
    const { data, error } = await q;
    if (error) throw error;
    pushResult(results, "tareas_vencidas", tasksOverdue(data ?? [], today));
  }

  if (isEnabled(config, "clientas_inactivas")) {
    let cq = supabase.from("customers").select("id,name,status,company_id").eq("status", "active");
    if (companyFilter !== "all") cq = cq.eq("company_id", companyFilter);
    const { data: customers, error: cErr } = await cq;
    if (cErr) throw cErr;
    const ids = (customers ?? []).map((c) => c.id);
    const lastActivity: Record<string, string | null> = {};
    for (const c of customers ?? []) lastActivity[c.id] = null;
    if (ids.length > 0) {
      const { data: ints, error: iErr } = await supabase
        .from("interactions").select("customer_id,occurred_at").in("customer_id", ids);
      if (iErr) throw iErr;
      const { data: sales, error: sErr } = await supabase
        .from("sales").select("customer_id,sale_date").in("customer_id", ids);
      if (sErr) throw sErr;
      const bump = (cid: string, dateISO: string) => {
        const day = dateISO.slice(0, 10);
        const cur = lastActivity[cid];
        if (cur == null || day > cur) lastActivity[cid] = day;
      };
      for (const i of ints ?? []) bump(i.customer_id, i.occurred_at);
      for (const s of sales ?? []) { if (s.customer_id) bump(s.customer_id, s.sale_date); }
    }
    pushResult(results, "clientas_inactivas", customersInactive(
      (customers ?? []).map((c) => ({ id: c.id, name: c.name, status: c.status })),
      lastActivity,
      effectiveThreshold(config, "clientas_inactivas"),
      today,
    ));
  }

  return results;
}
```

- [ ] **Step 2: Escribir `actions.ts`**

Crear `src/lib/automatizaciones/actions.ts` con exactamente:

```ts
"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateRuleConfig(ruleKey: string, formData: FormData) {
  const supabase = await createClient();
  const enabled = formData.get("enabled") === "on";
  const raw = formData.get("threshold");
  const threshold = raw == null || String(raw).trim() === "" ? null : Number(raw);
  const { error } = await supabase.from("automation_rules").upsert({
    rule_key: ruleKey,
    enabled,
    threshold,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };
  revalidatePath("/automatizaciones");
  revalidatePath("/automatizaciones/ajustes");
  return { ok: true };
}
```

- [ ] **Step 3: Verificar build**

Run: `npm run build`
Expected: compila sin errores (las tablas existen en `db.ts` desde Task 2; `listProducts` ya existe).

- [ ] **Step 4: Commit**

```bash
git add src/lib/automatizaciones/queries.ts src/lib/automatizaciones/actions.ts
git commit -m "feat(automatizaciones): capa de datos (getRulesConfig, evaluateAlerts, updateRuleConfig)"
```

---

### Task 5: Componentes (Atelier-native)

**Files:**
- Create: `src/components/automatizaciones/alert-card.tsx`
- Create: `src/components/automatizaciones/alert-list.tsx`
- Create: `src/components/automatizaciones/rule-settings-form.tsx`

- [ ] **Step 1: Escribir `alert-card.tsx`**

Crear `src/components/automatizaciones/alert-card.tsx` con exactamente:

```tsx
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { AlertResult } from "@/lib/automatizaciones/queries";

const SEVERITY_VARIANT: Record<string, "destructive" | "default" | "secondary"> = {
  alta: "destructive",
  media: "default",
  baja: "secondary",
};

export function AlertCard({ alert }: { alert: AlertResult }) {
  return (
    <Card className="p-4">
      <h2 className="mb-3 flex items-center gap-2 font-medium text-ink">
        {alert.label}
        <Badge variant={SEVERITY_VARIANT[alert.severity]}>{alert.count}</Badge>
      </h2>
      <ul className="space-y-1">
        {alert.items.slice(0, 8).map((it) => (
          <li key={it.id} className="flex items-center justify-between gap-3 text-sm">
            <Link href={it.href} className="truncate text-ink hover:underline">{it.label}</Link>
            {it.meta && <span className="shrink-0 font-mono text-[11px] text-ink-4">{it.meta}</span>}
          </li>
        ))}
        {alert.items.length > 8 && (
          <li className="text-xs text-ink-4">+{alert.items.length - 8} más</li>
        )}
      </ul>
    </Card>
  );
}
```

- [ ] **Step 2: Escribir `alert-list.tsx`**

Crear `src/components/automatizaciones/alert-list.tsx` con exactamente:

```tsx
import { AlertCard } from "./alert-card";
import type { AlertResult } from "@/lib/automatizaciones/queries";

export function AlertList({ alerts }: { alerts: AlertResult[] }) {
  if (alerts.length === 0) {
    return <p className="text-sm text-ink-3">Todo en orden. No hay alertas activas.</p>;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {alerts.map((a) => <AlertCard key={a.ruleKey} alert={a} />)}
    </div>
  );
}
```

- [ ] **Step 3: Escribir `rule-settings-form.tsx`**

Crear `src/components/automatizaciones/rule-settings-form.tsx` con exactamente:

```tsx
"use client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RULES, type RuleConfig } from "@/lib/automatizaciones/rules";
import { updateRuleConfig } from "@/lib/automatizaciones/actions";

export function RuleSettingsForm({ config }: { config: Record<string, RuleConfig> }) {
  const router = useRouter();
  return (
    <div className="space-y-3">
      {RULES.map((rule) => {
        const cfg = config[rule.key];
        const enabled = cfg?.enabled ?? true;
        const threshold = cfg?.threshold ?? rule.defaultThreshold;
        async function onSubmit(fd: FormData) {
          const res = await updateRuleConfig(rule.key, fd);
          if (res?.error) { toast.error(res.error); return; }
          toast.success("Regla actualizada");
          router.refresh();
        }
        return (
          <form key={rule.key} action={onSubmit}
            className="flex flex-wrap items-center gap-3 rounded-md border border-line bg-elevated p-3">
            <p className="min-w-0 flex-1 font-medium text-ink">{rule.label}</p>
            <label className="flex items-center gap-2 text-sm text-ink-3">
              <input type="checkbox" name="enabled" defaultChecked={enabled} className="h-4 w-4" />
              Activada
            </label>
            {rule.hasThreshold && (
              <div className="flex items-center gap-2">
                <Label htmlFor={`th-${rule.key}`} className="text-sm text-ink-3">Umbral (días)</Label>
                <Input id={`th-${rule.key}`} name="threshold" type="number" defaultValue={threshold} className="w-24" />
              </div>
            )}
            <Button type="submit" variant="outline" size="sm">Guardar</Button>
          </form>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Verificar build**

Run: `npm run build`
Expected: compila sin errores.

- [ ] **Step 5: Commit**

```bash
git add src/components/automatizaciones/
git commit -m "feat(automatizaciones): componentes Atelier (alert-card, alert-list, rule-settings-form)"
```

---

### Task 6: Páginas + verificación final

**Files:**
- Create: `src/app/(app)/automatizaciones/page.tsx`
- Create: `src/app/(app)/automatizaciones/ajustes/page.tsx`

- [ ] **Step 1: Escribir `page.tsx`**

Crear `src/app/(app)/automatizaciones/page.tsx` con exactamente:

```tsx
import Link from "next/link";
import { evaluateAlerts } from "@/lib/automatizaciones/queries";
import { getActiveCompany } from "@/lib/active-company";
import { AlertList } from "@/components/automatizaciones/alert-list";
import { Button } from "@/components/ui/button";

export default async function AutomatizacionesPage() {
  const company = await getActiveCompany();
  const alerts = await evaluateAlerts(company);
  const total = alerts.reduce((s, a) => s + a.count, 0);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Automatizaciones</h1>
          <p className="mt-1 text-sm text-ink-3">{total > 0 ? `${total} alertas activas` : "Sin alertas"}</p>
        </div>
        <Button asChild variant="outline"><Link href="/automatizaciones/ajustes">Ajustes</Link></Button>
      </div>
      <AlertList alerts={alerts} />
    </div>
  );
}
```

- [ ] **Step 2: Escribir `ajustes/page.tsx`**

Crear `src/app/(app)/automatizaciones/ajustes/page.tsx` con exactamente:

```tsx
import Link from "next/link";
import { getRulesConfig } from "@/lib/automatizaciones/queries";
import { RuleSettingsForm } from "@/components/automatizaciones/rule-settings-form";
import { Button } from "@/components/ui/button";

export default async function AjustesAutomatizacionesPage() {
  const config = await getRulesConfig();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Ajustes de automatizaciones</h1>
        <Button asChild variant="outline"><Link href="/automatizaciones">Volver</Link></Button>
      </div>
      <RuleSettingsForm config={config} />
    </div>
  );
}
```

- [ ] **Step 3: Verificar build y tests**

Run: `npm run build`
Expected: compila limpio; aparecen las rutas `/automatizaciones` y `/automatizaciones/ajustes`.

Run: `npm test`
Expected: todos los tests verdes (incluye los 7 describes de `rules.test.ts`).

- [ ] **Step 4: Commit**

```bash
git add "src/app/(app)/automatizaciones/"
git commit -m "feat(automatizaciones): páginas /automatizaciones (alertas) y /automatizaciones/ajustes"
```

---

## Notas de integración (tras completar todas las tasks)

- **NO** se añade entrada en `sidebar.tsx` (la enciende la terminal de diseño).
- Verificación funcional sugerida (manual, como owner): visitar `/automatizaciones` con una empresa con datos; comprobar que aparecen alertas con enlaces correctos; en `/automatizaciones/ajustes` desactivar una regla o cambiar un umbral y ver que la lista cambia.
- Integración por `main`: `git pull` antes de mergear; el único conflicto probable es `src/types/db.ts` (generado) → resolver regenerando desde la BD viva (que ya contiene `automation_rules` + las tablas de la otra terminal) o `--ours` si ya está regenerado tras la última migración compartida.
