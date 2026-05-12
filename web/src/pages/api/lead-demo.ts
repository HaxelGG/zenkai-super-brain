import type { APIRoute } from 'astro';
import { z } from 'zod';
import { generateProposal } from '../../lib/proposal';
import { createDemo } from '../../lib/airtable';
import { checkRateLimit } from '../../lib/rate-limit';
import { verifyTurnstile } from '../../lib/turnstile';
import { getClientIp, sha256 } from '../../lib/hash';
import { sendProposalByEmail } from '../../lib/email';

export const prerender = false;

const InputSchema = z.object({
  texto: z.string().min(80).max(600),
  turnstileToken: z.string().optional(),
  email: z.string().email().optional(),
  whatsapp: z.string().optional(),
});

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: 'invalid json' });
  }
  const parsed = InputSchema.safeParse(body);
  if (!parsed.success) {
    return json(400, { error: 'invalid input', detail: parsed.error.flatten().fieldErrors });
  }
  const { texto, turnstileToken, email, whatsapp } = parsed.data;

  const ip = getClientIp(request);
  const ipH = sha256(ip);

  // 1 · Captcha (no-op si TURNSTILE_SECRET_KEY no está configurado)
  const captcha = await verifyTurnstile(turnstileToken ?? null, ip);
  if (!captcha.success) {
    return json(403, { error: 'captcha failed', detail: captcha.errorCodes });
  }

  // 2 · Rate limit (no-op si UPSTASH_* no están configurados)
  const rl = await checkRateLimit(ipH);
  if (!rl.success) {
    return json(429, {
      error: 'rate limit exceeded',
      detail: { limit: rl.limit, remaining: rl.remaining, reset: rl.reset },
    });
  }

  // 3 · Generar propuesta vía Sonnet 4.6 (función pura compartida con /api/protocolo)
  const result = await generateProposal(texto);
  if (!result.ok) {
    return json(result.status, { error: result.error, detail: result.detail });
  }

  // 4 · Persistir en Airtable demos (best-effort · no bloquea response si falla)
  try {
    await createDemo({
      texto_usuario: texto,
      sector_detectado: result.data.sector_detectado,
      tier_recomendado: result.data.tier_recomendado,
      propuesta_json: JSON.stringify(result.data),
      ip_hash: ipH,
      email_capturado: email,
      whatsapp_capturado: whatsapp,
    });
  } catch (err) {
    console.error('[lead-demo] airtable persistence failed:', err);
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
      console.error('[lead-demo] resend send failed:', err);
    }
  }

  return json(200, {
    ...result.data,
    rateLimit: { remaining: rl.remaining, limit: rl.limit, bypassed: rl.bypassed === true },
  });
};

const json = (status: number, payload: unknown): Response =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
