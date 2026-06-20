/**
 * ATLAS · Ops · goals y tasks (Airtable o memoria)
 */
import type { AgencyTask, AgentId, DepartmentId } from "../types.js";

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
};

export async function getOpsGoals(): Promise<GoalSnapshot[]> {
  return [
    {
      id: "goal_2026_revenue",
      title: "Facturación 2026",
      current: 0,
      target: 100_000,
      unit: "USD",
      status: "yellow",
    },
    {
      id: "goal_pipeline",
      title: "Pipeline ponderado Q2",
      current: 0,
      target: 25_000,
      unit: "USD",
      status: "red",
    },
    {
      id: "goal_content",
      title: "Posts publicados / mes",
      current: 0,
      target: 12,
      unit: "count",
      status: "yellow",
    },
  ];
}
