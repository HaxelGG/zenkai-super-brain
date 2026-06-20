import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleJarvisRoute } from "../scripts/api/routes/jarvis.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  await handleJarvisRoute(req, res);
}
