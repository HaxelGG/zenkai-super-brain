/**
 * ATLAS · Ops · goals y tasks (Airtable o memoria)
 */
import type { AgencyTask, AgentId, DepartmentId } from "../types.js";
import { getJarvisFinanceSnapshot, type JarvisFinanceSnapshot } from "../../airtable/jarvis-finance.js";
import { listCalendarAll } from "../calendar.js";

const BASE = process.env.AIRTABLE_BASE_VENTAS || "appmiicsbFsvRfxQ9";
const TABLE_TASKS = process.env.AIRTABLE_TABLE_TASKS || "Tasks";

type AirtableRecord = { id: string; fields: Record<string, unknown> };

async function airtableList(token: string, max = 20): Promise<AirtableRecord[]> {
  const url = `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(TABLE_TASKS)}?maxRecords=${max}&sort%5B0%5D%5Bfield%5D=priority&sort%5B0%5D%5Bdirection%5D=desc`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return [];
  const data = (await res.json()) as { records: AirtableRecord[] };
  return data.records || [];
}

async function airtableCreate(
  token: string,
  fields: Record<string, unknown>,
): Promise<AirtableRecord | null> {
  const res = await fetch(`https://api.airtable.com/v0/${BASE}/${encodeURIComponent(TABLE_TASKS)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) return null;
  return (await res.json()) as AirtableRecord;
}

function mapRecord(r: AirtableRecord): AgencyTask {
  const f = r.fields;
  return {
    id: r.id,
    title: String(f.title || f.Título || f.Name || "Task"),
    agent: (String(f.agent || f.Agente || "ATLAS").toUpperCase() as AgentId) || "ATLAS",
    department: (String(f.department || f.Departamento || "operations") as DepartmentId) || "operations",
    priority: (String(f.priority || f.Prioridad || "medium").toLowerCase() as AgencyTask["priority"]) || "medium",
    status: (String(f.status || f.Estado || "pending").toLowerCase() as AgencyTask["status"]) || "pending",
    deadline: f.deadline ? String(f.deadline) : f.Fecha ? String(f.Fecha) : undefined,
  };
}

export async function listOpsTasks(): Promise<{ source: "live" | "mock"; tasks: AgencyTask[] }> {
  const token = process.env.AIRTABLE_TOKEN?.trim();
  if (!token) {
    return {
      source: "mock",
      tasks: [
        {
          id: "mock_1",
          title: "Configurar HEYGEN_API_KEY en Vercel",
          agent: "MUSE",
          department: "marketing",
          priority: "high",
          status: "pending",
        },
        {
          id: "mock_2",
          title: "Merge PR agency platform · deploy production",
          agent: "FORGE",
          department: "ia",
          priority: "high",
          status: "working",
        },
      ],
    };
  }

  const records = await airtableList(token);
  if (!records.length) {
    return { source: "live", tasks: [] };
  }
  return { source: "live", tasks: records.map(mapRecord) };
}

export async function createOpsTask(task: Omit<AgencyTask, "id">): Promise<AgencyTask> {
  const token = process.env.AIRTABLE_TOKEN?.trim();
  if (!token) {
    return { ...task, id: `local_${Date.now()}` };
  }

  const created = await airtableCreate(token, {
    title: task.title,
    agent: task.agent,
    department: task.department,
    priority: task.priority,
    status: task.status,
    deadline: task.deadline,
  });

  if (!created) return { ...task, id: `local_${Date.now()}` };
  return mapRecord(created);
}

export type GoalSnapshot = {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
  status: "green" | "yellow" | "red";
  pacePct?: number;
  expectedPct?: number;
  caption?: string;
  metricKey?: string;
};

type GoalMetricKey = "revenue_ytd" | "pipeline_weighted" | "content_month" | "clients_active" | "manual";
type GoalPace = "year" | "month" | "none";

type GoalDef = {
  id: string;
  title: string;
  metricKey: GoalMetricKey;
  target: number;
  unit: string;
  pace?: GoalPace;
  manualCurrent?: number;
};

const TABLE_GOALS = process.env.AIRTABLE_TABLE_GOALS || "Goals";

const DEFAULT_GOALS: GoalDef[] = [
  { id: "goal_2026_revenue", title: "Facturación 2026", metricKey: "revenue_ytd", target: 100_000, unit: "USD" },
  { id: "goal_pipeline", title: "Pipeline ponderado", metricKey: "pipeline_weighted", target: 25_000, unit: "USD" },
  { id: "goal_content", title: "Posts publicados / mes", metricKey: "content_month", target: 12, unit: "count" },
];

function yearProgress(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1).getTime();
  const end = new Date(now.getFullYear() + 1, 0, 1).getTime();
  return Math.min(1, Math.max(0, (Date.now() - start) / (end - start)));
}

function monthProgress(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
  return Math.min(1, Math.max(0, (Date.now() - start) / (end - start)));
}

function defaultPace(k: GoalMetricKey): GoalPace {
  if (k === "revenue_ytd") return "year";
  if (k === "content_month") return "month";
  return "none";
}

function paceExpected(pace: GoalPace): number {
  if (pace === "year") return yearProgress();
  if (pace === "month") return monthProgress();
  return 0;
}

/** Status por ritmo: verde si vamos al día con el tiempo transcurrido, no solo por % absoluto. */
function computeGoalStatus(
  current: number,
  target: number,
  pace: GoalPace,
): { status: GoalSnapshot["status"]; pacePct: number; expectedPct: number } {
  const ratio = target > 0 ? current / target : 0;
  const expected = paceExpected(pace);
  let status: GoalSnapshot["status"];
  if (pace === "none") {
    status = ratio >= 0.8 ? "green" : ratio >= 0.4 ? "yellow" : "red";
  } else {
    status = ratio >= expected * 0.9 ? "green" : ratio >= expected * 0.5 ? "yellow" : "red";
  }
  return { status, pacePct: Math.round(ratio * 100), expectedPct: Math.round(expected * 100) };
}

function deriveCurrent(
  metricKey: GoalMetricKey,
  finance: JarvisFinanceSnapshot | null,
  publishedThisMonth: number,
  manualCurrent: number,
): number {
  switch (metricKey) {
    case "revenue_ytd":
      return finance?.revenueYtd ?? 0;
    case "pipeline_weighted":
      return finance?.pipelineWeighted ?? 0;
    case "content_month":
      return publishedThisMonth;
    case "clients_active":
      return finance?.dealsWon ?? 0;
    default:
      return manualCurrent;
  }
}

function buildGoalCaption(target: number, current: number, pace: GoalPace, expectedPct: number, unit: string): string {
  const pct = target > 0 ? Math.round((current / target) * 100) : 0;
  if (pace === "year") return `${pct}% de la meta anual · esperado ${expectedPct}% a esta fecha`;
  if (pace === "month") return `${current}/${target} este mes · ${expectedPct}% del mes transcurrido`;
  return `${pct}% de la meta${unit === "USD" ? " · pipeline ponderado" : ""}`;
}

/** Cuenta posts publicados del mes en curso desde el calendario editorial. */
async function countPublishedThisMonth(): Promise<number> {
  try {
    const { items } = await listCalendarAll(100);
    const now = new Date();
    const m = now.getMonth();
    const y = now.getFullYear();
    return items.filter((i) => {
      if (i.status !== "published") return false;
      if (!i.scheduledAt) return true;
      const d = new Date(i.scheduledAt);
      return isNaN(d.getTime()) ? true : d.getMonth() === m && d.getFullYear() === y;
    }).length;
  } catch {
    return 0;
  }
}

/** Override opcional: definiciones de metas desde la tabla Airtable `Goals`. */
async function readGoalDefs(token: string): Promise<GoalDef[]> {
  try {
    const url = `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(TABLE_GOALS)}?maxRecords=25`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return [];
    const data = (await res.json()) as { records: AirtableRecord[] };
    return (data.records || [])
      .map((r) => {
        const f = r.fields;
        const metricKey = String(f.metric_key || f.metrica || "manual").toLowerCase() as GoalMetricKey;
        return {
          id: r.id,
          title: String(f.title || f.Título || f.Name || "Meta"),
          metricKey,
          target: Number(f.target ?? f.Objetivo ?? f.meta ?? 0) || 0,
          unit: String(
            f.unit || f.Unidad || (metricKey.includes("revenue") || metricKey.includes("pipeline") ? "USD" : "count"),
          ),
          manualCurrent: Number(f.current ?? f.actual ?? 0) || 0,
        } as GoalDef;
      })
      .filter((g) => g.target > 0);
  } catch {
    return [];
  }
}

/**
 * Goals reales: definiciones desde Airtable `Goals` (o defaults) con progreso
 * derivado del snapshot de finanzas live y del calendario publicado.
 * Status calculado por ritmo vs tiempo transcurrido, no hardcoded.
 */
export async function getOpsGoals(): Promise<GoalSnapshot[]> {
  const token = process.env.AIRTABLE_TOKEN?.trim();
  const [finance, publishedThisMonth, customDefs] = await Promise.all([
    getJarvisFinanceSnapshot(token).catch(() => null),
    countPublishedThisMonth(),
    token ? readGoalDefs(token) : Promise.resolve([] as GoalDef[]),
  ]);

  const defs = customDefs.length ? customDefs : DEFAULT_GOALS;

  return defs.map((g) => {
    const pace = g.pace ?? defaultPace(g.metricKey);
    const current = deriveCurrent(g.metricKey, finance, publishedThisMonth, g.manualCurrent ?? 0);
    const { status, pacePct, expectedPct } = computeGoalStatus(current, g.target, pace);
    return {
      id: g.id,
      title: g.title,
      current: Math.round(current),
      target: g.target,
      unit: g.unit,
      status,
      pacePct,
      expectedPct,
      caption: buildGoalCaption(g.target, current, pace, expectedPct, g.unit),
      metricKey: g.metricKey,
    };
  });
}
