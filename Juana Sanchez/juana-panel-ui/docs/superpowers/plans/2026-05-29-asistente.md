# El Asistente (IA que actúa) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an isolated `/asistente` chat that uses OpenRouter function-calling to propose actions on Taller (`workshop_pieces`) and Círculo (`circle_members`), executing writes only after explicit user confirmation.

**Architecture:** Pure, TDD'd logic (tool defs, arg validation, action summaries, tool-call parsing, system prompt) + an isolated OpenRouter tool-calling client (mirrors `lib/ads`, never imports `lib/ia`) + a stateless server agent loop (`runAssistant`/`confirmAction`/`rejectAction`) where read tools auto-run and write tools stop for a confirmation gate + a client chat that holds the full message log and renders only user/assistant text. No SQL migration; writes go through the RLS-scoped session client on my tables only.

**Tech Stack:** Next.js 16 (server actions + `"use client"` chat), Supabase (RLS, no service role), OpenRouter (DeepSeek tool-calling), TypeScript, Vitest, Tailwind v4 / Atelier tokens, sonner.

---

## File Structure

**Create:**
- `src/lib/asistente/openrouter.ts` — `ChatMessage`/`ToolDef` types + `assistantChat` (tools client, normalizes the assistant reply)
- `src/lib/asistente/tools.ts` — `TOOL_DEFS`, `WORKSHOP_STAGES`, `CIRCLE_TIERS`, `getTool`, `isWriteTool` + `tools.test.ts`
- `src/lib/asistente/validate.ts` — `validateArgs` + `validate.test.ts`
- `src/lib/asistente/summary.ts` — `summarizeAction` + `summary.test.ts`
- `src/lib/asistente/parse.ts` — `parseToolCall` + `parse.test.ts`
- `src/lib/asistente/prompts.ts` — `buildSystemPrompt`, `withSystem` + `prompts.test.ts`
- `src/lib/asistente/queries.ts` — `findPieces`, `listPiecesByStage`, `findMembers` (reads)
- `src/lib/asistente/execute.ts` — `executeRead`, `executeWrite` (server module, no `"use server"`)
- `src/lib/asistente/actions.ts` — `runAssistant`, `confirmAction`, `rejectAction` (`"use server"`)
- `src/components/asistente/assistant-chat.tsx` — `"use client"` chat + confirmation card
- `src/app/(app)/asistente/page.tsx` — hub (server)

**Modify:**
- `src/components/app-shell/nav-config.tsx` — add `Bot` icon + `/asistente` entry under "Atelier digital"

**Do NOT touch:** `sidebar.tsx`, `lib/ia/**`, `lib/automatizaciones/**`, the Taller/Círculo pages or their existing `actions.ts`/`queries.ts`.

---

## Task 1: OpenRouter tools client + tool registry

**Files:**
- Create: `src/lib/asistente/openrouter.ts`
- Create: `src/lib/asistente/tools.ts`
- Test: `src/lib/asistente/tools.test.ts`

- [ ] **Step 1: Create the client (no unit test — network edge)**

Create `src/lib/asistente/openrouter.ts`:

```ts
export type ToolDef = {
  name: string;
  description: string;
  kind: "read" | "write";
  parameters: Record<string, unknown>;
};

export type AssistantToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

export type ChatMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: AssistantToolCall[] }
  | { role: "tool"; tool_call_id: string; name: string; content: string };

export const TOOLS_MODEL = process.env.OPENROUTER_MODEL_TOOLS ?? "deepseek/deepseek-chat";

export type AssistantApiResult = { message: Extract<ChatMessage, { role: "assistant" }> } | { error: string };

export async function assistantChat(messages: ChatMessage[], tools: ToolDef[], maxTokens = 800): Promise<AssistantApiResult> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return { error: "Falta OPENROUTER_API_KEY en el entorno." };
  const toolSpec = tools.map((t) => ({
    type: "function",
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }));
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: TOOLS_MODEL, messages, tools: toolSpec, tool_choice: "auto", max_tokens: maxTokens }),
    });
    if (!res.ok) return { error: `OpenRouter ${res.status}: ${(await res.text()).slice(0, 200)}` };
    const data = await res.json();
    const raw = data?.choices?.[0]?.message;
    if (!raw) return { error: "Respuesta vacía del modelo." };
    const message: Extract<ChatMessage, { role: "assistant" }> = { role: "assistant", content: raw.content ?? null };
    if (Array.isArray(raw.tool_calls) && raw.tool_calls.length) {
      message.tool_calls = raw.tool_calls.map((c: { id: string; function: { name: string; arguments: string } }) => ({
        id: c.id,
        type: "function",
        function: { name: c.function?.name, arguments: c.function?.arguments ?? "" },
      }));
    }
    return { message };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error de red." };
  }
}
```

- [ ] **Step 2: Write the failing test for the registry**

