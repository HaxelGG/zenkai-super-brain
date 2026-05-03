# Fase 1 · Protocolo §8 (cliente) · Diseño

**Fecha:** 2026-05-03
**Autor:** Jordy + Claude Opus 4.7
**Estado:** aprobado · pendiente de plan de implementación
**Sucesor de:** clasificador de inputs (commit `48e7d11`)

---

## Contexto

Fase 1 del Super Cerebro ZENKAI fue definida en `ESTADO-ACTUAL.md` como:

> Crear primer agente que efectivamente llame a Claude · construir endpoint o función que use el API key · probar con un caso real.

Ya está construido el clasificador de inputs (`scripts/anthropic/clasificar.ts`, 10/10 tests OK). El clasificador es preámbulo: clasifica el input pero no lo responde.

Este spec define **el siguiente eslabón**: el agente que toma un input clasificado como `[CLIENTE]`, `[BUILD]` o `[DIAGNÓSTICO]` y devuelve la respuesta canónica del Super Cerebro según el **Protocolo §8 de CLAUDE.md** (clasificación → diagnóstico → ruta A Eco → ruta B Pro → recomendación → próximo paso).

Este es el **corazón del Super Cerebro** según CLAUDE.md: la respuesta de "dos rutas + recomendación" es la regla #1 inquebrantable de la sección 6.

---

## Alcance v0.1

### Dentro

- Función `protocolo(input, classification?)` que devuelve `ProtocoloResult` JSON.
- Función pura `render(result): string` que convierte `ProtocoloResult` a markdown debug-friendly (6 secciones `## PASO N`, una debajo de otra).
- Helper `contexto.ts` para cargar dinámicamente:
  - El módulo de sector relevante (`sectores/<sector>.md`).
  - Los stacks `finanzas/stack-eco.md` y `finanzas/stack-pro.md`.
- Test runner con 4 casos representativos + asserciones estructurales automáticas.
- CLI runner para uso directo: `npm run protocolo -- "[CLIENTE] ..."`.

### Fuera

- Endpoint HTTP (Vercel function) — Fase 1 cierra como CLI; HTTP es Path 2 separado.
- Integración con panel Astro UI — no se toca el panel en este alcance.
- Generación de PDF / propuesta-ready visual — el render es debug-friendly, no listo-para-cliente. Migrar a propuesta visual es trabajo posterior (~30 min cuando el JSON esté validado).
- Persistencia en Airtable — Fase 2.
- Caching de prompts (Anthropic prompt caching) — optimización posterior. Para v0.1 priorizamos correctness sobre eficiencia de tokens.
- Soporte para inputs fuera de `[CLIENTE]/[BUILD]/[DIAGNÓSTICO]` — `[CONSULTA]`, `[INTERNO]`, `[ESTRATEGIA]`, etc. usan otro flujo (no §8).

---

## Arquitectura

```
scripts/anthropic/
├── client.ts            (existente)
├── types.ts             (existente)
├── clasificar.ts        (existente)
├── test-clasificar.ts   (existente)
│
├── contexto.ts          ← NUEVO · helpers de carga de archivos del repo
├── protocolo.ts         ← NUEVO · función + render() + CLI runner
└── test-protocolo.ts    ← NUEVO · 4 casos + asserciones
```

### Flujo

```
input (string)
   │
   ├─ extractTag()                                  [puro · síncrono]
   │
   ├─ clasificar(input) → ClasificacionResult       [Haiku 4.5]
   │
   ├─ loadSectorContext(sector_detectado)           [I/O síncrono]
   ├─ loadStackContext()                            [I/O síncrono]
   │
   ├─ buildSystemPrompt(sector, stacks)             [puro]
   │
   ├─ Sonnet 4.6 + json_schema → ProtocoloResult    [LLM call]
   │
   └─ render(result): string                        [puro · markdown]
```

### Composición con clasificador

`protocolo()` acepta `classification` como segundo parámetro opcional. Si se omite, llama a `clasificar()` internamente. Esto permite:

1. Composición simple: `await protocolo(input)` — caso de uso normal.
2. Reutilización: si ya se clasificó (ej. en un router), pasar el resultado para evitar segundo call al API.

---

## Tipos

### ProtocoloResult

```typescript
interface ProtocoloResult {
  clasificacion: ClasificacionResult;  // del clasificador
  diagnostico: {
    tier: 'ECO' | 'PRO' | 'PREMIUM';
    nivel: 1 | 2 | 3 | 4;
    celda_matriz: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L';
    costo_operativo_mensual_USD: number;
    costo_operativo_mensual_COP: number;
    precio_minimo_servicio_USD: number;  // costo trimestral × 2
    precio_minimo_servicio_COP: number;
  };
  ruta_a_eco: {
    stack: string[];                  // ["Make Free", "Airtable Free", ...]
    agentes_activos: string[];        // ["HERMES", "ATLAS"]
    limitaciones: string[];
    tiempo_implementacion: string;    // "5-7 días"
    precio_USD: number;
    precio_COP: number;
  };
  ruta_b_pro: {
    stack: string[];
    agentes_activos: string[];
    capacidades_extra: string[];      // qué da B que A no da
    tiempo_implementacion: string;
    precio_USD: number;
    precio_COP: number;
  };
  recomendacion: {
    ruta: 'A' | 'B';
    justificacion: string;
  };
  proximo_paso: string;               // empieza con verbo de acción
}
```

