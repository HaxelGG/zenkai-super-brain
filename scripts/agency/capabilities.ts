/**
 * Capacidades de proveedores externos (env-gated).
 */
export type ProviderStatus = {
  id: string;
  label: string;
  configured: boolean;
  role: string;
};

export function getProviderCapabilities(): ProviderStatus[] {
  return [
    {
      id: "deepseek",
      label: "DeepSeek",
      configured: !!process.env.DEEPSEEK_API_KEY?.trim(),
      role: "LLM ejecución volumen / cerebro",
    },
    {
      id: "anthropic",
      label: "Anthropic Claude",
      configured: !!process.env.ANTHROPIC_API_KEY?.trim(),
      role: "LLM Sonnet · Haiku · Opus (ZEUS)",
    },
    {
      id: "elevenlabs",
      label: "ElevenLabs",
      configured: !!process.env.ELEVENLABS_API_KEY?.trim(),
      role: "TTS · voz JARVIS · audio contenido",
    },
    {
      id: "heygen",
      label: "HeyGen",
      configured: !!process.env.HEYGEN_API_KEY?.trim(),
      role: "Video avatar · reels · UGC",
    },
    {
      id: "higgsfield",
      label: "Higgsfield",
      configured: !!process.env.HIGGSFIELD_API_KEY?.trim(),
      role: "Video IA · efectos · clips cortos",
    },
    {
      id: "n8n",
      label: "n8n Cloud",
      configured: !!(
        process.env.N8N_WEBHOOK_URL?.trim() || process.env.N8N_JARVIS_CALLBACK_URL?.trim()
      ),
      role: "Automatización · webhooks · departamentos",
    },
    {
      id: "windmill",
      label: "Windmill",
      configured: !!process.env.WINDMILL_API_TOKEN?.trim(),
      role: "Scripts ops · MCP · jobs durables",
    },
    {
      id: "airtable",
      label: "Airtable",
      configured: !!process.env.AIRTABLE_TOKEN?.trim(),
      role: "CRM · tasks · goals · verdad única",
    },
    {
      id: "meta",
      label: "Meta Graph",
      configured: !!(
        process.env.META_ACCESS_TOKEN ||
        process.env.WHATSAPP_ACCESS_TOKEN ||
        process.env.META_SYSTEM_USER_TOKEN
      ),
      role: "Instagram · Ads · publicación",
    },
    {
      id: "resend",
      label: "Resend",
      configured: !!process.env.RESEND_API_KEY?.trim(),
      role: "Email transaccional · alertas",
    },
    {
      id: "cursor",
      label: "Cursor / Claude Code",
      configured: true,
      role: "Dev agentic · FORGE · builds locales",
    },
  ];
}

export function getMcpManifest() {
  return [
    { server: "n8n-mcp", departments: ["marketing", "sales", "operations", "ia"], env: "N8N_MCP_ACCESS_TOKEN" },
    { server: "windmill", departments: ["operations", "ia"], env: "WINDMILL_API_TOKEN" },
    { server: "elevenlabs", departments: ["marketing"], env: "ELEVENLABS_API_KEY" },
    { server: "heygen", departments: ["marketing"], env: "HEYGEN_API_KEY" },
    { server: "vercel", departments: ["ia"], env: "VERCEL_TOKEN" },
    { server: "gitlab", departments: ["ia"], env: "GITLAB_TOKEN" },
    { server: "linear", departments: ["operations"], env: "LINEAR_API_KEY" },
    { server: "supabase", departments: ["ia"], env: "SUPABASE_ACCESS_TOKEN" },
  ];
}
