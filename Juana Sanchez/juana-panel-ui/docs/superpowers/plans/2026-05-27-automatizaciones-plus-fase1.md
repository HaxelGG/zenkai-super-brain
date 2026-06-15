# Automatizaciones+ Fase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir `/automatizaciones` en panel de control de n8n: registrar flujos (webhook n8n + campos de entrada), dispararlos con un formulario, y registrar/visualizar ejecuciones (con callback de n8n para flujos largos).

**Architecture:** n8n orquesta; el panel dispara y registra. Tablas `automation_flows` + `automation_runs` (RLS `is_owner()`). El callback de n8n (sin sesión) cierra la ejecución vía RPC `SECURITY DEFINER` validado por un `callback_token` por-ejecución. Lógica pura testeable; capa de datos amplía la existente sin romper el motor de alertas.

**Tech Stack:** Next.js 16 (App Router, server actions, route handler), Supabase (RLS + RPC), shadcn/ui, Atelier, sonner, Vitest. Supabase project_id `hfwhrwdmwgdicpsfdvyq`.

**Reglas del proyecto:** NO tocar `sidebar.tsx`/`nav-config.tsx` (`/automatizaciones` ya está en el nav; las páginas de flujos se alcanzan por enlace desde la página de alertas, que es mía). Migraciones en mi bloque **0040/0041**. NO romper el motor de alertas existente (`automation_rules`, `getRulesConfig`, `evaluateAlerts`, `updateRuleConfig`). Integrar por `main`. Rama: `feat/automatizaciones-plus`.

**Env (server-only):** `AUTOMATION_PUBLIC_URL` = base pública del panel (para el `callbackUrl` que recibe n8n). Añadir a `.env.local` y a Vercel.

---

## File Structure

- `supabase/migrations/0040_automation_flows.sql` — tablas `automation_flows` + `automation_runs`.
- `supabase/migrations/0041_automation_flows_rls.sql` — RLS + RPC `complete_automation_run`.
- `src/types/db.ts` — regenerado.
- `src/lib/automatizaciones/flows.ts` (+ `flows.test.ts`) — lógica pura nueva.
- `src/lib/automatizaciones/queries.ts` — AMPLIAR (añadir `listFlows`/`getFlow`/`listRuns`).
- `src/lib/automatizaciones/actions.ts` — AMPLIAR (añadir `createFlow`/`deleteFlow`/`triggerFlow`).
- `src/app/api/automatizaciones/callback/route.ts` — route handler del callback.
- `src/components/automatizaciones/{flow-list,flow-form,flow-trigger,run-history,flow-delete-button}.tsx`.
- `src/app/(app)/automatizaciones/flujos/{page.tsx, nuevo/page.tsx, [id]/page.tsx}`.
- `src/app/(app)/automatizaciones/page.tsx` — AMPLIAR (añadir enlace a "Flujos").

---

### Task 1: Migración de tablas (`0040`)

**Files:** Create `supabase/migrations/0040_automation_flows.sql`; aplicar vía MCP.

- [ ] **Step 1: Escribir la migración.** Crear `supabase/migrations/0040_automation_flows.sql` con exactamente:

```sql
create table public.automation_flows (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  webhook_url text not null,
  input_fields jsonb not null default '[]',
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  flow_id uuid not null references public.automation_flows(id) on delete cascade,
  status text not null default 'running',
  input jsonb not null default '{}',
  result jsonb,
  error text,
  callback_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create index on public.automation_runs (flow_id, created_at desc);
```

- [ ] **Step 2: Aplicar.** MCP `apply_migration` (project_id `hfwhrwdmwgdicpsfdvyq`, name `automation_flows`, query = SQL anterior). Éxito.

- [ ] **Step 3: Verificar.** MCP `execute_sql`: `select to_regclass('public.automation_flows') as f, to_regclass('public.automation_runs') as r;` → ambas no nulas.

- [ ] **Step 4: Commit.**
```bash
git add supabase/migrations/0040_automation_flows.sql
git commit -m "feat(automatizaciones+): tablas automation_flows + automation_runs"
```

---

### Task 2: RLS + RPC (`0041`) + tipos

