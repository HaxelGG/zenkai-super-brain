# Automatizaciones+ Fase 3a Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Botón "Enviar a flujo" en la ficha de clienta (`/crm/[id]`) y producto (`/inventario/[id]`) que dispara un flujo n8n con un payload fijo de los datos de la entidad.

**Architecture:** Lógica pura `buildEntityPayload` (en `flows.ts`), server action `triggerFlowForEntity` que reutiliza `dispatchFlow`, un componente client de disparo, y ediciones mínimas a las dos fichas. Sin migraciones.

**Tech Stack:** Next.js 16, Supabase, shadcn/ui, Atelier, sonner, Vitest.

**Reglas:** NO tocar nav/sidebar. NO alterar la lógica existente de las fichas (interacciones CRM, ajuste de stock). Reutiliza `automation_flows` + `dispatchFlow`. Rama: `feat/automatizaciones-entity-trigger`. Sin migraciones → no debería tocar `db.ts`.

---

## File Structure

- `src/lib/automatizaciones/flows.ts` (+ `flows.test.ts`) — AMPLIAR con `buildEntityPayload`.
- `src/lib/automatizaciones/actions.ts` — AMPLIAR con `triggerFlowForEntity`.
- `src/components/automatizaciones/entity-flow-trigger.tsx` — nuevo.
- `src/app/(app)/crm/[id]/page.tsx` — AMPLIAR (control).
- `src/app/(app)/inventario/[id]/page.tsx` — AMPLIAR (control).

---

### Task 1: Lógica pura `buildEntityPayload` (TDD)

**Files:** Modify `src/lib/automatizaciones/flows.test.ts`, `src/lib/automatizaciones/flows.ts`.

- [ ] **Step 1: Ampliar el test.** En `src/lib/automatizaciones/flows.test.ts`, añadir `buildEntityPayload` al import existente de `./flows` y AÑADIR este describe al final del archivo:

```ts
describe("buildEntityPayload", () => {
  it("customer: incluye datos clave; null → ''", () => {
    expect(buildEntityPayload("customer", { id: "c1", name: "Ana", email: null, phone: "600", company_id: "co1" })).toEqual({
      entityType: "customer", id: "c1", name: "Ana", email: "", phone: "600", company_id: "co1",
    });
  });
  it("product: incluye sku/price; sku null → ''", () => {
    expect(buildEntityPayload("product", { id: "p1", name: "Vestido", sku: null, price: 320, company_id: "co1" })).toEqual({
      entityType: "product", id: "p1", name: "Vestido", sku: "", price: 320, company_id: "co1",
    });
  });
});
```

(El import debe quedar: `import { parseInputFields, parseInputFieldLines, buildFlowPayload, isValidWebhookUrl, runStatusLabel, buildEntityPayload } from "./flows";`)

- [ ] **Step 2: Ver fallar.** `npm test -- flows.test` → FAIL (`buildEntityPayload` no exportado).

- [ ] **Step 3: Implementar.** Añadir AL FINAL de `src/lib/automatizaciones/flows.ts`:

```ts
export function buildEntityPayload(
  entityType: "customer" | "product",
  entity: Record<string, unknown>,
): Record<string, string | number> {
  if (entityType === "customer") {
    return {
      entityType: "customer",
      id: String(entity.id ?? ""),
      name: String(entity.name ?? ""),
      email: entity.email == null ? "" : String(entity.email),
      phone: entity.phone == null ? "" : String(entity.phone),
      company_id: String(entity.company_id ?? ""),
    };
  }
  return {
    entityType: "product",
    id: String(entity.id ?? ""),
    name: String(entity.name ?? ""),
    sku: entity.sku == null ? "" : String(entity.sku),
    price: typeof entity.price === "number" ? entity.price : Number(entity.price ?? 0),
    company_id: String(entity.company_id ?? ""),
  };
}
```

- [ ] **Step 4: Ver pasar.** `npm test -- flows.test` → PASS.

- [ ] **Step 5: Commit.**
```bash
git add src/lib/automatizaciones/flows.ts src/lib/automatizaciones/flows.test.ts
git commit -m "feat(automatizaciones+): buildEntityPayload (payload fijo por entidad) con tests"
```

---

### Task 2: Server action `triggerFlowForEntity`

**Files:** Modify `src/lib/automatizaciones/actions.ts`.

- [ ] **Step 1: Ampliar el import de `./flows`** en `actions.ts` para incluir `buildEntityPayload` (junto a los ya importados `isValidWebhookUrl, parseInputFieldLines, parseInputFields, buildFlowPayload`). `dispatchFlow` ya está importado desde `./dispatch`.

- [ ] **Step 2: Añadir AL FINAL de `actions.ts`:**

```ts
export async function triggerFlowForEntity(
  flowId: string,
  entityType: "customer" | "product",
  entityId: string,
) {
  const supabase = await createClient();
  const { data: flow, error: fErr } = await supabase
    .from("automation_flows").select("id,webhook_url,enabled").eq("id", flowId).single();
  if (fErr) return { error: fErr.message };
  if (!flow.enabled) return { error: "El flujo está desactivado." };

  let payload: Record<string, string | number>;
  if (entityType === "customer") {
    const { data, error } = await supabase
      .from("customers").select("id,name,email,phone,company_id").eq("id", entityId).single();
    if (error) return { error: error.message };
    payload = buildEntityPayload("customer", data);
  } else {
    const { data, error } = await supabase
      .from("products").select("id,name,sku,price,company_id").eq("id", entityId).single();
    if (error) return { error: error.message };
    payload = buildEntityPayload("product", data);
  }

  const res = await dispatchFlow(supabase, { id: flow.id, webhook_url: flow.webhook_url }, payload);
  if ("error" in res) return res;
  return { runId: res.runId };
}
```

