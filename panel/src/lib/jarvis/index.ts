/**
 * JARVIS data layer — mock + live Airtable merge (build-time)
 */
import {
  getJarvisCrmSnapshot,
  mapStageToPipeline,
  type ClienteRow,
  type LiveLeadRow,
} from "../airtable";
import type {
  ClientOverview,
  DataSource,
  JarvisData,
  KpiMetric,
  PipelineFunnelStage,
  PipelineLead,
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

function mapLiveLead(row: LiveLeadRow): PipelineLead {
  return {
    id: row.id,
    name: row.name,
    company: row.company,
    sector: "—",
    stage: mapStageToPipeline(row.stage),
    score: row.score > 0 ? row.score : 5,
    valueUsd: 0,
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

function mergePipelineLeads(live: PipelineLead[], mock: PipelineLead[]): PipelineLead[] {
  if (live.length === 0) return mock;
  const seen = new Set(live.map((l) => l.id));
  const extras = mock.filter((l) => !seen.has(l.id));
  return [...live, ...extras].slice(0, 12);
}

function mergeClients(live: ClientOverview[], mock: ClientOverview[]): ClientOverview[] {
  if (live.length === 0) return mock;
  const seen = new Set(live.map((c) => c.name.toLowerCase()));
  const extras = mock.filter((c) => !seen.has(c.name.toLowerCase()));
  return [...live, ...extras].slice(0, 8);
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

function patchKpis(base: KpiMetric[], liveLeads: number, liveClients: number): KpiMetric[] {
  return base.map((kpi) => {
    if (kpi.id === "clients" && liveClients > 0) {
      return {
        ...kpi,
        value: String(liveClients),
        caption: `${liveClients} desde Airtable CRM`,
      };
    }
    if (kpi.id === "leads-week" && liveLeads > 0) {
      return {
        ...kpi,
        value: String(liveLeads),
        caption: `${liveLeads} leads en CRM`,
      };
    }
    return kpi;
  });
}

export async function getJarvisData(): Promise<JarvisData> {
  const base = mockJarvisData;
  const crm = await getJarvisCrmSnapshot();

  const livePipelineLeads = crm?.leads.map(mapLiveLead) ?? [];
  const liveClients = crm?.clientes.map(mapLiveClient) ?? [];

  const pipelineLeads = mergePipelineLeads(livePipelineLeads, base.pipelineLeads);
  const clients = mergeClients(liveClients, base.clients);

  const liveLeadCount = livePipelineLeads.length;
  const liveClientCount = liveClients.length;
  const dataSource: DataSource =
    liveLeadCount > 0 || liveClientCount > 0 ? "live" : "mock";

  const pipelineWeighted =
    pipelineLeads.reduce((sum, l) => {
      const weight =
        l.stage === "cerrado"
          ? 1
          : l.stage === "negociación"
            ? 0.75
            : l.stage === "propuesta"
              ? 0.5
              : l.stage === "cualificado"
                ? 0.25
                : 0.1;
      return sum + l.valueUsd * weight;
    }, 0) || base.finance.pipelineWeighted;

  const alerts =
    dataSource === "live"
      ? [
          {
            id: "live-crm",
            level: "info" as const,
            message: `CRM conectado · ${liveLeadCount} lead(s) · ${liveClientCount} cliente(s) activos desde Airtable`,
            action: "Ver pipeline",
          },
          ...base.alerts.filter((a) => a.id !== "live-crm"),
        ]
      : base.alerts;

  return {
    ...base,
    kpis: patchKpis(base.kpis, liveLeadCount, liveClientCount),
    pipelineLeads,
    pipelineFunnel:
      liveLeadCount > 0 ? buildPipelineFunnel(pipelineLeads) : base.pipelineFunnel,
    clients,
    alerts,
    finance: {
      ...base.finance,
      pipelineWeighted,
    },
    meta: {
      dataSource,
      liveRecords: {
        leads: liveLeadCount,
        clients: liveClientCount,
      },
    },
  };
}
