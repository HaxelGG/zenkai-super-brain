# Spec — El Asistente (IA que actúa, aislada)

**Fecha:** 2026-05-29
**Terminal:** Frontend/Atelier (`frontend-atelier`)
**Estado:** Diseño aprobado — pendiente de revisión del usuario.

## 1. Resumen

Asistente de chat con **function-calling** que no solo responde, sino que **ejecuta acciones
reales** sobre mis módulos con **confirmación humana**: el modelo *propone* una acción, el
usuario *aprueba*, y entonces se *ejecuta*. v1 cubre **Taller** (`workshop_pieces`) y **Círculo**
(`circle_members`). Módulo aislado `lib/asistente` con **cliente OpenRouter propio** (calca
`lib/ads`, reusa solo `OPENROUTER_API_KEY`, **no importa `lib/ia`**), páginas `/asistente`, chat
efímero (sin persistir). **Sin migración SQL.**

Decisiones tomadas (brainstorming):
- **Dirección:** IA que actúa (tool-calling), no solo analizar/redactar.
- **Coordinación:** *slice aislado mío* — `/ia` + `lib/ia` + Automatizaciones+ son de la otra
  terminal; este asistente NO los toca. Solo escribe en MIS tablas.
- **Alcance v1:** Taller + Círculo (Boutiques/Devoluciones/Importar fuera; CRM/Ventas/Tareas fuera).
- **Enfoque:** function-calling nativo (OpenRouter `tools`, formato OpenAI), degradable a "intención
  JSON" si el modelo elegido no soporta tools.
- **Seguridad:** las herramientas de **escritura** nunca se ejecutan sin confirmación explícita.

## 2. Infra existente (verificada)

- **Taller** `workshop_pieces(id, company_id, title, client, stage workshop_stage
  [patron|corte|confeccion|acabados|entregado], artisan, started_at, due_date, photo_url, notes,
  created_by, created_at, updated_at)`. Acciones actuales: `createPiece/updatePiece/deletePiece`
  (FormData) en `lib/taller/actions.ts`.
- **Círculo** `circle_members(id, company_id, name, tier circle_tier
  [confidente|musa|embajadora], email, phone, city, since, lifetime_value, photo_url, active,
  notes, created_by, created_at, updated_at)`. Acciones: `createCircleMember/updateCircleMember/
  deleteCircleMember` (FormData) en `lib/circulo/actions.ts`.
- **Patrón IA aislado de referencia:** `lib/ads/openrouter.ts` — `fetch` server-side a
  `https://openrouter.ai/api/v1/chat/completions`, modelo por env, key nunca al navegador,
  devuelve `{text}|{error}`. **Este módulo lo calca** (no reusa `lib/ia`).
- **Empresa activa:** `getActiveCompany()` → `string | "all"`; selector de empresa con
  `companies(id,name)`. RLS por `accessible_company_ids()`.
- Toasts `sonner`; componentes Atelier (`PageHeader`, `Kpi`, `FieldError`, `Button`).

## 3. Sin modelo de datos nuevo

No hay migración. El asistente lee/escribe en `workshop_pieces` y `circle_members` con el cliente
Supabase **de sesión** (RLS aplica). El chat es **efímero** (vive en memoria del cliente, no se
persiste). Numeración de migraciones intacta (siguiente libre **0034**).

## 4. Cliente OpenRouter propio (`lib/asistente/openrouter.ts`)

- `type ChatMessage` con roles `system|user|assistant|tool`, soporte de `tool_calls`
  (en mensajes `assistant`) y `tool_call_id` + `name` (en mensajes `tool`).
- `assistantChat(messages, tools, maxTokens)` → llama a OpenRouter con `model`,
  `messages`, `tools`, `tool_choice: "auto"`. Devuelve el `message` del modelo crudo
  (`{ message }`) o `{ error }`. Sin streaming.
- Modelo por env **`OPENROUTER_MODEL_TOOLS`** (default `deepseek/deepseek-chat`, que soporta
  function-calling). Reusa `OPENROUTER_API_KEY`. La key vive solo en el servidor.

## 5. Registro de herramientas (`lib/asistente/tools.ts`)

`type ToolDef = { name; description; kind: "read"|"write"; parameters: JSONSchema }`.
Las definiciones se envían a OpenRouter como `tools:[{type:"function", function:…}]`.

**Taller**
- `find_piece` *(read)* — `{ query: string }` → busca por `title`/`client` (ilike), devuelve
  hasta 8 `{id, title, client, stage}`.
