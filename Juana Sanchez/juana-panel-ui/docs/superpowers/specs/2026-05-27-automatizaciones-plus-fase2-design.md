# Automatizaciones+ Fase 2 (disparos automáticos) — Panel Grupo Juana Sánchez

**Fecha:** 2026-05-27
**Estado:** Diseño aprobado · pendiente de plan
**Módulo:** ampliación de `/automatizaciones` (Fase 1 = panel de control de n8n, ya en producción).
**Reparto/numeración:** YO (terminal de módulos). Migraciones en mi bloque **0042–0049**.

---

## 1. Contexto y objetivo

Fase 1 dejó: registrar flujos n8n, dispararlos **a mano** y registrar ejecuciones (`automation_flows`,
`automation_runs`, callback por token). Fase 2 añade **disparos automáticos**: que un flujo se lance
solo cuando ocurre un evento de negocio o por horario. El panel no tiene bus de eventos hoy.

**Decisión clave (brainstorming 2026-05-27):** **evaluación programada por cron.** Un endpoint
`/api/automatizaciones/cron` (protegido por secreto) evalúa periódicamente los disparadores
configurados y lanza el flujo correspondiente. Desacoplado, capta cambios vengan de donde vengan, y da
"programado" gratis. Latencia = intervalo del scheduler (p.ej. 15 min), suficiente para estos eventos.

## 2. Stack y patrón

- **Next.js 16 + Supabase + Vercel.** Nuevo: un route handler de cron + un cliente Supabase
  **service-role** para el job backend (corre sin sesión).
- Namespace `automatizaciones` (extiende Fase 1). Reutiliza `automation_flows`/`automation_runs` y el
  patrón de disparo (refactor de `triggerFlow` → helper compartido `dispatchFlow`).
- **NO tocar nav/sidebar** (la página de disparadores cuelga por enlace desde flujos).
- Migraciones `0042` (tablas) + `0043` (RLS).

## 3. Decisiones tomadas (brainstorming 2026-05-27)

| Decisión | Elección |
|---|---|
| Mecanismo | **Cron** que evalúa disparadores y lanza flujos. |
| Eventos v1 | venta `entregada`/`pagada`, `stock_bajo`, `cotizacion_por_caducar`, `clienta_nueva`, `cotizacion_aceptada`, `tarea_vencida`. |
| Programados | **Sí** (presets `daily`/`weekly`), mismo cron. |
| Dedup | **fire-once por (trigger, entidad)**; **baseline** al crear (siembra coincidencias actuales → solo dispara futuras). |
| Acceso del cron | Cliente **service-role** (`SUPABASE_SERVICE_ROLE_KEY`), endpoint protegido por `CRON_SECRET`. |
| Scheduler | Endpoint agnóstico: **Vercel Cron** (`vercel.json`) o, recomendado/plan-independiente, un **workflow programado de n8n** que llame al endpoint. |

## 4. Modelo de datos (migraciones 0042/0043)

### 4.1 `automation_triggers`
- `id` uuid pk · `kind` text not null (`event` | `schedule`)
- `event_type` text (uno del catálogo; null si schedule)
- `schedule` text (`daily` | `weekly`; null si event)
- `flow_id` uuid not null → `automation_flows(id)` on delete cascade
- `enabled` boolean not null default true
- `last_run_at` timestamptz (dedup de programados)
- `created_at` / `updated_at` timestamptz not null default now()

### 4.2 `automation_trigger_fires` (dedup de eventos)
- `id` uuid pk · `trigger_id` uuid not null → `automation_triggers(id)` on delete cascade
- `entity_id` text not null · `fired_at` timestamptz not null default now()
- **unique (trigger_id, entity_id)**

### 4.3 RLS (`0043`)
RLS owner-only (`is_owner()`) en ambas (para la UI). El cron usa service-role (bypassa RLS), así que
funciona sin sesión.

## 5. Catálogo de eventos — `EVENT_TYPES`

| `event_type` | Entidades que "cumplen ahora" | Tabla | Enlace/label |
|---|---|---|---|
| `venta_entregada` | sales `status='entregada'` | sales | número de venta |
| `venta_pagada` | sales `status='pagada'` | sales | número de venta |
| `stock_bajo` | products `stock <= low_stock_threshold` (umbral>0) | products+product_stock | nombre |
| `cotizacion_por_caducar` | quotes `borrador/enviada` con `valid_until <= hoy+7` | quotes | número |
| `cotizacion_aceptada` | quotes `status='aceptada'` | quotes | número |
| `clienta_nueva` | todas las customers (baseline → solo nuevas disparan) | customers | nombre |
| `tarea_vencida` | tasks `due_date < hoy` y `status≠'hecha'` | tasks | título |

