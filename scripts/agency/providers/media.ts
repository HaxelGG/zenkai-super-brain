/**
 * Proveedores de media · ElevenLabs · HeyGen · Higgsfield
 */
import { synthesizeJarvisSpeech } from "../../jarvis/elevenlabs-speak.js";
import type { MediaJob, MediaProvider } from "../types.js";

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
      artifactUrl: `data:${result.mimeType};base64,${result.audio.toString("base64").slice(0, 40)}…`,
    };
  } catch (e) {
    return {
      provider: "elevenlabs",
      status: "error",
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function runHeyGenVideo(script: string, title?: string): Promise<MediaJob> {
  const apiKey = process.env.HEYGEN_API_KEY?.trim();
  const avatarId = process.env.HEYGEN_AVATAR_ID?.trim();
  if (!apiKey) {
    return { provider: "heygen", status: "skipped", error: "HEYGEN_API_KEY missing" };
  }

  try {
    const res = await fetch("https://api.heygen.com/v2/video/generate", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        video_inputs: [
          {
            character: { type: "avatar", avatar_id: avatarId || "default" },
            voice: { type: "text", input_text: script.slice(0, 1500), voice_id: process.env.HEYGEN_VOICE_ID || undefined },
          },
        ],
        title: title || "ZENKAI Content",
        dimension: { width: 1080, height: 1920 },
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return { provider: "heygen", status: "error", error: `HTTP ${res.status}: ${detail.slice(0, 120)}` };
    }

    const body = (await res.json()) as { data?: { video_id?: string } };
    const videoId = body.data?.video_id;
    return {
      provider: "heygen",
      status: videoId ? "processing" : "queued",
      artifactUrl: videoId ? `heygen:video:${videoId}` : undefined,
    };
  } catch (e) {
    return { provider: "heygen", status: "error", error: e instanceof Error ? e.message : String(e) };
  }
}

export async function runHiggsfieldClip(prompt: string): Promise<MediaJob> {
  const apiKey = process.env.HIGGSFIELD_API_KEY?.trim();
  const baseUrl = process.env.HIGGSFIELD_API_URL?.trim() || "https://api.higgsfield.ai/v1";
  if (!apiKey) {
    return { provider: "higgsfield", status: "skipped", error: "HIGGSFIELD_API_KEY missing" };
  }

  try {
    const res = await fetch(`${baseUrl}/generations`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt.slice(0, 800),
        aspect_ratio: "9:16",
        duration_seconds: 8,
      }),
    });

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
  opts: { voice?: boolean; video?: boolean; videoProvider?: "heygen" | "higgsfield" },
): Promise<MediaJob[]> {
  const jobs: MediaJob[] = [];
  if (opts.voice) jobs.push(await runVoicePipeline(script));
  if (opts.video) {
    const provider = opts.videoProvider || (process.env.HEYGEN_API_KEY ? "heygen" : "higgsfield");
    jobs.push(
      provider === "heygen"
        ? await runHeyGenVideo(script)
        : await runHiggsfieldClip(script),
    );
  }
  return jobs;
}
