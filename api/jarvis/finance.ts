/**
 * GET /api/jarvis/finance · revenue y pipeline desde Airtable CRM
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getJarvisFinanceSnapshot } from "../../scripts/airtable/jarvis-finance.js";
import { allowDashboardRequest, setDashboardCacheHeaders } from "./_guard.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!allowDashboardRequest(req, res)) return;

  setDashboardCacheHeaders(res, 120);

  try {
    const snapshot = await getJarvisFinanceSnapshot(process.env.AIRTABLE_TOKEN);
    res.status(200).json(snapshot);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[api/jarvis/finance]", message);
    res.status(502).json({
      source: "mock",
      fetchedAt: new Date().toISOString(),
      error: message,
      revenueYtd: 0,
      pipelineWeighted: 0,
      goal2026: 100_000,
    });
  }
}
