// Integración Airtable → panel · fetch en build-time (se refresca en cada deploy).
//
// Degradación elegante: si no hay AIRTABLE_TOKEN, getPanelStats() devuelve null
// y las páginas muestran el placeholder "🔌 conecta Airtable" como hasta ahora.
// El build NUNCA falla por esto — la conexión se "activa" sola al añadir el token
// como variable de entorno en el proyecto Vercel `zenkaibrain`.

// Base "ZENKAI — CRM Ventas" — IDs públicos (no son secretos; el token sí lo es).
const BASE_CRM = "appmiicsbFsvRfxQ9";
const T_CLIENTES = "tblIG0hH6Q3DRej2m";
const T_LEADS = "tbl7LgDi32RnZ3eUH";
const T_DEALS = "tblDlyb9W6FxDIWve";

const TOKEN = import.meta.env.AIRTABLE_TOKEN;

export type ClienteRow = {
  empresa: string;
  servicio: string;
  estado: string;
};

export type PanelStats = {
  clientesActivos: number;
  clientes: ClienteRow[];
  leadsTotal: number;
  dealsTotal: number;
};

export type LiveLeadRow = {
  id: string;
  name: string;
  company: string;
  stage: string;
  score: number;
  valueUsd: number;
};

export type JarvisFinanceSnapshot = {
  revenueYtd: number;
  revenueMonth: number;
  pipelineWeighted: number;
  pipelineTotal: number;
  dealsCount: number;
  dealsWon: number;
  avgDealUsd: number;
  goal2026: number;
  runRateMonthly: number;
  runRateNeeded: number;
};

export type JarvisCrmSnapshot = PanelStats & {
  leads: LiveLeadRow[];
};

type AirtableRecord = { id: string; fields: Record<string, unknown> };

