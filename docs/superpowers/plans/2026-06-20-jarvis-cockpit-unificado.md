# JARVIS Cockpit unificado (Fase 1) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Una sola página principal (`/jarvis`) con un cockpit conversacional que lleva una instrucción por clasificación → propuesta → compuerta de aprobación humana → ejecución, reutilizando el motor de agencia existente.

**Architecture:** El cockpit es un cliente delgado en `panel/` (Astro estático) sobre dos endpoints serverless: `POST /api/agency/plan` (nuevo — clasifica + propone con DeepSeek y crea un job `pending_approval` sin ejecutar) y `POST /api/agency/jobs` (ya existe — aprobar/rechazar). La lógica nueva de backend vive en `scripts/agency/plan.ts` y reusa `callAgencyLlm` y `createJob`.

**Tech Stack:** Astro 5 + Tailwind + CSS vars HUD (`jarvis.css`); TypeScript serverless (`@vercel/node`); DeepSeek/Anthropic vía `scripts/agency/llm.ts`; Airtable (cola HITL). Tests: `tsx` assert scripts en root (sin vitest), `vitest` + node env en `panel/`.

> **Commits:** terminá cada mensaje de commit con el trailer `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

## File structure

**Backend (root, `process.env`):**
- Create `scripts/agency/plan.ts` — clasificación + propuesta (DeepSeek) + `planProject()`. Responsabilidad única: producir un plan (clasificación+propuesta) y encolarlo `pending_approval`.
- Create `scripts/agency/test-plan.ts` — assert script (`tsx`) con fakes inyectados.
- Modify `scripts/agency/jobs.ts` — extender `JobArtifacts` (D1).
- Modify `scripts/agency/departments/content-batch.ts` — short-circuit `PROJECT_PROPOSAL` en `executeApprovedJob` (D3).
- Modify `scripts/api/routes/agency.ts` — ruta `plan`.
- Modify `package.json` (root) — script `test:plan`.

**Frontend (`panel/`):**
- Create `panel/src/lib/jarvis/api.ts` — helpers de API compartidos (extraídos del terminal).
- Create `panel/src/lib/jarvis/api.test.ts` — vitest.
- Create `panel/src/lib/jarvis/cockpit/stages.ts` — render puro de etapas (HTML strings).
- Create `panel/src/lib/jarvis/cockpit/stages.test.ts` — vitest.
- Create `panel/src/lib/jarvis/cockpit/main.ts` — controlador DOM del cockpit.
- Modify `panel/src/lib/jarvis/terminal/main.ts` — usar `api.ts`.
- Rename `panel/src/pages/jarvis/index.astro` → `resumen.astro`; Create nuevo `index.astro` (cockpit).
- Modify `panel/src/components/jarvis/JarvisNavList.astro` — link "Resumen".
- Modify `panel/src/styles/jarvis.css` — clases `.jvc-*`.
- Modify `vercel.json` — rewrite `/resumen` para el subdominio.

---

## Task 1: Extender `JobArtifacts` para guardar la propuesta (D1)

**Files:**
- Modify: `scripts/agency/jobs.ts:33-39`

- [ ] **Step 1: Añadir campos opcionales al tipo**

En `scripts/agency/jobs.ts`, reemplazá el tipo `JobArtifacts` (líneas 33-39):

```ts
export type JobArtifacts = {
  posts: JobPostArtifact[];
  client_slug: string;
  channel: string;
  topic: string;
  publish_results?: unknown[];
  // Fase 1 cockpit · propuesta/clasificación de un job PROJECT_PROPOSAL (D1)
  proposal?: Record<string, unknown>;
  classification?: Record<string, unknown>;
};
```

- [ ] **Step 2: Verificar typecheck del root**

Run: `npx tsc --noEmit`
Expected: PASS (sin errores nuevos; los campos son opcionales y retrocompatibles).

- [ ] **Step 3: Commit**

```bash
git add scripts/agency/jobs.ts
git commit -m "feat(jobs): JobArtifacts admite proposal/classification (cockpit D1)"
```

---

## Task 2: Scaffold `plan.ts` + test que falla (TDD rojo)

**Files:**
- Create: `scripts/agency/plan.ts`
- Create: `scripts/agency/test-plan.ts`
- Modify: `package.json` (root)

- [ ] **Step 1: Crear el esqueleto de tipos y firmas en `scripts/agency/plan.ts`**

```ts
/**
 * Plan · clasifica + propone (DeepSeek) + encola job pending_approval.
 * NO ejecuta nada. La ejecución ocurre al aprobar vía /api/agency/jobs.
 */
import { callAgencyLlm } from "./llm.js";
import { createJob } from "./jobs.js";

export interface PlanClassification {
  tipo: string;
  sector: string;
  departamentos: string[];
  agentes: string[];
  confianza: number;
  razonamiento: string;
}

export interface PlanProposal {
  sector_detectado: string;
  tier_recomendado: string;
  headline: string;
  dolor_identificado: string;
  solucion: string;
  agentes_activos: string[];
  stack: string[];
  timeline_dias: number;
  inversion_mensual_usd: number;
  proyeccion_90d: string;
}

export interface PlanResult {
  ok: true;
  classification: PlanClassification;
  proposal: PlanProposal;
  job: { id: string; status: "pending_approval"; intent: "PROJECT_PROPOSAL" };
}

export interface PlanJobInput {
  instruction: string;
  intent: string;
  client_slug: string;
  channel: string;
  topic: string;
  count: number;
  agents: string[];
  risk_level: string;
  status: "pending_approval";
  artifacts: Record<string, unknown>;
}

export interface PlanDeps {
  classify: (instruction: string) => Promise<PlanClassification>;
  propose: (instruction: string) => Promise<PlanProposal>;
  createJob: (input: PlanJobInput) => Promise<{ id: string }>;
}

export function extractJsonObject(_raw: string): unknown {
  throw new Error("not implemented");
}

export function parseClassification(_raw: string): PlanClassification {
  throw new Error("not implemented");
}

export function parseProposal(_raw: string): PlanProposal {
  throw new Error("not implemented");
}

export async function planProject(
  _instruction: string,
  _deps?: PlanDeps,
): Promise<PlanResult> {
  throw new Error("not implemented");
}

void callAgencyLlm;
void createJob;
```

- [ ] **Step 2: Escribir el test `scripts/agency/test-plan.ts`**

```ts
import assert from "node:assert/strict";
import {
  extractJsonObject,
  parseProposal,
  parseClassification,
  planProject,
  type PlanDeps,
} from "./plan.js";

let passed = 0;
const ok = (name: string) => {
  console.log(`  ✓ ${name}`);
  passed++;
};

