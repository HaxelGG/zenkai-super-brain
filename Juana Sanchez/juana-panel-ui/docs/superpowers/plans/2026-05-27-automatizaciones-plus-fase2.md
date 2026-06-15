# Automatizaciones+ Fase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Disparos automáticos de flujos n8n desde eventos de negocio (venta entregada/pagada, stock bajo, cotización por caducar/aceptada, clienta nueva, tarea vencida) y por horario (daily/weekly), vía un endpoint de cron que evalúa "disparadores" configurables.

**Architecture:** Tablas `automation_triggers` + `automation_trigger_fires` (RLS owner-only para la UI). Un route handler `/api/automatizaciones/cron` protegido por `CRON_SECRET` usa un cliente Supabase **service-role** (bypassa RLS) para evaluar disparadores y lanzar flujos reutilizando un helper `dispatchFlow` (extraído de `triggerFlow` de Fase 1). Dedup fire-once por (trigger, entidad) + baseline al crear. El scheduler es externo (n8n schedule → llama al endpoint con el Bearer); plan-independiente.

**Tech Stack:** Next.js 16 (route handlers, server actions), Supabase (RLS + service-role client `@supabase/supabase-js`), shadcn/ui, Atelier, sonner, Vitest. project_id `hfwhrwdmwgdicpsfdvyq`.

**Reglas:** NO tocar nav/sidebar (la página de disparadores cuelga por enlace desde flujos). NO romper Fase 1 (flujos/runs/callback) ni el motor de alertas. Migraciones en mi bloque **0042/0043**. Integrar por `main`. Rama: `feat/automatizaciones-triggers`.

**Env nuevas (server-only; el usuario las pone en Vercel):** `CRON_SECRET` (protege el endpoint) y `SUPABASE_SERVICE_ROLE_KEY` (cliente backend del cron; desde Supabase → Settings → API).

---

## File Structure

- `supabase/migrations/0042_automation_triggers.sql` — tablas.
- `supabase/migrations/0043_automation_triggers_rls.sql` — RLS.
- `src/types/db.ts` — regenerado.
- `src/lib/automatizaciones/events.ts` (+ `events.test.ts`) — lógica pura.
- `src/lib/automatizaciones/dispatch.ts` — helper compartido (extraído de `triggerFlow`).
- `src/lib/automatizaciones/queries.ts` — AMPLIAR (`listTriggers`, `matchedEntities`).
- `src/lib/automatizaciones/actions.ts` — AMPLIAR (`createTrigger`/`deleteTrigger`/`toggleTrigger`; refactor de `triggerFlow` para usar `dispatchFlow`).
- `src/app/api/automatizaciones/cron/route.ts` — endpoint del cron.
- `src/components/automatizaciones/{trigger-list,trigger-form,trigger-delete-button}.tsx`.
- `src/app/(app)/automatizaciones/disparadores/{page.tsx, nuevo/page.tsx}`.
- `src/app/(app)/automatizaciones/flujos/page.tsx` — AMPLIAR (enlace a Disparadores).

---

### Task 1: Migración tablas (`0042`)

**Files:** Create `supabase/migrations/0042_automation_triggers.sql`; aplicar vía MCP.

- [ ] **Step 1: Escribir.** `supabase/migrations/0042_automation_triggers.sql`:

```sql
create table public.automation_triggers (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  event_type text,
  schedule text,
  flow_id uuid not null references public.automation_flows(id) on delete cascade,
  enabled boolean not null default true,
  last_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.automation_trigger_fires (
  id uuid primary key default gen_random_uuid(),
  trigger_id uuid not null references public.automation_triggers(id) on delete cascade,
  entity_id text not null,
  fired_at timestamptz not null default now(),
  unique (trigger_id, entity_id)
);

create index on public.automation_triggers (enabled);
create index on public.automation_trigger_fires (trigger_id);
```

