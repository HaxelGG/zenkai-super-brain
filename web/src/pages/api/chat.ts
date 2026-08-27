import type { APIRoute } from 'astro';
import { SYSTEM_PROMPT } from '../../lib/chat-prompt';

export const prerender = false;

const DEEPSEEK_KEY = import.meta.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL = import.meta.env.DEEPSEEK_MODEL || 'deepseek-chat';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const rateMap = new Map<string, { count: number; reset: number }>();

function limitado(ip: string): boolean {
  const now = Date.now();
  const r = rateMap.get(ip);
  if (r && now < r.reset) {
    if (r.count >= 15) return true;
    r.count++;
    return false;
  }
  rateMap.set(ip, { count: 1, reset: now + 60_000 });
  if (rateMap.size > 10000) rateMap.clear();
  return false;
}

const sse = (data: string): Uint8Array =>
  new TextEncoder().encode(`data: ${JSON.stringify({ d: data })}\n\n`);

export const POST: APIRoute = async ({ request }) => {
  try {
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    if (limitado(ip)) {
      return new Response(
        JSON.stringify({ error: 'Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!DEEPSEEK_KEY) {
      return new Response(JSON.stringify({ error: 'DEEPSEEK_API_KEY no configurada' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const messages: ChatMessage[] = body.messages || [];
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'messages required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Los system messages que vengan dentro de `messages` se descartan:
    // el único prompt de sistema válido es body.systemPrompt o el de ZENKAI.
    const historial: ChatMessage[] = messages
      .filter(
        (m): m is { role: 'user' | 'assistant'; content: string } =>
          m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
      )
      .slice(-24)
      .map((m) => ({
        role: m.role,
        content: m.content.slice(0, 1200),
      }));

    const systemContent =
      typeof body.systemPrompt === 'string' && body.systemPrompt.trim()
        ? body.systemPrompt.trim().slice(0, 4000)
        : SYSTEM_PROMPT;

    const sector = typeof body.sector === 'string' ? body.sector.trim().slice(0, 80) : '';
    const systemFinal = sector
      ? `${systemContent}\n\nContexto adicional: el visitante indicó que su negocio es del sector "${sector}". Trátalo como tu cliente objetivo de ese sector desde el primer mensaje.`
      : systemContent;

    const fullMessages: ChatMessage[] = [
      { role: 'system', content: systemFinal },
      ...historial,
    ];

    const conStream = body.stream === true;

    const upstream = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_KEY}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: fullMessages,
        max_tokens: 900,
        temperature: 0.75,
        stream: conStream,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!upstream.ok) {
      const err = await upstream.text();
      console.error('DeepSeek API error:', upstream.status, err.slice(0, 300));
      return new Response(JSON.stringify({ error: 'Error del servicio IA' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!conStream) {
      const data = await upstream.json();
      const reply =
        data.choices?.[0]?.message?.content ||
        'Lo siento, no pude procesar tu mensaje. ¿Puedes intentarlo de nuevo?';
      return new Response(JSON.stringify({ reply }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!upstream.body) {
      return new Response(JSON.stringify({ error: 'Sin cuerpo de streaming' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = upstream.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let total = 0;
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data:')) continue;
              const payload = trimmed.slice(5).trim();
              if (payload === '[DONE]') continue;
              try {
                const parsed = JSON.parse(payload);
                const delta: string = parsed?.choices?.[0]?.delta?.content ?? '';
                if (delta) {
                  total += delta.length;
                  controller.enqueue(sse(delta));
                }
              } catch {
                // chunk parcial, se ignora
              }
            }
          }
        } catch (err) {
          console.error('Stream read error', err);
        } finally {
          reader.releaseLock();
        }
        if (total === 0) {
          controller.enqueue(
            sse(JSON.stringify({ error: 'Respuesta vacía del proveedor' }))
          );
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (e) {
    console.error('Chat API error:', e);
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