async function main(): Promise<void> {
  assert.deepEqual(extractJsonObject('```json\n{"a":1}\n```'), { a: 1 });
  ok("extractJsonObject desenvuelve fences");

  const p = parseProposal(
    '{"sector_detectado":"salud","tier_recomendado":"Growth","propuesta":{"headline":"H","dolor_identificado":"D","solucion":"S","agentes_activos":["ATLAS"],"stack":["Airtable"],"timeline_dias":21,"inversion_mensual_usd":900,"proyeccion_90d":"P"}}',
  );
  assert.equal(p.headline, "H");
  assert.equal(p.tier_recomendado, "Growth");
  assert.equal(p.timeline_dias, 21);
  ok("parseProposal aplana la propuesta");

  const c = parseClassification(
    '{"tipo":"CLIENTE","sector_detectado":"salud","departamentos_involucrados":["IA"],"agentes_a_activar":["NEXUS"],"confianza":0.86,"razonamiento":"R"}',
  );
  assert.equal(c.tipo, "CLIENTE");
  assert.deepEqual(c.agentes, ["NEXUS"]);
  assert.equal(c.confianza, 0.86);
  ok("parseClassification mapea campos");

  let createdStatus = "";
  let createdIntent = "";
  const deps: PlanDeps = {
    classify: async () => c,
    propose: async () => p,
    createJob: async (input) => {
      createdStatus = input.status;
      createdIntent = input.intent;
      return { id: "rec_fake_1" };
    },
  };
  const r = await planProject(
    "Tengo una clínica dental en Madrid sin sistema de citas ni seguimiento de pacientes.",
    deps,
  );
  assert.equal(r.ok, true);
  assert.equal(r.job.id, "rec_fake_1");
  assert.equal(r.job.status, "pending_approval");
  assert.equal(r.job.intent, "PROJECT_PROPOSAL");
  assert.equal(createdStatus, "pending_approval");
  assert.equal(createdIntent, "PROJECT_PROPOSAL");
  assert.equal(r.proposal.headline, "H");
  assert.equal(r.classification.tipo, "CLIENTE");
  ok("planProject compone sin ejecutar");

  console.log(`\n${passed} checks passed`);
}

main().catch((e) => {
  console.error("✗", e instanceof Error ? e.message : String(e));
  process.exit(1);
});
```

- [ ] **Step 3: Añadir el script de test al `package.json` del root**

En `package.json` (root), dentro de `"scripts"`, agregá después de la línea `"agency:setup-schema": ...`:

```json
    "test:plan": "tsx scripts/agency/test-plan.ts",
```

- [ ] **Step 4: Correr el test y verificar que falla**

Run: `npm run test:plan`
Expected: FAIL — `✗ not implemented` y exit code 1.

- [ ] **Step 5: Commit**

```bash
git add scripts/agency/plan.ts scripts/agency/test-plan.ts package.json
git commit -m "test(plan): scaffold planProject + assert script (TDD rojo)"
```

---

## Task 3: Implementar los parsers puros (TDD verde · parte 1)

**Files:**
- Modify: `scripts/agency/plan.ts`

- [ ] **Step 1: Reemplazar los stubs de parsing por la implementación**

En `scripts/agency/plan.ts`, reemplazá `extractJsonObject`, `parseClassification`, `parseProposal` (y agregá los helpers) por:

```ts
const TIPOS = [
  "CLIENTE", "BUILD", "AGENTE", "INTERNO", "ESTRATEGIA",
  "SECTOR", "DIAGNOSTICO", "CONSULTA", "ESCALADA",
];

const str = (v: unknown, d = ""): string =>
  typeof v === "string" && v.trim() ? v.trim() : d;
const num = (v: unknown, d: number): number =>
  typeof v === "number" && Number.isFinite(v) ? v : Number(v) || d;
const arr = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean) : [];
const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

export function extractTag(input: string): string | null {
  const m = input.trim().match(/^\[([A-Za-zÁÉÍÓÚÑáéíóúñ_-]+)\]/);
  if (!m?.[1]) return null;
  const raw = m[1].toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return TIPOS.includes(raw) ? raw : null;
}

export function extractJsonObject(raw: string): unknown {
  const t = raw.trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("model output sin objeto JSON");
  }
  return JSON.parse(t.slice(start, end + 1));
}

export function parseClassification(raw: string): PlanClassification {
  const o = extractJsonObject(raw) as Record<string, unknown>;
  return {
    tipo: str(o.tipo, "CLIENTE"),
    sector: str(o.sector_detectado ?? o.sector, "generico"),
    departamentos: arr(o.departamentos_involucrados ?? o.departamentos),
    agentes: arr(o.agentes_a_activar ?? o.agentes),
    confianza: clamp01(num(o.confianza, 0.7)),
    razonamiento: str(o.razonamiento),
  };
}

export function parseProposal(raw: string): PlanProposal {
  const o = extractJsonObject(raw) as Record<string, unknown>;
  const p = (o.propuesta ?? {}) as Record<string, unknown>;
  const headline = str(p.headline);
  if (!headline) throw new Error("propuesta sin headline");
  return {
    sector_detectado: str(o.sector_detectado, "generico"),
    tier_recomendado: str(o.tier_recomendado, "Starter"),
    headline,
    dolor_identificado: str(p.dolor_identificado),
    solucion: str(p.solucion),
    agentes_activos: arr(p.agentes_activos),
    stack: arr(p.stack),
    timeline_dias: Math.round(num(p.timeline_dias, 21)),
    inversion_mensual_usd: Math.round(num(p.inversion_mensual_usd, 900)),
    proyeccion_90d: str(p.proyeccion_90d),
  };
}
```

- [ ] **Step 2: Correr el test — los 3 primeros checks deben pasar, planProject aún falla**

Run: `npm run test:plan`
Expected: `✓ extractJsonObject…`, `✓ parseProposal…`, `✓ parseClassification…`, luego `✗ not implemented` (planProject), exit 1.

- [ ] **Step 3: Commit**

```bash
git add scripts/agency/plan.ts
git commit -m "feat(plan): parsers de clasificación y propuesta (json robusto)"
```

---

## Task 4: Implementar `planProject` + llamadas LLM (TDD verde · parte 2)

**Files:**
- Modify: `scripts/agency/plan.ts`

- [ ] **Step 1: Añadir prompts, los callers LLM y `planProject`**

En `scripts/agency/plan.ts`, reemplazá el stub de `planProject` (y el bloque `void callAgencyLlm; void createJob;`) por:

```ts
const CLASSIFY_PROMPT = `Sos el clasificador de inputs de ZENKAI Growth Systems.
Devolvés EXCLUSIVAMENTE un JSON válido, sin texto fuera del JSON:
{"tipo":"<CLIENTE|BUILD|AGENTE|INTERNO|ESTRATEGIA|SECTOR|DIAGNOSTICO|CONSULTA|ESCALADA>",
"sector_detectado":"<ecommerce|salud|restaurantes|servicios-profesionales|educacion|inmobiliaria|manufactura|retail|startups|gobierno|ong|ninguno>",
"departamentos_involucrados":["..."],"agentes_a_activar":["..."],"confianza":0.0,"razonamiento":"una frase"}
Reglas: por defecto una empresa que describe su operación + problema = CLIENTE.
Agentes válidos (0-4, MAYÚSCULAS): ARES HERMES ATLAS NEXUS APOLLO MUSE FORGE ORACLE HIVE ECHO LEX ZEUS.
ZEUS solo para ESTRATEGIA o decisiones grandes. confianza 0.0-1.0 (<0.7 si dudás).`;

