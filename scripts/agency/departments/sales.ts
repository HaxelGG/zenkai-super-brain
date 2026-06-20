/**
 * HERMES · ventas · cualificación y follow-up
 */
import { dispatchJarvisEvent } from "../../jarvis/n8n-dispatch.js";
import { fetchJarvisOps, formatJarvisOpsContext } from "../../jarvis/ops-context.js";
import { callAgencyLlm } from "../llm.js";
import { getAgent } from "../registry.js";
import type { AgencyRunResult } from "../types.js";
import { createOpsTask } from "./operations.js";

export async function runSalesPipeline(instruction: string): Promise<AgencyRunResult> {
  const hermes = getAgent("HERMES");
  const ops = await fetchJarvisOps();
  const context = formatJarvisOpsContext(ops);

  const llm = await callAgencyLlm(hermes.modelo, [
    {
      role: "system",
      content: `Eres HERMES, agente de ventas ZENKAI. Cualificás, priorizás leads y proponés siguiente acción comercial.
Responde en español LATAM, 3-5 frases en texto plano (sin markdown, sin tablas, sin emojis).
Usá números del contexto cuando existan. Si hay lead hot, recomendá follow-up en menos de 24 horas.`,
    },
    { role: "user", content: `${context}\n\n[INSTRUCCIÓN]\n${instruction}` },
  ]);

  if (!llm.ok) throw new Error(llm.error);

  const d = await dispatchJarvisEvent("agency.sales.followup", { instruction, reply: llm.text });
  const task = await createOpsTask({
    title: `Follow-up ventas: ${instruction.slice(0, 60)}`,
    agent: "HERMES",
    department: "sales",
    priority: "high",
    status: "pending",
  });

  return {
    id: `sales_${Date.now()}`,
    agent: "HERMES",
    department: "sales",
    reply: llm.text,
    speech: llm.text.slice(0, 220),
    provider: llm.provider,
    model: llm.model,
    timestamp: new Date().toISOString(),
    tasks: [task],
    dispatch: { event: "agency.sales.followup", ok: d.ok, error: d.ok ? undefined : d.error },
    meta: { contextLive: ops.live },
  };
}
