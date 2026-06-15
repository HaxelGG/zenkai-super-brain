# Panel de Control Grupo Juana Sánchez — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir los cimientos de un panel de control interno (auth + multi-empresa + app shell + PWA) y el módulo de Inventario completo, sobre Next.js 15 + Supabase + Vercel.

**Architecture:** App Next.js 15 (App Router) nueva en `juana-sanchez-panel/`, separada de la landing. Supabase provee Postgres + Auth + RLS + Storage. El stock de cada producto se deriva de una tabla de movimientos auditables (`stock_movements`), nunca de un número editable. Multi-empresa vía columna `company_id` + políticas RLS preparadas para roles. UI con shadcn/ui. Deploy a Vercel por git push.

**Tech Stack:** Next.js 15 (App Router, TypeScript), Supabase (`@supabase/supabase-js`, `@supabase/ssr`), shadcn/ui + Tailwind, Vitest (tests de lógica), Vercel.

---

## File Structure

```
juana-sanchez-panel/
├── src/
│   ├── app/
│   │   ├── (auth)/login/page.tsx          # pantalla de login
│   │   ├── (app)/layout.tsx               # app shell (sidebar + topbar), protegido
│   │   ├── (app)/page.tsx                 # redirección a /inventario
│   │   ├── (app)/inventario/page.tsx      # lista de productos
│   │   ├── (app)/inventario/[id]/page.tsx # ficha de producto
│   │   ├── (app)/inventario/nuevo/page.tsx# alta de producto
│   │   ├── layout.tsx                      # root layout + PWA meta
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                             # shadcn (generado)
│   │   ├── app-shell/sidebar.tsx
│   │   ├── app-shell/company-switcher.tsx
│   │   └── inventory/                      # tablas, formularios, ajuste de stock
│   ├── lib/
│   │   ├── supabase/client.ts              # cliente browser
│   │   ├── supabase/server.ts              # cliente server (cookies)
│   │   ├── supabase/middleware.ts          # refresco de sesión
│   │   ├── inventory/stock.ts              # cálculo de stock (lógica pura, testeada)
│   │   ├── inventory/queries.ts            # lecturas de inventario
│   │   └── inventory/actions.ts            # server actions (mutaciones)
│   ├── types/db.ts                         # tipos generados de Supabase
│   └── middleware.ts                       # protege rutas (app)
├── supabase/
│   └── migrations/                         # SQL versionado
├── public/
│   ├── manifest.json
│   └── icons/                              # iconos PWA
├── .env.local                              # claves Supabase (gitignored)
├── package.json
└── next.config.ts
```

---

## Phase 0 — Scaffolding del proyecto

### Task 0: Crear la app Next.js y el repo

**Files:**
- Create: `juana-sanchez-panel/` (proyecto completo vía CLI)

- [ ] **Step 1: Crear la app Next.js**

Desde `C:\Users\jordy\Desktop\Juana Sanchez`:
```bash
npx create-next-app@latest juana-sanchez-panel --typescript --tailwind --app --src-dir --use-npm --no-eslint=false --turbopack
```
Responder: App Router sí, `src/` sí, alias de import `@/*` sí.

Expected: carpeta `juana-sanchez-panel/` con app Next.js que arranca.

- [ ] **Step 2: Verificar que arranca**

```bash
cd juana-sanchez-panel && npm run dev
```
Expected: servidor en `http://localhost:3000`, página por defecto de Next. Parar con Ctrl+C.

- [ ] **Step 3: Inicializar git e ignore**

```bash
cd juana-sanchez-panel && git init && git add -A && git commit -m "chore: scaffold Next.js panel app"
```
Verificar que `.env.local` está en `.gitignore` (create-next-app lo añade por defecto).

### Task 1: Instalar dependencias base

**Files:**
- Modify: `juana-sanchez-panel/package.json`

- [ ] **Step 1: Instalar Supabase y Vitest**

```bash
cd juana-sanchez-panel
npm install @supabase/supabase-js @supabase/ssr
npm install -D vitest @vitejs/plugin-react
```

- [ ] **Step 2: Inicializar shadcn/ui**

```bash
npx shadcn@latest init
```
Responder: estilo Default, color base Neutral, CSS variables sí.

- [ ] **Step 3: Añadir componentes shadcn que usaremos**

