# Fase 1 · Protocolo §8 (cliente) · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar el agente del Protocolo §8 que toma un input `[CLIENTE]/[BUILD]/[DIAGNÓSTICO]` y devuelve los 6 pasos canónicos (clasificación · diagnóstico · ruta A · ruta B · recomendación · próximo paso) como JSON estructurado + render markdown debug-friendly.

**Architecture:** Función `protocolo()` en `scripts/anthropic/protocolo.ts` que compone el clasificador existente con una llamada a Sonnet 4.6 usando `output_config.format.json_schema`. Helper `contexto.ts` carga dinámicamente el módulo del sector relevante + ambos stacks Eco/Pro como contexto del system prompt. Render puro `render(result): string` produce markdown. CLI runner + test runner siguen el mismo patrón que `clasificar.ts`/`test-clasificar.ts`.

**Tech Stack:** TypeScript estricto · `@anthropic-ai/sdk` · `tsx` runner · `dotenv` · Node 20+ · `node:fs`/`node:path` para leer markdown. Sin nuevas dependencias.

**Spec de referencia:** `docs/specs/2026-05-03-fase1-protocolo-cliente-design.md`

---

## Estructura final de archivos

```
Kenzai Super Brain/
├── package.json                                ← MODIFICAR (añadir 2 scripts npm)
└── scripts/anthropic/
    ├── client.ts                               (existente · sin cambios)
    ├── types.ts                                (existente · sin cambios)
    ├── clasificar.ts                           (existente · sin cambios)
    ├── test-clasificar.ts                      (existente · sin cambios)
    ├── contexto.ts                             ← CREAR · loaders de sector y stacks
    ├── protocolo.ts                            ← CREAR · función + tipos + render + CLI
    └── test-protocolo.ts                       ← CREAR · 4 casos + asserciones
```

---

## Convenciones del repo a respetar

- **Imports:** TypeScript ESM con extensión `.js` en imports relativos (ej. `from "./client.js"`) — lo exige `tsconfig.json` con `moduleResolution: bundler` + `tsx`.
- **Cliente Anthropic:** importar siempre `anthropic`, `MODEL_SONNET`, `MODEL_HAIKU` desde `./client.js`. Nunca instanciar `new Anthropic()` en otros archivos.
- **JSON Schemas:** definir `as const` con `additionalProperties: false` en cada object. Usar `enum` para sets cerrados. Todos los campos en `required`.
- **CLI runners:** patrón `import.meta.url === pathToFileURL(process.argv[1]).href` (ya usado en `clasificar.ts`).
- **Comentarios en archivos:** español, una línea, solo cuando el WHY no es obvio.
- **Errores:** lanzar `Error` con contexto (qué falló + qué se esperaba). No usar `console.error` para errores fatales.

---

## Task 1 — Tipos y JSON schema del ProtocoloResult

**Files:**
- Create: `scripts/anthropic/protocolo.ts` (skeleton inicial)

- [ ] **Step 1.1 — Crear `protocolo.ts` con tipos + schema (sin función todavía)**

Contenido inicial completo:

```typescript
// Generador del Protocolo §8 de CLAUDE.md (cliente)
// Toma input [CLIENTE]/[BUILD]/[DIAGNÓSTICO] y devuelve los 6 pasos
// como JSON estructurado. Modelo: Sonnet 4.6.

import type { ClasificacionResult } from "./types.js";

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
  diagnostico: Diagnostico;
  ruta_a_eco: RutaEco;
  ruta_b_pro: RutaPro;
  recomendacion: Recomendacion;
  proximo_paso: string;
}

// El resultado completo que devuelve protocolo() al consumidor
export interface ProtocoloResult extends ProtocoloLLMOutput {
  clasificacion: ClasificacionResult;
}

// JSON schema enforced por output_config.format
export const PROTOCOLO_SCHEMA = {
  type: "object",
  properties: {
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
    "diagnostico", "ruta_a_eco", "ruta_b_pro",
    "recomendacion", "proximo_paso",
  ],
  additionalProperties: false,
} as const;
```

