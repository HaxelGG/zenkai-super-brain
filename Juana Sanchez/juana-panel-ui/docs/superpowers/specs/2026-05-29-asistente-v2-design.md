# Spec — El Asistente v2 (acciones sobre CRM / Ventas / Tareas)

**Fecha:** 2026-05-29
**Terminal:** Frontend/Atelier (`frontend-atelier`)
**Estado:** Diseño aprobado por el usuario (autorización explícita para operar sobre módulos de la otra terminal) — pendiente de revisión del spec.

## 1. Resumen

Extiende **El Asistente** (`/asistente`, `lib/asistente`, ya en producción) para que además de
Taller/Círculo pueda **actuar sobre CRM, Ventas y Tareas** — los módulos que el usuario nombró en
su petición original ("crea una tarea", "registra una interacción", "marca el pedido como pagado").
Mismo bucle, mismo **gate de confirmación**, misma arquitectura aislada. **Sin migración.**

Decisión clave de coordinación: CRM/Ventas/Tareas son de la **otra terminal**, pero el usuario
**autorizó explícitamente** operar sobre ellos. Para no romper su lógica de negocio, las escrituras
**llaman a sus server actions públicas ya validadas** (no escriben sus tablas directamente). Sigo
sin editar sus ficheros ni `lib/ia`/`lib/automatizaciones`/`sidebar.tsx`.

## 2. Infra existente (verificada vía Supabase MCP + lectura de código)

- **CRM** — `customers(company_id, name, type customer_type, status customer_status, email, phone,
  tags[], notes)`, `interactions(customer_id, type interaction_type
  [llamada|email|visita|whatsapp|otro], summary, occurred_at, created_by)`. Acción reutilizable:
  `logInteraction(customerId, FormData{type, summary, occurred_at?})` en `lib/crm/actions.ts`.
- **Ventas** — `sales(company_id, customer_id, number, status sale_status
  [pendiente|pagada|entregada|cancelada], total, channel, …)`. Acciones **guarded**:
  `setSaleStatus(id, "pendiente"|"pagada"|"entregada")` (bloquea reactivar cancelada y volver a
  pendiente si hay devoluciones) y `cancelSale(id)` (repone stock; bloquea si hay devoluciones) en
  `lib/ventas/actions.ts`.
- **Tareas** — `tasks(company_id, title, description, status task_status
  [pendiente|en_curso|hecha], priority task_priority [baja|media|alta], area task_area
  [inventario|comercial|ventas|finanzas|general], assignee_id, due_date)`. Acciones:
  `createTask(FormData)`, `setTaskStatus(id, status)`, `updateTask`, `deleteTask` en
  `lib/tareas/actions.ts`.
- **El Asistente v1** (a extender): `lib/asistente/{openrouter,tools,validate,summary,parse,prompts,
  queries,execute,actions}.ts`. `TOOL_DEFS` (registro), `validateArgs`, `summarizeAction`,
  `executeRead`/`executeWrite`, bucle `runAssistant`/`confirmAction`/`rejectAction` con gate.

## 3. Sin modelo de datos nuevo

No hay migración (0034 sigue libre). Las lecturas usan el cliente RLS de sesión; las escrituras
delegan en server actions existentes (que ya hacen sus inserts/updates + `revalidatePath` + guards).

## 4. Herramientas nuevas (se añaden a `TOOL_DEFS`)

**Lectura** (`kind:"read"`, auto-ejecución, scoped por `company_id`):
- `find_customer` — `{ query }` → hasta 8 `{id, name, type, status, phone}` (ilike por name/email).
- `find_sale` — `{ query }` → hasta 8 `{id, number, status, total, customer_id}` (ilike por `number`).
- `list_tasks` — `{ status?: task_status }` → hasta 20 `{id, title, status, priority, due_date}`.

**Escritura** (`kind:"write"`, gate de confirmación; delega en acciones validadas):
- `log_interaction` — `{ customer_id, type: interaction_type, summary, occurred_at?: YYYY-MM-DD }`
  → construye `FormData` y llama `logInteraction(customer_id, fd)`.
- `create_task` — `{ title, description?, priority?: task_priority, area?: task_area, due_date?:
  YYYY-MM-DD }` → `FormData` (incluye `company_id`) → `createTask(fd)`. (assignee no se expone en v2.)
- `set_task_status` — `{ task_id, status: task_status }` → `setTaskStatus(task_id, status)`.
- `set_sale_status` — `{ sale_id, status: "pendiente"|"pagada"|"entregada" }`
  → `setSaleStatus(sale_id, status)` (los guards de la acción siguen aplicando; si devuelven
  `{error}`, el asistente lo muestra y lo explica).

## 5. Fuera de alcance v2 (YAGNI / seguridad)

