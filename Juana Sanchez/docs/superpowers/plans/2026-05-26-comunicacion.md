# Módulo Comunicación de equipo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir un tablón de mensajes internos por canal (asíncrono), aislado por empresa, Atelier-native: crear canales, escribir/borrar mensajes en un hilo cronológico.

**Architecture:** Dos tablas Supabase (`channels`, `messages`) con RLS por `company_id` (mensajes vía su canal padre). Lógica pura testeada (`initials`, `messagePreview`). Lecturas en `queries.ts`, mutaciones en `actions.ts` (server actions + toasts). Sin tiempo real: post + `revalidatePath`/`router.refresh`. UI con tokens/avatares Atelier. Ruta nueva `/comunicacion` + entrada en el sidebar; no toca otros módulos.

**Tech Stack:** Next.js 15 (App Router, TS), Supabase (`@supabase/ssr`), shadcn/ui + Atelier, sonner, Vitest, Vercel.

**Spec:** `docs/superpowers/specs/2026-05-26-comunicacion-design.md`

---

## Prerrequisitos

- Cimientos + 7 módulos + Atelier en `main`. Existen: `accessible_company_ids()`, `companies`, `profiles`; `getActiveCompany()`; `Toaster` (sonner) montado; sidebar por `SECTIONS`.
- Última migración: `0017_tasks_rls` (hay un `0014` duplicado, cosmético). Nuevas: `0018`, `0019`. Supabase ref: `hfwhrwdmwgdicpsfdvyq`.
- `messages.author_id` es la ÚNICA FK de `messages` a `profiles` → el join `author:profiles(full_name)` es inequívoco (no necesita nombre de constraint).
- Trabajar en rama feature desde `main`; **`git pull` antes de empujar** (otra terminal en paralelo). Comandos desde `juana-sanchez-panel/`.

---

## File Structure

```
juana-sanchez-panel/
├── supabase/migrations/
│   ├── 0018_channels.sql        # channels + messages + índices
│   └── 0019_channels_rls.sql    # RLS
├── src/
│   ├── types/db.ts              # MODIFY: regenerar tipos
│   ├── lib/comunicacion/
│   │   ├── message.ts           # initials + messagePreview (pura)
│   │   ├── message.test.ts
│   │   ├── queries.ts           # listChannels, getChannel, listMessages
│   │   └── actions.ts           # createChannel, deleteChannel, postMessage, deleteMessage
│   ├── app/(app)/comunicacion/
│   │   ├── page.tsx                 # lista de canales
│   │   ├── nuevo/page.tsx           # alta de canal
│   │   └── [id]/page.tsx            # hilo del canal
│   └── components/
│       ├── app-shell/sidebar.tsx    # MODIFY: entrada "Comunicación" (mínimo)
│       └── comunicacion/
│           ├── channel-list.tsx           # lista de canales (presentacional)
│           ├── channel-form.tsx           # client: alta de canal (toast)
│           ├── channel-delete-button.tsx  # client: borrar canal (confirm + toast)
│           ├── message-thread.tsx         # client: hilo + borrar mensaje
│           └── message-composer.tsx       # client: textarea + enviar
```

---

## Phase 1 — Base de datos

### Task 1: Migración del esquema

**Files:**
- Create: `supabase/migrations/0018_channels.sql`

- [ ] **Step 1: Escribir la migración**

Create `supabase/migrations/0018_channels.sql`:
```sql
create table public.channels (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  description text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (company_id, name)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  content text not null,
  created_at timestamptz not null default now()
);

create index on public.channels (company_id);
create index on public.messages (channel_id);
```

- [ ] **Step 2: Aplicar la migración**

Vía Supabase MCP `apply_migration` name `0018_channels`. Verify con `list_tables`: `channels`, `messages` presentes.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0018_channels.sql
git commit -m "feat(db): channels + messages schema"
```

### Task 2: RLS

**Files:**
- Create: `supabase/migrations/0019_channels_rls.sql`

- [ ] **Step 1: Escribir la migración de RLS**

Create `supabase/migrations/0019_channels_rls.sql`:
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

- [ ] **Step 2: Aplicar la migración**

Vía Supabase MCP `apply_migration` name `0019_channels_rls`. Luego `get_advisors` (type security): sin avisos "RLS disabled" para `channels`/`messages`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0019_channels_rls.sql
git commit -m "feat(db): channels/messages RLS (isolation by company)"
```

### Task 3: Regenerar tipos TypeScript

**Files:**
- Modify: `src/types/db.ts`

- [ ] **Step 1: Generar los tipos**