Create `src/lib/asistente/tools.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { TOOL_DEFS, getTool, isWriteTool, WORKSHOP_STAGES, CIRCLE_TIERS } from "./tools";

describe("TOOL_DEFS", () => {
  it("declares the seven v1 tools", () => {
    expect(TOOL_DEFS.map((t) => t.name).sort()).toEqual(
      ["create_piece", "find_member", "find_piece", "list_pieces", "set_member_active", "set_member_tier", "set_piece_stage"],
    );
  });

  it("each tool has kind, description and an object schema", () => {
    for (const t of TOOL_DEFS) {
      expect(["read", "write"]).toContain(t.kind);
      expect(t.description.length).toBeGreaterThan(0);
      expect((t.parameters as { type: string }).type).toBe("object");
    }
  });

  it("classifies write vs read tools", () => {
    expect(isWriteTool("set_piece_stage")).toBe(true);
    expect(isWriteTool("find_piece")).toBe(false);
    expect(getTool("create_piece")?.kind).toBe("write");
    expect(getTool("nope")).toBeUndefined();
  });

  it("exposes the enum value lists", () => {
    expect(WORKSHOP_STAGES).toEqual(["patron", "corte", "confeccion", "acabados", "entregado"]);
    expect(CIRCLE_TIERS).toEqual(["confidente", "musa", "embajadora"]);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/lib/asistente/tools.test.ts`
Expected: FAIL — `Failed to resolve import "./tools"`.

- [ ] **Step 4: Create the registry**

Create `src/lib/asistente/tools.ts`:

```ts
import type { ToolDef } from "./openrouter";

export const WORKSHOP_STAGES = ["patron", "corte", "confeccion", "acabados", "entregado"] as const;
export const CIRCLE_TIERS = ["confidente", "musa", "embajadora"] as const;

export const TOOL_DEFS: ToolDef[] = [
  {
    name: "find_piece", kind: "read",
    description: "Busca piezas del taller por título o clienta. Úsalo para resolver el id antes de modificar.",
    parameters: { type: "object", properties: { query: { type: "string", description: "texto a buscar en título o clienta" } }, required: ["query"] },
  },
  {
    name: "list_pieces", kind: "read",
    description: "Lista piezas del taller, opcionalmente filtradas por etapa.",
    parameters: { type: "object", properties: { stage: { type: "string", enum: [...WORKSHOP_STAGES] } } },
  },
  {
    name: "create_piece", kind: "write",
    description: "Crea una pieza nueva en el taller.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        client: { type: "string" },
        stage: { type: "string", enum: [...WORKSHOP_STAGES] },
        due_date: { type: "string", description: "fecha de entrega en formato YYYY-MM-DD" },
      },
      required: ["title"],
    },
  },
  {
    name: "set_piece_stage", kind: "write",
    description: "Cambia la etapa de una pieza existente. Requiere el id de la pieza (úsa find_piece primero).",
    parameters: { type: "object", properties: { piece_id: { type: "string" }, stage: { type: "string", enum: [...WORKSHOP_STAGES] } }, required: ["piece_id", "stage"] },
  },
  {
    name: "find_member", kind: "read",
    description: "Busca clientas del Círculo por nombre.",
    parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
  },
  {
    name: "set_member_tier", kind: "write",
    description: "Cambia el tier de una clienta del Círculo. Requiere el id (úsa find_member primero).",
    parameters: { type: "object", properties: { member_id: { type: "string" }, tier: { type: "string", enum: [...CIRCLE_TIERS] } }, required: ["member_id", "tier"] },
  },
  {
    name: "set_member_active", kind: "write",
    description: "Activa o desactiva una clienta del Círculo. Requiere el id.",
    parameters: { type: "object", properties: { member_id: { type: "string" }, active: { type: "boolean" } }, required: ["member_id", "active"] },
  },
];

export function getTool(name: string): ToolDef | undefined {
  return TOOL_DEFS.find((t) => t.name === name);
}

export function isWriteTool(name: string): boolean {
  return getTool(name)?.kind === "write";
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/asistente/tools.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/asistente/openrouter.ts src/lib/asistente/tools.ts src/lib/asistente/tools.test.ts
git commit -m "feat(asistente): OpenRouter tools client + tool registry with tests"
```

---

## Task 2: Argument validation + action summaries

**Files:**
- Create: `src/lib/asistente/validate.ts`
- Test: `src/lib/asistente/validate.test.ts`
- Create: `src/lib/asistente/summary.ts`
- Test: `src/lib/asistente/summary.test.ts`

- [ ] **Step 1: Write the failing test for validation**

