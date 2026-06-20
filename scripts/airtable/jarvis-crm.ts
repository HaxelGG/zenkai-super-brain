/**
 * CRM snapshot para JARVIS · runtime (Vercel) y scripts.
 * Misma base que panel/src/lib/airtable.ts · IDs públicos.
 */

const BASE_CRM = "appmiicsbFsvRfxQ9";
const T_CLIENTES = "tblIG0hH6Q3DRej2m";
const T_LEADS = "tbl7LgDi32RnZ3eUH";
const T_DEALS = "tblDlyb9W6FxDIWve";

export type ClienteRow = {
  empresa: string;
  servicio: string;
  estado: string;
};

export type LiveLeadRow = {
  id: string;
  name: string;
  company: string;
  stage: string;
  score: number;
  valueUsd: number;
};

export type PipelineStage =
  | "nuevo"
  | "cualificado"
  | "propuesta"
  | "negociación"
  | "cerrado";

export type JarvisCrmSnapshot = {
  source: "live" | "mock";
  fetchedAt: string;
  clientesActivos: number;
  clientes: ClienteRow[];
  leadsTotal: number;
  dealsTotal: number;
  leads: LiveLeadRow[];
  pipelineFunnel: { stage: string; count: number; valueUsd: number }[];
};

type AirtableRecord = { id: string; fields: Record<string, unknown> };

const STAGE_LABELS: Record<PipelineStage, string> = {
  nuevo: "Nuevo",
  cualificado: "Cualificado",
  propuesta: "Propuesta",
  negociación: "Negociación",
  cerrado: "Cerrado",
};

function fieldStr(fields: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = fields[k];
    if (v !== undefined && v !== null && String(v).trim()) return String(v);
  }
  return "—";
}

function fieldNum(fields: Record<string, unknown>, ...keys: string[]): number {
  for (const k of keys) {
    const v = fields[k];
    if (typeof v === "number") return v;
    if (typeof v === "string" && !isNaN(Number(v))) return Number(v);
  }
  return 0;
}

export function mapStageToPipeline(stage: string): PipelineStage {
  const s = stage.toLowerCase();
  if (s.includes("cerrado") || s.includes("won")) return "cerrado";
  if (s.includes("negoci") || s.includes("negot")) return "negociación";
  if (s.includes("propuesta") || s.includes("proposal")) return "propuesta";
  if (s.includes("cualif") || s.includes("qualif") || s.includes("llamada")) return "cualificado";
  return "nuevo";
}

async function fetchAll(token: string, table: string): Promise<AirtableRecord[]> {
  const out: AirtableRecord[] = [];
  let offset: string | undefined;
  do {
    const url = new URL(`https://api.airtable.com/v0/${BASE_CRM}/${table}`);
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Airtable ${table} → HTTP ${res.status}`);
    const json = (await res.json()) as {
      records: AirtableRecord[];
      offset?: string;
    };
    out.push(...json.records);
    offset = json.offset;
  } while (offset);
  return out;
}

function mapLead(r: AirtableRecord): LiveLeadRow {
  const f = r.fields;
  return {
    id: r.id,
    name: fieldStr(f, "Nombre", "nombre", "Name", "Contacto"),
    company: fieldStr(f, "Empresa", "empresa", "Company"),
    stage: fieldStr(f, "Etapa", "etapa", "Stage", "Estado", "estado"),
    score: fieldNum(f, "Score", "score", "Rating"),
    valueUsd: fieldNum(f, "valor_estimado_USD", "Valor USD", "Valor", "valor", "Value"),
  };
}

function buildPipelineFunnel(leads: LiveLeadRow[]) {
  return (Object.keys(STAGE_LABELS) as PipelineStage[]).map((stage) => {
    const matching = leads.filter((l) => mapStageToPipeline(l.stage) === stage);
    return {
      stage: STAGE_LABELS[stage],
      count: matching.length,
      valueUsd: matching.reduce((sum, l) => sum + (l.valueUsd || 0), 0),
    };
  });
}

export async function getJarvisCrmSnapshot(token?: string): Promise<JarvisCrmSnapshot> {
  const fetchedAt = new Date().toISOString();
  if (!token) {
    return {
      source: "mock",
      fetchedAt,
      clientesActivos: 0,
      clientes: [],
      leadsTotal: 0,
      dealsTotal: 0,
      leads: [],
      pipelineFunnel: buildPipelineFunnel([]),
    };
  }

  const [clientesRec, leadsRec, dealsRec] = await Promise.all([
    fetchAll(token, T_CLIENTES),
    fetchAll(token, T_LEADS),
    fetchAll(token, T_DEALS),
  ]);

  const clientes: ClienteRow[] = clientesRec.map((r) => ({
    empresa: String(r.fields["Empresa"] ?? "—"),
    servicio: String(r.fields["Servicio"] ?? "—"),
    estado: String(r.fields["Estado"] ?? "—"),
  }));
  const activos = clientes
    .filter((c) => c.estado === "Activo")
    .sort((a, b) => a.empresa.localeCompare(b.empresa, "es"));

  const leads = leadsRec.map(mapLead);

  return {
    source: leads.length > 0 || activos.length > 0 ? "live" : "mock",
    fetchedAt,
    clientesActivos: activos.length,
    clientes: activos,
    leadsTotal: leadsRec.length,
    dealsTotal: dealsRec.length,
    leads,
    pipelineFunnel: buildPipelineFunnel(leads),
  };
}
