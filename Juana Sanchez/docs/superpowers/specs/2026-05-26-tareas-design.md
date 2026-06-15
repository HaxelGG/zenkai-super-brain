# Módulo Tareas de equipo — Panel de Control Grupo Juana Sánchez

**Fecha:** 2026-05-26
**Estado:** Diseño aprobado · pendiente de plan de implementación
**Módulo nº:** 7 (ROADMAP "Tareas de equipo", transversal)
**Alcance:** To-dos del equipo en un tablero por columnas, aislados por empresa, sobre los
cimientos existentes. No reconstruye cimientos ni toca módulos/diseño de la otra terminal.

---

## 1. Contexto y objetivo

El Panel tiene cimientos + 6 módulos en producción (Inventario, CRM, Cotizaciones, Ventas,
Finanzas, Analítica) y el sistema de diseño Atelier. Tareas es un módulo **transversal** del
ROADMAP: to-dos asignables por empresa para organizar el trabajo del equipo.

**Roles inactivos:** hoy hay un único usuario `owner`. La asignación (`assignee_id`) funciona
pero por ahora solo apunta al owner; el modelo queda listo para cuando se active el equipo
(tablas `profiles`/`user_companies` ya existen en los cimientos).

**Objetivo:** un tablero tipo kanban (3 columnas) donde crear tareas con área, prioridad y
fecha límite, y moverlas de estado con botones.

## 2. Stack y patrón a reutilizar (NO se reconstruye)

- **Next.js 15 + Supabase + Vercel + shadcn/ui + Atelier**.
- Patrón de módulo (como Finanzas): `src/lib/<m>/{queries,actions}.ts` + lógica pura testeable;
  rutas `src/app/(app)/<m>/`; componentes `src/components/<m>/`; migraciones versionadas
  (`0016`, `0017`); RLS por `company_id` con `accessible_company_ids()`; tipos en `src/types/db.ts`;
  lecturas filtradas por `getActiveCompany()`; entrada en el `Sidebar`.
- **Atelier-native:** tokens (`text-ink-*`, `bg-surface`, `border-line`, señales), `StatusPill`,
  toasts sonner, fuente. Construido consistente desde el inicio.
- **Deploy:** integrar por `main` con `git pull` antes de empujar (otra terminal en paralelo).

## 3. Decisiones tomadas (brainstorming 2026-05-26)

| Decisión | Elección |
|---|---|
| Vista | **Tablero por columnas** (Pendiente / En curso / Hecha); mover con botones (sin drag-and-drop). |
| Clasificación | **Etiqueta de área** (enum: inventario/comercial/ventas/finanzas/general). Sin vínculos duros a registros. |
| Recordatorios | **Fecha límite** + **aviso visual de vencida**. Sin notificaciones email/push. |
| Comentarios | `task_comments` **fuera de alcance**. |
| Asignación | `assignee_id` opcional (→ `profiles`); hoy solo el owner. |

## 4. Modelo de datos

Migraciones `0016_tasks.sql` (esquema) y `0017_tasks_rls.sql` (RLS). Última migración existente: `0015_finances_rls` (hay un `0014` duplicado, cosmético).

### 4.1 Enums

```sql
create type public.task_status   as enum ('pendiente', 'en_curso', 'hecha');
create type public.task_priority as enum ('baja', 'media', 'alta');
create type public.task_area     as enum ('inventario', 'comercial', 'ventas', 'finanzas', 'general');
```

### 4.2 Tabla `tasks`
- `id` uuid pk default `gen_random_uuid()`
- `company_id` uuid not null → `companies(id)` on delete cascade
- `title` text not null
- `description` text
- `status` `task_status` not null default `'pendiente'`
- `priority` `task_priority` not null default `'media'`
- `area` `task_area` not null default `'general'`
- `assignee_id` uuid → `profiles(id)` on delete set null (nullable)
- `due_date` date (nullable)
- `created_by` uuid → `profiles(id)`
- `created_at` / `updated_at` timestamptz not null default `now()`

Índices: `tasks(company_id)`, `tasks(status)`.

### 4.3 RLS (`0017_tasks_rls.sql`)
```sql
alter table public.tasks enable row level security;

create policy "tasks por empresa accesible" on public.tasks for all to authenticated
  using (company_id in (select public.accessible_company_ids()))
  with check (company_id in (select public.accessible_company_ids()));
```

## 5. Lógica pura (TDD) — `src/lib/tareas/task.ts`

