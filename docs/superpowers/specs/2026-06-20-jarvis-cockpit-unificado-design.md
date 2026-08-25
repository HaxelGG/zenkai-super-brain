# Fase 1 · Cockpit JARVIS unificado — Diseño

- **Fecha:** 2026-06-20
- **Branch base:** `feat/jarvis-terminal-repl`
- **Fase:** 1 de 3 (plan maestro: Cockpit → Loop aprobación→build → Automatización viva)
- **Estado:** aprobado el alcance, pendiente revisión del spec

---

## 1 · Contexto y problema

El motor de la agencia ya está construido: clasificador (`scripts/anthropic/clasificar.ts`),
director con ruteo por keywords/tags (`scripts/agency/director.ts`), 12 agentes
(`scripts/agency/registry.ts`), router LLM dual DeepSeek/Anthropic (`scripts/agency/llm.ts`),
y la cola HITL en Airtable (`scripts/agency/jobs.ts`) con su endpoint HTTP
`POST /api/agency/jobs` (`scripts/api/routes/agency.ts:195`).

El problema **no es falta de motor — es falta de una cabina**. El flujo que describe el founder
(*hablo → JARVIS clasifica con DeepSeek+MCPs → propone → apruebo/rechazo → ejecuta*) hoy está
repartido en tres frontends que no comparten design system:

- `panel/` — Command Center (dashboard de ops, ya vivo en panel.zenkai.systems/jarvis)
- `panel/src/pages/jarvis/terminal.astro` — REPL nuevo (este branch)
- `web/` — landing pública + consola de propuestas

Ninguno muestra el flujo **entero y en vivo**, con la compuerta de aprobación humana visible
como paso de primera clase.

## 2 · Objetivo de la Fase 1

Construir **un cockpit conversacional único** en `panel/` que exponga el pipeline completo en
una sola pantalla, responsive y animada, reutilizando el motor existente. El founder escribe (o
dicta) una instrucción y ve cómo atraviesa cinco etapas, con un **gate HITL** donde aprueba o
rechaza antes de cualquier ejecución.

### No-goals (fuera de la Fase 1)

- **Ejecución real de proyectos de software** (scaffold de landing/repo). Eso es Fase 2
  (`PROJECT_BUILD`). En Fase 1, "aprobar" reusa el camino de ejecución que ya existe
  (`executeApprovedJob`, hoy contenido→Instagram); para jobs de tipo propuesta, aprobar marca
  el job como aprobado sin publicar nada.
- **Poblar Windmill / cablear keys de producción / deploy E2E.** Eso es Fase 3.
- **Eliminar el dashboard o la landing.** El dashboard se re-homologa a `/jarvis/resumen` dentro
  del mismo shell (no se elimina); la landing `web/` queda intacta. No se reescribe cada sub-página
  del panel — se reusa el shell/sidebar existente (YAGNI — no romper lo que funciona).

## 3 · Arquitectura

El cockpit es un **cliente delgado sobre endpoints serverless ya existentes**. El único agregado
de backend es el endpoint `plan` (clasifica + propone + crea job, sin ejecutar).

```
┌─────────────────────── panel.zenkai.systems ───────────────────────┐
│  /jarvis  (home - shell unico: topbar + sidebar + cockpit al centro)│
│                                                                     │
│   etapa 1 Input ─▶ etapa 2 Clasificación+ruteo ─▶ etapa 3 Propuesta │
│                          │                              │           │
│                          ▼                              ▼           │
│                  POST /api/agency/plan  ◀── (nuevo, no ejecuta)     │
│                                                                     │
│   etapa 4 Gate HITL ──▶ Aprobar / Rechazar                          │
│                          │                                          │
│                          ▼                                          │
│                  POST /api/agency/jobs  ◀── (YA EXISTE)             │
│                          │                                          │
│   etapa 5 Ejecución ◀────┘   (reusa executeApprovedJob / rejectJob) │
└─────────────────────────────────────────────────────────────────────┘
        │ importa (process.env, serverless)
        ▼
  scripts/agency/plan.ts  → clasificar() + callAgencyLlm() + createJob()
  scripts/agency/jobs.ts  → createJob / getJob / updateJob (Airtable HITL)
```

