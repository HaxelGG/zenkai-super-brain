# Módulo 2º Cerebro (base de conocimiento + búsqueda) — Panel de Control Grupo Juana Sánchez

**Fecha:** 2026-05-26
**Estado:** Diseño aprobado · pendiente de plan de implementación
**Módulo nº:** 9 (ROADMAP "2º Cerebro / base de conocimiento", transversal)
**Alcance:** Base de conocimiento interna: notas (título + cuerpo + etiquetas) por empresa,
con búsqueda full-text en español. Sobre los cimientos existentes; no reconstruye cimientos
ni toca otros módulos ni el `sidebar.tsx` (lo enciende la terminal de diseño / el usuario).

---

## 1. Contexto y objetivo

El Panel tiene cimientos + 8 módulos en producción (CRM, Cotizaciones, Ventas, Finanzas,
Analítica, Tareas, Comunicación, Social/Citas de la otra terminal) y el sistema Atelier.
El **2º Cerebro** es el repositorio de conocimiento del equipo: procesos, proveedores, ideas,
manuales, decisiones — guardado como **notas** y recuperable por **búsqueda**.

**Objetivo:** crear/editar/borrar notas por empresa y encontrarlas rápido por texto (título,
cuerpo y etiquetas), de forma insensible a acentos (español).

## 2. Stack y patrón a reutilizar (NO se reconstruye)

- **Next.js 16 + Supabase + Vercel + shadcn/ui + Atelier**.
- Patrón de módulo (como Comunicación/Tareas): `src/lib/cerebro/{note,note.test,queries,actions}.ts`;
  rutas `src/app/(app)/cerebro/`; componentes `src/components/cerebro/`; migraciones versionadas
  (`0022`, `0023`); RLS por `company_id` con `accessible_company_ids()`; tipos en `src/types/db.ts`;
  lecturas filtradas por `getActiveCompany()`.
- **Atelier-native:** tokens, toasts sonner, sin parser de markdown (cuerpo en texto plano,
  mostrado respetando saltos de línea).
- **Deploy:** integrar por `main` con `git pull` antes de empujar (otra terminal en paralelo).
- **NO tocar `sidebar.tsx`** — el usuario/terminal de diseño enciende la entrada del módulo.

## 3. Decisiones tomadas (brainstorming 2026-05-26)

| Decisión | Elección |
|---|---|
| Motor de búsqueda | **Full-text Postgres** (tsvector + `unaccent` + ranking). Sin dependencias externas, sin API keys, sin coste. pgvector/semántica fuera de alcance. |
| Modelo de contenido | **Nota** = título + cuerpo (texto) + etiquetas libres (`text[]`). Sin adjuntos. |
| Aislamiento | **Por empresa** (`company_id` + RLS), filtrado por la empresa activa (como el resto). |
| Markdown | No se renderiza (texto plano con saltos de línea). |
| Tolerancia a typos | Fuera de alcance (ampliable con pg_trgm más adelante). |

## 4. Modelo de datos

Migraciones `0022_knowledge_notes.sql` (esquema + búsqueda) y `0023_knowledge_notes_rls.sql`
(RLS + función de búsqueda). Última migración previa: `0021_events`.

### 4.1 Tabla `knowledge_notes`

- `id` uuid pk default `gen_random_uuid()`
- `company_id` uuid not null → `companies(id)` on delete cascade
- `title` text not null
- `body` text not null default `''`
- `tags` text[] not null default `'{}'`
- `created_by` uuid → `profiles(id)` on delete set null
- `created_at` timestamptz not null default `now()`
- `updated_at` timestamptz not null default `now()`
- `search_vector` tsvector — **mantenido por trigger** (ver 4.2)

Índices: GIN en `search_vector`, GIN en `tags`, btree en `company_id`.

### 4.2 Búsqueda insensible a acentos (trigger, no columna generada)

`unaccent()` no es inmutable, así que `search_vector` se mantiene con un trigger
`before insert or update`:

```sql
create extension if not exists unaccent with schema extensions;

create or replace function public.knowledge_notes_search_vector()
returns trigger language plpgsql as $$
begin
  new.search_vector :=
    to_tsvector('spanish', extensions.unaccent(
      coalesce(new.title,'') || ' ' ||
      coalesce(new.body,'')  || ' ' ||
      coalesce(array_to_string(new.tags, ' '), '')
    ));
  new.updated_at := now();
  return new;
end $$;

create trigger trg_knowledge_notes_search
  before insert or update on public.knowledge_notes
  for each row execute function public.knowledge_notes_search_vector();
```

### 4.3 Función de búsqueda (RPC, respeta RLS)

`security invoker` para que aplique la RLS de la tabla al usuario que llama:

```sql
create or replace function public.search_knowledge_notes(p_query text)
returns setof public.knowledge_notes
language sql stable security invoker
set search_path = public, extensions as $$
  select n.*
  from public.knowledge_notes n
  where n.search_vector @@ websearch_to_tsquery('spanish', extensions.unaccent(p_query))
  order by ts_rank(n.search_vector, websearch_to_tsquery('spanish', extensions.unaccent(p_query))) desc,
           n.updated_at desc;
$$;
```

