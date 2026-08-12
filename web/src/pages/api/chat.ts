import type { APIRoute } from 'astro';
import { SYSTEM_PROMPT } from '../../lib/chat-prompt';

export const prerender = false;

const DEEPSEEK_KEY = import.meta.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const rateMap = new Map<string, { count: number; reset: number }>();

export const POST: APIRoute = async ({ request }) => {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const now = Date.now();
    const r = rateMap.get(ip);
    if (r && now < r.reset) {
      if (r.count >= 15) {
        return new Response(JSON.stringify({ error: 'Demasiadas solicitudes' }), { status: 429, headers: { 'Content-Type': 'application/json' } });
      }
      r.count++;
    } else {
      rateMap.set(ip, { count: 1, reset: now + 60_000 });
    }
    if (rateMap.size > 10000) rateMap.clear();

    const body = await request.json();
    const messages: ChatMessage[] = body.messages || [];
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'messages required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const fullMessages: ChatMessage[] = [
      { role: 'system', content: body.systemPrompt || SYSTEM_PROMPT },
      ...messages.slice(-12),
    ];

    const response = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: fullMessages,
        max_tokens: 400,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('DeepSeek API error:', err);
      return new Response(JSON.stringify({ error: 'Error del servicio IA' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Lo siento, no pude procesar tu mensaje. ¿Puedes intentarlo de nuevo?';

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Chat API error:', e);
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
