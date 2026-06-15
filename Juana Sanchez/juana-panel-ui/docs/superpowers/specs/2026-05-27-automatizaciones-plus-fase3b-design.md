# Automatizaciones+ Fase 3b (visor de resultados + reintentos) — Panel Grupo Juana Sánchez

**Fecha:** 2026-05-27
**Estado:** Diseño aprobado · pendiente de plan
**Módulo:** ampliación de `/automatizaciones` (F1 flujos, F2 cron, F3a disparo desde entidad — en prod).

---

## 1. Objetivo

Mejorar el **historial de ejecuciones** de un flujo (`/automatizaciones/flujos/[id]`):
1. **Resultado legible:** si el `result` de n8n trae texto o un enlace, mostrarlo legible/clicable; el
   resto, JSON formateado dentro de un bloque **colapsable** (no un muro de texto).
2. **Reintentar:** en ejecuciones terminadas (ok/error), re-disparar el flujo con el **mismo input
   guardado**, creando una **ejecución nueva** (la original se conserva).

Reutiliza `automation_runs` + `dispatchFlow`. **Sin migraciones.**

## 2. Decisiones (brainstorming 2026-05-27)

| Decisión | Elección |
|---|---|
| Reintento | **Nuevo run** con el mismo input; disponible en runs terminados (ok/error). |
| Resultado | **Legible (texto/enlace) + JSON colapsable** (`<details>`). |

## 3. Lógica pura (TDD) — añadir a `src/lib/automatizaciones/flows.ts`

`summarizeResult(result: unknown): { kind: "text" | "link" | "json"; value: string }`:
- `string` con contenido (tras `trim`) → `{ kind: "text", value: result }`.
- objeto (no array, no null) con `url` string o `link` string → `{ kind: "link", value: <esa url> }`
  (prioridad `url` sobre `link`).
- resto (incluye `null`, arrays, números) → `{ kind: "json", value: JSON.stringify(result, null, 2) }`;
  si `result == null` → `{ kind: "json", value: "" }`.
- Tests escritos primero.

## 4. Server action — añadir a `src/lib/automatizaciones/actions.ts`

`retryRun(runId: string)`:
1. Carga el run (`automation_runs`: `flow_id`, `input`).
2. Carga su flujo (`automation_flows`: `id`, `webhook_url`, `enabled`); si desactivado → `{ error }`.
3. `dispatchFlow(supabase, { id, webhook_url }, input)` con el `input` guardado (cast a
   `Record<string, string | number | boolean>`) → **nuevo run**.
4. `revalidatePath('/automatizaciones/flujos/' + flow_id)`. Devuelve `{ runId }` o `{ error }`.

## 5. Componente — `src/components/automatizaciones/run-retry-button.tsx` (client)

`<RunRetryButton runId />`: botón "Reintentar" (variant ghost, size sm) → `retryRun(runId)` →
toast (éxito "Reintentado" / error) + `router.refresh()`.

## 6. `run-history.tsx` (server, reescribir el render de cada run)

- Cabecera de la tarjeta: pill de estado + hora + (si `status !== "running"`) `<RunRetryButton runId={r.id} />`.
- Error: igual (`<p class="text-destructive">`).
- Resultado: usar `summarizeResult(r.result)`:
  - `link` → `<a href target=_blank rel=noreferrer>` clicable.
  - `text` → `<p class="whitespace-pre-wrap">`.
  - `json` con value no vacío → `<details>` con un `<pre>` dentro (resumen "Ver resultado").
- No cambia `RunRow` ni `listRuns`.

## 7. Estructura de archivos

```
src/lib/automatizaciones/flows.ts            # AMPLIAR (summarizeResult) + flows.test.ts (tests)
src/lib/automatizaciones/actions.ts          # AMPLIAR (retryRun)
src/components/automatizaciones/run-retry-button.tsx   # nuevo
src/components/automatizaciones/run-history.tsx        # reescribir el render
```

## 8. Criterios de éxito

- En el historial veo enlaces clicables / texto legible / JSON plegado según el resultado.
- "Reintentar" en un run terminado crea una ejecución nueva con el mismo input; la original permanece.
- `summarizeResult` con tests verdes; `npm run build`/`npm test` limpios; sin migraciones; no toca nav.

## 9. Fuera de alcance

- Editar el input antes de reintentar.
- Reintentos automáticos / backoff (eso es de n8n).
- Paginación del historial; render por proveedor (vídeo embebido, audio, etc.).