El cron, por cada trigger de evento: obtiene los `entity_id` que cumplen, resta los ya presentes en
`automation_trigger_fires`, y para cada **nuevo** dispara el flujo (payload = datos de la entidad) +
registra el fire. Como todo se basa en "conjunto que cumple ahora" + dedup + baseline, tanto las
transiciones (venta→entregada) como las altas (clienta nueva) disparan **una vez** al aparecer.

## 6. Lógica pura (TDD) — `src/lib/automatizaciones/events.ts`

- `EVENT_TYPES`: array `{ key, label, description }` de los 7 eventos.
- `diffNewIds(matched: string[], fired: string[]): string[]` — ids en `matched` no presentes en `fired`.
- `isScheduleDue(schedule: "daily" | "weekly", lastRunAt: string | null, now: Date): boolean` — `daily`:
  due si `lastRunAt` null o de un día UTC anterior; `weekly`: due si null o ≥7 días.
- `buildEventPayload(eventType: string, entity: { id: string; label: string; company_id: string })`:
  objeto `{ eventType, id, label, company_id }` que va al webhook.
- Tests primero.

## 7. Capa de datos / acciones / cron

- **`dispatch.ts`** — `dispatchFlow(supabase, flow, input)`: crea `automation_run` + POST al webhook +
  marca error si falla. Compartido por `triggerFlow` (Fase 1, refactor mínimo) y el cron.
- **`queries.ts`** (añadir): `listTriggers()` (con label del evento/horario + nombre del flujo);
  evaluadores `matchedEntities(supabase, eventType)` → `{ id, label, company_id }[]` por tipo.
- **`actions.ts`** (añadir): `createTrigger(formData)` (valida kind/event_type/schedule/flow; si event,
  **siembra baseline** insertando las coincidencias actuales en `trigger_fires`), `deleteTrigger(id)`,
  `toggleTrigger(id)`.
- **`src/app/api/automatizaciones/cron/route.ts`** (POST + GET): valida `CRON_SECRET`; crea cliente
  service-role; recorre triggers activos: eventos (diff + dispatch + record fire) y programados
  (`isScheduleDue` → dispatch + `last_run_at = now`). Devuelve resumen `{ fired, errors }`.

## 8. Pantalla

**`/automatizaciones/disparadores`** (+ `/nuevo`): lista de disparadores (tipo, evento/horario, flujo,
on/off) con switch y borrar; alta eligiendo tipo → evento o horario → flujo (de `listFlows`). Enlace
desde la página de flujos.

## 9. Estructura de archivos

```
src/lib/automatizaciones/{events.ts, events.test.ts}      # lógica pura nueva
src/lib/automatizaciones/dispatch.ts                       # helper compartido (extraído de triggerFlow)
src/lib/automatizaciones/{queries.ts, actions.ts}          # AMPLIAR
src/app/api/automatizaciones/cron/route.ts                 # endpoint del cron (service-role)
src/components/automatizaciones/{trigger-list, trigger-form, trigger-delete-button}.tsx
src/app/(app)/automatizaciones/disparadores/{page.tsx, nuevo/page.tsx}
vercel.json                                                # entrada de Vercel Cron (opcional/Pro)
supabase/migrations/{0042_automation_triggers.sql, 0043_automation_triggers_rls.sql}
```

## 10. Env nuevas (server-only, a poner en Vercel)

- `CRON_SECRET` — protege `/api/automatizaciones/cron` (Vercel Cron lo envía como Bearer; un scheduler
  externo/n8n debe enviarlo igual).
- `SUPABASE_SERVICE_ROLE_KEY` — cliente backend del cron (bypassa RLS). Server-only, nunca al navegador.

## 11. Criterios de éxito

- Creo "venta entregada → flujo X"; al marcar una venta entregada y correr el cron, el flujo se dispara
  una vez con los datos de esa venta y no se repite (dedup); el backlog previo no dispara (baseline).
- Un disparador `daily` lanza el flujo una vez al día.
- El endpoint rechaza llamadas sin `CRON_SECRET` (401).
- `events.ts` con tests verdes; `npm run build`/`npm test` limpios; no toca nav ni otros módulos;
  migraciones 0042/0043.

## 12. Fuera de alcance (fases futuras)

- Re-disparo si una condición se cumple, se limpia y vuelve (dedup es fire-once-por-entidad).
- Editor de cron arbitrario (solo `daily`/`weekly`).
- Disparar desde el botón de una entidad concreta (clienta/producto).
- UIs por proveedor / galería de media.
