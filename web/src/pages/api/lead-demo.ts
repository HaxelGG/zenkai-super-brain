import type { APIRoute } from 'astro';
import { z } from 'zod';
import { generateProposal } from '../../lib/proposal';
import { MIN_TEXTO, MAX_TEXTO } from '../../lib/limits';
import { createDemo } from '../../lib/airtable';
import { checkRateLimit } from '../../lib/rate-limit';
import { verifyTurnstile } from '../../lib/turnstile';
import { getClientIp, sha256 } from '../../lib/hash';
import { sendProposalByEmail } from '../../lib/email';
import { log, newRequestId, serializeError } from '../../lib/log';

export const prerender = false;

// Reexportadas desde lib/limits para que exista un solo umbral en todo el sistema:
// si el gate del cliente y el del servidor divergen, el botón se habilita y el
// endpoint devuelve 400.
export { MIN_TEXTO, MAX_TEXTO };

const InputSchema = z.object({
  texto: z.string().min(MIN_TEXTO).max(MAX_TEXTO),
  turnstileToken: z.string().optional(),
  email: z.string().email().optional(),
  whatsapp: z.string().optional(),
});

/**
 * Handler interno. Todo error esperado sale como JSON con `code`; cualquier throw
 * inesperado lo captura el guard de POST más abajo.
 */
const handle = async (request: Request, requestId: string): Promise<Response> => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(400, 'invalid_json', 'invalid json', requestId);
  }
  const parsed = InputSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, 'invalid_input', 'invalid input', requestId, parsed.error.flatten().fieldErrors);
  }
  const { texto, turnstileToken, email, whatsapp } = parsed.data;

  const ip = getClientIp(request);
  const ipH = sha256(ip);

  // 1 · Captcha (no-op si TURNSTILE_SECRET_KEY no está configurado)
  const captcha = await verifyTurnstile(turnstileToken ?? null, ip);
  if (!captcha.success) {
    log('warn', 'lead_demo.captcha_failed', { requestId, errorCodes: captcha.errorCodes });
    return fail(403, 'captcha_failed', 'captcha failed', requestId, captcha.errorCodes);
  }

  // 2 · Rate limit (no-op si UPSTASH_* no están configurados · fail-open si Upstash cae)
  const rl = await checkRateLimit(ipH);
  if (!rl.success) {
    log('warn', 'lead_demo.rate_limited', { requestId, limit: rl.limit, reset: rl.reset });
    return fail(429, 'rate_limited', 'rate limit exceeded', requestId, {
      limit: rl.limit,
      remaining: rl.remaining,
      reset: rl.reset,
    });
  }
  if (rl.bypassed) {
    log('warn', 'lead_demo.rate_limit_bypassed', { requestId });
  }

  // 3 · Generar propuesta vía el proveedor LLM configurado
  const result = await generateProposal(texto);
  if (!result.ok) {
    log('error', 'lead_demo.proposal_failed', {
      requestId,
      status: result.status,
      error: result.error,
      detail: result.detail,
    });
    return fail(result.status, 'proposal_failed', result.error, requestId, result.detail);
  }

  // 4 · Persistir en Airtable demos (best-effort · no bloquea response si falla)
  let airtableRecordId: string | undefined;
  try {
    const created = await createDemo({
      texto_usuario: texto,
      sector_detectado: result.data.sector_detectado,
      tier_recomendado: result.data.tier_recomendado,
      propuesta_json: JSON.stringify(result.data),
      ip_hash: ipH,
      email_capturado: email,
      whatsapp_capturado: whatsapp,
    });
    airtableRecordId = created.id;
  } catch (err) {
    log('error', 'lead_demo.airtable_failed', { requestId, err: serializeError(err) });
  }

  // 5 · Si hay email, enviar propuesta (best-effort · no bloquea response)
  if (email) {
    try {
      await sendProposalByEmail({
        to: email,
        sector: result.data.sector_detectado,
        tier: result.data.tier_recomendado,
        propuesta: result.data.propuesta,
      });
    } catch (err) {
      log('error', 'lead_demo.resend_failed', { requestId, err: serializeError(err) });
    }
  }

  log('info', 'lead_demo.ok', {
    requestId,
    sector: result.data.sector_detectado,
    tier: result.data.tier_recomendado,
    persisted: Boolean(airtableRecordId),
    emailed: Boolean(email),
  });

  const successHeaders: Record<string, string> = {
    'content-type': 'application/json',
    'x-request-id': requestId,
  };
  if (airtableRecordId) successHeaders['x-airtable-record-id'] = airtableRecordId;
  return new Response(
    JSON.stringify({
      ...result.data,
      rateLimit: { remaining: rl.remaining, limit: rl.limit, bypassed: rl.bypassed === true },
    }),
    { status: 200, headers: successHeaders },
  );
};

/**
 * Guard de último recurso.
 *
 * Antes, cualquier throw no capturado (el caso real: `limiter.limit()` contra un Upstash
 * caído) escapaba de la ruta y Astro devolvía un 500 con cuerpo vacío. El cliente hacía
 * `r.json()` sobre ese cuerpo, tiraba, y el usuario veía "no se pudo conectar al servidor".
 * Desde acá el endpoint SIEMPRE responde JSON parseable con un `code` y un `requestId`
 * buscable en los logs de Vercel.
 */
export const POST: APIRoute = async ({ request }) => {
  const requestId = newRequestId();
  try {
    return await handle(request, requestId);
  } catch (err) {
    log('error', 'lead_demo.unexpected', { requestId, err: serializeError(err) });
    return fail(500, 'unexpected', 'internal error', requestId);
  }
};

const fail = (
  status: number,
  code: string,
  error: string,
  requestId: string,
  detail?: unknown,
): Response =>
  new Response(
    JSON.stringify({ error, code, requestId, ...(detail !== undefined ? { detail } : {}) }),
    { status, headers: { 'content-type': 'application/json', 'x-request-id': requestId } },
  );
