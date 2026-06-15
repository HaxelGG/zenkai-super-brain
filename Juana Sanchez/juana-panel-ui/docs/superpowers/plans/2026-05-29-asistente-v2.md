# El Asistente v2 (acciones CRM/Ventas/Tareas) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing `/asistente` (already in prod) with read+write tools over CRM, Ventas and Tareas, delegating writes to the other terminal's already-validated server actions, behind the same confirmation gate.

**Architecture:** Additive only — new entries in `tools.ts`, new validation/summary cases, new read queries, and new routing in `execute.ts` that imports and calls `@/lib/crm/actions`, `@/lib/ventas/actions`, `@/lib/tareas/actions`. The generic agent loop in `actions.ts` and the chat UI are unchanged (any new `isWriteTool` is auto-gated; any read auto-runs). No migration.

**Tech Stack:** Next.js 16 server actions, Supabase (RLS), OpenRouter tool-calling, TypeScript, Vitest.

---

## File Structure

**Modify (all under `src/lib/asistente/`):**
- `tools.ts` (+`tools.test.ts`) — 7 new `ToolDef` + enum lists
- `validate.ts` (+`validate.test.ts`) — new cases
- `summary.ts` (+`summary.test.ts`) — new cases
- `queries.ts` — `findCustomers`, `findSales`, `listTasks`
- `execute.ts` — route new reads + writes (call imported actions)
- `prompts.ts` — mention the new areas

**Do NOT touch:** `actions.ts` (generic loop — no change needed), `assistant-chat.tsx`/page (generic), `nav-config.tsx` (entry already exists), and never the other terminal's files, `lib/ia`, `sidebar.tsx`.

---

## Task 1: Tool registry additions

**Files:** Modify `src/lib/asistente/tools.ts`; Test `src/lib/asistente/tools.test.ts`

- [ ] **Step 1: Update the test count expectation**

In `src/lib/asistente/tools.test.ts`, replace the first test's expectation (the `.sort()` array) with the 14-tool list and add an enum-list assertion. Replace:

```ts
  it("declares the seven v1 tools", () => {
    expect(TOOL_DEFS.map((t) => t.name).sort()).toEqual(
      ["create_piece", "find_member", "find_piece", "list_pieces", "set_member_active", "set_member_tier", "set_piece_stage"],
    );
  });
```

with:

```ts
  it("declares all v1 + v2 tools", () => {
    expect(TOOL_DEFS.map((t) => t.name).sort()).toEqual(
      [
        "create_piece", "create_task", "find_customer", "find_member", "find_piece", "find_sale",
        "list_pieces", "list_tasks", "log_interaction", "set_member_active", "set_member_tier",
        "set_piece_stage", "set_sale_status", "set_task_status",
      ],
    );
  });

  it("classifies the v2 write tools", () => {
    for (const w of ["log_interaction", "create_task", "set_task_status", "set_sale_status"]) {
      expect(isWriteTool(w)).toBe(true);
    }
    for (const r of ["find_customer", "find_sale", "list_tasks"]) {
      expect(isWriteTool(r)).toBe(false);
    }
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/asistente/tools.test.ts`
Expected: FAIL (array mismatch / new tools missing).

- [ ] **Step 3: Add enum lists + tool defs**

In `src/lib/asistente/tools.ts`, add these exported lists right after the existing `CIRCLE_TIERS` line:

```ts
export const INTERACTION_TYPES = ["llamada", "email", "visita", "whatsapp", "otro"] as const;
export const TASK_STATUSES = ["pendiente", "en_curso", "hecha"] as const;
export const TASK_PRIORITIES = ["baja", "media", "alta"] as const;
export const TASK_AREAS = ["inventario", "comercial", "ventas", "finanzas", "general"] as const;
export const SALE_STATUSES_SETTABLE = ["pendiente", "pagada", "entregada"] as const;
```

Then add these 7 entries to the `TOOL_DEFS` array (before the closing `];`):

