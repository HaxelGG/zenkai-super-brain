/**
 * GET /api/jarvis/status · capacidades del cerebro y conexiones
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBrainCapabilities } from "../../scripts/jarvis/ops-context.js";
import { allowDashboardRequest, setDashboardCacheHeaders } from "./_guard.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!allowDashboardRequest(req, res)) return;

  setDashboardCacheHeaders(res, 30);

  const caps = getBrainCapabilities();
  res.status(200).json({
    ok: caps.brain,
    message: caps.brain
      ? `Cerebro activo (${caps.brainProvider})`
      : "Cerebro OFF — configurá DEEPSEEK_API_KEY o ANTHROPIC_API_KEY en Vercel",
    capabilities: caps,
  });
}
