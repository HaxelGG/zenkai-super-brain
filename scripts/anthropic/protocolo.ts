// Generador del Protocolo §8 de CLAUDE.md (cliente)
// Toma input [CLIENTE]/[BUILD]/[DIAGNÓSTICO] y devuelve los 6 pasos
// como JSON estructurado. Modelo: Sonnet 4.6.

import { pathToFileURL } from "node:url";
import { anthropic, MODEL_SONNET } from "./client.js";
import { clasificar } from "./clasificar.js";
import { loadSectorContext, loadStackContext } from "./contexto.js";
import type { ClasificacionResult, Sector } from "./types.js";

export const TIERS = ["ECO", "PRO", "PREMIUM"] as const;
export type Tier = (typeof TIERS)[number];

export const NIVELES = [1, 2, 3, 4] as const;
export type Nivel = (typeof NIVELES)[number];

export const CELDAS_MATRIZ = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L",
] as const;
export type CeldaMatriz = (typeof CELDAS_MATRIZ)[number];

export interface RutaPropuesta {
  stack: string[];
  agentes_activos: string[];
  tiempo_implementacion: string;
  precio_USD: number;
  precio_COP: number;
}

export interface RutaEco extends RutaPropuesta {
  limitaciones: string[];
}

export interface RutaPro extends RutaPropuesta {
  capacidades_extra: string[];
}

export interface Diagnostico {
  tier: Tier;
  nivel: Nivel;
  celda_matriz: CeldaMatriz;
  costo_operativo_mensual_USD: number;
  costo_operativo_mensual_COP: number;
  precio_minimo_servicio_USD: number;
  precio_minimo_servicio_COP: number;
}

export interface Recomendacion {
  ruta: "A" | "B";
  justificacion: string;
}

// El JSON que devuelve Sonnet (sin la clasificación, que se inyecta después)
export interface ProtocoloLLMOutput {
  // Inferencia del nombre de la empresa cliente desde el input · "" si no se puede inferir
  nombre_empresa_inferido: string;
  diagnostico: Diagnostico;
  ruta_a_eco: RutaEco;
  ruta_b_pro: RutaPro;
  recomendacion: Recomendacion;
  proximo_paso: string;
}

// Stats de uso del LLM · espejo de response.usage del SDK Anthropic.
// Útil para verificar cache hits y para cost tracking downstream.
export interface UsageStats {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens: number;
  cache_read_input_tokens: number;
}

// El resultado completo que devuelve protocolo() al consumidor
export interface ProtocoloResult extends ProtocoloLLMOutput {
  clasificacion: ClasificacionResult;
  usage: UsageStats;
}

// JSON schema enforced por output_config.format
export const PROTOCOLO_SCHEMA = {
  type: "object",
  properties: {
    nombre_empresa_inferido: {
      type: "string",
      description:
        "Nombre de la empresa cliente inferido del input (ej. 'Clínica Dental Sonríe', 'Restaurante Casa Marbella'). String vacío si el input no nombra la empresa o es genérico.",
    },
    diagnostico: {
      type: "object",
      properties: {
        tier: { type: "string", enum: [...TIERS] },
        nivel: { type: "number", enum: [...NIVELES] },
        celda_matriz: { type: "string", enum: [...CELDAS_MATRIZ] },
        costo_operativo_mensual_USD: { type: "number" },
        costo_operativo_mensual_COP: { type: "number" },
        precio_minimo_servicio_USD: { type: "number" },
        precio_minimo_servicio_COP: { type: "number" },
      },
      required: [
        "tier", "nivel", "celda_matriz",
        "costo_operativo_mensual_USD", "costo_operativo_mensual_COP",
        "precio_minimo_servicio_USD", "precio_minimo_servicio_COP",
      ],
      additionalProperties: false,
    },
    ruta_a_eco: {
      type: "object",
      properties: {
        stack: { type: "array", items: { type: "string" } },
        agentes_activos: { type: "array", items: { type: "string" } },
        limitaciones: { type: "array", items: { type: "string" } },
        tiempo_implementacion: { type: "string" },
        precio_USD: { type: "number" },
        precio_COP: { type: "number" },
      },
      required: [
        "stack", "agentes_activos", "limitaciones",
        "tiempo_implementacion", "precio_USD", "precio_COP",
      ],
      additionalProperties: false,
    },
    ruta_b_pro: {
      type: "object",
      properties: {
        stack: { type: "array", items: { type: "string" } },
        agentes_activos: { type: "array", items: { type: "string" } },
        capacidades_extra: { type: "array", items: { type: "string" } },
        tiempo_implementacion: { type: "string" },
        precio_USD: { type: "number" },
        precio_COP: { type: "number" },
      },
      required: [
        "stack", "agentes_activos", "capacidades_extra",
        "tiempo_implementacion", "precio_USD", "precio_COP",
      ],
      additionalProperties: false,
    },
    recomendacion: {
      type: "object",
      properties: {
        ruta: { type: "string", enum: ["A", "B"] },
        justificacion: { type: "string" },
      },
      required: ["ruta", "justificacion"],
      additionalProperties: false,
    },
    proximo_paso: { type: "string" },
  },
  required: [
    "nombre_empresa_inferido",
    "diagnostico", "ruta_a_eco", "ruta_b_pro",
    "recomendacion", "proximo_paso",
  ],
  additionalProperties: false,
} as const;