### JSON Schema

Mismo enfoque que el clasificador: schema TypeScript-as-const con `additionalProperties: false` en cada object, enums donde aplica, todos los campos `required`. Pasado a `output_config.format.json_schema` para validación estructural por la API.

---

## System prompt · estructura

El system prompt se ensambla dinámicamente:

```
[STATIC]   Identidad del Super Cerebro + §8 protocolo + matriz de decisión + reglas inquebrantables
[STATIC]   Definición precisa de cada campo del JSON output
[STATIC]   stack-eco.md (132 líneas)
[STATIC]   stack-pro.md (218 líneas)
[DYNAMIC]  módulo del sector_detectado (~150 líneas si != "ninguno", omitido si "ninguno")
```

Total estimado: ~13k tokens input, ~3k tokens output → ~$0.08 por call (Sonnet 4.6).

---

## Testing

### Casos (4)

| # | Tipo input | Sector | Empresa | Por qué se eligió |
|---|-----------|--------|---------|-------------------|
| 1 | `[CLIENTE]` | salud | Clínica dental Medellín, 4 odontólogos, agendamiento WA manual | Caso clásico CLIENTE en sector prioritario fase 2 |
| 2 | `[BUILD]` | restaurantes | Landing restaurante Madrid, menú degustación, reservas Cal.com | BUILD concreto + mercado España (multiplicador ×1.8-2.5) |
| 3 | `[CLIENTE]` | ecommerce | Ropa femenina Bogotá, Shopify, ventas crecientes pero sin retargeting | Sector prioritario fase 1 |
| 4 | `[DIAGNÓSTICO]` | manufactura | Fábrica Bucaramanga 30 empleados, todo en papel | DIAGNÓSTICO + sector no-prioritario para validar generalización |

### Asserciones estructurales (gate de tests)

- Los 6 campos top-level presentes y no-vacíos.
- `diagnostico.tier ∈ {ECO, PRO, PREMIUM}` y `nivel ∈ {1,2,3,4}` y `celda_matriz` válida.
- `ruta_a_eco.stack.length > 0` y `precio_USD > 0` y `tiempo_implementacion` no vacío.
- Mismo para `ruta_b_pro`.
- `recomendacion.ruta ∈ {A, B}` y `justificacion.length > 20` (más que un "sí").
- `proximo_paso` no vacío y tiene al menos una palabra en infinitivo (regex amplia, ej. `\b(agendar|enviar|llamar|cotizar|cerrar|...)\b`).
- Coherencia: si tier="ECO", celda_matriz ∈ {A,B,C,D}; si "PRO" ∈ {E,F,G,H}; si "PREMIUM" ∈ {I,J,K,L}.

### Calidad de contenido (revisión humana)

Después de que pasen las asserciones, se imprimen los 4 outputs renderizados a markdown y el usuario los inspecciona visualmente. Criterio: ¿es algo que se podría usar para enviar a un cliente real con mínimas ediciones humanas?

### Costo total de ejecución

~$0.30 por corrida completa de los 4 tests.

---

## CLI

```bash
npm run protocolo -- "[CLIENTE] Tengo una clínica dental en Medellín..."
npm run test:protocolo
```

Salida del CLI: el render markdown directo a stdout. JSON crudo si se pasa `--json`.

---

## Manejo de errores

- **Clasificador falla** → propagar el error con contexto (`Error("Clasificación falló: <reason>")`); no se invoca a Sonnet.
- **Sonnet devuelve JSON malformado** → la API ya lo evita con `output_config.format.json_schema`. Si llega a pasar (caso adversarial), capturar `JSON.parse` y lanzar `Error("Respuesta de Sonnet no parseable: <texto>")`.
- **Coherencia tier↔celda violada en output del modelo** → no se silencia; se loguea como warning en stderr y el JSON se devuelve igual. Las asserciones del test runner lo van a marcar como fallo.
- **Sector loaded falla (archivo no existe)** → fallback a contexto sin sector, log de warning.

---

## Criterio de aceptación de la fase

- [ ] `npm run test:protocolo` pasa 4/4 asserciones estructurales.
- [ ] Los 4 outputs markdown se imprimen sin truncado y se ven coherentes a inspección humana.
- [ ] La función `protocolo()` se puede llamar desde otro script sin side effects.
- [ ] El render markdown tiene los 6 secciones (`## PASO 1` a `## PASO 6`).
- [ ] CLI funciona en modo default (markdown) y `--json`.

---

## Próximos pasos (post-Fase 1)

Una vez aceptado este alcance:
1. Path 2 · exponer `protocolo()` como Vercel serverless function `/api/protocolo` (~1h).
2. Path 3 · página `/sandbox` en panel Astro para probar el cerebro con UI (~1.5h).
3. Migrar render a "propuesta-ready" con branding ZENKAI (~30 min).
4. Anthropic prompt caching para bajar costo per-call de $0.08 a ~$0.02.
5. Persistencia: cada call se loguea a Airtable base `VENTAS.propuestas` (Fase 2).
6. Construir el siguiente agente: ARES (campañas) o ZEUS (decisiones N3-N4).
