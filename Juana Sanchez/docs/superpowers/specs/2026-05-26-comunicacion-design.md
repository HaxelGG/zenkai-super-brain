# Módulo Comunicación de equipo — Panel de Control Grupo Juana Sánchez

**Fecha:** 2026-05-26
**Estado:** Diseño aprobado · pendiente de plan de implementación
**Módulo nº:** 8 (ROADMAP "Comunicación de equipo", transversal)
**Alcance:** Tablón de mensajes internos por canal, asíncrono, aislado por empresa, sobre los
cimientos existentes. No reconstruye cimientos ni toca otros módulos/diseño de la otra terminal.

---

## 1. Contexto y objetivo

El Panel tiene cimientos + 7 módulos en producción y el sistema Atelier. Comunicación es un
módulo **transversal** del ROADMAP: notas/mensajes internos del equipo, organizados por canal.

**Roles inactivos:** hoy hay un único `owner`. Los mensajes funcionan, pero la utilidad real
llega con varios usuarios; el modelo (`author_id` → `profiles`) queda listo para el equipo.

**Build vs integrar:** se construye un tablón interno ligero (no se integra Slack/WhatsApp);
queda como opción futura si el equipo crece.

**Objetivo:** crear canales por empresa y escribir mensajes en un hilo cronológico (asíncrono).

## 2. Stack y patrón a reutilizar (NO se reconstruye)

- **Next.js 15 + Supabase + Vercel + shadcn/ui + Atelier**.
- Patrón de módulo (como Tareas/Finanzas): `src/lib/<m>/{queries,actions}.ts` + lógica pura
  testeable; rutas `src/app/(app)/<m>/`; componentes `src/components/<m>/`; migraciones
  versionadas (`0018`, `0019`); RLS por `company_id` con `accessible_company_ids()`; tipos en
  `src/types/db.ts`; lecturas filtradas por `getActiveCompany()`; entrada en el `Sidebar`.
- **Atelier-native:** tokens, toasts sonner, avatares de iniciales, `font-mono` en horas.
- **Deploy:** integrar por `main` con `git pull` antes de empujar (otra terminal en paralelo).

## 3. Decisiones tomadas (brainstorming 2026-05-26)

| Decisión | Elección |
|---|---|
| Tiempo real | **Asíncrono** (post + `revalidatePath`/refresh; sin Supabase Realtime/websockets). |
| Canales | **Por empresa** (`company_id` + RLS), filtrados por la empresa activa. |
| Menciones | Fuera de alcance. |
| Editar mensajes | No — solo **borrar** (vía RLS, el owner/autor accesible). |
| Build vs integrar | Build ligero. |

## 4. Modelo de datos

Migraciones `0018_channels.sql` (esquema) y `0019_channels_rls.sql` (RLS). Última migración: `0017_tasks_rls`.

### 4.1 Tablas

**`channels`**
- `id` uuid pk default `gen_random_uuid()`
- `company_id` uuid not null → `companies(id)` on delete cascade
- `name` text not null
- `description` text
- `created_by` uuid → `profiles(id)`
- `created_at` timestamptz not null default `now()`
- `unique (company_id, name)`

**`messages`**
- `id` uuid pk default `gen_random_uuid()`
- `channel_id` uuid not null → `channels(id)` on delete cascade
- `author_id` uuid → `profiles(id)` on delete set null
- `content` text not null
- `created_at` timestamptz not null default `now()`

Índices: `channels(company_id)`, `messages(channel_id)`.

### 4.2 RLS (`0019_channels_rls.sql`)

```sql
alter table public.channels enable row level security;
alter table public.messages enable row level security;

create policy "channels por empresa accesible" on public.channels for all to authenticated
  using (company_id in (select public.accessible_company_ids()))
  with check (company_id in (select public.accessible_company_ids()));

create policy "messages por canal accesible" on public.messages for all to authenticated
  using (channel_id in (select id from public.channels where company_id in (select public.accessible_company_ids())))
  with check (channel_id in (select id from public.channels where company_id in (select public.accessible_company_ids())));
```