Vía Supabase MCP `generate_typescript_types` (proyecto `hfwhrwdmwgdicpsfdvyq`). Sobrescribir `src/types/db.ts`. Debe incluir `channels` y `messages`.

- [ ] **Step 2: Verificar build**

```bash
npm run build
```
Expected: compila sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/types/db.ts
git commit -m "chore(db): regenerate types with channels/messages"
```

---

## Phase 2 — Lógica pura (TDD)

### Task 4: initials + messagePreview

**Files:**
- Create: `src/lib/comunicacion/message.ts`
- Test: `src/lib/comunicacion/message.test.ts`

- [ ] **Step 1: Escribir el test que falla**

Create `src/lib/comunicacion/message.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { initials, messagePreview } from "./message";

describe("initials", () => {
  it("toma hasta 2 iniciales en mayúscula", () => {
    expect(initials("Juana Sánchez")).toBe("JS");
    expect(initials("Lolikas")).toBe("L");
    expect(initials("Uno Dos Tres")).toBe("UD");
  });
  it("devuelve ? sin nombre", () => {
    expect(initials(null)).toBe("?");
    expect(initials("")).toBe("?");
    expect(initials("   ")).toBe("?");
  });
});

describe("messagePreview", () => {
  it("devuelve el contenido recortado si excede el máximo", () => {
    expect(messagePreview("a".repeat(90), 80)).toBe("a".repeat(80) + "…");
  });
  it("devuelve el contenido tal cual si no excede", () => {
    expect(messagePreview("hola", 80)).toBe("hola");
    expect(messagePreview("  hola  ", 80)).toBe("hola");
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

```bash
npm test
```
Expected: FAIL — `./message` no existe.

- [ ] **Step 3: Implementar**

Create `src/lib/comunicacion/message.ts`:
```typescript
export function initials(fullName: string | null): string {
  if (!fullName || !fullName.trim()) return "?";
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export function messagePreview(content: string, max = 80): string {
  const c = content.trim();
  return c.length > max ? c.slice(0, max).trimEnd() + "…" : c;
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

```bash
npm test
```
Expected: PASS (toda la suite).

- [ ] **Step 5: Commit**

```bash
git add src/lib/comunicacion/message.ts src/lib/comunicacion/message.test.ts
git commit -m "feat(comunicacion): pure logic (initials + messagePreview) + tests"
```

---

## Phase 3 — Capa de datos

### Task 5: Queries de lectura

**Files:**
- Create: `src/lib/comunicacion/queries.ts`

- [ ] **Step 1: Escribir las lecturas**

Create `src/lib/comunicacion/queries.ts`:
```typescript
import { createClient } from "@/lib/supabase/server";
import { messagePreview } from "./message";

export type ChannelRow = {
  id: string;
  name: string;
  description: string | null;
  messageCount: number;
  lastMessage: string | null;
};

export type MessageRow = {
  id: string;
  content: string;
  created_at: string;
  author: { full_name: string | null } | null;
};

export async function listChannels(companyFilter: string | "all"): Promise<ChannelRow[]> {
  const supabase = await createClient();
  let cq = supabase.from("channels").select("id,name,description").order("created_at", { ascending: true });
  if (companyFilter !== "all") cq = cq.eq("company_id", companyFilter);
  const { data: channels, error } = await cq;
  if (error) throw error;
  const ids = (channels ?? []).map((c) => c.id);
  const counts = new Map<string, number>();
  const last = new Map<string, string>();
  if (ids.length > 0) {
    const { data: msgs, error: mErr } = await supabase
      .from("messages")
      .select("channel_id,content,created_at")
      .in("channel_id", ids)
      .order("created_at", { ascending: false });
    if (mErr) throw mErr;
    for (const m of msgs ?? []) {
      counts.set(m.channel_id, (counts.get(m.channel_id) ?? 0) + 1);
      if (!last.has(m.channel_id)) last.set(m.channel_id, m.content); // primero = más reciente
    }
  }
  return (channels ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    messageCount: counts.get(c.id) ?? 0,
    lastMessage: last.has(c.id) ? messagePreview(last.get(c.id)!) : null,
  }));
}

export async function getChannel(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("channels").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function listMessages(channelId: string): Promise<MessageRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("id,content,created_at,author:profiles(full_name)")
    .eq("channel_id", channelId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((m) => ({
    id: m.id,
    content: m.content,
    created_at: m.created_at,
    author: m.author as { full_name: string | null } | null,
  }));
}
```

- [ ] **Step 2: Verificar build**

```bash
npm run build
```
Expected: compila (si el join `author:profiles(full_name)` se queja, mantener el cast del `.map()`).

- [ ] **Step 3: Commit**

```bash
git add src/lib/comunicacion/queries.ts
git commit -m "feat(comunicacion): read queries (channels w/ preview, messages)"
```

### Task 6: Server actions

**Files:**
- Create: `src/lib/comunicacion/actions.ts`

- [ ] **Step 1: Escribir las actions**

Create `src/lib/comunicacion/actions.ts`:
```typescript
"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createChannel(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.from("channels").insert({
    company_id: String(formData.get("company_id")),
    name: String(formData.get("name")),
    description: (formData.get("description") as string) || null,
    created_by: user?.id ?? null,
  }).select("id").single();
  if (error) return { error: error.message };
  revalidatePath("/comunicacion");
  return { id: data.id };
}

