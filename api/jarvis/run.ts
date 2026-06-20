/**
 * POST /api/jarvis/run · ejecuta instrucción del orquestador JARVIS
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { executeJarvisInstruction } from "../../scripts/jarvis/orchestrator.js";
import { allowOrchestratorRequest } from "./_orchestrator.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!allowOrchestratorRequest(req, res)) return;

  const body = (req.body ?? {}) as { instruction?: unknown };
  if (typeof body.instruction !== "string" || !body.instruction.trim()) {
    res.status(400).json({ error: "instruction required (non-empty string)" });
    return;
  }

  try {
    const result = await executeJarvisInstruction(body.instruction);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[api/jarvis/run]", message);
    res.status(500).json({ error: message });
  }
}