const PROPOSAL_PROMPT = `Sos el Super Cerebro de ZENKAI Growth Systems, una agencia de IA con sede en Pereira, Colombia, que digitaliza empresas con agentes IA.

CAPA DE PRODUCTO:
- 12 agentes Master (ARES marketing, HERMES ventas, ATLAS ops, NEXUS IA, APOLLO diseño, MUSE contenido, FORGE dev, ORACLE finanzas, HIVE rrhh, ECHO atención, LEX legal, ZEUS estrategia).
- 5 tiers: Lite (componente simple), Starter (un departamento), Growth (multi-dept Pro), Pro (enterprise), Enterprise (corporativo).
- 8 sectores: salud, restaurante, ecommerce, servicios, inmobiliaria, educacion, manufactura, generico.

TU TAREA:
Recibís una descripción de empresa y devolvés EXCLUSIVAMENTE un JSON válido con esta estructura exacta:

{
  "sector_detectado": "<uno de: salud|restaurante|ecommerce|servicios|inmobiliaria|educacion|manufactura|generico>",
  "tier_recomendado": "<uno de: Lite|Starter|Growth|Pro|Enterprise>",
  "propuesta": {
    "headline": "<frase corta de 8-12 palabras que vende el resultado>",
    "dolor_identificado": "<1-2 frases sobre el problema principal>",
    "solucion": "<2-3 frases sobre qué construimos>",
    "agentes_activos": ["<nombre>", "<nombre>"],
    "stack": ["<herramienta>", "<herramienta>"],
    "timeline_dias": <entero entre 7 y 90>,
    "inversion_mensual_usd": <entero entre 300 y 5000>,
    "proyeccion_90d": "<1 frase sobre resultado esperado a 90 días>"
  }
}

REGLAS DURAS:
- Voz "tú" en todo el copy.
- NO inventes estadísticas; usá rangos plausibles del sector.
- Tier escala con la complejidad: simple → Lite/Starter; multi-departamento → Growth/Pro; corporativo → Enterprise.
- Agentes activos: 2-4 nombres en MAYÚSCULAS.
- Stack: 2-4 herramientas reales (WhatsApp Cloud API, Airtable, Make, Cal.com, Resend, n8n, Shopify, etc.).
- Si no podés inferir sector con >70% certeza, usá "generico".
- NUNCA incluyas texto fuera del JSON.`;

function riskFromTier(tier: string): string {
  const t = tier.toLowerCase();
  if (t === "lite" || t === "starter") return "low";
  if (t === "enterprise") return "high";
  return "medium";
}

export async function classifyInstruction(instruction: string): Promise<PlanClassification> {
  const r = await callAgencyLlm("deepseek", [
    { role: "system", content: CLASSIFY_PROMPT },
    { role: "user", content: instruction },
  ]);
  if (!r.ok) throw new Error(`clasificación falló: ${r.error}`);
  const parsed = parseClassification(r.text);
  const tag = extractTag(instruction);
  if (tag) {
    parsed.tipo = tag;
    if (parsed.confianza < 0.9) parsed.confianza = 0.9;
  }
  return parsed;
}

export async function proposeProject(instruction: string): Promise<PlanProposal> {
  const r = await callAgencyLlm("deepseek", [
    { role: "system", content: PROPOSAL_PROMPT },
    { role: "user", content: instruction },
  ]);
  if (!r.ok) throw new Error(`propuesta falló: ${r.error}`);
  return parseProposal(r.text);
}

const defaultDeps: PlanDeps = {
  classify: classifyInstruction,
  propose: proposeProject,
  createJob: async (input) => {
    const job = await createJob(input);
    return { id: job.id };
  },
};

export async function planProject(
  instruction: string,
  deps: PlanDeps = defaultDeps,
): Promise<PlanResult> {
  const text = instruction.trim();
  if (!text) throw new Error("instruction required");

  const [classification, proposal] = await Promise.all([
    deps.classify(text),
    deps.propose(text),
  ]);

  const topic = proposal.headline.slice(0, 200);
  const job = await deps.createJob({
    instruction: text,
    intent: "PROJECT_PROPOSAL",
    client_slug: "zenkai",
    channel: "propuesta",
    topic,
    count: 0,
    agents: proposal.agentes_activos,
    risk_level: riskFromTier(proposal.tier_recomendado),
    status: "pending_approval",
    artifacts: {
      posts: [],
      client_slug: "zenkai",
      channel: "propuesta",
      topic,
      proposal: proposal as unknown as Record<string, unknown>,
      classification: classification as unknown as Record<string, unknown>,
    },
  });

  return {
    ok: true,
    classification,
    proposal,
    job: { id: job.id, status: "pending_approval", intent: "PROJECT_PROPOSAL" },
  };
}
```

- [ ] **Step 2: Eliminar el import sin usar**

En `scripts/agency/plan.ts`, borrá la línea suelta `void callAgencyLlm;` / `void createJob;` si quedó (ahora ambos se usan). El import sigue: `import { callAgencyLlm } from "./llm.js";` y `import { createJob } from "./jobs.js";`.

- [ ] **Step 3: Correr el test completo — todo verde**

Run: `npm run test:plan`
Expected: 4 líneas `✓` y `4 checks passed`, exit 0.

- [ ] **Step 4: Typecheck del root**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/agency/plan.ts
git commit -m "feat(plan): planProject clasifica+propone con DeepSeek y encola pending_approval"
```

---

## Task 5: Ruta `POST /api/agency/plan`

**Files:**
- Modify: `scripts/api/routes/agency.ts:9-26` (imports), `:40-61` (switch), y nuevo handler.

- [ ] **Step 1: Importar `planProject`**

En `scripts/api/routes/agency.ts`, agregá junto a los imports de agency (después de la línea `import { getJob, listJobs } from "../../agency/jobs.js";`):

