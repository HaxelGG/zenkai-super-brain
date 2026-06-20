/**
 * GET/POST /api/agency/calendar · calendario editorial
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { listCalendarAll, saveCalendarItem } from "../../scripts/agency/calendar.js";
import { allowDashboardRequest, setDashboardCacheHeaders } from "../jarvis/_guard.js";
import { allowOrchestratorRequest } from "../jarvis/_orchestrator.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method === "GET") {
    if (!allowDashboardRequest(req, res)) return;
    setDashboardCacheHeaders(res, 30);
    const data = await listCalendarAll();
    res.status(200).json(data);
    return;
  }

  if (req.method === "POST") {
    if (!allowOrchestratorRequest(req, res)) return;
    const body = (req.body ?? {}) as Record<string, unknown>;
    const item = await saveCalendarItem({
      title: String(body.title || ""),
      platform: (body.platform as "instagram") || "instagram",
      format: (body.format as "reel") || "reel",
      status: (body.status as "draft") || "draft",
      scheduledAt: body.scheduledAt ? String(body.scheduledAt) : undefined,
      hook: body.hook ? String(body.hook) : undefined,
      caption: body.caption ? String(body.caption) : undefined,
      script: body.script ? String(body.script) : undefined,
    });
    res.status(200).json(item);
    return;
  }

  res.status(405).json({ error: "GET or POST" });
}