```bash
npx shadcn@latest add button input label table card dialog select badge form sonner dropdown-menu avatar
```
Expected: componentes en `src/components/ui/`.

- [ ] **Step 4: Configurar Vitest**

Create: `juana-sanchez-panel/vitest.config.ts`
```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: { environment: "node", globals: true },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
```

Añadir a `package.json` scripts:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: add supabase, shadcn/ui, vitest"
```

---

## Phase 1 — Supabase: esquema, RLS, seed

> Estas tareas usan el Supabase MCP. Crear el proyecto Supabase primero (vía MCP o dashboard), copiar URL + anon key a `.env.local`:
> ```
> NEXT_PUBLIC_SUPABASE_URL=...
> NEXT_PUBLIC_SUPABASE_ANON_KEY=...
> ```

### Task 2: Migración del esquema base (empresas, perfiles, roles)

**Files:**
- Create: `juana-sanchez-panel/supabase/migrations/0001_foundation.sql`

- [ ] **Step 1: Escribir la migración de cimientos**

```sql
-- Empresas del grupo
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  created_at timestamptz not null default now()
);

-- Perfil de usuario (1:1 con auth.users), con rol
create type public.user_role as enum ('owner', 'admin', 'staff');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.user_role not null default 'staff',
  created_at timestamptz not null default now()
);

-- Qué empresas puede ver cada usuario (para activar roles después)
create table public.user_companies (
  user_id uuid not null references public.profiles(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  primary key (user_id, company_id)
);

-- Crear perfil automáticamente al registrarse
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- Helper: ¿el usuario actual es owner?
create function public.is_owner()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'owner');
$$;

-- Helper: empresas accesibles por el usuario actual (owner ve todas)
create function public.accessible_company_ids()
returns setof uuid language sql security definer stable set search_path = public as $$
  select id from public.companies where public.is_owner()
  union
  select company_id from public.user_companies where user_id = auth.uid();
$$;
```

- [ ] **Step 2: Aplicar la migración**

Vía Supabase MCP `apply_migration` con name `0001_foundation` y el SQL anterior.
Expected: tablas creadas sin error.

- [ ] **Step 3: Habilitar RLS y políticas de cimientos**

Aplicar como migración `0002_foundation_rls`:
```sql
alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.user_companies enable row level security;

create policy "companies visibles para usuarios autenticados"
  on public.companies for select to authenticated
  using (id in (select public.accessible_company_ids()));

create policy "perfil propio legible" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_owner());
create policy "perfil propio editable" on public.profiles for update to authenticated
  using (id = auth.uid());

create policy "user_companies visible al owner" on public.user_companies for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
```

- [ ] **Step 4: Seed de las tres empresas**

Aplicar como migración `0003_seed_companies`:
```sql
insert into public.companies (slug, name) values
  ('juana-sanchez', 'Juana Sánchez'),
  ('lolikas', 'Lolikas'),
  ('printellar', 'Printellar')
on conflict (slug) do nothing;
```

- [ ] **Step 5: Commit**

```bash
git add supabase/ && git commit -m "feat(db): foundation schema, RLS, company seed"
```

### Task 3: Migración del módulo Inventario

**Files:**
- Create: `juana-sanchez-panel/supabase/migrations/0004_inventory.sql`

- [ ] **Step 1: Escribir la migración de inventario**

```sql
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (company_id, name)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  sku text,
  description text,
  cost numeric(12,2) not null default 0,
  price numeric(12,2) not null default 0,
  image_url text,
  status text not null default 'active' check (status in ('active','inactive')),
  low_stock_threshold integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, sku)
);

create type public.movement_type as enum ('in', 'out', 'adjust');

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  type public.movement_type not null,
  quantity integer not null,
  reason text not null,
  note text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index on public.products (company_id);
create index on public.stock_movements (product_id);

-- Vista de stock actual por producto (suma de movimientos)
create view public.product_stock as
  select p.id as product_id,
         coalesce(sum(case m.type when 'out' then -m.quantity else m.quantity end), 0)::int as stock
  from public.products p
  left join public.stock_movements m on m.product_id = p.id
  group by p.id;
```

- [ ] **Step 2: Aplicar la migración**

Vía Supabase MCP `apply_migration` name `0004_inventory`.

- [ ] **Step 3: RLS de inventario (aislamiento por empresa)**

Aplicar como `0005_inventory_rls`:
```sql
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.stock_movements enable row level security;