```ts
import { planProject } from "../../agency/plan.js";
```

- [ ] **Step 2: Registrar la ruta en el switch**

En `handleAgencyRoute`, agregá un `case` antes de `case "jobs":`:

```ts
    case "plan":
      return handlePlan(req, res);
```

- [ ] **Step 3: Añadir el handler**

Al final de `scripts/api/routes/agency.ts` (antes del cierre del archivo, junto a los otros handlers), agregá:

```ts
async function handlePlan(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!allowOrchestratorRequest(req, res)) return;
  const body = (req.body ?? {}) as { instruction?: unknown };
  if (typeof body.instruction !== "string" || !body.instruction.trim()) {
    res.status(400).json({ error: "instruction required" });
    return;
  }
  try {
    const result = await planProject(body.instruction.trim());
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(result);
  } catch (e) {
    res.status(502).json({ ok: false, error: e instanceof Error ? e.message : String(e) });
  }
}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS (`allowOrchestratorRequest` ya está importado en este archivo; `planProject` resuelve).

- [ ] **Step 5: Commit**

```bash
git add scripts/api/routes/agency.ts
git commit -m "feat(api): POST /api/agency/plan (clasifica+propone, sin ejecutar)"
```

---

## Task 6: Short-circuit de aprobación para `PROJECT_PROPOSAL` (D3)

**Files:**
- Modify: `scripts/agency/departments/content-batch.ts:164-175`

- [ ] **Step 1: Ampliar el tipo de retorno y añadir el guard**

En `scripts/agency/departments/content-batch.ts`, en `executeApprovedJob`:

1. Cambiá la firma de retorno (línea 167) de:
```ts
): Promise<{ jobId: string; published: number; skipped: number; errors: string[] }> {
```
a:
```ts
): Promise<{ jobId: string; published: number; skipped: number; errors: string[]; built?: boolean; phase?: string }> {
```

2. Justo después de `const job = await getJob(jobId);` (línea 169) y ANTES del check `if (!job?.artifacts?.posts?.length)`, insertá:
```ts
  if (job && job.intent === "PROJECT_PROPOSAL") {
    await updateJob(jobId, {
      status: "approved",
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
    });
    return { jobId, published: 0, skipped: 0, errors: [], built: false, phase: "2-pending" };
  }
```

(`updateJob` ya está importado en este archivo.)

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add scripts/agency/departments/content-batch.ts
git commit -m "feat(jobs): aprobar PROJECT_PROPOSAL marca approved sin publicar (D3)"
```

---

## Task 7: Extraer `panel/src/lib/jarvis/api.ts` y usarlo en el terminal

**Files:**
- Create: `panel/src/lib/jarvis/api.ts`
- Create: `panel/src/lib/jarvis/api.test.ts`
- Modify: `panel/src/lib/jarvis/terminal/main.ts`

- [ ] **Step 1: Escribir el test (vitest, node env, funciones puras)**

`panel/src/lib/jarvis/api.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { apiBase, authHeaders } from "./api";

describe("apiBase", () => {
  it("usa panel.zenkai.systems desde el subdominio jarvis", () => {
    expect(apiBase("jarvis.zenkai.systems")).toBe("https://panel.zenkai.systems");
  });
  it("usa panel.zenkai.systems en localhost", () => {
    expect(apiBase("localhost")).toBe("https://panel.zenkai.systems");
  });
  it("usa same-origin ('') en panel.zenkai.systems", () => {
    expect(apiBase("panel.zenkai.systems")).toBe("");
  });
});

describe("authHeaders", () => {
  it("incluye Bearer cuando hay key", () => {
    expect(authHeaders("k1").Authorization).toBe("Bearer k1");
  });
  it("omite Authorization sin key", () => {
    expect(authHeaders("").Authorization).toBeUndefined();
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `cd panel && npx vitest run src/lib/jarvis/api.test.ts`
Expected: FAIL — no se puede importar `./api` (módulo no existe).

- [ ] **Step 3: Crear `panel/src/lib/jarvis/api.ts`**

```ts
const PANEL_API = "https://panel.zenkai.systems";

export function isJarvisHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === "jarvis.zenkai.systems" || h.endsWith(".jarvis.zenkai.systems");
}

export function apiBase(hostname: string): string {
  const h = hostname.toLowerCase();
  return isJarvisHost(h) || h === "localhost" || h === "127.0.0.1" ? PANEL_API : "";
}

export function readApiKey(): string {
  try {
    return (
      localStorage.getItem("zenkai_jarvis_api_key") ||
      localStorage.getItem("zenkai_api_key") ||
      ""
    );
  } catch {
    return "";
  }
}

export function authHeaders(key: string): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (key) h.Authorization = `Bearer ${key}`;
  return h;
}

export async function fetchWithTimeout(
  url: string,
  opts: RequestInit,
  ms: number,
): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, credentials: "same-origin", signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}
```

- [ ] **Step 4: Correr el test — verde**

Run: `cd panel && npx vitest run src/lib/jarvis/api.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Refactorizar `terminal/main.ts` para usar `api.ts`**

En `panel/src/lib/jarvis/terminal/main.ts`:

1. Añadí el import después de la línea 3 (`import { renderBlock, ... }`):
```ts
import { apiBase, authHeaders, fetchWithTimeout, readApiKey, isJarvisHost } from "../api";
```

2. Borrá las definiciones locales ahora duplicadas: `const PANEL_API = ...` (línea 16), y las funciones `isJarvisHost` (57-60), `apiBase` (61-64), `apiKey` (65-71), `fetchWithTimeout` (72-80), `authHeaders` (81-86).

3. Actualizá los call sites:
   - `runInstruction`: `\`${apiBase()}/api/jarvis/run\`` → `\`${apiBase(location.hostname)}/api/jarvis/run\`` y `headers: authHeaders()` → `headers: authHeaders(readApiKey())`.
   - `showStatus`: `\`${apiBase()}/api/agency/status\`` → `\`${apiBase(location.hostname)}/api/agency/status\`` y `{ headers: authHeaders() }` → `{ headers: authHeaders(readApiKey()) }`.
   - `normalizeNavPath` usa `isJarvisHost()` sin argumento → cambialo a `isJarvisHost(location.hostname)`.

- [ ] **Step 6: Build del panel (verifica typecheck + que el terminal sigue compilando)**

Run: `cd panel && npm run build`
Expected: PASS (astro check sin errores).

- [ ] **Step 7: Commit**

```bash
git add panel/src/lib/jarvis/api.ts panel/src/lib/jarvis/api.test.ts panel/src/lib/jarvis/terminal/main.ts
git commit -m "refactor(jarvis): api.ts compartido (auth/timeout) extraído del terminal"
```

