/**
 * ElevenLabs TTS para voz JARVIS · servidor (Vercel).
 * Fallback: el cliente usa speechSynthesis si no hay API key.
 */

const DEFAULT_VOICE_ID = "FqHzPCWiAfnd8t6A5LN4";
const DEFAULT_MODEL = "eleven_multilingual_v2";

export type JarvisSpeechResult = {
  audio: Buffer;
  mimeType: string;
  provider: "elevenlabs";
};

export async function synthesizeJarvisSpeech(text: string): Promise<JarvisSpeechResult | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey?.trim()) return null;

  const voiceId = process.env.ELEVENLABS_VOICE_ID?.trim() || DEFAULT_VOICE_ID;
  const modelId = process.env.ELEVENLABS_MODEL_ID?.trim() || DEFAULT_MODEL;
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
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.78,
        style: 0.15,
        use_speaker_boost: true,
      },
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