// Bloque estático del system prompt · NO depende del input ni del sector.
// Se aísla para que el cache de Anthropic (cache_control: ephemeral) lo
// reutilice entre calls dentro de la ventana de 5 minutos.
const STATIC_PROTOCOL_BLOCK = `Sos el generador del Protocolo §8 del Super Cerebro de ZENKAI Growth Systems.

Recibís un input clasificado como [CLIENTE], [BUILD] o [DIAGNÓSTICO] y devolvés JSON estructurado con los 6 pasos canónicos del protocolo §8 de CLAUDE.md.

═══ PROTOCOLO §8 (REGLA SAGRADA) ═══

PASO 1 · CLASIFICACIÓN
  Ya viene resuelta — el clasificador la inyectó antes de invocarte. No la generás vos.

PASO 2 · DIAGNÓSTICO
  Determinás:
  - tier: ECO / PRO / PREMIUM (según capacidad de inversión inferida o declarada)
  - nivel: 1 (componente simple) / 2 (un departamento) / 3 (multi-dept) / 4 (empresa completa)
  - celda_matriz: A-L según la matriz combinada (sección 3 de CLAUDE.md)
      ECO+N1=A, ECO+N2=B, ECO+N3=C⚠, ECO+N4=D✗
      PRO+N1=E, PRO+N2=F, PRO+N3=G, PRO+N4=H⚠
      PREMIUM+N1=I, PREMIUM+N2=J, PREMIUM+N3=K, PREMIUM+N4=L
      Coherencia obligatoria: tier ECO solo puede ir a A-D, PRO a E-H, PREMIUM a I-L.
  - costo_operativo_mensual: suma de herramientas mensuales del stack elegido (USD y COP)
  - precio_minimo_servicio: costo trimestral × 2 (USD y COP)

PASO 3 · RUTA A (ECO / MÍNIMO)
  Stack más barato que resuelve el caso. Free tiers donde se pueda. Limitaciones reales declaradas (no maquilladas). Usar stack-eco.md como referencia para precios y herramientas reales.

PASO 4 · RUTA B (PRO / ÓPTIMO)
  Stack profesional controlado. Sonnet 90% + Opus si justifica + Haiku para volumen. Capacidades adicionales sobre ruta A (no repetir lo que ya tiene Eco). Usar stack-pro.md como referencia.

PASO 5 · RECOMENDACIÓN ZENKAI
  Una sola ruta con justificación de 2-3 líneas. La justificación debe basarse en el caso concreto, no genérica.

PASO 6 · PRÓXIMO PASO ACCIONABLE
  Una sola acción que el equipo ZENKAI debe ejecutar HOY. Empezás con verbo en infinitivo (agendar, enviar, llamar, cotizar, cerrar, validar, contactar, redactar, etc.).

═══ NOMBRE DE LA EMPRESA INFERIDO ═══

Adicional a los 6 pasos: extraés el campo nombre_empresa_inferido del input. Patrones típicos:
  - "Clínica dental Sonríe en Medellín..." → "Clínica Dental Sonríe"
  - "Restaurante Casa Marbella, menú..." → "Restaurante Casa Marbella"
  - "Tengo un ecommerce de ropa femenina..." (sin nombre) → "" (string vacío)
  - "[BUILD] Crear landing para evento corporativo..." (sin empresa nombrada) → ""
Si NO podés inferir un nombre concreto con confianza alta, devolvés string vacío. NO inventás nombres ni usás genéricos como "Cliente" o "Empresa".

═══ CONVERSIÓN COP/USD ═══

Tasa de referencia: 1 USD = 4,200 COP (ajustar si claramente cambió). Calcular ambos campos.

═══ MERCADOS ═══

Si el input menciona ubicación, aplicar multiplicador en precio del servicio (NO en costo operativo):
  - Colombia/LATAM: × 1.0
  - España/Europa: × 1.8 a 2.5
  - EE.UU./Canadá: × 3.0 a 5.0

═══ REGLAS INQUEBRANTABLES (sección 6 CLAUDE.md) ═══

1. Siempre dos rutas (A Eco / B Pro). Nunca una sola.
2. Precio mínimo = costo operativo trimestral × 2.
3. Opus 4.7 sólo se activa por complejidad N3-N4. Solo ZEUS lo usa por defecto.
4. Haiku → volumen · Sonnet → ejecución · Opus → razonamiento.
5. El humano cierra la venta. La IA cualifica.
6. Si celda_matriz es D✗ (ECO+N4) → en proximo_paso DEBE proponer renegociar scope o budget. No prometas lo imposible.

═══ AGENTES DISPONIBLES ═══

ARES (Marketing) · HERMES (Ventas) · ATLAS (Operaciones) · NEXUS (IA) · APOLLO (Diseño) · MUSE (Contenido) · FORGE (Developer) · ORACLE (Finanzas) · HIVE (RRHH) · ECHO (AtenciónCliente) · LEX (Legal) · ZEUS (Estrategia · solo N3-N4).

En agentes_activos de cada ruta listá solo los que efectivamente trabajan en esa ruta (típicamente 2-4 por ruta).`;