**Files:** Create `supabase/migrations/0041_automation_flows_rls.sql`; Modify `src/types/db.ts`.

- [ ] **Step 1: Escribir la migración.** Crear `supabase/migrations/0041_automation_flows_rls.sql` con exactamente:

```sql
alter table public.automation_flows enable row level security;
alter table public.automation_runs enable row level security;

create policy "automation_flows solo owner" on public.automation_flows
  for all to authenticated using (public.is_owner()) with check (public.is_owner());
create policy "automation_runs solo owner" on public.automation_runs
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

create or replace function public.complete_automation_run(
  p_run_id uuid, p_token uuid, p_status text, p_result jsonb, p_error text
) returns boolean
language plpgsql security definer set search_path = public as $$
declare affected int;
begin
  update public.automation_runs
     set status = p_status, result = p_result, error = p_error, finished_at = now()
   where id = p_run_id and callback_token = p_token and status = 'running';
  get diagnostics affected = row_count;
  return affected > 0;
end $$;

revoke all on function public.complete_automation_run(uuid,uuid,text,jsonb,text) from public;
grant execute on function public.complete_automation_run(uuid,uuid,text,jsonb,text) to anon, authenticated;
```

- [ ] **Step 2: Aplicar.** MCP `apply_migration` (name `automation_flows_rls`, query = SQL anterior). Éxito.

- [ ] **Step 3: Verificar RLS + RPC.** MCP `execute_sql`:
```sql
select relrowsecurity from pg_class where oid = 'public.automation_flows'::regclass;
select to_regprocedure('public.complete_automation_run(uuid,uuid,text,jsonb,text)') as fn;
```
Esperado: `t` y la función no nula.

- [ ] **Step 4: Regenerar tipos.** MCP `generate_typescript_types` (project_id `hfwhrwdmwgdicpsfdvyq`). Sobrescribir `src/types/db.ts` con el campo `types` (contenido literal, sin escapar, sin marcadores de conflicto). Debe contener `automation_flows`, `automation_runs` y `complete_automation_run`.

- [ ] **Step 5: Build.** `npm run build` → sin errores.

- [ ] **Step 6: Commit.**
```bash
git add supabase/migrations/0041_automation_flows_rls.sql src/types/db.ts
git commit -m "feat(automatizaciones+): RLS owner-only + RPC complete_automation_run + tipos"
```

---

### Task 3: Lógica pura (TDD) — `flows.ts`

**Files:** Create `src/lib/automatizaciones/flows.ts`, `src/lib/automatizaciones/flows.test.ts`.

- [ ] **Step 1: Test que falla.** Crear `src/lib/automatizaciones/flows.test.ts` con exactamente:

```ts
import { describe, it, expect } from "vitest";
import {
  parseInputFields, parseInputFieldLines, buildFlowPayload, isValidWebhookUrl, runStatusLabel,
} from "./flows";

describe("parseInputFields", () => {
  it("normaliza un jsonb válido y descarta lo mal formado", () => {
    expect(parseInputFields([
      { key: "nombre", label: "Nombre", type: "text" },
      { key: "guion", label: "Guion", type: "textarea" },
      { key: "n", type: "number" },
      { label: "sin key" },
      "basura",
    ])).toEqual([
      { key: "nombre", label: "Nombre", type: "text" },
      { key: "guion", label: "Guion", type: "textarea" },
      { key: "n", label: "n", type: "number" },
    ]);
  });
  it("devuelve [] si no es array", () => {
    expect(parseInputFields(null)).toEqual([]);
    expect(parseInputFields({})).toEqual([]);
  });
});

describe("parseInputFieldLines", () => {
  it("parsea líneas 'key|label|type' y aplica defaults", () => {
    expect(parseInputFieldLines("nombre|Nombre|text\nguion|Guion|textarea\nsolo_key\nbad|Etiqueta|raro")).toEqual([
      { key: "nombre", label: "Nombre", type: "text" },
      { key: "guion", label: "Guion", type: "textarea" },
      { key: "solo_key", label: "solo_key", type: "text" },
      { key: "bad", label: "Etiqueta", type: "text" },
    ]);
  });
  it("ignora líneas vacías", () => {
    expect(parseInputFieldLines("\n  \n")).toEqual([]);
  });
});

describe("buildFlowPayload", () => {
  it("mapea valores del form según los campos (number → Number)", () => {
    const fd = new FormData();
    fd.set("nombre", "Ana");
    fd.set("cantidad", "3");
    fd.set("extra", "no declarado");
    const payload = buildFlowPayload(
      [{ key: "nombre", label: "Nombre", type: "text" }, { key: "cantidad", label: "Cantidad", type: "number" }],
      fd,
    );
    expect(payload).toEqual({ nombre: "Ana", cantidad: 3 });
  });
});

describe("isValidWebhookUrl", () => {
  it("solo acepta https válido", () => {
    expect(isValidWebhookUrl("https://n8n.example.com/webhook/abc")).toBe(true);
    expect(isValidWebhookUrl("http://n8n.example.com/webhook/abc")).toBe(false);
    expect(isValidWebhookUrl("no-es-url")).toBe(false);
    expect(isValidWebhookUrl("")).toBe(false);
  });
});

describe("runStatusLabel", () => {
  it("traduce estados", () => {
    expect(runStatusLabel("running")).toBe("En curso");
    expect(runStatusLabel("ok")).toBe("Completado");
    expect(runStatusLabel("error")).toBe("Error");
  });
});
```

