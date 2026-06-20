/**
 * JARVIS data layer — live Airtable + finance; mock solo para UI no conectada
 */
import {
  getJarvisCrmSnapshot,
  getJarvisFinanceSnapshot,
  mapStageToPipeline,
  type ClienteRow,
  type LiveLeadRow,
} from "../airtable";
import type {
  ClientOverview,
  DataSource,
  FinanceSnapshot,
  IntelligenceBrief,
  JarvisData,
  KpiMetric,
  PipelineFunnelStage,
  PipelineLead,
  SystemConnection,
} from "./types";
import { mockJarvisData } from "./mock-data";

export { mockJarvisData } from "./mock-data";
export * from "./types";
export * from "./config";

const STAGE_LABELS: Record<PipelineLead["stage"], string> = {
  nuevo: "Nuevo",
  cualificado: "Cualificado",
  propuesta: "Propuesta",
  negociación: "Negociación",
  cerrado: "Cerrado",
};

const ECO_CAPACITY = 5;
const EMPTY = "—";

function fmtUsd(n: number): string {
  if (n <= 0) return EMPTY;
  if (n >= 1000) return `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return `$${n.toLocaleString("en-US")}`;
}

function fmtPct(n: number, total: number): string {
  if (total <= 0 || n <= 0) return EMPTY;
  return `${Math.round((n / total) * 100)}%`;
}

function mapLiveLead(row: LiveLeadRow): PipelineLead {
  return {
    id: row.id,
    name: row.name,
    company: row.company,
    sector: "—",
    stage: mapStageToPipeline(row.stage),
    score: row.score > 0 ? row.score : 5,
    valueUsd: row.valueUsd,
    owner: "HERMES",
    lastContact: new Date().toISOString().slice(0, 10),
  };
}

function mapLiveClient(row: ClienteRow, index: number): ClientOverview {
  return {
    id: `live-${index}`,
    name: row.empresa,
    tier: "Pro",
    sector: row.servicio,
    mrr: 0,
    health: "green",
    agentLead: "ATLAS",
    since: "—",
  };
}

function buildPipelineFunnel(leads: PipelineLead[]): PipelineFunnelStage[] {
  return (Object.keys(STAGE_LABELS) as PipelineLead["stage"][]).map((stage) => {
    const matching = leads.filter((l) => l.stage === stage);
    return {
      stage: STAGE_LABELS[stage],
      count: matching.length,
      valueUsd: matching.reduce((sum, l) => sum + l.valueUsd, 0),
    };
  });
}

function buildLiveKpis(
  leadsTotal: number,
  clientsActive: number,
  finance: Awaited<ReturnType<typeof getJarvisFinanceSnapshot>>,
  hasToken: boolean,
): KpiMetric[] {
  const conversion = fmtPct(clientsActive, leadsTotal);
  const capacityPct = clientsActive > 0 ? `${Math.round((clientsActive / ECO_CAPACITY) * 100)}%` : EMPTY;

  return [
    {
      id: "revenue-ytd",
      label: "Revenue YTD",
      value: finance ? fmtUsd(finance.revenueYtd) : EMPTY,
      caption: finance?.dealsWon
        ? `${finance.dealsWon} cierre(s) registrados`
        : "Registra deals cerrados en CRM",
    },
    {
      id: "pipeline",
      label: "Pipeline ponderado",
      value: finance ? fmtUsd(finance.pipelineWeighted) : EMPTY,
      caption: finance?.pipelineTotal
        ? `$${finance.pipelineTotal.toLocaleString("en-US")} estimado`
        : "Asigna valor a leads en pipeline",
    },
    {
      id: "leads-week",
      label: "Leads CRM",
      value: leadsTotal > 0 ? String(leadsTotal) : EMPTY,
      caption: leadsTotal > 0 ? "En base de ventas" : hasToken ? "Sin leads registrados" : "CRM pendiente de conectar",
    },
    {
      id: "clients",
      label: "Clientes activos",
      value: clientsActive > 0 ? String(clientsActive) : EMPTY,
      caption: clientsActive > 0 ? "Operación activa" : "Sin clientes activos",
    },
    {
      id: "conversion-rate",
      label: "Conversión lead→cliente",
      value: conversion,
      caption: leadsTotal > 0 ? `${clientsActive} de ${leadsTotal} convertidos` : "Sin datos de conversión",
    },
    {
      id: "deals-total",
      label: "Deals en CRM",
      value: finance?.dealsCount ? String(finance.dealsCount) : EMPTY,
      caption: finance?.avgDealUsd ? `Ticket prom. ${fmtUsd(finance.avgDealUsd)}` : "Sin deals registrados",
    },
    {
      id: "run-rate",
      label: "Run rate mensual",
      value: finance?.runRateMonthly ? fmtUsd(finance.runRateMonthly) : EMPTY,
      caption: finance ? `Meta ${fmtUsd(finance.runRateNeeded)}/mes` : "Calculado desde CRM",
    },
    {
      id: "capacity",
      label: "Capacidad Eco",
      value: capacityPct,
      caption: clientsActive > 0 ? `${clientsActive}/${ECO_CAPACITY} clientes` : "Tier Eco · máx. 5",
    },
    {
      id: "roas",
      label: "ROAS Meta Ads",
      value: EMPTY,
      caption: "Conectar cuenta de anuncios",
    },
    {
      id: "engagement-ig",
      label: "Engagement IG",
      value: EMPTY,
      caption: "Conectar Instagram Business",
    },
  ];
}

function weekNumber(): number {
  return Math.ceil((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 604800000);
}

function buildLiveIntelligence(
  leads: number,
  clients: number,
  finance: Awaited<ReturnType<typeof getJarvisFinanceSnapshot>>,
): IntelligenceBrief {
  const pipelineStr = finance?.pipelineWeighted ? fmtUsd(finance.pipelineWeighted) : "sin valorar aún";
  const ytdStr = finance?.revenueYtd ? fmtUsd(finance.revenueYtd) : "pendiente";
  const conversion = fmtPct(clients, leads);
  const capacityPct = clients > 0 ? Math.round((clients / ECO_CAPACITY) * 100) : 0;

  let headline = "Operación en rampa · pipeline por activar";
  if (leads > 0 && clients > 0) {
    headline = `${leads} leads en seguimiento · ${clients} cliente(s) activo(s)`;
  } else if (leads > 0) {
    headline = `${leads} leads en CRM · sin clientes activos aún`;
  }

  const summary =
    clients > 0
      ? `Capacidad operativa al ${capacityPct}%. Revenue acumulado ${ytdStr} con pipeline ponderado ${pipelineStr}. Prioridad: convertir leads calificados y sostener entrega a clientes activos.`
      : `Hay ${leads} prospecto(s) en seguimiento. Revenue YTD ${ytdStr} · pipeline ${pipelineStr}. Prioridad: cualificar leads y cerrar el primer cliente del trimestre.`;

  return {
    headline,
    summary,
    insights: [
      leads > 0
        ? `${leads} prospectos en pipeline — HERMES debe priorizar score ≥7 esta semana.`
        : "Sin leads en CRM — activar prospección con ARES.",
      clients > 0
        ? `${clients} cliente(s) activo(s) · margen de capacidad Eco ${ECO_CAPACITY - clients} slot(s).`
        : "Sin clientes activos — enfocar cierre de propuestas pendientes.",
    ],
    risks: [
      capacityPct >= 80
        ? `Capacidad Eco al ${capacityPct}% — evaluar upgrade a tier Pro antes de nuevo cliente.`
        : finance && finance.pipelineWeighted <= 0
          ? "Pipeline sin valorar — forecast financiero incompleto."
          : "Run rate por debajo de meta si no se cierran deals en 30 días.",
    ],
    opportunities: [
      conversion !== EMPTY
        ? `Conversión actual ${conversion} — optimizar follow-up en etapa propuesta.`
        : "Primer cierre del mes desbloquea métricas de conversión.",
      finance && finance.runRateNeeded > 0
        ? `Run rate objetivo ${fmtUsd(finance.runRateNeeded)}/mes hacia meta anual.`
        : "Completar valores en leads para proyectar run rate.",
    ],
    generatedAt: new Date().toISOString(),
    agent: "ZEUS",
    weekNumber: weekNumber(),
  };
}

function resolveSystemConnections(
  hasToken: boolean,
  hasLiveCrm: boolean,
  hasMetaEnv: boolean,
): SystemConnection[] {
  return [
    { id: "anthropic", name: "Anthropic API", status: "online", uptime: 100, phase: 1 },
    {
      id: "airtable",
      name: "Airtable CRM",
      status: hasLiveCrm ? "online" : hasToken ? "degraded" : "pending",
      uptime: hasLiveCrm ? 100 : 0,
      phase: 2,
    },
    { id: "vercel", name: "Vercel · zenkaibrain", status: "online", uptime: 100, phase: 1 },
    { id: "n8n", name: "n8n Cloud", status: "pending", uptime: 0, phase: 3 },
    { id: "whatsapp", name: "WhatsApp Cloud", status: "pending", uptime: 0, phase: 4 },
    {
      id: "meta",
      name: "Meta · Instagram Ads",
      status: hasMetaEnv ? "degraded" : "pending",
      uptime: 0,
      phase: 6,
    },
  ];
}

function mergeFinance(
  base: FinanceSnapshot,
  live: Awaited<ReturnType<typeof getJarvisFinanceSnapshot>>,
): FinanceSnapshot {
  if (!live) return base;
  return {
    ...base,
    revenueYtd: live.revenueYtd,
    revenueMonth: live.revenueMonth,
    pipelineWeighted: live.pipelineWeighted,
    goal2026: live.goal2026,
    runRateMonthly: live.runRateMonthly,
    runRateNeeded: live.runRateNeeded,
  };
}

export async function getJarvisData(): Promise<JarvisData> {
  const base = mockJarvisData;
  const hasToken = Boolean(import.meta.env.AIRTABLE_TOKEN);
  const hasMetaEnv = Boolean(
    import.meta.env.META_ACCESS_TOKEN ||
      import.meta.env.INSTAGRAM_BUSINESS_ACCOUNT_ID ||
      import.meta.env.META_AD_ACCOUNT_ID,
  );
  const [crm, finance] = await Promise.all([
    getJarvisCrmSnapshot(),
    getJarvisFinanceSnapshot(),
  ]);

  const livePipelineLeads = crm?.leads.map(mapLiveLead) ?? [];
  const liveClients = crm?.clientes.map(mapLiveClient) ?? [];
  const liveLeadCount = crm?.leadsTotal ?? livePipelineLeads.length;
  const liveClientCount = crm?.clientesActivos ?? liveClients.length;

  const hasLiveCrm = liveLeadCount > 0 || liveClientCount > 0;
  const hasLiveFinance = Boolean(finance && (finance.revenueYtd > 0 || finance.pipelineWeighted > 0 || finance.dealsCount > 0));
  const dataSource: DataSource = hasLiveCrm || hasLiveFinance ? "live" : "mock";

  const pipelineLeads = hasLiveCrm ? livePipelineLeads : base.pipelineLeads;
  const clients = hasLiveCrm ? liveClients : base.clients;

  const kpis =
    hasToken || hasLiveCrm || hasLiveFinance
      ? buildLiveKpis(liveLeadCount, liveClientCount, finance, hasToken)
      : base.kpis;

  const alerts =
    dataSource === "live"
      ? [
          {
            id: "live-crm",
            level: "info" as const,
            message: `CRM conectado · ${liveLeadCount} lead(s) · ${liveClientCount} cliente(s) activos · Airtable`,
            action: "Ver pipeline",
          },
          ...(hasLiveFinance
            ? [
                {
                  id: "live-finance",
                  level: "info" as const,
                  message: `Finanzas · YTD ${fmtUsd(finance!.revenueYtd)} · Pipeline ${fmtUsd(finance!.pipelineWeighted)}`,
                  action: "Ver finanzas",
                },
              ]
            : []),
          ...base.alerts.filter((a) => !["live-crm", "live-finance"].includes(a.id)),
        ]
      : [
          {
            id: "mock-data",
            level: "important" as const,
            message: "Datos de demostración · Conecta AIRTABLE_TOKEN y Meta API en Vercel para métricas reales",
            action: "Ver sistemas",
          },
          ...base.alerts.filter((a) => a.id !== "mock-data"),
        ];

  const greeting = base.greeting;
  const dateLabel =
    new Date().toLocaleDateString("es-CO", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }) + ` · Semana ${weekNumber()}`;

  const intelligence =
    dataSource === "live"
      ? buildLiveIntelligence(liveLeadCount, liveClientCount, finance)
      : base.intelligence;

  const systemConnections =
    dataSource === "live"
      ? resolveSystemConnections(hasToken, hasLiveCrm, hasMetaEnv)
      : base.systemConnections;

  return {
    ...base,
    greeting,
    dateLabel,
    kpis,
    pipelineLeads,
    pipelineFunnel: hasLiveCrm ? buildPipelineFunnel(pipelineLeads) : base.pipelineFunnel,
    clients,
    alerts,
    intelligence,
    systemConnections,
    finance: mergeFinance(base.finance, finance),
    meta: {
      dataSource,
      liveRecords: {
        leads: liveLeadCount,
        clients: liveClientCount,
      },
      financeConnected: hasLiveFinance,
      socialConnected: hasMetaEnv,
    },
  };
}
