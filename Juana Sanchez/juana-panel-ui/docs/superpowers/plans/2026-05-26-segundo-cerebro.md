# 2º Cerebro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el módulo "2º Cerebro": base de conocimiento de notas (título + cuerpo + etiquetas) por empresa, con búsqueda full-text en español insensible a acentos.

**Architecture:** Tabla `knowledge_notes` con `search_vector` (tsvector) mantenido por trigger (`unaccent` + config `spanish`); búsqueda vía función RPC `search_knowledge_notes` (security invoker, respeta RLS). Lógica pura testeable en `src/lib/cerebro/note.ts`; capa de datos en `queries.ts`/`actions.ts`; UI Atelier-native en `src/components/cerebro/` y rutas `src/app/(app)/cerebro/`. Aislamiento por empresa con RLS `accessible_company_ids()` + filtro por empresa activa (`getActiveCompany()`).

**Tech Stack:** Next.js 16 (App Router, server actions, async params/searchParams), Supabase (Postgres + RLS + RPC), shadcn/ui, sistema Atelier (tokens `ink`/`line`/`paper`/`elevated`), sonner, Vitest.

**Reglas del proyecto (obligatorias):** NO tocar `src/components/app-shell/sidebar.tsx` (la entrada del módulo la enciende la terminal de diseño). Namespace propio `cerebro`. Migraciones descriptivas. Integrar por `main`. La rama de trabajo es `feat/cerebro`.

---

## File Structure

- `supabase/migrations/0022_knowledge_notes.sql` — tabla + trigger de `search_vector` + índices + RPC de búsqueda.
- `supabase/migrations/0023_knowledge_notes_rls.sql` — RLS de la tabla.
- `src/types/db.ts` — regenerado desde la BD (añade `knowledge_notes` y `search_knowledge_notes`).
- `src/lib/cerebro/note.ts` — lógica pura: `parseTags`, `normalizeQuery`, `noteExcerpt`.
- `src/lib/cerebro/note.test.ts` — tests Vitest de la lógica pura.
- `src/lib/cerebro/queries.ts` — `listNotes`, `getNote`.
- `src/lib/cerebro/actions.ts` — `createNote`, `updateNote`, `deleteNote`.
- `src/components/cerebro/note-search.tsx` — input de búsqueda (client, sincroniza `?q=`).
- `src/components/cerebro/note-list.tsx` — lista de notas (server) con tags enlazadas a `?tag=`.
- `src/components/cerebro/note-form.tsx` — formulario alta/edición (client, toast).
- `src/components/cerebro/note-delete-button.tsx` — borrar con confirm (client, toast).
- `src/app/(app)/cerebro/page.tsx` — lista + búsqueda.
- `src/app/(app)/cerebro/nueva/page.tsx` — alta.
- `src/app/(app)/cerebro/[id]/page.tsx` — vista de nota.
- `src/app/(app)/cerebro/[id]/editar/page.tsx` — edición.

---

### Task 1: Migración de esquema + búsqueda (`knowledge_notes`)

**Files:**
- Create: `supabase/migrations/0022_knowledge_notes.sql`
- DB: aplicar vía Supabase MCP `apply_migration` (project_id `hfwhrwdmwgdicpsfdvyq`)

- [ ] **Step 1: Escribir el archivo de migración**

Crear `supabase/migrations/0022_knowledge_notes.sql` con exactamente:

