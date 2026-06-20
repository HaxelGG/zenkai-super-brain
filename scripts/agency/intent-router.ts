/**
 * Clasificador operativo · enruta acciones JARVIS (distinto a clasificar.ts §7)
 */
import { resolveClientSlug } from "./clients.js";

export type OperationalIntent =
  | "QUERY"
  | "NAVIGATE"
  | "CONTENT_BATCH"
  | "CONTENT_SINGLE"
  | "CODE_BUILD"
  | "COMMUNICATION"
  | "AUTOMATION"
  | "ANALYSIS";

export type ContentBatchParams = {
  count: number;
  topic: string;
  clientSlug: string;
  channel: "instagram" | "linkedin" | "tiktok";
  format: "post" | "carousel" | "reel" | "story";
};

export type OperationalRoute = {
  intent: OperationalIntent;
  confidence: number;
  agents: string[];
  riskLevel: "low" | "medium" | "high";
  requiresApproval: boolean;
  contentBatch?: ContentBatchParams;
  reason: string;
};

const BATCH_RE =
  /(?:sub(?:e|í)?me|publica|programa|genera|crea)\s+(?:me\s+)?(\d{1,2})\s+(?:publicaciones?|posts?|piezas?|contenidos?)/i;

const SINGLE_CONTENT_RE =
  /(?:crear|generar|publicar)\s+(?:un\s+)?(?:post|reel|carrusel|contenido|video)/i;

const COMM_RE = /(?:envi(?:a|á|ar)|mand(?:a|ar))\s+(?:un\s+)?(?:email|correo|whatsapp|mensaje)/i;
const CODE_RE = /(?:crear|build|implementar|desarrollar|deploy)\s+(?:landing|app|api| código|código|repo|proyecto)/i;
const AUTO_RE = /(?:automatiz|workflow|n8n|windmill|webhook)/i;

function extractTopic(instruction: string): string {
  const about = instruction.match(/(?:sobre|acerca de|hablando de|que hablen de)\s+(.+?)(?:\.|$)/i);
  if (about?.[1]) return about[1].trim().slice(0, 500);
  return instruction.replace(BATCH_RE, "").trim().slice(0, 500);
}

function detectChannel(instruction: string): ContentBatchParams["channel"] {
  if (/linkedin/i.test(instruction)) return "linkedin";
  if (/tiktok/i.test(instruction)) return "tiktok";
  return "instagram";
}

export function routeOperationalIntent(instruction: string): OperationalRoute {
  const trimmed = instruction.trim();
  const clientSlug = resolveClientSlug(trimmed);

  const batch = trimmed.match(BATCH_RE);
  if (batch) {
    const count = Math.min(Math.max(parseInt(batch[1]!, 10), 1), 20);
    return {
      intent: "CONTENT_BATCH",
      confidence: 0.92,
      agents: ["MUSE", "APOLLO"],
      riskLevel: "high",
      requiresApproval: true,
      contentBatch: {
        count,
        topic: extractTopic(trimmed),
        clientSlug,
        channel: detectChannel(trimmed),
        format: /carrusel|carousel/i.test(trimmed) ? "carousel" : "post",
      },
      reason: `${count} piezas · canal ${detectChannel(trimmed)} · cliente ${clientSlug}`,
    };
  }

  if (SINGLE_CONTENT_RE.test(trimmed)) {
    return {
      intent: "CONTENT_SINGLE",
      confidence: 0.85,
      agents: ["MUSE"],
      riskLevel: "medium",
      requiresApproval: true,
      reason: "Contenido unitario · requiere revisión antes de publicar",
    };
  }

  if (COMM_RE.test(trimmed)) {
    return {
      intent: "COMMUNICATION",
      confidence: 0.88,
      agents: ["HERMES", "ECHO"],
      riskLevel: "high",
      requiresApproval: true,
      reason: "Comunicación externa · human-in-the-loop obligatorio",
    };
  }

  if (CODE_RE.test(trimmed)) {
    return {
      intent: "CODE_BUILD",
      confidence: 0.8,
      agents: ["FORGE", "NEXUS"],
      riskLevel: "medium",
      requiresApproval: false,
      reason: "Construcción de software",
    };
  }

  if (AUTO_RE.test(trimmed)) {
    return {
      intent: "AUTOMATION",
      confidence: 0.75,
      agents: ["NEXUS"],
      riskLevel: "low",
      requiresApproval: false,
      reason: "Automatización / integración",
    };
  }

  return {
    intent: "QUERY",
    confidence: 0.5,
    agents: [],
    riskLevel: "low",
    requiresApproval: false,
    reason: "Consulta o instrucción general",
  };
}
