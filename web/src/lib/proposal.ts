import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { MIN_TEXTO, MAX_TEXTO } from './limits';
import { MODULOS, MODULO_SLUGS } from './modulos';

export const SECTORES = ['salud', 'restaurante', 'ecommerce', 'servicios', 'inmobiliaria', 'educacion', 'manufactura', 'generico'] as const;

/** Los planes reales. Deben coincidir con data/pricing.ts. */
export const TIERS = ['Starter', 'Silver', 'Gold', 'Enterprise'] as const;

// El catálogo vive en lib/modulos.ts · datos puros sin dependencias, para que
// un test que mockee este archivo no lo deje en undefined.
export { MODULOS, MODULO_SLUGS } from './modulos';

export { MIN_TEXTO, MAX_TEXTO };

/**
 * Longitud del brief. /api/lead-demo, /api/protocolo y /api/orquestar validan
 * todos contra este schema, así que el umbral es único para todo el sistema.
 */
export const InputSchema = z.object({
  texto: z
    .string()
    .min(MIN_TEXTO, `texto debe tener al menos ${MIN_TEXTO} caracteres`)
    .max(MAX_TEXTO, `texto debe tener máximo ${MAX_TEXTO} caracteres`),
});
export type ProposalInput = z.infer<typeof InputSchema>;

export const OutputSchema = z.object({
  sector_detectado: z.enum(SECTORES),
  tier_recomendado: z.enum(TIERS),
  /**
   * Módulos del catálogo real, por slug. Sustituye a `agentes_activos`, que
   * exponía nombres internos (ARES, HERMES) que no significan nada para quien
   * lee la propuesta y no se pueden enlazar a ninguna página.
   */
  modulos_recomendados: z.array(z.enum(MODULO_SLUGS)).min(1).max(4),
  propuesta: z.object({
    headline: z.string(),
    dolor_identificado: z.string(),
    solucion: z.string(),
    stack: z.array(z.string()),
    timeline_dias: z.number().int().positive(),
    proyeccion_90d: z.string(),
  }),
});
export type ProposalOutput = z.infer<typeof OutputSchema>;

const CATALOGO = MODULOS.map((m) => `- ${m.slug} (${m.nombre}): ${m.resuelve}`).join('\n');

const SYSTEM_PROMPT = `Eres el sistema de diagnóstico de ZENKAI Growth Systems, una agencia que construye sistemas de IA para empresas.

CATÁLOGO COMPLETO — estos son los 14 módulos que ZENKAI vende:
${CATALOGO}

PLANES (4, en este orden de menor a mayor):
- Starter: asistente de IA por texto, WhatsApp y otros canales, panel, recordatorios, agendamiento.
- Silver: todo Starter + página web, automatizaciones, CRM a medida, dashboard de KPIs, identidad visual.
- Gold: todo Silver + tienda online, campañas de voz/email/WhatsApp, campañas de Meta Ads, predicción, vídeo con IA.
- Enterprise: todo Gold + desarrollo a medida, integraciones con sistemas propios, volumen alto, account manager.

TU TAREA:
Recibes la descripción de una empresa (25-600 caracteres) y devuelves EXCLUSIVAMENTE un JSON válido:

{
  "sector_detectado": "<salud|restaurante|ecommerce|servicios|inmobiliaria|educacion|manufactura|generico>",
  "tier_recomendado": "<Starter|Silver|Gold|Enterprise>",
  "modulos_recomendados": ["<slug>", "<slug>"],
  "propuesta": {
    "headline": "<frase de 8-12 palabras que nombra el resultado, no la tecnología>",
    "dolor_identificado": "<1-2 frases sobre el problema principal, en las palabras del usuario>",
    "solucion": "<2-3 frases sobre qué se construye CONCRETAMENTE para este caso>",
    "stack": ["<herramienta>", "<herramienta>"],
    "timeline_dias": <entero entre 7 y 90>,
    "proyeccion_90d": "<1 frase sobre qué habrá cambiado a 90 días>"
  }
}

REGLA MÁS IMPORTANTE — RESPONDE A LO QUE TE PIDEN:
Los modulos_recomendados deben resolver lo que la persona describió, no lo que sea
más habitual. Si pide una TIENDA ONLINE, el primer módulo es commerce-ai. Si su
problema es que nadie contesta, customer-ai. Si es que no sabe qué funciona,
intelligence-ai. Si necesita contratar, hr-ai. Si son contratos, legal-ai.
NUNCA propongas un agente de WhatsApp para un problema que no es de atención.
Entre 1 y 4 módulos, ordenados: el primero es el que resuelve el problema central.

El plan se deduce de los módulos, no al revés:
- Sólo customer-ai o sólo atención → Starter
- Necesita web, CRM, automatizaciones u operaciones → Silver
- Necesita tienda online, campañas o producción de contenido → Gold
- Sistemas propios, integraciones legacy o varios departamentos → Enterprise

OTRAS REGLAS DURAS:
- Voz "tú". Español de España. Nunca "usted" ni voseo.
- NO menciones precios, cuotas ni inversión. El precio lo pone el sistema desde su
  tabla oficial; cualquier cifra que inventes contradiría la página de precios.
- NO menciones nombres internos de agentes (ARES, HERMES, ATLAS…). El cliente compra
  módulos, no nuestra arquitectura.
- NO inventes estadísticas, porcentajes ni resultados. proyeccion_90d describe QUÉ
  habrá cambiado, nunca cuánto ("las consultas fuera de horario dejan de perderse",
  no "+40% de ventas").
- Stack: 2-4 herramientas reales y coherentes con los módulos elegidos (Shopify,
  WooCommerce, WhatsApp Cloud API, n8n, Airtable, Cal.com, HubSpot, Meta Ads…).
- Si el brief es muy corto o ambiguo, NO rellenes huecos: usa "generico", elige el
  plan más conservador que encaje y describe el dolor sólo con lo que dijo.
- NUNCA incluyas texto fuera del JSON. Sólo el JSON parseable.`;

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