---

## Task 8: Render puro de etapas — `cockpit/stages.ts`

**Files:**
- Create: `panel/src/lib/jarvis/cockpit/stages.ts`
- Create: `panel/src/lib/jarvis/cockpit/stages.test.ts`

- [ ] **Step 1: Escribir el test (vitest, node env)**

`panel/src/lib/jarvis/cockpit/stages.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { classificationHtml, proposalHtml, confidencePct } from "./stages";

const classification = {
  tipo: "CLIENTE",
  sector: "salud",
  departamentos: ["Operaciones", "IA"],
  agentes: ["ATLAS", "NEXUS"],
  confianza: 0.86,
  razonamiento: "R",
};

const proposal = {
  sector_detectado: "salud",
  tier_recomendado: "Growth",
  headline: "Agenda inteligente 24/7",
  dolor_identificado: "D",
  solucion: "S",
  agentes_activos: ["ATLAS", "NEXUS"],
  stack: ["WhatsApp API", "Cal.com"],
  timeline_dias: 21,
  inversion_mensual_usd: 900,
  proyeccion_90d: "−30% no-shows",
};

describe("confidencePct", () => {
  it("redondea a entero porcentual", () => {
    expect(confidencePct(0.86)).toBe(86);
  });
});

describe("classificationHtml", () => {
  it("muestra tipo, sector y agentes", () => {
    const html = classificationHtml(classification);
    expect(html).toContain("CLIENTE");
    expect(html).toContain("salud");
    expect(html).toContain("ATLAS");
    expect(html).toContain("86%");
  });
});

describe("proposalHtml", () => {
  it("muestra headline, tier, timeline e inversión", () => {
    const html = proposalHtml(proposal);
    expect(html).toContain("Agenda inteligente 24/7");
    expect(html).toContain("Growth");
    expect(html).toContain("21");
    expect(html).toContain("900");
    expect(html).toContain("Cal.com");
  });
});
```

- [ ] **Step 2: Correr el test — falla (módulo no existe)**

Run: `cd panel && npx vitest run src/lib/jarvis/cockpit/stages.test.ts`
Expected: FAIL — no se puede importar `./stages`.

- [ ] **Step 3: Crear `panel/src/lib/jarvis/cockpit/stages.ts`**

```ts
export interface PlanClassification {
  tipo: string;
  sector: string;
  departamentos: string[];
  agentes: string[];
  confianza: number;
  razonamiento: string;
}

export interface PlanProposal {
  sector_detectado: string;
  tier_recomendado: string;
  headline: string;
  dolor_identificado: string;
  solucion: string;
  agentes_activos: string[];
  stack: string[];
  timeline_dias: number;
  inversion_mensual_usd: number;
  proyeccion_90d: string;
}

export interface PlanResponse {
  ok: true;
  classification: PlanClassification;
  proposal: PlanProposal;
  job: { id: string; status: string; intent: string };
}

const esc = (s: string): string =>
  s.replace(/[&<>"]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;",
  );

const chip = (label: string): string => `<span class="jvc-chip">${esc(label)}</span>`;

export function confidencePct(confianza: number): number {
  return Math.round(Math.max(0, Math.min(1, confianza)) * 100);
}

export function classificationHtml(c: PlanClassification): string {
  const pct = confidencePct(c.confianza);
  return `
    <div class="jvc-badges">
      <span class="jvc-chip jvc-chip-accent">tipo · ${esc(c.tipo)}</span>
      <span class="jvc-chip jvc-chip-accent">sector · ${esc(c.sector)}</span>
    </div>
    <div class="jvc-row">depto: ${c.departamentos.map(chip).join("")}</div>
    <div class="jvc-row">agentes: ${c.agentes.map(chip).join("")}</div>
    <div class="jvc-conf">
      <div class="jvc-conf-track"><div class="jvc-conf-fill" style="width:${pct}%"></div></div>
      <span class="jvc-conf-label">${pct}%</span>
    </div>`;
}

export function proposalHtml(p: PlanProposal): string {
  return `
    <div class="jvc-headline">${esc(p.headline)}</div>
    <div class="jvc-grid">
      <div class="jvc-metric"><span class="jvc-metric-k">tier</span><span class="jvc-metric-v">${esc(p.tier_recomendado)}</span></div>
      <div class="jvc-metric"><span class="jvc-metric-k">timeline</span><span class="jvc-metric-v">${p.timeline_dias} días</span></div>
      <div class="jvc-metric"><span class="jvc-metric-k">inversión</span><span class="jvc-metric-v">$${p.inversion_mensual_usd}/mes</span></div>
    </div>
    <div class="jvc-row">stack: ${p.stack.map(chip).join("")}</div>
    <div class="jvc-proj">${esc(p.proyeccion_90d)}</div>`;
}

export function execLineHtml(text: string, done: boolean): string {
  const icon = done ? "✓" : "▸";
  return `<div class="jvc-log-line${done ? " is-done" : ""}"><span class="jvc-log-ic">${icon}</span>${esc(text)}</div>`;
}
```

- [ ] **Step 4: Correr el test — verde**

Run: `cd panel && npx vitest run src/lib/jarvis/cockpit/stages.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add panel/src/lib/jarvis/cockpit/stages.ts panel/src/lib/jarvis/cockpit/stages.test.ts
git commit -m "feat(cockpit): render puro de etapas (clasificación/propuesta) + tests"
```

---

## Task 9: Estilos `.jvc-*` en `jarvis.css`

**Files:**
- Modify: `panel/src/styles/jarvis.css` (append al final)

- [ ] **Step 1: Agregar las clases del cockpit al final de `panel/src/styles/jarvis.css`**

