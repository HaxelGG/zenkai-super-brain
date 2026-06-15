# Centro de Conexiones (esqueleto) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `/conexiones` hub with a per-company, owner-only credential vault and per-integration status — the skeleton for WhatsApp/Instagram, with no external API wiring yet.

**Architecture:** Migration `0034` adds `integration_connections` (company-readable: provider + status + config) and `integration_secrets` (owner-only, mirrors `ad_account_secrets`). A static provider registry (`providers.ts`, pure) drives the UI. Server actions are owner-gated (code check + RLS). Secrets are write-only from the UI and never serialized to the client. Isolated module `lib/conexiones`; only additive touches to `nav-config.tsx` and the regenerated `types/db.ts`.

**Tech Stack:** Next.js 16 (server actions + a `"use client"` card), Supabase (RLS, `is_owner()`), TypeScript, Vitest, Tailwind v4 / Atelier tokens, sonner.

---

## File Structure

**Create:**
- `supabase/migrations/0034_integrations.sql` — tables + RLS
- `src/lib/conexiones/providers.ts` (+`providers.test.ts`) — registry (pure)
- `src/lib/conexiones/queries.ts` — `listConnections`
- `src/lib/conexiones/actions.ts` — `saveIntegrationCredentials`, `disconnectIntegration` (`"use server"`, owner-only)
- `src/components/conexiones/connection-card.tsx` — `"use client"`
- `src/app/(app)/conexiones/page.tsx` — hub (server)

**Modify:** `src/components/app-shell/nav-config.tsx` (add `Plug` + `/conexiones` under "Atelier digital"); `src/types/db.ts` (regenerated after the migration).

**Do NOT touch:** `sidebar.tsx`, `lib/automatizaciones/**`, `automation_*`, `lib/ia/**`.

---

## Task 1: Migration 0034 + apply + regenerate types

**Files:** Create `supabase/migrations/0034_integrations.sql`; Modify `src/types/db.ts` (regenerated)

> The controller runs this task directly (Supabase MCP on the live project `hfwhrwdmwgdicpsfdvyq`), not a subagent.

- [ ] **Step 1: Write the migration file**

Create `supabase/migrations/0034_integrations.sql`:

```sql
create table public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  provider text not null,
  status text not null default 'disconnected' check (status in ('disconnected','connected','error')),
  config jsonb not null default '{}',
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, provider)
);
create index on public.integration_connections (company_id);

create table public.integration_secrets (
  connection_id uuid not null references public.integration_connections(id) on delete cascade,
  name text not null,
  value text not null,
  updated_at timestamptz not null default now(),
  primary key (connection_id, name)
);

alter table public.integration_connections enable row level security;
alter table public.integration_secrets enable row level security;

create policy "integration_connections por empresa" on public.integration_connections for all to authenticated
  using (company_id in (select public.accessible_company_ids()))
  with check (company_id in (select public.accessible_company_ids()));

create policy "integration_secrets owner" on public.integration_secrets for all to authenticated
  using (public.is_owner())
  with check (public.is_owner());
```

- [ ] **Step 2: Apply to the live DB** via Supabase MCP `apply_migration` (name `integrations`, the SQL above) on project `hfwhrwdmwgdicpsfdvyq`.

- [ ] **Step 3: Regenerate types** via Supabase MCP `generate_typescript_types`; write the result to `src/types/db.ts` (overwrite). This file is shared/generated — if there's a later merge conflict, regenerate again from the live DB (it contains the union of all tables).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0034_integrations.sql src/types/db.ts
git commit -m "feat(conexiones): migration 0034 — integration_connections + owner-only secrets"
```

---

## Task 2: Provider registry (pure)

**Files:** Create `src/lib/conexiones/providers.ts`; Test `src/lib/conexiones/providers.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/conexiones/providers.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { PROVIDERS, getProvider } from "./providers";

