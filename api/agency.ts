import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleAgencyRoute } from "../scripts/api/routes/agency.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  await handleAgencyRoute(req, res);
}
