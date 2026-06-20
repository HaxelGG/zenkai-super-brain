/**
 * ZEUS · estrategia (Opus)
 */
import { dispatchAgencyEvent, dispatchToN8nResult } from "../dispatch.js";
import { callAgencyLlm } from "../llm.js";
import { fetchJarvisOps, formatJarvisOpsContext } from "../../jarvis/ops-context.js";
import type { AgencyRunResult } from "../types.js";

export async function runStrategyPipeline(instruction: string): Promise<AgencyRunResult> {
  const ops = await fetchJarvisOps();
  const context = formatJarvisOpsContext(ops);

  const llm = await callAgencyLlm("opus", [
    {
      role: "system",
      content: `Eres ZEUS, estratega de ZENKAI Growth Systems. Decisiones N3-N4, roadmap, priorización multi-departamento.
Meta 2026: USD 100K. Texto plano, directo, 4-8 frases. Sin markdown.`,
    },
    { role: "user", content: `${context}\n\n[DECISIÓN ESTRATÉGICA]\n${instruction}` },
  ]);

  if (!llm.ok) throw new Error(llm.error);

  const d = await dispatchAgencyEvent("agency.strategy.decision", {
    instruction: instruction.slice(0, 300),
    reply: llm.text.slice(0, 800),
  });

  return {
    id: `strategy_${Date.now()}`,
    agent: "ZEUS",
    department: "strategy",
    reply: llm.text,
    speech: llm.text.slice(0, 220),
    provider: llm.provider,
    model: llm.model,
    timestamp: new Date().toISOString(),
    dispatch: dispatchToN8nResult(d),
    meta: { contextLive: ops.live },
  };
}
