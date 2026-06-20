/**
 * POST /api/agency/cron/tick · motor autónomo (Vercel Cron)
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runAgencySchedulerTick } from "../../../scripts/agency/scheduler.js";

function authorizeCron(req: VercelRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  const auth = req.headers.authorization;
  if (auth === `Bearer ${secret}`) return true;
  if (req.headers["x-cron-secret"] === secret) return true;
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== "GET" && req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  if (!authorizeCron(req)) {
    res.status(401).json({ error: "unauthorized · CRON_SECRET required" });
    return;
  }

  try {
    const result = await runAgencySchedulerTick();
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
}