export async function deleteChannel(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("channels").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/comunicacion");
  return { ok: true };
}

export async function postMessage(channelId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const content = String(formData.get("content") ?? "").trim();
  if (!content) return { error: "El mensaje está vacío." };
  const { error } = await supabase.from("messages").insert({
    channel_id: channelId,
    author_id: user?.id ?? null,
    content,
  });
  if (error) return { error: error.message };
  revalidatePath(`/comunicacion/${channelId}`);
  revalidatePath("/comunicacion");
  return { ok: true };
}

export async function deleteMessage(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("messages").delete().eq("id", id).select("channel_id").single();
  if (error) return { error: error.message };
  revalidatePath(`/comunicacion/${data.channel_id}`);
  return { ok: true };
}
```

- [ ] **Step 2: Verificar build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/comunicacion/actions.ts
git commit -m "feat(comunicacion): server actions (channels + messages)"
```

---

## Phase 4 — UI: sidebar + lista de canales

### Task 7: Sidebar + channel-list + channel-form + páginas (lista, nuevo)

**Files:**
- Modify: `src/components/app-shell/sidebar.tsx`
- Create: `src/components/comunicacion/channel-list.tsx`, `src/components/comunicacion/channel-form.tsx`, `src/app/(app)/comunicacion/page.tsx`, `src/app/(app)/comunicacion/nuevo/page.tsx`

- [ ] **Step 1: Entrada en el sidebar (mínimo)**

Leer `src/components/app-shell/sidebar.tsx` (por `SECTIONS`). Añadir `MessageSquare` al import de `lucide-react` y una entrada `{ href: "/comunicacion", label: "Comunicación", icon: MessageSquare }` en una sección de equipo/operación razonable (junto a Tareas si existe). Solo el símbolo de import + la entrada; no reestructurar.

- [ ] **Step 2: channel-list (presentacional)**

Create `src/components/comunicacion/channel-list.tsx`:
```tsx
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import type { ChannelRow } from "@/lib/comunicacion/queries";

export function ChannelList({ channels }: { channels: ChannelRow[] }) {
  if (channels.length === 0) return <p className="text-sm text-ink-3">No hay canales todavía.</p>;
  return (
    <div className="space-y-2">
      {channels.map((c) => (
        <Link key={c.id} href={`/comunicacion/${c.id}`}
          className="flex items-center justify-between gap-3 rounded-md border border-line bg-elevated p-3 transition-colors hover:bg-paper">
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-medium text-ink"><MessageSquare className="h-4 w-4 text-ink-4" /> {c.name}</p>
            <p className="truncate text-sm text-ink-3">{c.lastMessage ?? c.description ?? "Sin mensajes"}</p>
          </div>
          <span className="shrink-0 font-mono text-[11px] text-ink-4">{c.messageCount} msj</span>
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: channel-form (alta, toast)**

Create `src/components/comunicacion/channel-form.tsx`:
```tsx
"use client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createChannel } from "@/lib/comunicacion/actions";

export function ChannelForm({ companyId }: { companyId: string }) {
  const router = useRouter();
  async function onSubmit(fd: FormData) {
    const res = await createChannel(fd);
    if (res?.error) { toast.error(res.error); return; }
    toast.success("Canal creado");
    if (res?.id) router.push(`/comunicacion/${res.id}`);
    else router.push("/comunicacion");
  }
  return (
    <form action={onSubmit} className="max-w-lg space-y-4">
      <input type="hidden" name="company_id" value={companyId} />
      <div className="space-y-2">
        <Label htmlFor="name">Nombre del canal</Label>
        <Input id="name" name="name" placeholder="general, taller, ventas…" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea id="description" name="description" />
      </div>
      <Button type="submit">Crear canal</Button>
    </form>
  );
}
```
Nota: `createChannel` se importa directamente (server action llamada desde cliente, patrón del proyecto).

- [ ] **Step 4: Página lista de canales**

Create `src/app/(app)/comunicacion/page.tsx`:
```tsx
import Link from "next/link";
import { listChannels } from "@/lib/comunicacion/queries";
import { getActiveCompany } from "@/lib/active-company";
import { ChannelList } from "@/components/comunicacion/channel-list";
import { Button } from "@/components/ui/button";