```css
/* ── Cockpit (Fase 1) ───────────────────────────────────────── */
.jvc-shell { max-width: 920px; margin: 0 auto; }
.jvc-input-row { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
.jvc-input {
  flex: 1; min-width: 240px; background: rgba(0, 212, 255, 0.04);
  border: 1px solid var(--jv-border); border-radius: 10px; color: var(--jv-text);
  padding: 12px 14px; font-size: 14px; resize: vertical; min-height: 56px;
}
.jvc-input:focus { outline: none; border-color: var(--jv-cyan); }
.jvc-btn {
  background: rgba(0, 212, 255, 0.08); border: 1px solid var(--jv-cyan);
  color: var(--jv-cyan); border-radius: 10px; padding: 0 18px; font-weight: 600;
  cursor: pointer; font-size: 14px; transition: background 0.2s;
}
.jvc-btn:hover { background: rgba(0, 212, 255, 0.16); }
.jvc-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.jvc-btn-ghost { border-color: var(--jv-border); color: var(--jv-text-muted); background: transparent; }

.jvc-stage {
  border: 1px solid var(--jv-border); border-radius: 12px; padding: 14px 16px;
  margin-bottom: 12px; background: rgba(3, 8, 16, 0.6); backdrop-filter: blur(8px);
  opacity: 0.5; transition: opacity 0.35s ease, border-color 0.35s ease;
}
.jvc-stage.is-active { opacity: 1; border-color: var(--jv-cyan); }
.jvc-stage.is-done { opacity: 1; }
.jvc-stage.is-rej { opacity: 1; border-color: #ff5470; }
.jvc-stage-head { display: flex; align-items: center; gap: 10px; }
.jvc-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--jv-border); flex: none; }
.jvc-stage.is-active .jvc-dot { background: var(--jv-cyan); animation: jvc-pulse 1.1s ease-in-out infinite; }
.jvc-stage.is-done .jvc-dot { background: #2dd4a8; }
.jvc-stage.is-rej .jvc-dot { background: #ff5470; }
.jvc-stage-title { font-size: 14px; font-weight: 600; color: var(--jv-text); }
.jvc-stage-note { margin-left: auto; font-size: 12px; color: var(--jv-text-dim); }
.jvc-detail { margin-top: 12px; font-size: 13px; color: var(--jv-text-muted); }

.jvc-badges { margin-bottom: 6px; }
.jvc-row { margin-top: 4px; }
.jvc-chip {
  display: inline-block; font-size: 12px; padding: 3px 9px; border-radius: 7px;
  background: rgba(255, 255, 255, 0.05); color: var(--jv-text-muted); margin: 0 4px 4px 0;
}
.jvc-chip-accent { background: rgba(0, 212, 255, 0.1); color: var(--jv-cyan); }
.jvc-conf { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
.jvc-conf-track { flex: 1; height: 6px; border-radius: 4px; background: rgba(255, 255, 255, 0.06); overflow: hidden; }
.jvc-conf-fill { height: 100%; background: var(--jv-cyan); }
.jvc-conf-label { font-size: 12px; color: var(--jv-text-muted); }
.jvc-headline { font-size: 15px; font-weight: 600; color: var(--jv-text); margin-bottom: 10px; }
.jvc-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; margin-bottom: 8px; }
.jvc-metric { background: rgba(255, 255, 255, 0.04); border-radius: 8px; padding: 8px 10px; }
.jvc-metric-k { display: block; font-size: 11px; color: var(--jv-text-dim); }
.jvc-metric-v { display: block; font-size: 16px; font-weight: 600; color: var(--jv-text); }
.jvc-proj { margin-top: 8px; color: var(--jv-cyan); font-size: 13px; }
.jvc-gate { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
.jvc-log-line { display: flex; align-items: center; gap: 8px; padding: 3px 0; color: var(--jv-text-muted); }
.jvc-log-line.is-done { color: #2dd4a8; }
.jvc-log-ic { color: var(--jv-cyan); }

@keyframes jvc-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
@media (prefers-reduced-motion: reduce) {
  .jvc-stage.is-active .jvc-dot { animation: none; }
  .jvc-stage { transition: none; }
}
@media (max-width: 720px) {
  .jvc-input { min-width: 100%; }
  .jvc-btn { flex: 1; }
}
```

> Si alguna variable (`--jv-text`, `--jv-text-muted`, `--jv-text-dim`, `--jv-border`, `--jv-cyan`) no existiera en `jarvis.css`, buscala con `grep -n "\-\-jv-" panel/src/styles/jarvis.css` y usá la equivalente. Las del HUD existen (las usa `JarvisLayout`).

- [ ] **Step 2: Commit**

```bash
git add panel/src/styles/jarvis.css
git commit -m "style(cockpit): clases .jvc-* (etapas, gate, reduced-motion, responsive)"
```

---

## Task 10: Controlador DOM — `cockpit/main.ts`

**Files:**
- Create: `panel/src/lib/jarvis/cockpit/main.ts`

- [ ] **Step 1: Crear `panel/src/lib/jarvis/cockpit/main.ts`**

