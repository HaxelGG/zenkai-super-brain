// Endpoint POST /api/clasificar · clasifica input según §7 de CLAUDE.md
// Modelo: Haiku 4.5 · costo ~$0.002 por call

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { clasificar, render } from "../scripts/anthropic/clasificar.js";
import { requireBearer } from "../scripts/api/auth.js";

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
    const result = await clasificar(body.input);
    if (req.query.render === "markdown") {
      res.setHeader("Content-Type", "text/markdown; charset=utf-8");
      res.status(200).send(render(result));
      return;
    }
    res.status(200).json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(500).json({ error: msg });
  }
}