- [ ] **Step 2: Ver fallar.** `npm test -- flows.test` → FAIL (no existe `./flows`).

- [ ] **Step 3: Implementar.** Crear `src/lib/automatizaciones/flows.ts` con exactamente:

```ts
export type InputField = { key: string; label: string; type: "text" | "textarea" | "number" };

function normType(t: unknown): InputField["type"] {
  return t === "textarea" || t === "number" ? t : "text";
}

export function parseInputFields(raw: unknown): InputField[] {
  if (!Array.isArray(raw)) return [];
  const out: InputField[] = [];
  for (const item of raw) {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      const rec = item as Record<string, unknown>;
      const key = String(rec.key ?? "").trim();
      if (!key) continue;
      const label = String(rec.label ?? "").trim() || key;
      out.push({ key, label, type: normType(rec.type) });
    }
  }
  return out;
}

export function parseInputFieldLines(text: string): InputField[] {
  const out: InputField[] = [];
  for (const line of text.split(/\r?\n/)) {
    const parts = line.split("|").map((p) => p.trim());
    const key = parts[0];
    if (!key) continue;
    const label = parts[1] || key;
    out.push({ key, label, type: normType(parts[2]) });
  }
  return out;
}

export function buildFlowPayload(fields: InputField[], formData: FormData): Record<string, string | number> {
  const payload: Record<string, string | number> = {};
  for (const f of fields) {
    const raw = formData.get(f.key);
    if (raw == null) continue;
    const v = String(raw);
    payload[f.key] = f.type === "number" ? Number(v) : v;
  }
  return payload;
}

export function isValidWebhookUrl(url: string): boolean {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

export function runStatusLabel(status: string): string {
  switch (status) {
    case "running": return "En curso";
    case "ok": return "Completado";
    case "error": return "Error";
    default: return status;
  }
}
```

- [ ] **Step 4: Ver pasar.** `npm test -- flows.test` → PASS (5 describes).

- [ ] **Step 5: Commit.**
```bash
git add src/lib/automatizaciones/flows.ts src/lib/automatizaciones/flows.test.ts
git commit -m "feat(automatizaciones+): lógica pura de flujos (parse/payload/validación) con tests"
```

---

### Task 4: Capa de datos (ampliar queries + actions) + env

**Files:** Modify `src/lib/automatizaciones/queries.ts`, `src/lib/automatizaciones/actions.ts`; append `.env.local`.

- [ ] **Step 1: Ampliar `queries.ts`.** Añadir AL FINAL de `src/lib/automatizaciones/queries.ts` (sin tocar lo existente). Primero añade el import de `flows` junto a los imports existentes del archivo:

```ts
import { parseInputFields, type InputField } from "./flows";
```

Y añade al final:

