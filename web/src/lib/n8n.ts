// Dispatch de eventos a n8n · capa de automatización del Super Cerebro.
//
// Envía eventos (ej. "lead.nuevo", "propuesta.generada") a un workflow de n8n
// vía su Webhook node, para disparar automatizaciones (CRM, email, Slack, etc.).
//
// Degradación elegante: sin N8N_WEBHOOK_URL devuelve { ok:false, status:500 }
// — nunca lanza. La app sigue funcionando sin n8n configurado.

import { z } from 'zod';

export const N8nEventSchema = z.object({
  event: z.string().min(1, 'event requerido').max(120),
  payload: z.record(z.unknown()).optional(),
});
export type N8nEvent = z.infer<typeof N8nEventSchema>;

export type DispatchResult =
  | { ok: true; status: number; response: unknown }
  | { ok: false; status: number; error: string; detail?: unknown };

/**
 * Despacha un evento al webhook de n8n configurado en N8N_WEBHOOK_URL.
 * Si N8N_API_KEY está presente, lo manda como header `x-n8n-api-key`
 * (compatible con el "Header Auth" de los Webhook nodes de n8n).
 */
export const dispatchToN8n = async (
  event: string,
  payload?: Record<string, unknown>,
): Promise<DispatchResult> => {
  const parsed = N8nEventSchema.safeParse({ event, payload });
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      error: 'invalid input',
      detail: parsed.error.flatten().fieldErrors,
    };
  }

  const url = import.meta.env.N8N_WEBHOOK_URL;
  if (!url) {
    return { ok: false, status: 500, error: 'N8N_WEBHOOK_URL missing' };
  }
  const apiKey = import.meta.env.N8N_API_KEY;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(apiKey ? { 'x-n8n-api-key': apiKey } : {}),
      },
      body: JSON.stringify({
        event: parsed.data.event,
        payload: parsed.data.payload ?? {},
        source: 'zenkai-superbrain',
        ts: new Date().toISOString(),
      }),
    });
  } catch (err) {
    return {
      ok: false,
      status: 502,
      error: 'n8n call failed',
      detail: err instanceof Error ? err.message : String(err),
    };
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    return { ok: false, status: 502, error: 'n8n call failed', detail: detail.slice(0, 300) };
  }

  // Los webhooks de n8n pueden responder JSON o cuerpo vacío.
  let response: unknown = null;
  const text = await res.text().catch(() => '');
  if (text) {
    try {
      response = JSON.parse(text);
    } catch {
      response = text;
    }
  }
  return { ok: true, status: res.status, response };
};
