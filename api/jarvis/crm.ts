/**
 * GET /api/jarvis/crm · snapshot CRM en runtime (Airtable)
 * Refresca badge LIVE y tablas sin redeploy del panel estático.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getJarvisCrmSnapshot } from "../../scripts/airtable/jarvis-crm.js";
import { allowDashboardRequest, setDashboardCacheHeaders } from "./_guard.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!allowDashboardRequest(req, res)) return;

  setDashboardCacheHeaders(res, 45);

  try {
    const snapshot = await getJarvisCrmSnapshot(process.env.AIRTABLE_TOKEN);
    res.status(200).json({
      ...snapshot,
      liveRecords: {
        leads: snapshot.leads.length,
        clients: snapshot.clientes.length,
        deals: snapshot.dealsTotal,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[api/jarvis/crm]", message);
    res.status(502).json({
      source: "mock",
      fetchedAt: new Date().toISOString(),
      error: message,
      liveRecords: { leads: 0, clients: 0, deals: 0 },
      leads: [],
      clientes: [],
      pipelineFunnel: [],
    });
  }
}
