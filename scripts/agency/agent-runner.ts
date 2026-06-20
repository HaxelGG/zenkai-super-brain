/**
 * Ejecutor de agente individual por ID
 */
import { fetchJarvisOps, formatJarvisOpsContext } from "../jarvis/ops-context.js";
import { callAgencyLlm } from "./llm.js";
import { dispatchAgencyEvent, dispatchToN8nResult } from "./dispatch.js";
import { getAgent } from "./registry.js";
import type { AgencyRunInput, AgencyRunResult, AgentId } from "./types.js";
import { createOpsTask } from "./departments/operations.js";

function buildAgentSystemPrompt(agentId: AgentId): string {
  const a = getAgent(agentId);
  return `Eres ${a.name}, agente Master de ZENKAI · Departamento: ${a.department}.
Propósito: ${a.purpose}
Subagentes disponibles: ${a.subagentes.join(", ") || "ninguno"}.
Responde en español LATAM, estratégico y accionable. 3-6 frases.
Si proponés tareas concretas, listalas al final como bullets cortos.`;
}

export async function runAgent(input: AgencyRunInput): Promise<AgencyRunResult> {
  const agentId = input.agentId;
  if (!agentId) throw new Error("agentId required");

  const agent = getAgent(agentId);
  const ops = await fetchJarvisOps();
  const context = formatJarvisOpsContext(ops);
  const extra = input.context ? `\n[CONTEXTO ADICIONAL]\n${JSON.stringify(input.context)}` : "";

  const llm = await callAgencyLlm(agent.modelo, [
    { role: "system", content: buildAgentSystemPrompt(agentId) },
    { role: "user", content: `${context}${extra}\n\n[INSTRUCCIÓN]\n${input.instruction}` },
  ]);

  if (!llm.ok) throw new Error(llm.error);

  const primaryEvent = agent.n8nEvents[0];
  let dispatch: AgencyRunResult["dispatch"];
  if (primaryEvent) {
    const d = await dispatchAgencyEvent(primaryEvent, {
      agent: agentId,
      instruction: input.instruction,
      reply: llm.text,
    });
    dispatch = dispatchToN8nResult(d);
  }

  const task = await createOpsTask({
    title: `${agentId}: ${input.instruction.slice(0, 80)}`,
    agent: agentId,
    department: agent.department,
    priority: agentId === "ZEUS" || agentId === "HERMES" ? "high" : "medium",
    status: "working",
  });

  return {
    id: `agent_${agentId}_${Date.now()}`,
    agent: agentId,
    department: agent.department,
    reply: llm.text,
    speech: llm.text.slice(0, 220),
    provider: llm.provider,
    model: llm.model,
    timestamp: new Date().toISOString(),
    tasks: [task],
    dispatch,
    meta: { contextLive: ops.live },
  };
}