- [ ] **Step 2: Aplicar.** MCP `apply_migration` (name `automation_triggers`, query = SQL). Éxito.
- [ ] **Step 3: Verificar.** MCP `execute_sql`: `select to_regclass('public.automation_triggers') t, to_regclass('public.automation_trigger_fires') f;` → ambas no nulas.
- [ ] **Step 4: Commit.**
```bash
git add supabase/migrations/0042_automation_triggers.sql
git commit -m "feat(automatizaciones+): tablas automation_triggers + automation_trigger_fires"
```

---

### Task 2: RLS (`0043`) + tipos

**Files:** Create `supabase/migrations/0043_automation_triggers_rls.sql`; Modify `src/types/db.ts`.

- [ ] **Step 1: Escribir.** `supabase/migrations/0043_automation_triggers_rls.sql`:

```sql
alter table public.automation_triggers enable row level security;
alter table public.automation_trigger_fires enable row level security;

create policy "automation_triggers solo owner" on public.automation_triggers
  for all to authenticated using (public.is_owner()) with check (public.is_owner());
create policy "automation_trigger_fires solo owner" on public.automation_trigger_fires
  for all to authenticated using (public.is_owner()) with check (public.is_owner());
```

- [ ] **Step 2: Aplicar.** MCP `apply_migration` (name `automation_triggers_rls`). Éxito.
- [ ] **Step 3: Verificar.** MCP `execute_sql`: `select relrowsecurity from pg_class where oid='public.automation_triggers'::regclass;` → `t`.
- [ ] **Step 4: Regenerar tipos.** MCP `generate_typescript_types` (project_id `hfwhrwdmwgdicpsfdvyq`) → sobrescribir `src/types/db.ts` (literal, sin escapar, sin marcadores). Debe contener `automation_triggers` y `automation_trigger_fires`.
- [ ] **Step 5: Build.** `npm run build` → sin errores.
- [ ] **Step 6: Commit.**
```bash
git add supabase/migrations/0043_automation_triggers_rls.sql src/types/db.ts
git commit -m "feat(automatizaciones+): RLS owner-only de triggers + tipos"
```

---

### Task 3: Lógica pura (TDD) — `events.ts`

**Files:** Create `src/lib/automatizaciones/events.ts`, `src/lib/automatizaciones/events.test.ts`.

- [ ] **Step 1: Test que falla.** `src/lib/automatizaciones/events.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { EVENT_TYPES, diffNewIds, isScheduleDue, buildEventPayload } from "./events";

describe("EVENT_TYPES", () => {
  it("tiene los 7 eventos del catálogo con keys únicas", () => {
    expect(EVENT_TYPES).toHaveLength(7);
    const keys = EVENT_TYPES.map((e) => e.key);
    expect(new Set(keys).size).toBe(7);
    expect(keys).toContain("venta_entregada");
    expect(keys).toContain("clienta_nueva");
  });
});

describe("diffNewIds", () => {
  it("devuelve los ids de matched que no están en fired", () => {
    expect(diffNewIds(["a", "b", "c"], ["b"])).toEqual(["a", "c"]);
    expect(diffNewIds(["a"], ["a"])).toEqual([]);
    expect(diffNewIds([], ["x"])).toEqual([]);
  });
});

describe("isScheduleDue", () => {
  const now = new Date("2026-05-27T10:00:00Z");
  it("daily: due si nunca corrió o fue otro día UTC", () => {
    expect(isScheduleDue("daily", null, now)).toBe(true);
    expect(isScheduleDue("daily", "2026-05-26T23:00:00Z", now)).toBe(true);
    expect(isScheduleDue("daily", "2026-05-27T01:00:00Z", now)).toBe(false);
  });
  it("weekly: due si nunca corrió o ≥7 días", () => {
    expect(isScheduleDue("weekly", null, now)).toBe(true);
    expect(isScheduleDue("weekly", "2026-05-20T10:00:00Z", now)).toBe(true);
    expect(isScheduleDue("weekly", "2026-05-22T10:00:00Z", now)).toBe(false);
  });
});

describe("buildEventPayload", () => {
  it("arma el payload con eventType + datos de la entidad", () => {
    expect(buildEventPayload("venta_entregada", { id: "s1", label: "V-1", company_id: "c1" })).toEqual({
      eventType: "venta_entregada", id: "s1", label: "V-1", company_id: "c1",
    });
  });
});
```