- Tipos `TaskStatus` (`pendiente|en_curso|hecha`), `TaskPriority` (`baja|media|alta`), `TaskArea` (`inventario|comercial|ventas|finanzas|general`).
- `taskStatusLabel(s)` → Pendiente / En curso / Hecha.
- `priorityLabel(p)` → Baja / Media / Alta.
- `areaLabel(a)` → Inventario / Comercial / Ventas / Finanzas / General.
- `isOverdue(dueDate, status, today?)` → `true` si `dueDate` existe, `status !== 'hecha'` y `dueDate < today` (hoy por defecto en ISO `YYYY-MM-DD`).
- Tests escritos primero (como en módulos previos).

## 6. Capa de datos

- **`queries.ts`** (filtran por empresa activa):
  - `listTasks(companyFilter)` — todas las tareas (orden: `due_date` asc nulls last, luego `created_at`); el tablero las reparte por `status` en el cliente. Incluye nombre del asignado (`assignee:profiles(full_name)`).
  - `getTask(id)`.
  - `tasksSummary(companyFilter)` — `{ pendientes, enCurso, vencidas }` (vencidas vía `isOverdue`).
  - `profilesForAssignee()` — `{ id, full_name }[]` para el select (hoy: el owner).
- **`actions.ts`** (server actions, `revalidatePath`):
  - `createTask(formData)` — inserta con `company_id`, `created_by`, campos del form.
  - `updateTask(id, formData)` — actualiza + `updated_at`.
  - `setTaskStatus(id, status)` — botones del tablero.
  - `deleteTask(id)`.

## 7. Pantallas (Atelier-native)

1. **Tablero** (`/tareas`) — 3 columnas (Pendiente / En curso / Hecha) con la cuenta por columna.
   Cada **tarjeta**: título, etiqueta de área, prioridad (StatusPill por color: alta=bad, media=warn, baja=neutral), fecha límite (resaltada en `--bad` si `isOverdue`), asignado, y botones de movimiento
   (`← Pendiente` / `→ En curso` / `→ Hecha` según estado) + enlaces Editar/Borrar. **Filtro por área**.
   Respeta empresa activa. Botón "Nueva tarea". Tarjetas de resumen opcional (pendientes/en curso/vencidas).
2. **Alta** (`/tareas/nueva`) y **Edición** (`/tareas/[id]/editar`) — formulario reutilizable
   (título, descripción, área, prioridad, asignado [select de profiles], fecha límite) con toasts.
   Requiere empresa concreta activa (no "Todas") para crear.
- Entrada `{ href: "/tareas", label: "Tareas", icon: ListChecks }` en `src/components/app-shell/sidebar.tsx`
  (cambio mínimo; el sidebar es por secciones → ubicar en una sección de operación/equipo razonable).

## 8. Estructura de archivos

```
src/lib/tareas/{task.ts, task.test.ts, queries.ts, actions.ts}
src/app/(app)/tareas/{page.tsx, nueva/page.tsx, [id]/editar/page.tsx}
src/components/tareas/
  task-board.tsx          # client: 3 columnas + filtro de área
  task-card.tsx           # tarjeta (usada por el board)
  task-status-actions.tsx # client: botones de movimiento de estado
  task-form.tsx           # client: alta/edición con toasts
supabase/migrations/{0016_tasks.sql, 0017_tasks_rls.sql}
```

## 9. Criterios de éxito

- Creo tareas (área, prioridad, fecha límite, asignado) en la empresa activa; aparecen en su columna.
- Muevo una tarea con los botones; cambia de estado y se recoloca en el tablero.
- Las vencidas (due < hoy y no hechas) se resaltan; filtro por área funciona.
- RLS aísla por empresa; la lógica pura (labels, `isOverdue`) tiene tests verdes; `npm run build` y `npm test` limpios.
- UI en lenguaje Atelier (tokens, StatusPill, toasts), coherente con el panel.
- No toca archivos de otros módulos ni del dashboard de la otra terminal (salvo añadir la entrada del sidebar).

## 10. Fuera de alcance

- `task_comments` / comentarios en tareas.
- Vínculo a registros concretos (cliente/producto/venta) — solo etiqueta de área.
- Notificaciones email/push y jobs de recordatorio.
- Drag-and-drop entre columnas (se mueve con botones).
- Vista "mis tareas" separada (un filtro lo cubrirá cuando se active el equipo).
- Subtareas / checklists / adjuntos.