export default async function ComunicacionPage() {
  const company = await getActiveCompany();
  const channels = await listChannels(company);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Comunicación</h1>
        <Button asChild><Link href="/comunicacion/nuevo">Nuevo canal</Link></Button>
      </div>
      <ChannelList channels={channels} />
    </div>
  );
}
```

- [ ] **Step 5: Página alta de canal**

Create `src/app/(app)/comunicacion/nuevo/page.tsx`:
```tsx
import { getActiveCompany } from "@/lib/active-company";
import { ChannelForm } from "@/components/comunicacion/channel-form";

export default async function NuevoCanalPage() {
  const company = await getActiveCompany();
  if (company === "all") {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Nuevo canal</h1>
        <p className="text-sm text-ink-3">Selecciona una empresa concreta en la cabecera para crear un canal.</p>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Nuevo canal</h1>
      <ChannelForm companyId={company} />
    </div>
  );
}
```

- [ ] **Step 6: Verificar build**

```bash
npm run build
```

- [ ] **Step 7: Commit**

```bash
git add src/components/app-shell/sidebar.tsx src/components/comunicacion/channel-list.tsx src/components/comunicacion/channel-form.tsx "src/app/(app)/comunicacion/page.tsx" "src/app/(app)/comunicacion/nuevo/page.tsx"
git commit -m "feat(comunicacion): sidebar entry + channel list/form/pages"
```

---

## Phase 5 — UI: hilo del canal

### Task 8: message-thread + message-composer + channel-delete-button + página [id]

**Files:**
- Create: `src/components/comunicacion/message-thread.tsx`, `src/components/comunicacion/message-composer.tsx`, `src/components/comunicacion/channel-delete-button.tsx`, `src/app/(app)/comunicacion/[id]/page.tsx`

- [ ] **Step 1: message-thread (hilo + borrar mensaje)**

Create `src/components/comunicacion/message-thread.tsx`:
```tsx
"use client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { initials } from "@/lib/comunicacion/message";
import { deleteMessage } from "@/lib/comunicacion/actions";
import type { MessageRow } from "@/lib/comunicacion/queries";

