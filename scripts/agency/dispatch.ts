/**
 * Bus de eventos unificado · n8n · Windmill · Resend (env-gated)
 */
import { dispatchJarvisEvent } from "../jarvis/n8n-dispatch.js";

export type DispatchChannel = "n8n" | "windmill" | "resend";
export type DispatchResult = {
  event: string;
  channels: Partial<Record<DispatchChannel, { ok: boolean; error?: string }>>;
};

export async function dispatchAgencyEvent(
  event: string,
  payload: Record<string, unknown> = {},
): Promise<DispatchResult> {
  const result: DispatchResult = { event, channels: {} };

  const n8n = await dispatchJarvisEvent(event, payload);
  result.channels.n8n = { ok: n8n.ok, error: n8n.ok ? undefined : n8n.error };

  const wm = await dispatchWindmill(event, payload);
  if (wm.attempted) {
    result.channels.windmill = { ok: wm.ok, error: wm.ok ? undefined : wm.error };
  }

  return result;
}

async function dispatchWindmill(
  event: string,
  payload: Record<string, unknown>,
): Promise<{ attempted: boolean; ok: boolean; error?: string }> {
  const token = process.env.WINDMILL_API_TOKEN?.trim();
  const base = process.env.WINDMILL_BASE_URL?.trim() || "https://app.windmill.dev";
  const workspace = process.env.WINDMILL_WORKSPACE?.trim() || "zenkai";
  const path = process.env.WINDMILL_AGENCY_WEBHOOK_PATH?.trim() || "f/agency/event_handler";

  if (!token) return { attempted: false, ok: false };

  try {
    const res = await fetch(`${base}/api/w/${workspace}/jobs/run/p/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ event, payload, source: "zenkai-agency", ts: new Date().toISOString() }),
    });
    if (!res.ok) {
      return { attempted: true, ok: false, error: `HTTP ${res.status}` };
    }
    return { attempted: true, ok: true };
  } catch (e) {
    return { attempted: true, ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function dispatchToN8nResult(d: DispatchResult): { event: string; ok: boolean; error?: string } {
  const n8n = d.channels.n8n;
  return { event: d.event, ok: !!n8n?.ok, error: n8n?.error };
}
