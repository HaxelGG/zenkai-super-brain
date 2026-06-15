# Automatizaciones+ Fase 1 (panel de control de n8n) — Panel Grupo Juana Sánchez

**Fecha:** 2026-05-27
**Estado:** Diseño aprobado · pendiente de plan de implementación
**Módulo:** ampliación de `/automatizaciones` (motor de alertas ya en producción) hacia un motor de
integraciones/orquestación. **Esta es la FASE 1** de un alcance mayor (n8n + Claude/OpenRouter +
OpenClaw + Higgsfield + HeyGen + ElevenLabs + email marketing); las siguientes fases tendrán su
propio spec.
**Reparto:** YO (terminal de módulos) construyo Automatizaciones+. La terminal de diseño construye
"Las Pautas" (`/pautas`, ads). Reserva de migraciones: **yo `0040–0049`**, diseño `0030–0039`.

---

## 1. Contexto y objetivo

El `/automatizaciones` actual es el **motor de alertas determinista** (`automation_rules`, en vivo,
owner-only). IA Tools (`/ia`) aportó el cliente OpenRouter server-side. Automatizaciones+ amplía el
módulo hacia orquestación de flujos.

**Decisión arquitectónica clave (brainstorming 2026-05-27):** **n8n orquesta; el panel es el panel de
control.** n8n ejecuta los flujos reales (llamar a HeyGen/ElevenLabs/Higgsfield/email/etc., encadenar
pasos, reintentos). El panel solo: registra flujos (cada uno = un webhook de n8n + sus campos de
entrada), los dispara con un payload, y registra/visualiza las ejecuciones. **Cada proveedor es un
workflow que el usuario monta en n8n**; el panel no llama a esos APIs ni guarda sus secretos.

**Objetivo Fase 1:** registrar flujos n8n, dispararlos desde el panel con un formulario, y ver el
historial de ejecuciones con estado/resultado/error (incluidos flujos largos vía callback).

## 2. Stack y patrón

- **Next.js 16 + Supabase + Vercel + shadcn/ui + Atelier.** Nuevo: un **route handler** (API route)
  para el callback de n8n; llamadas salientes vía `fetch` server-side.
- Patrón de módulo: namespace existente `automatizaciones` → `src/lib/automatizaciones/`,
  `src/components/automatizaciones/`, rutas nuevas en `src/app/(app)/automatizaciones/flujos/` +
  un route handler en `src/app/api/automatizaciones/callback/route.ts`.
- **NO tocar `nav-config.tsx`/`sidebar.tsx`** — `/automatizaciones` ya está en el nav; las páginas de
  flujos se alcanzan por enlace desde la página de alertas.
- **Migraciones en mi bloque reservado: `0040` (tablas) y `0041` (RLS + RPC).**
- **Atelier-native:** tokens, sonner, Card/Button/Input/Textarea.

## 3. Decisiones tomadas (brainstorming 2026-05-27)

| Decisión | Elección |
|---|---|
| Orquestador | **n8n**; el panel es panel de control (no reimplementa orquestación). |
| Fase 1 | **Base**: conexión/registro de flujos + disparar + log de ejecuciones. |
| Fin de ejecución | **Callback**: n8n llama a un endpoint del panel al terminar (soporta flujos largos). |
| Registro de flujos | **Manual**: el usuario pega el `webhook_url` y define los campos de entrada. |
| Aislamiento | **Owner-global** (RLS `is_owner()`), como `automation_rules`. |

## 4. Modelo de datos

Migraciones `0040_automation_flows.sql` (tablas) y `0041_automation_flows_rls.sql` (RLS + RPC).

### 4.1 `automation_flows`
- `id` uuid pk default `gen_random_uuid()`
- `name` text not null
- `description` text
- `webhook_url` text not null (webhook de n8n a invocar)
- `input_fields` jsonb not null default `'[]'` (array de `{ key, label, type }`; `type` ∈ texto/área/número)
- `enabled` boolean not null default true
- `created_at` / `updated_at` timestamptz not null default `now()`

### 4.2 `automation_runs`
- `id` uuid pk default `gen_random_uuid()`
- `flow_id` uuid not null → `automation_flows(id)` on delete cascade
- `status` text not null default `'running'` (`running` | `ok` | `error`)
- `input` jsonb not null default `'{}'`
- `result` jsonb
- `error` text
- `callback_token` uuid not null default `gen_random_uuid()` (secreto por-ejecución)
- `created_at` timestamptz not null default `now()`
- `finished_at` timestamptz
- Índice: `automation_runs (flow_id, created_at desc)`

### 4.3 RLS + RPC (`0041`)
```sql
alter table public.automation_flows enable row level security;
alter table public.automation_runs enable row level security;

create policy "automation_flows solo owner" on public.automation_flows
  for all to authenticated using (public.is_owner()) with check (public.is_owner());
create policy "automation_runs solo owner" on public.automation_runs
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

-- Callback de n8n (sin sesión): valida el token por-ejecución y actualiza. SECURITY DEFINER.
create or replace function public.complete_automation_run(
  p_run_id uuid, p_token uuid, p_status text, p_result jsonb, p_error text
) returns boolean
language plpgsql security definer set search_path = public as $$
declare ok boolean;
begin
  update public.automation_runs
     set status = p_status, result = p_result, error = p_error, finished_at = now()
   where id = p_run_id and callback_token = p_token and status = 'running';
  get diagnostics ok = row_count;
  return ok > 0;
end $$;

revoke all on function public.complete_automation_run(uuid,uuid,text,jsonb,text) from public;
grant execute on function public.complete_automation_run(uuid,uuid,text,jsonb,text) to anon, authenticated;
```
El callback solo puede cerrar una ejecución si conoce su `callback_token` (que únicamente viajó al
webhook de n8n). No expone otras filas. `p_status` se normaliza a `ok`/`error` en la capa de app
antes de llamar.