export function MessageThread({ messages }: { messages: MessageRow[] }) {
  const router = useRouter();
  async function onDelete(id: string) {
    if (!confirm("¿Borrar este mensaje?")) return;
    const res = await deleteMessage(id);
    if (res?.error) { toast.error(res.error); return; }
    router.refresh();
  }
  if (messages.length === 0) return <p className="text-sm text-ink-3">Sin mensajes. Escribe el primero.</p>;
  return (
    <div className="space-y-4">
      {messages.map((m) => (
        <div key={m.id} className="group flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 font-mono text-[11px] text-ink-3">
            {initials(m.author?.full_name ?? null)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-sm">
              <span className="font-medium text-ink">{m.author?.full_name ?? "Usuario"}</span>
              <span className="font-mono text-[10.5px] text-ink-4">{new Date(m.created_at).toLocaleString("es-ES", { timeZone: "UTC" })}</span>
            </p>
            <p className="whitespace-pre-wrap text-sm text-ink-2">{m.content}</p>
          </div>
          <Button variant="ghost" size="sm" className="opacity-0 transition-opacity group-hover:opacity-100" onClick={() => onDelete(m.id)}>Borrar</Button>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: message-composer (enviar)**

Create `src/components/comunicacion/message-composer.tsx`:
```tsx
"use client";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { postMessage } from "@/lib/comunicacion/actions";

export function MessageComposer({ channelId }: { channelId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  async function onSubmit(fd: FormData) {
    const res = await postMessage(channelId, fd);
    if (res?.error) { toast.error(res.error); return; }
    formRef.current?.reset();
    router.refresh();
  }
  return (
    <form ref={formRef} action={onSubmit} className="flex items-end gap-2 border-t border-line pt-4">
      <Textarea name="content" required placeholder="Escribe un mensaje…" className="min-h-[44px]" />
      <Button type="submit">Enviar</Button>
    </form>
  );
}
```

- [ ] **Step 3: channel-delete-button**

Create `src/components/comunicacion/channel-delete-button.tsx`:
```tsx
"use client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteChannel } from "@/lib/comunicacion/actions";

export function ChannelDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  async function onDelete() {
    if (!confirm("¿Borrar este canal y todos sus mensajes?")) return;
    const res = await deleteChannel(id);
    if (res?.error) { toast.error(res.error); return; }
    toast.success("Canal borrado");
    router.push("/comunicacion");
  }
  return <Button variant="ghost" size="sm" onClick={onDelete}>Borrar canal</Button>;
}
```

- [ ] **Step 4: Página del hilo**

Create `src/app/(app)/comunicacion/[id]/page.tsx`:
```tsx
import { getChannel, listMessages } from "@/lib/comunicacion/queries";
import { MessageThread } from "@/components/comunicacion/message-thread";
import { MessageComposer } from "@/components/comunicacion/message-composer";
import { ChannelDeleteButton } from "@/components/comunicacion/channel-delete-button";
import { Card } from "@/components/ui/card";

export default async function CanalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [channel, messages] = await Promise.all([getChannel(id), listMessages(id)]);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{channel.name as string}</h1>
          {channel.description && <p className="mt-1 text-sm text-ink-3">{channel.description as string}</p>}
        </div>
        <ChannelDeleteButton id={id} />
      </div>
      <Card className="space-y-4 p-4">
        <MessageThread messages={messages} />
        <MessageComposer channelId={id} />
      </Card>
    </div>
  );
}
```

- [ ] **Step 5: Verificar**

```bash
npm run dev
```
Con empresa concreta activa: `/comunicacion` → "Nuevo canal" → crear → entra al hilo vacío. Escribir un mensaje → aparece (tras refresh) con avatar de iniciales y hora. Borrar un mensaje. Volver a `/comunicacion` → el canal muestra preview del último mensaje y la cuenta. Borrar el canal. Parar con Ctrl+C.

- [ ] **Step 6: Commit**

```bash
git add src/components/comunicacion/message-thread.tsx src/components/comunicacion/message-composer.tsx src/components/comunicacion/channel-delete-button.tsx "src/app/(app)/comunicacion/[id]/page.tsx"
git commit -m "feat(comunicacion): channel thread (messages + composer + delete)"
```

---

## Phase 6 — Verificación, prueba y deploy

### Task 9: Suite, build, prueba y deploy

**Files:** (ninguno nuevo)

- [ ] **Step 1: Tests**

```bash
npm test
```
Expected: PASS — incluye `message.test.ts`.

- [ ] **Step 2: Build**

```bash
npm run build
```
Expected: rutas `/comunicacion`, `/comunicacion/nuevo`, `/comunicacion/[id]` presentes.

- [ ] **Step 3: Prueba manual (dev)** — flujo del Step 5 de la Task 8 + verificación RLS como owner (crear un canal en "Juana Sánchez" y otro en "Lolikas"; con el selector en "Lolikas" solo se ve el de Lolikas; en "Todas", ambos).

- [ ] **Step 4: Merge a main y deploy**

```bash
git checkout main
git pull --ff-only origin main
git merge --no-ff <rama-feature> -m "Merge <rama-feature>: módulo Comunicación de equipo (/comunicacion)"
```
Conflicto probable solo en `sidebar.tsx` (otra rama lo reestiló) → resolver conservando el estilo/secciones Atelier + la entrada "Comunicación". Tras resolver, `npm run build` y `npm test` deben pasar.

```bash
git push origin main
```

- [ ] **Step 5: Verificar deploy**

Vía Supabase MCP `list_migrations`: `0018_channels` y `0019_channels_rls` aplicadas.
Vía Vercel MCP `list_deployments` (projectId `prj_hIEU1GOM7JH457ZrWPxyYtcFBqkJ`, teamId `team_Zy4UDnbxRqU9SqD02b8uulQq`): el deployment del commit en estado READY.
Smoke test: `https://juana-sanchez-panel.vercel.app/comunicacion` redirige a `/login` sin sesión.

---

## Notas de ejecución

- **Migraciones primero:** Tasks 1-3 antes de queries/actions.
- **RLS:** `channels` por empresa; `messages` vía su canal padre (patrón `quote_items`→`quotes`).
- **Sin tiempo real:** post + `revalidatePath`/`router.refresh`. `listChannels` hace 2 lecturas (canales + mensajes para preview/cuenta) y agrega en JS — aceptable a esta escala.
- **Atelier-native:** tokens (`bg-elevated`, `border-line`, `text-ink-*`), avatares de iniciales, `font-mono` en horas, toasts sonner.
- **Empresa concreta para crear** canales (no "Todas").
- **Roles:** `author_id` opcional; hoy solo el owner; listo para el equipo.
- **Siguiente del ROADMAP:** Social media, Automatizaciones IA, 2º Cerebro.
```