- `list_pieces` *(read)* — `{ stage?: workshop_stage }` → piezas (de la empresa) opcionalmente
  filtradas por etapa.
- `create_piece` *(write)* — `{ title: string, client?: string, stage?: workshop_stage,
  due_date?: string(YYYY-MM-DD) }`.
- `set_piece_stage` *(write)* — `{ piece_id: uuid, stage: workshop_stage }`.

**Círculo**
- `find_member` *(read)* — `{ query: string }` → busca por `name` (ilike), devuelve hasta 8
  `{id, name, tier, active}`.
- `set_member_tier` *(write)* — `{ member_id: uuid, tier: circle_tier }`.
- `set_member_active` *(write)* — `{ member_id: uuid, active: boolean }`.

Cada tool tiene un **ejecutor** server-side (`executeRead` / `executeWrite`) que recibe
`(companyId, args)`, valida con la lógica pura (§7), y hace la operación Supabase (RLS de sesión):
escrituras = `insert`/`update` directos sobre `workshop_pieces`/`circle_members` (mismos campos
que las acciones de FormData existentes), + `revalidatePath` del módulo afectado.

## 6. El bucle del agente (`lib/asistente/actions.ts`, "use server")

Chat efímero: el cliente mantiene el array de `messages`; el servidor es **stateless** por llamada.

- **`runAssistant(messages: ChatMessage[], companyId: string)`** → `AssistantTurn`
  1. Antepone el system prompt (§8) y adjunta `TOOL_DEFS`. El `companyId` lo aporta el chat
     (empresa seleccionada/activa, §9); si viene vacío → `{ kind:"error", error:"Elige empresa" }`.
     La RLS rechaza empresas no accesibles. (Las tools de escritura ya incluyen `companyId`.)
  2. Llama `assistantChat`. Si el modelo pide **tool_calls**:
     - **read** → ejecuta, añade el `tool` result a `messages`, vuelve a 2 (**máx 4 iteraciones**).
     - **write** → **PARA**. Devuelve `{ kind:"confirm", pending:{ tool, args, summary }, messages }`
       (`summary` = `summarizeAction`, §7). **No ejecuta nada.**
  3. Si responde texto → `{ kind:"message", text, messages }`.
  4. Errores (sin key, OpenRouter !ok, args inválidos, tope de iteraciones) → `{ kind:"error", error }`.
- **`confirmAction(pending, messages, companyId)`** → `AssistantTurn`
  - Re-valida `pending.args` en servidor (no confía en el cliente), ejecuta la **escritura**,
    añade el `tool` result (éxito o error) a `messages`, hace **una vuelta** más al modelo para el
    mensaje de cierre ("Hecho ✓"), y devuelve `{ kind:"message", … }`. Re-revalida la ruta.
- **`rejectAction(pending, messages)`** → añade un `tool` result "el usuario rechazó la acción" y
  devuelve el turno del modelo (acuse + continúa la conversación).

> La **fuente de verdad es el servidor**: `confirmAction` vuelve a validar los args antes de
> escribir; el cliente solo reenvía el `pending` que recibió.

## 7. Lógica pura testeable

- `lib/asistente/tools.ts` (datos): `TOOL_DEFS` presentes y bien formados; `getTool(name)`;
  `isWriteTool(name)`.
- `lib/asistente/validate.ts`: `validateArgs(toolName, rawArgs)` → `{ args } | { error }`
  (campos requeridos, enums `workshop_stage`/`circle_tier`, formato fecha `YYYY-MM-DD`, uuid no
  vacío, coerción de `active` boolean). Puro.
- `lib/asistente/summary.ts`: `summarizeAction(toolName, args)` → frase en español para la tarjeta
  de confirmación (p.ej. *"Avanzar la pieza «Vestido Marta» a **acabados**"*). Puro.
- `lib/asistente/parse.ts`: `parseToolCall(message)` → extrae `{ name, args }` del `tool_calls[0]`,
  con `JSON.parse` defensivo de `arguments`. Puro.
- `lib/asistente/prompts.ts`: `buildSystemPrompt(companyName)` (puro) — describe el rol, los
  módulos, la regla "para escrituras propones y el humano confirma", responde en español, y a no
  inventar ids (usar `find_*` primero).
- Tests TDD: validación (enums OK/KO, fecha, uuid), `summarizeAction` por tool, `parseToolCall`
  (args válidos/JSON roto), presencia/forma de `TOOL_DEFS`.

## 8. System prompt (resumen)

