/**
 * POST /api/agency/marketing/content · pipeline MUSE
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runMarketingContentPipeline } from "../../../scripts/agency/departments/marketing.js";
import { allowOrchestratorRequest } from "../../jarvis/_orchestrator.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!allowOrchestratorRequest(req, res)) return;

  const body = (req.body ?? {}) as {
    brief?: unknown;
    platform?: unknown;
    format?: unknown;
    voice?: unknown;
    video?: unknown;
    videoProvider?: unknown;
    schedule?: unknown;
  };

  if (typeof body.brief !== "string" || !body.brief.trim()) {
    res.status(400).json({ error: "brief required" });
    return;
  }

  try {
    const result = await runMarketingContentPipeline({
      brief: body.brief.trim(),
      platform: body.platform as "instagram" | "linkedin" | "tiktok" | undefined,
      format: body.format as "reel" | "carousel" | "post" | "story" | undefined,
      voice: body.voice === true,
      video: body.video === true,
      videoProvider: body.videoProvider as "heygen" | "higgsfield" | undefined,
      schedule: typeof body.schedule === "string" ? body.schedule : undefined,
    });
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
}
