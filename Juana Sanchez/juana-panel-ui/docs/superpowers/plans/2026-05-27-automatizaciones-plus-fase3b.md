# Automatizaciones+ Fase 3b Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Historial de ejecuciones con resultado legible (texto/enlace + JSON colapsable) y botón "Reintentar" (re-dispara con el mismo input, nuevo run).

**Architecture:** Pure `summarizeResult` (en `flows.ts`), action `retryRun` (reutiliza `dispatchFlow`), componente client `RunRetryButton`, y reescritura del render de `run-history.tsx`. Sin migraciones.

**Tech Stack:** Next.js 16, Supabase, shadcn/ui, Atelier, sonner, Vitest.

**Reglas:** NO tocar nav/sidebar. Sin migraciones (no debería tocar `db.ts`). Reutiliza `automation_runs` + `dispatchFlow`. Rama: `feat/automatizaciones-run-viewer`.

---

### Task 1: Lógica pura `summarizeResult` (TDD)

**Files:** Modify `src/lib/automatizaciones/flows.test.ts`, `src/lib/automatizaciones/flows.ts`.

- [ ] **Step 1: Ampliar el test.** Añadir `summarizeResult` al import de `./flows` en `flows.test.ts` y AÑADIR al final:

```ts
describe("summarizeResult", () => {
  it("string no vacío → text", () => {
    expect(summarizeResult("Hola mundo")).toEqual({ kind: "text", value: "Hola mundo" });
  });
  it("objeto con url o link → link (url prioritario)", () => {
    expect(summarizeResult({ url: "https://x.com/v.mp4" })).toEqual({ kind: "link", value: "https://x.com/v.mp4" });
    expect(summarizeResult({ link: "https://x.com/a" })).toEqual({ kind: "link", value: "https://x.com/a" });
    expect(summarizeResult({ url: "https://u", link: "https://l" })).toEqual({ kind: "link", value: "https://u" });
  });
  it("objeto sin url/link → json formateado", () => {
    expect(summarizeResult({ ok: true, n: 2 })).toEqual({ kind: "json", value: JSON.stringify({ ok: true, n: 2 }, null, 2) });
  });
  it("null → json vacío; array → json", () => {
    expect(summarizeResult(null)).toEqual({ kind: "json", value: "" });
    expect(summarizeResult([1, 2])).toEqual({ kind: "json", value: JSON.stringify([1, 2], null, 2) });
  });
});
```

(Import resultante: `import { parseInputFields, parseInputFieldLines, buildFlowPayload, isValidWebhookUrl, runStatusLabel, buildEntityPayload, summarizeResult } from "./flows";`)

- [ ] **Step 2: Ver fallar.** `npm test -- flows.test` → FAIL.

- [ ] **Step 3: Implementar.** Añadir AL FINAL de `src/lib/automatizaciones/flows.ts`:

```ts
export function summarizeResult(result: unknown): { kind: "text" | "link" | "json"; value: string } {
  if (typeof result === "string") {
    return result.trim() ? { kind: "text", value: result } : { kind: "json", value: "" };
  }
  if (result && typeof result === "object" && !Array.isArray(result)) {
    const rec = result as Record<string, unknown>;
    if (typeof rec.url === "string" && rec.url) return { kind: "link", value: rec.url };
    if (typeof rec.link === "string" && rec.link) return { kind: "link", value: rec.link };
  }
  if (result == null) return { kind: "json", value: "" };
  return { kind: "json", value: JSON.stringify(result, null, 2) };
}
```

- [ ] **Step 4: Ver pasar.** `npm test -- flows.test` → PASS.

- [ ] **Step 5: Commit.**
```bash
git add src/lib/automatizaciones/flows.ts src/lib/automatizaciones/flows.test.ts
git commit -m "feat(automatizaciones+): summarizeResult (resultado legible/enlace/json) con tests"
```

---

### Task 2: Server action `retryRun`

**Files:** Modify `src/lib/automatizaciones/actions.ts`.

- [ ] **Step 1: Añadir AL FINAL de `actions.ts`** (los imports `createClient`, `revalidatePath`, `dispatchFlow` ya están):

