/**
 * Auth compuesta para endpoints agency · GET (dashboard) + POST (Bearer / dashboard)
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { hasValidBearer } from "../_auth.js";
import { isAllowedJarvisOrigin, setJarvisCors } from "../jarvis/_origins.js";

export function allowAgencyJobsRequest(req: VercelRequest, res: VercelResponse): boolean {
  const method = req.method || "GET";
  setJarvisCors(req, res, "GET, POST, OPTIONS", "Authorization, Content-Type, Accept");

  if (method === "OPTIONS") {
    res.status(204).end();
    return false;
  }

  if (method !== "GET" && method !== "POST") {
    res.status(405).json({ error: "GET or POST only" });
    return false;
  }

  if (hasValidBearer(req)) return true;

  const origin = typeof req.headers.origin === "string" ? req.headers.origin : "";
  const referer = typeof req.headers.referer === "string" ? req.headers.referer : "";

  if (isAllowedJarvisOrigin(origin, referer)) return true;

  if (process.env.NODE_ENV !== "production") return true;

  res.status(401).json({ error: "unauthorized · Bearer ZENKAI_API_KEY or dashboard origin" });
  return false;
}