Routing (confirmado en `vercel.json`): `/api/agency/:path*` → `api/agency.ts` →
`handleAgencyRoute` que hace `switch` por subpath. Agregamos un `case "plan"`.

## 4 · Componentes

### 4.1 Frontend — cockpit (nuevo)

| Unidad | Archivo | Qué hace | Depende de |
|--------|---------|----------|------------|
| Home (shell único) | `panel/src/pages/jarvis/index.astro` | Página principal: reusa layout/sidebar del panel, cockpit al centro (5 etapas + input, inyecta `__JV_ROUTES`). El dashboard del index actual se mueve a `jarvis/resumen.astro` | layout del panel, `jarvis.css` |
| Controlador | `panel/src/lib/jarvis/cockpit/main.ts` | Orquesta el flujo en el cliente: submit → `plan` → render etapas → gate → `jobs` | `api.ts`, `stages.ts` |
| Render etapas | `panel/src/lib/jarvis/cockpit/stages.ts` | Funciones puras que pintan cada etapa (clasificación, propuesta, gate, ejecución) a partir de la respuesta | DOM |
| Cliente API | `panel/src/lib/jarvis/api.ts` | **Extraído** de `terminal/main.ts`: `apiBase()`, `authHeaders()`, `fetchWithTimeout()`. Compartido cockpit+terminal | localStorage keys |
| Estilos | `panel/src/styles/jarvis.css` (extiende) | Clases `.jvc-*` reusando tokens HUD (`--jv-cyan/-blue/-gold`, glass) | — |

**Decisión:** extraer `api.ts` evita duplicar la lógica de auth/timeout que hoy vive embebida en
`terminal/main.ts:61-86`. El terminal se refactoriza para importar de `api.ts` (cambio quirúrgico).

### 4.2 Backend — `plan` (nuevo)

- **Módulo:** `scripts/agency/plan.ts`
  ```ts
  export interface PlanResult {
    classification: { tipo: string; sector: string; departamentos: string[];
                      agentes: string[]; confianza: number; razonamiento: string };
    proposal: { headline: string; dolor_identificado: string; solucion: string;
                agentes_activos: string[]; stack: string[]; timeline_dias: number;
                inversion_mensual_usd: number; proyeccion_90d: string; tier_recomendado: string };
    job: { id: string; status: "pending_approval"; intent: "PROJECT_PROPOSAL" };
  }
  export async function planProject(instruction: string): Promise<PlanResult>;
  ```
  Pasos internos: (1) `clasificar(instruction)` o `callAgencyLlm` para clasificar; (2)
  `callAgencyLlm` (DeepSeek-capable) con el prompt/esquema de propuesta reusado de
  `web/src/lib/proposal.ts`, adaptado a `process.env`; (3) `createJob({ intent:"PROJECT_PROPOSAL",
  status:"pending_approval", instruction, client_slug:"zenkai", channel:"n/a", topic: headline,
  count:0, agents: agentes_activos, risk_level: derivado, artifacts: { proposal, classification } })`.
  **No ejecuta nada.**

- **Ruta:** `case "plan": return handlePlan(req, res)` en `scripts/api/routes/agency.ts`.
  `POST /api/agency/plan`, auth `allowOrchestratorRequest` (Bearer `ZENKAI_API_KEY`), body
  `{ instruction: string }`. Valida no-vacío → `planProject` → 200 `{ ok:true, ...PlanResult }`.

- **DeepSeek primero:** el paso de propuesta usa `callAgencyLlm`, que ya resuelve
  DeepSeek/Anthropic por `process.env` (honra "usa la LLM, API de DeepSeek"). Si solo hay
  DeepSeek, la clasificación también debe ir por `callAgencyLlm` (no por el `clasificar()` que
  asume Anthropic Haiku) — ver Decisión D2.

### 4.3 Backend — reusado sin cambios

- `POST /api/agency/jobs` `{ action:"approve"|"reject", jobId, reason? }` — el gate HITL.
- `scripts/agency/jobs.ts` — `createJob`, `getJob`. Degradación a mock sin `AIRTABLE_TOKEN`.
- `scripts/agency/llm.ts` — `callAgencyLlm`. `scripts/anthropic/clasificar.ts` — clasificación.

