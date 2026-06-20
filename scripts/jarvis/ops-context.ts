/**
 * Contexto operativo agregado para el cerebro JARVIS (CRM + finanzas + social).
 */
import { getJarvisCrmSnapshot } from "../airtable/jarvis-crm.js";
import { getJarvisFinanceSnapshot } from "../airtable/jarvis-finance.js";
import { getJarvisSocialSnapshot } from "../meta/jarvis-social.js";

export type JarvisOpsBundle = {
  crm: Awaited<ReturnType<typeof getJarvisCrmSnapshot>> | null;
  finance: Awaited<ReturnType<typeof getJarvisFinanceSnapshot>> | null;
  social: Awaited<ReturnType<typeof getJarvisSocialSnapshot>> | null;
  live: boolean;
};

export async function fetchJarvisOps(): Promise<JarvisOpsBundle> {
  const [crm, finance, social] = await Promise.all([
    getJarvisCrmSnapshot(process.env.AIRTABLE_TOKEN).catch(() => null),
    getJarvisFinanceSnapshot(process.env.AIRTABLE_TOKEN).catch(() => null),
    getJarvisSocialSnapshot().catch(() => null),
  ]);

  const live =
    crm?.source === "live" || finance?.source === "live" || social?.source === "live";

  return { crm, finance, social, live };
}

export function formatJarvisOpsContext(ops: JarvisOpsBundle): string {
  const now = new Date().toLocaleString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  const lines: string[] = [`[CONTEXTO OPERATIVO · ${now}${ops.live ? " · LIVE" : " · DEMO/MOCK"}]`];

  if (ops.crm) {
    lines.push(
      `CRM: ${ops.crm.leads.length} leads · ${ops.crm.clientesActivos} clientes activos · ${ops.crm.dealsTotal} deals`,
    );
    const top = ops.crm.leads
      .slice(0, 4)
      .map((l) => `${l.name} (${l.company}) ${l.stage} score${l.score}`)
      .join("; ");
    if (top) lines.push(`Top leads: ${top}`);
  }

  if (ops.finance) {
    lines.push(
      `Finanzas: YTD $${Math.round(ops.finance.revenueYtd).toLocaleString("en-US")} · pipeline ponderado $${Math.round(ops.finance.pipelineWeighted).toLocaleString("en-US")} · meta 2026 $${ops.finance.goal2026.toLocaleString("en-US")} · run rate $${Math.round(ops.finance.runRateMonthly).toLocaleString("en-US")}/mes`,
    );
  }

  if (ops.social?.instagram) {
    lines.push(
      `Instagram: ${ops.social.instagram.followers} seguidores · reach 7d ${ops.social.instagram.reach7d} · engagement ${ops.social.instagram.engagementRate}%`,
    );
  }
  if (ops.social?.metaAds) {
    lines.push(
      `Meta Ads 7d: spend $${Math.round(ops.social.metaAds.spend7d)} · ROAS ${ops.social.metaAds.roas.toFixed(1)}x`,
    );
  }

  if (!ops.crm && !ops.finance && !ops.social) {
    lines.push("Sin datos live — configurar AIRTABLE_TOKEN y META_ACCESS_TOKEN en Vercel.");
  }

  return lines.join("\n");
}

export function getBrainCapabilities() {
  const deepseek = !!process.env.DEEPSEEK_API_KEY?.trim();
  const anthropic = !!process.env.ANTHROPIC_API_KEY?.trim();
  const airtable = !!process.env.AIRTABLE_TOKEN?.trim();
  const n8n = !!(
    process.env.N8N_WEBHOOK_URL?.trim() || process.env.N8N_JARVIS_CALLBACK_URL?.trim()
  );
  const elevenlabs = !!process.env.ELEVENLABS_API_KEY?.trim();
  const meta = !!(
    process.env.META_ACCESS_TOKEN ||
    process.env.WHATSAPP_ACCESS_TOKEN ||
    process.env.META_SYSTEM_USER_TOKEN
  );

  const explicit = (process.env.JARVIS_LLM_PROVIDER || process.env.LLM_PROVIDER || "").toLowerCase();
  const brainOff = explicit === "off" || explicit === "local" || explicit === "clasificar";
  const brain = !brainOff && (deepseek || anthropic);

  return {
    brain,
    deepseek,
    anthropic,
    brainProvider: deepseek ? "deepseek" : anthropic ? "anthropic" : null,
    airtable,
    n8n,
    elevenlabs,
    meta,
    model: process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat",
  };
}