- `cancel_sale` (repone stock; mejor decisión humana), crear/editar/borrar clientas, borrar tareas,
  cambiar importes/líneas de venta, status `cancelada` por IA.
- Persistir conversaciones, streaming, cadenas multi-escritura sin confirmar cada una.
- Acciones sobre Cotizaciones/Finanzas/Comunicación/Automatizaciones.

## 6. Cambios por fichero (todo dentro de `lib/asistente`)

- `tools.ts` — añadir los 7 nuevos `ToolDef`; export `INTERACTION_TYPES`, `TASK_STATUSES`,
  `TASK_PRIORITIES`, `TASK_AREAS`, `SALE_STATUSES_SETTABLE` (= `["pendiente","pagada","entregada"]`).
- `validate.ts` — casos nuevos: `find_customer`/`find_sale` (query no vacía), `list_tasks` (status
  opcional válido), `log_interaction` (customer_id no vacío, type ∈ enum, summary no vacío,
  occurred_at fecha opcional), `create_task` (title; priority default `media`; area default
  `general`; due_date opcional), `set_task_status` (task_id, status ∈ enum), `set_sale_status`
  (sale_id, status ∈ subset).
- `summary.ts` — frases de confirmación para cada escritura nueva.
- `queries.ts` — `findCustomers(companyId, q)`, `findSales(companyId, q)`, `listTasks(companyId,
  status?)` (mismo patrón `safe()` + `.eq(company_id)` + `.limit`).
- `execute.ts` — `executeRead` enruta las 3 lecturas nuevas; `executeWrite` enruta las 4 escrituras
  nuevas **llamando a las server actions importadas** (`@/lib/crm/actions`, `@/lib/ventas/actions`,
  `@/lib/tareas/actions`), traduciendo `{error}` ↔ JSON. Para `create_task`/`log_interaction`
  construye `FormData`.
- `prompts.ts` — el system prompt menciona las áreas nuevas (CRM, Ventas, Tareas) y la regla de
  buscar antes de actuar; recuerda que ciertas acciones (estado de venta) pueden ser rechazadas por
  reglas de negocio y debe explicarlo.
- `tools.ts`/registro: las nuevas escrituras pasan por el MISMO gate (no hay que tocar el bucle de
  `actions.ts`, que ya trata cualquier `isWriteTool` como confirmable y cualquier read como
  auto-ejecutable — solo hay que añadir el enrutado en `execute.ts`).

> No se modifica `actions.ts` (el bucle es genérico) salvo que el type-check lo pida. No se toca el
> componente de chat ni la página (la UI ya es genérica sobre `summary`/`pending`).

## 7. Seguridad / validación

- **Gate de confirmación** intacto para todas las escrituras nuevas (incluido estado de venta).
- Args **revalidados en servidor** en `confirmAction` antes de delegar.
- Escrituras vía **acciones guarded** de la otra terminal → se respetan sus reglas (devoluciones,
  cancelaciones, numeración). Si la acción devuelve `{error}`, se propaga al modelo/usuario.
- Lecturas **scoped por `company_id`** + RLS; `company_id` de la empresa elegida en el chat.
- Sin secretos nuevos; sin migración; el asistente sigue sin importar `lib/ia`.

## 8. Coordinación (otra terminal)

- **Autorizado por el usuario** a operar sobre CRM/Ventas/Tareas desde mi asistente.
- **Importo y llamo** sus server actions públicas (`logInteraction`, `createTask`, `setTaskStatus`,
  `setSaleStatus`) — consumo de interfaz, **no edito sus ficheros**. Si cambian la firma de esas
  acciones, mi asistente se recompila/ajusta. Avisar a la otra terminal de esta dependencia.
- Nada de `sidebar.tsx`, `lib/ia`, `lib/automatizaciones`. Nav ya existe (entrada `/asistente` de v1).

## 9. Testing

- Ampliar `validate.test.ts` y `summary.test.ts` con los tools nuevos (TDD puro).
- `tools.test.ts`: el registro pasa a 14 tools; comprobar nombres + kinds.
- `npm run build` + `npm test`. Smoke: "registra una llamada con <clienta>: pidió ampliar pedido",
  "crea una tarea para revisar stock el viernes", "marca el pedido <nº> como pagado" → tarjeta →
  confirmar → comprobar en /crm, /tareas, /ventas; verificar que un set_sale_status inválido
  (p. ej. venta con devolución a 'pendiente') muestra el error de la acción.

## 10. Fases (el plan lo detalla)

1. `tools.ts` (defs + listas enum) — test.
2. `validate.ts` + `summary.ts` (casos nuevos) — TDD.
3. `queries.ts` (find_customer/find_sale/list_tasks).
4. `execute.ts` (enrutado nuevo + llamadas a acciones) + `prompts.ts` (texto).
5. Build + test + deploy (FF a main) + memoria.
