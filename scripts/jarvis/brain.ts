/**
 * JARVIS · cerebro LLM (routing por complejidad · DeepSeek · Anthropic)
 */
import { getBrainCapabilities } from "./ops-context.js";
import { routeJarvisModel, type JarvisComplexityTier } from "./model-router.js";

export type BrainOutput = {
  reply: string;
  speech: string;
  action?: { type: "navigate"; path: string };
  agent?: string;
  dispatch?: { event: string; payload?: Record<string, unknown> };
};

export type BrainResult =
  | {
      ok: true;
      data: BrainOutput;
      provider: "deepseek" | "anthropic";
      model: string;
      tier: JarvisComplexityTier;
    }
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

const SYSTEM_PROMPT = `Sos JARVIS, el Super Cerebro operativo de ZENKAI Growth Systems — Pereira, Risaralda, Colombia. Trabajás con Jordy, el parce CEO.

NO sos un chatbot genérico. Sos director de operaciones con autonomía: interpretás, priorizás, orquestás flujos, API calls, automatizaciones (n8n/Make), y das recomendaciones accionables.

PERSONALIDAD PAISA (natural, no caricatura):
- Calidez eje cafetero: "parce", "pues", "vea", "listo", "¿cierto?", "de una", "qué tal".
- Profesional y directo — como un socio de confianza en Pereira, no un robot de call center.
- Escuchás completo antes de responder; en voz, frases cortas y humanas (como hablaría alguien real).
- Podés usar "usted" con respeto o "vos/parce" según el tono; nunca suenes a manual corporativo.
- Sin emojis ni markdown en speech. Sin "Input clasificado" ni frases de soporte técnico.

CAPACIDADES DE ORQUESTACIÓN:
- Navegar módulos del HUD cuando pidan ver algo.
- Sugerir agente Master (ARES, HERMES, NEXUS, etc.) cuando la tarea lo requiera.
- Disparar eventos n8n solo si piden acción operativa concreta (alerta, email, workflow).
- Recomendar siguiente paso único y accionable.

ZENKAI:
- Meta 2026: USD 100K · e-commerce fase 1 · salud fase 2.
- Agentes: ${AGENTS.join(", ")}.
- Stack: Airtable, n8n/Make, DeepSeek, Claude, ElevenLabs, Vercel.

NAVEGACIÓN (action cuando quiera ver/abrir módulo):
${NAV_PATHS.map((p) => `- ${p}`).join("\n")}

AUTOMATIZACIÓN n8n (dispatch opcional — solo acción operativa explícita):
Eventos: jarvis.recap · jarvis.alert · jarvis.lead_followup · jarvis.custom
"dispatch": { "event": "jarvis.recap", "payload": { "reason": "..." } }

SALIDA — SOLO JSON:
{
  "reply": "2-4 frases completas para UI/Telegram",
  "speech": "≤220 chars, natural para voz, tono paisa",
  "action": null | { "type": "navigate", "path": "/jarvis/..." },
  "agent": null | "HERMES",
  "dispatch": null | { "event": "jarvis.recap", "payload": {} }
}

REGLAS:
- Usá números del CONTEXTO OPERATIVO cuando existan.
- speech = una frase hablada, no lista ni bullets.`;

export function isJarvisBrainEnabled(): boolean {
  return getBrainCapabilities().brain;
}

const LLM_TIMEOUT_SIMPLE_MS = 22_000;
const LLM_TIMEOUT_COMPLEX_MS = 38_000;

