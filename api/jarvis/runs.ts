/**
 * GET /api/jarvis/runs · placeholder · historial vive en localStorage del dashboard.
 * Futuro: persistir runs en Airtable OPERACIONES.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { allowDashboardRequest, setDashboardCacheHeaders } from "./_guard.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!allowDashboardRequest(req, res)) return;

  setDashboardCacheHeaders(res, 0);

  res.status(200).json({
    source: "client",
    message: "Historial de runs en el panel de voz del Command Center (localStorage).",
    runs: [],
  });
}