```sql
create extension if not exists unaccent with schema extensions;

create table public.knowledge_notes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  body text not null default '',
  tags text[] not null default '{}',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector
);

create index on public.knowledge_notes (company_id);
create index on public.knowledge_notes using gin (tags);
create index on public.knowledge_notes using gin (search_vector);

create or replace function public.knowledge_notes_search_vector()
returns trigger language plpgsql
set search_path = public, extensions as $$
begin
  new.search_vector :=
    to_tsvector('spanish', extensions.unaccent(
      coalesce(new.title, '') || ' ' ||
      coalesce(new.body, '')  || ' ' ||
      coalesce(array_to_string(new.tags, ' '), '')
    ));
  new.updated_at := now();
  return new;
end $$;

create trigger trg_knowledge_notes_search
  before insert or update on public.knowledge_notes
  for each row execute function public.knowledge_notes_search_vector();

create or replace function public.search_knowledge_notes(p_query text)
returns table (
  id uuid, company_id uuid, title text, body text, tags text[],
  created_by uuid, created_at timestamptz, updated_at timestamptz
)
language sql stable security invoker
set search_path = public, extensions as $$
  select n.id, n.company_id, n.title, n.body, n.tags, n.created_by, n.created_at, n.updated_at
  from public.knowledge_notes n,
       websearch_to_tsquery('spanish', extensions.unaccent(p_query)) q
  where n.search_vector @@ q
  order by ts_rank(n.search_vector, q) desc,
           n.updated_at desc;
$$;
```

- [ ] **Step 2: Aplicar la migración a la BD**

Usar la herramienta MCP `apply_migration` con `project_id` = `hfwhrwdmwgdicpsfdvyq`, `name` = `knowledge_notes`, y `query` = el contenido SQL del Step 1.
Esperado: éxito sin error.

- [ ] **Step 3: Verificar la tabla y la función en la BD**

Usar MCP `execute_sql` con `project_id` = `hfwhrwdmwgdicpsfdvyq` y query:

```sql
select to_regclass('public.knowledge_notes') as tabla,
       to_regprocedure('public.search_knowledge_notes(text)') as funcion;
```

Esperado: ambas columnas no nulas (`public.knowledge_notes` y `public.search_knowledge_notes(text)`).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0022_knowledge_notes.sql
git commit -m "feat(cerebro): tabla knowledge_notes + búsqueda full-text (trigger tsvector + RPC)"
```

---

### Task 2: Migración RLS + regenerar tipos

**Files:**
- Create: `supabase/migrations/0023_knowledge_notes_rls.sql`
- Modify: `src/types/db.ts` (regenerado)
- DB: aplicar vía Supabase MCP `apply_migration`

- [ ] **Step 1: Escribir el archivo de migración RLS**

Crear `supabase/migrations/0023_knowledge_notes_rls.sql` con exactamente:

```sql
alter table public.knowledge_notes enable row level security;

create policy "knowledge_notes por empresa accesible"
  on public.knowledge_notes for all to authenticated
  using (company_id in (select public.accessible_company_ids()))
  with check (company_id in (select public.accessible_company_ids()));
```

- [ ] **Step 2: Aplicar la migración a la BD**

Usar MCP `apply_migration` con `project_id` = `hfwhrwdmwgdicpsfdvyq`, `name` = `knowledge_notes_rls`, `query` = el SQL del Step 1.
Esperado: éxito sin error.

- [ ] **Step 3: Regenerar los tipos de TypeScript**

Usar MCP `generate_typescript_types` con `project_id` = `hfwhrwdmwgdicpsfdvyq`. Sobrescribir `src/types/db.ts` con el campo `types` devuelto (contenido literal, sin escapar). Debe contener `knowledge_notes` y `search_knowledge_notes`.

- [ ] **Step 4: Verificar que compila**

Run: `npm run build`
Expected: build sin errores de TypeScript.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0023_knowledge_notes_rls.sql src/types/db.ts
git commit -m "feat(cerebro): RLS de knowledge_notes + tipos regenerados"
```

---

### Task 3: Lógica pura (TDD) — `note.ts`

**Files:**
- Create: `src/lib/cerebro/note.ts`
- Test: `src/lib/cerebro/note.test.ts`

- [ ] **Step 1: Escribir el test que falla**

Crear `src/lib/cerebro/note.test.ts` con exactamente:

