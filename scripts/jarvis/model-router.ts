/**
 * JARVIS · router de complejidad → tier LLM
 * Simple/normal → Haiku o DeepSeek-chat · Complejo → DeepSeek-reasoner o Sonnet
 */

export type JarvisComplexityTier = "simple" | "complex";

export type JarvisModelRoute = {
  tier: JarvisComplexityTier;
  score: number;
  reasons: string[];
  anthropicModel: string;
  deepseekModel: string;
  preferAnthropic: boolean;
};

const COMPLEX_PATTERNS: { re: RegExp; weight: number; label: string }[] = [
  { re: /estrateg|roadmap|expansion|expansión|decision|decisión|zeus|prioriz/i, weight: 3, label: "estrategia" },
  { re: /multi.?depart|varios agentes|orquest|coordin/i, weight: 3, label: "multi-agente" },
  { re: /automatiz|workflow|flujo|n8n|integra|api call|webhook|make\.com/i, weight: 2, label: "automatización" },
  { re: /analiz|compar|diagnóst|diagnost|auditor|benchmark|proyecc/i, weight: 2, label: "análisis" },
  { re: /arquitect|diseñar sistema|implementar|migrar|refactor/i, weight: 2, label: "arquitectura" },
  { re: /propuesta|cotiz|presupuesto|pricing|margen/i, weight: 2, label: "comercial-complejo" },
  { re: /\[agente[:\s]|\[departamento[:\s]|delega|ejecuta pipeline/i, weight: 3, label: "delegación agency" },
  { re: /plan de|paso a paso|detallad|completo|integral/i, weight: 1, label: "alcance amplio" },
];

const SIMPLE_PATTERNS: { re: RegExp; weight: number; label: string }[] = [
  { re: /^(hola|hey|buenos|gracias|ok|listo|parce)\b/i, weight: 2, label: "saludo" },
  { re: /^(abre|abrir|muestra|mostrar|ve a|ir a|navega)\b/i, weight: 2, label: "navegación" },
  { re: /^(cu[aá]ntos|cu[aá]ntas|qu[eé] tal|c[oó]mo est[aá])\b/i, weight: 1, label: "consulta rápida" },
  { re: /pipeline|finanzas|clientes|agentes|social|tareas|recap|resumen/i, weight: 1, label: "módulo HUD" },
  { re: /^(s[ií]|no|dale|perfecto)\b/i, weight: 1, label: "confirmación" },
];

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function classifyJarvisInstruction(instruction: string): {
  tier: JarvisComplexityTier;
  score: number;
  reasons: string[];
} {
  const t = instruction.trim();
  const words = wordCount(t);
  let score = 0;
  const reasons: string[] = [];

  if (words >= 35) {
    score += 3;
    reasons.push("instrucción larga");
  } else if (words >= 18) {
    score += 1;
  }

  for (const p of COMPLEX_PATTERNS) {
    if (p.re.test(t)) {
      score += p.weight;
      reasons.push(p.label);
    }
  }

  for (const p of SIMPLE_PATTERNS) {
    if (p.re.test(t)) {
      score -= p.weight;
      reasons.push(`simple:${p.label}`);
    }
  }

  if (words <= 8 && score < 2) {
    score -= 1;
    reasons.push("frase corta");
  }

  const tier: JarvisComplexityTier = score >= 3 ? "complex" : "simple";
  return { tier, score, reasons: [...new Set(reasons)] };
}

export function routeJarvisModel(instruction: string): JarvisModelRoute {
  const { tier, score, reasons } = classifyJarvisInstruction(instruction);

  const haiku = process.env.CLAUDE_MODEL_HAIKU?.trim() || "claude-haiku-4-5-20251001";
  const sonnet = process.env.JARVIS_ANTHROPIC_MODEL?.trim() || process.env.CLAUDE_MODEL_SONNET?.trim() || "claude-sonnet-4-6";
  const deepseekSimple = process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat";
  const deepseekComplex =
    process.env.DEEPSEEK_MODEL_COMPLEX?.trim() ||
    process.env.DEEPSEEK_MODEL_PRO?.trim() ||
    "deepseek-reasoner";

  const explicitProvider = (process.env.JARVIS_LLM_PROVIDER || process.env.AGENCY_LLM_PROVIDER || "").toLowerCase();
  const preferAnthropic = explicitProvider === "anthropic";

  return {
    tier,
    score,
    reasons,
    anthropicModel: tier === "complex" ? sonnet : haiku,
    deepseekModel: tier === "complex" ? deepseekComplex : deepseekSimple,
    preferAnthropic,
  };
}