create policy "categories por empresa accesible" on public.categories for all to authenticated
  using (company_id in (select public.accessible_company_ids()))
  with check (company_id in (select public.accessible_company_ids()));

create policy "products por empresa accesible" on public.products for all to authenticated
  using (company_id in (select public.accessible_company_ids()))
  with check (company_id in (select public.accessible_company_ids()));

create policy "movements por producto accesible" on public.stock_movements for all to authenticated
  using (product_id in (
    select id from public.products where company_id in (select public.accessible_company_ids())
  ))
  with check (product_id in (
    select id from public.products where company_id in (select public.accessible_company_ids())
  ));
```

- [ ] **Step 4: Generar tipos TypeScript**

Vía Supabase MCP `generate_typescript_types`, guardar en `src/types/db.ts`.

- [ ] **Step 5: Commit**

```bash
git add supabase/ src/types/db.ts && git commit -m "feat(db): inventory schema, stock view, RLS"
```

---

## Phase 2 — Clientes Supabase y Auth

### Task 4: Clientes Supabase (browser, server, middleware)

**Files:**
- Create: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`, `src/middleware.ts`

- [ ] **Step 1: Cliente browser**

Create `src/lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/db";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 2: Cliente server**

Create `src/lib/supabase/server.ts`:
```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/db";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try { toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
          catch { /* invocado desde Server Component: ignorar */ }
        },
      },
    }
  );
}
```

- [ ] **Step 3: Middleware de refresco de sesión**

Create `src/lib/supabase/middleware.ts`:
```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/db";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  const isAuthPage = request.nextUrl.pathname.startsWith("/login");
  if (!user && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL("/inventario", request.url));
  }
  return response;
}
```

Create `src/middleware.ts`:
```typescript
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|.*\\.png$).*)"],
};
```

- [ ] **Step 4: Verificar build**

```bash
npm run build
```
Expected: compila sin errores de tipos.

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase src/middleware.ts && git commit -m "feat(auth): supabase clients + session middleware"
```

### Task 5: Pantalla de login

**Files:**
- Create: `src/app/(auth)/login/page.tsx`, `src/app/(auth)/login/actions.ts`

- [ ] **Step 1: Server action de login**

Create `src/app/(auth)/login/actions.ts`:
```typescript
"use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function login(_prev: unknown, formData: FormData) {
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Email o contraseña incorrectos." };
  redirect("/inventario");
}
```

- [ ] **Step 2: Formulario de login**

Create `src/app/(auth)/login/page.tsx`:
```tsx
"use client";
import { useActionState } from "react";
import { login } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
      <Card className="w-full max-w-sm p-6">
        <h1 className="mb-1 text-xl font-semibold">Grupo Juana Sánchez</h1>
        <p className="mb-6 text-sm text-neutral-500">Panel de control</p>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Entrando…" : "Entrar"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Crear el usuario owner**

En Supabase (dashboard Auth → Add user, o MCP), crear el usuario del dueño con email/contraseña. Luego marcar su rol como owner vía SQL:
```sql
update public.profiles set role = 'owner'
where id = (select id from auth.users where email = 'EMAIL_DEL_DUENO');
```

- [ ] **Step 4: Verificar login manualmente**

```bash
npm run dev
```
Ir a `http://localhost:3000` → debe redirigir a `/login`. Iniciar sesión → redirige a `/inventario` (aún 404, lo creamos en Phase 3). Confirmar que sin sesión no se accede a `/inventario`.

- [ ] **Step 5: Commit**

```bash
git add src/app && git commit -m "feat(auth): login page + action"
```

---

## Phase 3 — App shell (layout, sidebar, selector de empresa)

### Task 6: Layout protegido y sidebar

**Files:**
- Create: `src/app/(app)/layout.tsx`, `src/components/app-shell/sidebar.tsx`, `src/app/(app)/page.tsx`

- [ ] **Step 1: Redirección raíz**

Create `src/app/(app)/page.tsx`:
```tsx
import { redirect } from "next/navigation";
export default function Home() { redirect("/inventario"); }
```

- [ ] **Step 2: Sidebar**

