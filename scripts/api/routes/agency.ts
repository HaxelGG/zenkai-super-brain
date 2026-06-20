/**
 * Router interno Agency · un solo Serverless Function (Hobby ≤12)
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runAgent } from "../../agency/agent-runner.js";
import { listCalendarAll, saveCalendarItem } from "../../agency/calendar.js";
import { getMcpManifest, getProviderCapabilities } from "../../agency/capabilities.js";
import { runMarketingContentPipeline } from "../../agency/departments/marketing.js";
import {
  executeApprovedJob,
  rejectJob,
} from "../../agency/departments/content-batch.js";
import {
  generateImagesForJob,
  updateJobPost,
} from "../../agency/departments/content-images.js";
import { getOpsGoals, listOpsTasks } from "../../agency/departments/operations.js";
import { directorRoute, getDirectorStatus } from "../../agency/director.js";
import { getJob, listJobs } from "../../agency/jobs.js";
import { auditRequiredKeys } from "../../agency/keys-audit.js";
import { AGENT_REGISTRY, JARVIS_DIRECTOR, resolveAgentId, resolveDepartment } from "../../agency/registry.js";
import { runAgencySchedulerTick } from "../../agency/scheduler.js";
import type { AgencyRunInput, AgentId } from "../../agency/types.js";
import { allowAgencyJobsRequest } from "../agency-guard.js";
import { allowDashboardRequest, setDashboardCacheHeaders } from "../jarvis-guard.js";
import { allowOrchestratorRequest } from "../jarvis-orchestrator.js";

export function agencySubpath(req: VercelRequest): string {
  const q = req.query.route;
  if (typeof q === "string" && q.trim()) return q.replace(/\/$/, "");
  if (Array.isArray(q) && q[0]) return String(q[0]).replace(/\/$/, "");
  const raw = req.url || "";
  const m = raw.match(/\/api\/agency\/?([^?]*)/);
  return (m?.[1] || "").replace(/\/$/, "") || "status";
}

export async function handleAgencyRoute(req: VercelRequest, res: VercelResponse): Promise<void> {
  const path = agencySubpath(req);

  switch (path) {
    case "status":
      return handleStatus(req, res);
    case "keys":
      return handleKeys(req, res);
    case "tasks":
      return handleTasks(req, res);
    case "calendar":
      return handleCalendar(req, res);
    case "run":
      return handleRun(req, res);
    case "director":
      return handleDirector(req, res);
    case "jobs":
      return handleJobs(req, res);
    case "marketing/content":
      return handleMarketingContent(req, res);
    case "cron/tick":
      return handleCronTick(req, res);
    default:
      res.status(404).json({ error: `unknown agency route: ${path}` });
  }
}

async function handleStatus(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!allowDashboardRequest(req, res)) return;
  setDashboardCacheHeaders(res, 30);
  const providers = getProviderCapabilities();
  const configured = providers.filter((p) => p.configured).length;
  const keys = auditRequiredKeys();
  res.status(200).json({
    ok: keys.ready,
    director: JARVIS_DIRECTOR,
    keys: {
      ready: keys.ready,
      criticalMissing: keys.criticalMissing,
      missing: keys.requirements.filter((r) => !r.configured).map((r) => r.env),
    },
    agents: Object.values(AGENT_REGISTRY).map((a) => ({
      id: a.id,
      department: a.department,
      model: a.modeloLabel,
      n8nEvents: a.n8nEvents,
      mcpServers: a.mcpServers,
    })),
    providers,
    mcp: getMcpManifest(),
    departments: getDirectorStatus().departments,
    message: keys.ready
      ? `Agencia autónoma lista · ${configured}/${providers.length} proveedores`
      : `Faltan keys críticas: ${keys.criticalMissing.join(", ")}`,
  });
}

async function handleKeys(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!allowDashboardRequest(req, res)) return;
  setDashboardCacheHeaders(res, 60);
  const audit = auditRequiredKeys();
  res.status(200).json({
    ready: audit.ready,
    criticalMissing: audit.criticalMissing,
    requirements: audit.requirements.map((r) => ({
      env: r.env,
      label: r.label,
      tier: r.tier,
      departments: r.departments,
      purpose: r.purpose,
      configured: r.configured,
    })),
  });
}

async function handleTasks(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!allowDashboardRequest(req, res)) return;
  setDashboardCacheHeaders(res, 20);
  const [tasks, goals] = await Promise.all([listOpsTasks(), getOpsGoals()]);
  res.status(200).json({ tasks, goals, orchestratedBy: "JARVIS" });
}

async function handleCalendar(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method === "GET") {
    if (!allowDashboardRequest(req, res)) return;
    setDashboardCacheHeaders(res, 30);
    const data = await listCalendarAll();
    res.status(200).json(data);
    return;
  }
  if (req.method === "POST") {
    if (!allowOrchestratorRequest(req, res)) return;
    const body = (req.body ?? {}) as Record<string, unknown>;
    const item = await saveCalendarItem({
      title: String(body.title || ""),
      platform: (body.platform as "instagram") || "instagram",
      format: (body.format as "reel") || "reel",
      status: (body.status as "draft") || "draft",
      scheduledAt: body.scheduledAt ? String(body.scheduledAt) : undefined,
      hook: body.hook ? String(body.hook) : undefined,
      caption: body.caption ? String(body.caption) : undefined,
      script: body.script ? String(body.script) : undefined,
    });
    res.status(200).json(item);
    return;
  }
  res.status(405).json({ error: "GET or POST" });
}

async function handleRun(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!allowOrchestratorRequest(req, res)) return;
  const body = (req.body ?? {}) as { instruction?: unknown; agentId?: unknown; context?: unknown };
  if (typeof body.instruction !== "string" || !body.instruction.trim()) {
    res.status(400).json({ error: "instruction required" });
    return;
  }
  const agentId =
    (typeof body.agentId === "string" ? resolveAgentId(body.agentId) : null) || ("ATLAS" as AgentId);
  const input: AgencyRunInput = {
    instruction: body.instruction.trim(),
    agentId,
    context: typeof body.context === "object" && body.context ? (body.context as Record<string, unknown>) : undefined,
  };
  try {
    const result = await runAgent(input);
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
}

async function handleDirector(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!allowOrchestratorRequest(req, res)) return;
  const body = (req.body ?? {}) as {
    instruction?: unknown;
    agentId?: unknown;
    department?: unknown;
    media?: unknown;
  };
  if (typeof body.instruction !== "string" || !body.instruction.trim()) {
    res.status(400).json({ error: "instruction required" });
    return;
  }
  const input: Partial<AgencyRunInput> = {
    agentId: typeof body.agentId === "string" ? resolveAgentId(body.agentId) || undefined : undefined,
    department: typeof body.department === "string" ? resolveDepartment(body.department) || undefined : undefined,
    media: typeof body.media === "object" && body.media ? (body.media as AgencyRunInput["media"]) : undefined,
  };
  try {
    const result = await directorRoute(body.instruction.trim(), input);
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
}

async function handleJobs(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!allowAgencyJobsRequest(req, res)) return;

  if (req.method === "GET") {
    const id = typeof req.query.id === "string" ? req.query.id : undefined;
    if (id) {
      const job = await getJob(id);
      if (!job) {
        res.status(404).json({ error: "job not found" });
        return;
      }
      res.setHeader("Cache-Control", "no-store");
      res.status(200).json(job);
      return;
    }
    const list = await listJobs(20, "pending_approval");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(list);
    return;
  }

  const body = (req.body ?? {}) as {
    action?: string;
    jobId?: string;
    approvedBy?: string;
    reason?: string;
    index?: number;
    patch?: { hook?: string; caption?: string; hashtags?: string[]; image_prompt?: string };
    limit?: number;
  };

  if (!body.jobId?.startsWith("rec")) {
    res.status(400).json({ error: "jobId required (rec...)" });
    return;
  }

  try {
    if (body.action === "reject") {
      await rejectJob(body.jobId, body.reason || "rejected by user");
      res.status(200).json({ ok: true, jobId: body.jobId, status: "rejected" });
      return;
    }
    if (body.action === "generate_images") {
      const result = await generateImagesForJob(body.jobId, { limit: body.limit, onlyMissing: true });
      res.status(200).json({ ok: true, ...result });
      return;
    }
    if (body.action === "update_post") {
      if (!body.index || !body.patch) {
        res.status(400).json({ error: "index and patch required" });
        return;
      }
      await updateJobPost(body.jobId, body.index, body.patch);
      const job = await getJob(body.jobId);
      res.status(200).json({ ok: true, job });
      return;
    }
    if (body.action === "approve") {
      const result = await executeApprovedJob(body.jobId, body.approvedBy || "founder");
      res.status(200).json({ ok: true, ...result });
      return;
    }
    res.status(400).json({ error: "action must be approve, reject, generate_images, or update_post" });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
}

async function handleMarketingContent(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!allowOrchestratorRequest(req, res)) return;
  const body = (req.body ?? {}) as {
    brief?: unknown;
    platform?: unknown;
    format?: unknown;
    voice?: unknown;
    video?: unknown;
    videoProvider?: unknown;
    schedule?: unknown;
  };
  if (typeof body.brief !== "string" || !body.brief.trim()) {
    res.status(400).json({ error: "brief required" });
    return;
  }
  try {
    const result = await runMarketingContentPipeline({
      brief: body.brief.trim(),
      platform: body.platform as "instagram" | "linkedin" | "tiktok" | undefined,
      format: body.format as "reel" | "carousel" | "post" | "story" | undefined,
      voice: body.voice === true,
      video: body.video === true,
      videoProvider: body.videoProvider as "heygen" | "higgsfield" | undefined,
      schedule: typeof body.schedule === "string" ? body.schedule : undefined,
    });
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
}

function authorizeCron(req: VercelRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  const auth = req.headers.authorization;
  if (auth === `Bearer ${secret}`) return true;
  if (req.headers["x-cron-secret"] === secret) return true;
  return false;
}

async function handleCronTick(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== "GET" && req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }
  if (!authorizeCron(req)) {
    res.status(401).json({ error: "unauthorized · CRON_SECRET required" });
    return;
  }
  try {
    const result = await runAgencySchedulerTick();
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
}