export interface SystemBlock {
  type: "text";
  text: string;
  cache_control?: { type: "ephemeral" };
}

// Devuelve los bloques del system prompt en orden de estabilidad descendente:
//   1. STATIC_PROTOCOL — invariante · cache_control
//   2. stacksBlock      — invariante · cache_control
//   3. sectorBlock      — varía según input · sin cache (queda al final por
//                          la regla "el cambio en posición N invalida posiciones >N")
// Render order de la API: tools → system → messages. Sin tools, system está al inicio.
export function buildSystemPrompt(sector: Sector): SystemBlock[] {
  const sectorContent = loadSectorContext(sector);
  const stacks = loadStackContext();

  const stacksBlock = `═══ STACK ECO (referencia de herramientas y precios) ═══

${stacks.eco}

═══ STACK PRO (referencia de herramientas y precios) ═══

${stacks.pro}`;

  const blocks: SystemBlock[] = [
    { type: "text", text: STATIC_PROTOCOL_BLOCK, cache_control: { type: "ephemeral" } },
    { type: "text", text: stacksBlock, cache_control: { type: "ephemeral" } },
  ];

  if (sectorContent) {
    blocks.push({
      type: "text",
      text: `═══ MÓDULO DE SECTOR · ${sector.toUpperCase()} ═══\n\n${sectorContent}`,
    });
  }

  return blocks;
}

const TIPOS_VALIDOS_PROTOCOLO = ["CLIENTE", "BUILD", "DIAGNOSTICO"] as const;

