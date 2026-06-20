/**
 * NEXUS + FORGE · automatización e infra IA
 */
import { fetchJarvisOps, formatJarvisOpsContext } from "../../jarvis/ops-context.js";
import { dispatchAgencyEvent, dispatchToN8nResult } from "../dispatch.js";
import { callAgencyLlm } from "../llm.js";
import { getAgent, pickLeadAgent } from "../registry.js";
import type { AgencyRunResult, AgentId } from "../types.js";
import { createOpsTask } from "./operations.js";

export async function runIaPipeline(instruction: string, agentId?: AgentId): Promise<AgencyRunResult> {
  const agent = getAgent(agentId || pickLeadAgent("ia"));
  const ops = await fetchJarvisOps();
  const context = formatJarvisOpsContext(ops);

  const llm = await callAgencyLlm(agent.modelo, [
    {
      role: "system",
      content: `Eres ${agent.id}, agente de IA y automatización ZENKAI.
Diseñás flujos n8n, integraciones MCP, scripts Windmill y deploys Vercel.
Responde texto plano, 4-6 frases, accionables. Sin markdown.`,
    },
    { role: "user", content: `${context}\n\n[INSTRUCCIÓN]\n${instruction}` },
  ]);

  if (!llm.ok) throw new Error(llm.error);

  const d = await dispatchAgencyEvent("agency.ia.automation", {
    agent: agent.id,
    instruction: instruction.slice(0, 300),
    reply: llm.text.slice(0, 500),
  });

  const task = await createOpsTask({
    title: `${agent.id}: ${instruction.slice(0, 70)}`,
    agent: agent.id,
    department: "ia",
    priority: "medium",
    status: "working",
  });

  return {
    id: `ia_${Date.now()}`,
    agent: agent.id,
    department: "ia",
    reply: llm.text,
    speech: llm.text.slice(0, 220),
    provider: llm.provider,
    model: llm.model,
    timestamp: new Date().toISOString(),
    tasks: [task],
    dispatch: dispatchToN8nResult(d),
  };
}

export async function runForgeDevTask(instruction: string): Promise<AgencyRunResult> {
  const envelope = {
    agent: "FORGE",
    instruction,
    stack: "Cursor · Claude Code · Vercel · GitLab",
    suggestedBranch: `forge/${Date.now()}`,
    mcp: ["cursor-ide", "gitlab", "vercel"],
    createdAt: new Date().toISOString(),
  };

  const d = await dispatchAgencyEvent("agency.ia.devtask", envelope);
  const task = await createOpsTask({
    title: `FORGE dev: ${instruction.slice(0, 60)}`,
    agent: "FORGE",
    department: "ia",
    priority: "high",
    status: "pending",
  });

  return {
    id: `forge_${Date.now()}`,
    agent: "FORGE",
    department: "ia",
    reply: `Tarea dev encolada para Cursor/Claude Code. Branch sugerido: ${envelope.suggestedBranch}. ${instruction.slice(0, 120)}`,
    speech: "Tarea de desarrollo encolada para el agente Forge.",
    provider: "anthropic",
    model: "pipeline",
    timestamp: new Date().toISOString(),
    tasks: [task],
    dispatch: dispatchToN8nResult(d),
    meta: { envelope },
  };
}
