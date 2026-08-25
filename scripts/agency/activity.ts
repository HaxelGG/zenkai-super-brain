/**
 * Activity feed · log durable de la agencia (Airtable, fuente única de verdad).
 *
 * - Write-side: `logActivity` / `logRun` persisten cada run del orquestador y
 *   cada tick del scheduler en la tabla `Activity`. Best-effort: nunca rompen
 *   el run si Airtable falla o no está configurado.
 * - Read-side: `listAgencyActivity` lee la tabla `Activity`; si aún no hay runs
 *   logueados, hace fallback a los Jobs persistidos (contenido HITL).
 */
import { listJobs, type AgencyJob } from "./jobs.js";
import type { AgencyRunResult } from "./types.js";

export type ActivityEventType = "task" | "lead" | "alert" | "deploy" | "social";

export type ActivityEvent = {
  id: string;
  /** ISO timestamp para ordenar / formatear en cliente */
  ts: string;
  /** HH:MM ya formateado (UTC) para render directo */
  time: string;
  agent: string;
  type: ActivityEventType;
  message: string;
};

const BASE = process.env.AIRTABLE_BASE_VENTAS || "appmiicsbFsvRfxQ9";
const TABLE_ACTIVITY = process.env.AIRTABLE_TABLE_ACTIVITY || "Activity";

const VALID_TYPES = new Set<ActivityEventType>(["task", "lead", "alert", "deploy", "social"]);

function token(): string | null {
  return process.env.AIRTABLE_TOKEN?.trim() || null;
}

function hhmm(iso?: string): string {
  if (!iso) return "--:--";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--:--";
  return d.toISOString().slice(11, 16);
}

function byTsDesc(a: ActivityEvent, b: ActivityEvent): number {
  return a.ts < b.ts ? 1 : a.ts > b.ts ? -1 : 0;
}

// ── Write-side ──────────────────────────────────────────────────────────────

export type ActivityInput = {
  type: ActivityEventType;
  agent: string;
  department?: string;
  message: string;
  status?: string;
  source?: string;
  ref?: string;
};

/** Persiste un evento de actividad. Best-effort: no lanza nunca. */
export async function logActivity(ev: ActivityInput): Promise<void> {
  const t = token();
  if (!t) return;
  try {
    await fetch(`https://api.airtable.com/v0/${BASE}/${encodeURIComponent(TABLE_ACTIVITY)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          message: ev.message.replace(/\s+/g, " ").trim().slice(0, 250) || "—",
          ts: new Date().toISOString(),
          type: ev.type,
          agent: ev.agent,
          department: ev.department || "",
          status: ev.status || "",
          source: ev.source || "agency",
          ref: ev.ref || "",
        },
      }),
    });
  } catch {
    /* best-effort: la persistencia del feed nunca rompe un run */
  }
}

function deptToType(dep: string): ActivityEventType {
  if (dep === "sales") return "lead";
  if (dep === "marketing" || dep === "design") return "social";
  if (dep === "ia") return "deploy";
  return "task";
}

/** Loguea un resultado de run del orquestador (agente o pipeline de departamento). */
export async function logRun(result: AgencyRunResult, source: string): Promise<void> {
  const firstLine = (result.reply || "").split("\n").find((l) => l.trim())?.trim() || "ejecutó tarea";
  await logActivity({
    type: deptToType(result.department),
    agent: result.agent,
    department: result.department,
    message: firstLine,
    status: "done",
    source,
    ref: result.id,
  });
}

// ── Read-side ───────────────────────────────────────────────────────────────

type AirtableRecord = { id: string; fields: Record<string, unknown>; createdTime?: string };

function recordToEvent(r: AirtableRecord): ActivityEvent {
  const f = r.fields;
  const ts = String(f.ts || r.createdTime || "");
  const type = String(f.type || "task") as ActivityEventType;
  return {
    id: r.id,
    ts: ts || new Date(0).toISOString(),
    time: hhmm(ts),
    agent: String(f.agent || "ATLAS").toUpperCase(),
    type: VALID_TYPES.has(type) ? type : "task",
    message: String(f.message || ""),
  };
}

async function listActivityLog(limit: number): Promise<{ source: "live" | "mock"; events: ActivityEvent[] }> {
  const t = token();
  if (!t) return { source: "mock", events: [] };
  try {
    const url =
      `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(TABLE_ACTIVITY)}` +
      `?maxRecords=${limit}&sort%5B0%5D%5Bfield%5D=ts&sort%5B0%5D%5Bdirection%5D=desc`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${t}` } });
    if (!res.ok) return { source: "live", events: [] }; // tabla ausente → fallback a Jobs
    const data = (await res.json()) as { records: AirtableRecord[] };
    return { source: "live", events: (data.records || []).map(recordToEvent) };
  } catch {
    return { source: "live", events: [] };
  }
}

const STATUS_TYPE: Record<string, ActivityEventType> = {
  done: "deploy",
  executing: "task",
  approved: "task",
  generating: "task",
  draft: "task",
  pending_approval: "alert",
  rejected: "alert",
  failed: "alert",
};

const STATUS_VERB: Record<string, string> = {
  done: "publicó",
  executing: "ejecutando",
  approved: "aprobado",
  generating: "generando",
  draft: "borrador",
  pending_approval: "espera aprobación",
  rejected: "rechazado",
  failed: "falló",
};

function jobToEvent(job: AgencyJob): ActivityEvent {
  const agent = (job.agents[0] || "ATLAS").toUpperCase();
  const subject = job.topic || job.instruction || job.intent || "contenido";
  const channel = job.channel ? ` · ${job.channel}` : "";
  const verb = STATUS_VERB[job.status] || "procesó";
  return {
    id: job.id,
    ts: job.created_at || new Date(0).toISOString(),
    time: hhmm(job.created_at),
    agent,
    type: STATUS_TYPE[job.status] || "task",
    message: `${verb}: ${subject}${channel}`.slice(0, 160),
  };
}

/**
 * Eventos de actividad recientes. Primero la tabla `Activity` (runs + ticks
 * persistidos); si está vacía, fallback a los Jobs persistidos en Airtable.
 * `source: "mock"` cuando no hay AIRTABLE_TOKEN.
 */
export async function listAgencyActivity(
  max = 12,
): Promise<{ source: "live" | "mock"; events: ActivityEvent[] }> {
  const limit = Math.min(30, Math.max(1, Math.floor(max) || 12));

  const log = await listActivityLog(limit);
  if (log.events.length) return log;

  const { source, jobs } = await listJobs(limit);
  const events = jobs.map(jobToEvent).sort(byTsDesc).slice(0, limit);
  return { source, events };
}
