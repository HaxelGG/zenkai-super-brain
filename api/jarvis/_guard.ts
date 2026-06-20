/**
 * Guard interno para endpoints JARVIS dashboard.
 * Asume Vercel Deployment Protection en producción.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isAllowedJarvisOrigin, setJarvisCors } from "./_origins.js";

export function allowDashboardRequest(req: VercelRequest, res: VercelResponse): boolean {
  setJarvisCors(req, res, "GET, OPTIONS", "Accept");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return false;
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "method not allowed · use GET" });
    return false;
  }

  const origin = typeof req.headers.origin === "string" ? req.headers.origin : "";
  const referer = typeof req.headers.referer === "string" ? req.headers.referer : "";

  if (!isAllowedJarvisOrigin(origin, referer) && process.env.NODE_ENV === "production") {
    res.status(403).json({ error: "forbidden · dashboard origin required" });
    return false;
  }

  return true;
}

export function setDashboardCacheHeaders(res: VercelResponse, maxAgeSec = 60): void {
  res.setHeader("Cache-Control", `private, max-age=${maxAgeSec}, stale-while-revalidate=120`);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
}