- [ ] **Step 2: Ver fallar.** `npm test -- events.test` → FAIL.
- [ ] **Step 3: Implementar.** `src/lib/automatizaciones/events.ts`:

```ts
export type EventType =
  | "venta_entregada" | "venta_pagada" | "stock_bajo" | "cotizacion_por_caducar"
  | "cotizacion_aceptada" | "clienta_nueva" | "tarea_vencida";

export const EVENT_TYPES: { key: EventType; label: string; description: string }[] = [
  { key: "venta_entregada", label: "Venta entregada", description: "Una venta pasa a estado entregada." },
  { key: "venta_pagada", label: "Venta pagada", description: "Una venta pasa a estado pagada." },
  { key: "stock_bajo", label: "Stock bajo", description: "Un producto baja de su umbral de stock." },
  { key: "cotizacion_por_caducar", label: "Cotización por caducar", description: "Cotización en borrador/enviada a ≤7 días de vencer." },
  { key: "cotizacion_aceptada", label: "Cotización aceptada", description: "Una cotización pasa a aceptada." },
  { key: "clienta_nueva", label: "Clienta nueva", description: "Entra una clienta nueva al CRM." },
  { key: "tarea_vencida", label: "Tarea vencida", description: "Una tarea pasa su fecha sin estar hecha." },
];

export function diffNewIds(matched: string[], fired: string[]): string[] {
  const set = new Set(fired);
  return matched.filter((id) => !set.has(id));
}

export function isScheduleDue(schedule: "daily" | "weekly", lastRunAt: string | null, now: Date): boolean {
  if (!lastRunAt) return true;
  const last = new Date(lastRunAt);
  if (schedule === "daily") {
    return (
      last.getUTCFullYear() !== now.getUTCFullYear() ||
      last.getUTCMonth() !== now.getUTCMonth() ||
      last.getUTCDate() !== now.getUTCDate()
    );
  }
  return now.getTime() - last.getTime() >= 7 * 86_400_000;
}

export function buildEventPayload(
  eventType: string,
  entity: { id: string; label: string; company_id: string },
): Record<string, string> {
  return { eventType, id: entity.id, label: entity.label, company_id: entity.company_id };
}
```

- [ ] **Step 4: Ver pasar.** `npm test -- events.test` → PASS (4 describes).
- [ ] **Step 5: Commit.**
```bash
git add src/lib/automatizaciones/events.ts src/lib/automatizaciones/events.test.ts
git commit -m "feat(automatizaciones+): lógica pura de eventos (catálogo, diff, schedule, payload) con tests"
```

---

### Task 4: Helper `dispatchFlow` + refactor `triggerFlow`

**Files:** Create `src/lib/automatizaciones/dispatch.ts`; Modify `src/lib/automatizaciones/actions.ts`.

- [ ] **Step 1: Crear `dispatch.ts`** con exactamente:

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/db";

type DB = SupabaseClient<Database>;