async function fetchAll(table: string): Promise<AirtableRecord[]> {
  const out: AirtableRecord[] = [];
  let offset: string | undefined;
  do {
    const url = new URL(`https://api.airtable.com/v0/${BASE_CRM}/${table}`);
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${TOKEN}` },
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

function stageWeight(stage: string): number {
  const s = stage.toLowerCase();
  if (s.includes("cerrado") || s.includes("won")) return 1;
  if (s.includes("negoci")) return 0.75;
  if (s.includes("propuesta")) return 0.5;
  if (s.includes("cualif") || s.includes("llamada")) return 0.25;
  return 0.1;
}

function dealValue(fields: Record<string, unknown>): number {
  return fieldNum(
    fields,
    "Valor USD",
    "valor_USD",
    "valor_estimado_USD",
    "MRR",
    "mrr",
    "Amount",
    "Valor",
    "valor",
    "Value",
  );
}

function isWonDeal(fields: Record<string, unknown>): boolean {
  const status = fieldStr(fields, "Estado", "estado", "Status", "status", "Stage", "Etapa").toLowerCase();
  return status.includes("won") || status.includes("cerrado") || status.includes("ganado") || status.includes("closed");
}

function mapStageToPipeline(stage: string): "nuevo" | "cualificado" | "propuesta" | "negociación" | "cerrado" {
  const s = stage.toLowerCase();
  if (s.includes("cerrado") || s.includes("won")) return "cerrado";
  if (s.includes("negoci") || s.includes("negot")) return "negociación";
  if (s.includes("propuesta") || s.includes("proposal")) return "propuesta";
  if (s.includes("cualif") || s.includes("qualif") || s.includes("llamada")) return "cualificado";
  return "nuevo";
}

/**
 * Lee la base CRM Ventas en build-time.
 * Devuelve null si no hay token o si la API falla (el panel degrada al placeholder).
 */
export async function getPanelStats(): Promise<PanelStats | null> {
  if (!TOKEN) return null;
  try {
    const [clientesRec, leadsRec, dealsRec] = await Promise.all([
      fetchAll(T_CLIENTES),
      fetchAll(T_LEADS),
      fetchAll(T_DEALS),
    ]);

    const clientes: ClienteRow[] = clientesRec.map((r) => ({
      empresa: String(r.fields["Empresa"] ?? "—"),
      servicio: String(r.fields["Servicio"] ?? "—"),
      estado: String(r.fields["Estado"] ?? "—"),
    }));
    const activos = clientes
      .filter((c) => c.estado === "Activo")
      .sort((a, b) => a.empresa.localeCompare(b.empresa, "es"));

    return {
      clientesActivos: activos.length,
      clientes: activos,
      leadsTotal: leadsRec.length,
      dealsTotal: dealsRec.length,
    };
  } catch (e) {
    console.warn("[panel] Airtable fetch falló — se usa el placeholder:", e);
    return null;
  }
}

/**
 * CRM snapshot enriquecido para JARVIS (build-time).
 */
export async function getJarvisCrmSnapshot(): Promise<JarvisCrmSnapshot | null> {
  if (!TOKEN) return null;
  try {
    const [clientesRec, leadsRec, dealsRec] = await Promise.all([
      fetchAll(T_CLIENTES),
      fetchAll(T_LEADS),
      fetchAll(T_DEALS),
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
      clientesActivos: activos.length,
      clientes: activos,
      leadsTotal: leadsRec.length,
      dealsTotal: dealsRec.length,
      leads,
    };
  } catch (e) {
    console.warn("[jarvis] Airtable CRM snapshot falló — mock data:", e);
    return null;
  }
}

export { mapStageToPipeline };

/**
 * Finanzas desde CRM Airtable (build-time).
 */
export async function getJarvisFinanceSnapshot(): Promise<JarvisFinanceSnapshot | null> {
  if (!TOKEN) return null;
  try {
    const [leadsRec, dealsRec] = await Promise.all([
      fetchAll(T_LEADS),
      fetchAll(T_DEALS),
    ]);

    const goal2026 = 100_000;
    const now = new Date();
    const monthsLeft = Math.max(1, 12 - now.getMonth());

    let pipelineTotal = 0;
    let pipelineWeighted = 0;
    for (const r of leadsRec) {
      const val = fieldNum(r.fields, "valor_estimado_USD", "Valor USD", "Valor", "valor", "Value");
      const stage = fieldStr(r.fields, "Etapa", "etapa", "Stage", "Estado");
      pipelineTotal += val;
      pipelineWeighted += val * stageWeight(stage);
    }

    let revenueYtd = 0;
    let revenueMonth = 0;
    let dealsWon = 0;
    const wonValues: number[] = [];
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    for (const r of dealsRec) {
      const val = dealValue(r.fields);
      if (!isWonDeal(r.fields)) continue;
      dealsWon += 1;
      wonValues.push(val);
      revenueYtd += val;
      const dateStr = fieldStr(r.fields, "Fecha cierre", "fecha_cierre", "Closed Date", "Fecha", "fecha");
      if (dateStr) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime()) && d >= monthStart) revenueMonth += val;
      }
    }

    const avgDealUsd = wonValues.length
      ? Math.round(wonValues.reduce((a, b) => a + b, 0) / wonValues.length)
      : 0;
    const runRateMonthly =
      revenueYtd > 0 ? Math.round((revenueYtd / (now.getMonth() + 1)) * 100) / 100 : 0;
    const runRateNeeded = Math.max(0, Math.round(((goal2026 - revenueYtd) / monthsLeft) * 100) / 100);

    return {
      revenueYtd: Math.round(revenueYtd),
      revenueMonth: Math.round(revenueMonth),
      pipelineWeighted: Math.round(pipelineWeighted),
      pipelineTotal: Math.round(pipelineTotal),
      dealsCount: dealsRec.length,
      dealsWon,
      avgDealUsd,
      goal2026,
      runRateMonthly,
      runRateNeeded,
    };
  } catch (e) {
    console.warn("[jarvis] Finance snapshot falló:", e);
    return null;
  }
}
