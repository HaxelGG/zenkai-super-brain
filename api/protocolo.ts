// Endpoint POST /api/protocolo · genera respuesta §8 (clasif + diagnóstico + 2 rutas + recomendación + próximo paso)
// Modelo: Sonnet 4.6 · costo ~$0.08 por call

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { protocolo, render, renderPropuesta } from "../scripts/anthropic/protocolo.js";
import { persistirPropuesta } from "../scripts/airtable/persistir.js";
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
    const result = await protocolo(body.input);

    // Persistencia opt-in en Airtable (Fase 2 v0.1+).
    // Non-blocking: si Airtable falla, loguea pero no rompe la respuesta.
    // Si ?lead_id=recXXX está presente, linkea la propuesta a ese Lead.
    if (req.query.persist === "true") {
      const leadId =
        typeof req.query.lead_id === "string" && req.query.lead_id.startsWith("rec")
          ? req.query.lead_id
          : undefined;
      try {
        const { airtable_record_id } = await persistirPropuesta(body.input, result, leadId);
        res.setHeader("X-Airtable-Record-Id", airtable_record_id);
        if (leadId) res.setHeader("X-Airtable-Linked-Lead", leadId);
      } catch (persistErr) {
        const msg = persistErr instanceof Error ? persistErr.message : String(persistErr);
        console.error("[airtable] Persistencia falló:", msg);
        res.setHeader("X-Airtable-Error", msg.slice(0, 200));
      }
    }

    const renderMode = req.query.render;
    if (renderMode === "markdown") {
      res.setHeader("Content-Type", "text/markdown; charset=utf-8");
      res.status(200).send(render(result));
      return;
    }
    if (renderMode === "propuesta") {
      res.setHeader("Content-Type", "text/markdown; charset=utf-8");
      res.status(200).send(renderPropuesta(result));
      return;
    }
    res.status(200).json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(500).json({ error: msg });
  }
}
