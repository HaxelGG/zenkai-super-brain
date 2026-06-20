/**
 * Jobs · cola HITL en Airtable VENTAS (tabla Jobs)
 */
const BASE = process.env.AIRTABLE_BASE_VENTAS || "appmiicsbFsvRfxQ9";
const TABLE = process.env.AIRTABLE_TABLE_JOBS || "Jobs";

export type JobStatus =
  | "draft"
  | "generating"
  | "pending_approval"
  | "approved"
  | "executing"
  | "done"
  | "rejected"
  | "failed";

export type JobPostArtifact = {
  index: number;
  hook: string;
  caption: string;
  hashtags: string[];
  image_prompt: string;
  image_url?: string | null;
  calendar_id?: string;
  publish_status?: "draft" | "published" | "skipped" | "error";
  publish_error?: string;
  meta_post_id?: string;
};

export type JobArtifacts = {
  posts: JobPostArtifact[];
  client_slug: string;
  channel: string;
  topic: string;
  publish_results?: unknown[];
};

export type AgencyJob = {
  id: string;
  instruction: string;
  intent: string;
  status: JobStatus;
  client_slug: string;
  channel: string;
  topic: string;
  count: number;
  agents: string[];
  risk_level: string;
  artifacts: JobArtifacts | null;
  approved_by?: string;
  approved_at?: string;
  rejected_reason?: string;
  created_at?: string;
};

type Record = { id: string; fields: Record<string, unknown>; createdTime?: string };

function mapJob(r: Record): AgencyJob {
  const f = r.fields;
  let artifacts: JobArtifacts | null = null;
  if (f.artifacts_json) {
    try {
      artifacts = JSON.parse(String(f.artifacts_json)) as JobArtifacts;
    } catch {
      artifacts = null;
    }
  }
  return {
    id: r.id,
    instruction: String(f.instruction || ""),
    intent: String(f.intent || "QUERY"),
    status: (String(f.status || "draft").toLowerCase() as JobStatus) || "draft",
    client_slug: String(f.client_slug || "zenkai"),
    channel: String(f.channel || "instagram"),
    topic: String(f.topic || ""),
    count: Number(f.count || 0),
    agents: f.agents ? String(f.agents).split(",").map((s) => s.trim()) : [],
    risk_level: String(f.risk_level || "medium"),
    artifacts,
    approved_by: f.approved_by ? String(f.approved_by) : undefined,
    approved_at: f.approved_at ? String(f.approved_at) : undefined,
    rejected_reason: f.rejected_reason ? String(f.rejected_reason) : undefined,
    created_at: r.createdTime,
  };
}

function token(): string | null {
  return process.env.AIRTABLE_TOKEN?.trim() || null;
}

export async function createJob(input: {
  instruction: string;
  intent: string;
  client_slug: string;
  channel: string;
  topic: string;
  count: number;
  agents: string[];
  risk_level: string;
  status?: JobStatus;
  artifacts?: JobArtifacts | null;
}): Promise<AgencyJob> {
  const t = token();
  const fields: Record<string, unknown> = {
    instruction: input.instruction.slice(0, 5000),
    intent: input.intent,
    status: input.status || "draft",
    client_slug: input.client_slug,
    channel: input.channel,
    topic: input.topic.slice(0, 2000),
    count: input.count,
    agents: input.agents.join(", "),
    risk_level: input.risk_level,
  };
  if (input.artifacts) fields.artifacts_json = JSON.stringify(input.artifacts);

  if (!t) {
    return {
      id: `mock_job_${Date.now()}`,
      instruction: input.instruction,
      intent: input.intent,
      status: input.status || "draft",
      client_slug: input.client_slug,
      channel: input.channel,
      topic: input.topic,
      count: input.count,
      agents: input.agents,
      risk_level: input.risk_level,
      artifacts: input.artifacts ?? null,
    };
  }

  const res = await fetch(`https://api.airtable.com/v0/${BASE}/${encodeURIComponent(TABLE)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    throw new Error(`createJob → HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  return mapJob((await res.json()) as Record);
}

export async function updateJob(
  id: string,
  fields: Record<string, unknown>,
): Promise<AgencyJob> {
  const t = token();
  if (!t || !id.startsWith("rec")) {
    throw new Error("Airtable unavailable or invalid job id");
  }
  const res = await fetch(
    `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(TABLE)}/${id}`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fields }),
    },
  );
  if (!res.ok) {
    throw new Error(`updateJob → HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  return mapJob((await res.json()) as Record);
}

export async function getJob(id: string): Promise<AgencyJob | null> {
  const t = token();
  if (!t || !id.startsWith("rec")) return null;
  const res = await fetch(
    `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(TABLE)}/${id}`,
    { headers: { Authorization: `Bearer ${t}` } },
  );
  if (!res.ok) return null;
  return mapJob((await res.json()) as Record);
}

export async function listJobs(max = 20, status?: JobStatus): Promise<{ source: "live" | "mock"; jobs: AgencyJob[] }> {
  const t = token();
  if (!t) return { source: "mock", jobs: [] };

  let url = `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(TABLE)}?maxRecords=${max}&sort%5B0%5D%5Bfield%5D=created_at&sort%5B0%5D%5Bdirection%5D=desc`;
  if (status) {
    url += `&filterByFormula=${encodeURIComponent(`{status}="${status}"`)}`;
  }
  const res = await fetch(url, { headers: { Authorization: `Bearer ${t}` } });
  if (!res.ok) return { source: "live", jobs: [] };
  const data = (await res.json()) as { records: Record[] };
  return { source: "live", jobs: (data.records || []).map(mapJob) };
}