## 5. Lógica pura (TDD) — `src/lib/comunicacion/message.ts`

- `initials(fullName: string | null): string` — iniciales en mayúscula, máx 2 ("Juana Sánchez"→"JS", "Lolikas"→"L", null/""→"?").
- `messagePreview(content: string, max = 80): string` — recorte: si `content.length > max`, corta a `max` y añade "…"; si no, devuelve `content` (trim).
- Tests escritos primero (como en módulos previos).

## 6. Capa de datos

- **`queries.ts`** (filtran por empresa activa):
  - `listChannels(companyFilter)` — canales con `{ id, name, description, messageCount, lastMessage }` (preview del último mensaje, vía `messagePreview`). Orden por `created_at`.
  - `getChannel(id)` — `{ id, name, description, company_id }`.
  - `listMessages(channelId)` — mensajes con `author:profiles(full_name)`, orden `created_at` asc.
- **`actions.ts`** (server actions, `revalidatePath`):
  - `createChannel(formData)` — `company_id`, `name`, `description`, `created_by`.
  - `deleteChannel(id)`.
  - `postMessage(channelId, formData)` — `content`, `author_id` = usuario.
  - `deleteMessage(id)`.

## 7. Pantallas (Atelier-native)

1. **Canales** (`/comunicacion`) — lista de canales de la empresa activa: nombre, descripción,
   preview del último mensaje y nº de mensajes; enlace al hilo. Botón "Nuevo canal".
   Requiere empresa concreta activa (no "Todas") para crear. Alta en `/comunicacion/nuevo`.
2. **Hilo** (`/comunicacion/[id]`) — cabecera (nombre + descripción + botón borrar canal con
   confirm); hilo de mensajes en orden cronológico (avatar de iniciales, nombre del autor,
   hora en `font-mono`, contenido; botón borrar por mensaje); **compositor** abajo (Textarea +
   "Enviar" → `postMessage` → refresh).
- Entrada `{ href: "/comunicacion", label: "Comunicación", icon: MessageSquare }` en
  `src/components/app-shell/sidebar.tsx` (cambio mínimo; el sidebar es por secciones → ubicar en
  una sección de equipo/operación razonable).

## 8. Estructura de archivos

```
src/lib/comunicacion/{message.ts, message.test.ts, queries.ts, actions.ts}
src/app/(app)/comunicacion/{page.tsx, nuevo/page.tsx, [id]/page.tsx}
src/components/comunicacion/
  channel-list.tsx       # lista de canales (server-friendly)
  channel-form.tsx       # client: alta de canal (toast)
  message-thread.tsx     # hilo + borrar mensaje (client donde haga falta)
  message-composer.tsx   # client: textarea + enviar (postMessage)
supabase/migrations/{0018_channels.sql, 0019_channels_rls.sql}
```

## 9. Criterios de éxito

- Creo un canal en la empresa activa; aparece en la lista con su preview/cuenta.
- Entro al canal, escribo un mensaje → aparece en el hilo (tras refresh); borro mensajes y el canal.
- RLS aísla canales/mensajes por empresa (verificable como owner cambiando de empresa).
- La lógica pura (`initials`, `messagePreview`) tiene tests verdes; `npm run build` y `npm test` limpios.
- UI en lenguaje Atelier (tokens, avatares de iniciales, toasts), coherente con el panel.
- No toca archivos de otros módulos ni del dashboard (salvo la entrada del sidebar).

## 10. Fuera de alcance

- Tiempo real (Supabase Realtime) / actualización en vivo.
- Menciones (@), notificaciones (email/push).
- Edición de mensajes; adjuntos/imágenes; reacciones; hilos anidados/respuestas.
- Canales de grupo (solo por empresa).
- Integración con Slack/WhatsApp u otras plataformas.
