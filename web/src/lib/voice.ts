// Síntesis de voz vía ElevenLabs · capa "Jarvis" del Super Cerebro.
//
// Convierte texto (típicamente una propuesta generada por /api/protocolo) en
// audio MP3, para que el Super Cerebro pueda "hablar" sus respuestas.
//
// Degradación elegante: sin ELEVENLABS_API_KEY devuelve { ok:false, status:500 }
// — nunca lanza. La landing/panel siguen funcionando sin voz.

import { z } from 'zod';

// Voz pública default de ElevenLabs ("Rachel") · multilingüe ES/EN.
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';
const DEFAULT_MODEL_ID = 'eleven_multilingual_v2';
const TTS_BASE = 'https://api.elevenlabs.io/v1/text-to-speech';

export const VoiceInputSchema = z.object({
  texto: z
    .string()
    .min(1, 'texto requerido')
    .max(5000, 'texto debe tener máximo 5000 caracteres'),
  voiceId: z.string().min(1).max(64).optional(),
});
export type VoiceInput = z.infer<typeof VoiceInputSchema>;

export type SynthResult =
  | { ok: true; audio: ArrayBuffer; contentType: string }
  | { ok: false; status: number; error: string; detail?: unknown };

/**
 * Sintetiza `texto` a audio MP3 con ElevenLabs.
 * @param texto  contenido a leer en voz alta (1-5000 chars).
 * @param voiceId  voz a usar; cae al env ELEVENLABS_VOICE_ID y luego a la default.
 */
export const synthesizeSpeech = async (
  texto: string,
  voiceId?: string,
): Promise<SynthResult> => {
  const parsed = VoiceInputSchema.safeParse({ texto, voiceId });
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      error: 'invalid input',
      detail: parsed.error.flatten().fieldErrors,
    };
  }

  const apiKey = import.meta.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return { ok: false, status: 500, error: 'ELEVENLABS_API_KEY missing' };
  }

  const voice =
    parsed.data.voiceId ||
    import.meta.env.ELEVENLABS_VOICE_ID ||
    DEFAULT_VOICE_ID;
  const modelId = import.meta.env.ELEVENLABS_MODEL_ID || DEFAULT_MODEL_ID;

  let res: Response;
  try {
    res = await fetch(`${TTS_BASE}/${encodeURIComponent(voice)}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'content-type': 'application/json',
        accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: parsed.data.texto,
        model_id: modelId,
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });
  } catch (err) {
    return {
      ok: false,
      status: 502,
      error: 'elevenlabs call failed',
      detail: err instanceof Error ? err.message : String(err),
    };
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    return {
      ok: false,
      status: 502,
      error: 'elevenlabs call failed',
      detail: detail.slice(0, 300),
    };
  }

  const audio = await res.arrayBuffer();
  return { ok: true, audio, contentType: 'audio/mpeg' };
};
