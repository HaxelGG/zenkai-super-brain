/**
 * GET/POST /api/agency/jobs · cola HITL
 *
 * GET ?id=recXXX → un job
 * GET → list pending_approval (max 20)
 * POST { action: "approve"|"reject", jobId, approvedBy?, reason? }
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  executeApprovedJob,
  rejectJob,
} from "../../scripts/agency/departments/content-batch.js";
import { getJob, listJobs } from "../../scripts/agency/jobs.js";
import { allowOrchestratorRequest } from "../jarvis/_orchestrator.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!allowOrchestratorRequest(req, res)) return;

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

  if (req.method !== "POST") {
    res.status(405).json({ error: "GET or POST" });
    return;
  }

  const body = (req.body ?? {}) as {
    action?: string;
    jobId?: string;
    approvedBy?: string;
    reason?: string;
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

    if (body.action === "approve") {
      const result = await executeApprovedJob(body.jobId, body.approvedBy || "founder");
      res.status(200).json({ ok: true, ...result });
      return;
    }

    res.status(400).json({ error: "action must be approve or reject" });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
}
