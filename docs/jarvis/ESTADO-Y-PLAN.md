# ZENKAI · JARVIS — Estado actual y plan maestro
# Prompt de continuidad entre sesiones · v1 · 2026-06-20

> **Cómo usar este documento:** pegalo al inicio de una sesión de Claude Code abierta en la raíz del repo
> (`C:\Users\jordy\Desktop\ZENKAI\Zenkai Super Brain`). Es el estado **verificado** del proyecto y el plan.
> Reglas de trabajo antes de actuar:
> 1. `CLAUDE.md` define la identidad y las reglas de negocio. Esto lo complementa con el estado técnico real.
> 2. **Verificá antes de afirmar.** Análisis automáticos previos se equivocaron en seguridad (dijeron que el
>    `.env` estaba filtrado — es falso). Confirmá contra el código/git antes de dar por cierto algo grave.
> 3. **El cerebro ya está construido.** No lo reconstruyas. El trabajo es cerrar stubs y cablear, no fundar.
> 4. Mantené `npx tsc --noEmit -p tsconfig.json` en verde tras cada cambio.

---

## 1 · Qué es esto

**ZENKAI Growth Systems** — agencia de IA (Pereira, Colombia · 2 personas). Objetivo 2026: **$100.000 USD facturados**
(hoy **0 clientes, $0**). Mercados: LATAM · España · USA. Nicho fase 1: e-commerce.

**JARVIS** es el sistema de control central interno (estilo Iron Man) que **orquesta la agencia de IA de forma
autónoma**: un director (JARVIS) enruta instrucciones a 12 agentes master organizados en departamentos, cada uno
con pipelines reales (marketing, ventas, operaciones, IA, finanzas, estrategia). Se opera por voz, texto y Telegram.

Dos capas que no se confunden (ver `CLAUDE.md §0`): **La Plataforma** (esto) no se vende; **El Servicio** (lo
construido para un cliente con la plataforma) sí.

---

## 2 · Estado verificado — qué FUNCIONA hoy

### 2.1 · Cerebro de la agencia autónoma — `scripts/agency/` ✅ REAL
Esto está construido y es sólido. No es esqueleto.
- **Runtime LLM multi-proveedor** — `llm.ts` · `callAgencyLlm(tier, messages)` enruta DeepSeek ↔ Anthropic
  (Opus/Sonnet/Haiku) con fallback. IDs: `claude-opus-4-7`, `claude-sonnet-4-6`, `claude-haiku-4-5-20251001`,
  `deepseek-chat`.
- **12 agentes + director** — `registry.ts` (ARES, HERMES, ATLAS, NEXUS, APOLLO, MUSE, FORGE, ORACLE, HIVE,
  ECHO, LEX, ZEUS + JARVIS director). Cada agente: departamento, modelo, eventos n8n, MCP servers.
- **`runAgent`** — `agent-runner.ts`: contexto live → LLM → dispatch n8n → crea task en Airtable.
- **Director** — `director.ts` `directorRoute()`: detecta departamento (10) por keywords/tags y enruta al pipeline.
- **Departamentos reales** — `departments/`: marketing (MUSE+ARES), content-batch (con HITL/aprobación),
  marketing-calendar, marketing-publish, sales (HERMES), finance (ORACLE), ia (NEXUS+FORGE), strategy (ZEUS),
  operations (ATLAS).
- **Providers de contenido** — `providers/media.ts` (ElevenLabs TTS · HeyGen video · Higgsfield clip) e
  `image-gen.ts` (Higgsfield Seedream + Gemini Imagen 3, con polling y fallback).
- **Scheduler autónomo** — `scheduler.ts` `runAgencySchedulerTick()` (recap + publica contenido due). Cron Vercel
  3×/día (`vercel.json`) + flow Windmill `f/agency/daily_tick.ts`.
- **Bus de eventos** — `dispatch.ts`: n8n (webhook) + Windmill (job). **Cola HITL** — `jobs.ts` en Airtable.
- **Endpoints HTTP** — `api/agency/*`: status, keys, tasks, calendar, run, director, jobs, marketing/content,
  cron/tick. Auth por origen/bearer/CRON_SECRET.
- **CLI** — `npm run agency:status | keys | director | batch | content | agent | tick`.

### 2.2 · HUD / Command Center — `panel/` (Astro) ✅ funcional, parcialmente live
Dashboard estilo Iron Man en `jarvis.zenkai.systems` (y `panel.zenkai.systems/jarvis`). 10 secciones, ~28
componentes, estética cyan/oscura (`panel/src/styles/jarvis.css`).
- **Live cuando hay datos en Airtable** (`panel/src/lib/jarvis/index.ts`): CRM/pipeline, finanzas, KPIs, intel
  brief (ZEUS), alertas, estado de conexiones. Hoy se ve mock porque hay 0 clientes; se vuelve live solo al cargar
  datos.
- **Mock sin fuente real:** panel de Agentes, Tareas/Kanban, Activity feed, Social (sin token Meta).