```ts
import { apiBase, authHeaders, fetchWithTimeout, readApiKey } from "../api";
import {
  classificationHtml,
  proposalHtml,
  execLineHtml,
  type PlanResponse,
} from "./stages";

const $ = (id: string): HTMLElement | null => document.getElementById(id);
const input = $("jvc-input") as HTMLTextAreaElement | null;
const goBtn = $("jvc-go") as HTMLButtonElement | null;
const resetBtn = $("jvc-reset") as HTMLButtonElement | null;
if (!input || !goBtn) throw new Error("cockpit: faltan #jvc-input / #jvc-go");

let currentJobId: string | null = null;

function setStage(id: string, cls: "" | "is-active" | "is-done" | "is-rej"): void {
  const el = $(id);
  if (el) el.className = `jvc-stage${cls ? " " + cls : ""}`;
}
function setNote(id: string, text: string): void {
  const el = $(id);
  if (el) el.textContent = text;
}
function setDetail(id: string, html: string): void {
  const el = $(id);
  if (el) el.innerHTML = html;
}

function reset(): void {
  currentJobId = null;
  ["jvc-s1", "jvc-s2", "jvc-s3", "jvc-s4", "jvc-s5"].forEach((s) => setStage(s, ""));
  setNote("jvc-s1-note", "listo");
  ["jvc-s2-note", "jvc-s3-note", "jvc-s4-note", "jvc-s5-note"].forEach((n) => setNote(n, "—"));
  ["jvc-s2-detail", "jvc-s3-detail", "jvc-s4-detail", "jvc-s5-detail"].forEach((d) => setDetail(d, ""));
}

async function decide(action: "approve" | "reject"): Promise<void> {
  if (!currentJobId) return;
  if (action === "approve" && !currentJobId.startsWith("rec")) {
    setStage("jvc-s4", "is-done");
    setNote("jvc-s4-note", "modo demo");
    setStage("jvc-s5", "is-done");
    setDetail("jvc-s5-detail", execLineHtml("Sin AIRTABLE_TOKEN · job demo, no se persiste", true));
    return;
  }
  setStage("jvc-s4", "is-done");
  setNote("jvc-s4-note", action === "approve" ? "aprobado" : "rechazado");
  if (action === "reject") {
    setStage("jvc-s4", "is-rej");
    setDetail("jvc-s4-detail", `<div class="jvc-proj" style="color:#ff5470">Rechazado · JARVIS reformula. No se ejecutó nada.</div>`);
    return;
  }
  setStage("jvc-s5", "is-active");
  setNote("jvc-s5-note", "ejecutando…");
  try {
    const res = await fetchWithTimeout(
      `${apiBase(location.hostname)}/api/agency/jobs`,
      {
        method: "POST",
        headers: authHeaders(readApiKey()),
        body: JSON.stringify({ action: "approve", jobId: currentJobId }),
      },
      60000,
    );
    const data = (await res.json()) as { ok?: boolean; built?: boolean; phase?: string; error?: string };
    if (!res.ok || data.ok === false) {
      setDetail("jvc-s5-detail", execLineHtml(`Error: ${data.error ?? res.status}`, false));
      return;
    }
    const msg = data.built === false
      ? "Propuesta aprobada · build real llega en Fase 2"
      : "Ejecución completa";
    setDetail("jvc-s5-detail", execLineHtml(msg, true));
    setStage("jvc-s5", "is-done");
    setNote("jvc-s5-note", "done");
  } catch {
    setDetail("jvc-s5-detail", execLineHtml("Sin conexión con el cerebro JARVIS", false));
  }
}

function renderGate(jobId: string): void {
  currentJobId = jobId;
  setStage("jvc-s4", "is-active");
  setNote("jvc-s4-note", "esperando tu decisión");
  setDetail(
    "jvc-s4-detail",
    `<div class="jvc-detail">Job <code>${jobId}</code> · <code>pending_approval</code>. Nada se ejecuta hasta que aprobás.</div>
     <div class="jvc-gate">
       <button class="jvc-btn" id="jvc-approve" type="button">✓ Aprobar</button>
       <button class="jvc-btn jvc-btn-ghost" id="jvc-reject" type="button">✕ Rechazar</button>
     </div>`,
  );
  $("jvc-approve")?.addEventListener("click", () => void decide("approve"));
  $("jvc-reject")?.addEventListener("click", () => void decide("reject"));
}

async function process(): Promise<void> {
  const text = (input!.value || "").trim();
  if (text.length < 12) {
    setNote("jvc-s1-note", "escribí algo más concreto");
    return;
  }
  reset();
  goBtn!.disabled = true;
  setStage("jvc-s1", "is-done");
  setNote("jvc-s1-note", "recibido");
  setStage("jvc-s2", "is-active");
  setNote("jvc-s2-note", "analizando…");
  try {
    const res = await fetchWithTimeout(
      `${apiBase(location.hostname)}/api/agency/plan`,
      { method: "POST", headers: authHeaders(readApiKey()), body: JSON.stringify({ instruction: text }) },
      45000,
    );
    if (res.status === 401 || res.status === 403) {
      setStage("jvc-s2", "is-rej");
      setNote("jvc-s2-note", "sin autorización");
      setDetail("jvc-s2-detail", `<div class="jvc-detail">Pegá tu ZENKAI_API_KEY en la consola de voz (⋯) del header.</div>`);
      return;
    }
    if (!res.ok) {
      setStage("jvc-s2", "is-rej");
      setNote("jvc-s2-note", `error ${res.status}`);
      return;
    }
    const data = (await res.json()) as PlanResponse;
    setStage("jvc-s2", "is-done");
    setNote("jvc-s2-note", `confianza ${Math.round(data.classification.confianza * 100)}%`);
    setDetail("jvc-s2-detail", classificationHtml(data.classification));
    setStage("jvc-s3", "is-active");
    setNote("jvc-s3-note", "redactando…");
    setStage("jvc-s3", "is-done");
    setNote("jvc-s3-note", `tier ${data.proposal.tier_recomendado}`);
    setDetail("jvc-s3-detail", proposalHtml(data.proposal));
    renderGate(data.job.id);
  } catch {
    setStage("jvc-s2", "is-rej");
    setNote("jvc-s2-note", "sin conexión");
    setDetail("jvc-s2-detail", `<div class="jvc-detail">Sin conexión con el cerebro JARVIS.</div>`);
  } finally {
    goBtn!.disabled = false;
  }
}

goBtn.addEventListener("click", () => void process());
resetBtn?.addEventListener("click", reset);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    void process();
  }
});
window.addEventListener("jarvis-voice-command", (e) => {
  const detail = (e as CustomEvent<{ text?: string }>).detail;
  if (detail?.text && input) {
    input.value = detail.text;
    void process();
  }
});
reset();
```

- [ ] **Step 2: (no se buildea aún — la página llega en Task 11). Commit**

```bash
git add panel/src/lib/jarvis/cockpit/main.ts
git commit -m "feat(cockpit): controlador DOM (plan → gate HITL → ejecución)"
```

---

## Task 11: Página principal — cockpit en `/jarvis`, dashboard a `/jarvis/resumen`

**Files:**
- Rename: `panel/src/pages/jarvis/index.astro` → `panel/src/pages/jarvis/resumen.astro`
- Create: `panel/src/pages/jarvis/index.astro`

- [ ] **Step 1: Mover el dashboard actual a `/resumen`**

```bash
git mv panel/src/pages/jarvis/index.astro panel/src/pages/jarvis/resumen.astro
```

- [ ] **Step 2: Ajustar el título del dashboard movido**

En `panel/src/pages/jarvis/resumen.astro`, buscá el `<JarvisLayout` y cambiá su prop `title` a `"Resumen"` (ej. `title="Resumen"` o `title="Command Center"` → `title="Resumen"`). No toques el resto.

- [ ] **Step 3: Crear el nuevo `index.astro` (cockpit) usando el shell**

`panel/src/pages/jarvis/index.astro`:

