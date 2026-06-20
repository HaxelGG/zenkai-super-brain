/**
 * POST /api/jarvis/speak · TTS ElevenLabs voz JARVIS-ZENKAI
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { synthesizeJarvisSpeech } from "../../scripts/jarvis/elevenlabs-speak.js";
import { allowOrchestratorRequest } from "./_orchestrator.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!allowOrchestratorRequest(req, res)) return;

  const body = (req.body ?? {}) as { text?: unknown };
  if (typeof body.text !== "string" || !body.text.trim()) {
    res.status(400).json({ error: "text required (non-empty string)" });
    return;
  }

  if (!process.env.ELEVENLABS_API_KEY) {
    res.status(503).json({
      error: "ELEVENLABS_API_KEY not configured",
      fallback: "browser-tts",
    });
    return;
  }

  try {
    const result = await synthesizeJarvisSpeech(body.text);
    if (!result) {
      res.status(503).json({ error: "speech synthesis unavailable", fallback: "browser-tts" });
      return;
    }
    res.setHeader("Content-Type", result.mimeType);
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Jarvis-TTS", result.provider);
    res.status(200).send(result.audio);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[api/jarvis/speak]", message);
    res.status(502).json({ error: message, fallback: "browser-tts" });
  }
}
