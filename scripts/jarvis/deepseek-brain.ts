/**
 * JARVIS · cerebro conversacional vía DeepSeek API.
 * Usado por el orquestador en cada instrucción (voz, Telegram, API).
 */
import type { JarvisCrmSnapshot } from "../airtable/jarvis-crm.js";

export type BrainOutput = {
  reply: string;
  speech: string;
  action?: { type: "navigate"; path: string };
  agent?: string;
};

export type BrainResult =
  | { ok: true; data: BrainOutput }
  | { ok: false; error: string; detail?: unknown };

const NAV_PATHS = [
  "/jarvis/",
  "/jarvis/intel/",
  "/jarvis/agentes/",
  "/jarvis/pipeline/",
  "/jarvis/clientes/",
  "/jarvis/finanzas/",
  "/jarvis/social/",
  "/jarvis/tareas/",
  "/jarvis/sistemas/",
  "/jarvis/goals/",
] as const;

const AGENTS = [
  "ARES",
  "HERMES",
  "ATLAS",
  "NEXUS",
  "APOLLO",
  "MUSE",
  "FORGE",
  "ORACLE",
  "HIVE",
  "ECHO",
  "LEX",
  "ZEUS",
] as const;

const SYSTEM_PROMPT = `Sos JARVIS, el sistema de inteligencia operativa de ZENKAI Growth Systems (Pereira, Colombia). Operás el Command Center para Jordy, CEO de la agencia.

NO sos un chatbot genérico ni un clasificador. Sos el Super Cerebro en modo asistente ejecutivo: interpretás intención, priorizás, y respondés con criterio propio.

PERSONALIDAD Y VOZ:
- Sofisticado, directo, estratégico. Calidez controlada; "señor" solo ocasionalmente.
- Proactivo: si los datos operativos muestran riesgo u oportunidad, mencionalo sin que te lo pidan.
- Autonomía: no repitas frases de manual; razoná en voz alta de forma breve cuando aporte valor.
- Español neutro LATAM. Sin emojis. Sin markdown. Sin listas numeradas en speech.

CONTEXTO ZENKAI:
- Agencia de IA · meta 2026: USD 100K facturados · nicho e-commerce fase 1, salud fase 2.
- 12 agentes Master: ${AGENTS.join(", ")}.
- Stack: Airtable (verdad), Make/n8n, Claude, DeepSeek, ElevenLabs, Vercel.

NAVEGACIÓN (action navigate cuando el usuario quiera ver/abrir/revisar un módulo):
${NAV_PATHS.map((p) => `- ${p}`).join("\n")}

SALIDA — EXCLUSIVAMENTE JSON válido:
{
  "reply": "2-4 frases para UI/Telegram. Puede ser más completa.",
  "speech": "Versión hablada natural, máximo 220 caracteres, ideal para TTS.",
  "action": null o { "type": "navigate", "path": "/jarvis/..." },
  "agent": null o uno de ${AGENTS.join("|")}
}

REGLAS:
- speech debe sonar hablado por un mayordomo digital inteligente, no robótico.
- Si piden finanzas, pipeline, clientes, tareas, etc., incluí action navigate al path correcto.
- Usá datos OPERATIVOS del contexto si existen; si faltan, sé honesto sin sonar roto.
- Nunca texto fuera del JSON.`;

function resolveProvider(): "deepseek" | "off" {
  const explicit = (process.env.JARVIS_LLM_PROVIDER || process.env.LLM_PROVIDER || "").toLowerCase();
  if (explicit === "off" || explicit === "local") return "off";
  if (explicit === "anthropic" || explicit === "clasificar") return "off";
  if (process.env.DEEPSEEK_API_KEY?.trim()) return "deepseek";
  return "off";
}

export function isJarvisBrainEnabled(): boolean {
  return resolveProvider() === "deepseek";
}

function trimSpeech(text: string, max = 220): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

function buildOpsContext(crm: JarvisCrmSnapshot | null): string {
  const now = new Date().toLocaleString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (!crm) {
    return `[CONTEXTO OPERATIVO · ${now}]\nCRM no disponible en este momento. Respondé con criterio general ZENKAI.`;
  }

  if (crm.source !== "live") {
    return `[CONTEXTO OPERATIVO · ${now} · DEMO]\nDatos mock — AIRTABLE_TOKEN no configurado o sin acceso.\nLeads: ${crm.leadsTotal} · Clientes activos: ${crm.clientesActivos} · Deals: ${crm.dealsTotal}`;
  }

  const topLeads = crm.leads
    .slice(0, 5)
    .map((l) => `${l.name} (${l.company}) · ${l.stage} · score ${l.score}/10`)
    .join("; ");

  return `[CONTEXTO OPERATIVO · ${now} · LIVE]
Leads CRM: ${crm.leads.length} · Clientes activos: ${crm.clientesActivos} · Deals: ${crm.dealsTotal}
Pipeline funnel: ${crm.pipelineFunnel.map((s) => `${s.stage}:${s.count}`).join(", ")}
Top leads: ${topLeads || "ninguno"}`;
}

function extractJson(raw: string): unknown {
  const t = raw.trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no JSON in model response");
  return JSON.parse(t.slice(start, end + 1));
}

function parseBrainOutput(raw: unknown): BrainOutput {
  if (!raw || typeof raw !== "object") throw new Error("invalid brain payload");
  const o = raw as Record<string, unknown>;

  const reply = typeof o.reply === "string" ? o.reply.trim() : "";
  const speechRaw = typeof o.speech === "string" ? o.speech.trim() : reply;
  if (!reply) throw new Error("empty reply");

  let action: BrainOutput["action"];
  if (o.action && typeof o.action === "object") {
    const a = o.action as Record<string, unknown>;
    if (a.type === "navigate" && typeof a.path === "string") {
      const path = a.path.endsWith("/") ? a.path : `${a.path}/`;
      const normalized = NAV_PATHS.find((p) => p === path || p === a.path) ?? null;
      if (normalized) action = { type: "navigate", path: normalized };
    }
  }

  let agent: string | undefined;
  if (typeof o.agent === "string") {
    const up = o.agent.toUpperCase();
    if (AGENTS.includes(up as (typeof AGENTS)[number])) agent = up;
  }

  return {
    reply,
    speech: trimSpeech(speechRaw || reply),
    action,
    agent,
  };
}

export async function askJarvisBrain(
  instruction: string,
  crm: JarvisCrmSnapshot | null,
): Promise<BrainResult> {
  if (!isJarvisBrainEnabled()) {
    return { ok: false, error: "deepseek not configured" };
  }

  const apiKey = process.env.DEEPSEEK_API_KEY!.trim();
  const model = process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat";
  const context = buildOpsContext(crm);

  let res: Response;
  try {
    res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 600,
        temperature: 0.65,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `${context}\n\n[INSTRUCCIÓN DEL USUARIO]\n${instruction.trim()}`,
          },
        ],
      }),
    });
  } catch (err) {
    return {
      ok: false,
      error: "deepseek call failed",
      detail: err instanceof Error ? err.message : String(err),
    };
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return { ok: false, error: "deepseek call failed", detail: detail.slice(0, 300) };
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch (err) {
    return { ok: false, error: "deepseek parse failed", detail: String(err) };
  }

  const content = (body as { choices?: { message?: { content?: unknown } }[] })?.choices?.[0]?.message
    ?.content;
  if (typeof content !== "string") {
    return { ok: false, error: "deepseek empty response" };
  }

  try {
    return { ok: true, data: parseBrainOutput(extractJson(content)) };
  } catch (err) {
    return {
      ok: false,
      error: "invalid brain json",
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}
