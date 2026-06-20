/**
 * POST /api/agency/run · ejecuta un agente Master
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runAgent } from "../../scripts/agency/agent-runner.js";
import { resolveAgentId } from "../../scripts/agency/registry.js";
import type { AgencyRunInput, AgentId } from "../../scripts/agency/types.js";
import { allowOrchestratorRequest } from "../jarvis/_orchestrator.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!allowOrchestratorRequest(req, res)) return;

  const body = (req.body ?? {}) as {
    instruction?: unknown;
    agentId?: unknown;
    context?: unknown;
  };

  if (typeof body.instruction !== "string" || !body.instruction.trim()) {
    res.status(400).json({ error: "instruction required" });
    return;
  }

  const agentId =
    (typeof body.agentId === "string" ? resolveAgentId(body.agentId) : null) || ("ATLAS" as AgentId);

  const input: AgencyRunInput = {
    instruction: body.instruction.trim(),
    agentId,
    context: typeof body.context === "object" && body.context ? (body.context as Record<string, unknown>) : undefined,
  };

  try {
    const result = await runAgent(input);
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
}
