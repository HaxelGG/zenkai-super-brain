import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

export const SECTORES = ['salud', 'restaurante', 'ecommerce', 'servicios', 'inmobiliaria', 'educacion', 'manufactura', 'generico'] as const;
export const TIERS = ['Lite', 'Starter', 'Growth', 'Pro', 'Enterprise'] as const;

export const InputSchema = z.object({
  texto: z.string().min(80, 'texto debe tener al menos 80 caracteres').max(600, 'texto debe tener máximo 600 caracteres'),
});
export type ProposalInput = z.infer<typeof InputSchema>;

export const OutputSchema = z.object({
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
export type ProposalOutput = z.infer<typeof OutputSchema>;

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

export type GenerateResult =
  | { ok: true; data: ProposalOutput }
  | { ok: false; status: number; error: string; detail?: unknown };

let cachedClient: Anthropic | null = null;

const getClient = (): Anthropic => {
  if (cachedClient) return cachedClient;
  const apiKey = import.meta.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY missing');
  cachedClient = new Anthropic({ apiKey });
  return cachedClient;
};

export const generateProposal = async (texto: string): Promise<GenerateResult> => {
  const parsed = InputSchema.safeParse({ texto });
  if (!parsed.success) {
    return { ok: false, status: 400, error: 'invalid input', detail: parsed.error.flatten().fieldErrors };
  }
  let client: Anthropic;
  try {
    client = getClient();
  } catch (err) {
    return { ok: false, status: 500, error: 'server misconfigured', detail: String(err) };
  }
  let message;
  try {
    message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: parsed.data.texto }],
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return { ok: false, status: 502, error: 'anthropic call failed', detail };
  }
  const textBlock = message.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    return { ok: false, status: 502, error: 'modelo no devolvió texto' };
  }
  const raw = textBlock.text.trim();
  const jsonStart = raw.indexOf('{');
  const jsonEnd = raw.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1) {
    return { ok: false, status: 502, error: 'respuesta del modelo no contiene JSON', detail: raw };
  }
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
  } catch (err) {
    return { ok: false, status: 502, error: 'json del modelo inválido', detail: String(err) };
  }
  const validated = OutputSchema.safeParse(parsedJson);
  if (!validated.success) {
    return { ok: false, status: 502, error: 'schema del modelo inválido', detail: { errors: validated.error.flatten(), raw: parsedJson } };
  }
  return { ok: true, data: validated.data };
};

export const _resetCache = () => {
  cachedClient = null;
};