```astro
---
import JarvisLayout from "../../layouts/JarvisLayout.astro";
---

<JarvisLayout title="Cockpit" description="JARVIS Cockpit · clasifica, propone, aprobás, ejecuta">
  <section class="jvc-shell">
    <div class="jvc-input-row">
      <textarea id="jvc-input" class="jvc-input" rows="2" placeholder="Hablá o escribí a JARVIS… (⌘/Ctrl + Enter)"></textarea>
      <button id="jvc-go" class="jvc-btn" type="button">Procesar</button>
      <button id="jvc-reset" class="jvc-btn jvc-btn-ghost" type="button">Reiniciar</button>
    </div>

    <div class="jvc-stage" id="jvc-s1">
      <div class="jvc-stage-head">
        <span class="jvc-dot"></span><span class="jvc-stage-title">1 · Input</span>
        <span class="jvc-stage-note" id="jvc-s1-note">listo</span>
      </div>
    </div>
    <div class="jvc-stage" id="jvc-s2">
      <div class="jvc-stage-head">
        <span class="jvc-dot"></span><span class="jvc-stage-title">2 · Clasificación + ruteo</span>
        <span class="jvc-stage-note" id="jvc-s2-note">—</span>
      </div>
      <div class="jvc-detail" id="jvc-s2-detail"></div>
    </div>
    <div class="jvc-stage" id="jvc-s3">
      <div class="jvc-stage-head">
        <span class="jvc-dot"></span><span class="jvc-stage-title">3 · Propuesta</span>
        <span class="jvc-stage-note" id="jvc-s3-note">—</span>
      </div>
      <div class="jvc-detail" id="jvc-s3-detail"></div>
    </div>
    <div class="jvc-stage" id="jvc-s4">
      <div class="jvc-stage-head">
        <span class="jvc-dot"></span><span class="jvc-stage-title">4 · Compuerta HITL — vos decidís</span>
        <span class="jvc-stage-note" id="jvc-s4-note">—</span>
      </div>
      <div class="jvc-detail" id="jvc-s4-detail"></div>
    </div>
    <div class="jvc-stage" id="jvc-s5">
      <div class="jvc-stage-head">
        <span class="jvc-dot"></span><span class="jvc-stage-title">5 · Ejecución</span>
        <span class="jvc-stage-note" id="jvc-s5-note">—</span>
      </div>
      <div class="jvc-detail" id="jvc-s5-detail"></div>
    </div>
  </section>
</JarvisLayout>

<script>
  import "../../lib/jarvis/cockpit/main";
</script>
```

- [ ] **Step 4: Build del panel**

Run: `cd panel && npm run build`
Expected: PASS (astro check + build). Si aparece "Duplicate id", corré `rm -rf panel/.astro panel/dist` y reintentá (documentado en `web/README.md`, aplica igual al panel).

- [ ] **Step 5: Commit**

```bash
git add panel/src/pages/jarvis/index.astro panel/src/pages/jarvis/resumen.astro
git commit -m "feat(cockpit): /jarvis es el cockpit; dashboard movido a /jarvis/resumen"
```

---

## Task 12: Link "Resumen" en el sidebar

**Files:**
- Modify: `panel/src/components/jarvis/JarvisNavList.astro:60-73`

- [ ] **Step 1: Añadir el link de Resumen bajo "Command Center"**

En `panel/src/components/jarvis/JarvisNavList.astro`, justo DESPUÉS del bloque `<a href={routes.home} ...>…Command Center</a>` (cierra en la línea ~73) y ANTES de `{JARVIS_DEPARTMENTS.map(...)}`, insertá:

```astro
  <a
    href="/jarvis/resumen"
    class:list={[
      "jv-nav-item flex items-center gap-2 rounded-sm text-[var(--jv-text-sm)] no-underline transition-colors duration-200",
      itemPadding,
      isJarvisNavActive(path, "/jarvis/resumen") ? "jv-nav-active font-medium" : "text-[var(--jv-text-muted)]",
    ]}
  >
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d={icons.panel} />
    </svg>
    Resumen
  </a>
```

(El script de `JarvisLayout` reescribe `/jarvis/resumen` → `/resumen` en el subdominio automáticamente; `isJarvisNavActive` ya normaliza ambas formas.)

- [ ] **Step 2: Cambiar la etiqueta del home a "Cockpit"**

En el mismo archivo, en el `<a href={routes.home} ...>`, cambiá el texto visible `Command Center` por `Cockpit`.

- [ ] **Step 3: Build del panel**

Run: `cd panel && npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add panel/src/components/jarvis/JarvisNavList.astro
git commit -m "feat(nav): sidebar enlaza Cockpit (home) + Resumen"
```

---

## Task 13: Rewrite `/resumen` para el subdominio JARVIS

**Files:**
- Modify: `vercel.json:45-99` (bloque `rewrites`)

- [ ] **Step 1: Añadir el rewrite del subdominio**

En `vercel.json`, dentro de `"rewrites"`, agregá (junto a los otros `has host jarvis.zenkai.systems`, ej. después del bloque `/intel`):

```json
    {
      "source": "/resumen",
      "has": [{ "type": "host", "value": "jarvis.zenkai.systems" }],
      "destination": "/jarvis/resumen/"
    },
```

- [ ] **Step 2: Validar el JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('vercel.json','utf8')); console.log('ok')"`
Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add vercel.json
git commit -m "chore(vercel): rewrite /resumen en el subdominio jarvis"
```

---

## Task 14: Verificación final

**Files:** (ninguno nuevo — verificación)

- [ ] **Step 1: Test backend (assert script, sin claves reales)**

Run: `npm run test:plan`
Expected: `4 checks passed`, exit 0.

- [ ] **Step 2: Typecheck del root**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Tests del panel (vitest)**

Run: `cd panel && npm test`
Expected: PASS (api.test.ts + stages.test.ts).

- [ ] **Step 4: Build del panel**

Run: `cd panel && npm run build`
Expected: PASS.

- [ ] **Step 5: Smoke manual (dev) — opcional pero recomendado**

Run: `cd panel && npm run dev`
Luego abrí `http://localhost:4321/jarvis`:
- El cockpit es el home, con sidebar (Cockpit, Resumen, departamentos, etc.).
- "Resumen" del sidebar abre el dashboard anterior.
- Sin backend local (`/api/agency/plan` 404 bajo `astro dev`): "Procesar" muestra "sin conexión" en la etapa 2 — esperado (los endpoints viven en Vercel; ver `AGENTS.md`). Para probar el flujo completo se necesita `vercel dev` o el deploy con `ZENKAI_API_KEY` + (`DEEPSEEK_API_KEY` o `ANTHROPIC_API_KEY`).
- Verificá responsive (DevTools 360px): etapas apiladas, sin scroll horizontal.

- [ ] **Step 6: Commit final (si quedó algo suelto) y cierre**

```bash
git status
git add -A
git commit -m "test(cockpit): verificación Fase 1 (build + typecheck + tests verdes)" || echo "nada que commitear"
```

---

## Cobertura del spec (self-review)

- AC1 (home shell único, responsive) → Tasks 9, 11, 12.
- AC2 (plan sin ejecutar, etapas animadas) → Tasks 4, 8, 9, 10.
- AC3 (gate aprobar/rechazar) → Tasks 6, 10.
- AC4 (degradación sin keys / modo demo) → Task 10 (Step 1 decide demo; Step process 401/sin conexión).
- AC5 (`prefers-reduced-motion`) → Task 9.
- AC6 (401 con CTA de key) → Task 10.
- AC7 (tests + build + typecheck) → Tasks 2-4, 7, 8, 14.
- AC8 (cross-links; `web/` intacto) → Tasks 11, 12 (no se toca `web/`).
- D1 → Task 1 · D2 (clasificar por DeepSeek vía `callAgencyLlm`) → Task 4 · D3 → Task 6.
