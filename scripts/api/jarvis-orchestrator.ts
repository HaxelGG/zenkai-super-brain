import type { VercelRequest, VercelResponse } from "@vercel/node";
import { hasValidBearer } from "./auth.js";
import { isAllowedJarvisOrigin, setJarvisCors } from "./jarvis-origins.js";

export function setOrchestratorCors(req: VercelRequest, res: VercelResponse): void {
  setJarvisCors(req, res, "POST, OPTIONS", "Authorization, Content-Type");
}

export function allowOrchestratorRequest(req: VercelRequest, res: VercelResponse): boolean {
  setOrchestratorCors(req, res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return false;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed · use POST" });
    return false;
  }

  if (hasValidBearer(req)) return true;

  const origin = typeof req.headers.origin === "string" ? req.headers.origin : "";
  const referer = typeof req.headers.referer === "string" ? req.headers.referer : "";

  if (isAllowedJarvisOrigin(origin, referer)) return true;

  res.status(401).json({ error: "unauthorized · Bearer ZENKAI_API_KEY or dashboard origin required" });
  return false;
}
