import type { APIRoute } from 'astro';
import { dispatchToN8n } from '../../lib/n8n';

export const prerender = false;

/**
 * Endpoint de automatización · reenvía un evento a n8n.
 * Auth idéntica a /api/protocolo (x-zenkai-key o Authorization: Bearer).
 *
 * Body: { "event": string, "payload"?: object }
 * 200 → { status, response } con lo que devolvió el webhook de n8n.
 */
const isAuthorized = (request: Request, expected: string): boolean => {
  const x = request.headers.get('x-zenkai-key');
  if (x === expected) return true;
  const auth = request.headers.get('authorization');
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice(7).trim() === expected;
  }
  return false;
};

export const POST: APIRoute = async ({ request }) => {
  const expectedKey = import.meta.env.ZENKAI_API_KEY;
  if (!expectedKey || !isAuthorized(request, expectedKey)) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid json' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const { event, payload } = (body ?? {}) as { event?: unknown; payload?: unknown };
  if (typeof event !== 'string') {
    return new Response(
      JSON.stringify({ error: 'invalid input', detail: { event: ['must be string'] } }),
      { status: 400, headers: { 'content-type': 'application/json' } },
    );
  }

  const result = await dispatchToN8n(
    event,
    payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : undefined,
  );
  if (!result.ok) {
    return new Response(JSON.stringify({ error: result.error, detail: result.detail }), {
      status: result.status,
      headers: { 'content-type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ status: result.status, response: result.response }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};
