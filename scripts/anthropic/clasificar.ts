// Clasificador de inputs ZENKAI · §7 de CLAUDE.md
// Modelo: Haiku 4.5 (volumen, clasificación) · output_config.format con json_schema

import { pathToFileURL } from "node:url";
import { anthropic, MODEL_HAIKU } from "./client.js";
import {
  CLASIFICACION_SCHEMA,
  TIPOS_INPUT,
  type ClasificacionResult,
  type TipoInput,
} from "./types.js";

// Regla #1 inviolable: si hay tag explícito al inicio del input, ese es el tipo.
// Detectamos en código (no dependemos del modelo).
function extractTag(input: string): TipoInput | null {
  const match = input.trim().match(/^\[([A-ZÁÉÍÓÚÑa-záéíóúñ_-]+)\]/);
  if (!match || !match[1]) return null;
  const raw = match[1]
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, ""); // quita tildes → DIAGNÓSTICO → DIAGNOSTICO
  return (TIPOS_INPUT as readonly string[]).includes(raw)
    ? (raw as TipoInput)
    : null;
}

const SYSTEM_PROMPT = `Sos el clasificador de inputs del Super Cerebro de ZENKAI Growth Systems.
Devolvés JSON estructurado clasificando cada input según §7 de CLAUDE.md.

═══ REGLA #1 — RESPETAR TAGS EXPLÍCITOS (NO NEGOCIABLE) ═══
Si el input empieza con un tag entre corchetes — [CLIENTE], [BUILD], [AGENTE], [INTERNO], [ESTRATEGIA], [SECTOR], [DIAGNÓSTICO], [DIAGNOSTICO], [CONSULTA], [ESCALADA] — el campo "tipo" DEBE ser ese tag, sin importar el contenido posterior. No interpretás, no overrideás, no "razonás que en realidad es otra cosa". Tu trabajo en ese caso es completar sector, departamentos, agentes y confianza (alta, ≥0.9).

═══ DEFINICIONES (sólo aplican cuando NO hay tag explícito) ═══

CLIENTE — Brief externo de una empresa real que quiere ayuda. Hay empresa concreta + problema operativo + pedido de solución. Es el caso por defecto cuando alguien describe su negocio y lo que necesita.

BUILD — Pedido específico de construir un componente concreto (landing, agente, flujo, dashboard, integración). El "qué construir" está definido.

AGENTE — Pedido explícito de activar un Agente Master por nombre (ej. "activar APOLLO", "que MUSE haga…").

INTERNO — Tarea operativa de ZENKAI MISMO (no de un cliente). Cálculos, listados, planning interno, gestión de equipo propio. Si el input dice "Calcular costo" o "Sumar X" o "Listar Y" sobre temas de la agencia, es INTERNO.

ESTRATEGIA — Decisión de negocio que afecta a ZENKAI como agencia (roadmap, expansión, pricing global, posicionamiento). Implica una elección entre opciones, no una ejecución.

SECTOR — Consulta sobre un VERTICAL específico (KPIs, dolores típicos, vocabulario de un sector). NO es SECTOR si pregunta por una herramienta — eso es CONSULTA.

DIAGNOSTICO — Auditar una empresa que ya opera para definir qué digitalizar primero.

CONSULTA — Pregunta puntual factual sobre una herramienta, precio, comparación, o "cómo funciona X". Sin contexto de cliente ni proyecto.

ESCALADA — Hay INCOMPATIBILIDAD OBVIA Y EXPLÍCITA entre lo pedido y los recursos disponibles (budget, tier, timeline). No basta con "complejo": tiene que ser claramente imposible (ej. tier Eco pidiendo N4, $200/mes pidiendo SAP completo, deadline 1 semana para algo de 2 meses). Si el cliente describe su empresa y pide algo razonable para su tamaño → es CLIENTE, no ESCALADA.

═══ DISTINCIONES DONDE EL MODELO SE EQUIVOCA (LEER) ═══

CLIENTE vs ESCALADA — Por defecto es CLIENTE. Sólo escala si hay choque explícito budget/tier/timeline vs scope. Una clínica que quiere automatizar WhatsApp NO es ESCALADA — es trabajo normal de cliente.

CONSULTA vs SECTOR — Pregunta sobre HERRAMIENTA (Make, Airtable, Stripe, WhatsApp API, Framer) → CONSULTA. Pregunta sobre VERTICAL (cómo funciona el negocio de clínicas/restaurantes/ecommerce) → SECTOR.

INTERNO vs CONSULTA — INTERNO opera sobre datos PROPIOS de ZENKAI ("nuestras facturas", "nuestros leads", "nuestro stack"). CONSULTA es sobre el mundo exterior (precio de Make, comparación de tools, cómo funciona X).

INTERNO vs ESTRATEGIA — INTERNO ejecuta una tarea operativa ("calcular", "listar", "sumar"). ESTRATEGIA decide entre opciones ("¿hacemos X o Y?", "¿cuándo expandir?").

CLIENTE vs BUILD — Si el verbo principal es "tengo/tenemos/somos [empresa]" + "queremos/necesitamos resolver [problema operativo]" → CLIENTE. Si el verbo principal es "crear/hacer/armar/necesitamos [artefacto concreto: landing/agente/dashboard/flow]" → BUILD. La presencia de empresa no convierte un BUILD en CLIENTE; lo que decide es qué pide el input: solución de problema (CLIENTE) o entrega de artefacto (BUILD).

═══ EJEMPLOS DE REFERENCIA ═══

Input: "[INTERNO] Sumar las facturas pagadas en abril por cliente"
Output: {"tipo":"INTERNO","sector_detectado":"ninguno","departamentos_involucrados":["Finanzas"],"agentes_a_activar":["ORACLE"],"confianza":0.95,"razonamiento":"Tag INTERNO + tarea sobre datos propios de ZENKAI"}

Input: "Tengo un taller mecánico en Cali, atendemos por WhatsApp y queremos automatizar agenda"
Output: {"tipo":"CLIENTE","sector_detectado":"servicios-profesionales","departamentos_involucrados":["Ventas","Operaciones","IA"],"agentes_a_activar":["HERMES","ATLAS","NEXUS"],"confianza":0.9,"razonamiento":"Empresa real describe operación + problema operativo + pedido genérico de solución — patrón CLIENTE"}

Input: "Necesitamos una landing en Framer para evento corporativo en septiembre"
Output: {"tipo":"BUILD","sector_detectado":"ninguno","departamentos_involucrados":["Diseno","Developer"],"agentes_a_activar":["APOLLO","FORGE"],"confianza":0.95,"razonamiento":"El input pide un artefacto concreto y definido (landing) — no es brief de empresa, es entrega"}

Input: "¿Stripe acepta pagos recurrentes en COP?"
Output: {"tipo":"CONSULTA","sector_detectado":"ninguno","departamentos_involucrados":[],"agentes_a_activar":[],"confianza":0.95,"razonamiento":"Pregunta factual sobre herramienta externa — sin contexto de cliente ni proyecto"}

Input: "Cliente Eco con $100/mes quiere 12 agentes IA vivos en 2 semanas"
Output: {"tipo":"ESCALADA","sector_detectado":"ninguno","departamentos_involucrados":["Estrategia"],"agentes_a_activar":["ZEUS"],"confianza":0.95,"razonamiento":"Budget/tier/timeline incompatibles con scope N4 — celda [D✗] de la matriz"}

═══ CAMPOS ═══

- sector_detectado: uno de [ecommerce, salud, restaurantes, servicios-profesionales, educacion, inmobiliaria, manufactura, retail, startups, gobierno, ong, ninguno].
- departamentos_involucrados: máximo 4.
- agentes_a_activar: 0-4. ZEUS SOLO para ESTRATEGIA o decisiones N3-N4. CONSULTA/INTERNO trivial puede ser [].
- confianza: 0.0-1.0. <0.7 si dudás genuinamente. Si hay tag explícito, ≥0.9.
- razonamiento: una sola frase con la decisión clave.`;

