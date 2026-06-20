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

type RawResult =
  | { ok: true; raw: string }
  | { ok: false; status: number; error: string; detail?: unknown };

// Proveedor Anthropic (Claude). Mantiene el comportamiento original.
const callAnthropic = async (texto: string): Promise<RawResult> => {
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
      messages: [{ role: 'user', content: texto }],
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return { ok: false, status: 502, error: 'anthropic call failed', detail };
  }
  const textBlock = message.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    return { ok: false, status: 502, error: 'modelo no devolvió texto' };
  }
  return { ok: true, raw: textBlock.text };
};

// Proveedor DeepSeek (API compatible OpenAI · via fetch, sin dependencias nuevas).
const callDeepseek = async (texto: string): Promise<RawResult> => {
  const apiKey = import.meta.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return { ok: false, status: 500, error: 'server misconfigured', detail: 'DEEPSEEK_API_KEY missing' };
  }
  const model = import.meta.env.DEEPSEEK_MODEL || 'deepseek-chat';
  let res: Response;
  try {
    res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: texto },
        ],
      }),
    });
  } catch (err) {
    return { ok: false, status: 502, error: 'deepseek call failed', detail: err instanceof Error ? err.message : String(err) };
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    return { ok: false, status: 502, error: 'deepseek call failed', detail: detail.slice(0, 300) };
  }
  let body: unknown;
  try {
    body = await res.json();
  } catch (err) {
    return { ok: false, status: 502, error: 'deepseek call failed', detail: String(err) };
  }
  const raw = (body as { choices?: { message?: { content?: unknown } }[] })?.choices?.[0]?.message?.content;
  if (typeof raw !== 'string') {
    return { ok: false, status: 502, error: 'modelo no devolvió texto' };
  }
  return { ok: true, raw };
};

// Parsea el texto crudo del modelo a una propuesta validada (compartido entre proveedores).
const parseAndValidate = (rawText: string): GenerateResult => {
  const raw = rawText.trim();
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

const resolveProvider = (): 'anthropic' | 'deepseek' => {
  const explicit = (import.meta.env.LLM_PROVIDER || '').toLowerCase();
  if (explicit === 'deepseek' || explicit === 'anthropic') return explicit;
  if (!import.meta.env.ANTHROPIC_API_KEY && import.meta.env.DEEPSEEK_API_KEY) return 'deepseek';
  return 'anthropic';
};

export const generateProposal = async (texto: string): Promise<GenerateResult> => {
  const parsed = InputSchema.safeParse({ texto });
  if (!parsed.success) {
    return { ok: false, status: 400, error: 'invalid input', detail: parsed.error.flatten().fieldErrors };
  }
  const provider = resolveProvider();
  const llm = provider === 'deepseek'
    ? await callDeepseek(parsed.data.texto)
    : await callAnthropic(parsed.data.texto);
  if (!llm.ok) return llm;
  return parseAndValidate(llm.raw);
};

export const _resetCache = () => {
  cachedClient = null;
};
