// Endpoint POST /api/protocolo · genera respuesta §8 (clasif + diagnóstico + 2 rutas + recomendación + próximo paso)
// Modelo: Sonnet 4.6 · costo ~$0.08 por call

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { protocolo } from "../scripts/anthropic/protocolo.js";
import { requireBearer } from "./_auth.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (!requireBearer(req, res)) return;

  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed · use POST" });
    return;
  }

  const body = (req.body ?? {}) as { input?: unknown };
  if (typeof body.input !== "string" || !body.input.trim()) {
    res.status(400).json({ error: "input required (non-empty string)" });
    return;
  }

  try {
    const result = await protocolo(body.input);
    res.status(200).json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(500).json({ error: msg });
  }
}
