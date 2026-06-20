/**
 * Dispatch n8n desde el orquestador JARVIS (Node · process.env).
 */
export type N8nDispatchResult =
  | { ok: true; status: number }
  | { ok: false; error: string; detail?: unknown };

export async function dispatchJarvisEvent(
  event: string,
  payload: Record<string, unknown> = {},
): Promise<N8nDispatchResult> {
  const url =
    process.env.N8N_WEBHOOK_URL?.trim() || process.env.N8N_JARVIS_CALLBACK_URL?.trim();
  if (!url) {
    return { ok: false, error: "N8N_WEBHOOK_URL missing" };
  }

  const apiKey = process.env.N8N_API_KEY?.trim();

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(apiKey ? { "x-n8n-api-key": apiKey } : {}),
      },
      body: JSON.stringify({
        event,
        payload,
        source: "jarvis-orchestrator",
        ts: new Date().toISOString(),
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { ok: false, error: `n8n HTTP ${res.status}`, detail: detail.slice(0, 200) };
    }

    return { ok: true, status: res.status };
  } catch (err) {
    return {
      ok: false,
      error: "n8n call failed",
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}
