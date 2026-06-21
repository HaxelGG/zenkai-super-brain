/**
 * Crea voz JARVIS-PAISA-ZENKAI en ElevenLabs (Voice Design) y guarda el voice_id.
 *
 * Uso: npm run jarvis:create-paisa-voice
 * Requiere: ELEVENLABS_API_KEY en .env
 */
import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  JARVIS_PAISA_PREVIEW_TEXT,
  JARVIS_PAISA_VOICE_DESCRIPTION,
  JARVIS_VOICE_DESIGN_MODEL,
  JARVIS_VOICE_NAME,
} from "../../jarvis/voice/config.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const SAMPLES_DIR = join(ROOT, "jarvis/voice/samples");

type Preview = {
  generated_voice_id: string;
  audio_base_64: string;
};

async function designVoice(apiKey: string): Promise<Preview[]> {
  const res = await fetch("https://api.elevenlabs.io/v1/text-to-voice/design", {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      voice_description: JARVIS_PAISA_VOICE_DESCRIPTION,
      text: JARVIS_PAISA_PREVIEW_TEXT,
      model_id: JARVIS_VOICE_DESIGN_MODEL,
      auto_generate_text: false,
      guidance_scale: 4,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Voice design ${res.status}: ${err.slice(0, 400)}`);
  }

  const data = (await res.json()) as { previews?: Preview[] };
  if (!data.previews?.length) throw new Error("Sin previews de voz");
  return data.previews;
}

async function saveVoice(apiKey: string, generatedVoiceId: string): Promise<string> {
  const res = await fetch("https://api.elevenlabs.io/v1/text-to-voice", {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      voice_name: JARVIS_VOICE_NAME,
      voice_description: JARVIS_PAISA_VOICE_DESCRIPTION,
      generated_voice_id: generatedVoiceId,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Save voice ${res.status}: ${err.slice(0, 400)}`);
  }

  const data = (await res.json()) as { voice_id?: string };
  if (!data.voice_id) throw new Error("Respuesta sin voice_id");
  return data.voice_id;
}

async function main() {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) {
    console.error("Falta ELEVENLABS_API_KEY en .env");
    process.exit(1);
  }

  console.log("Diseñando voz paisa JARVIS…");
  const previews = await designVoice(apiKey);
  const pick = previews[0];
  if (!pick) {
    console.error("ElevenLabs no devolvió previews de voz");
    process.exit(1);
  }
  console.log(`Preview elegido: ${pick.generated_voice_id} (${previews.length} opciones)`);

  await mkdir(SAMPLES_DIR, { recursive: true });
  const previewPath = join(SAMPLES_DIR, "jarvis-paisa-preview-1.mp3");
  await writeFile(previewPath, Buffer.from(pick.audio_base_64, "base64"));
  console.log(`Preview guardado: ${previewPath}`);

  console.log("Guardando voz en biblioteca ElevenLabs…");
  const voiceId = await saveVoice(apiKey, pick.generated_voice_id);

  const meta = {
    voice_id: voiceId,
    voice_name: JARVIS_VOICE_NAME,
    accent: "paisa-medellin",
    generated_voice_id: pick.generated_voice_id,
    created_at: new Date().toISOString(),
  };
  await writeFile(join(SAMPLES_DIR, "jarvis-paisa-voice-id.json"), JSON.stringify(meta, null, 2));

  console.log("\n✓ Voz paisa creada");
  console.log(`  voice_id: ${voiceId}`);
  console.log("\nAgregá a .env y Vercel (zenkaibrain):");
  console.log(`  ELEVENLABS_JARVIS_VOICE_ID=${voiceId}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
