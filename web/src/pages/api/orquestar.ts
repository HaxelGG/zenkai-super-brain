import type { APIRoute } from 'astro';
import { orchestrate } from '../../lib/orchestrator';

export const prerender = false;

/**
 * Endpoint "Jarvis" unificado · genera propuesta + (opcional) voz + (opcional) n8n.
 * Auth idéntica a /api/protocolo (x-zenkai-key o Authorization: Bearer).
 *
 * Body: { "texto": string, "voice"?: boolean, "notify"?: boolean, "voiceId"?: string }
 * 200 → { proposal, audioBase64?, voiceError?, n8n? }
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

  const { texto, voice, notify, voiceId, email } = (body ?? {}) as {
    texto?: unknown;
    voice?: unknown;
    notify?: unknown;
    voiceId?: unknown;
    email?: unknown;
  };
  if (typeof texto !== 'string') {
    return new Response(
      JSON.stringify({ error: 'invalid input', detail: { texto: ['must be string'] } }),
      { status: 400, headers: { 'content-type': 'application/json' } },
    );
  }

  const result = await orchestrate(texto, {
    voice: voice === true,
    notify: notify === true,
    voiceId: typeof voiceId === 'string' ? voiceId : undefined,
    email: typeof email === 'string' && email.includes('@') ? email.trim() : undefined,
  });

  if (!result.ok) {
    return new Response(JSON.stringify({ error: result.error, detail: result.detail }), {
      status: result.status,
      headers: { 'content-type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({
      proposal: result.proposal,
      audioBase64: result.audioBase64,
      voiceError: result.voiceError,
      n8n: result.n8n,
      email: result.email,
    }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );
};