```ts
  {
    name: "find_customer", kind: "read",
    description: "Busca clientas/clientes del CRM por nombre o email. Úsalo para resolver el id antes de registrar algo.",
    parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
  },
  {
    name: "find_sale", kind: "read",
    description: "Busca ventas/pedidos por su número. Devuelve id, número, estado y total.",
    parameters: { type: "object", properties: { query: { type: "string", description: "número o parte del número de la venta" } }, required: ["query"] },
  },
  {
    name: "list_tasks", kind: "read",
    description: "Lista tareas, opcionalmente filtradas por estado.",
    parameters: { type: "object", properties: { status: { type: "string", enum: [...TASK_STATUSES] } } },
  },
  {
    name: "log_interaction", kind: "write",
    description: "Registra una interacción con una clienta (llamada, email, visita, whatsapp u otro). Requiere el id de la clienta (úsa find_customer primero).",
    parameters: {
      type: "object",
      properties: {
        customer_id: { type: "string" },
        type: { type: "string", enum: [...INTERACTION_TYPES] },
        summary: { type: "string", description: "resumen breve de la interacción" },
        occurred_at: { type: "string", description: "fecha YYYY-MM-DD; si se omite, hoy" },
      },
      required: ["customer_id", "type", "summary"],
    },
  },
  {
    name: "create_task", kind: "write",
    description: "Crea una tarea.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        priority: { type: "string", enum: [...TASK_PRIORITIES] },
        area: { type: "string", enum: [...TASK_AREAS] },
        due_date: { type: "string", description: "fecha YYYY-MM-DD" },
      },
      required: ["title"],
    },
  },
  {
    name: "set_task_status", kind: "write",
    description: "Cambia el estado de una tarea (pendiente, en_curso, hecha). Requiere el id (úsa list_tasks primero).",
    parameters: { type: "object", properties: { task_id: { type: "string" }, status: { type: "string", enum: [...TASK_STATUSES] } }, required: ["task_id", "status"] },
  },
  {
    name: "set_sale_status", kind: "write",
    description: "Cambia el estado de una venta a pendiente, pagada o entregada. Requiere el id (úsa find_sale primero). No puede cancelar ni reactivar ventas canceladas.",
    parameters: { type: "object", properties: { sale_id: { type: "string" }, status: { type: "string", enum: [...SALE_STATUSES_SETTABLE] } }, required: ["sale_id", "status"] },
  },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/asistente/tools.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/asistente/tools.ts src/lib/asistente/tools.test.ts
git commit -m "feat(asistente): v2 tool registry — CRM/Ventas/Tareas tools"
```

---

## Task 2: Validation additions

**Files:** Modify `src/lib/asistente/validate.ts`; Test `src/lib/asistente/validate.test.ts`

- [ ] **Step 1: Add failing tests**

Append inside the `describe("validateArgs", …)` block in `src/lib/asistente/validate.test.ts`:

```ts
  it("validates log_interaction", () => {
    expect(validateArgs("log_interaction", { customer_id: "c1", type: "llamada", summary: "Pidió ampliar pedido" }))
      .toEqual({ args: { customer_id: "c1", type: "llamada", summary: "Pidió ampliar pedido", occurred_at: null } });
    expect(validateArgs("log_interaction", { customer_id: "c1", type: "fax", summary: "x" })).toHaveProperty("error");
    expect(validateArgs("log_interaction", { customer_id: "c1", type: "email", summary: "  " })).toHaveProperty("error");
  });

  it("validates create_task with defaults", () => {
    expect(validateArgs("create_task", { title: "Revisar stock" }))
      .toEqual({ args: { title: "Revisar stock", description: null, priority: "media", area: "general", due_date: null } });
    expect(validateArgs("create_task", { title: "x", priority: "urgente" })).toHaveProperty("error");
    expect(validateArgs("create_task", {})).toHaveProperty("error");
  });

  it("validates set_task_status and set_sale_status", () => {
    expect(validateArgs("set_task_status", { task_id: "t1", status: "hecha" })).toEqual({ args: { task_id: "t1", status: "hecha" } });
    expect(validateArgs("set_task_status", { task_id: "t1", status: "archivada" })).toHaveProperty("error");
    expect(validateArgs("set_sale_status", { sale_id: "s1", status: "pagada" })).toEqual({ args: { sale_id: "s1", status: "pagada" } });
    expect(validateArgs("set_sale_status", { sale_id: "s1", status: "cancelada" })).toHaveProperty("error");
  });

  it("validates find_customer/find_sale/list_tasks", () => {
    expect(validateArgs("find_customer", { query: "Marta" })).toEqual({ args: { query: "Marta" } });
    expect(validateArgs("find_sale", { query: "" })).toHaveProperty("error");
    expect(validateArgs("list_tasks", { status: "en_curso" })).toEqual({ args: { status: "en_curso" } });
    expect(validateArgs("list_tasks", {})).toEqual({ args: {} });
    expect(validateArgs("list_tasks", { status: "zzz" })).toHaveProperty("error");
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/asistente/validate.test.ts`
Expected: FAIL (new tools fall through to the unknown-tool branch / wrong shape).

- [ ] **Step 3: Implement**

