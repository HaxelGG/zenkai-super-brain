/**
 * GET /api/jarvis/social · métricas Instagram + Meta Ads en runtime
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getJarvisSocialSnapshot } from "../../scripts/meta/jarvis-social.js";
import { allowDashboardRequest, setDashboardCacheHeaders } from "./_guard.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!allowDashboardRequest(req, res)) return;

  setDashboardCacheHeaders(res, 300);

  try {
    const snapshot = await getJarvisSocialSnapshot();
    res.status(200).json(snapshot);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[api/jarvis/social]", message);
    res.status(502).json({
      source: "mock",
      fetchedAt: new Date().toISOString(),
      error: message,
    });
  }
}