"Eres el asistente del atelier de Juana Sánchez. Operas sobre Taller (piezas) y Círculo (clientas
VIP) de **{empresa}**. Puedes consultar con `find_*`/`list_*` y proponer cambios con las tools de
escritura. **Nunca inventes ids**: si el usuario nombra una pieza o clienta, búscala primero.
Para cualquier acción de escritura, propón la tool; el sistema pedirá confirmación al usuario antes
de ejecutar. Responde en español, breve y concreto."

## 9. UI / pantallas

- **`/asistente/page.tsx`** (server): `PageHeader eyebrow="Atelier digital" title="El Asistente"`;
  carga `companies` + empresa activa; pasa ambos a `<AssistantChat>`. El chat mantiene
  `companyId` en estado (default = activa; si es `"all"` y hay varias, exige elegir antes de
  escribir) y lo pasa en cada llamada (`runAssistant`/`confirmAction`/`rejectAction`).
- **`components/asistente/assistant-chat.tsx`** (`"use client"`): historial efímero (como
  `analyst-chat`); input; al recibir `kind:"confirm"` muestra una **tarjeta de acción propuesta**
  con el `summary` y botones **Confirmar** / **Descartar** (llaman `confirmAction`/`rejectAction`);
  `kind:"message"` añade la respuesta; `kind:"error"` → `FieldError` + toast. Estilo Atelier.
- **Nav:** `components/app-shell/nav-config.tsx` — entrada "Asistente" (icono `Bot`) bajo *Atelier
  digital* (junto a `/ia`). Igual que Devoluciones/Importar, se añade como parte de publicar el
  módulo. **No tocar `sidebar.tsx`.**

## 10. Seguridad / validación

- **Gate de confirmación**: ninguna escritura se ejecuta sin `confirmAction`. Las lecturas sí.
- Args **revalidados en servidor** en `confirmAction` (enums, uuid, fecha); el cliente solo reenvía
  el `pending`.
- `company_id` de `getActiveCompany()`; RLS por empresa; `created_by` = usuario de sesión.
- Guardia de **máx. 4 iteraciones** de tools por turno (evita bucles); errores de tool se devuelven
  al modelo/usuario, no rompen el chat.
- Secreto solo server (`OPENROUTER_API_KEY`); chat no se persiste; **no** toca `lib/ia` ni tablas de
  otras terminales.

## 11. Coordinación (otra terminal)

- Todo nuevo y aislado (`lib/asistente`, `components/asistente`, `app/(app)/asistente`). Cliente
  OpenRouter **propio** (como `lib/ads`); **no importa `lib/ia`** ni toca Automatizaciones+.
- Escribe solo en **mis** tablas (`workshop_pieces`, `circle_members`) con las mismas reglas que sus
  formularios. Único fichero compartido: `nav-config.tsx` (aditivo, una línea). **No** `sidebar.tsx`.
- Nuevo env `OPENROUTER_MODEL_TOOLS` (default razonable; sin él, usa el default en código).

## 12. Fuera de alcance v1 (YAGNI)

- Acciones sobre CRM/Ventas/Tareas/Devoluciones/Boutiques/Importar.
- Persistir conversaciones; streaming; cadenas autónomas multi-escritura sin confirmar cada una.
- Borrado de piezas/miembros vía IA (solo crear/avanzar/editar campos acotados).
- Imágenes/voz; RAG sobre 2º Cerebro; multi-empresa simultánea en un turno.

## 13. Testing

- `validate.test.ts`, `summary.test.ts`, `parse.test.ts`, `tools.test.ts`, `prompts.test.ts` (TDD puro).
- `npm run build` + `npm test`. Smoke manual: "busca la pieza de Marta y pásala a acabados" →
  ver tarjeta → confirmar → comprobar etapa en `/taller`; "sube a Lucía a musa" → confirmar/descartar.

## 14. Fases de implementación (resumen; el plan lo detalla)

1. Cliente `openrouter.ts` (tools) + `prompts.ts` (puro, test).
2. `tools.ts` (defs) + `validate.ts` + `summary.ts` + `parse.ts` (puros, TDD).
3. `queries.ts` (find/list) + ejecutores read/write.
4. `actions.ts` (`runAssistant`/`confirmAction`/`rejectAction`, bucle + gate).
5. `assistant-chat.tsx` (chat + tarjeta de confirmación) + `/asistente/page.tsx`.
6. Entrada en `nav-config.tsx` + build + test + deploy (fast-forward a `main`).