Create `src/components/app-shell/sidebar.tsx`:
```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package } from "lucide-react";

const NAV = [{ href: "/inventario", label: "Inventario", icon: Package }];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 p-3">
      {NAV.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href}
          className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
            pathname.startsWith(href) ? "bg-neutral-200 font-medium" : "hover:bg-neutral-100"
          }`}>
          <Icon className="h-4 w-4" /> {label}
        </Link>
      ))}
    </nav>
  );
}
```

- [ ] **Step 3: Layout con shell responsive**

Create `src/app/(app)/layout.tsx`:
```tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/app-shell/sidebar";
import { CompanySwitcher } from "@/components/app-shell/company-switcher";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: companies } = await supabase.from("companies").select("id, slug, name").order("name");

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b md:w-60 md:border-b-0 md:border-r">
        <div className="p-3"><CompanySwitcher companies={companies ?? []} /></div>
        <Sidebar />
      </aside>
      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 4: Verificar**

`npm run dev`, login, confirmar que se ve el shell con sidebar (Inventario) en escritorio y apilado en móvil (DevTools responsive).

- [ ] **Step 5: Commit**

```bash
git add src/app src/components && git commit -m "feat(shell): protected layout + sidebar"
```

### Task 7: Selector de empresa (estado en cookie)

**Files:**
- Create: `src/components/app-shell/company-switcher.tsx`, `src/lib/active-company.ts`

- [ ] **Step 1: Helper de empresa activa (server)**

Create `src/lib/active-company.ts`:
```typescript
import { cookies } from "next/headers";
const COOKIE = "active_company";

export async function getActiveCompany(): Promise<string | "all"> {
  const c = await cookies();
  return c.get(COOKIE)?.value ?? "all";
}

export async function setActiveCompanyCookie(value: string) {
  "use server";
  const c = await cookies();
  c.set(COOKIE, value, { path: "/", maxAge: 60 * 60 * 24 * 365 });
}
```

- [ ] **Step 2: Componente selector**

Create `src/components/app-shell/company-switcher.tsx`:
```tsx
"use client";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { setActiveCompanyCookie } from "@/lib/active-company";

type Company = { id: string; slug: string; name: string };

export function CompanySwitcher({ companies, active }: { companies: Company[]; active?: string }) {
  const router = useRouter();
  async function onChange(value: string) {
    await setActiveCompanyCookie(value);
    router.refresh();
  }
  return (
    <Select defaultValue={active ?? "all"} onValueChange={onChange}>
      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todas las empresas</SelectItem>
        {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
```

- [ ] **Step 3: Pasar empresa activa al layout**

Modify `src/app/(app)/layout.tsx`: importar `getActiveCompany`, leerla y pasar `active={active}` a `<CompanySwitcher>`.
```tsx
import { getActiveCompany } from "@/lib/active-company";
// dentro del componente, tras obtener companies:
const active = await getActiveCompany();
// ...
<CompanySwitcher companies={companies ?? []} active={active} />
```

- [ ] **Step 4: Verificar**

`npm run dev`, cambiar de empresa en el selector, confirmar que persiste tras recargar (cookie).

- [ ] **Step 5: Commit**

```bash
git add src && git commit -m "feat(shell): company switcher with cookie state"
```

---

## Phase 4 — Inventario: capa de datos (TDD)

### Task 8: Cálculo de stock (lógica pura, test primero)

**Files:**
- Create: `src/lib/inventory/stock.ts`, `src/lib/inventory/stock.test.ts`

- [ ] **Step 1: Escribir el test que falla**

Create `src/lib/inventory/stock.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { computeStock, isLowStock, type Movement } from "./stock";

describe("computeStock", () => {
  it("suma entradas y ajustes, resta salidas", () => {
    const movements: Movement[] = [
      { type: "in", quantity: 10 },
      { type: "out", quantity: 3 },
      { type: "adjust", quantity: 1 },
    ];
    expect(computeStock(movements)).toBe(8);
  });
  it("devuelve 0 sin movimientos", () => {
    expect(computeStock([])).toBe(0);
  });
});

describe("isLowStock", () => {
  it("es bajo cuando stock <= umbral y umbral > 0", () => {
    expect(isLowStock(2, 5)).toBe(true);
    expect(isLowStock(5, 5)).toBe(true);
    expect(isLowStock(6, 5)).toBe(false);
  });
  it("nunca es bajo si el umbral es 0", () => {
    expect(isLowStock(0, 0)).toBe(false);
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

```bash
npm test
```
Expected: FAIL — `./stock` no existe.

- [ ] **Step 3: Implementar la lógica mínima**

Create `src/lib/inventory/stock.ts`:
```typescript
export type Movement = { type: "in" | "out" | "adjust"; quantity: number };

