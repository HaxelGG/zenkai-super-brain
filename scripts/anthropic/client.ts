// Cliente Anthropic compartido · carga .env de la raíz del repo

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error(
    "Falta ANTHROPIC_API_KEY en .env. Copiá .env.example a .env y rellenala con tu key de https://console.anthropic.com/settings/keys",
  );
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Aliases canónicos · sin sufijo de fecha (son los que recomienda la doc)
// Catálogo: §1 de CLAUDE.md
export const MODEL_OPUS = "claude-opus-4-7";
export const MODEL_SONNET = "claude-sonnet-4-6";
export const MODEL_HAIKU = "claude-haiku-4-5";
