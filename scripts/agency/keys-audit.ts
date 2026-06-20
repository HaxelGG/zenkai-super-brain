/**
 * Auditoría de keys requeridas · sin exponer valores
 */
import { getProviderCapabilities } from "./capabilities.js";

export type KeyRequirement = {
  env: string;
  label: string;
  tier: "critical" | "department" | "optional";
  departments: string[];
  purpose: string;
  configured: boolean;
};

const REQUIREMENTS: Omit<KeyRequirement, "configured">[] = [
  { env: "ANTHROPIC_API_KEY", label: "Anthropic", tier: "critical", departments: ["all"], purpose: "Agentes Sonnet/Haiku/Opus" },
  { env: "DEEPSEEK_API_KEY", label: "DeepSeek", tier: "optional", departments: ["all"], purpose: "LLM primario económico" },
  { env: "ZENKAI_API_KEY", label: "ZENKAI API", tier: "critical", departments: ["all"], purpose: "Auth APIs JARVIS/agency" },
  { env: "AIRTABLE_TOKEN", label: "Airtable", tier: "critical", departments: ["sales", "operations", "marketing"], purpose: "CRM · tasks · calendario" },
  { env: "ELEVENLABS_API_KEY", label: "ElevenLabs", tier: "department", departments: ["marketing"], purpose: "Voz JARVIS + TTS contenido" },
  { env: "HEYGEN_API_KEY", label: "HeyGen", tier: "department", departments: ["marketing"], purpose: "Video avatar reels" },
  { env: "GEMINI_API_KEY", label: "Gemini", tier: "department", departments: ["marketing", "design"], purpose: "Imagen Imagen 3 · multimodal" },
  { env: "HIGGSFIELD_API_KEY", label: "Higgsfield", tier: "department", departments: ["marketing"], purpose: "Imágenes editoriales + clips IA (KEY:SECRET)" },
  { env: "META_ACCESS_TOKEN", label: "Meta Graph", tier: "department", departments: ["marketing"], purpose: "Publicar Instagram + métricas" },
  { env: "INSTAGRAM_BUSINESS_ACCOUNT_ID", label: "Instagram Business ID", tier: "department", departments: ["marketing"], purpose: "Publicación orgánica" },
  { env: "N8N_JARVIS_CALLBACK_URL", label: "n8n Webhook", tier: "critical", departments: ["all"], purpose: "Automatización departamentos" },
  { env: "N8N_MCP_ACCESS_TOKEN", label: "n8n MCP", tier: "department", departments: ["ia", "operations"], purpose: "Cursor · import workflows" },
  { env: "WINDMILL_API_TOKEN", label: "Windmill", tier: "department", departments: ["operations", "ia"], purpose: "Jobs programados · MCP" },
  { env: "RESEND_API_KEY", label: "Resend", tier: "department", departments: ["sales", "marketing"], purpose: "Email alertas y propuestas" },
  { env: "TELEGRAM_BOT_TOKEN", label: "Telegram", tier: "optional", departments: ["operations"], purpose: "Bridge móvil JARVIS" },
  { env: "CRON_SECRET", label: "Cron Secret", tier: "critical", departments: ["operations"], purpose: "Vercel cron autónomo" },
];

function isConfigured(env: string): boolean {
  const v = process.env[env]?.trim();
  if (!v) return false;
  if (env.includes("URL") && v.includes("XXX")) return false;
  return true;
}

export function auditRequiredKeys(): {
  ready: boolean;
  criticalMissing: string[];
  requirements: KeyRequirement[];
} {
  const requirements = REQUIREMENTS.map((r) => ({ ...r, configured: isConfigured(r.env) }));
  const criticalMissing = requirements.filter((r) => r.tier === "critical" && !r.configured).map((r) => r.env);
  const providers = getProviderCapabilities();
  const providerOk = providers.filter((p) => p.configured).length;

  return {
    ready: criticalMissing.length === 0 && providerOk >= 3,
    criticalMissing,
    requirements,
  };
}