In `src/lib/asistente/validate.ts`, extend the import from `./tools` to include the new lists:

```ts
import { WORKSHOP_STAGES, CIRCLE_TIERS, INTERACTION_TYPES, TASK_STATUSES, TASK_PRIORITIES, TASK_AREAS, SALE_STATUSES_SETTABLE } from "./tools";
```

Add these membership helpers next to the existing `isStage`/`isTier`:

```ts
const inList = (list: readonly string[]) => (v: unknown): v is string => typeof v === "string" && list.includes(v);
const isInteraction = inList(INTERACTION_TYPES);
const isTaskStatus = inList(TASK_STATUSES);
const isTaskPriority = inList(TASK_PRIORITIES);
const isTaskArea = inList(TASK_AREAS);
const isSettableSale = inList(SALE_STATUSES_SETTABLE);
```

Add these `case`s to the `switch (toolName)` (before the `default`):

```ts
    case "find_customer":
    case "find_sale":
      return nonEmpty(raw.query) ? { args: { query: (raw.query as string).trim() } } : { error: "Falta el texto de búsqueda." };

    case "list_tasks":
      if (raw.status !== undefined && !isTaskStatus(raw.status)) return { error: `Estado no válido: ${String(raw.status)}` };
      return { args: raw.status !== undefined ? { status: raw.status } : {} };

    case "log_interaction": {
      if (!nonEmpty(raw.customer_id)) return { error: "Falta el id de la clienta." };
      if (!isInteraction(raw.type)) return { error: `Tipo de interacción no válido: ${String(raw.type)}` };
      if (!nonEmpty(raw.summary)) return { error: "Falta el resumen de la interacción." };
      if (raw.occurred_at !== undefined && raw.occurred_at !== "" && !isDate(raw.occurred_at)) return { error: "Fecha no válida (usa YYYY-MM-DD)." };
      return { args: { customer_id: (raw.customer_id as string).trim(), type: raw.type, summary: (raw.summary as string).trim(), occurred_at: isDate(raw.occurred_at) ? raw.occurred_at : null } };
    }

    case "create_task": {
      if (!nonEmpty(raw.title)) return { error: "Falta el título de la tarea." };
      if (raw.priority !== undefined && !isTaskPriority(raw.priority)) return { error: `Prioridad no válida: ${String(raw.priority)}` };
      if (raw.area !== undefined && !isTaskArea(raw.area)) return { error: `Área no válida: ${String(raw.area)}` };
      if (raw.due_date !== undefined && raw.due_date !== "" && !isDate(raw.due_date)) return { error: "Fecha no válida (usa YYYY-MM-DD)." };
      return {
        args: {
          title: (raw.title as string).trim(),
          description: nonEmpty(raw.description) ? (raw.description as string).trim() : null,
          priority: isTaskPriority(raw.priority) ? raw.priority : "media",
          area: isTaskArea(raw.area) ? raw.area : "general",
          due_date: isDate(raw.due_date) ? raw.due_date : null,
        },
      };
    }

    case "set_task_status":
      if (!nonEmpty(raw.task_id)) return { error: "Falta el id de la tarea." };
      if (!isTaskStatus(raw.status)) return { error: `Estado no válido: ${String(raw.status)}` };
      return { args: { task_id: (raw.task_id as string).trim(), status: raw.status } };

    case "set_sale_status":
      if (!nonEmpty(raw.sale_id)) return { error: "Falta el id de la venta." };
      if (!isSettableSale(raw.status)) return { error: `Estado no válido (solo pendiente/pagada/entregada): ${String(raw.status)}` };
      return { args: { sale_id: (raw.sale_id as string).trim(), status: raw.status } };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/asistente/validate.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/asistente/validate.ts src/lib/asistente/validate.test.ts
git commit -m "feat(asistente): v2 validation for CRM/Ventas/Tareas tools"
```

---

## Task 3: Summary additions

**Files:** Modify `src/lib/asistente/summary.ts`; Test `src/lib/asistente/summary.test.ts`

- [ ] **Step 1: Add failing tests**

Append inside the `describe("summarizeAction", …)` block in `src/lib/asistente/summary.test.ts`:

```ts
  it("describes the v2 write actions", () => {
    expect(summarizeAction("log_interaction", { customer_id: "c", type: "llamada", summary: "Pidió ampliar" })).toContain("llamada");
    expect(summarizeAction("create_task", { title: "Revisar stock", priority: "alta", area: "inventario" })).toContain("Revisar stock");
    expect(summarizeAction("set_task_status", { task_id: "t", status: "hecha" })).toContain("hecha");
    expect(summarizeAction("set_sale_status", { sale_id: "s", status: "pagada" })).toContain("pagada");
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/asistente/summary.test.ts`
Expected: FAIL (these fall through to the default `Ejecutar …`).

