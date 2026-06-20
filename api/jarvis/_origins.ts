/**
 * Validación estricta de orígenes para endpoints JARVIS (sin prefix-match).
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

const ALLOWED_ORIGINS = new Set([
  "https://jarvis.zenkai.systems",
  "https://panel.zenkai.systems",
  "http://localhost:4321",
  "http://127.0.0.1:4321",
]);

function parseOrigin(value: string): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return ALLOWED_ORIGINS.has(value) ? value : null;
  }
}

function isPreviewOrigin(origin: string): boolean {
  if (process.env.VERCEL_ENV === "production") return false;
  try {
    return new URL(origin).hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

export function isAllowedJarvisOrigin(origin: string, referer: string): boolean {
  const o = parseOrigin(origin);
  if (o && (ALLOWED_ORIGINS.has(o) || isPreviewOrigin(o))) return true;

  const r = parseOrigin(referer);
  if (r && (ALLOWED_ORIGINS.has(r) || isPreviewOrigin(r))) return true;

  return false;
}

export function setJarvisCors(
  req: VercelRequest,
  res: VercelResponse,
  methods: string,
  headers: string,
): void {
  const origin = typeof req.headers.origin === "string" ? req.headers.origin : "";
  const parsed = parseOrigin(origin);
  if (!parsed) return;

  if (ALLOWED_ORIGINS.has(parsed) || isPreviewOrigin(parsed)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", methods);
    res.setHeader("Access-Control-Allow-Headers", headers);
  }
}
