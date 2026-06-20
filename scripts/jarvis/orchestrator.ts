/**
 * JARVIS Orquestador · DeepSeek brain + fast fallbacks.
 */
import { clasificar } from "../anthropic/clasificar.js";
import { getJarvisCrmSnapshot } from "../airtable/jarvis-crm.js";
import { askJarvisBrain, isJarvisBrainEnabled } from "./deepseek-brain.js";

export type JarvisAction = { type: "navigate"; path: string };

export type JarvisRunResult = {
  id: string;
  instruction: string;
  reply: string;
  speech: string;
  action?: JarvisAction;
  agent?: string;
  source: "deepseek" | "local" | "crm" | "clasificar";
  timestamp: string;
};

const NAV_ROUTES: { re: RegExp; path: string; speech: string }[] = [
  { re: /finanzas|revenue|ingresos|cuentas/, path: "/jarvis/finanzas/", speech: "Abriendo métricas financieras." },
  { re: /pipeline|leads|deals|embudo/, path: "/jarvis/pipeline/", speech: "Consultando pipeline y CRM." },
  { re: /clientes|proyectos/, path: "/jarvis/clientes/", speech: "Mostrando clientes activos." },
  { re: /agentes|equipo ia/, path: "/jarvis/agentes/", speech: "Estado de agentes IA." },
  { re: /social|instagram|meta ads/, path: "/jarvis/social/", speech: "Abriendo métricas sociales." },
  { re: /tareas|pendientes|to do/, path: "/jarvis/tareas/", speech: "Revisando tareas." },
  { re: /sistemas|conexiones|stack/, path: "/jarvis/sistemas/", speech: "Panel de sistemas." },
  { re: /goals|metas|objetivos/, path: "/jarvis/goals/", speech: "Objetivos 2026." },
  { re: /intel|brief|reporte/, path: "/jarvis/intel/", speech: "Intel brief semanal." },
  { re: /command center|inicio|home|centro/, path: "/jarvis/", speech: "Command Center." },
];

function makeId(): string {
  return `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function trimSpeech(text: string, max = 220): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

function brainResult(
  id: string,
  instruction: string,
  timestamp: string,
  data: {
    reply: string;
    speech: string;
    action?: JarvisAction;
    agent?: string;
  },
): JarvisRunResult {
  return {
    id,
    instruction,
    reply: data.reply,
    speech: data.speech,
    action: data.action,
    agent: data.agent,
    source: "deepseek",
    timestamp,
  };
}

async function fetchCrmSafe() {
  try {
    return await getJarvisCrmSnapshot(process.env.AIRTABLE_TOKEN);
  } catch {
    return null;
  }
}

async function legacyFallback(
  id: string,
  trimmed: string,
  timestamp: string,
  lower: string,
): Promise<JarvisRunResult> {
  for (const route of NAV_ROUTES) {
    if (route.re.test(lower)) {
      return {
        id,
        instruction: trimmed,
        reply: route.speech,
        speech: route.speech,
        action: { type: "navigate", path: route.path },
        source: "local",
        timestamp,
      };
    }
  }

  if (/recap|resumen|estado|como vamos|status|situacion/.test(lower)) {
    try {
      const crm = await getJarvisCrmSnapshot(process.env.AIRTABLE_TOKEN);
      const reply =
        crm.source === "live"
          ? `Estado operativo: ${crm.leads.length} leads en CRM, ${crm.clientesActivos} clientes activos y ${crm.dealsTotal} deals registrados.`
          : "CRM en modo demo. Configura AIRTABLE_TOKEN para datos en vivo.";
      return {
        id,
        instruction: trimmed,
        reply,
        speech: trimSpeech(reply),
        source: "crm",
        timestamp,
      };
    } catch {
      /* fall through */
    }
  }

  if (/^(hola|hey|buenos|buenas|gracias)/.test(lower) && trimmed.length < 40) {
    const reply = "Presente, señor. JARVIS en línea. ¿Qué necesita?";
    return { id, instruction: trimmed, reply, speech: reply, source: "local", timestamp };
  }

  try {
    const c = await clasificar(trimmed);
    const agent = c.agentes_a_activar?.[0];
    const reply = [
      `Input clasificado: ${c.tipo}.`,
      c.sector_detectado && c.sector_detectado !== "ninguno" ? `Sector: ${c.sector_detectado}.` : "",
      c.confianza != null ? `Confianza ${Math.round(c.confianza * 100)}%.` : "",
      agent ? `Agente sugerido: ${agent}.` : "",
      c.razonamiento ? trimSpeech(c.razonamiento, 180) : "",
    ]
      .filter(Boolean)
      .join(" ");

    return {
      id,
      instruction: trimmed,
      reply,
      speech: trimSpeech(reply),
      agent,
      source: "clasificar",
      timestamp,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al procesar.";
    return {
      id,
      instruction: trimmed,
      reply: `No pude procesar la instrucción. ${msg}`,
      speech: "Hubo un error al procesar. Intente de nuevo.",
      source: "local",
      timestamp,
    };
  }
}

export async function executeJarvisInstruction(instruction: string): Promise<JarvisRunResult> {
  const trimmed = instruction.trim();
  const id = makeId();
  const timestamp = new Date().toISOString();
  const lower = trimmed
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

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

  if (isJarvisBrainEnabled()) {
    const crm = await fetchCrmSafe();
    const brain = await askJarvisBrain(trimmed, crm);
    if (brain.ok) {
      return brainResult(id, trimmed, timestamp, brain.data);
    }
    console.warn("[jarvis] deepseek fallback:", brain.error, brain.detail ?? "");
  }

  return legacyFallback(id, trimmed, timestamp, lower);
}