describe("PROVIDERS", () => {
  it("has unique keys", () => {
    const keys = PROVIDERS.map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("each provider has at least one secret with a non-empty name and label", () => {
    for (const p of PROVIDERS) {
      expect(p.secrets.length).toBeGreaterThan(0);
      for (const s of p.secrets) {
        expect(s.name.length).toBeGreaterThan(0);
        expect(s.label.length).toBeGreaterThan(0);
      }
    }
  });

  it("getProvider finds known and returns undefined for unknown", () => {
    expect(getProvider("whatsapp")?.label).toContain("WhatsApp");
    expect(getProvider("nope")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/conexiones/providers.test.ts`
Expected: FAIL — `Failed to resolve import "./providers"`.

- [ ] **Step 3: Implement**

Create `src/lib/conexiones/providers.ts`:

```ts
export type ProviderSecret = { name: string; label: string; help?: string };
export type Provider = { key: string; label: string; description: string; category: string; secrets: ProviderSecret[] };

export const PROVIDERS: Provider[] = [
  {
    key: "whatsapp",
    label: "WhatsApp Business",
    description: "Mensajería con clientas vía WhatsApp Business Platform (Meta).",
    category: "Mensajería",
    secrets: [
      { name: "WHATSAPP_TOKEN", label: "Token permanente (System User)" },
      { name: "WHATSAPP_PHONE_NUMBER_ID", label: "Phone Number ID" },
      { name: "WHATSAPP_VERIFY_TOKEN", label: "Verify token del webhook", help: "Lo eliges tú; debe coincidir con el configurado en el webhook de Meta." },
    ],
  },
  {
    key: "instagram",
    label: "Instagram (Mensajes)",
    description: "Mensajes directos de Instagram vía Meta (cuenta Business ligada a una Página).",
    category: "Mensajería",
    secrets: [
      { name: "IG_ACCESS_TOKEN", label: "Access token" },
      { name: "IG_BUSINESS_ACCOUNT_ID", label: "Instagram Business Account ID" },
    ],
  },
];

export function getProvider(key: string): Provider | undefined {
  return PROVIDERS.find((p) => p.key === key);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/conexiones/providers.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/conexiones/providers.ts src/lib/conexiones/providers.test.ts
git commit -m "feat(conexiones): provider registry with tests"
```

---

## Task 3: Queries + owner-gated actions

**Files:** Create `src/lib/conexiones/queries.ts`, `src/lib/conexiones/actions.ts`

No unit tests (DB-bound); verify with `npx tsc --noEmit`.

- [ ] **Step 1: Create the query**

Create `src/lib/conexiones/queries.ts`:

```ts
import { createClient } from "@/lib/supabase/server";

export type ConnectionState = { status: string; config: Record<string, unknown> };

/** Company-readable connection states keyed by provider. Never returns secret values. */
export async function listConnections(companyId: string): Promise<Map<string, ConnectionState>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("integration_connections")
    .select("provider,status,config")
    .eq("company_id", companyId);
  const m = new Map<string, ConnectionState>();
  if (error || !data) return m;
  for (const r of data) m.set(r.provider, { status: r.status, config: (r.config ?? {}) as Record<string, unknown> });
  return m;
}
```

- [ ] **Step 2: Create the actions**

Create `src/lib/conexiones/actions.ts`:

```ts
"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getProvider } from "./providers";

async function currentOwner(supabase: Awaited<ReturnType<typeof createClient>>): Promise<{ id: string } | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return data?.role === "owner" ? { id: user.id } : null;
}

export async function saveIntegrationCredentials(provider: string, formData: FormData) {
  const supabase = await createClient();
  const owner = await currentOwner(supabase);
  if (!owner) return { error: "Solo el propietario puede editar credenciales." };

  const def = getProvider(provider);
  if (!def) return { error: "Integración desconocida." };

  const companyId = String(formData.get("company_id") ?? "");
  if (!companyId) return { error: "Falta la empresa." };

  const secrets: { name: string; value: string }[] = [];
  for (const s of def.secrets) {
    const v = String(formData.get(s.name) ?? "").trim();
    if (!v) return { error: `Falta «${s.label}».` };
    secrets.push({ name: s.name, value: v });
  }

  const { data: conn, error: cErr } = await supabase
    .from("integration_connections")
    .upsert(
      { company_id: companyId, provider, status: "connected", created_by: owner.id, updated_at: new Date().toISOString() },
      { onConflict: "company_id,provider" },
    )
    .select("id")
    .single();
  if (cErr) return { error: cErr.message };

  const rows = secrets.map((s) => ({ connection_id: conn.id, name: s.name, value: s.value, updated_at: new Date().toISOString() }));
  const { error: sErr } = await supabase.from("integration_secrets").upsert(rows, { onConflict: "connection_id,name" });
  if (sErr) return { error: sErr.message };

  revalidatePath("/conexiones");
  return { ok: true };
}

export async function disconnectIntegration(provider: string, companyId: string) {
  const supabase = await createClient();
  const owner = await currentOwner(supabase);
  if (!owner) return { error: "Solo el propietario puede editar credenciales." };

  const { data: conn } = await supabase
    .from("integration_connections")
    .select("id")
    .eq("company_id", companyId)
    .eq("provider", provider)
    .single();
  if (conn) {
    await supabase.from("integration_secrets").delete().eq("connection_id", conn.id);
    await supabase.from("integration_connections").update({ status: "disconnected", updated_at: new Date().toISOString() }).eq("id", conn.id);
  }
  revalidatePath("/conexiones");
  return { ok: true };
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: clean (requires Task 1's regenerated `db.ts` so `integration_connections`/`integration_secrets` are known types). If a payload mismatches the generated types, align the cast only.

- [ ] **Step 4: Commit**

```bash
git add src/lib/conexiones/queries.ts src/lib/conexiones/actions.ts
git commit -m "feat(conexiones): listConnections query + owner-gated save/disconnect actions"
```

---

## Task 4: Connection card + hub page + nav

**Files:** Create `src/components/conexiones/connection-card.tsx`, `src/app/(app)/conexiones/page.tsx`; Modify `src/components/app-shell/nav-config.tsx`

- [ ] **Step 1: Create the card**

Create `src/components/conexiones/connection-card.tsx`:

```tsx
"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/atelier/field-error";
import { saveIntegrationCredentials, disconnectIntegration } from "@/lib/conexiones/actions";
import type { Provider } from "@/lib/conexiones/providers";

const STATUS_LABEL: Record<string, string> = { disconnected: "Sin configurar", connected: "Configurada", error: "Error" };

export function ConnectionCard({ provider, companyId, status, isOwner }: { provider: Provider; companyId: string; status: string; isOwner: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function onSave(formData: FormData) {
    setBusy(true);
    setError(undefined);
    const res = await saveIntegrationCredentials(provider.key, formData);
    setBusy(false);
    if ("error" in res) {
      setError(res.error);
      toast.error(res.error);
      return;
    }
    toast.success(`${provider.label}: credenciales guardadas`);
  }

  async function onDisconnect() {
    setBusy(true);
    const res = await disconnectIntegration(provider.key, companyId);
    setBusy(false);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    toast.success(`${provider.label} desconectada`);
  }

  return (
    <div className="space-y-4 border border-line bg-elevated p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg text-ink">{provider.label}</h3>
          <p className="text-[13px] text-ink-3">{provider.description}</p>
        </div>
        <span className={`shrink-0 border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] ${status === "connected" ? "border-ink bg-ink text-paper" : "border-line text-ink-4"}`}>
          {STATUS_LABEL[status] ?? status}
        </span>
      </div>

      {isOwner ? (
        <form action={onSave} className="space-y-3">
          <input type="hidden" name="company_id" value={companyId} />
          {provider.secrets.map((s) => (
            <label key={s.name} className="block space-y-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-4">{s.label}</span>
              <input
                name={s.name}
                type="password"
                autoComplete="off"
                placeholder="••••••••"
                className="block w-full border border-line bg-paper px-2 py-1.5 text-sm text-ink"
              />
              {s.help && <span className="block text-[11px] text-ink-4">{s.help}</span>}
            </label>
          ))}
          <div className="flex gap-2">
            <Button type="submit" disabled={busy}>{busy ? "Guardando…" : "Guardar credenciales"}</Button>
            {status === "connected" && (
              <Button type="button" variant="outline" onClick={onDisconnect} disabled={busy}>Desconectar</Button>
            )}
          </div>
          <FieldError msg={error} />
        </form>
      ) : (
        <p className="text-[12px] text-ink-4">Solo el propietario puede editar las credenciales.</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create the page**

Create `src/app/(app)/conexiones/page.tsx`:

```tsx
import { createClient } from "@/lib/supabase/server";
import { getActiveCompany } from "@/lib/active-company";
import { PageHeader } from "@/components/atelier/page-header";
import { PROVIDERS } from "@/lib/conexiones/providers";
import { listConnections } from "@/lib/conexiones/queries";
import { ConnectionCard } from "@/components/conexiones/connection-card";

export default async function ConexionesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: companies }, activeCompany] = await Promise.all([
    supabase.from("companies").select("id,name").order("name"),
    getActiveCompany(),
  ]);
  const companyId = activeCompany !== "all" ? activeCompany : companies && companies.length === 1 ? companies[0].id : "";
  const { data: prof } = user ? await supabase.from("profiles").select("role").eq("id", user.id).single() : { data: null };
  const isOwner = prof?.role === "owner";
  const connections = companyId ? await listConnections(companyId) : new Map();

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Atelier digital" title="Centro de Conexiones" />
      <p className="max-w-2xl text-[14px] text-ink-3">
        Guarda aquí las credenciales de tus integraciones externas. El envío y recepción de mensajes
        (WhatsApp, Instagram) se activará en una fase posterior, cuando conectemos las APIs.
      </p>
      {!companyId ? (
        <p className="text-sm text-ink-3">Elige una empresa concreta (selector superior) para gestionar sus conexiones.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {PROVIDERS.map((p) => (
            <ConnectionCard key={p.key} provider={p} companyId={companyId} status={connections.get(p.key)?.status ?? "disconnected"} isOwner={isOwner} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Add the nav entry**

In `src/components/app-shell/nav-config.tsx`, add `Plug` to the lucide import block (near `Bot`):

```ts
  Bot,
  Plug,
```

Then add the entry to the "Atelier digital" section (after Asistente):

```ts
      { href: "/ia", label: "IA Tools", icon: Sparkles },
      { href: "/asistente", label: "Asistente", icon: Bot },
      { href: "/conexiones", label: "Conexiones", icon: Plug },
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: clean. Confirm `Button` (`variant="outline"`), `FieldError` (`msg`), `PageHeader` (`eyebrow`/`title`) resolve.

- [ ] **Step 5: Commit**

```bash
git add src/components/conexiones/connection-card.tsx "src/app/(app)/conexiones/page.tsx" src/components/app-shell/nav-config.tsx
git commit -m "feat(conexiones): connection card, hub page and nav entry"
```

---

## Task 5: Verify, deploy, memory

- [ ] **Step 1: Full suite + build**

Run: `npm test` (all green incl. `providers.test.ts`) and `npm run build` (success; `/conexiones` in routes; no type errors).

- [ ] **Step 2: Manual smoke (recommended)**

`npm run dev`. As owner on `/conexiones`: pick a company, fill WhatsApp's three fields, Guardar → badge → "Configurada"; reload → fields blank again (no value leak); Desconectar → "Sin configurar". As a non-owner profile, the form is replaced by the "solo el propietario" note and badges still render.

- [ ] **Step 3: Deploy (fast-forward to `main`)**

```bash
git push origin frontend-atelier
git fetch origin main
git push origin frontend-atelier:main   # FF-only; if rejected: git merge origin/main --no-edit, retry
```

- [ ] **Step 4: Update memory**

Add the Centro de Conexiones to `panel-modulos-atelier.md` (migration `0034`; tables `integration_connections`/`integration_secrets`; owner-only vault; skeleton only — no API wiring; **roce con Automatizaciones+ → construido aislado a petición del usuario; avisar a la otra terminal**; next free migration now **0035**) and refresh `MEMORY.md`. Note the new tables for the other terminal.

---

## Self-Review

**Spec coverage:** §3 schema → Task 1 ✅; §4 registry → Task 2 ✅; §5 queries → Task 3 ✅; §6 owner-gated actions → Task 3 ✅; §7 UI (cards + page + status + owner gating) → Task 4 ✅; §7 nav → Task 4 ✅; §8 security (owner code-check + RLS, write-only secrets, never serialized) → Tasks 3–4 ✅; §9 isolation (own tables/lib, additive nav, regen db.ts) ✅; §11 testing → Tasks 2, 5 ✅. Out-of-scope (no API/webhooks/MCP) respected.

**Placeholder scan:** none — every step has complete SQL/code/commands.

**Type consistency:** `Provider`/`ProviderSecret` defined in Task 2, consumed by Tasks 3 (`getProvider`) and 4 (card props); `ConnectionState`/`listConnections` from Task 3 used by the page (Task 4); action signatures `saveIntegrationCredentials(provider, formData)` and `disconnectIntegration(provider, companyId)` match the card's calls. Tables referenced (`integration_connections`, `integration_secrets`) exist after Task 1's regenerated `db.ts`. Atelier imports verified against existing components.

**Migration numbering:** 0034 is the documented free slot for this terminal; after this, next free = 0035.