export function computeStock(movements: Movement[]): number {
  return movements.reduce((sum, m) => sum + (m.type === "out" ? -m.quantity : m.quantity), 0);
}

export function isLowStock(stock: number, threshold: number): boolean {
  return threshold > 0 && stock <= threshold;
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

```bash
npm test
```
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/inventory && git commit -m "feat(inventory): stock computation logic + tests"
```

### Task 9: Queries de inventario

**Files:**
- Create: `src/lib/inventory/queries.ts`

- [ ] **Step 1: Lecturas de productos y resumen**

Create `src/lib/inventory/queries.ts`:
```typescript
import { createClient } from "@/lib/supabase/server";

export type ProductRow = {
  id: string; name: string; sku: string | null; price: number; cost: number;
  status: string; low_stock_threshold: number; company_id: string;
  category: { name: string } | null; stock: number;
};

export async function listProducts(companyFilter: string | "all"): Promise<ProductRow[]> {
  const supabase = await createClient();
  let q = supabase
    .from("products")
    .select("id,name,sku,price,cost,status,low_stock_threshold,company_id,category:categories(name),product_stock(stock)")
    .order("name");
  if (companyFilter !== "all") q = q.eq("company_id", companyFilter);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((p: any) => ({
    ...p,
    category: p.category,
    stock: p.product_stock?.stock ?? 0,
  }));
}

export async function getProduct(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(id,name), product_stock(stock)")
    .eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function listMovements(productId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stock_movements")
    .select("id,type,quantity,reason,note,created_at")
    .eq("product_id", productId).order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function inventorySummary(companyFilter: string | "all") {
  const products = await listProducts(companyFilter);
  const totalProducts = products.length;
  const stockValue = products.reduce((s, p) => s + p.stock * p.price, 0);
  const lowStock = products.filter((p) => p.low_stock_threshold > 0 && p.stock <= p.low_stock_threshold);
  return { totalProducts, stockValue, lowStock };
}
```

- [ ] **Step 2: Verificar build**

```bash
npm run build
```
Expected: compila (puede requerir ajustar el tipo del select anidado; usar `any` en el map como arriba).

- [ ] **Step 3: Commit**

```bash
git add src/lib/inventory/queries.ts && git commit -m "feat(inventory): read queries + summary"
```

### Task 10: Server actions (mutaciones)

**Files:**
- Create: `src/lib/inventory/actions.ts`

- [ ] **Step 1: Actions de producto y movimiento**

Create `src/lib/inventory/actions.ts`:
```typescript
"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createProduct(formData: FormData) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").insert({
    company_id: String(formData.get("company_id")),
    name: String(formData.get("name")),
    sku: (formData.get("sku") as string) || null,
    description: (formData.get("description") as string) || null,
    cost: Number(formData.get("cost") || 0),
    price: Number(formData.get("price") || 0),
    low_stock_threshold: Number(formData.get("low_stock_threshold") || 0),
  }).select("id").single();
  if (error) return { error: error.message };
  revalidatePath("/inventario");
  return { id: data.id };
}

export async function updateProduct(id: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("products").update({
    name: String(formData.get("name")),
    sku: (formData.get("sku") as string) || null,
    description: (formData.get("description") as string) || null,
    cost: Number(formData.get("cost") || 0),
    price: Number(formData.get("price") || 0),
    low_stock_threshold: Number(formData.get("low_stock_threshold") || 0),
    status: String(formData.get("status") || "active"),
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/inventario/${id}`);
  revalidatePath("/inventario");
  return { ok: true };
}

export async function adjustStock(productId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("stock_movements").insert({
    product_id: productId,
    type: formData.get("type") as "in" | "out" | "adjust",
    quantity: Number(formData.get("quantity")),
    reason: String(formData.get("reason")),
    note: (formData.get("note") as string) || null,
    created_by: user?.id ?? null,
  });
  if (error) return { error: error.message };
  revalidatePath(`/inventario/${productId}`);
  revalidatePath("/inventario");
  return { ok: true };
}
```

- [ ] **Step 2: Verificar build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/inventory/actions.ts && git commit -m "feat(inventory): server actions for products + stock"
```

---

## Phase 5 — Inventario: UI

### Task 11: Lista de productos + resumen

**Files:**
- Create: `src/app/(app)/inventario/page.tsx`, `src/components/inventory/product-table.tsx`, `src/components/inventory/summary-cards.tsx`

- [ ] **Step 1: Tarjetas de resumen**

Create `src/components/inventory/summary-cards.tsx`:
```tsx
import { Card } from "@/components/ui/card";

export function SummaryCards({ totalProducts, stockValue, lowStockCount }:
  { totalProducts: number; stockValue: number; lowStockCount: number }) {
  const fmt = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
  const items = [
    { label: "Productos", value: String(totalProducts) },
    { label: "Valor de stock", value: fmt.format(stockValue) },
    { label: "Bajo mínimo", value: String(lowStockCount) },
  ];
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {items.map((i) => (
        <Card key={i.label} className="p-4">
          <p className="text-sm text-neutral-500">{i.label}</p>
          <p className="text-2xl font-semibold">{i.value}</p>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Tabla de productos**

Create `src/components/inventory/product-table.tsx`:
```tsx
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { isLowStock } from "@/lib/inventory/stock";
import type { ProductRow } from "@/lib/inventory/queries";

export function ProductTable({ products }: { products: ProductRow[] }) {
  if (products.length === 0) return <p className="text-sm text-neutral-500">No hay productos todavía.</p>;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Producto</TableHead><TableHead>SKU</TableHead>
          <TableHead>Categoría</TableHead><TableHead className="text-right">Stock</TableHead>
          <TableHead className="text-right">Precio</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((p) => {
          const low = isLowStock(p.stock, p.low_stock_threshold);
          return (
            <TableRow key={p.id}>
              <TableCell><Link href={`/inventario/${p.id}`} className="font-medium hover:underline">{p.name}</Link></TableCell>
              <TableCell>{p.sku ?? "—"}</TableCell>
              <TableCell>{p.category?.name ?? "—"}</TableCell>
              <TableCell className="text-right">
                {low ? <Badge variant="destructive">{p.stock}</Badge> : p.stock}
              </TableCell>
              <TableCell className="text-right">{p.price.toFixed(2)} €</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
```

- [ ] **Step 3: Página de lista**

Create `src/app/(app)/inventario/page.tsx`:
```tsx
import Link from "next/link";
import { listProducts, inventorySummary } from "@/lib/inventory/queries";
import { getActiveCompany } from "@/lib/active-company";
import { SummaryCards } from "@/components/inventory/summary-cards";
import { ProductTable } from "@/components/inventory/product-table";
import { Button } from "@/components/ui/button";

export default async function InventarioPage() {
  const company = await getActiveCompany();
  const [products, summary] = await Promise.all([listProducts(company), inventorySummary(company)]);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Inventario</h1>
        <Button asChild><Link href="/inventario/nuevo">Nuevo producto</Link></Button>
      </div>
      <SummaryCards totalProducts={summary.totalProducts} stockValue={summary.stockValue} lowStockCount={summary.lowStock.length} />
      <ProductTable products={products} />
    </div>
  );
}
```

- [ ] **Step 4: Verificar**

`npm run dev` → `/inventario` muestra resumen vacío y "No hay productos todavía." sin errores.

- [ ] **Step 5: Commit**

```bash
git add src && git commit -m "feat(inventory): product list + summary UI"
```

### Task 12: Alta y ficha de producto + ajuste de stock

**Files:**
- Create: `src/app/(app)/inventario/nuevo/page.tsx`, `src/app/(app)/inventario/[id]/page.tsx`, `src/components/inventory/product-form.tsx`, `src/components/inventory/stock-adjust-form.tsx`, `src/components/inventory/movement-list.tsx`

- [ ] **Step 1: Formulario de producto (reutilizable alta/edición)**

Create `src/components/inventory/product-form.tsx`:
```tsx
"use client";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Company = { id: string; name: string };
type Defaults = Partial<{ name: string; sku: string; cost: number; price: number; low_stock_threshold: number; description: string; company_id: string }>;

export function ProductForm({ companies, defaults, action }:
  { companies: Company[]; defaults?: Defaults; action: (fd: FormData) => Promise<{ error?: string; id?: string; ok?: boolean }> }) {
  const router = useRouter();
  async function onSubmit(fd: FormData) {
    const res = await action(fd);
    if (res?.error) { alert(res.error); return; }
    if (res?.id) router.push(`/inventario/${res.id}`);
    else router.push("/inventario");
  }
  return (
    <form action={onSubmit} className="max-w-lg space-y-4">
      {companies.length > 0 && (
        <div className="space-y-2">
          <Label>Empresa</Label>
          <Select name="company_id" defaultValue={defaults?.company_id ?? companies[0]?.id} required>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-2"><Label htmlFor="name">Nombre</Label><Input id="name" name="name" defaultValue={defaults?.name} required /></div>
      <div className="space-y-2"><Label htmlFor="sku">SKU</Label><Input id="sku" name="sku" defaultValue={defaults?.sku} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label htmlFor="cost">Coste (€)</Label><Input id="cost" name="cost" type="number" step="0.01" defaultValue={defaults?.cost ?? 0} /></div>
        <div className="space-y-2"><Label htmlFor="price">Precio (€)</Label><Input id="price" name="price" type="number" step="0.01" defaultValue={defaults?.price ?? 0} /></div>
      </div>
      <div className="space-y-2"><Label htmlFor="low_stock_threshold">Umbral de stock bajo</Label><Input id="low_stock_threshold" name="low_stock_threshold" type="number" defaultValue={defaults?.low_stock_threshold ?? 0} /></div>
      <Button type="submit">Guardar</Button>
    </form>
  );
}
```

- [ ] **Step 2: Página de alta**

Create `src/app/(app)/inventario/nuevo/page.tsx`:
```tsx
import { createClient } from "@/lib/supabase/server";
import { createProduct } from "@/lib/inventory/actions";
import { ProductForm } from "@/components/inventory/product-form";

export default async function NuevoProductoPage() {
  const supabase = await createClient();
  const { data: companies } = await supabase.from("companies").select("id,name").order("name");
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Nuevo producto</h1>
      <ProductForm companies={companies ?? []} action={createProduct} />
    </div>
  );
}
```

- [ ] **Step 3: Lista de movimientos**

Create `src/components/inventory/movement-list.tsx`:
```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Movement = { id: string; type: string; quantity: number; reason: string; note: string | null; created_at: string };
const LABEL: Record<string, string> = { in: "Entrada", out: "Salida", adjust: "Ajuste" };

export function MovementList({ movements }: { movements: Movement[] }) {
  if (movements.length === 0) return <p className="text-sm text-neutral-500">Sin movimientos.</p>;
  return (
    <Table>
      <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Tipo</TableHead><TableHead className="text-right">Cantidad</TableHead><TableHead>Motivo</TableHead></TableRow></TableHeader>
      <TableBody>
        {movements.map((m) => (
          <TableRow key={m.id}>
            <TableCell>{new Date(m.created_at).toLocaleDateString("es-ES")}</TableCell>
            <TableCell>{LABEL[m.type] ?? m.type}</TableCell>
            <TableCell className="text-right">{m.type === "out" ? "-" : "+"}{m.quantity}</TableCell>
            <TableCell>{m.reason}{m.note ? ` — ${m.note}` : ""}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

- [ ] **Step 4: Formulario de ajuste de stock**

Create `src/components/inventory/stock-adjust-form.tsx`:
```tsx
"use client";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adjustStock } from "@/lib/inventory/actions";

export function StockAdjustForm({ productId }: { productId: string }) {
  const router = useRouter();
  async function onSubmit(fd: FormData) {
    const res = await adjustStock(productId, fd);
    if (res?.error) { alert(res.error); return; }
    router.refresh();
  }
  return (
    <form action={onSubmit} className="flex flex-wrap items-end gap-3 rounded-md border p-4">
      <div className="space-y-2">
        <Label>Tipo</Label>
        <Select name="type" defaultValue="in">
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="in">Entrada</SelectItem>
            <SelectItem value="out">Salida</SelectItem>
            <SelectItem value="adjust">Ajuste</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2"><Label htmlFor="quantity">Cantidad</Label><Input id="quantity" name="quantity" type="number" min="1" required className="w-28" /></div>
      <div className="space-y-2"><Label htmlFor="reason">Motivo</Label><Input id="reason" name="reason" required placeholder="compra / venta / merma" /></div>
      <Button type="submit">Registrar</Button>
    </form>
  );
}
```

- [ ] **Step 5: Página ficha de producto**

Create `src/app/(app)/inventario/[id]/page.tsx`:
```tsx
import { getProduct, listMovements } from "@/lib/inventory/queries";
import { MovementList } from "@/components/inventory/movement-list";
import { StockAdjustForm } from "@/components/inventory/stock-adjust-form";
import { Card } from "@/components/ui/card";

export default async function ProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, movements] = await Promise.all([getProduct(id), listMovements(id)]);
  const stock = (product as any).product_stock?.stock ?? 0;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{product.name}</h1>
        <p className="text-sm text-neutral-500">SKU {product.sku ?? "—"} · Stock actual: <strong>{stock}</strong></p>
      </div>
      <Card className="p-4">
        <h2 className="mb-3 font-medium">Ajustar stock</h2>
        <StockAdjustForm productId={id} />
      </Card>
      <div>
        <h2 className="mb-3 font-medium">Historial de movimientos</h2>
        <MovementList movements={movements} />
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Verificar flujo completo**

`npm run dev`: crear un producto → redirige a su ficha → registrar una entrada de stock → el historial y el stock actual se actualizan → volver a `/inventario` y ver el producto con su stock y el valor en el resumen. Crear un producto con umbral > stock y confirmar la badge roja de stock bajo.

- [ ] **Step 7: Commit**

```bash
git add src && git commit -m "feat(inventory): create/edit product, stock adjust, movement history"
```

---

## Phase 6 — PWA

### Task 13: Manifest, iconos y meta instalable

**Files:**
- Create: `public/manifest.json`, `public/icons/icon-192.png`, `public/icons/icon-512.png`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Manifest**

Create `public/manifest.json`:
```json
{
  "name": "Panel Grupo Juana Sánchez",
  "short_name": "GJS Panel",
  "start_url": "/inventario",
  "display": "standalone",
  "background_color": "#fafafa",
  "theme_color": "#281b0e",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 2: Iconos**

Generar dos PNG cuadrados (192 y 512 px) con el logo/iniciales del grupo y guardarlos en `public/icons/`. Pueden ser un fondo `#281b0e` con las iniciales "GJS" en crema.

- [ ] **Step 3: Enlazar manifest en el root layout**

Modify `src/app/layout.tsx` — añadir a la export `metadata`:
```tsx
export const metadata = {
  title: "Panel Grupo Juana Sánchez",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "GJS Panel", statusBarStyle: "default" as const },
};

export const viewport = { themeColor: "#281b0e" };
```

- [ ] **Step 4: Verificar instalabilidad**

`npm run build && npm run start`. En Chrome DevTools → Application → Manifest: sin errores, "Installable". Probar instalar.

- [ ] **Step 5: Commit**

```bash
git add public src/app/layout.tsx && git commit -m "feat(pwa): manifest, icons, installable meta"
```

---

## Phase 7 — Deploy a Vercel

### Task 14: Publicar en Vercel

**Files:**
- Create: repo remoto en GitHub

- [ ] **Step 1: Crear repo remoto y subir**

Crear repo GitHub (p.ej. `juana-sanchez-panel`) y:
```bash
git remote add origin https://github.com/HaxelGG/juana-sanchez-panel.git
git branch -M main && git push -u origin main
```

- [ ] **Step 2: Importar en Vercel**

En Vercel: New Project → importar el repo. Framework Next.js detectado.

- [ ] **Step 3: Variables de entorno en Vercel**

Añadir `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Production + Preview).

- [ ] **Step 4: Deploy y verificación**

Deploy. Abrir la URL de producción, login con el usuario owner, crear un producto y confirmar que persiste. Verificar PWA instalable en móvil.

- [ ] **Step 5: Commit final / tag**

```bash
git commit --allow-empty -m "chore: initial production deploy" && git push
```

---

## Notas de ejecución

- **Orden de empresas / Supabase primero:** las Tasks 2-3 requieren un proyecto Supabase creado y las claves en `.env.local` antes de poder probar auth (Task 5).
- **RLS:** todas las lecturas/escrituras pasan por las políticas; el usuario `owner` ve las tres empresas. Probar como owner.
- **Roles después (fuera de este plan):** activar equipo = crear usuarios, asignar `role` y filas en `user_companies`. El modelo ya lo soporta.
- **Siguiente módulo (fuera de este plan):** CRM, reutilizando shell, multi-empresa y patrón CRUD/tabla de Inventario.