La RLS sigue filtrando por empresa accesible; la app filtra además por empresa activa.

### 4.4 RLS (`0023_knowledge_notes_rls.sql`)

```sql
alter table public.knowledge_notes enable row level security;

create policy "knowledge_notes por empresa accesible"
  on public.knowledge_notes for all to authenticated
  using (company_id in (select public.accessible_company_ids()))
  with check (company_id in (select public.accessible_company_ids()));
```

## 5. Lógica pura (TDD) — `src/lib/cerebro/note.ts`

- `parseTags(input: string): string[]` — separa por comas, `trim`, minúsculas, descarta vacíos,
  dedup preservando orden. (`"Proveedores, logística ,proveedores"` → `["proveedores","logística"]`).
- `normalizeQuery(q: string): string` — `trim` + colapsa espacios internos; `""` si en blanco.
- `noteExcerpt(body: string, max = 160): string` — `trim`; si `length > max`, corta a `max` y
  añade "…"; si no, devuelve el cuerpo.
- Tests escritos primero (Vitest), como en módulos previos.

## 6. Capa de datos

- **`queries.ts`** (filtran por empresa activa):
  - `listNotes(companyFilter, opts?: { q?: string; tag?: string })` — si `q` (normalizada, no
    vacía): llama al RPC `search_knowledge_notes` y luego filtra por empresa activa/`tag` en JS o
    encadenando; si no, `select` ordenado por `updated_at desc`. Con `tag`: filtra `tags @> {tag}`.
    Devuelve `NoteRow { id, title, excerpt, tags, updated_at }` (excerpt vía `noteExcerpt`).
  - `getNote(id)` — `{ id, title, body, tags, company_id, created_at, updated_at }`.
- **`actions.ts`** (server actions, `revalidatePath`):
  - `createNote(formData)` — `company_id`, `title` (obligatorio, rechaza vacío), `body`,
    `tags` (vía `parseTags`), `created_by` = usuario. Devuelve `{ id }`.
  - `updateNote(id, formData)` — actualiza `title`/`body`/`tags` (el trigger refresca
    `search_vector` y `updated_at`).
  - `deleteNote(id)`.

## 7. Pantallas (Atelier-native)

1. **`/cerebro`** — buscador arriba (input client que sincroniza `?q=`, envuelto en `<Suspense>`
   por `useSearchParams`, como `YearSelect`); chips de tags (clic → `?tag=`); lista de notas con
   título, extracto, tags y fecha de actualización; enlace a la nota. Botón "Nueva nota". Estado
   vacío claro. Requiere empresa concreta activa (no "Todas") para crear; alta en `/cerebro/nueva`.
2. **`/cerebro/nueva`** — formulario: título, cuerpo (Textarea), tags (texto separado por comas).
3. **`/cerebro/[id]`** — vista de la nota: título, cuerpo respetando saltos de línea
   (`whitespace-pre-wrap`), tags, metadatos (autor/fecha) + botones **Editar** y **Borrar**
   (confirm + toast).
4. **`/cerebro/[id]/editar`** — reutiliza el formulario de alta en modo edición.

## 8. Estructura de archivos

```
src/lib/cerebro/{note.ts, note.test.ts, queries.ts, actions.ts}
src/app/(app)/cerebro/{page.tsx, nueva/page.tsx, [id]/page.tsx, [id]/editar/page.tsx}
src/components/cerebro/
  note-list.tsx          # lista de notas (server-friendly)
  note-search.tsx        # client: input de búsqueda (sincroniza ?q=) + Suspense
  note-form.tsx          # client: alta/edición (toast)
  note-delete-button.tsx # client: borrar con confirm (toast)
supabase/migrations/{0022_knowledge_notes.sql, 0023_knowledge_notes_rls.sql}
```

## 9. Criterios de éxito

- Creo una nota en la empresa activa; aparece en la lista con su extracto y tags.
- Edito y borro notas (confirm); los cambios se reflejan tras refresh.
- Busco "logistica" y encuentra notas con "logística" (insensible a acentos), buscando en
  título, cuerpo y tags; filtro por tag desde un chip.
- RLS aísla notas por empresa (verificable como owner cambiando de empresa).
- La lógica pura (`parseTags`, `normalizeQuery`, `noteExcerpt`) tiene tests verdes; `npm run build`
  y `npm test` limpios.
- UI en lenguaje Atelier (tokens, toasts), coherente con el panel.
- No toca `sidebar.tsx` ni archivos de otros módulos.

## 10. Fuera de alcance

- Búsqueda semántica / pgvector (embeddings).
- Adjuntos de archivo / imágenes.
- Markdown renderizado; enlaces entre notas; versionado/historial; reacciones.
- Tolerancia a typos (trigram) — ampliable más adelante.
- Compartir notas entre empresas (cada nota es de una empresa).