- [ ] **Step 1.2 — Verificar que TypeScript compila sin errores**

Run:
```bash
npx tsc --noEmit
```
Expected: sin output (compila clean).

- [ ] **Step 1.3 — Commit**

```bash
git add scripts/anthropic/protocolo.ts
git commit -m "feat(anthropic): tipos y JSON schema del Protocolo §8"
```

---

## Task 2 — Helper `contexto.ts` para cargar sectores y stacks

**Files:**
- Create: `scripts/anthropic/contexto.ts`

- [ ] **Step 2.1 — Crear `contexto.ts` con loaders síncronos**

```typescript
// Helpers para cargar contexto del repo en el system prompt.
// Lectura síncrona: estos archivos son markdown chicos (<10KB) y se invocan
// una vez al inicio de cada call a protocolo(). No vale la pena async.

import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Sector } from "./types.js";

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPTS_DIR, "..", "..");

// Devuelve el contenido del módulo de sector, o null si sector="ninguno"
// o si el archivo no existe (fallback gracioso).
export function loadSectorContext(sector: Sector): string | null {
  if (sector === "ninguno") return null;
  const path = join(REPO_ROOT, "sectores", `${sector}.md`);
  try {
    return readFileSync(path, "utf-8");
  } catch (e) {
    console.warn(`[contexto] No se pudo cargar ${path}: ${(e as Error).message}`);
    return null;
  }
}

// Devuelve los stacks Eco y Pro como bloque único.
// Premium se omite (en v0.1 protocolo solo genera 2 rutas: Eco y Pro).
export function loadStackContext(): { eco: string; pro: string } {
  const ecoPath = join(REPO_ROOT, "finanzas", "stack-eco.md");
  const proPath = join(REPO_ROOT, "finanzas", "stack-pro.md");
  return {
    eco: readFileSync(ecoPath, "utf-8"),
    pro: readFileSync(proPath, "utf-8"),
  };
}
```

- [ ] **Step 2.2 — Test rápido en línea de comandos**

Run:
```bash
npx tsx -e "import('./scripts/anthropic/contexto.ts').then(m => { const s = m.loadSectorContext('ecommerce'); console.log('ecommerce:', s?.length, 'chars'); const k = m.loadStackContext(); console.log('eco:', k.eco.length, 'pro:', k.pro.length); })"
```
Expected: imprime tres números >0 (ej. `ecommerce: 8234 chars`, `eco: 5123 pro: 8456`).

- [ ] **Step 2.3 — Probar fallback con sector="ninguno"**

Run:
```bash
npx tsx -e "import('./scripts/anthropic/contexto.ts').then(m => console.log('ninguno:', m.loadSectorContext('ninguno')))"
```
Expected: `ninguno: null`.

- [ ] **Step 2.4 — Commit**

```bash
git add scripts/anthropic/contexto.ts
git commit -m "feat(anthropic): contexto.ts · loaders de sector y stacks"
```

---

## Task 3 — `buildSystemPrompt()` en `protocolo.ts`

**Files:**
- Modify: `scripts/anthropic/protocolo.ts` (añadir función pura `buildSystemPrompt`)

- [ ] **Step 3.1 — Agregar imports al inicio de `protocolo.ts`**

Insertar después de los imports existentes:

```typescript
import { loadSectorContext, loadStackContext } from "./contexto.js";
import type { Sector } from "./types.js";
```

- [ ] **Step 3.2 — Agregar función `buildSystemPrompt()`**

Insertar después del `PROTOCOLO_SCHEMA`:

```typescript
export function buildSystemPrompt(sector: Sector): string {
  const sectorContent = loadSectorContext(sector);
  const stacks = loadStackContext();

  const sectorBlock = sectorContent
    ? `\n═══ MÓDULO DE SECTOR · ${sector.toUpperCase()} ═══\n\n${sectorContent}\n`
    : "";

  return `Sos el generador del Protocolo §8 del Super Cerebro de ZENKAI Growth Systems.

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