```ts
export type FlowRow = {
  id: string;
  name: string;
  description: string | null;
  webhook_url: string;
  input_fields: InputField[];
  enabled: boolean;
  runCount: number;
  lastStatus: string | null;
};

export type RunRow = {
  id: string;
  status: string;
  input: Record<string, unknown>;
  result: unknown;
  error: string | null;
  created_at: string;
  finished_at: string | null;
};

export async function listFlows(): Promise<FlowRow[]> {
  const supabase = await createClient();
  const { data: flows, error } = await supabase
    .from("automation_flows")
    .select("id,name,description,webhook_url,input_fields,enabled")
    .order("created_at", { ascending: true });
  if (error) throw error;
  const ids = (flows ?? []).map((f) => f.id);
  const counts = new Map<string, number>();
  const last = new Map<string, string>();
  if (ids.length > 0) {
    const { data: runs, error: rErr } = await supabase
      .from("automation_runs")
      .select("flow_id,status,created_at")
      .in("flow_id", ids)
      .order("created_at", { ascending: false });
    if (rErr) throw rErr;
    for (const r of runs ?? []) {
      counts.set(r.flow_id, (counts.get(r.flow_id) ?? 0) + 1);
      if (!last.has(r.flow_id)) last.set(r.flow_id, r.status);
    }
  }
  return (flows ?? []).map((f) => ({
    id: f.id,
    name: f.name,
    description: f.description,
    webhook_url: f.webhook_url,
    input_fields: parseInputFields(f.input_fields),
    enabled: f.enabled,
    runCount: counts.get(f.id) ?? 0,
    lastStatus: last.get(f.id) ?? null,
  }));
}

export async function getFlow(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("automation_flows").select("*").eq("id", id).single();
  if (error) throw error;
  return {
    id: data.id as string,
    name: data.name as string,
    description: data.description as string | null,
    webhook_url: data.webhook_url as string,
    enabled: data.enabled as boolean,
    input_fields: parseInputFields(data.input_fields),
  };
}

export async function listRuns(flowId: string): Promise<RunRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("automation_runs")
    .select("id,status,input,result,error,created_at,finished_at")
    .eq("flow_id", flowId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    status: r.status,
    input: (r.input ?? {}) as Record<string, unknown>,
    result: r.result,
    error: r.error,
    created_at: r.created_at,
    finished_at: r.finished_at,
  }));
}
```

- [ ] **Step 2: Ampliar `actions.ts`.** Añadir el import de `flows` junto al import existente, y añadir las 3 acciones AL FINAL de `src/lib/automatizaciones/actions.ts` (sin tocar `updateRuleConfig`):

```ts
import { isValidWebhookUrl, parseInputFieldLines, parseInputFields, buildFlowPayload } from "./flows";
```

```ts
export async function createFlow(formData: FormData) {
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "").trim();
  const webhook_url = String(formData.get("webhook_url") ?? "").trim();
  if (!name) return { error: "El nombre es obligatorio." };
  if (!isValidWebhookUrl(webhook_url)) return { error: "La URL del webhook debe ser https válida." };
  const input_fields = parseInputFieldLines(String(formData.get("input_fields") ?? ""));
  const { data, error } = await supabase.from("automation_flows").insert({
    name,
    webhook_url,
    description: String(formData.get("description") ?? "") || null,
    input_fields,
  }).select("id").single();
  if (error) return { error: error.message };
  revalidatePath("/automatizaciones/flujos");
  return { id: data.id };
}

export async function deleteFlow(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("automation_flows").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/automatizaciones/flujos");
  return { ok: true };
}

export async function triggerFlow(flowId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: flow, error: fErr } = await supabase
    .from("automation_flows").select("id,webhook_url,input_fields,enabled").eq("id", flowId).single();
  if (fErr) return { error: fErr.message };
  if (!flow.enabled) return { error: "El flujo está desactivado." };

  const input = buildFlowPayload(parseInputFields(flow.input_fields), formData);
  const { data: run, error: rErr } = await supabase
    .from("automation_runs").insert({ flow_id: flowId, input }).select("id,callback_token").single();
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
        status: "error",
        error: `Webhook ${res.status}: ${body.slice(0, 200)}`,
        finished_at: new Date().toISOString(),
      }).eq("id", run.id);
      return { error: `El webhook respondió ${res.status}.` };
    }
  } catch (e) {
    await supabase.from("automation_runs").update({
      status: "error",
      error: e instanceof Error ? e.message : "Error de red al disparar el webhook.",
      finished_at: new Date().toISOString(),
    }).eq("id", run.id);
    return { error: "No se pudo contactar el webhook de n8n." };
  }
  revalidatePath(`/automatizaciones/flujos/${flowId}`);
  return { runId: run.id };
}
```