### 2.3 · Voz — `panel/public/jarvis-voice.js` ✅ COMPLETA (no decorativa)
910 líneas reales: STT (Web Speech API), wake word con parsing de frases, silence-commit, llamada a
`/api/jarvis/run`, TTS dual (ElevenLabs `/api/jarvis/speak` + fallback navegador), navegación por `action`,
fallback local offline, `window.JarvisVoice` expuesto. Personalidad paisa. Funciona end-to-end en Chrome/Edge.

### 2.4 · Integraciones
- **Airtable** (fuente de verdad): CRM (VENTAS `appmiicsbFsvRfxQ9`), Finanzas, Legal. ✅
- **n8n Cloud**: 4 workflows Sprint 1 válidos (`jarvis/n8n/`): qualify-on-create, demo-autoreply, hot-lead-alert,
  sla-form-3h. ⚠️ Faltan automations Airtable→webhook + cargar variables (`npm run n8n:vars -- --apply`).
- **ElevenLabs**: voz JARVIS-PAISA-ZENKAI, end-to-end. ✅
- **Resend**: email transaccional (M-02/M-04). ✅
- **Meta/Social**: código listo (`scripts/meta/jarvis-social.ts`) pero **sin tokens en Vercel** → panel social en "—".
- **HeyGen / Higgsfield / Gemini**: providers cableados; requieren sus API keys en Vercel para activar.
- **Windmill**: workspace `zenkai`, `daily_tick` corre; `event_handler` es stub (ver §4).
- **Telegram**: `scripts/jarvis/telegram-bridge.ts` (long-polling al orquestador).

### 2.5 · Landing comercial — `web/` (Astro) ✅ production-grade
`zenkai.systems`. Dual-LLM con fallback, rate limit Upstash, captcha Turnstile, persistencia Airtable, ~23 tests
vitest. Endpoint público `/api/lead-demo` (brief → propuesta → Airtable + email). Es lo más maduro del repo.

---

## 3 · Construido en la última sesión (2026-06-20)

Todo verificado: `tsc` en verde + smokes en runtime.
- **Goals reales** — `scripts/agency/departments/operations.ts` · `getOpsGoals()` dejó de devolver ceros fijos:
  deriva progreso del snapshot de finanzas live + posts publicados, status por **ritmo vs tiempo transcurrido**,
  override opcional desde tabla Airtable `Goals`. (Smoke: revenue "esperado 47% del año", contenido "65% del mes").
- **Providers endurecidos** — `media.ts` e `image-gen.ts`: timeout en todos los `fetch` (`providers/http.ts`
  `fetchWithTimeout`); nuevo recolector **`pollHeyGenVideo`** que cierra el ciclo del video (antes quedaba en
  "processing" sin recuperar la URL); `runMediaPipeline` acepta `awaitVideoMs`.
- **`.env.example`** — añadidas `AIRTABLE_TABLE_JOBS`, `AIRTABLE_TABLE_GOALS` (con doc de columnas).
- **4 errores de `tsc` preexistentes** arreglados (`agency/cli.ts`, `jarvis/create-jarvis-paisa-voice.ts`,
  `n8n/setup-variables.ts`, `windmill/sync.ts`). `sync.ts` reescrito con `spawnSync` + allowlist (evita inyección
  por shell). **Typecheck en verde de punta a punta.**

---

## 4 · Gaps reales — qué falta o es stub

| # | Gap | Archivo | Para qué sirve cerrarlo |
|---|-----|---------|-------------------------|
| 1 | `event_handler` de Windmill solo loggea | `f/agency/event_handler.ts` | Autonomía durable que sobrevive reinicios; recoger videos HeyGen pendientes (`pollHeyGenVideo` ya existe) |
| 2 | Panel **Agentes** es mock | `panel/src/pages/jarvis/agentes.astro` | Cablear a `/api/agency/status` (ya devuelve agentes+proveedores) |
| 3 | Panel **Tareas/Goals** es mock | `panel/src/pages/jarvis/{tareas,goals}.astro` | Cablear a `/api/agency/tasks` (ya devuelve tasks+goals reales) |
| 4 | **Activity feed** vive en localStorage | panel + orquestador | Persistir runs/ticks y exponerlos para auditoría |
| 5 | `runForgeDevTask` solo encola | `departments/ia.ts` | Ejecutar tareas dev (HITL por seguridad) |
| 6 | Sin feedback loop de métricas ni memoria entre ticks | scheduler | Que la creatividad mejore según engagement |
| 7 | Social en "—" | Vercel env | Configurar `META_ACCESS_TOKEN` + IDs |
| — | Duplicación de orquestador `web/` vs `api/jarvis/` | ambos | Unificar lógica compartida (propuesta/voz/n8n) |

---

## 5 · Seguridad — acción requerida

- ✅ **El `.env` está bien protegido.** Está en `.gitignore` (línea 2) y **nunca estuvo en el historial de git**.
  No revoques claves en pánico por esto.
- 🔴 **`Juana Sanchez/API keys/RESEND.txt` tiene una clave Resend real commiteada** (desde commit `0ccc576`).
  Acción: revocar esa key, quitarla del historial (`git filter-repo` / BFG), añadir `**/API keys/` al `.gitignore`.