```ts
import { describe, it, expect } from "vitest";
import { parseTags, normalizeQuery, noteExcerpt } from "./note";

describe("parseTags", () => {
  it("separa por comas, recorta, minúsculas y descarta vacíos", () => {
    expect(parseTags("Proveedores, Logística , marketing")).toEqual([
      "proveedores", "logística", "marketing",
    ]);
  });
  it("deduplica preservando el orden", () => {
    expect(parseTags("uno, dos, uno")).toEqual(["uno", "dos"]);
  });
  it("devuelve [] si la entrada está vacía", () => {
    expect(parseTags("")).toEqual([]);
    expect(parseTags("   ,  , ")).toEqual([]);
  });
});

describe("normalizeQuery", () => {
  it("recorta y colapsa espacios internos", () => {
    expect(normalizeQuery("  hola   mundo  ")).toBe("hola mundo");
  });
  it("devuelve cadena vacía si está en blanco", () => {
    expect(normalizeQuery("   ")).toBe("");
    expect(normalizeQuery("")).toBe("");
  });
});

describe("noteExcerpt", () => {
  it("recorta el cuerpo si excede el máximo", () => {
    expect(noteExcerpt("a".repeat(200), 160)).toBe("a".repeat(160) + "…");
  });
  it("devuelve el cuerpo recortado tal cual si no excede", () => {
    expect(noteExcerpt("  hola  ", 160)).toBe("hola");
  });
});
```

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Run: `npm test -- note.test`
Expected: FAIL (no existe `./note`).

- [ ] **Step 3: Implementar la lógica mínima**

Crear `src/lib/cerebro/note.ts` con exactamente:

```ts
export function parseTags(input: string): string[] {
  const out: string[] = [];
  for (const raw of input.split(",")) {
    const t = raw.trim().toLowerCase();
    if (t && !out.includes(t)) out.push(t);
  }
  return out;
}

export function normalizeQuery(q: string): string {
  return q.trim().replace(/\s+/g, " ");
}

export function noteExcerpt(body: string, max = 160): string {
  const b = body.trim();
  return b.length > max ? b.slice(0, max).trimEnd() + "…" : b;
}
```

- [ ] **Step 4: Ejecutar el test para verificar que pasa**

Run: `npm test -- note.test`
Expected: PASS (3 describes verdes).

- [ ] **Step 5: Commit**

```bash
git add src/lib/cerebro/note.ts src/lib/cerebro/note.test.ts
git commit -m "feat(cerebro): lógica pura de notas (parseTags, normalizeQuery, noteExcerpt) con tests"
```

---

### Task 4: Capa de datos — `queries.ts` y `actions.ts`

**Files:**
- Create: `src/lib/cerebro/queries.ts`
- Create: `src/lib/cerebro/actions.ts`

- [ ] **Step 1: Escribir `queries.ts`**

Crear `src/lib/cerebro/queries.ts` con exactamente:

```ts
import { createClient } from "@/lib/supabase/server";
import { noteExcerpt, normalizeQuery } from "./note";

export type NoteRow = {
  id: string;
  title: string;
  excerpt: string;
  tags: string[];
  updated_at: string;
};

type RawNote = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  updated_at: string;
  company_id: string;
};

function toRow(n: RawNote): NoteRow {
  return { id: n.id, title: n.title, excerpt: noteExcerpt(n.body), tags: n.tags, updated_at: n.updated_at };
}

export async function listNotes(
  companyFilter: string | "all",
  opts: { q?: string; tag?: string } = {},
): Promise<NoteRow[]> {
  const supabase = await createClient();
  const q = normalizeQuery(opts.q ?? "");

  if (q) {
    const { data, error } = await supabase.rpc("search_knowledge_notes", { p_query: q });
    if (error) throw error;
    let rows = (data ?? []) as RawNote[];
    if (companyFilter !== "all") rows = rows.filter((n) => n.company_id === companyFilter);
    if (opts.tag) rows = rows.filter((n) => n.tags.includes(opts.tag!));
    return rows.map(toRow);
  }

  let query = supabase
    .from("knowledge_notes")
    .select("id,title,body,tags,updated_at,company_id")
    .order("updated_at", { ascending: false });
  if (companyFilter !== "all") query = query.eq("company_id", companyFilter);
  if (opts.tag) query = query.contains("tags", [opts.tag]);
  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? []) as RawNote[]).map(toRow);
}

export async function getNote(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("knowledge_notes")
    .select("id,title,body,tags,company_id,created_at,updated_at")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}
```