- [ ] **Step 3: Env.** Añadir a `.env.local` (gitignored, NO commitear):
```bash
printf '\nAUTOMATION_PUBLIC_URL=https://juana-sanchez-panel.vercel.app\n' >> .env.local
```

- [ ] **Step 4: Build.** `npm run build` → sin errores.

- [ ] **Step 5: Commit** (sin `.env.local`):
```bash
git add src/lib/automatizaciones/queries.ts src/lib/automatizaciones/actions.ts
git commit -m "feat(automatizaciones+): capa de datos de flujos (listFlows/getFlow/listRuns + create/delete/trigger)"
```

---

### Task 5: Route handler del callback

**Files:** Create `src/app/api/automatizaciones/callback/route.ts`.

- [ ] **Step 1: Crear el route handler** con exactamente:

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/db";

export async function POST(req: Request) {
  let body: { runId?: string; token?: string; status?: string; result?: Json; error?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  if (!body.runId || !body.token) {
    return NextResponse.json({ error: "Faltan runId o token." }, { status: 400 });
  }
  const status = body.status === "error" ? "error" : "ok";
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("complete_automation_run", {
    p_run_id: body.runId,
    p_token: body.token,
    p_status: status,
    p_result: body.result ?? null,
    p_error: body.error ?? null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (data !== true) {
    return NextResponse.json({ error: "Ejecución no encontrada o token inválido." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Build.** `npm run build` → compila; aparece la ruta `/api/automatizaciones/callback`.

- [ ] **Step 3: Commit.**
```bash
git add "src/app/api/automatizaciones/callback/route.ts"
git commit -m "feat(automatizaciones+): route handler de callback (cierra run vía RPC con token)"
```

---

### Task 6: Componentes (Atelier-native)

**Files:** Create los 5 componentes en `src/components/automatizaciones/`.

- [ ] **Step 1: `flow-list.tsx`**

```tsx
import Link from "next/link";
import { Workflow } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { runStatusLabel } from "@/lib/automatizaciones/flows";
import type { FlowRow } from "@/lib/automatizaciones/queries";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  ok: "default", running: "secondary", error: "destructive",
};

export function FlowList({ flows }: { flows: FlowRow[] }) {
  if (flows.length === 0) return <p className="text-sm text-ink-3">No hay flujos todavía.</p>;
  return (
    <div className="space-y-2">
      {flows.map((f) => (
        <Link key={f.id} href={`/automatizaciones/flujos/${f.id}`}
          className="flex items-center justify-between gap-3 rounded-md border border-line bg-elevated p-3 transition-colors hover:bg-paper">
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-medium text-ink"><Workflow className="h-4 w-4 text-ink-4" /> {f.name}</p>
            {f.description && <p className="truncate text-sm text-ink-3">{f.description}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {f.lastStatus && <Badge variant={STATUS_VARIANT[f.lastStatus] ?? "secondary"}>{runStatusLabel(f.lastStatus)}</Badge>}
            <span className="font-mono text-[11px] text-ink-4">{f.runCount} ej.</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: `flow-form.tsx`**

```tsx
"use client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createFlow } from "@/lib/automatizaciones/actions";

export function FlowForm() {
  const router = useRouter();
  async function onSubmit(fd: FormData) {
    const res = await createFlow(fd);
    if (res?.error) { toast.error(res.error); return; }
    toast.success("Flujo creado");
    if (res?.id) router.push(`/automatizaciones/flujos/${res.id}`);
    else router.push("/automatizaciones/flujos");
  }
  return (
    <form action={onSubmit} className="max-w-lg space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" required placeholder="Generar vídeo HeyGen" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="webhook_url">Webhook de n8n (https)</Label>
        <Input id="webhook_url" name="webhook_url" required placeholder="https://n8n.tu-dominio.com/webhook/..." />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea id="description" name="description" rows={2} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="input_fields">Campos de entrada (una por línea: <code>clave|etiqueta|tipo</code>)</Label>
        <Textarea id="input_fields" name="input_fields" rows={4}
          placeholder={"guion|Guion|textarea\nidioma|Idioma|text"} />
        <p className="text-xs text-ink-4">Tipos: text, textarea, number. Si omites etiqueta/tipo se usan la clave y «text».</p>
      </div>
      <Button type="submit">Crear flujo</Button>
    </form>
  );
}
```

- [ ] **Step 3: `flow-trigger.tsx`**

```tsx
"use client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { triggerFlow } from "@/lib/automatizaciones/actions";
import type { InputField } from "@/lib/automatizaciones/flows";

export function FlowTrigger({ flowId, fields }: { flowId: string; fields: InputField[] }) {
  const router = useRouter();
  async function onSubmit(fd: FormData) {
    const res = await triggerFlow(flowId, fd);
    if (res?.error) { toast.error(res.error); return; }
    toast.success("Flujo disparado");
    router.refresh();
  }
  return (
    <form action={onSubmit} className="space-y-3">
      {fields.map((f) => (
        <div key={f.key} className="space-y-1">
          <Label htmlFor={`f-${f.key}`}>{f.label}</Label>
          {f.type === "textarea"
            ? <Textarea id={`f-${f.key}`} name={f.key} rows={3} />
            : <Input id={`f-${f.key}`} name={f.key} type={f.type === "number" ? "number" : "text"} />}
        </div>
      ))}
      <Button type="submit">Disparar</Button>
    </form>
  );
}
```

- [ ] **Step 4: `run-history.tsx`**

```tsx
import { Badge } from "@/components/ui/badge";
import { runStatusLabel } from "@/lib/automatizaciones/flows";
import type { RunRow } from "@/lib/automatizaciones/queries";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  ok: "default", running: "secondary", error: "destructive",
};

export function RunHistory({ runs }: { runs: RunRow[] }) {
  if (runs.length === 0) return <p className="text-sm text-ink-3">Sin ejecuciones todavía.</p>;
  return (
    <div className="space-y-2">
      {runs.map((r) => (
        <div key={r.id} className="rounded-md border border-line bg-elevated p-3">
          <div className="flex items-center justify-between gap-3">
            <Badge variant={STATUS_VARIANT[r.status] ?? "secondary"}>{runStatusLabel(r.status)}</Badge>
            <span className="font-mono text-[11px] text-ink-4">{new Date(r.created_at).toLocaleString("es-ES")}</span>
          </div>
          {r.error && <p className="mt-2 text-sm text-destructive">{r.error}</p>}
          {r.result != null && (
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs text-ink-3">
              {typeof r.result === "string" ? r.result : JSON.stringify(r.result, null, 2)}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: `flow-delete-button.tsx`**

```tsx
"use client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteFlow } from "@/lib/automatizaciones/actions";

export function FlowDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  async function onDelete() {
    if (!confirm("¿Borrar este flujo y su historial?")) return;
    const res = await deleteFlow(id);
    if (res?.error) { toast.error(res.error); return; }
    toast.success("Flujo borrado");
    router.push("/automatizaciones/flujos");
  }
  return <Button variant="ghost" size="sm" onClick={onDelete}>Borrar</Button>;
}
```

- [ ] **Step 6: Build.** `npm run build` → sin errores.

- [ ] **Step 7: Commit.**
```bash
git add src/components/automatizaciones/
git commit -m "feat(automatizaciones+): componentes (flow-list/form/trigger, run-history, delete)"
```

---

### Task 7: Páginas + enlace + verificación final

**Files:** Create `src/app/(app)/automatizaciones/flujos/{page.tsx, nuevo/page.tsx, [id]/page.tsx}`; Modify `src/app/(app)/automatizaciones/page.tsx`.

- [ ] **Step 1: `flujos/page.tsx`**

```tsx
import Link from "next/link";
import { listFlows } from "@/lib/automatizaciones/queries";
import { FlowList } from "@/components/automatizaciones/flow-list";
import { Button } from "@/components/ui/button";

export default async function FlujosPage() {
  const flows = await listFlows();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Flujos</h1>
          <p className="mt-1 text-sm text-ink-3">Dispara workflows de n8n y revisa sus ejecuciones.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link href="/automatizaciones">Alertas</Link></Button>
          <Button asChild><Link href="/automatizaciones/flujos/nuevo">Nuevo flujo</Link></Button>
        </div>
      </div>
      <FlowList flows={flows} />
    </div>
  );
}
```

- [ ] **Step 2: `flujos/nuevo/page.tsx`**

```tsx
import { FlowForm } from "@/components/automatizaciones/flow-form";

export default function NuevoFlujoPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Nuevo flujo</h1>
      <FlowForm />
    </div>
  );
}
```

- [ ] **Step 3: `flujos/[id]/page.tsx`**

```tsx
import { getFlow, listRuns } from "@/lib/automatizaciones/queries";
import { FlowTrigger } from "@/components/automatizaciones/flow-trigger";
import { RunHistory } from "@/components/automatizaciones/run-history";
import { FlowDeleteButton } from "@/components/automatizaciones/flow-delete-button";
import { Card } from "@/components/ui/card";

export default async function FlujoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [flow, runs] = await Promise.all([getFlow(id), listRuns(id)]);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{flow.name}</h1>
          {flow.description && <p className="mt-1 text-sm text-ink-3">{flow.description}</p>}
        </div>
        <FlowDeleteButton id={id} />
      </div>
      <Card className="p-4">
        <h2 className="mb-3 font-medium text-ink">Disparar</h2>
        <FlowTrigger flowId={id} fields={flow.input_fields} />
      </Card>
      <div>
        <h2 className="mb-3 font-medium text-ink">Ejecuciones</h2>
        <RunHistory runs={runs} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Enlace desde la página de alertas.** En `src/app/(app)/automatizaciones/page.tsx`, en el `<div className="flex ...">` que contiene el botón "Ajustes", añadir ANTES del botón de Ajustes un botón a Flujos. Es decir, reemplazar:

```tsx
        <Button asChild variant="outline"><Link href="/automatizaciones/ajustes">Ajustes</Link></Button>
```

por:

```tsx
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link href="/automatizaciones/flujos">Flujos</Link></Button>
          <Button asChild variant="outline"><Link href="/automatizaciones/ajustes">Ajustes</Link></Button>
        </div>
```

(Verifica el contexto real del archivo; el objetivo es añadir un enlace a `/automatizaciones/flujos` junto al de Ajustes sin alterar el resto.)

- [ ] **Step 5: Build y tests.**
`npm run build` → limpio; aparecen `/automatizaciones/flujos`, `/automatizaciones/flujos/nuevo`, `/automatizaciones/flujos/[id]`, `/api/automatizaciones/callback`.
`npm test` → todo verde (incluye los 5 describes de `flows.test.ts`).

- [ ] **Step 6: Commit.**
```bash
git add "src/app/(app)/automatizaciones/"
git commit -m "feat(automatizaciones+): páginas de flujos + enlace desde alertas"
```

---

## Notas de integración (tras completar todas las tasks)

- **NO** se añade entrada en el nav (la enciende la terminal de diseño; `/automatizaciones` ya está, y Flujos cuelga por enlace).
- **Vercel:** añadir `AUTOMATION_PUBLIC_URL=https://juana-sanchez-panel.vercel.app` como env var de producción, y re-desplegar. Sin ella, el `callbackUrl` que recibe n8n sería inválido (pero el disparo sigue registrándose).
- **Verificación funcional sugerida** (con n8n real): crear un workflow n8n con un nodo Webhook que responda 200 y, en una rama, haga un POST de vuelta a `callbackUrl` con `{ runId, token: callbackToken, status: "ok", result: {...} }`. Registrar el flujo en el panel, dispararlo, y ver la ejecución pasar de "En curso" a "Completado".
- Integración por `main`: `git pull` antes de mergear; conflicto probable solo en `src/types/db.ts` (generado) → regenerar desde la BD viva.