En agentes_activos de cada ruta listá solo los que efectivamente trabajan en esa ruta (típicamente 2-4 por ruta).
${sectorBlock}
═══ STACK ECO (referencia de herramientas y precios) ═══

${stacks.eco}

═══ STACK PRO (referencia de herramientas y precios) ═══

${stacks.pro}`;
}
```

- [ ] **Step 3.3 — Test rápido del prompt builder**

Run:
```bash
npx tsx -e "import('./scripts/anthropic/protocolo.ts').then(m => { const p = m.buildSystemPrompt('salud'); console.log('len:', p.length, '· tiene sector salud:', p.includes('SALUD')); })"
```
Expected: `len: <número >15000>` y `tiene sector salud: true`.

- [ ] **Step 3.4 — Commit**

```bash
git add scripts/anthropic/protocolo.ts
git commit -m "feat(anthropic): buildSystemPrompt · ensambla §8 + sector + stacks"
```

---

## Task 4 — Función `protocolo()` (LLM call)

**Files:**
- Modify: `scripts/anthropic/protocolo.ts` (añadir función `protocolo()`)

- [ ] **Step 4.1 — Agregar imports faltantes al inicio**

Modificar el bloque de imports inicial para que quede:

```typescript
import { pathToFileURL } from "node:url";
import { anthropic, MODEL_SONNET } from "./client.js";
import { clasificar } from "./clasificar.js";
import { loadSectorContext, loadStackContext } from "./contexto.js";
import type { ClasificacionResult, Sector } from "./types.js";
```

- [ ] **Step 4.2 — Agregar función `protocolo()` al final del archivo**

```typescript
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

  const systemPrompt = buildSystemPrompt(clasificacion.sector_detectado);

  const userMessage = `INPUT ORIGINAL:
${input}

CLASIFICACIÓN PRE-COMPUTADA:
${JSON.stringify(clasificacion, null, 2)}

Generá los pasos 2-6 del Protocolo §8 según las reglas del system prompt.`;

  const response = await anthropic.messages.create({
    model: MODEL_SONNET,
    max_tokens: 4096,
    system: systemPrompt,
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

  return {
    clasificacion,
    ...llmOutput,
  };
}
```

- [ ] **Step 4.3 — Smoke test (1 call real, ~$0.08)**

Run:
```bash
npx tsx -e "import('./scripts/anthropic/protocolo.ts').then(async m => { const r = await m.protocolo('[CLIENTE] Tengo una clínica dental en Medellín, 4 odontólogos, agendamiento por WhatsApp manual.'); console.log(JSON.stringify(r, null, 2)); })"
```
Expected: JSON con `clasificacion`, `diagnostico`, `ruta_a_eco`, `ruta_b_pro`, `recomendacion`, `proximo_paso`. Diagnóstico debería decir tier ECO o PRO + nivel 2 + celda B/F.

- [ ] **Step 4.4 — Commit**

```bash
git add scripts/anthropic/protocolo.ts
git commit -m "feat(anthropic): función protocolo() · §8 con Sonnet 4.6"
```

---

## Task 5 — `render(result)` markdown debug-friendly

**Files:**
- Modify: `scripts/anthropic/protocolo.ts` (añadir función pura `render`)

- [ ] **Step 5.1 — Agregar función `render()` después de `protocolo()`**

```typescript
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
```

- [ ] **Step 5.2 — Test del render con datos mock**

Run:
```bash
npx tsx -e "
import { render } from './scripts/anthropic/protocolo.ts';
const mock = {
  clasificacion: { tipo: 'CLIENTE', sector_detectado: 'salud', departamentos_involucrados: ['Operaciones'], agentes_a_activar: ['ATLAS'], confianza: 0.9, razonamiento: 'test' },
  diagnostico: { tier: 'ECO', nivel: 2, celda_matriz: 'B', costo_operativo_mensual_USD: 50, costo_operativo_mensual_COP: 210000, precio_minimo_servicio_USD: 300, precio_minimo_servicio_COP: 1260000 },
  ruta_a_eco: { stack: ['Make Free'], agentes_activos: ['ATLAS'], limitaciones: ['1000 ops/mes'], tiempo_implementacion: '5 dias', precio_USD: 300, precio_COP: 1260000 },
  ruta_b_pro: { stack: ['Make Pro'], agentes_activos: ['ATLAS', 'NEXUS'], capacidades_extra: ['10000 ops'], tiempo_implementacion: '7 dias', precio_USD: 800, precio_COP: 3360000 },
  recomendacion: { ruta: 'A', justificacion: 'Por volumen actual la ruta A cubre con margen.' },
  proximo_paso: 'Agendar llamada de descubrimiento de 30 minutos.'
};
console.log(render(mock));
"
```
Expected: imprime markdown con los 6 secciones `## PASO 1` a `## PASO 6`.