export async function protocolo(
  input: string,
  classification?: ClasificacionResult,
): Promise<ProtocoloResult> {
  const clasificacion = classification ?? (await clasificar(input));

  // Protocolo §8 solo aplica a CLIENTE, BUILD y DIAGNOSTICO.
  // Cualquier otro tipo es un misuse del API consumer.
  if (!TIPOS_VALIDOS_PROTOCOLO.includes(clasificacion.tipo as never)) {
    throw new Error(
      `Protocolo §8 no aplica al tipo "${clasificacion.tipo}". Solo CLIENTE, BUILD, DIAGNOSTICO.`,
    );
  }

  const systemBlocks = buildSystemPrompt(clasificacion.sector_detectado);

  const userMessage = `INPUT ORIGINAL:
${input}

CLASIFICACIÓN PRE-COMPUTADA:
${JSON.stringify(clasificacion, null, 2)}

Generá los pasos 2-6 del Protocolo §8 según las reglas del system prompt.`;

  const response = await anthropic.messages.create({
    model: MODEL_SONNET,
    max_tokens: 4096,
    system: systemBlocks,
    output_config: {
      format: {
        type: "json_schema",
        schema: PROTOCOLO_SCHEMA,
      },
    },
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error(
      `Respuesta de Sonnet sin bloque de texto. stop_reason=${response.stop_reason}`,
    );
  }

  const llmOutput = JSON.parse(textBlock.text) as ProtocoloLLMOutput;

  const usage: UsageStats = {
    input_tokens: response.usage.input_tokens,
    output_tokens: response.usage.output_tokens,
    cache_creation_input_tokens: response.usage.cache_creation_input_tokens ?? 0,
    cache_read_input_tokens: response.usage.cache_read_input_tokens ?? 0,
  };

  return {
    clasificacion,
    ...llmOutput,
    usage,
  };
}

// Render markdown de los 6 pasos · debug-friendly (no propuesta-ready visual).
// Función pura: solo lee result, no toca I/O.
export function render(result: ProtocoloResult): string {
  const { clasificacion, diagnostico, ruta_a_eco, ruta_b_pro, recomendacion, proximo_paso } = result;

  const fmtUSD = (n: number) => `\$${n.toLocaleString("en-US")} USD`;
  const fmtCOP = (n: number) => `\$${n.toLocaleString("es-CO")} COP`;
  const lista = (items: string[]) => items.map((x) => `  - ${x}`).join("\n");

  return `# Protocolo §8 · Respuesta del Super Cerebro

## PASO 1 · CLASIFICACIÓN

- **Tipo:** ${clasificacion.tipo}
- **Sector:** ${clasificacion.sector_detectado}
- **Departamentos:** ${clasificacion.departamentos_involucrados.join(", ")}
- **Agentes a activar:** ${clasificacion.agentes_a_activar.join(", ") || "(ninguno)"}
- **Confianza:** ${clasificacion.confianza}
- **Razonamiento:** ${clasificacion.razonamiento}

## PASO 2 · DIAGNÓSTICO

- **Tier:** ${diagnostico.tier}
- **Nivel de complejidad:** ${diagnostico.nivel}
- **Celda de matriz:** ${diagnostico.celda_matriz}
- **Costo operativo mensual:** ${fmtUSD(diagnostico.costo_operativo_mensual_USD)} · ${fmtCOP(diagnostico.costo_operativo_mensual_COP)}
- **Precio mínimo del servicio:** ${fmtUSD(diagnostico.precio_minimo_servicio_USD)} · ${fmtCOP(diagnostico.precio_minimo_servicio_COP)}

## PASO 3 · RUTA A (ECO · mínimo)

**Stack:**
${lista(ruta_a_eco.stack)}

**Agentes activos:** ${ruta_a_eco.agentes_activos.join(", ")}

**Limitaciones reales:**
${lista(ruta_a_eco.limitaciones)}

- **Tiempo de implementación:** ${ruta_a_eco.tiempo_implementacion}
- **Precio sugerido:** ${fmtUSD(ruta_a_eco.precio_USD)} · ${fmtCOP(ruta_a_eco.precio_COP)}

## PASO 4 · RUTA B (PRO · óptimo)

**Stack:**
${lista(ruta_b_pro.stack)}

**Agentes activos:** ${ruta_b_pro.agentes_activos.join(", ")}

**Capacidades adicionales vs Ruta A:**
${lista(ruta_b_pro.capacidades_extra)}

- **Tiempo de implementación:** ${ruta_b_pro.tiempo_implementacion}
- **Precio sugerido:** ${fmtUSD(ruta_b_pro.precio_USD)} · ${fmtCOP(ruta_b_pro.precio_COP)}

## PASO 5 · RECOMENDACIÓN ZENKAI

**Ruta ${recomendacion.ruta}.**

${recomendacion.justificacion}

## PASO 6 · PRÓXIMO PASO ACCIONABLE

${proximo_paso}
`;
}

// Render propuesta-ready · markdown listo para enviar al cliente.
// Diferencias con render(): sin jargon interno (tier/celda/ruta), nombres comerciales
// (Plan Esencial / Plan Profesional), rangos de precio (+20% techo), header con nombre
// de empresa + fecha, footer con firma ZENKAI.
export function renderPropuesta(result: ProtocoloResult): string {
  const { nombre_empresa_inferido, ruta_a_eco, ruta_b_pro, recomendacion, proximo_paso } = result;

  const empresa = nombre_empresa_inferido.trim() || "[Cliente]";
  const fecha = new Date().toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const fmtRango = (precioBase: number, currency: "USD" | "COP") => {
    const piso = precioBase;
    const techo = Math.round(precioBase * 1.2);
    const fmt =
      currency === "USD"
        ? (n: number) => `\$${n.toLocaleString("en-US")} USD`
        : (n: number) => `\$${n.toLocaleString("es-CO")} COP`;
    return `${fmt(piso)} – ${fmt(techo)}`;
  };

  const lista = (items: string[]) => items.map((x) => `- ${x}`).join("\n");
  const recomendado = recomendacion.ruta === "A" ? "Plan Esencial" : "Plan Profesional";

  return `# Propuesta de Solución

**Para:** ${empresa}
**De:** ZENKAI Growth Systems · Pereira, Colombia
**Fecha:** ${fecha}

---

## Plan Esencial

> Versión más compacta de la solución. Ideal para validar resultados con inversión mínima antes de escalar.

**Componentes incluidos:**

${lista(ruta_a_eco.stack)}

**Tiempo de implementación:** ${ruta_a_eco.tiempo_implementacion}

**Inversión:**
- ${fmtRango(ruta_a_eco.precio_USD, "USD")}
- ${fmtRango(ruta_a_eco.precio_COP, "COP")}

**Limitaciones honestas:**

${lista(ruta_a_eco.limitaciones)}

---

## Plan Profesional

> Solución completa con automatización end-to-end y capacidades adicionales que aceleran resultados.

**Componentes incluidos:**

${lista(ruta_b_pro.stack)}

**Capacidades adicionales sobre el Plan Esencial:**

${lista(ruta_b_pro.capacidades_extra)}

**Tiempo de implementación:** ${ruta_b_pro.tiempo_implementacion}

**Inversión:**
- ${fmtRango(ruta_b_pro.precio_USD, "USD")}
- ${fmtRango(ruta_b_pro.precio_COP, "COP")}

---

## Recomendación de ZENKAI

> **${recomendado}**

${recomendacion.justificacion}

---

## Próximo paso

${proximo_paso}

---

*Propuesta válida 21 días desde la fecha de emisión. Tarifas en USD y COP a tasa de referencia COP 4,200/USD; ajustables al cierre. Esta propuesta no constituye contrato — el alcance final se formaliza en la llamada de cierre.*

*ZENKAI Growth Systems · contacto@zenkai.systems · zenkai.systems*
`;
}

const isMain =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const args = process.argv.slice(2);
  const jsonMode = args.includes("--json");
  const inputArgs = args.filter((a) => a !== "--json");
  const input = inputArgs.join(" ").trim();

  if (!input) {
    console.error('Uso: npm run protocolo -- "[CLIENTE] tu input acá"');
    console.error('       npm run protocolo -- --json "[CLIENTE] ..."');
    process.exit(1);
  }

  const result = await protocolo(input);
  if (jsonMode) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(render(result));
  }
}