- [ ] **Step 3: Build.** `npm run build` → sin errores.

- [ ] **Step 4: Commit.**
```bash
git add src/lib/automatizaciones/actions.ts
git commit -m "feat(automatizaciones+): action triggerFlowForEntity (dispara flujo con datos de la entidad)"
```

---

### Task 3: Componente `entity-flow-trigger.tsx`

**Files:** Create `src/components/automatizaciones/entity-flow-trigger.tsx`.

- [ ] **Step 1: Crear** con exactamente:

```tsx
"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { triggerFlowForEntity } from "@/lib/automatizaciones/actions";

export function EntityFlowTrigger({
  entityType, entityId, flows,
}: {
  entityType: "customer" | "product";
  entityId: string;
  flows: { id: string; name: string }[];
}) {
  const [flowId, setFlowId] = useState(flows[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  async function onSend() {
    if (!flowId || loading) return;
    setLoading(true);
    const res = await triggerFlowForEntity(flowId, entityType, entityId);
    setLoading(false);
    if ("error" in res) { toast.error(res.error); return; }
    toast.success("Flujo disparado");
  }
  return (
    <span className="flex items-center gap-2">
      <select
        value={flowId}
        onChange={(e) => setFlowId(e.target.value)}
        aria-label="Flujo"
        className="rounded-md border border-line bg-paper p-2 text-sm text-ink"
      >
        {flows.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
      </select>
      <Button variant="outline" size="sm" onClick={onSend} disabled={loading}>
        {loading ? "Enviando…" : "Enviar a flujo"}
      </Button>
    </span>
  );
}
```

- [ ] **Step 2: Build.** `npm run build` → sin errores.

- [ ] **Step 3: Commit.**
```bash
git add src/components/automatizaciones/entity-flow-trigger.tsx
git commit -m "feat(automatizaciones+): componente EntityFlowTrigger (selector de flujo + enviar)"
```

---

### Task 4: Cablear en las fichas + verificación

**Files:** Modify `src/app/(app)/crm/[id]/page.tsx`, `src/app/(app)/inventario/[id]/page.tsx`.

- [ ] **Step 1: CRM (`src/app/(app)/crm/[id]/page.tsx`).**
  Añadir imports:
```tsx
import { listFlows } from "@/lib/automatizaciones/queries";
import { EntityFlowTrigger } from "@/components/automatizaciones/entity-flow-trigger";
```
  Cambiar la línea del `Promise.all` para traer también los flujos. Reemplazar:
```tsx
  const [customer, interactions] = await Promise.all([getCustomer(id), listInteractions(id)]);
```
  por:
```tsx
  const [customer, interactions, flows] = await Promise.all([getCustomer(id), listInteractions(id), listFlows()]);
```
  Y en la cabecera, reemplazar la línea del botón Editar:
```tsx
        <Button asChild variant="outline"><Link href={`/crm/${id}/editar`}>Editar</Link></Button>
```
  por:
```tsx
        <div className="flex items-center gap-2">
          {flows.length > 0 && (
            <EntityFlowTrigger entityType="customer" entityId={id} flows={flows.map((f) => ({ id: f.id, name: f.name }))} />
          )}
          <Button asChild variant="outline"><Link href={`/crm/${id}/editar`}>Editar</Link></Button>
        </div>
```

- [ ] **Step 2: Inventario (`src/app/(app)/inventario/[id]/page.tsx`).**
  Añadir imports:
```tsx
import { listFlows } from "@/lib/automatizaciones/queries";
import { EntityFlowTrigger } from "@/components/automatizaciones/entity-flow-trigger";
```
  Cambiar el `Promise.all`. Reemplazar:
```tsx
  const [product, movements] = await Promise.all([getProduct(id), listMovements(id)]);
```
  por:
```tsx
  const [product, movements, flows] = await Promise.all([getProduct(id), listMovements(id), listFlows()]);
```
  Y en la cabecera, reemplazar el bloque del botón Editar:
```tsx
        <Button asChild variant="outline" size="sm">
          <Link href={`/inventario/${id}/editar`}>
            <Pencil className="h-3.5 w-3.5" /> Editar
          </Link>
        </Button>
```
  por:
```tsx
        <div className="flex items-center gap-2">
          {flows.length > 0 && (
            <EntityFlowTrigger entityType="product" entityId={id} flows={flows.map((f) => ({ id: f.id, name: f.name }))} />
          )}
          <Button asChild variant="outline" size="sm">
            <Link href={`/inventario/${id}/editar`}>
              <Pencil className="h-3.5 w-3.5" /> Editar
            </Link>
          </Button>
        </div>
```

- [ ] **Step 3: Build y tests.**
`npm run build` → limpio (las fichas `/crm/[id]` y `/inventario/[id]` siguen presentes).
`npm test` → todo verde (incluye los tests de `flows.test.ts` con `buildEntityPayload`).

- [ ] **Step 4: Commit.**
```bash
git add "src/app/(app)/crm/[id]/page.tsx" "src/app/(app)/inventario/[id]/page.tsx"
git commit -m "feat(automatizaciones+): control 'Enviar a flujo' en fichas de clienta y producto"
```

---

## Notas de integración

- Sin migraciones → no debería haber conflicto de `db.ts` al mergear; aun así `git pull` antes.
- No toca nav/sidebar ni la lógica existente de las fichas (solo añade el control en la cabecera).
- Verificación funcional: con un flujo registrado, abrir una clienta/producto, elegir el flujo y "Enviar a flujo" → aparece una ejecución en `/automatizaciones/flujos/[id]`.