- [ ] **Step 5.3 — Commit**

```bash
git add scripts/anthropic/protocolo.ts
git commit -m "feat(anthropic): render() markdown debug-friendly"
```

---

## Task 6 — CLI runner

**Files:**
- Modify: `scripts/anthropic/protocolo.ts` (añadir bloque `if (isMain)` al final)

- [ ] **Step 6.1 — Agregar CLI runner al final del archivo**

```typescript
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
    console.error("       npm run protocolo -- --json \"[CLIENTE] ...\"");
    process.exit(1);
  }

  const result = await protocolo(input);
  if (jsonMode) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(render(result));
  }
}
```

- [ ] **Step 6.2 — Verificar TypeScript compila**

Run:
```bash
npx tsc --noEmit
```
Expected: sin output.

- [ ] **Step 6.3 — Commit**

```bash
git add scripts/anthropic/protocolo.ts
git commit -m "feat(anthropic): CLI runner del protocolo · default markdown · --json"
```

---

## Task 7 — Scripts npm en `package.json`

**Files:**
- Modify: `package.json`

- [ ] **Step 7.1 — Añadir 2 scripts al objeto `scripts`**

Modificar la sección `"scripts"` para añadir las 2 entradas nuevas (mantener las existentes):

```json
{
  "scripts": {
    "clasificar": "tsx scripts/anthropic/clasificar.ts",
    "test:clasificar": "tsx scripts/anthropic/test-clasificar.ts",
    "protocolo": "tsx scripts/anthropic/protocolo.ts",
    "test:protocolo": "tsx scripts/anthropic/test-protocolo.ts"
  }
}
```

- [ ] **Step 7.2 — Smoke test del CLI con npm**

Run:
```bash
npm run protocolo -- "[CLIENTE] Tengo una clínica dental en Medellín, 4 odontólogos, agendamiento por WhatsApp manual."
```
Expected: imprime markdown con los 6 secciones. ~$0.08 de costo.

- [ ] **Step 7.3 — Smoke test modo JSON**

Run:
```bash
npm run protocolo -- --json "[CLIENTE] Tengo una clínica dental en Medellín."
```
Expected: imprime JSON parseable con todos los campos.

- [ ] **Step 7.4 — Commit**

```bash
git add package.json
git commit -m "chore(scripts): añadir npm run protocolo y test:protocolo"
```

---

## Task 8 — Test runner con 4 casos + asserciones estructurales

**Files:**
- Create: `scripts/anthropic/test-protocolo.ts`

- [ ] **Step 8.1 — Crear `test-protocolo.ts`**

