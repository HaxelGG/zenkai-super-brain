/**
 * POST /api/agency/director · JARVIS enruta a departamento
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { directorRoute } from "../../scripts/agency/director.js";
import { resolveAgentId, resolveDepartment } from "../../scripts/agency/registry.js";
import type { AgencyRunInput } from "../../scripts/agency/types.js";
import { allowOrchestratorRequest } from "../jarvis/_orchestrator.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!allowOrchestratorRequest(req, res)) return;

  const body = (req.body ?? {}) as {
    instruction?: unknown;
    agentId?: unknown;
    department?: unknown;
    media?: unknown;
  };

  if (typeof body.instruction !== "string" || !body.instruction.trim()) {
    res.status(400).json({ error: "instruction required" });
    return;
  }

  const input: Partial<AgencyRunInput> = {
    agentId: typeof body.agentId === "string" ? resolveAgentId(body.agentId) || undefined : undefined,
    department: typeof body.department === "string" ? resolveDepartment(body.department) || undefined : undefined,
    media: typeof body.media === "object" && body.media ? (body.media as AgencyRunInput["media"]) : undefined,
  };

  try {
    const result = await directorRoute(body.instruction.trim(), input);
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
}