- [ ] **Step 3: Implement**

In `src/lib/asistente/summary.ts`, add these `case`s before the `default`:

```ts
    case "log_interaction":
      return `Registrar una interacción (${String(args.type)}) con la clienta: «${String(args.summary)}».`;
    case "create_task":
      return `Crear la tarea «${String(args.title)}» (prioridad ${String(args.priority ?? "media")}, área ${String(args.area ?? "general")})${args.due_date ? `, vence ${String(args.due_date)}` : ""}.`;
    case "set_task_status":
      return `Cambiar el estado de la tarea a «${String(args.status)}».`;
    case "set_sale_status":
      return `Cambiar el estado de la venta a «${String(args.status)}».`;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/asistente/summary.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/asistente/summary.ts src/lib/asistente/summary.test.ts
git commit -m "feat(asistente): v2 action summaries"
```

---

## Task 4: Read queries

**Files:** Modify `src/lib/asistente/queries.ts`

No unit test (DB-bound); `npx tsc --noEmit` at the end.

- [ ] **Step 1: Add the three queries**

Append to `src/lib/asistente/queries.ts` (the `safe()` helper already exists in this file):

```ts
export async function findCustomers(companyId: string, query: string) {
  const supabase = await createClient();
  const s = safe(query);
  const { data, error } = await supabase
    .from("customers")
    .select("id,name,type,status,phone")
    .eq("company_id", companyId)
    .or(`name.ilike.%${s}%,email.ilike.%${s}%`)
    .limit(8);
  if (error) return { error: error.message };
  return { rows: data ?? [] };
}

export async function findSales(companyId: string, query: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sales")
    .select("id,number,status,total,customer_id")
    .eq("company_id", companyId)
    .ilike("number", `%${safe(query)}%`)
    .limit(8);
  if (error) return { error: error.message };
  return { rows: data ?? [] };
}

export async function listTasks(companyId: string, status?: string) {
  const supabase = await createClient();
  let q = supabase.from("tasks").select("id,title,status,priority,due_date").eq("company_id", companyId).limit(20);
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) return { error: error.message };
  return { rows: data ?? [] };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/asistente/queries.ts
git commit -m "feat(asistente): v2 read queries (customers, sales, tasks)"
```

---

## Task 5: Executor routing + prompt

**Files:** Modify `src/lib/asistente/execute.ts`, `src/lib/asistente/prompts.ts`

- [ ] **Step 1: Wire the new reads and writes**

In `src/lib/asistente/execute.ts`, add to the imports:

```ts
import { findPieces, listPiecesByStage, findMembers, findCustomers, findSales, listTasks } from "./queries";
import { logInteraction } from "@/lib/crm/actions";
import { setSaleStatus } from "@/lib/ventas/actions";
import { createTask, setTaskStatus } from "@/lib/tareas/actions";
import type { TaskStatus } from "@/lib/tareas/task";
```

In `executeRead`, add three branches before the final `else return … desconocida`:

```ts
  else if (name === "find_customer") r = await findCustomers(companyId, String(args.query));
  else if (name === "find_sale") r = await findSales(companyId, String(args.query));
  else if (name === "list_tasks") r = await listTasks(companyId, args.status as string | undefined);
```

In `executeWrite`, add these branches before the final `return … escritura desconocida`:

```ts
  if (name === "log_interaction") {
    const fd = new FormData();
    fd.set("type", String(args.type));
    fd.set("summary", String(args.summary));
    if (args.occurred_at) fd.set("occurred_at", String(args.occurred_at));
    const res = await logInteraction(String(args.customer_id), fd);
    return JSON.stringify("error" in res ? { error: res.error } : { ok: true });
  }
  if (name === "create_task") {
    const fd = new FormData();
    fd.set("company_id", companyId);
    fd.set("title", String(args.title));
    if (args.description) fd.set("description", String(args.description));
    fd.set("priority", String(args.priority ?? "media"));
    fd.set("area", String(args.area ?? "general"));
    if (args.due_date) fd.set("due_date", String(args.due_date));
    const res = await createTask(fd);
    return JSON.stringify("error" in res ? { error: res.error } : { ok: true });
  }
  if (name === "set_task_status") {
    const res = await setTaskStatus(String(args.task_id), args.status as TaskStatus);
    return JSON.stringify("error" in res ? { error: res.error } : { ok: true });
  }
  if (name === "set_sale_status") {
    const res = await setSaleStatus(String(args.sale_id), args.status as "pendiente" | "pagada" | "entregada");
    return JSON.stringify("error" in res ? { error: res.error } : { ok: true });
  }
```

