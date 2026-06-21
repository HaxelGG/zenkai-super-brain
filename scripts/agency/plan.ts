/**
 * Plan · clasifica + propone (DeepSeek) + encola job pending_approval.
 * NO ejecuta nada. La ejecución ocurre al aprobar vía /api/agency/jobs.
 */
import { callAgencyLlm } from "./llm.js";
import { createJob, type JobArtifacts } from "./jobs.js";

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
  artifacts: JobArtifacts;
}

export interface PlanDeps {
  classify: (instruction: string) => Promise<PlanClassification>;
  propose: (instruction: string) => Promise<PlanProposal>;
  createJob: (input: PlanJobInput) => Promise<{ id: string }>;
}

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