```typescript
// Test del Protocolo §8 · 4 casos representativos.
// Asserciones estructurales automáticas + impresión de markdown para revisión humana.
// Costo: ~$0.30 por corrida completa (Sonnet 4.6 · 4 calls largos).

import { protocolo, render, type ProtocoloResult } from "./protocolo.js";
import type { Sector, TipoInput } from "./types.js";

interface TestCase {
  nombre: string;
  input: string;
  esperado: {
    tipo: TipoInput;
    sector: Sector;
  };
}

const CASOS: TestCase[] = [
  {
    nombre: "01 · CLIENTE clínica dental Medellín",
    input: "[CLIENTE] Tengo una clínica dental en Medellín, 4 odontólogos, agendamiento por WhatsApp manual, queremos automatizar.",
    esperado: { tipo: "CLIENTE", sector: "salud" },
  },
  {
    nombre: "02 · BUILD landing restaurante Madrid",
    input: "[BUILD] Crear landing para restaurante en Madrid, menú degustación, reservas vía Cal.com.",
    esperado: { tipo: "BUILD", sector: "restaurantes" },
  },
  {
    nombre: "03 · CLIENTE ecommerce ropa Bogotá",
    input: "[CLIENTE] E-commerce de ropa femenina en Bogotá, vendiendo bien por Shopify pero sin retargeting ni recuperación de carrito abandonado.",
    esperado: { tipo: "CLIENTE", sector: "ecommerce" },
  },
  {
    nombre: "04 · DIAGNOSTICO manufactura Bucaramanga",
    input: "[DIAGNÓSTICO] Fábrica metalmecánica en Bucaramanga, 30 empleados, todo en planillas Excel y WhatsApp, quieren digitalizarse de cero.",
    esperado: { tipo: "DIAGNOSTICO", sector: "manufactura" },
  },
];

const TIER_TO_CELDAS: Record<string, string[]> = {
  ECO: ["A", "B", "C", "D"],
  PRO: ["E", "F", "G", "H"],
  PREMIUM: ["I", "J", "K", "L"],
};

const VERBO_INFINITIVO = /\b(agendar|enviar|llamar|cotizar|cerrar|validar|contactar|redactar|preparar|coordinar|programar|presentar|entregar|configurar|implementar|definir|revisar|confirmar|escribir|crear|armar|construir|investigar|escalar|proponer|invitar|solicitar|verificar|firmar|ejecutar|publicar|subir|levantar|montar)\w*/i;

function evaluar(caso: TestCase, r: ProtocoloResult): { ok: boolean; fallos: string[] } {
  const fallos: string[] = [];

  // Clasificación
  if (r.clasificacion.tipo !== caso.esperado.tipo) {
    fallos.push(`clasificacion.tipo: esperaba ${caso.esperado.tipo}, recibí ${r.clasificacion.tipo}`);
  }
  if (r.clasificacion.sector_detectado !== caso.esperado.sector) {
    fallos.push(`clasificacion.sector: esperaba ${caso.esperado.sector}, recibí ${r.clasificacion.sector_detectado}`);
  }

  // Diagnóstico · coherencia tier ↔ celda
  const celdasValidas = TIER_TO_CELDAS[r.diagnostico.tier];
  if (!celdasValidas || !celdasValidas.includes(r.diagnostico.celda_matriz)) {
    fallos.push(`diagnostico: celda ${r.diagnostico.celda_matriz} no coherente con tier ${r.diagnostico.tier}`);
  }
  if (r.diagnostico.costo_operativo_mensual_USD <= 0) {
    fallos.push(`diagnostico: costo_operativo_mensual_USD debería ser >0`);
  }
  if (r.diagnostico.precio_minimo_servicio_USD <= 0) {
    fallos.push(`diagnostico: precio_minimo_servicio_USD debería ser >0`);
  }

  // Ruta A
  if (r.ruta_a_eco.stack.length === 0) fallos.push("ruta_a_eco.stack vacío");
  if (r.ruta_a_eco.precio_USD <= 0) fallos.push("ruta_a_eco.precio_USD <=0");
  if (!r.ruta_a_eco.tiempo_implementacion.trim()) fallos.push("ruta_a_eco.tiempo_implementacion vacío");

  // Ruta B
  if (r.ruta_b_pro.stack.length === 0) fallos.push("ruta_b_pro.stack vacío");
  if (r.ruta_b_pro.precio_USD <= 0) fallos.push("ruta_b_pro.precio_USD <=0");
  if (!r.ruta_b_pro.tiempo_implementacion.trim()) fallos.push("ruta_b_pro.tiempo_implementacion vacío");
  // Ruta B debería ser más cara que Ruta A en general (no es regla dura, solo warning si falla)
  if (r.ruta_b_pro.precio_USD < r.ruta_a_eco.precio_USD) {
    fallos.push(`ruta_b_pro.precio (${r.ruta_b_pro.precio_USD}) < ruta_a_eco.precio (${r.ruta_a_eco.precio_USD}) — sospechoso`);
  }

  // Recomendación
  if (!["A", "B"].includes(r.recomendacion.ruta)) {
    fallos.push(`recomendacion.ruta inválida: ${r.recomendacion.ruta}`);
  }
  if (r.recomendacion.justificacion.length < 20) {
    fallos.push(`recomendacion.justificacion muy corta (${r.recomendacion.justificacion.length} chars)`);
  }

  // Próximo paso · debe empezar con verbo en infinitivo (lista amplia)
  if (!r.proximo_paso.trim()) {
    fallos.push("proximo_paso vacío");
  } else if (!VERBO_INFINITIVO.test(r.proximo_paso)) {
    fallos.push(`proximo_paso no contiene verbo de acción reconocible: "${r.proximo_paso.slice(0, 80)}"`);
  }

  return { ok: fallos.length === 0, fallos };
}

async function main(): Promise<void> {
  console.log(`\n🧠 Test del Protocolo §8 · ${CASOS.length} casos · modelo Sonnet 4.6\n`);

  let okCount = 0;
  let failCount = 0;
  const renders: { caso: string; markdown: string }[] = [];

  for (const caso of CASOS) {
    process.stdout.write(`${caso.nombre.padEnd(50)} ... `);

    try {
      const r = await protocolo(caso.input);
      const { ok, fallos } = evaluar(caso, r);

      if (ok) {
        console.log(
          `✓  tier=${r.diagnostico.tier} N${r.diagnostico.nivel} celda=${r.diagnostico.celda_matriz} ruta=${r.recomendacion.ruta} precio_A=${r.ruta_a_eco.precio_USD} precio_B=${r.ruta_b_pro.precio_USD}`,
        );
        okCount++;
      } else {
        console.log(`✗`);
        for (const f of fallos) console.log(`     · ${f}`);
        failCount++;
      }

      renders.push({ caso: caso.nombre, markdown: render(r) });
    } catch (e) {
      console.log(`✗ ERROR: ${e instanceof Error ? e.message : String(e)}`);
      failCount++;
    }
  }

  console.log(`\n──────────────────────────────────────────────`);
  console.log(`Resultado: ${okCount}/${CASOS.length} OK · ${failCount} fallos`);
  console.log(`──────────────────────────────────────────────\n`);

  console.log("\n========== RENDERS PARA REVISIÓN HUMANA ==========\n");
  for (const { caso, markdown } of renders) {
    console.log(`\n┌─────────────────────────────────────────────────`);
    console.log(`│ ${caso}`);
    console.log(`└─────────────────────────────────────────────────\n`);
    console.log(markdown);
  }

  process.exit(failCount === 0 ? 0 : 1);
}

await main();
```