## 5. Flujo de ejecución

1. **`triggerFlow(flowId, formData)`** (server action): lee el flujo, valida el form contra
   `input_fields`, crea un `run` (`running` + `callback_token`), y hace `POST` al `webhook_url` con
   `{ runId, callbackUrl, callbackToken, input }` (`callbackUrl` = `${AUTOMATION_PUBLIC_URL}/api/automatizaciones/callback`).
   Si el `fetch` falla, marca el run `error`. Devuelve `{ runId }`.
2. **n8n** ejecuta su workflow y, al terminar, hace `POST` a `/api/automatizaciones/callback` con
   `{ runId, token, status, result, error }`.
3. **Route handler** `src/app/api/automatizaciones/callback/route.ts`: valida el body, normaliza
   `status` a `ok`/`error`, y llama al RPC `complete_automation_run`. Responde 200/4xx. Revalida
   `/automatizaciones/flujos/[flowId]`.

## 6. Lógica pura (TDD) — `src/lib/automatizaciones/flows.ts`

- `type InputField = { key: string; label: string; type: "text" | "textarea" | "number" }`.
- `parseInputFields(raw: unknown): InputField[]` — valida/normaliza el jsonb a `InputField[]` (descarta
  entradas mal formadas).
- `buildFlowPayload(fields: InputField[], formData: FormData): Record<string, string | number>` — mapea
  cada campo a su valor (number → `Number`), ignora claves no declaradas.
- `isValidWebhookUrl(url: string): boolean` — true solo si es `https://` válida.
- `runStatusLabel(status: string): string` — `running`→"En curso", `ok`→"Completado", `error`→"Error".
- Tests escritos primero (Vitest).

## 7. Capa de datos / acciones

- **`queries.ts`** (añadir, sin tocar lo de alertas): `listFlows()` (con conteo de runs y estado del
  último), `getFlow(id)`, `listRuns(flowId)`.
- **`actions.ts`** (añadir): `createFlow(formData)` (valida `webhook_url` con `isValidWebhookUrl`,
  parsea `input_fields`), `deleteFlow(id)`, `triggerFlow(flowId, formData)` (ver §5).
- El route handler del callback vive en `src/app/api/automatizaciones/callback/route.ts` y usa el
  cliente Supabase server + el RPC.

## 8. Pantallas (Atelier-native)

1. **`/automatizaciones/flujos`** — lista de flujos (nombre, descripción, nº de ejecuciones, estado del
   último run) + botón "Nuevo flujo". La página de alertas (`/automatizaciones`) enlaza aquí.
2. **`/automatizaciones/flujos/nuevo`** — alta: nombre, `webhook_url`, descripción, y editor simple de
   campos de entrada (líneas `key|label|type`, parseadas a `input_fields`).
3. **`/automatizaciones/flujos/[id]`** — cabecera del flujo + **formulario dinámico** (según
   `input_fields`) para dispararlo + **historial de ejecuciones** (estado con pill, hora, resultado/error;
   `result` mostrado como JSON/texto). Botón borrar flujo.

## 9. Estructura de archivos

```
src/lib/automatizaciones/{flows.ts, flows.test.ts}      # lógica pura nueva
src/lib/automatizaciones/{queries.ts, actions.ts}       # AMPLIAR los existentes (no romper alertas)
src/app/(app)/automatizaciones/flujos/{page.tsx, nuevo/page.tsx, [id]/page.tsx}
src/app/api/automatizaciones/callback/route.ts          # route handler del callback
src/components/automatizaciones/{flow-list, flow-form, flow-trigger, run-history, flow-delete-button}.tsx
supabase/migrations/{0040_automation_flows.sql, 0041_automation_flows_rls.sql}
```

## 10. Criterios de éxito

- Registro un flujo (webhook de n8n + campos), lo disparo desde el panel con datos, y se crea una
  ejecución `running`.
- n8n llama al callback con el token correcto y la ejecución pasa a `ok`/`error` con su resultado;
  un token inválido NO actualiza nada.
- Veo el historial de ejecuciones por flujo. Los secretos de proveedores NO están en el panel.
- `flows.ts` con tests verdes; `npm run build` y `npm test` limpios.
- No rompe el motor de alertas existente; no toca otros módulos ni el nav; migraciones en 0040–0041.

## 11. Fuera de alcance (fases futuras)

- Autodescubrir workflows vía API de administración de n8n.
- Disparar flujos desde entidades del panel (clienta/producto) o desde una **regla de alerta**.
- UIs dedicadas por proveedor (vídeo/voz/imagen/email), galería de media generada.
- Programación (cron) y reintentos desde el panel (eso es de n8n).
- Flujos por-empresa (Fase 1 es owner-global).
