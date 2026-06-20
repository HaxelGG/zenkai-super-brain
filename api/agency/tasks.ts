/**
 * GET /api/agency/tasks · ops tasks + goals
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getOpsGoals, listOpsTasks } from "../../scripts/agency/departments/operations.js";
import { allowDashboardRequest, setDashboardCacheHeaders } from "../../jarvis/_guard.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!allowDashboardRequest(req, res)) return;
  setDashboardCacheHeaders(res, 20);

  const [tasks, goals] = await Promise.all([listOpsTasks(), getOpsGoals()]);
  res.status(200).json({ tasks, goals, orchestratedBy: "JARVIS" });
}
