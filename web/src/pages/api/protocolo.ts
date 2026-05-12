import type { APIRoute } from 'astro';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';

export const prerender = false;

const InputSchema = z.object({
  texto: z.string().min(80, 'texto debe tener al menos 80 caracteres').max(600, 'texto debe tener máximo 600 caracteres'),
});

const SECTORES = ['salud', 'restaurante', 'ecommerce', 'servicios', 'inmobiliaria', 'educacion', 'manufactura', 'generico'] as const;
const TIERS = ['Lite', 'Starter', 'Growth', 'Pro', 'Enterprise'] as const;

const OutputSchema = z.object({
  sector_detectado: z.enum(SECTORES),
  tier_recomendado: z.enum(TIERS),
  propuesta: z.object({
    headline: z.string(),
    dolor_identificado: z.string(),
    solucion: z.string(),
    agentes_activos: z.array(z.string()),
    stack: z.array(z.string()),
    timeline_dias: z.number().int().positive(),
    inversion_mensual_usd: z.number().int().positive(),
    proyeccion_90d: z.string(),
  }),
});

const SYSTEM_PROMPT = `Sos el Super Cerebro de ZENKAI Growth Systems, una agencia de IA con sede en Pereira, Colombia, que digitaliza empresas con agentes IA.

CAPA DE PRODUCTO:
- 12 agentes Master (ARES marketing, HERMES ventas, ATLAS ops, NEXUS IA, APOLLO diseño, MUSE contenido, FORGE dev, ORACLE finanzas, HIVE rrhh, ECHO atención, LEX legal, ZEUS estrategia).
- 5 tiers: Lite (componente simple), Starter (un departamento), Growth (multi-dept Pro), Pro (enterprise), Enterprise (corporativo).
- 8 sectores: salud, restaurante, ecommerce, servicios, inmobiliaria, educacion, manufactura, generico.

TU TAREA:
Recibís una descripción de empresa de 80-600 caracteres y devolvés EXCLUSIVAMENTE un JSON válido con esta estructura exacta:

{
  "sector_detectado": "<uno de: salud|restaurante|ecommerce|servicios|inmobiliaria|educacion|manufactura|generico>",
  "tier_recomendado": "<uno de: Lite|Starter|Growth|Pro|Enterprise>",
  "propuesta": {
    "headline": "<frase corta de 8-12 palabras que vende el resultado>",
    "dolor_identificado": "<1-2 frases sobre el problema principal>",
    "solucion": "<2-3 frases sobre qué construimos>",
    "agentes_activos": ["<nombre>", "<nombre>", "<nombre>"],
    "stack": ["<herramienta>", "<herramienta>"],
    "timeline_dias": <entero entre 7 y 90>,
    "inversion_mensual_usd": <entero entre 300 y 5000>,
    "proyeccion_90d": "<1 frase sobre resultado esperado a 90 días>"
  }
}

REGLAS DURAS:
- Voz "tú" en todo el copy (no "usted", no "vos").
- NO inventes estadísticas. Si necesitás cifras, usá rangos plausibles del sector.
- Tier debe escalar con la complejidad descrita: empresa simple → Lite/Starter; multi-departamento → Growth/Pro; corporativo → Enterprise.
- Agentes activos: 2-4 nombres en MAYÚSCULAS de la lista de 12.
- Stack: 2-4 herramientas reales (WhatsApp Cloud API, Airtable, Make, Cal.com, Resend, n8n, Shopify, etc.).
- Si no podés inferir sector con >70% certeza, usá "generico".
- NUNCA incluyas texto fuera del JSON. Solo el JSON parseable.`;

export const POST: APIRoute = async ({ request }) => {
  const expectedKey = import.meta.env.ZENKAI_API_KEY;
  const providedKey = request.headers.get('x-zenkai-key');
  if (!expectedKey || providedKey !== expectedKey) {
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

  const parsed = InputSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: 'invalid input', detail: parsed.error.flatten().fieldErrors }),
      { status: 400, headers: { 'content-type': 'application/json' } },
    );
  }

  const anthropicKey = import.meta.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return new Response(JSON.stringify({ error: 'server misconfigured: missing ANTHROPIC_API_KEY' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  const client = new Anthropic({ apiKey: anthropicKey });

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: parsed.data.texto }],
    });

    const textBlock = message.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return new Response(JSON.stringify({ error: 'modelo no devolvió texto' }), {
        status: 502,
        headers: { 'content-type': 'application/json' },
      });
    }

    const raw = textBlock.text.trim();
    const jsonStart = raw.indexOf('{');
    const jsonEnd = raw.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) {
      return new Response(JSON.stringify({ error: 'respuesta del modelo no contiene JSON', raw }), {
        status: 502,
        headers: { 'content-type': 'application/json' },
      });
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
    } catch (err) {
      return new Response(JSON.stringify({ error: 'json del modelo inválido', detail: String(err) }), {
        status: 502,
        headers: { 'content-type': 'application/json' },
      });
    }

    const validated = OutputSchema.safeParse(parsedJson);
    if (!validated.success) {
      return new Response(
        JSON.stringify({
          error: 'schema del modelo inválido',
          detail: validated.error.flatten(),
          raw: parsedJson,
        }),
        { status: 502, headers: { 'content-type': 'application/json' } },
      );
    }

    return new Response(JSON.stringify(validated.data), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: 'anthropic call failed', detail }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }
};
