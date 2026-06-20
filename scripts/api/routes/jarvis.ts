/**
 * Router interno JARVIS · un solo Serverless Function (Hobby ≤12)
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getJarvisCrmSnapshot } from "../../airtable/jarvis-crm.js";
import { getJarvisFinanceSnapshot } from "../../airtable/jarvis-finance.js";
import { synthesizeJarvisSpeech } from "../../jarvis/elevenlabs-speak.js";
import { getBrainCapabilities } from "../../jarvis/ops-context.js";
import { executeJarvisInstruction } from "../../jarvis/orchestrator.js";
import { getJarvisSocialSnapshot } from "../../meta/jarvis-social.js";
import { allowDashboardRequest, setDashboardCacheHeaders } from "../jarvis-guard.js";
import { allowOrchestratorRequest } from "../jarvis-orchestrator.js";

export function jarvisSubpath(req: VercelRequest): string {
  const raw = req.url || "";
  const m = raw.match(/\/api\/jarvis\/?([^?]*)/);
  return (m?.[1] || "").replace(/\/$/, "") || "status";
}

export async function handleJarvisRoute(req: VercelRequest, res: VercelResponse): Promise<void> {
  const path = jarvisSubpath(req);

  switch (path) {
    case "status":
      return handleStatus(req, res);
    case "crm":
      return handleCrm(req, res);
    case "finance":
      return handleFinance(req, res);
    case "social":
      return handleSocial(req, res);
    case "runs":
      return handleRuns(req, res);
    case "run":
      return handleRun(req, res);
    case "speak":
      return handleSpeak(req, res);
    default:
      res.status(404).json({ error: `unknown jarvis route: ${path}` });
  }
}

async function handleStatus(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!allowDashboardRequest(req, res)) return;
  setDashboardCacheHeaders(res, 30);
  const caps = getBrainCapabilities();
  res.status(200).json({
    ok: caps.brain,
    message: caps.brain
      ? `Cerebro activo (${caps.brainProvider})`
      : "Cerebro OFF — configurá DEEPSEEK_API_KEY o ANTHROPIC_API_KEY en Vercel",
    capabilities: caps,
  });
}

async function handleCrm(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!allowDashboardRequest(req, res)) return;
  setDashboardCacheHeaders(res, 45);
  try {
    const snapshot = await getJarvisCrmSnapshot(process.env.AIRTABLE_TOKEN);
    res.status(200).json({
      ...snapshot,
      liveRecords: {
        leads: snapshot.leads.length,
        clients: snapshot.clientes.length,
        deals: snapshot.dealsTotal,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    res.status(502).json({
      source: "mock",
      fetchedAt: new Date().toISOString(),
      error: message,
      liveRecords: { leads: 0, clients: 0, deals: 0 },
      leads: [],
      clientes: [],
      pipelineFunnel: [],
    });
  }
}

async function handleFinance(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!allowDashboardRequest(req, res)) return;
  setDashboardCacheHeaders(res, 120);
  try {
    const snapshot = await getJarvisFinanceSnapshot(process.env.AIRTABLE_TOKEN);
    res.status(200).json(snapshot);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    res.status(502).json({
      source: "mock",
      fetchedAt: new Date().toISOString(),
      error: message,
      revenueYtd: 0,
      pipelineWeighted: 0,
      goal2026: 100_000,
    });
  }
}

async function handleSocial(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!allowDashboardRequest(req, res)) return;
  setDashboardCacheHeaders(res, 300);
  try {
    const snapshot = await getJarvisSocialSnapshot();
    res.status(200).json(snapshot);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    res.status(502).json({ source: "mock", fetchedAt: new Date().toISOString(), error: message });
  }
}

async function handleRuns(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!allowDashboardRequest(req, res)) return;
  setDashboardCacheHeaders(res, 0);
  res.status(200).json({
    source: "client",
    message: "Historial de runs en el panel de voz del Command Center (localStorage).",
    runs: [],
  });
}

async function handleRun(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!allowOrchestratorRequest(req, res)) return;
  const body = (req.body ?? {}) as { instruction?: unknown };
  if (typeof body.instruction !== "string" || !body.instruction.trim()) {
    res.status(400).json({ error: "instruction required (non-empty string)" });
    return;
  }
  try {
    const result = await executeJarvisInstruction(body.instruction);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
}

async function handleSpeak(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!allowOrchestratorRequest(req, res)) return;
  const body = (req.body ?? {}) as { text?: unknown };
  if (typeof body.text !== "string" || !body.text.trim()) {
    res.status(400).json({ error: "text required (non-empty string)" });
    return;
  }
  if (!process.env.ELEVENLABS_API_KEY) {
    res.status(503).json({ error: "ELEVENLABS_API_KEY not configured", fallback: "browser-tts" });
    return;
  }
  try {
    const result = await synthesizeJarvisSpeech(body.text);
    if (!result) {
      res.status(503).json({ error: "speech synthesis unavailable", fallback: "browser-tts" });
      return;
    }
    res.setHeader("Content-Type", result.mimeType);
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Jarvis-TTS", result.provider);
    res.status(200).send(result.audio);
  } catch (e) {
    res.status(502).json({ error: e instanceof Error ? e.message : String(e), fallback: "browser-tts" });
  }
}