## 5 · Flujo de datos (5 etapas)

1. **Input** — textarea (texto; el mic existente del panel puede emitir `jarvis-voice-command`).
2. **Clasificación** — `POST /api/agency/plan` devuelve `classification`; se pintan badges de
   tipo/sector/departamentos/agentes + barra de confianza.
3. **Propuesta** — del mismo response `proposal`; headline + grid (tier, timeline, inversión,
   proyección) + chips de stack.
4. **Gate HITL** — botones Aprobar/Rechazar sobre `job.id`. Nada se ejecutó aún.
5. **Ejecución** — al aprobar: `POST /api/agency/jobs {action:"approve", jobId}` y se hace
   streaming del estado del job (`getJob` polling o el resultado directo); al rechazar:
   `{action:"reject", jobId, reason}` y la etapa queda marcada como rechazada.

## 6 · Contratos de API

**`POST /api/agency/plan`** → `200`:
```json
{ "ok": true,
  "classification": { "tipo":"CLIENTE","sector":"salud","departamentos":["Operaciones","IA"],
                      "agentes":["ATLAS","NEXUS"],"confianza":0.86,"razonamiento":"..." },
  "proposal": { "headline":"...","dolor_identificado":"...","solucion":"...",
                "agentes_activos":["ATLAS","NEXUS"],"stack":["WhatsApp API","Cal.com"],
                "timeline_dias":21,"inversion_mensual_usd":900,"proyeccion_90d":"...",
                "tier_recomendado":"Growth" },
  "job": { "id":"recXXX","status":"pending_approval","intent":"PROJECT_PROPOSAL" } }
```
Errores: `400` instruction required · `401/403` auth · `502` LLM caído (con mensaje claro) ·
`200` con `job.id` mock si no hay `AIRTABLE_TOKEN`.

**`POST /api/agency/jobs`** (existente): `{action,jobId,reason?}` → `{ok:true,...}`.

## 7 · Diseño visual e interacción

- **Piel:** tokens HUD existentes (`jarvis.css`): fondo `#030810`, cyan `#00d4ff`, azul `#1e6fff`,
  oro `#ffb800`, Orbitron para títulos, glass `backdrop-filter`. No se inventa estética nueva.
- **Layout:** mobile-first. <720px las etapas se apilan (timeline vertical). ≥720px, timeline a la
  izquierda + detalle a la derecha (o stepper vertical ancho). Sin overflow horizontal 360→1440px.
- **Animación:** cada etapa transiciona idle→activa(pulse)→hecha; la línea conectora se "llena" al
  avanzar. Reusa `jv-fade-in`. **`prefers-reduced-motion: reduce` desactiva pulsos y transiciones.**
- **Estados:** loading por etapa, error inline por etapa, gate con foco accesible en los botones.

## 8 · Manejo de errores y degradación

- Sin `ZENKAI_API_KEY` (401/403): mensaje + CTA para pegar la key (mismo patrón que el terminal,
  `main.ts:100`).
- LLM caído: la etapa de propuesta muestra error, no rompe la clasificación ya pintada.
- Sin `AIRTABLE_TOKEN`: `createJob` devuelve job mock (`jobs.ts:120`); el gate funciona en modo
  demo y se rotula como tal.
- Timeout de red: `fetchWithTimeout` (45s plan, 60s approve) con mensaje "sin conexión con el
  cerebro JARVIS".

## 9 · Auth y variables de entorno

- Auth cliente: Bearer desde `localStorage` (`zenkai_jarvis_api_key` / `zenkai_api_key`).
- Server: `ZENKAI_API_KEY` (auth) · `DEEPSEEK_API_KEY` **o** `ANTHROPIC_API_KEY` (LLM) ·
  `AIRTABLE_TOKEN` (HITL, opcional → mock). Todas ya usadas en el repo; no se agregan nuevas.

## 10 · Testing

- `scripts/agency/plan.test.ts` — `planProject` con `callAgencyLlm`/`clasificar`/`createJob`
  mockeados: valida shape de `PlanResult`, que NO se llame ninguna ruta de ejecución, y el
  fallback a mock sin token. (Patrón de los tests de `web/src/pages/api/*.test.ts`.)