Create `src/lib/asistente/validate.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { validateArgs } from "./validate";

describe("validateArgs", () => {
  it("requires a non-empty query for find tools", () => {
    expect(validateArgs("find_piece", { query: "  " })).toHaveProperty("error");
    expect(validateArgs("find_member", { query: "Marta" })).toEqual({ args: { query: "Marta" } });
  });

  it("rejects an invalid stage on list_pieces but allows omitting it", () => {
    expect(validateArgs("list_pieces", {})).toEqual({ args: {} });
    expect(validateArgs("list_pieces", { stage: "acabados" })).toEqual({ args: { stage: "acabados" } });
    expect(validateArgs("list_pieces", { stage: "xx" })).toHaveProperty("error");
  });

  it("defaults create_piece fields and validates date/stage", () => {
    expect(validateArgs("create_piece", { title: "Vestido" })).toEqual({
      args: { title: "Vestido", client: null, stage: "patron", due_date: null },
    });
    expect(validateArgs("create_piece", { title: "V", due_date: "2026/01/01" })).toHaveProperty("error");
    expect(validateArgs("create_piece", {})).toHaveProperty("error");
  });

  it("validates set_piece_stage", () => {
    expect(validateArgs("set_piece_stage", { piece_id: "abc", stage: "corte" })).toEqual({ args: { piece_id: "abc", stage: "corte" } });
    expect(validateArgs("set_piece_stage", { piece_id: "abc", stage: "nope" })).toHaveProperty("error");
    expect(validateArgs("set_piece_stage", { stage: "corte" })).toHaveProperty("error");
  });

  it("validates circle tools", () => {
    expect(validateArgs("set_member_tier", { member_id: "m1", tier: "musa" })).toEqual({ args: { member_id: "m1", tier: "musa" } });
    expect(validateArgs("set_member_tier", { member_id: "m1", tier: "oro" })).toHaveProperty("error");
    expect(validateArgs("set_member_active", { member_id: "m1", active: false })).toEqual({ args: { member_id: "m1", active: false } });
    expect(validateArgs("set_member_active", { member_id: "m1", active: "no" })).toHaveProperty("error");
  });

  it("rejects an unknown tool", () => {
    expect(validateArgs("drop_table", {})).toHaveProperty("error");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/asistente/validate.test.ts`
Expected: FAIL — `Failed to resolve import "./validate"`.

- [ ] **Step 3: Create validation**

Create `src/lib/asistente/validate.ts`:

```ts
import { WORKSHOP_STAGES, CIRCLE_TIERS } from "./tools";

export type ValidatedArgs = { args: Record<string, unknown> } | { error: string };

const isStage = (v: unknown): v is string => typeof v === "string" && (WORKSHOP_STAGES as readonly string[]).includes(v);
const isTier = (v: unknown): v is string => typeof v === "string" && (CIRCLE_TIERS as readonly string[]).includes(v);
const isDate = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
const nonEmpty = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";

export function validateArgs(toolName: string, raw: Record<string, unknown>): ValidatedArgs {
  switch (toolName) {
    case "find_piece":
    case "find_member":
      return nonEmpty(raw.query) ? { args: { query: (raw.query as string).trim() } } : { error: "Falta el texto de búsqueda." };

    case "list_pieces":
      if (raw.stage !== undefined && !isStage(raw.stage)) return { error: `Etapa no válida: ${String(raw.stage)}` };
      return { args: raw.stage !== undefined ? { stage: raw.stage } : {} };

    case "create_piece": {
      if (!nonEmpty(raw.title)) return { error: "Falta el título de la pieza." };
      if (raw.stage !== undefined && !isStage(raw.stage)) return { error: `Etapa no válida: ${String(raw.stage)}` };
      if (raw.due_date !== undefined && raw.due_date !== "" && !isDate(raw.due_date)) return { error: "Fecha no válida (usa YYYY-MM-DD)." };
      return {
        args: {
          title: (raw.title as string).trim(),
          client: nonEmpty(raw.client) ? (raw.client as string).trim() : null,
          stage: isStage(raw.stage) ? raw.stage : "patron",
          due_date: isDate(raw.due_date) ? raw.due_date : null,
        },
      };
    }

    case "set_piece_stage":
      if (!nonEmpty(raw.piece_id)) return { error: "Falta el id de la pieza." };
      if (!isStage(raw.stage)) return { error: `Etapa no válida: ${String(raw.stage)}` };
      return { args: { piece_id: (raw.piece_id as string).trim(), stage: raw.stage } };

    case "set_member_tier":
      if (!nonEmpty(raw.member_id)) return { error: "Falta el id de la clienta." };
      if (!isTier(raw.tier)) return { error: `Tier no válido: ${String(raw.tier)}` };
      return { args: { member_id: (raw.member_id as string).trim(), tier: raw.tier } };

    case "set_member_active":
      if (!nonEmpty(raw.member_id)) return { error: "Falta el id de la clienta." };
      if (typeof raw.active !== "boolean") return { error: "El campo activo debe ser verdadero o falso." };
      return { args: { member_id: (raw.member_id as string).trim(), active: raw.active } };

    default:
      return { error: `Herramienta desconocida: ${toolName}` };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/asistente/validate.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing test for summaries**

Create `src/lib/asistente/summary.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { summarizeAction } from "./summary";