/** Crea un run, dispara el webhook de n8n y marca error si falla. Compartido por el disparo manual y el cron. */
export async function dispatchFlow(
  supabase: DB,
  flow: { id: string; webhook_url: string },
  input: Record<string, string | number | boolean>,
): Promise<{ runId: string } | { error: string }> {
  const { data: run, error: rErr } = await supabase
    .from("automation_runs").insert({ flow_id: flow.id, input }).select("id,callback_token").single();
  if (rErr) return { error: rErr.message };

  const base = process.env.AUTOMATION_PUBLIC_URL ?? "";
  const callbackUrl = `${base}/api/automatizaciones/callback`;
  try {
    const res = await fetch(flow.webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runId: run.id, callbackUrl, callbackToken: run.callback_token, input }),
    });
    if (!res.ok) {
      const body = await res.text();
      await supabase.from("automation_runs").update({
        status: "error", error: `Webhook ${res.status}: ${body.slice(0, 200)}`, finished_at: new Date().toISOString(),
      }).eq("id", run.id);
      return { error: `El webhook respondió ${res.status}.` };
    }
  } catch (e) {
    await supabase.from("automation_runs").update({
      status: "error", error: e instanceof Error ? e.message : "Error de red al disparar el webhook.", finished_at: new Date().toISOString(),
    }).eq("id", run.id);
    return { error: "No se pudo contactar el webhook de n8n." };
  }
  return { runId: run.id };
}
```

- [ ] **Step 2: Refactor `triggerFlow` en `actions.ts`.** Añadir el import:
```ts
import { dispatchFlow } from "./dispatch";
```
Y reemplazar el cuerpo de `triggerFlow` (de la línea `const input = buildFlowPayload(...)` hasta el `return { runId: run.id };`) por:
```ts
  const input = buildFlowPayload(parseInputFields(flow.input_fields), formData);
  const res = await dispatchFlow(supabase, { id: flow.id, webhook_url: flow.webhook_url }, input);
  if ("error" in res) return res;
  revalidatePath(`/automatizaciones/flujos/${flowId}`);
  return { runId: res.runId };
}
```
(El bloque de creación de run + fetch + manejo de error que estaba inline ahora vive en `dispatchFlow`. La cabecera de `triggerFlow` —resolver el flujo y comprobar `enabled`— se mantiene igual.)

- [ ] **Step 3: Build.** `npm run build` → sin errores. (El disparo manual de Fase 1 debe seguir funcionando vía el helper.)
- [ ] **Step 4: Commit.**
```bash
git add src/lib/automatizaciones/dispatch.ts src/lib/automatizaciones/actions.ts
git commit -m "feat(automatizaciones+): helper dispatchFlow compartido (refactor de triggerFlow)"
```

---

### Task 5: Capa de datos de triggers (queries + actions)

**Files:** Modify `src/lib/automatizaciones/queries.ts`, `src/lib/automatizaciones/actions.ts`.

- [ ] **Step 1: Ampliar `queries.ts`.** Añadir los imports (junto a los existentes):
```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/db";
```
Y APPEND al final:

```ts
export type TriggerRow = {
  id: string;
  kind: string;
  event_type: string | null;
  schedule: string | null;
  flowName: string;
  enabled: boolean;
};

export async function listTriggers(): Promise<TriggerRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("automation_triggers")
    .select("id,kind,event_type,schedule,enabled,flow:automation_flows(name)")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((t) => ({
    id: t.id,
    kind: t.kind,
    event_type: t.event_type,
    schedule: t.schedule,
    flowName: (t.flow as { name: string } | null)?.name ?? "—",
    enabled: t.enabled,
  }));
}

