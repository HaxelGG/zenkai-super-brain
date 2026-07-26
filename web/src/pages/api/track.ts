import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getClientIp, sha256 } from '../../lib/hash';
import { log, newRequestId, serializeError } from '../../lib/log';

export const prerender = false;

/**
 * Tracking de eventos first-party, sin cookies.
 *
 * Por qué no GA4 ni Meta Pixel: los dos obligan a un banner de consentimiento
 * conforme, cargan entre 40 y 100 KB de JavaScript de terceros, y no responden
 * la única pregunta que importa ahora — qué CTA genera conversaciones. Este
 * endpoint sí, con un beacon de 200 bytes.
 *
 * La IP se hashea antes de tocar nada, igual que en /api/lead-demo. No se
 * almacena identificador de usuario ni se persiste el evento todavía: hoy sólo
 * emite una línea de log estructurada, que es suficiente para contar clics por
 * CTA. Cuando haga falta agregación se enchufa un destino aquí, en un sitio.
 */
const EventSchema = z.object({
  event: z.enum(['whatsapp_click', 'demo_submit', 'demo_fallback']),
  cta_location: z.string().max(80).optional(),
  module: z.string().max(80).optional(),
  path: z.string().max(200).optional(),
  device: z.enum(['touch', 'pointer']).optional(),
});

export const POST: APIRoute = async ({ request }) => {
  const requestId = newRequestId();
  try {
    const parsed = EventSchema.safeParse(await request.json());
    if (!parsed.success) {
      // Un evento mal formado no es un error del usuario ni merece ruido:
      // devolvemos 204 igual para que el beacon nunca reintente.
      return new Response(null, { status: 204 });
    }
    log('info', 'track', {
      requestId,
      ...parsed.data,
      ipHash: sha256(getClientIp(request)),
    });
  } catch (err) {
    log('error', 'track.unexpected', { requestId, err: serializeError(err) });
  }
  // Siempre 204: el tracking jamás debe darle un error a la página.
  return new Response(null, { status: 204 });
};
