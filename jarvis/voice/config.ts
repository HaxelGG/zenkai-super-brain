/**
 * JARVIS · voz ElevenLabs · acento paisa (Medellín / eje cafetero)
 */

export const JARVIS_VOICE_NAME = "JARVIS-PAISA-ZENKAI";

/** Fallback hasta que exista ELEVENLABS_JARVIS_VOICE_ID en env */
export const JARVIS_VOICE_ID_DEFAULT = "d7IG6wlYK5eSWcMMJNsE";

export const JARVIS_TTS_MODEL_DEFAULT = "eleven_multilingual_v2";

export const JARVIS_VOICE_DESIGN_MODEL = "eleven_ttv_v3";

/** Prompt Voice Design · acento paisa natural, no caricatura */
export const JARVIS_PAISA_VOICE_DESCRIPTION = [
  "Adult male Colombian paisa accent from Medellín, Antioquia.",
  "Warm, confident, intelligent AI butler like JARVIS.",
  "Medium pitch, crisp Spanish with melodic paisa intonation and slight singsong cadence.",
  "Professional but friendly — natural Medellín business tone, not exaggerated cartoon.",
  "Sounds like a trusted parce who runs operations for a growth agency in Pereira.",
].join(" ");

/** ≥100 chars · preview con tono paisa */
export const JARVIS_PAISA_PREVIEW_TEXT =
  "Parce, buenos días. JARVIS en línea, sistemas operativos al peluche. " +
  "Contame qué necesitás y lo organizamos de una, ¿cierto? Veamos el estado del negocio.";

export type JarvisVoiceSettings = {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
};

/** Más style = cadencia paisa más expresiva sin perder claridad */
export const JARVIS_PAISA_VOICE_SETTINGS: JarvisVoiceSettings = {
  stability: 0.42,
  similarity_boost: 0.82,
  style: 0.28,
  use_speaker_boost: true,
};

export function resolveJarvisVoiceIdFromEnv(env: NodeJS.ProcessEnv = process.env): string {
  return (
    env.ELEVENLABS_JARVIS_VOICE_ID?.trim() ||
    env.ELEVENLABS_VOICE_ID?.trim() ||
    JARVIS_VOICE_ID_DEFAULT
  );
}

export function resolveJarvisTtsModel(env: NodeJS.ProcessEnv = process.env): string {
  return env.ELEVENLABS_MODEL_ID?.trim() || JARVIS_TTS_MODEL_DEFAULT;
}