- Test del handler `plan`: 400 sin instruction, 401 sin auth, 200 shape OK.
- Lógica pura de `stages.ts` testeable sin DOM pesado (entrada response → estructura de bloques).
- Gates verdes: `cd panel && npm run build` (astro check) y `npx tsc --noEmit` en root.

## 11 · Consolidación: una página principal para todo (hub único)

La cara principal es **una sola página**: el Command Center en `/jarvis`, dentro de un **shell
compartido** (topbar + sidebar + área principal) que reusa el layout/sidebar que el panel ya tiene.

- **`/jarvis` (home)** = el **cockpit** es el centro de la página principal (input → 5 etapas →
  gate HITL → ejecución).
- **Sidebar** = un solo menú a todo: Pipeline, Clientes, Finanzas, Jobs HITL, Agentes, Sistemas,
  Social, Tareas, Resumen, Terminal. Misma estética, sin islas.
- El dashboard de KPIs/brief que hoy vive en el index de `/jarvis` se mueve a **`/jarvis/resumen`**
  (mismo shell) y se enlaza desde el sidebar; el home pasa a ser el cockpit.
- **`/jarvis/terminal`** = ítem "Terminal" del sidebar (modo avanzado); comparte `api.ts`.
- **`web/`** = intacto (landing pública), fuera del hub.

No se reescribe cada página: se reusa el shell existente y se re-homologa la navegación. Pulir las
sub-páginas restantes al mismo nivel es trabajo incremental dentro del mismo shell.

## 12 · Criterios de aceptación

1. `/jarvis` (home, shell único) renderiza el cockpit al centro con topbar + sidebar; responsive
   360→1440px, sin scroll horizontal. Todo (pipeline, clientes, finanzas, jobs, agentes, social,
   terminal, resumen) es alcanzable desde el sidebar.
2. Escribir una instrucción + "Procesar" llama `POST /api/agency/plan` y muestra clasificación y
   propuesta en etapas animadas. **No ejecuta nada** (verificable: no se crea contenido ni se
   publica).
3. El gate muestra Aprobar/Rechazar; Aprobar → `jobs {action:"approve"}`, Rechazar →
   `{action:"reject",reason}`; el estado del job se refleja en la etapa 5.
4. Sin keys (Airtable/LLM) degrada con mensajes claros y modo demo, sin crashear.
5. `prefers-reduced-motion` respetado.
6. Sin `ZENKAI_API_KEY` → 401 manejado con CTA para pegar la key.
7. Tests de `planProject` y del handler en verde; build del panel y typecheck root en verde.
8. Cross-links cockpit ↔ terminal ↔ dashboard; `web/` sin cambios.

## 13 · Decisiones abiertas

- **D1 — Almacenamiento de la propuesta en el job.** `JobArtifacts` está tipado para contenido
  (`posts[]`). Para guardar `{proposal, classification}` extendemos `JobArtifacts` con campos
  opcionales `proposal?` / `classification?` y los serializamos en `artifacts_json`.
  Recomendado: extender el tipo (mínimo, retrocompatible).
- **D2 — Clasificación con DeepSeek-only.** `clasificar()` asume Anthropic. Para un deploy
  DeepSeek-only, `planProject` debe clasificar vía `callAgencyLlm`. Recomendado: clasificación y
  propuesta ambas por `callAgencyLlm`; dejar `clasificar()` como camino alternativo Anthropic.
- **D3 — Ejecución de jobs `PROJECT_PROPOSAL` al aprobar.** En Fase 1, aprobar un job de propuesta
  solo cambia el estado (no hay build real aún). Definir si `executeApprovedJob` ignora intents no-
  contenido o si se agrega un short-circuit. Recomendado: short-circuit que marca aprobado y
  devuelve `{ built:false, phase:"2-pending" }`.

## 14 · Riesgos

- Duplicar el prompt de propuesta (web vs scripts) puede divergir. Mitigación: extraer prompt/
  esquema a un módulo compartido o documentar la fuente de verdad en ambos lados.
- El cockpit toca `terminal/main.ts` al extraer `api.ts`; riesgo de regresión en el terminal.
  Mitigación: refactor mínimo + verificación manual del terminal.