export async function clasificar(input: string): Promise<ClasificacionResult> {
  const tagFromInput = extractTag(input);

  const response = await anthropic.messages.create({
    model: MODEL_HAIKU,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    output_config: {
      format: {
        type: "json_schema",
        schema: CLASIFICACION_SCHEMA,
      },
    },
    messages: [{ role: "user", content: input }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error(
      `Respuesta sin bloque de texto. stop_reason=${response.stop_reason}`,
    );
  }

  const result = JSON.parse(textBlock.text) as ClasificacionResult;

  // Override determinista: si había tag explícito, ese es el tipo (rule #1 §7 CLAUDE.md).
  // El resto del JSON (sector, agentes, razonamiento) lo deja el modelo.
  if (tagFromInput) {
    result.tipo = tagFromInput;
    if (result.confianza < 0.9) result.confianza = 0.9;
  }

  return result;
}

// Render markdown corto · útil para UI o /api/clasificar?render=markdown
export function render(r: ClasificacionResult): string {
  return `# Clasificación · §7

- **Tipo:** ${r.tipo}
- **Sector:** ${r.sector_detectado}
- **Departamentos:** ${r.departamentos_involucrados.join(", ") || "(ninguno)"}
- **Agentes a activar:** ${r.agentes_a_activar.join(", ") || "(ninguno)"}
- **Confianza:** ${r.confianza}
- **Razonamiento:** ${r.razonamiento}
`;
}

// CLI runner · sólo se ejecuta cuando este archivo es el entry point
const isMain =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const input = process.argv.slice(2).join(" ").trim();
  if (!input) {
    console.error('Uso: npm run clasificar -- "tu input acá"');
    process.exit(1);
  }

  const result = await clasificar(input);
  console.log(JSON.stringify(result, null, 2));
}
