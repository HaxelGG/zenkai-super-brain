/**
 * JARVIS · cerebro LLM (DeepSeek primero · Anthropic fallback).
 */
import { getBrainCapabilities } from "./ops-context.js";

export type BrainOutput = {
  reply: string;
  speech: string;
  action?: { type: "navigate"; path: string };
  agent?: string;
  dispatch?: { event: string; payload?: Record<string, unknown> };
};

export type BrainResult =
  | { ok: true; data: BrainOutput; provider: "deepseek" | "anthropic" }
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

const SYSTEM_PROMPT = `Sos JARVIS, el sistema de inteligencia operativa de ZENKAI Growth Systems (Pereira, Colombia). Operás para Jordy, CEO.

NO sos un chatbot ni un clasificador. Sos el Super Cerebro ejecutivo: interpretás, priorizás, recomendás y actuás con autonomía.

PERSONALIDAD:
- Sofisticado, estratégico, directo. Calidez controlada.
- Proactivo: riesgos y oportunidades en los datos operativos → mencionalos.
- Razonamiento breve cuando aporte valor. Español LATAM. Sin emojis ni markdown en speech.

ZENKAI:
- Meta 2026: USD 100K · e-commerce fase 1 · salud fase 2.
- Agentes: ${AGENTS.join(", ")}.
- Stack: Airtable, n8n/Make, DeepSeek, Claude, ElevenLabs, Vercel, Windmill MCP.

NAVEGACIÓN (action cuando quiera ver/abrir módulo):
${NAV_PATHS.map((p) => `- ${p}`).join("\n")}

AUTOMATIZACIÓN n8n (dispatch opcional — solo si pide acción operativa: alerta, email, workflow):
Eventos: jarvis.recap · jarvis.alert · jarvis.lead_followup · jarvis.custom
"dispatch": { "event": "jarvis.recap", "payload": { "reason": "..." } }

SALIDA — SOLO JSON:
{
  "reply": "2-4 frases completas para UI/Telegram",
  "speech": "≤220 chars, natural para voz",
  "action": null | { "type": "navigate", "path": "/jarvis/..." },
  "agent": null | "HERMES",
  "dispatch": null | { "event": "jarvis.recap", "payload": {} }
}

REGLAS:
- Usá números del CONTEXTO OPERATIVO cuando existan.
- Nunca digas "Input clasificado" ni suenes a bot de soporte.
- speech = frase hablada, no lista.`;

export function isJarvisBrainEnabled(): boolean {
  return getBrainCapabilities().brain;
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

async function callDeepSeek(context: string, instruction: string): Promise<BrainResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) return { ok: false, error: "deepseek not configured" };

  const model = process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat";
  return callLlm("deepseek", apiKey, model, context, instruction, true);
}

async function callAnthropic(context: string, instruction: string): Promise<BrainResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return { ok: false, error: "anthropic not configured" };

  const model = process.env.JARVIS_ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-6";

  let res: Response;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 700,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `${context}\n\n[INSTRUCCIÓN]\n${instruction.trim()}\n\nResponde SOLO JSON válido.`,
          },
        ],
      }),
    });
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
    return { ok: true, provider: "anthropic", data: parseBrainOutput(extractJson(text)) };
  } catch (err) {
    return {
      ok: false,
      error: "invalid brain json",
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}

async function callLlm(
  provider: "deepseek",
  apiKey: string,
  model: string,
  context: string,
  instruction: string,
  jsonMode: boolean,
): Promise<BrainResult> {
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
        max_tokens: 700,
        temperature: 0.7,
        ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `${context}\n\n[INSTRUCCIÓN]\n${instruction.trim()}`,
          },
        ],
      }),
    });
  } catch (err) {
    return {
      ok: false,
      error: `${provider} call failed`,
      detail: err instanceof Error ? err.message : String(err),
    };
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return { ok: false, error: `${provider} call failed`, detail: detail.slice(0, 300) };
  }

  const body = (await res.json()) as {
    choices?: { message?: { content?: unknown } }[];
  };
  const content = body.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    return { ok: false, error: `${provider} empty response` };
  }

  try {
    return { ok: true, provider, data: parseBrainOutput(extractJson(content)) };
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

  const caps = getBrainCapabilities();
  if (caps.deepseek) {
    const ds = await callDeepSeek(opsContext, instruction);
    if (ds.ok) return ds;
    console.warn("[jarvis/brain] deepseek failed:", ds.error, ds.detail ?? "");
  }

  if (caps.anthropic) {
    return callAnthropic(opsContext, instruction);
  }

  return { ok: false, error: "no LLM provider available" };
}