- 🔴 **Token de Windmill** fue pegado en el chat → **rotarlo** (Windmill → Settings → Tokens → revoke + new).
- 🧹 Sacar los clientes (`Juana Sanchez/`, `Hegde Fund Manager AI/`, `Midas/`) a sus propios repos. Y purgar
  `.smart-env/` del árbol (indexa `node_modules`, miles de `.ajson` de ruido).

---

## 6 · Plan A — Agencia autónoma (cerrar para que "trabaje sola")

Orden sugerido (bloques verticales, cada uno verificado con `tsc` + smoke):
1. **Windmill `event_handler` durable** — router de eventos que ejecuta/encola trabajo real y recoge videos
   HeyGen pendientes vía `pollHeyGenVideo`. Endurecer `scripts/windmill/sync.ts`.
2. **Conectar HUD a datos reales** — Agentes → `/api/agency/status`; Tareas/Goals → `/api/agency/tasks`; volver
   verdes las cajas mock del panel.
3. **Activity feed real** — persistir runs del orquestador + ticks del scheduler (Airtable o Vercel KV) y leerlos.
4. **Activar IAs de contenido** — cargar en Vercel: `HEYGEN_API_KEY`/`HEYGEN_AVATAR_ID`/`HEYGEN_VOICE_ID`,
   `HIGGSFIELD_API_KEY`(+SECRET), `GEMINI_API_KEY`, `META_ACCESS_TOKEN`+IDs. Smoke por proveedor.
5. **Higiene de secretos** (§5) — antes de cualquier difusión del repo.

Norte: lead entra → cualifica (HERMES) → contenido (MUSE+APOLLO, HITL) → publica (calendario+Meta) → recap diario
(scheduler) → todo visible en el HUD y auditable en el feed.

---

## 7 · Plan B — Terminal REPL de Jarvis (diseño aprobado en brainstorming)

Decisiones tomadas (sesión 2026-06-20, vía skill brainstorming):
- **Qué es:** transformar la consola de voz en una **terminal REPL de verdad**.
- **Dónde:** **página full-screen dedicada** `panel/src/pages/jarvis/terminal.astro` (ruta `/terminal` en el
  subdominio jarvis); el orb de voz sigue disponible en el resto del HUD.
- **Capacidades (las 4):** (a) lenguaje natural → orquestador `/api/jarvis/run`; (b) slash-commands con
  autocompletado (`/finanzas /pipeline /agentes /run /agente /clear /help`); (c) historial navegable ↑↓
  (localStorage); (d) **salida rica** (tarjetas KPIs, estado de run con badges modelo/tier/fuente, links de
  navegación, errores formateados).
- **Arquitectura:** patrón del panel — Astro + script vanilla `panel/public/jarvis-terminal.js`. Reusa
  `window.JarvisVoice` y `/api/jarvis/run`. **Sin** framework island.
- **Módulos:** `parseInput` (puro) · registro de slash-commands · render de salida (tipos: user/reply/card-kpis/
  run-status/nav-link/error) · historial · autocompletado · bridge al orquestador.
- **Pendiente:** escribir el spec en `docs/superpowers/specs/2026-06-20-terminal-jarvis-design.md`, luego
  `writing-plans`, luego ejecutar con **subagent-driven-development** (implementer + spec review + code-quality
  review por tarea).

---

## 8 · Stack, comandos y rutas

- **Proyectos Vercel:** `zenkaibrain` (panel HUD, root `panel/`) · `zenkai-web` (landing, root `web/`). API
  serverless en `api/` (raíz). ⚠️ Deuda: el root de `zenkaibrain` apunta a la raíz del repo (legado).
- **Dominios:** `jarvis.zenkai.systems` (HUD) · `panel.zenkai.systems/jarvis` (HUD) · `zenkai.systems` (landing).
- **GitHub:** `HaxelGG/zenkai-super-brain` (cuenta `gh` activa: `HaxelGG`; commits firman como Jordy
  `<jordycapital@gmail.com>`).
- **Comandos clave:**
  `npm run agency:status` · `agency:director -- "…"` · `agency:tick` ·
  `npm run n8n:vars -- --apply` · `npm run wmill:pull|push` ·
  `npx tsc --noEmit -p tsconfig.json` (typecheck scripts+api).
- **Verificación rápida del cerebro:** `npm run agency:status` (lista director, 12 agentes, auditoría de keys).

---

## 9 · Reglas de trabajo

1. **Verificar > asumir.** Especialmente en seguridad y en "qué ya existe" (el sistema está más construido de lo
   que parece).
2. **Stack mínimo necesario** para el resultado máximo (CLAUDE.md). No introducir tecnologías nuevas si el patrón
   existente (Astro + vanilla, fetch directo a Airtable, `callAgencyLlm`) resuelve.
3. **`tsc` verde** y smoke tras cada bloque.
4. Bloques verticales que funcionen de verdad, no features a medias en paralelo.
5. Revisar versiones de modelos al activar producción (el código usa `claude-opus-4-7`/`sonnet-4-6`; confirmar
   vigencia antes de escalar gasto).

---

ZENKAI Growth Systems · JARVIS · estado verificado 2026-06-20 · "La plataforma primero. El servicio después."
