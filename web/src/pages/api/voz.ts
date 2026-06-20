import type { APIRoute } from 'astro';
import { synthesizeSpeech } from '../../lib/voice';

export const prerender = false;

/**
 * Endpoint "Jarvis" · convierte texto en audio MP3 vía ElevenLabs.
 * Auth idéntica a /api/protocolo (x-zenkai-key o Authorization: Bearer).
 *
 * Body: { "texto": string, "voiceId"?: string }
 * 200 → audio/mpeg (bytes del MP3).
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

  const { texto, voiceId } = (body ?? {}) as { texto?: unknown; voiceId?: unknown };
  if (typeof texto !== 'string') {
    return new Response(
      JSON.stringify({ error: 'invalid input', detail: { texto: ['must be string'] } }),
      { status: 400, headers: { 'content-type': 'application/json' } },
    );
  }

  const result = await synthesizeSpeech(
    texto,
    typeof voiceId === 'string' ? voiceId : undefined,
  );
  if (!result.ok) {
    return new Response(JSON.stringify({ error: result.error, detail: result.detail }), {
      status: result.status,
      headers: { 'content-type': 'application/json' },
    });
  }

  return new Response(result.audio, {
    status: 200,
    headers: {
      'content-type': result.contentType,
      'cache-control': 'no-store',
    },
  });
};
