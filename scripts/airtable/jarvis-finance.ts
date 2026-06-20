/**
 * Finanzas JARVIS · agrega deals + leads desde CRM Airtable.
 * Sin token → snapshot vacío (UI muestra placeholder, no inventa cifras).
 */

const BASE_CRM = "appmiicsbFsvRfxQ9";
const T_LEADS = "tbl7LgDi32RnZ3eUH";
const T_DEALS = "tblDlyb9W6FxDIWve";

export type JarvisFinanceSnapshot = {
  source: "live" | "mock";
  fetchedAt: string;
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

type AirtableRecord = { id: string; fields: Record<string, unknown> };

function fieldNum(fields: Record<string, unknown>, ...keys: string[]): number {
  for (const k of keys) {
    const v = fields[k];
    if (typeof v === "number") return v;
    if (typeof v === "string" && !isNaN(Number(v))) return Number(v);
  }
  return 0;
}

function fieldStr(fields: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = fields[k];
    if (v !== undefined && v !== null && String(v).trim()) return String(v);
  }
  return "";
}

function isWonDeal(fields: Record<string, unknown>): boolean {
  const status = fieldStr(fields, "Estado", "estado", "Status", "status", "Stage", "Etapa").toLowerCase();
  return status.includes("won") || status.includes("cerrado") || status.includes("ganado") || status.includes("closed");
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

function leadValue(fields: Record<string, unknown>): number {
  return fieldNum(fields, "valor_estimado_USD", "Valor USD", "Valor", "valor", "Value");
}

function stageWeight(stage: string): number {
  const s = stage.toLowerCase();
  if (s.includes("cerrado") || s.includes("won")) return 1;
  if (s.includes("negoci")) return 0.75;
  if (s.includes("propuesta")) return 0.5;
  if (s.includes("cualif") || s.includes("llamada")) return 0.25;
  return 0.1;
}

async function fetchAll(token: string, table: string): Promise<AirtableRecord[]> {
  const out: AirtableRecord[] = [];
  let offset: string | undefined;
  do {
    const url = new URL(`https://api.airtable.com/v0/${BASE_CRM}/${table}`);
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Airtable ${table} → HTTP ${res.status}`);
    const json = (await res.json()) as { records: AirtableRecord[]; offset?: string };
    out.push(...json.records);
    offset = json.offset;
  } while (offset);
  return out;
}

export async function getJarvisFinanceSnapshot(token?: string): Promise<JarvisFinanceSnapshot> {
  const fetchedAt = new Date().toISOString();
  const goal2026 = 100_000;
  const monthsLeft = Math.max(1, 12 - new Date().getMonth());
  const empty: JarvisFinanceSnapshot = {
    source: "mock",
    fetchedAt,
    revenueYtd: 0,
    revenueMonth: 0,
    pipelineWeighted: 0,
    pipelineTotal: 0,
    dealsCount: 0,
    dealsWon: 0,
    avgDealUsd: 0,
    goal2026,
    runRateMonthly: 0,
    runRateNeeded: Math.round((goal2026 / monthsLeft) * 100) / 100,
  };

  if (!token) return empty;

  const [leadsRec, dealsRec] = await Promise.all([
    fetchAll(token, T_LEADS),
    fetchAll(token, T_DEALS),
  ]);

  let pipelineTotal = 0;
  let pipelineWeighted = 0;
  for (const r of leadsRec) {
    const val = leadValue(r.fields);
    const stage = fieldStr(r.fields, "Etapa", "etapa", "Stage", "Estado");
    pipelineTotal += val;
    pipelineWeighted += val * stageWeight(stage);
  }

  let revenueYtd = 0;
  let revenueMonth = 0;
  let dealsWon = 0;
  const wonValues: number[] = [];
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

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
    } else {
      revenueMonth += val / Math.max(1, dealsWon);
    }
  }

  if (revenueYtd === 0 && wonValues.length === 0) {
    revenueYtd = pipelineWeighted;
  }

  const avgDealUsd = wonValues.length ? Math.round(wonValues.reduce((a, b) => a + b, 0) / wonValues.length) : 0;
  const runRateMonthly = revenueYtd > 0 ? Math.round((revenueYtd / (now.getMonth() + 1)) * 100) / 100 : 0;
  const runRateNeeded = Math.round(((goal2026 - revenueYtd) / monthsLeft) * 100) / 100;

  const hasData = leadsRec.length > 0 || dealsRec.length > 0;

  return {
    source: hasData ? "live" : "mock",
    fetchedAt,
    revenueYtd: Math.round(revenueYtd),
    revenueMonth: Math.round(revenueMonth),
    pipelineWeighted: Math.round(pipelineWeighted),
    pipelineTotal: Math.round(pipelineTotal),
    dealsCount: dealsRec.length || leadsRec.length,
    dealsWon,
    avgDealUsd,
    goal2026,
    runRateMonthly,
    runRateNeeded: Math.max(0, runRateNeeded),
  };
}