/** Entidades que cumplen un event_type AHORA. Acepta el cliente (server o service-role). */
export async function matchedEntities(
  supabase: SupabaseClient<Database>,
  eventType: string,
): Promise<{ id: string; label: string; company_id: string }[]> {
  if (eventType === "venta_entregada" || eventType === "venta_pagada") {
    const status = eventType === "venta_entregada" ? "entregada" : "pagada";
    const { data, error } = await supabase.from("sales").select("id,number,company_id").eq("status", status);
    if (error) throw error;
    return (data ?? []).map((r) => ({ id: r.id, label: r.number, company_id: r.company_id }));
  }
  if (eventType === "cotizacion_aceptada") {
    const { data, error } = await supabase.from("quotes").select("id,number,company_id").eq("status", "aceptada");
    if (error) throw error;
    return (data ?? []).map((r) => ({ id: r.id, label: r.number, company_id: r.company_id }));
  }
  if (eventType === "cotizacion_por_caducar") {
    const limit = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("quotes").select("id,number,company_id,valid_until,status")
      .in("status", ["borrador", "enviada"]).not("valid_until", "is", null).lte("valid_until", limit);
    if (error) throw error;
    return (data ?? []).map((r) => ({ id: r.id, label: r.number, company_id: r.company_id }));
  }
  if (eventType === "clienta_nueva") {
    const { data, error } = await supabase.from("customers").select("id,name,company_id");
    if (error) throw error;
    return (data ?? []).map((r) => ({ id: r.id, label: r.name, company_id: r.company_id }));
  }
  if (eventType === "tarea_vencida") {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("tasks").select("id,title,company_id,due_date,status")
      .neq("status", "hecha").not("due_date", "is", null).lt("due_date", today);
    if (error) throw error;
    return (data ?? []).map((r) => ({ id: r.id, label: r.title, company_id: r.company_id }));
  }
  if (eventType === "stock_bajo") {
    const { data: products, error } = await supabase
      .from("products").select("id,name,company_id,low_stock_threshold");
    if (error) throw error;
    const ids = (products ?? []).map((p) => p.id);
    const stock = new Map<string, number>();
    if (ids.length > 0) {
      const { data: st, error: sErr } = await supabase.from("product_stock").select("product_id,stock").in("product_id", ids);
      if (sErr) throw sErr;
      for (const s of st ?? []) if (s.product_id) stock.set(s.product_id, s.stock ?? 0);
    }
    return (products ?? [])
      .filter((p) => p.low_stock_threshold > 0 && (stock.get(p.id) ?? 0) <= p.low_stock_threshold)
      .map((p) => ({ id: p.id, label: p.name, company_id: p.company_id }));
  }
  return [];
}
```

- [ ] **Step 2: Ampliar `actions.ts`.** Añadir el import:
```ts
import { matchedEntities } from "./queries";
```
Y APPEND al final:

```ts
export async function createTrigger(formData: FormData) {
  const supabase = await createClient();
  const kind = String(formData.get("kind") ?? "");
  const flow_id = String(formData.get("flow_id") ?? "");
  if (!flow_id) return { error: "Elige un flujo." };
  if (kind !== "event" && kind !== "schedule") return { error: "Tipo de disparador inválido." };
  const event_type = kind === "event" ? String(formData.get("event_type") ?? "").trim() : null;
  const schedule = kind === "schedule" ? String(formData.get("schedule") ?? "").trim() : null;
  if (kind === "event" && !event_type) return { error: "Elige un evento." };
  if (kind === "schedule" && schedule !== "daily" && schedule !== "weekly") return { error: "Elige un horario." };

  const { data: trigger, error } = await supabase.from("automation_triggers").insert({
    kind, event_type, schedule, flow_id,
  }).select("id").single();
  if (error) return { error: error.message };

  // Baseline: para eventos, marca las coincidencias actuales como ya-disparadas (solo futuras disparan).
  if (kind === "event" && event_type) {
    const matches = await matchedEntities(supabase, event_type);
    if (matches.length > 0) {
      await supabase.from("automation_trigger_fires").insert(
        matches.map((m) => ({ trigger_id: trigger.id, entity_id: m.id })),
      );
    }
  }
  revalidatePath("/automatizaciones/disparadores");
  return { id: trigger.id };
}

export async function deleteTrigger(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("automation_triggers").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/automatizaciones/disparadores");
  return { ok: true };
}

