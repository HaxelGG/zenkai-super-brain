/**
 * ORACLE · finanzas operativas
 */
import { getJarvisFinanceSnapshot } from "../../airtable/jarvis-finance.js";
import { dispatchAgencyEvent, dispatchToN8nResult } from "../dispatch.js";
import { callAgencyLlm } from "../llm.js";
import type { AgencyRunResult } from "../types.js";

export async function runFinancePipeline(instruction: string): Promise<AgencyRunResult> {
  const finance = await getJarvisFinanceSnapshot(process.env.AIRTABLE_TOKEN).catch(() => null);
  const ctx = finance
    ? `YTD $${finance.revenueYtd} · pipeline $${finance.pipelineWeighted} · meta $${finance.goal2026} · run rate $${finance.runRateMonthly}/mes`
    : "Sin datos live de finanzas";

  const llm = await callAgencyLlm("sonnet", [
    {
      role: "system",
      content: `Eres ORACLE, agente financiero ZENKAI. Analizás revenue, pipeline y run rate vs meta 2026 USD 100K.
Texto plano, 3-5 frases, números concretos. Sin markdown.`,
    },
    { role: "user", content: `[FINANZAS LIVE]\n${ctx}\n\n[INSTRUCCIÓN]\n${instruction}` },
  ]);

  if (!llm.ok) throw new Error(llm.error);

  const d = await dispatchAgencyEvent("agency.finance.report", { instruction, context: ctx });

  return {
    id: `finance_${Date.now()}`,
    agent: "ORACLE",
    department: "finance",
    reply: llm.text,
    speech: llm.text.slice(0, 220),
    provider: llm.provider,
    model: llm.model,
    timestamp: new Date().toISOString(),
    dispatch: dispatchToN8nResult(d),
    meta: { financeLive: finance?.source === "live" },
  };
}