- [ ] **Step 8.2 — Verificar TypeScript compila**

Run:
```bash
npx tsc --noEmit
```
Expected: sin output.

- [ ] **Step 8.3 — Commit (sin correr todavía · costo ~$0.30, lo separamos del próximo step)**

```bash
git add scripts/anthropic/test-protocolo.ts
git commit -m "test(anthropic): test-protocolo · 4 casos + asserciones estructurales"
```

---

## Task 9 — Correr tests, revisar outputs, iterar si hace falta

**Files:**
- (ninguno modificado · solo ejecución)

- [ ] **Step 9.1 — Correr el test runner**

Run:
```bash
npm run test:protocolo 2>&1 | tee /tmp/test-protocolo-run.log
```
Expected:
- 4/4 OK en asserciones estructurales.
- 4 renders markdown impresos al final.
- Costo: ~$0.30.

- [ ] **Step 9.2 — Revisar visualmente los 4 renders**

Criterios mínimos por output:
- Diagnóstico tiene tier+nivel+celda coherentes con la matriz.
- Ruta A es claramente más barata y limitada que ruta B.
- Recomendación tiene una justificación que cita el caso concreto, no genérica.
- Próximo paso es UNA acción concreta, no una lista.
- Stacks usan herramientas reales del repo (Make, Airtable, Shopify, WhatsApp Cloud API, etc., no inventadas).

