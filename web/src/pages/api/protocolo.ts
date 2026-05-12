import type { APIRoute } from 'astro';
import { generateProposal } from '../../lib/proposal';

export const prerender = false;

/**
 * Endpoint público con guard de API key.
 * Acepta dos headers de auth (cualquiera de los dos · alinea con convención del panel):
 *   - x-zenkai-key: <ZENKAI_API_KEY>
 *   - Authorization: Bearer <ZENKAI_API_KEY>
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
  const texto = (body as { texto?: unknown })?.texto;
  if (typeof texto !== 'string') {
    return new Response(JSON.stringify({ error: 'invalid input', detail: { texto: ['must be string'] } }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const result = await generateProposal(texto);
  if (!result.ok) {
    return new Response(JSON.stringify({ error: result.error, detail: result.detail }), {
      status: result.status,
      headers: { 'content-type': 'application/json' },
    });
  }
  return new Response(JSON.stringify(result.data), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};