```ts
export async function retryRun(runId: string) {
  const supabase = await createClient();
  const { data: run, error: rErr } = await supabase
    .from("automation_runs").select("flow_id,input").eq("id", runId).single();
  if (rErr) return { error: rErr.message };
  const { data: flow, error: fErr } = await supabase
    .from("automation_flows").select("id,webhook_url,enabled").eq("id", run.flow_id).single();
  if (fErr) return { error: fErr.message };
  if (!flow.enabled) return { error: "El flujo está desactivado." };

  const input = (run.input ?? {}) as Record<string, string | number | boolean>;
  const res = await dispatchFlow(supabase, { id: flow.id, webhook_url: flow.webhook_url }, input);
  if ("error" in res) return res;
  revalidatePath(`/automatizaciones/flujos/${run.flow_id}`);
  return { runId: res.runId };
}
```

- [ ] **Step 2: Build.** `npm run build` → sin errores.

- [ ] **Step 3: Commit.**
```bash
git add src/lib/automatizaciones/actions.ts
git commit -m "feat(automatizaciones+): action retryRun (re-dispara con el mismo input, nuevo run)"
```

---

### Task 3: Componente RunRetryButton + reescribir run-history + verificación

**Files:** Create `src/components/automatizaciones/run-retry-button.tsx`; Modify `src/components/automatizaciones/run-history.tsx`.

- [ ] **Step 1: Crear `run-retry-button.tsx`** con exactamente:

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { retryRun } from "@/lib/automatizaciones/actions";

export function RunRetryButton({ runId }: { runId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function onRetry() {
    if (loading) return;
    setLoading(true);
    const res = await retryRun(runId);
    setLoading(false);
    if ("error" in res) { toast.error(res.error); return; }
    toast.success("Reintentado");
    router.refresh();
  }
  return (
    <Button variant="ghost" size="sm" onClick={onRetry} disabled={loading}>
      {loading ? "…" : "Reintentar"}
    </Button>
  );
}
```

- [ ] **Step 2: Reescribir `src/components/automatizaciones/run-history.tsx`** con exactamente:

```tsx
import { Badge } from "@/components/ui/badge";
import { runStatusLabel, summarizeResult } from "@/lib/automatizaciones/flows";
import type { RunRow } from "@/lib/automatizaciones/queries";
import { RunRetryButton } from "./run-retry-button";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  ok: "default", running: "secondary", error: "destructive",
};

function ResultView({ result }: { result: unknown }) {
  const r = summarizeResult(result);
  if (!r.value) return null;
  if (r.kind === "link") {
    return (
      <a href={r.value} target="_blank" rel="noreferrer"
        className="mt-2 block truncate text-sm text-ink underline">
        {r.value}
      </a>
    );
  }
  if (r.kind === "text") {
    return <p className="mt-2 whitespace-pre-wrap text-sm text-ink-3">{r.value}</p>;
  }
  return (
    <details className="mt-2">
      <summary className="cursor-pointer text-xs text-ink-4">Ver resultado</summary>
      <pre className="mt-1 overflow-x-auto whitespace-pre-wrap text-xs text-ink-3">{r.value}</pre>
    </details>
  );
}

export function RunHistory({ runs }: { runs: RunRow[] }) {
  if (runs.length === 0) return <p className="text-sm text-ink-3">Sin ejecuciones todavía.</p>;
  return (
    <div className="space-y-2">
      {runs.map((r) => (
        <div key={r.id} className="rounded-md border border-line bg-elevated p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge variant={STATUS_VARIANT[r.status] ?? "secondary"}>{runStatusLabel(r.status)}</Badge>
              <span className="font-mono text-[11px] text-ink-4">{new Date(r.created_at).toLocaleString("es-ES")}</span>
            </div>
            {r.status !== "running" && <RunRetryButton runId={r.id} />}
          </div>
          {r.error && <p className="mt-2 text-sm text-destructive">{r.error}</p>}
          <ResultView result={r.result} />
        </div>
      ))}
    </div>
  );
}
```

(El enlace usa `text-ink underline`, sin depender de tokens de marca.)

- [ ] **Step 3: Build y tests.**
`npm run build` → limpio; `/automatizaciones/flujos/[id]` sigue presente.
`npm test` → todo verde (incluye `summarizeResult` en `flows.test.ts`).

- [ ] **Step 4: Commit.**
```bash
git add src/components/automatizaciones/run-retry-button.tsx src/components/automatizaciones/run-history.tsx
git commit -m "feat(automatizaciones+): visor de resultado (legible/colapsable) + botón Reintentar en el historial"
```

---

## Notas de integración

- Sin migraciones → merge limpio esperado; `git pull` antes igualmente.
- No toca nav/sidebar.
- Verificación funcional: en `/automatizaciones/flujos/[id]`, un run con resultado-enlace muestra link clicable; un run con error muestra "Reintentar" → crea un run nuevo con el mismo input.