- [ ] **Step 2: Escribir `actions.ts`**

Crear `src/lib/cerebro/actions.ts` con exactamente:

```ts
"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { parseTags } from "./note";

export async function createNote(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "El título es obligatorio." };
  const { data, error } = await supabase.from("knowledge_notes").insert({
    company_id: String(formData.get("company_id")),
    title,
    body: String(formData.get("body") ?? ""),
    tags: parseTags(String(formData.get("tags") ?? "")),
    created_by: user?.id ?? null,
  }).select("id").single();
  if (error) return { error: error.message };
  revalidatePath("/cerebro");
  return { id: data.id };
}

export async function updateNote(id: string, formData: FormData) {
  const supabase = await createClient();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "El título es obligatorio." };
  const { error } = await supabase.from("knowledge_notes").update({
    title,
    body: String(formData.get("body") ?? ""),
    tags: parseTags(String(formData.get("tags") ?? "")),
  }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/cerebro/${id}`);
  revalidatePath("/cerebro");
  return { ok: true };
}

export async function deleteNote(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("knowledge_notes").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/cerebro");
  return { ok: true };
}
```

- [ ] **Step 3: Verificar que compila**

Run: `npm run build`
Expected: build sin errores de TypeScript (las tablas/funciones existen en `src/types/db.ts` desde la Task 2).

- [ ] **Step 4: Commit**

```bash
git add src/lib/cerebro/queries.ts src/lib/cerebro/actions.ts
git commit -m "feat(cerebro): capa de datos (listNotes/getNote + createNote/updateNote/deleteNote)"
```

---

### Task 5: Componentes (Atelier-native)

**Files:**
- Create: `src/components/cerebro/note-search.tsx`
- Create: `src/components/cerebro/note-list.tsx`
- Create: `src/components/cerebro/note-form.tsx`
- Create: `src/components/cerebro/note-delete-button.tsx`

- [ ] **Step 1: Escribir `note-search.tsx`**

Crear `src/components/cerebro/note-search.tsx` con exactamente:

```tsx
"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";

export function NoteSearch({ q }: { q: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = new FormData(e.currentTarget).get("q") as string;
    const sp = new URLSearchParams(params.toString());
    if (value.trim()) sp.set("q", value.trim());
    else sp.delete("q");
    sp.delete("tag");
    router.push(sp.toString() ? `${pathname}?${sp.toString()}` : pathname);
  }
  return (
    <form onSubmit={onSubmit} className="w-full max-w-sm">
      <Input name="q" defaultValue={q} placeholder="Buscar en el conocimiento…" aria-label="Buscar" />
    </form>
  );
}
```

- [ ] **Step 2: Escribir `note-list.tsx`**

Crear `src/components/cerebro/note-list.tsx` con exactamente:

```tsx
import Link from "next/link";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { NoteRow } from "@/lib/cerebro/queries";