Si algo falla → iterar el `buildSystemPrompt` (Task 3) y volver a 9.1.

- [ ] **Step 9.3 — Si todo pasó, commit (no hay cambios de código en este caso, pero reseñamos el resultado)**

Si los renders son buenos y los tests pasan: nada que commitear (ya está todo). Solo registrar en el siguiente paso.

Si hubo iteraciones del prompt:
```bash
git add scripts/anthropic/protocolo.ts
git commit -m "fix(anthropic): refinar system prompt protocolo § <descripción>"
```

---

## Task 10 — Actualizar ESTADO-ACTUAL.md

**Files:**
- Modify: `ESTADO-ACTUAL.md`

- [ ] **Step 10.1 — Actualizar la sección "DÓNDE ESTAMOS"**

Reemplazar el bloque que dice `⏸️ PAUSADO: Fases 1-7…` por:

```markdown
✅ **FASE 1 · CLAUDE API · v0.1 OPERATIVA**
- Clasificador de inputs §7 (Haiku 4.5) · 10/10 tests · commit `48e7d11`
- Protocolo §8 generador (Sonnet 4.6) · 4/4 tests · commit `<HASH>`
- CLI: `npm run clasificar` · `npm run protocolo` · `npm run protocolo -- --json`
- Función exportable: `protocolo(input)` desde `scripts/anthropic/protocolo.ts`

⏸️ **PENDIENTE FASE 1 (post-v0.1)**
- Exponer `protocolo()` como Vercel serverless function `/api/protocolo` (~1h)
- Página `/sandbox` en panel Astro para probar con UI (~1.5h)
- Migrar render a "propuesta-ready" con branding ZENKAI (~30 min)
- Anthropic prompt caching (bajar costo de $0.08 a ~$0.02 por call)

⏸️ **PAUSADO: Fases 2-7** — empezar después de validar Fase 1 en uso real
```

- [ ] **Step 10.2 — Actualizar la sección "QUÉ HACER EN LA NUEVA SESIÓN"**

Reemplazar todo el bloque por:

```markdown
## QUÉ HACER EN LA NUEVA SESIÓN

Fase 1 v0.1 está operativa. Para continuar, opciones:
1. **Path 2 — Endpoint HTTP:** convertir `protocolo()` en Vercel serverless function. Habilita Make/Airtable/landing para llamarlo. ~1h.
2. **Path 3 — UI sandbox:** página `/sandbox` en panel Astro para probar con interfaz. Convierte el panel en herramienta usable. ~1.5h.
3. **Fase 2 — Airtable:** crear las 6 bases internas de ZENKAI y persistir cada call de protocolo en `propuestas`. Empieza la trazabilidad.

Cuando una conexión se active, actualizar el frontmatter:
\`\`\`yaml
# conexiones/conexiones-airtable.md
estado_conexion: activo  # antes era "pendiente"
\`\`\`
```

- [ ] **Step 10.3 — Commit**

```bash
git add ESTADO-ACTUAL.md
git commit -m "docs: cerrar Fase 1 v0.1 en ESTADO-ACTUAL · clasificador + protocolo OK"
```

---

## Criterio de aceptación de la Fase 1

- [ ] `npm run test:clasificar` pasa 10/10 (ya estaba antes de este plan).
- [ ] `npm run test:protocolo` pasa 4/4 asserciones estructurales.
- [ ] Los 4 renders markdown son coherentes y enviables a un cliente real con mínimas ediciones.
- [ ] CLI funciona en modo default (markdown) y `--json`.
- [ ] `protocolo()` es importable y usable desde otro script TypeScript.
- [ ] ESTADO-ACTUAL.md refleja Fase 1 v0.1 cerrada.
- [ ] Todos los commits son atómicos y siguen estilo del repo.

Costo total estimado del plan: ~$0.50 (1 smoke test del clasificador + 1 smoke test del protocolo + 1 corrida de los 4 tests + alguna iteración del prompt si hace falta).