export async function toggleTrigger(id: string) {
  const supabase = await createClient();
  const { data: cur, error: e1 } = await supabase.from("automation_triggers").select("enabled").eq("id", id).single();
  if (e1) return { error: e1.message };
  const { error } = await supabase.from("automation_triggers")
    .update({ enabled: !cur.enabled, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/automatizaciones/disparadores");
  return { ok: true };
}
```

- [ ] **Step 3: Build.** `npm run build` → sin errores.
- [ ] **Step 4: Commit.**
```bash
git add src/lib/automatizaciones/queries.ts src/lib/automatizaciones/actions.ts
git commit -m "feat(automatizaciones+): capa de datos de triggers (listTriggers, matchedEntities, create/delete/toggle + baseline)"
```

---

### Task 6: Endpoint del cron

**Files:** Create `src/app/api/automatizaciones/cron/route.ts`.

- [ ] **Step 1: Crear el route handler** con exactamente:

```ts
import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { Database } from "@/types/db";
import { matchedEntities } from "@/lib/automatizaciones/queries";
import { dispatchFlow } from "@/lib/automatizaciones/dispatch";
import { diffNewIds, isScheduleDue, buildEventPayload } from "@/lib/automatizaciones/events";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  return !!secret && req.headers.get("authorization") === `Bearer ${secret}`;
}

async function runCron() {
  const supabase = createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
  const now = new Date();
  let fired = 0;
  const errors: string[] = [];

  const { data: triggers, error } = await supabase
    .from("automation_triggers")
    .select("id,kind,event_type,schedule,flow_id,last_run_at")
    .eq("enabled", true);
  if (error) return { fired, errors: [error.message] };

  for (const t of triggers ?? []) {
    const { data: flow } = await supabase
      .from("automation_flows").select("id,webhook_url,enabled").eq("id", t.flow_id).single();
    if (!flow || !flow.enabled) continue;

    if (t.kind === "event" && t.event_type) {
      const matches = await matchedEntities(supabase, t.event_type);
      const { data: fires } = await supabase
        .from("automation_trigger_fires").select("entity_id").eq("trigger_id", t.id);
      const firedIds = (fires ?? []).map((f) => f.entity_id);
      const newIds = new Set(diffNewIds(matches.map((m) => m.id), firedIds));
      for (const m of matches.filter((x) => newIds.has(x.id))) {
        const res = await dispatchFlow(supabase, flow, buildEventPayload(t.event_type, m));
        if ("error" in res) { errors.push(`${t.event_type}/${m.id}: ${res.error}`); continue; }
        await supabase.from("automation_trigger_fires").insert({ trigger_id: t.id, entity_id: m.id });
        fired++;
      }
    } else if (t.kind === "schedule" && (t.schedule === "daily" || t.schedule === "weekly")) {
      if (isScheduleDue(t.schedule, t.last_run_at, now)) {
        const res = await dispatchFlow(supabase, flow, { scheduled: true, at: now.toISOString() });
        if ("error" in res) { errors.push(`schedule/${t.id}: ${res.error}`); continue; }
        await supabase.from("automation_triggers").update({ last_run_at: now.toISOString() }).eq("id", t.id);
        fired++;
      }
    }
  }
  return { fired, errors };
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  return NextResponse.json(await runCron());
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  return NextResponse.json(await runCron());
}
```

- [ ] **Step 2: Build.** `npm run build` → compila; aparece `/api/automatizaciones/cron`. Si hay un error de tipo en el insert de `input` por la unión `string|number|boolean` vs `Json`, repórtalo (no inventes workaround); se espera que compile.
- [ ] **Step 3: Commit.**
```bash
git add "src/app/api/automatizaciones/cron/route.ts"
git commit -m "feat(automatizaciones+): endpoint de cron (service-role, eventos + programados)"
```

---

### Task 7: Componentes

**Files:** Create `trigger-list.tsx`, `trigger-form.tsx`, `trigger-delete-button.tsx` en `src/components/automatizaciones/`.

- [ ] **Step 1: `trigger-list.tsx`**

```tsx
import { Badge } from "@/components/ui/badge";
import { EVENT_TYPES } from "@/lib/automatizaciones/events";
import type { TriggerRow } from "@/lib/automatizaciones/queries";
import { TriggerDeleteButton } from "./trigger-delete-button";

function describe(t: TriggerRow): string {
  if (t.kind === "schedule") return t.schedule === "weekly" ? "Cada semana" : "Cada día";
  return EVENT_TYPES.find((e) => e.key === t.event_type)?.label ?? (t.event_type ?? "Evento");
}

export function TriggerList({ triggers }: { triggers: TriggerRow[] }) {
  if (triggers.length === 0) return <p className="text-sm text-ink-3">No hay disparadores todavía.</p>;
  return (
    <div className="space-y-2">
      {triggers.map((t) => (
        <div key={t.id} className="flex items-center justify-between gap-3 rounded-md border border-line bg-elevated p-3">
          <div className="min-w-0">
            <p className="font-medium text-ink">{describe(t)} → {t.flowName}</p>
            <p className="text-xs text-ink-4">{t.kind === "schedule" ? "Programado" : "Evento"}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant={t.enabled ? "default" : "secondary"}>{t.enabled ? "Activo" : "Pausado"}</Badge>
            <TriggerDeleteButton id={t.id} enabled={t.enabled} />
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: `trigger-delete-button.tsx`** (incluye toggle + borrar)

```tsx
"use client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteTrigger, toggleTrigger } from "@/lib/automatizaciones/actions";

export function TriggerDeleteButton({ id, enabled }: { id: string; enabled: boolean }) {
  const router = useRouter();
  async function onToggle() {
    const res = await toggleTrigger(id);
    if (res?.error) { toast.error(res.error); return; }
    router.refresh();
  }
  async function onDelete() {
    if (!confirm("¿Borrar este disparador?")) return;
    const res = await deleteTrigger(id);
    if (res?.error) { toast.error(res.error); return; }
    toast.success("Disparador borrado");
    router.refresh();
  }
  return (
    <span className="flex gap-1">
      <Button variant="ghost" size="sm" onClick={onToggle}>{enabled ? "Pausar" : "Activar"}</Button>
      <Button variant="ghost" size="sm" onClick={onDelete}>Borrar</Button>
    </span>
  );
}
```

- [ ] **Step 3: `trigger-form.tsx`**

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { EVENT_TYPES } from "@/lib/automatizaciones/events";
import { createTrigger } from "@/lib/automatizaciones/actions";

export function TriggerForm({ flows }: { flows: { id: string; name: string }[] }) {
  const router = useRouter();
  const [kind, setKind] = useState<"event" | "schedule">("event");
  async function onSubmit(fd: FormData) {
    const res = await createTrigger(fd);
    if (res?.error) { toast.error(res.error); return; }
    toast.success("Disparador creado");
    router.push("/automatizaciones/disparadores");
  }
  const selectCls = "w-full rounded-md border border-line bg-paper p-2 text-sm text-ink";
  return (
    <form action={onSubmit} className="max-w-lg space-y-4">
      <div className="space-y-2">
        <Label htmlFor="kind">Tipo</Label>
        <select id="kind" name="kind" value={kind} onChange={(e) => setKind(e.target.value as "event" | "schedule")} className={selectCls}>
          <option value="event">Por evento</option>
          <option value="schedule">Programado</option>
        </select>
      </div>
      {kind === "event" ? (
        <div className="space-y-2">
          <Label htmlFor="event_type">Evento</Label>
          <select id="event_type" name="event_type" className={selectCls}>
            {EVENT_TYPES.map((e) => <option key={e.key} value={e.key}>{e.label}</option>)}
          </select>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="schedule">Horario</Label>
          <select id="schedule" name="schedule" className={selectCls}>
            <option value="daily">Cada día</option>
            <option value="weekly">Cada semana</option>
          </select>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="flow_id">Flujo a disparar</Label>
        <select id="flow_id" name="flow_id" required className={selectCls}>
          {flows.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>
      <Button type="submit">Crear disparador</Button>
    </form>
  );
}
```

- [ ] **Step 4: Build.** `npm run build` → sin errores.
- [ ] **Step 5: Commit.**
```bash
git add src/components/automatizaciones/
git commit -m "feat(automatizaciones+): componentes de disparadores (list, form, delete/toggle)"
```

---

### Task 8: Páginas + enlace + verificación final

**Files:** Create `src/app/(app)/automatizaciones/disparadores/{page.tsx, nuevo/page.tsx}`; Modify `src/app/(app)/automatizaciones/flujos/page.tsx`.

- [ ] **Step 1: `disparadores/page.tsx`**

```tsx
import Link from "next/link";
import { listTriggers } from "@/lib/automatizaciones/queries";
import { TriggerList } from "@/components/automatizaciones/trigger-list";
import { Button } from "@/components/ui/button";

export default async function DisparadoresPage() {
  const triggers = await listTriggers();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Disparadores</h1>
          <p className="mt-1 text-sm text-ink-3">Lanza flujos automáticamente por evento o por horario.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link href="/automatizaciones/flujos">Flujos</Link></Button>
          <Button asChild><Link href="/automatizaciones/disparadores/nuevo">Nuevo disparador</Link></Button>
        </div>
      </div>
      <TriggerList triggers={triggers} />
    </div>
  );
}
```

- [ ] **Step 2: `disparadores/nuevo/page.tsx`**

```tsx
import { listFlows } from "@/lib/automatizaciones/queries";
import { TriggerForm } from "@/components/automatizaciones/trigger-form";

export default async function NuevoDisparadorPage() {
  const flows = await listFlows();
  if (flows.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Nuevo disparador</h1>
        <p className="text-sm text-ink-3">Primero crea un flujo en «Flujos» para poder dispararlo.</p>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Nuevo disparador</h1>
      <TriggerForm flows={flows.map((f) => ({ id: f.id, name: f.name }))} />
    </div>
  );
}
```

- [ ] **Step 3: Enlace desde la página de flujos.** En `src/app/(app)/automatizaciones/flujos/page.tsx`, dentro del `<div className="flex gap-2">` que tiene los botones "Alertas" y "Nuevo flujo", añadir un botón a Disparadores ANTES de "Nuevo flujo". Es decir, reemplazar:
```tsx
          <Button asChild variant="outline"><Link href="/automatizaciones">Alertas</Link></Button>
          <Button asChild><Link href="/automatizaciones/flujos/nuevo">Nuevo flujo</Link></Button>
```
por:
```tsx
          <Button asChild variant="outline"><Link href="/automatizaciones">Alertas</Link></Button>
          <Button asChild variant="outline"><Link href="/automatizaciones/disparadores">Disparadores</Link></Button>
          <Button asChild><Link href="/automatizaciones/flujos/nuevo">Nuevo flujo</Link></Button>
```
(Edit exacto sobre el archivo real; no alterar el resto.)

- [ ] **Step 4: Build y tests.**
`npm run build` → limpio; aparecen `/automatizaciones/disparadores`, `/automatizaciones/disparadores/nuevo`, `/api/automatizaciones/cron`.
`npm test` → todo verde (incluye los 4 describes de `events.test.ts`).

- [ ] **Step 5: Commit.**
```bash
git add "src/app/(app)/automatizaciones/"
git commit -m "feat(automatizaciones+): páginas de disparadores + enlace desde flujos"
```

---

## Notas de integración (tras completar todas las tasks)

- **NO** se añade entrada en el nav (cuelga por enlace de Flujos/Alertas).
- **Vercel:** añadir `CRON_SECRET` (string aleatorio) y `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Settings → API → service_role) como env vars de producción, y re-desplegar.
- **Scheduler:** crear en n8n un workflow programado (Schedule node, p.ej. cada 15 min) con un nodo HTTP Request a `https://juana-sanchez-panel.vercel.app/api/automatizaciones/cron` con header `Authorization: Bearer <CRON_SECRET>`. (Alternativa: Vercel Cron en `vercel.json`, pero el sub-diario requiere plan Pro.)
- **Verificación funcional:** crear un flujo + un disparador "venta entregada → flujo"; marcar una venta como entregada; llamar al endpoint con el Bearer (o esperar al schedule) → se crea un run y no se repite en la siguiente llamada (dedup).
- Integrar por `main`: `git pull` antes; conflicto probable solo en `src/types/db.ts` (regenerar).