export function NoteList({ notes }: { notes: NoteRow[] }) {
  if (notes.length === 0) return <p className="text-sm text-ink-3">No hay notas todavía.</p>;
  return (
    <div className="space-y-2">
      {notes.map((n) => (
        <div key={n.id} className="rounded-md border border-line bg-elevated p-3 transition-colors hover:bg-paper">
          <Link href={`/cerebro/${n.id}`} className="flex items-center gap-2 font-medium text-ink">
            <FileText className="h-4 w-4 text-ink-4" /> {n.title}
          </Link>
          {n.excerpt && <p className="mt-1 line-clamp-2 text-sm text-ink-3">{n.excerpt}</p>}
          {n.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {n.tags.map((t) => (
                <Link key={t} href={`/cerebro?tag=${encodeURIComponent(t)}`}>
                  <Badge variant="secondary" className="text-[11px]">{t}</Badge>
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Escribir `note-form.tsx`**

Crear `src/components/cerebro/note-form.tsx` con exactamente:

```tsx
"use client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createNote, updateNote } from "@/lib/cerebro/actions";

type NoteFormProps = {
  companyId?: string;
  note?: { id: string; title: string; body: string; tags: string[] };
};

export function NoteForm({ companyId, note }: NoteFormProps) {
  const router = useRouter();
  async function onSubmit(fd: FormData) {
    if (note) {
      const res = await updateNote(note.id, fd);
      if (res?.error) { toast.error(res.error); return; }
      toast.success("Nota guardada");
      router.push(`/cerebro/${note.id}`);
    } else {
      const res = await createNote(fd);
      if (res?.error) { toast.error(res.error); return; }
      toast.success("Nota creada");
      router.push(res?.id ? `/cerebro/${res.id}` : "/cerebro");
    }
  }
  return (
    <form action={onSubmit} className="max-w-lg space-y-4">
      {companyId && <input type="hidden" name="company_id" value={companyId} />}
      <div className="space-y-2">
        <Label htmlFor="title">Título</Label>
        <Input id="title" name="title" defaultValue={note?.title ?? ""} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="body">Contenido</Label>
        <Textarea id="body" name="body" rows={10} defaultValue={note?.body ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tags">Etiquetas (separadas por comas)</Label>
        <Input id="tags" name="tags" defaultValue={note?.tags.join(", ") ?? ""} placeholder="proveedores, logística" />
      </div>
      <Button type="submit">{note ? "Guardar cambios" : "Crear nota"}</Button>
    </form>
  );
}
```

- [ ] **Step 4: Escribir `note-delete-button.tsx`**

Crear `src/components/cerebro/note-delete-button.tsx` con exactamente:

```tsx
"use client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteNote } from "@/lib/cerebro/actions";

export function NoteDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  async function onDelete() {
    if (!confirm("¿Borrar esta nota?")) return;
    const res = await deleteNote(id);
    if (res?.error) { toast.error(res.error); return; }
    toast.success("Nota borrada");
    router.push("/cerebro");
  }
  return <Button variant="ghost" size="sm" onClick={onDelete}>Borrar</Button>;
}
```

- [ ] **Step 5: Verificar que compila**

Run: `npm run build`
Expected: build sin errores (los componentes aún no se importan en páginas, pero deben tipar bien).

- [ ] **Step 6: Commit**

```bash
git add src/components/cerebro/
git commit -m "feat(cerebro): componentes Atelier (note-search, note-list, note-form, note-delete-button)"
```

---

### Task 6: Páginas + verificación final

**Files:**
- Create: `src/app/(app)/cerebro/page.tsx`
- Create: `src/app/(app)/cerebro/nueva/page.tsx`
- Create: `src/app/(app)/cerebro/[id]/page.tsx`
- Create: `src/app/(app)/cerebro/[id]/editar/page.tsx`

- [ ] **Step 1: Escribir `page.tsx` (lista + búsqueda)**

Crear `src/app/(app)/cerebro/page.tsx` con exactamente:

```tsx
import Link from "next/link";
import { Suspense } from "react";
import { listNotes } from "@/lib/cerebro/queries";
import { getActiveCompany } from "@/lib/active-company";
import { NoteList } from "@/components/cerebro/note-list";
import { NoteSearch } from "@/components/cerebro/note-search";
import { Button } from "@/components/ui/button";

export default async function CerebroPage({
  searchParams,
}: { searchParams: Promise<{ q?: string; tag?: string }> }) {
  const company = await getActiveCompany();
  const { q, tag } = await searchParams;
  const notes = await listNotes(company, { q, tag });
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">2º Cerebro</h1>
        <Button asChild><Link href="/cerebro/nueva">Nueva nota</Link></Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Suspense fallback={<div className="h-9 w-full max-w-sm animate-pulse rounded-md bg-line" />}>
          <NoteSearch q={q ?? ""} />
        </Suspense>
        {tag && (
          <span className="text-sm text-ink-3">
            Filtrando por <span className="font-medium text-ink">{tag}</span> ·{" "}
            <Link href="/cerebro" className="underline">quitar</Link>
          </span>
        )}
      </div>
      <NoteList notes={notes} />
    </div>
  );
}
```

- [ ] **Step 2: Escribir `nueva/page.tsx`**

Crear `src/app/(app)/cerebro/nueva/page.tsx` con exactamente:

```tsx
import { getActiveCompany } from "@/lib/active-company";
import { NoteForm } from "@/components/cerebro/note-form";

export default async function NuevaNotaPage() {
  const company = await getActiveCompany();
  if (company === "all") {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Nueva nota</h1>
        <p className="text-sm text-ink-3">Selecciona una empresa concreta en la cabecera para crear una nota.</p>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Nueva nota</h1>
      <NoteForm companyId={company} />
    </div>
  );
}
```

- [ ] **Step 3: Escribir `[id]/page.tsx` (vista)**

Crear `src/app/(app)/cerebro/[id]/page.tsx` con exactamente:

```tsx
import Link from "next/link";
import { getNote } from "@/lib/cerebro/queries";
import { NoteDeleteButton } from "@/components/cerebro/note-delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function NotaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const note = await getNote(id);
  const tags = (note.tags as string[]) ?? [];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold">{note.title as string}</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link href={`/cerebro/${id}/editar`}>Editar</Link></Button>
          <NoteDeleteButton id={id} />
        </div>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((t) => (
            <Link key={t} href={`/cerebro?tag=${encodeURIComponent(t)}`}>
              <Badge variant="secondary" className="text-[11px]">{t}</Badge>
            </Link>
          ))}
        </div>
      )}
      <Card className="p-4">
        <p className="whitespace-pre-wrap text-sm text-ink">{(note.body as string) || "—"}</p>
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: Escribir `[id]/editar/page.tsx`**

Crear `src/app/(app)/cerebro/[id]/editar/page.tsx` con exactamente:

```tsx
import { getNote } from "@/lib/cerebro/queries";
import { NoteForm } from "@/components/cerebro/note-form";

export default async function EditarNotaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const note = await getNote(id);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Editar nota</h1>
      <NoteForm note={{
        id: note.id as string,
        title: note.title as string,
        body: (note.body as string) ?? "",
        tags: (note.tags as string[]) ?? [],
      }} />
    </div>
  );
}
```

- [ ] **Step 5: Verificar build y tests**

Run: `npm run build`
Expected: build limpio; aparecen las rutas `/cerebro`, `/cerebro/nueva`, `/cerebro/[id]`, `/cerebro/[id]/editar`.

Run: `npm test`
Expected: todos los tests verdes (incluye los 3 describes de `note.test.ts`).

- [ ] **Step 6: Commit**

```bash
git add "src/app/(app)/cerebro/"
git commit -m "feat(cerebro): páginas /cerebro (lista+búsqueda, nueva, ver, editar)"
```

---

## Notas de integración (tras completar todas las tasks)

- **NO** se añade entrada en `sidebar.tsx` (la enciende la terminal de diseño / el usuario).
- Verificación funcional sugerida (manual, como owner): crear una nota con tag "logística"; buscar "logistica" (sin tilde) y comprobar que aparece; filtrar por el tag; editar y borrar.
- Integración por `main`: `git pull` antes de mergear; el único conflicto probable es `src/types/db.ts` (generado) — resolver regenerando desde la BD o `--ours` si ya está regenerado tras la última migración compartida.
