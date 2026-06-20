/**
 * Auth para endpoints POST del orquestador JARVIS (run · speak).
 * Acepta Bearer ZENKAI_API_KEY o origen del dashboard (panel/jarvis).
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { hasValidBearer } from "../_auth.js";

const ALLOWED_ORIGINS = [
  "https://jarvis.zenkai.systems",
  "https://panel.zenkai.systems",
  "http://localhost:4321",
  "http://127.0.0.1:4321",
];

export function setOrchestratorCors(req: VercelRequest, res: VercelResponse): void {
  const origin = typeof req.headers.origin === "string" ? req.headers.origin : "";
  if (ALLOWED_ORIGINS.some((o) => origin.startsWith(o))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  }
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
  const allowed =
    ALLOWED_ORIGINS.some((o) => origin.startsWith(o)) ||
    ALLOWED_ORIGINS.some((o) => referer.startsWith(o));

  if (allowed) return true;

  res.status(401).json({ error: "unauthorized · Bearer ZENKAI_API_KEY or dashboard origin required" });
  return false;
}
