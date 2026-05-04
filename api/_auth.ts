// Helper de auth · Bearer token con timing-safe comparison.
// Compartido entre /api/clasificar y /api/protocolo.

import { timingSafeEqual } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Devuelve true si el request está autenticado · false si no (y manda 401 directamente).
// Patrón: requireBearer(req, res); if (!authed) return;
export function requireBearer(req: VercelRequest, res: VercelResponse): boolean {
  const expected = process.env.ZENKAI_API_KEY;
  if (!expected) {
    res.status(500).json({ error: "ZENKAI_API_KEY no configurada en el server" });
    return false;
  }

  const auth = req.headers.authorization;
  if (typeof auth !== "string" || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "unauthorized" });
    return false;
  }

  const provided = auth.slice("Bearer ".length);
  // timingSafeEqual requiere buffers de igual longitud; padeamos al máximo de los dos
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    res.status(401).json({ error: "unauthorized" });
    return false;
  }
  if (!timingSafeEqual(a, b)) {
    res.status(401).json({ error: "unauthorized" });
    return false;
  }

  return true;
}
