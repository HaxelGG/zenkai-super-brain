/**
 * Guard interno para endpoints JARVIS dashboard.
 * Asume Vercel Deployment Protection en producción.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

const ALLOWED_ORIGINS = [
  "https://jarvis.zenkai.systems",
  "https://panel.zenkai.systems",
  "http://localhost:4321",
  "http://127.0.0.1:4321",
];

function setDashboardCors(req: VercelRequest, res: VercelResponse): void {
  const origin = typeof req.headers.origin === "string" ? req.headers.origin : "";
  if (ALLOWED_ORIGINS.some((o) => origin.startsWith(o))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Accept");
  }
}

export function allowDashboardRequest(req: VercelRequest, res: VercelResponse): boolean {
  setDashboardCors(req, res);

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

  const allowed =
    ALLOWED_ORIGINS.some((o) => origin.startsWith(o)) ||
    ALLOWED_ORIGINS.some((o) => referer.startsWith(o));

  // Permite curl/serverless smoke tests sin Origin en dev
  if (!allowed && process.env.NODE_ENV === "production") {
    res.status(403).json({ error: "forbidden · dashboard origin required" });
    return false;
  }

  return true;
}

export function setDashboardCacheHeaders(res: VercelResponse, maxAgeSec = 60): void {
  res.setHeader("Cache-Control", `private, max-age=${maxAgeSec}, stale-while-revalidate=120`);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
}