async function fetchLlm(url: string, init: RequestInit, tier: JarvisComplexityTier): Promise<Response> {
  const ms = tier === "complex" ? LLM_TIMEOUT_COMPLEX_MS : LLM_TIMEOUT_SIMPLE_MS;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`LLM timeout after ${ms}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function trimSpeech(text: string, max = 220): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
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

  let dispatch: BrainOutput["dispatch"];
  if (o.dispatch && typeof o.dispatch === "object") {
    const d = o.dispatch as Record<string, unknown>;
    if (typeof d.event === "string" && d.event.startsWith("jarvis.")) {
      dispatch = {
        event: d.event,
        payload:
          d.payload && typeof d.payload === "object"
            ? (d.payload as Record<string, unknown>)
            : undefined,
      };
    }
  }

  return {
    reply,
    speech: trimSpeech(speechRaw || reply),
    action,
    agent,
    dispatch,
  };
}

async function callDeepSeek(
  model: string,
  context: string,
  instruction: string,
  tier: JarvisComplexityTier,
): Promise<BrainResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) return { ok: false, error: "deepseek not configured" };

  const isReasoner = model.includes("reasoner");
  let res: Response;
  try {
    res = await fetchLlm("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: tier === "complex" ? 900 : 700,
        temperature: isReasoner ? 0.5 : 0.7,
        ...(isReasoner ? {} : { response_format: { type: "json_object" } }),
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `${context}\n\n[INSTRUCCIÓN]\n${instruction.trim()}${isReasoner ? "\n\nResponde SOLO JSON válido." : ""}`,
          },
        ],
      }),
    }, tier);
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

  const body = (await res.json()) as {
    choices?: { message?: { content?: unknown; reasoning_content?: unknown } }[];
  };
  const msg = body.choices?.[0]?.message;
  const content =
    typeof msg?.content === "string"
      ? msg.content
      : typeof msg?.reasoning_content === "string"
        ? msg.reasoning_content
        : null;
  if (!content) {
    return { ok: false, error: "deepseek empty response" };
  }

  try {
    return {
      ok: true,
      provider: "deepseek",
      model,
      tier,
      data: parseBrainOutput(extractJson(content)),
    };
  } catch (err) {
    if (isReasoner) {
      const chatModel = process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat";
      if (chatModel !== model) {
        console.warn("[jarvis/brain] reasoner json failed · retry deepseek-chat");
        return callDeepSeek(chatModel, context, instruction, tier);
      }
    }
    return {
      ok: false,
      error: "invalid brain json",
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}

async function callAnthropic(
  model: string,
  context: string,
  instruction: string,
  tier: JarvisComplexityTier,
): Promise<BrainResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return { ok: false, error: "anthropic not configured" };

  let res: Response;
  try {
    res = await fetchLlm("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: tier === "complex" ? 900 : 700,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `${context}\n\n[INSTRUCCIÓN]\n${instruction.trim()}\n\nResponde SOLO JSON válido.`,
          },
        ],
      }),
    }, tier);
  } catch (err) {
    return {
      ok: false,
      error: "anthropic call failed",
      detail: err instanceof Error ? err.message : String(err),
    };
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return { ok: false, error: "anthropic call failed", detail: detail.slice(0, 300) };
  }

  const body = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  const text = body.content?.find((b) => b.type === "text")?.text;
  if (!text) return { ok: false, error: "anthropic empty response" };

  try {
    return {
      ok: true,
      provider: "anthropic",
      model,
      tier,
      data: parseBrainOutput(extractJson(text)),
    };
  } catch (err) {
    return {
      ok: false,
      error: "invalid brain json",
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function askJarvisBrain(
  instruction: string,
  opsContext: string,
): Promise<BrainResult> {
  if (!isJarvisBrainEnabled()) {
    return { ok: false, error: "brain disabled or no API keys" };
  }

  const route = routeJarvisModel(instruction);
  const caps = getBrainCapabilities();

  console.info(
    `[jarvis/brain] tier=${route.tier} score=${route.score} ds=${route.deepseekModel} ant=${route.anthropicModel}`,
  );

  const skipDeepseek =
    route.preferAnthropic ||
    process.env.JARVIS_SKIP_DEEPSEEK?.trim() === "1" ||
    process.env.JARVIS_LLM_PROVIDER?.toLowerCase() === "anthropic";

  if (!skipDeepseek && caps.deepseek) {
    const ds = await callDeepSeek(route.deepseekModel, opsContext, instruction, route.tier);
    if (ds.ok) return ds;
    console.warn("[jarvis/brain] deepseek failed:", ds.error, ds.detail ?? "");
  }

  if (caps.anthropic) {
    const ant = await callAnthropic(route.anthropicModel, opsContext, instruction, route.tier);
    if (ant.ok) return ant;
    console.warn("[jarvis/brain] anthropic failed:", ant.error, ant.detail ?? "");
  }

  if (route.preferAnthropic && caps.deepseek) {
    return callDeepSeek(route.deepseekModel, opsContext, instruction, route.tier);
  }

  return { ok: false, error: "no LLM provider available" };
}

export { classifyJarvisInstruction, routeJarvisModel } from "./model-router.js";