> Note: `userId` is unused by these delegated writes (the actions read the session user themselves). Leave the `executeWrite` signature unchanged. If the linter flags `userId` as unused, it was already a parameter — do not remove it (the v1 `create_piece` branch uses it).

- [ ] **Step 2: Update the system prompt**

In `src/lib/asistente/prompts.ts`, replace the two area-listing lines of `buildSystemPrompt` with:

```ts
    `Operas sobre cuatro áreas: Taller (piezas), Círculo (clientas VIP), CRM (clientas y sus interacciones), Ventas (estado de pedidos) y Tareas.`,
    `Consulta con find_piece, list_pieces, find_member, find_customer, find_sale y list_tasks; propón cambios con create_piece, set_piece_stage, set_member_tier, set_member_active, log_interaction, create_task, set_task_status y set_sale_status.`,
```

(Keep the rest of the prompt — the "nunca inventes ids", confirmation rule, and "responde en español" lines — unchanged. Add a sentence:) append this line to the array:

```ts
    `Algunas acciones (como cambiar el estado de una venta) pueden ser rechazadas por reglas de negocio; si una herramienta devuelve un error, explícaselo al usuario en lugar de reintentar.`,
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors. If `setTaskStatus`'s `TaskStatus` import path differs, confirm it is `@/lib/tareas/task` (it is, per `lib/tareas/actions.ts`).

- [ ] **Step 4: Run the full module suite**

Run: `npx vitest run src/lib/asistente/`
Expected: PASS (tools/validate/summary updated; parse/prompts still green).

- [ ] **Step 5: Commit**

```bash
git add src/lib/asistente/execute.ts src/lib/asistente/prompts.ts
git commit -m "feat(asistente): v2 executor routing (delegates to CRM/Ventas/Tareas actions) + prompt"
```

---

## Task 6: Verify, deploy, memory

- [ ] **Step 1: Full suite + build**

Run: `npm test` (expect all green) and `npm run build` (expect success, no type errors).

- [ ] **Step 2: Manual smoke (recommended)**

`npm run dev`, on `/asistente`: "registra una llamada con <clienta real>: pidió ampliar pedido" → confirm → check `/crm/<id>`; "crea una tarea para revisar stock el viernes" → confirm → check `/tareas`; "busca el pedido <nº real> y márcalo como pagado" → confirm → check `/ventas`. Try setting a sale that has a devolución back to 'pendiente' and confirm the action's guard error is shown.

- [ ] **Step 3: Deploy (fast-forward to `main`)**

```bash
git push origin frontend-atelier
git fetch origin main
git push origin frontend-atelier:main   # FF-only; if rejected: git merge origin/main --no-edit, retry
```

- [ ] **Step 4: Update memory**

Update the Asistente bullet in `panel-modulos-atelier.md` to note v2 (acts on CRM/Ventas/Tareas by calling the other terminal's guarded actions; new dependency on `logInteraction`/`createTask`/`setTaskStatus`/`setSaleStatus` — note to avise to the other terminal) and refresh `MEMORY.md`.

---

## Self-Review

**Spec coverage:** §4 tools (3 read + 4 write) → Task 1 (defs), Task 2 (validation), Task 3 (summary), Task 4 (read queries), Task 5 (executor routing) ✅. §5 out-of-scope respected (no cancel_sale/customer CRUD/delete). §6 per-file changes all mapped. §7 security (gate unchanged, server re-validate in confirmAction, delegate to guarded actions) ✅. §8 isolation (import-only consumption, no file edits to other modules) ✅. §9 testing → Tasks 1–3, 6 ✅.

**Placeholder scan:** none — every step shows the exact code to add.

**Type consistency:** new enum lists exported from `tools.ts` (Task 1) and imported by `validate.ts` (Task 2); `validateArgs`/`summarizeAction` switch cases match the tool names; `execute.ts` (Task 5) routes exactly the 7 new names and calls actions with signatures verified from source (`logInteraction(customerId, FormData)`, `createTask(FormData)`, `setTaskStatus(id, TaskStatus)`, `setSaleStatus(id, "pendiente"|"pagada"|"entregada")`). The generic loop in `actions.ts` needs no change (confirmed: it gates on `isWriteTool`, runs reads via `executeRead`).
