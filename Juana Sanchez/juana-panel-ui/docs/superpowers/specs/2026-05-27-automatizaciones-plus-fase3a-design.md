# Automatizaciones+ Fase 3a (disparar flujo desde una entidad) — Panel Grupo Juana Sánchez

**Fecha:** 2026-05-27
**Estado:** Diseño aprobado · pendiente de plan
**Módulo:** ampliación de `/automatizaciones` (F1 flujos manuales, F2 disparos automáticos, ambas en prod).

---

## 1. Objetivo

Añadir, en la ficha de una **clienta** (`/crm/[id]`) y de un **producto** (`/inventario/[id]`), un control
**"Enviar a flujo"** que dispara un flujo de n8n con un payload fijo de los datos de esa entidad. Acción
puntual desde el contexto de la entidad (p.ej. "email a esta clienta", "copy de este producto"). Reutiliza
`automation_flows` + `dispatchFlow`. **Sin migraciones.**

## 2. Decisiones (brainstorming 2026-05-27)

| Decisión | Elección |
|---|---|
| Entidades | **CRM (clienta)** + **Inventario (producto)**. |
| Payload | **Fijo** (datos clave de la entidad); sin campos manuales. |
| Flujos elegibles | Todos los flujos registrados (`listFlows`); el usuario elige uno. |
| Visibilidad | El control solo aparece si hay flujos. |

## 3. Lógica pura (TDD) — añadir a `src/lib/automatizaciones/flows.ts`

`buildEntityPayload(entityType: "customer" | "product", entity): Record<string, string | number>`:
- `customer` → `{ entityType: "customer", id, name, email, phone, company_id }` (email/phone `null` → `""`).
- `product` → `{ entityType: "product", id, name, sku, price, company_id }` (sku `null` → `""`, price número).
- Tests escritos primero.

## 4. Server action — añadir a `src/lib/automatizaciones/actions.ts`

`triggerFlowForEntity(flowId: string, entityType: "customer" | "product", entityId: string)`:
1. Resuelve el flujo (`automation_flows`: id, webhook_url, enabled); si desactivado → `{ error }`.
2. Busca la entidad con un select mínimo:
   - customer → `customers.select("id,name,email,phone,company_id")`
   - product → `products.select("id,name,sku,price,company_id")`
3. `buildEntityPayload(...)` → `dispatchFlow(supabase, { id, webhook_url }, payload)`.
4. Devuelve `{ runId }` o `{ error }`. No acopla otros módulos (hace su propio select).

## 5. Componente — `src/components/automatizaciones/entity-flow-trigger.tsx` (client)

`<EntityFlowTrigger entityType entityId flows />`: `<select>` de flujos (`{id,name}[]`) + botón "Enviar a
flujo" → llama `triggerFlowForEntity` → toast (éxito/error). Compacto, alineado con la cabecera de la ficha.

## 6. Páginas (ediciones mínimas)

- `src/app/(app)/crm/[id]/page.tsx`: `listFlows()` y, junto al botón "Editar", renderizar
  `<EntityFlowTrigger entityType="customer" entityId={id} flows={...} />` si `flows.length > 0`.
- `src/app/(app)/inventario/[id]/page.tsx`: igual con `entityType="product"`.

No se altera la lógica existente de esas fichas (interacciones, ajuste de stock, etc.).

## 7. Estructura de archivos

```
src/lib/automatizaciones/flows.ts            # AMPLIAR (buildEntityPayload) + flows.test.ts (tests)
src/lib/automatizaciones/actions.ts          # AMPLIAR (triggerFlowForEntity)
src/components/automatizaciones/entity-flow-trigger.tsx   # nuevo
src/app/(app)/crm/[id]/page.tsx              # AMPLIAR (control)
src/app/(app)/inventario/[id]/page.tsx       # AMPLIAR (control)
```

## 8. Criterios de éxito

- Desde una clienta/producto elijo un flujo y se dispara con sus datos; la ejecución aparece en el
  historial del flujo (`/automatizaciones/flujos/[id]`).
- Si no hay flujos, el control no se muestra.
- `buildEntityPayload` con tests verdes; `npm run build`/`npm test` limpios.
- Sin migraciones; no toca nav ni la lógica existente de las fichas.

## 9. Fuera de alcance

- Campos extra manuales al disparar (descartado).
- Otras entidades (cotizaciones, ventas) — extensible luego con el mismo patrón.
- Recordar/preseleccionar qué flujo se usó por entidad.
