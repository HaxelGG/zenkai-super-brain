/**
 * ElevenLabs TTS para voz JARVIS · acento paisa · servidor (Vercel).
 */
import {
  JARVIS_PAISA_VOICE_SETTINGS,
  JARVIS_VOICE_ID_DEFAULT,
  resolveJarvisTtsModel,
  resolveJarvisVoiceIdFromEnv,
} from "../../jarvis/voice/config.js";

export function resolveJarvisVoiceId(): string {
  return resolveJarvisVoiceIdFromEnv();
}

export type JarvisSpeechResult = {
  audio: Buffer;
  mimeType: string;
  provider: "elevenlabs";
};

export async function synthesizeJarvisSpeech(text: string): Promise<JarvisSpeechResult | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey?.trim()) return null;

  const voiceId = resolveJarvisVoiceId();
  const modelId = resolveJarvisTtsModel();
  const payload = text.trim().slice(0, 800);
  if (!payload) return null;

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: payload,
      model_id: modelId,
      voice_settings: JARVIS_PAISA_VOICE_SETTINGS,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`ElevenLabs ${res.status}: ${err.slice(0, 200)}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return {
    audio: Buffer.from(arrayBuffer),
    mimeType: "audio/mpeg",
    provider: "elevenlabs",
  };
}

export { JARVIS_VOICE_ID_DEFAULT };
