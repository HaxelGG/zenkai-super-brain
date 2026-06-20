/**
 * JARVIS Orquestador · cerebro LLM + contexto ops + n8n dispatch.
 */
import { clasificar } from "../anthropic/clasificar.js";
import { directorRoute, shouldDelegateToAgency } from "../agency/director.js";
import { askJarvisBrain, isJarvisBrainEnabled } from "./brain.js";
import { dispatchJarvisEvent } from "./n8n-dispatch.js";
import { fetchJarvisOps, formatJarvisOpsContext } from "./ops-context.js";

export type JarvisAction = { type: "navigate"; path: string };

export type JarvisRunResult = {
  id: string;
  instruction: string;
  reply: string;
  speech: string;
  action?: JarvisAction;
  agent?: string;
  source: "deepseek" | "anthropic" | "local" | "clasificar";
  timestamp: string;
  dispatch?: { event: string; ok: boolean; error?: string };
  meta?: { fallbackReason?: string; contextLive?: boolean; agency?: boolean; department?: string };
};

function makeId(): string {
  return `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function trimSpeech(text: string, max = 220): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

async function legacyClasificar(
  id: string,
  trimmed: string,
  timestamp: string,
): Promise<JarvisRunResult> {
  try {
    const c = await clasificar(trimmed);
    const agent = c.agentes_a_activar?.[0];
    const reply = [
      c.razonamiento ? trimSpeech(c.razonamiento, 200) : "",
      agent ? `Activo sugerido: ${agent}.` : "",
      c.sector_detectado && c.sector_detectado !== "ninguno"
        ? `Sector: ${c.sector_detectado}.`
        : "",
    ]
      .filter(Boolean)
      .join(" ");

    return {
      id,
      instruction: trimmed,
      reply: reply || "Procesado.",
      speech: trimSpeech(reply || "Procesado."),
      agent,
      source: "clasificar",
      timestamp,
      meta: { fallbackReason: "brain unavailable · clasificar fallback" },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return {
      id,
      instruction: trimmed,
      reply: `No pude conectar el cerebro JARVIS. ${msg}`,
      speech: "El cerebro no está disponible. Revisá las API keys en Vercel.",
      source: "local",
      timestamp,
      meta: { fallbackReason: msg },
    };
  }
}

export async function executeJarvisInstruction(instruction: string): Promise<JarvisRunResult> {
  const trimmed = instruction.trim();
  const id = makeId();
  const timestamp = new Date().toISOString();

  if (!trimmed) {
    return {
      id,
      instruction: trimmed,
      reply: "No recibí instrucción.",
      speech: "No recibí instrucción.",
      source: "local",
      timestamp,
    };
  }

  if (shouldDelegateToAgency(trimmed)) {
    try {
      const routed = await directorRoute(trimmed);
      const primary = routed.results[0];
      if (primary) {
        return {
          id,
          instruction: trimmed,
          reply: primary.reply,
          speech: primary.speech || primary.reply.slice(0, 220),
          agent: primary.agent,
          source: primary.provider,
          timestamp,
          dispatch: primary.dispatch,
          meta: { agency: true, department: routed.department, contextLive: !!primary.meta?.contextLive },
        };
      }
    } catch (e) {
      console.warn("[jarvis] agency director failed:", e instanceof Error ? e.message : e);
    }
  }

  if (isJarvisBrainEnabled()) {
    const ops = await fetchJarvisOps();
    const context = formatJarvisOpsContext(ops);
    const brain = await askJarvisBrain(trimmed, context);

    if (brain.ok) {
      let dispatchResult: JarvisRunResult["dispatch"];
      if (brain.data.dispatch) {
        const d = await dispatchJarvisEvent(brain.data.dispatch.event, {
          instruction: trimmed,
          ...brain.data.dispatch.payload,
        });
        dispatchResult = {
          event: brain.data.dispatch.event,
          ok: d.ok,
          error: d.ok ? undefined : d.error,
        };
      }

      return {
        id,
        instruction: trimmed,
        reply: brain.data.reply,
        speech: brain.data.speech,
        action: brain.data.action,
        agent: brain.data.agent,
        source: brain.provider,
        timestamp,
        dispatch: dispatchResult,
        meta: { contextLive: ops.live },
      };
    }

    console.warn("[jarvis] brain failed:", brain.error, brain.detail ?? "");
    const fallback = await legacyClasificar(id, trimmed, timestamp);
    fallback.meta = {
      ...fallback.meta,
      fallbackReason: `${brain.error}${brain.detail ? `: ${String(brain.detail).slice(0, 80)}` : ""}`,
    };
    return fallback;
  }

  return legacyClasificar(id, trimmed, timestamp);
}
