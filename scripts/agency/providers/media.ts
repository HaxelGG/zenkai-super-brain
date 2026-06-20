/**
 * Proveedores de media · ElevenLabs · HeyGen · Higgsfield.
 * Todos los fetch con timeout (no cuelgan el tick) y HeyGen con recolector
 * de video (pollHeyGenVideo) para cerrar el ciclo de generación asíncrona.
 */
import { synthesizeJarvisSpeech } from "../../jarvis/elevenlabs-speak.js";
import type { MediaJob } from "../types.js";
import { fetchWithTimeout } from "./http.js";

const HEYGEN_BASE = process.env.HEYGEN_API_URL?.trim() || "https://api.heygen.com";

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function runVoicePipeline(text: string): Promise<MediaJob> {
  if (!process.env.ELEVENLABS_API_KEY?.trim()) {
    return { provider: "elevenlabs", status: "skipped", error: "ELEVENLABS_API_KEY missing" };
  }
  try {
    const result = await synthesizeJarvisSpeech(text);
    if (!result) return { provider: "elevenlabs", status: "error", error: "empty audio" };
    return {
      provider: "elevenlabs",
      status: "done",
      artifactUrl: `elevenlabs:audio:${result.audio.length}bytes`,
    };
  } catch (e) {
    return { provider: "elevenlabs", status: "error", error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Recolector: consulta el estado del video HeyGen hasta completarse.
 * Lo usa el job-runner/scheduler (con maxDuration alto), no el request corto.
 */
export async function pollHeyGenVideo(
  videoId: string,
  maxMs = 240_000,
): Promise<{ status: "completed" | "failed" | "processing"; url?: string; error?: string }> {
  const apiKey = process.env.HEYGEN_API_KEY?.trim();
  if (!apiKey) return { status: "failed", error: "HEYGEN_API_KEY missing" };
  const started = Date.now();
  while (Date.now() - started < maxMs) {
    let res: Response;
    try {
      res = await fetchWithTimeout(
        `${HEYGEN_BASE}/v1/video_status.get?video_id=${encodeURIComponent(videoId)}`,
        { headers: { "x-api-key": apiKey, accept: "application/json" } },
        15_000,
      );
    } catch (e) {
      return { status: "processing", error: e instanceof Error ? e.message : String(e) };
    }
    if (!res.ok) return { status: "processing", error: `status HTTP ${res.status}` };
    const body = (await res.json()) as { data?: { status?: string; video_url?: string; error?: unknown } };
    const s = body.data?.status || "processing";
    if (s === "completed") return { status: "completed", url: body.data?.video_url };
    if (s === "failed") return { status: "failed", error: String(body.data?.error || "heygen failed") };
    await sleep(5000);
  }
  return { status: "processing", error: "poll timeout" };
}

/**
 * Genera un video con avatar HeyGen. Por defecto encola y devuelve `processing`
 * (apto para funciones serverless cortas). Si se pasa awaitMs > 0, espera la URL
 * final hasta ese límite (apto para jobs con maxDuration alto).
 */
export async function runHeyGenVideo(script: string, title?: string, awaitMs = 0): Promise<MediaJob> {
  const apiKey = process.env.HEYGEN_API_KEY?.trim();
  const avatarId = process.env.HEYGEN_AVATAR_ID?.trim();
  if (!apiKey) return { provider: "heygen", status: "skipped", error: "HEYGEN_API_KEY missing" };

  try {
    const res = await fetchWithTimeout(
      `${HEYGEN_BASE}/v2/video/generate`,
      {
        method: "POST",
        headers: { "x-api-key": apiKey, "content-type": "application/json" },
        body: JSON.stringify({
          video_inputs: [
            {
              character: { type: "avatar", avatar_id: avatarId || "default" },
              voice: {
                type: "text",
                input_text: script.slice(0, 1500),
                voice_id: process.env.HEYGEN_VOICE_ID || undefined,
              },
            },
          ],
          title: title || "ZENKAI Content",
          dimension: { width: 1080, height: 1920 },
        }),
      },
      30_000,
    );

    if (!res.ok) {
      const detail = await res.text();
      return { provider: "heygen", status: "error", error: `HTTP ${res.status}: ${detail.slice(0, 120)}` };
    }

    const body = (await res.json()) as { data?: { video_id?: string } };
    const videoId = body.data?.video_id;
    if (!videoId) return { provider: "heygen", status: "queued" };

    if (awaitMs > 0) {
      const polled = await pollHeyGenVideo(videoId, awaitMs);
      if (polled.status === "completed") {
        return { provider: "heygen", status: "done", artifactUrl: polled.url || `heygen:video:${videoId}` };
      }
      if (polled.status === "failed") {
        return { provider: "heygen", status: "error", error: polled.error, artifactUrl: `heygen:video:${videoId}` };
      }
      return { provider: "heygen", status: "processing", artifactUrl: `heygen:video:${videoId}`, error: polled.error };
    }

    return { provider: "heygen", status: "processing", artifactUrl: `heygen:video:${videoId}` };
  } catch (e) {
    return { provider: "heygen", status: "error", error: e instanceof Error ? e.message : String(e) };
  }
}

export async function runHiggsfieldClip(prompt: string): Promise<MediaJob> {
  const apiKey = process.env.HIGGSFIELD_API_KEY?.trim();
  const baseUrl = process.env.HIGGSFIELD_API_URL?.trim() || "https://api.higgsfield.ai/v1";
  if (!apiKey) return { provider: "higgsfield", status: "skipped", error: "HIGGSFIELD_API_KEY missing" };

  try {
    const res = await fetchWithTimeout(
      `${baseUrl}/generations`,
      {
        method: "POST",
        headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
        body: JSON.stringify({ prompt: prompt.slice(0, 800), aspect_ratio: "9:16", duration_seconds: 8 }),
      },
      30_000,
    );

    if (!res.ok) {
      const detail = await res.text();
      return { provider: "higgsfield", status: "error", error: `HTTP ${res.status}: ${detail.slice(0, 120)}` };
    }

    const body = (await res.json()) as { id?: string; status?: string; url?: string };
    return {
      provider: "higgsfield",
      status: body.status === "completed" ? "done" : "processing",
      artifactUrl: body.url || (body.id ? `higgsfield:job:${body.id}` : undefined),
    };
  } catch (e) {
    return { provider: "higgsfield", status: "error", error: e instanceof Error ? e.message : String(e) };
  }
}

export async function runMediaPipeline(
  script: string,
  opts: { voice?: boolean; video?: boolean; videoProvider?: "heygen" | "higgsfield"; awaitVideoMs?: number },
): Promise<MediaJob[]> {
  const jobs: MediaJob[] = [];
  if (opts.voice) jobs.push(await runVoicePipeline(script));
  if (opts.video) {
    const provider = opts.videoProvider || (process.env.HEYGEN_API_KEY ? "heygen" : "higgsfield");
    jobs.push(
      provider === "heygen"
        ? await runHeyGenVideo(script, undefined, opts.awaitVideoMs ?? 0)
        : await runHiggsfieldClip(script),
    );
  }
  return jobs;
}