describe("summarizeAction", () => {
  it("describes create_piece with optional client and date", () => {
    expect(summarizeAction("create_piece", { title: "Vestido Marta", client: "Marta", stage: "patron", due_date: "2026-06-10" }))
      .toContain("Vestido Marta");
    expect(summarizeAction("create_piece", { title: "Vestido Marta", client: "Marta", stage: "patron", due_date: "2026-06-10" }))
      .toContain("Marta");
  });

  it("describes stage and tier changes", () => {
    expect(summarizeAction("set_piece_stage", { piece_id: "x", stage: "acabados" })).toContain("acabados");
    expect(summarizeAction("set_member_tier", { member_id: "x", tier: "musa" })).toContain("musa");
  });

  it("describes activation toggles", () => {
    expect(summarizeAction("set_member_active", { member_id: "x", active: true })).toContain("activa");
    expect(summarizeAction("set_member_active", { member_id: "x", active: false })).toContain("inactiva");
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run src/lib/asistente/summary.test.ts`
Expected: FAIL — `Failed to resolve import "./summary"`.

- [ ] **Step 7: Create summaries**

Create `src/lib/asistente/summary.ts`:

```ts
export function summarizeAction(toolName: string, args: Record<string, unknown>): string {
  switch (toolName) {
    case "create_piece":
      return `Crear la pieza «${String(args.title)}»${args.client ? ` para ${String(args.client)}` : ""} en etapa ${String(args.stage ?? "patron")}${args.due_date ? ` (entrega ${String(args.due_date)})` : ""}.`;
    case "set_piece_stage":
      return `Cambiar la etapa de la pieza a «${String(args.stage)}».`;
    case "set_member_tier":
      return `Cambiar el tier de la clienta a «${String(args.tier)}».`;
    case "set_member_active":
      return `Marcar la clienta como ${args.active ? "activa" : "inactiva"}.`;
    default:
      return `Ejecutar ${toolName}.`;
  }
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run src/lib/asistente/summary.test.ts`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/lib/asistente/validate.ts src/lib/asistente/validate.test.ts src/lib/asistente/summary.ts src/lib/asistente/summary.test.ts
git commit -m "feat(asistente): tool-arg validation and action summaries with tests"
```

---

## Task 3: Tool-call parsing + system prompt

**Files:**
- Create: `src/lib/asistente/parse.ts`
- Test: `src/lib/asistente/parse.test.ts`
- Create: `src/lib/asistente/prompts.ts`
- Test: `src/lib/asistente/prompts.test.ts`

- [ ] **Step 1: Write the failing test for parsing**

Create `src/lib/asistente/parse.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parseToolCall } from "./parse";

describe("parseToolCall", () => {
  it("returns null when there are no tool calls", () => {
    expect(parseToolCall({ role: "assistant", content: "hola" })).toBeNull();
  });

  it("parses the first tool call's name and JSON args", () => {
    const msg = {
      role: "assistant" as const,
      content: null,
      tool_calls: [{ id: "c1", type: "function" as const, function: { name: "set_piece_stage", arguments: '{"piece_id":"p1","stage":"corte"}' } }],
    };
    expect(parseToolCall(msg)).toEqual({ id: "c1", name: "set_piece_stage", args: { piece_id: "p1", stage: "corte" } });
  });

  it("falls back to empty args when arguments are not valid JSON", () => {
    const msg = {
      role: "assistant" as const,
      content: null,
      tool_calls: [{ id: "c2", type: "function" as const, function: { name: "find_piece", arguments: "{oops" } }],
    };
    expect(parseToolCall(msg)).toEqual({ id: "c2", name: "find_piece", args: {} });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/asistente/parse.test.ts`
Expected: FAIL — `Failed to resolve import "./parse"`.

- [ ] **Step 3: Create parsing**

Create `src/lib/asistente/parse.ts`:

```ts
import type { ChatMessage } from "./openrouter";

export type ParsedCall = { id: string; name: string; args: Record<string, unknown> } | null;

export function parseToolCall(message: Extract<ChatMessage, { role: "assistant" }>): ParsedCall {
  const call = message.tool_calls?.[0];
  if (!call) return null;
  let args: Record<string, unknown> = {};
  try {
    const parsed = call.function.arguments ? JSON.parse(call.function.arguments) : {};
    if (parsed && typeof parsed === "object") args = parsed as Record<string, unknown>;
  } catch {
    args = {};
  }
  return { id: call.id, name: call.function.name, args };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/asistente/parse.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing test for the prompt**

Create `src/lib/asistente/prompts.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildSystemPrompt, withSystem } from "./prompts";

describe("buildSystemPrompt", () => {
  it("names the company and the two areas, and states the confirmation rule", () => {
    const p = buildSystemPrompt("Juana Sánchez");
    expect(p).toContain("Juana Sánchez");
    expect(p).toContain("Taller");
    expect(p).toContain("Círculo");
    expect(p.toLowerCase()).toContain("confirm");
    expect(p.toLowerCase()).toContain("nunca inventes");
  });
});

describe("withSystem", () => {
  it("prepends a single system message", () => {
    const out = withSystem("Acme", [{ role: "user", content: "hola" }]);
    expect(out[0].role).toBe("system");
    expect(out).toHaveLength(2);
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run src/lib/asistente/prompts.test.ts`
Expected: FAIL — `Failed to resolve import "./prompts"`.

- [ ] **Step 7: Create the prompt builder**

Create `src/lib/asistente/prompts.ts`:

```ts
import type { ChatMessage } from "./openrouter";

export function buildSystemPrompt(companyName: string): string {
  return [
    `Eres el asistente del atelier de Juana Sánchez para la empresa «${companyName}».`,
    `Operas sobre dos áreas: Taller (piezas en producción) y Círculo (clientas VIP).`,
    `Consulta con find_piece, list_pieces y find_member; propón cambios con create_piece, set_piece_stage, set_member_tier y set_member_active.`,
    `Nunca inventes identificadores: si el usuario nombra una pieza o una clienta, búscala primero y usa el id que devuelva la herramienta.`,
    `Para cualquier acción de escritura, llama a la herramienta correspondiente; el sistema pedirá confirmación al usuario antes de ejecutarla.`,
    `Responde en español, breve y concreto.`,
  ].join(" ");
}

export function withSystem(companyName: string, messages: ChatMessage[]): ChatMessage[] {
  return [{ role: "system", content: buildSystemPrompt(companyName) }, ...messages];
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run src/lib/asistente/prompts.test.ts`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/lib/asistente/parse.ts src/lib/asistente/parse.test.ts src/lib/asistente/prompts.ts src/lib/asistente/prompts.test.ts
git commit -m "feat(asistente): tool-call parsing and system prompt with tests"
```

---

## Task 4: Read queries + tool executors

**Files:**
- Create: `src/lib/asistente/queries.ts`
- Create: `src/lib/asistente/execute.ts`

No unit tests (DB-bound); verified by `npx tsc --noEmit` here and the build in Task 7.

- [ ] **Step 1: Create the read queries**

Create `src/lib/asistente/queries.ts`:

```ts
import { createClient } from "@/lib/supabase/server";

/** Strip PostgREST filter metacharacters from free text before embedding in a pattern. */
function safe(text: string): string {
  return text.replace(/[,%()*]/g, " ").trim();
}

export async function findPieces(companyId: string, query: string) {
  const supabase = await createClient();
  const s = safe(query);
  const { data, error } = await supabase
    .from("workshop_pieces")
    .select("id,title,client,stage")
    .eq("company_id", companyId)
    .or(`title.ilike.%${s}%,client.ilike.%${s}%`)
    .limit(8);
  if (error) return { error: error.message };
  return { rows: data ?? [] };
}

export async function listPiecesByStage(companyId: string, stage?: string) {
  const supabase = await createClient();
  let q = supabase.from("workshop_pieces").select("id,title,client,stage").eq("company_id", companyId).limit(20);
  if (stage) q = q.eq("stage", stage);
  const { data, error } = await q;
  if (error) return { error: error.message };
  return { rows: data ?? [] };
}

export async function findMembers(companyId: string, query: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("circle_members")
    .select("id,name,tier,active")
    .eq("company_id", companyId)
    .ilike("name", `%${safe(query)}%`)
    .limit(8);
  if (error) return { error: error.message };
  return { rows: data ?? [] };
}
```

- [ ] **Step 2: Create the executors**

Create `src/lib/asistente/execute.ts`:

```ts
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { findPieces, listPiecesByStage, findMembers } from "./queries";

/** Read tools: run immediately, return a JSON string fed back to the model. */
export async function executeRead(companyId: string, name: string, args: Record<string, unknown>): Promise<string> {
  let r: { rows: unknown[] } | { error: string };
  if (name === "find_piece") r = await findPieces(companyId, String(args.query));
  else if (name === "list_pieces") r = await listPiecesByStage(companyId, args.stage as string | undefined);
  else if (name === "find_member") r = await findMembers(companyId, String(args.query));
  else return JSON.stringify({ error: `lectura desconocida: ${name}` });
  if ("error" in r) return JSON.stringify({ error: r.error });
  return JSON.stringify({ results: r.rows });
}

/** Write tools: run ONLY after user confirmation. company_id is enforced again here (defense in depth on top of RLS). */
export async function executeWrite(companyId: string, userId: string | null, name: string, args: Record<string, unknown>): Promise<string> {
  const supabase = await createClient();
  if (name === "create_piece") {
    const { data, error } = await supabase
      .from("workshop_pieces")
      .insert({
        company_id: companyId,
        created_by: userId,
        title: args.title as string,
        client: (args.client as string | null) ?? null,
        stage: (args.stage as string) ?? "patron",
        due_date: (args.due_date as string | null) ?? null,
      })
      .select("id")
      .single();
    if (error) return JSON.stringify({ error: error.message });
    revalidatePath("/taller");
    return JSON.stringify({ ok: true, id: data.id });
  }
  if (name === "set_piece_stage") {
    const { error } = await supabase
      .from("workshop_pieces")
      .update({ stage: args.stage as string, updated_at: new Date().toISOString() })
      .eq("id", args.piece_id as string)
      .eq("company_id", companyId);
    if (error) return JSON.stringify({ error: error.message });
    revalidatePath("/taller");
    return JSON.stringify({ ok: true });
  }
  if (name === "set_member_tier") {
    const { error } = await supabase
      .from("circle_members")
      .update({ tier: args.tier as string, updated_at: new Date().toISOString() })
      .eq("id", args.member_id as string)
      .eq("company_id", companyId);
    if (error) return JSON.stringify({ error: error.message });
    revalidatePath("/circulo");
    return JSON.stringify({ ok: true });
  }
  if (name === "set_member_active") {
    const { error } = await supabase
      .from("circle_members")
      .update({ active: args.active as boolean, updated_at: new Date().toISOString() })
      .eq("id", args.member_id as string)
      .eq("company_id", companyId);
    if (error) return JSON.stringify({ error: error.message });
    revalidatePath("/circulo");
    return JSON.stringify({ ok: true });
  }
  return JSON.stringify({ error: `escritura desconocida: ${name}` });
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors involving `queries.ts` / `execute.ts`. If the Supabase `.insert`/`.update` payload mismatches the generated row type in `src/types/db.ts`, inspect that file's `workshop_pieces`/`circle_members` `Insert`/`Update` types and align the cast (do not change behavior). 

- [ ] **Step 4: Commit**

```bash
git add src/lib/asistente/queries.ts src/lib/asistente/execute.ts
git commit -m "feat(asistente): read queries and write executors for taller/circulo"
```

---

## Task 5: The agent loop (server actions)

**Files:**
- Create: `src/lib/asistente/actions.ts`

No unit test (orchestration over network + DB); verified by `npx tsc --noEmit` and the build in Task 7.

- [ ] **Step 1: Create the actions**

Create `src/lib/asistente/actions.ts`:

```ts
"use server";
import { createClient } from "@/lib/supabase/server";
import { assistantChat, type ChatMessage } from "./openrouter";
import { TOOL_DEFS, isWriteTool } from "./tools";
import { validateArgs } from "./validate";
import { summarizeAction } from "./summary";
import { parseToolCall } from "./parse";
import { withSystem } from "./prompts";
import { executeRead, executeWrite } from "./execute";

export type PendingAction = { id: string; name: string; args: Record<string, unknown>; summary: string };
export type AssistantTurn =
  | { kind: "message"; text: string; messages: ChatMessage[] }
  | { kind: "confirm"; pending: PendingAction; messages: ChatMessage[] }
  | { kind: "error"; error: string; messages: ChatMessage[] };

const MAX_ITERS = 4;

export async function runAssistant(input: ChatMessage[], companyId: string, companyName: string): Promise<AssistantTurn> {
  if (!companyId) return { kind: "error", error: "Elige una empresa para usar el asistente.", messages: input };
  let messages: ChatMessage[] = input.some((m) => m.role === "system") ? [...input] : withSystem(companyName, input);

  for (let iter = 0; iter < MAX_ITERS; iter++) {
    const res = await assistantChat(messages, TOOL_DEFS);
    if ("error" in res) return { kind: "error", error: res.error, messages };

    const call = parseToolCall(res.message);
    messages = [...messages, res.message];

    if (!call) {
      return { kind: "message", text: (res.message.content ?? "").trim() || "(sin respuesta)", messages };
    }

    const valid = validateArgs(call.name, call.args);
    if ("error" in valid) {
      // feed the error back so the model can correct itself
      messages = [...messages, { role: "tool", tool_call_id: call.id, name: call.name, content: JSON.stringify({ error: valid.error }) }];
      continue;
    }

    if (isWriteTool(call.name)) {
      return {
        kind: "confirm",
        pending: { id: call.id, name: call.name, args: valid.args, summary: summarizeAction(call.name, valid.args) },
        messages,
      };
    }

    const result = await executeRead(companyId, call.name, valid.args);
    messages = [...messages, { role: "tool", tool_call_id: call.id, name: call.name, content: result }];
  }

  return { kind: "error", error: "El asistente hizo demasiadas consultas seguidas. Reformula la petición.", messages };
}

export async function confirmAction(pending: PendingAction, input: ChatMessage[], companyId: string): Promise<AssistantTurn> {
  if (!companyId) return { kind: "error", error: "Falta la empresa.", messages: input };
  const valid = validateArgs(pending.name, pending.args);
  if ("error" in valid) return { kind: "error", error: valid.error, messages: input };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const result = await executeWrite(companyId, user?.id ?? null, pending.name, valid.args);

  let messages: ChatMessage[] = [...input, { role: "tool", tool_call_id: pending.id, name: pending.name, content: result }];
  const res = await assistantChat(messages, TOOL_DEFS);
  if ("error" in res) {
    return { kind: "message", text: result.includes('"ok":true') ? "Hecho." : "Acción procesada.", messages };
  }
  messages = [...messages, res.message];
  return { kind: "message", text: (res.message.content ?? "").trim() || "Hecho.", messages };
}

export async function rejectAction(pending: PendingAction, input: ChatMessage[]): Promise<AssistantTurn> {
  let messages: ChatMessage[] = [
    ...input,
    { role: "tool", tool_call_id: pending.id, name: pending.name, content: JSON.stringify({ cancelled: true, note: "El usuario rechazó la acción; no se ejecutó." }) },
  ];
  const res = await assistantChat(messages, TOOL_DEFS);
  if ("error" in res) return { kind: "message", text: "Acción descartada.", messages };
  messages = [...messages, res.message];
  return { kind: "message", text: (res.message.content ?? "").trim() || "Acción descartada.", messages };
}
```

> Note: in `confirmAction`/`rejectAction` we take only ONE more model turn. If the model emits another tool call there, we ignore it and return the text (or a default) — v1 keeps each write isolated behind its own confirmation.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors involving `actions.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/asistente/actions.ts
git commit -m "feat(asistente): agent loop with read auto-run and write confirmation gate"
```

---

## Task 6: Chat component + hub page

**Files:**
- Create: `src/components/asistente/assistant-chat.tsx`
- Create: `src/app/(app)/asistente/page.tsx`

- [ ] **Step 1: Create the chat component**

Create `src/components/asistente/assistant-chat.tsx`:

```tsx
"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/atelier/markdown";
import { FieldError } from "@/components/atelier/field-error";
import { runAssistant, confirmAction, rejectAction, type AssistantTurn, type PendingAction } from "@/lib/asistente/actions";
import type { ChatMessage } from "@/lib/asistente/openrouter";

type Company = { id: string; name: string };
const EXAMPLES = ["Pasa la pieza de Marta a acabados", "¿Qué piezas están en confección?", "Sube a Lucía a tier musa"];
const labelCls = "font-mono text-[10px] uppercase tracking-[0.06em] text-ink-4";

export function AssistantChat({ companies, activeCompany }: { companies: Company[]; activeCompany: string }) {
  const initial = activeCompany !== "all" ? activeCompany : companies.length === 1 ? companies[0].id : "";
  const [companyId, setCompanyId] = useState(initial);
  const [log, setLog] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [error, setError] = useState<string>();

  const companyName = companies.find((c) => c.id === companyId)?.name ?? "";
  const display = log.filter(
    (m) => m.role === "user" || (m.role === "assistant" && typeof m.content === "string" && m.content.trim() !== ""),
  );

  function apply(turn: AssistantTurn) {
    setLog(turn.messages);
    if (turn.kind === "error") { setError(turn.error); toast.error(turn.error); setPending(null); return; }
    setError(undefined);
    setPending(turn.kind === "confirm" ? turn.pending : null);
  }

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading || pending) return;
    if (!companyId) { setError("Elige una empresa primero."); return; }
    const next: ChatMessage[] = [...log, { role: "user", content: q }];
    setLog(next);
    setInput("");
    setLoading(true);
    const turn = await runAssistant(next, companyId, companyName);
    setLoading(false);
    apply(turn);
  }

  async function onConfirm() {
    if (!pending) return;
    setLoading(true);
    const turn = await confirmAction(pending, log, companyId);
    setLoading(false);
    apply(turn);
  }

  async function onReject() {
    if (!pending) return;
    setLoading(true);
    const turn = await rejectAction(pending, log);
    setLoading(false);
    apply(turn);
  }

  return (
    <div className="space-y-4">
      {companies.length > 1 && (
        <label className="block space-y-1.5">
          <span className={labelCls}>Empresa</span>
          <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="block w-full max-w-xs border border-line bg-elevated px-2 py-1.5 text-sm text-ink">
            <option value="">— elige —</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      )}

      {display.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" onClick={() => send(ex)} className="border border-line px-3 py-1 text-sm text-ink-3 transition-colors hover:bg-paper hover:text-ink">
              {ex}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {display.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : ""}>
            <div className={`inline-block max-w-[85%] p-3 text-left text-sm ${m.role === "user" ? "whitespace-pre-wrap bg-brand-soft text-ink" : "border border-line bg-elevated text-ink"}`}>
              {m.role === "user" ? (m.content as string) : <Markdown content={m.content as string} />}
            </div>
          </div>
        ))}
        {loading && <p className="text-sm text-ink-3">Pensando…</p>}
      </div>

      {pending && (
        <div className="space-y-3 border border-line bg-paper p-4">
          <p className={labelCls}>Acción propuesta</p>
          <p className="text-sm text-ink">{pending.summary}</p>
          <div className="flex gap-2">
            <Button onClick={onConfirm} disabled={loading}>Confirmar</Button>
            <Button variant="outline" onClick={onReject} disabled={loading}>Descartar</Button>
          </div>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2">
        <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Pídeme algo del taller o del círculo…" rows={2} className="flex-1" disabled={!!pending} />
        <Button type="submit" disabled={loading || !!pending}>Enviar</Button>
      </form>
      <FieldError msg={error} />
    </div>
  );
}
```

- [ ] **Step 2: Create the hub page**

Create `src/app/(app)/asistente/page.tsx`:

```tsx
import { createClient } from "@/lib/supabase/server";
import { getActiveCompany } from "@/lib/active-company";
import { PageHeader } from "@/components/atelier/page-header";
import { AssistantChat } from "@/components/asistente/assistant-chat";

export default async function AsistentePage() {
  const supabase = await createClient();
  const [{ data: companies }, activeCompany] = await Promise.all([
    supabase.from("companies").select("id,name").order("name"),
    getActiveCompany(),
  ]);
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Atelier digital" title="El Asistente" />
      <p className="max-w-2xl text-[14px] text-ink-3">
        Pídele acciones sobre el Taller y el Círculo en lenguaje natural. Propone los cambios y tú los
        confirmas antes de que se ejecuten.
      </p>
      <AssistantChat companies={companies ?? []} activeCompany={activeCompany} />
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors. Confirm `Textarea` (`@/components/ui/textarea`), `Markdown` (`@/components/atelier/markdown`), `Button` `variant="outline"`, and `FieldError` `msg` all resolve (all are used by existing components).

- [ ] **Step 4: Commit**

```bash
git add src/components/asistente/assistant-chat.tsx "src/app/(app)/asistente/page.tsx"
git commit -m "feat(asistente): chat UI with confirmation card + hub page"
```

---

## Task 7: Nav entry, verify, deploy, memory

**Files:**
- Modify: `src/components/app-shell/nav-config.tsx`

- [ ] **Step 1: Add the nav entry**

In `src/components/app-shell/nav-config.tsx`, add `Bot` to the lucide import block (near `Sparkles`):

```ts
  Sparkles,
  Bot,
```

Then add the entry to the "Atelier digital" section, next to `/ia`:

```ts
  {
    label: "Atelier digital",
    items: [
      { href: "/ia", label: "IA Tools", icon: Sparkles },
      { href: "/asistente", label: "Asistente", icon: Bot },
    ],
  },
```

- [ ] **Step 2: Run the full unit suite**

Run: `npm test`
Expected: PASS, including the new `tools`/`validate`/`summary`/`parse`/`prompts` tests.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: build succeeds; `/asistente` appears in the route list; no type errors.

- [ ] **Step 4: Manual smoke (recommended)**

`npm run dev`. On `/asistente`: pick a company; "¿qué piezas están en confección?" (read auto-runs); "pasa la pieza de <título real> a acabados" → confirmation card → Confirmar → check the stage changed in `/taller`; repeat with Descartar and confirm nothing changed; "sube a <clienta real> a musa" → Confirmar → check `/circulo`. (Requires `OPENROUTER_API_KEY` + optionally `OPENROUTER_MODEL_TOOLS` in `.env.local`.)

- [ ] **Step 5: Deploy (fast-forward to `main`)**

```bash
git push origin frontend-atelier
git fetch origin main
git push origin frontend-atelier:main   # FF-only; if rejected: git merge origin/main --no-edit, then retry
```

- [ ] **Step 6: Update memory**

Append the Asistente module to `panel-modulos-atelier.md` (isolated `lib/asistente`, own OpenRouter client, no migration → 0034 still free, env `OPENROUTER_MODEL_TOOLS`) and refresh the index line in `MEMORY.md`. Note the new env var so the owner can set it in Vercel if the default model is changed.

---

## Self-Review

**Spec coverage:**
- §4 client `assistantChat` (tools, normalized reply) → Task 1 ✅
- §5 `TOOL_DEFS` (7 tools, read/write, executors) → Task 1 (defs) + Task 4 (executors) ✅
- §6 loop `runAssistant`/`confirmAction`/`rejectAction` with confirmation gate + MAX_ITERS → Task 5 ✅
- §7 pure logic (`validateArgs`, `summarizeAction`, `parseToolCall`, prompt) → Tasks 2–3 ✅
- §8 system prompt → Task 3 ✅
- §9 page + chat + company selector + confirmation card → Task 6; nav → Task 7 ✅
- §10 security (confirmation gate, server re-validate in `confirmAction`, `company_id` enforced, MAX_ITERS, key server-only) → Tasks 4–5 ✅
- §11 isolation (own client, no `lib/ia`, only my tables, additive nav) ✅
- §12 out-of-scope respected (no CRM/Ventas/Tareas/Devoluciones/Boutiques tools, no persistence/streaming, no delete) ✅
- §13 testing → Tasks 1–3, 7 ✅

**Placeholder scan:** none — every code step is complete.

**Type consistency:** `ChatMessage`/`ToolDef`/`AssistantToolCall` defined in Task 1 and imported everywhere; `parseToolCall` takes the assistant `ChatMessage` and returns `{id,name,args}` consumed by Task 5; `validateArgs` returns `{args}|{error}` used by Tasks 5; `PendingAction`/`AssistantTurn` defined in Task 5 and consumed by Task 6; `runAssistant(messages, companyId, companyName)`, `confirmAction(pending, messages, companyId)`, `rejectAction(pending, messages)` signatures match between Task 5 and Task 6 call sites. Atelier imports (`Button` outline, `Textarea`, `Markdown content=`, `FieldError msg=`, `PageHeader eyebrow/title`) match verified components.
