# Dashboard de métricas sociales — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-network metrics dashboard (followers, views, engagement %) to `/social`, backed by manual snapshots in a new `social_metrics` table.

**Architecture:** Migration `0035` (one company-scoped table) + pure helpers (`metrics.ts`, TDD) + a read query + an owner-agnostic upsert action + a server `SocialMetrics` section (cards) embedding a client `MetricForm`, inserted at the top of the existing `/social` page. Auto-sync from platform APIs is a later phase reusing the same table/UI.

**Tech Stack:** Next.js 16 (server + client), Supabase (RLS), TypeScript, Vitest, Tailwind v4 / Atelier tokens, sonner.

---

## File Structure

**Create:** `supabase/migrations/0035_social_metrics.sql`; `src/lib/social/metrics.ts` (+`metrics.test.ts`); `src/lib/social/metrics-queries.ts`; `src/lib/social/metrics-actions.ts`; `src/components/social/social-metrics.tsx`; `src/components/social/metric-form.tsx`.
**Modify:** `src/types/db.ts` (regenerated); `src/app/(app)/social/page.tsx` (insert one section).
**Do NOT touch:** the existing `/social` post-calendar parts beyond inserting the section; other terminals; `sidebar.tsx`.

---

## Task 1: Migration 0035 + apply + regen types

> Controller runs this directly via Supabase MCP (project `hfwhrwdmwgdicpsfdvyq`).

- [ ] **Step 1:** Create `supabase/migrations/0035_social_metrics.sql`:

```sql
create table public.social_metrics (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  network text not null,
  period_date date not null default current_date,
  followers integer not null default 0,
  views integer not null default 0,
  engagement_pct numeric(5,2) not null default 0,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, network, period_date)
);
create index on public.social_metrics (company_id);
alter table public.social_metrics enable row level security;
create policy "social_metrics por empresa" on public.social_metrics for all to authenticated
  using (company_id in (select public.accessible_company_ids()))
  with check (company_id in (select public.accessible_company_ids()));
```

- [ ] **Step 2:** Apply via MCP `apply_migration` (name `social_metrics`).
- [ ] **Step 3:** Regenerate types via MCP `generate_typescript_types` → overwrite `src/types/db.ts`.
- [ ] **Step 4:** Commit:
```bash
git add supabase/migrations/0035_social_metrics.sql src/types/db.ts
git commit -m "feat(social): migration 0035 — social_metrics table"
```

---

## Task 2: Pure helpers (`lib/social/metrics.ts`)

- [ ] **Step 1: Write the failing test** — create `src/lib/social/metrics.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { latestPerNetwork, totals, previousFor, SOCIAL_NETWORKS, type MetricRow } from "./metrics";

const rows: MetricRow[] = [
  { network: "instagram", period_date: "2026-05-01", followers: 1000, views: 5000, engagement_pct: 3.2 },
  { network: "instagram", period_date: "2026-05-29", followers: 1200, views: 8000, engagement_pct: 4.1 },
  { network: "tiktok", period_date: "2026-05-20", followers: 500, views: 20000, engagement_pct: 6.0 },
];

describe("latestPerNetwork", () => {
  it("keeps the most recent snapshot per network", () => {
    const m = latestPerNetwork(rows);
    expect(m.get("instagram")?.followers).toBe(1200);
    expect(m.get("tiktok")?.followers).toBe(500);
    expect(m.size).toBe(2);
  });
});

describe("totals", () => {
  it("sums followers and views across latest", () => {
    expect(totals(latestPerNetwork(rows))).toEqual({ followers: 1700, views: 28000 });
  });
});

describe("previousFor", () => {
  it("returns the second most recent for a network, or undefined", () => {
    expect(previousFor(rows, "instagram")?.period_date).toBe("2026-05-01");
    expect(previousFor(rows, "tiktok")).toBeUndefined();
  });
});

describe("SOCIAL_NETWORKS", () => {
  it("lists the v1 networks with unique keys", () => {
    expect(SOCIAL_NETWORKS.map((n) => n.key)).toEqual(["instagram", "tiktok", "facebook", "youtube", "pinterest"]);
  });
});
```

- [ ] **Step 2: Run** `npx vitest run src/lib/social/metrics.test.ts` → FAIL.

- [ ] **Step 3: Implement** — create `src/lib/social/metrics.ts`:

```ts
export type SocialNetwork = { key: string; label: string };

export const SOCIAL_NETWORKS: SocialNetwork[] = [
  { key: "instagram", label: "Instagram" },
  { key: "tiktok", label: "TikTok" },
  { key: "facebook", label: "Facebook" },
  { key: "youtube", label: "YouTube" },
  { key: "pinterest", label: "Pinterest" },
];

export type MetricRow = {
  network: string;
  period_date: string;
  followers: number;
  views: number;
  engagement_pct: number;
};

export function latestPerNetwork(rows: MetricRow[]): Map<string, MetricRow> {
  const m = new Map<string, MetricRow>();
  for (const r of rows) {
    const cur = m.get(r.network);
    if (!cur || r.period_date > cur.period_date) m.set(r.network, r);
  }
  return m;
}

export function totals(latest: Map<string, MetricRow>): { followers: number; views: number } {
  let followers = 0;
  let views = 0;
  for (const r of latest.values()) {
    followers += r.followers;
    views += r.views;
  }
  return { followers, views };
}

export function previousFor(rows: MetricRow[], network: string): MetricRow | undefined {
  const net = rows
    .filter((r) => r.network === network)
    .sort((a, b) => b.period_date.localeCompare(a.period_date));
  return net[1];
}
```

- [ ] **Step 4: Run** `npx vitest run src/lib/social/metrics.test.ts` → PASS.
- [ ] **Step 5: Commit:**
```bash
git add src/lib/social/metrics.ts src/lib/social/metrics.test.ts
git commit -m "feat(social): pure metrics helpers with tests"
```

---

## Task 3: Query + action

**Files:** Create `src/lib/social/metrics-queries.ts`, `src/lib/social/metrics-actions.ts`. Verify `npx tsc --noEmit`.

- [ ] **Step 1:** Create `src/lib/social/metrics-queries.ts`:

```ts
import { createClient } from "@/lib/supabase/server";
import type { MetricRow } from "./metrics";

export async function listSocialMetrics(companyFilter: string | "all"): Promise<MetricRow[]> {
  const supabase = await createClient();
  let q = supabase
    .from("social_metrics")
    .select("network,period_date,followers,views,engagement_pct")
    .order("period_date", { ascending: false });
  if (companyFilter !== "all") q = q.eq("company_id", companyFilter);
  const { data, error } = await q;
  if (error) return [];
  return (data ?? []) as MetricRow[];
}
```

- [ ] **Step 2:** Create `src/lib/social/metrics-actions.ts`:

```ts
"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { SOCIAL_NETWORKS } from "./metrics";

export async function saveSocialMetric(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const company_id = String(formData.get("company_id") ?? "");
  if (!company_id) return { error: "Falta la empresa." };
  const network = String(formData.get("network") ?? "");
  if (!SOCIAL_NETWORKS.some((n) => n.key === network)) return { error: "Red no válida." };
  const period_date = String(formData.get("period_date") || new Date().toISOString().slice(0, 10));
  const followers = Math.max(0, Math.round(Number(formData.get("followers") || 0)));
  const views = Math.max(0, Math.round(Number(formData.get("views") || 0)));
  const engagement_pct = Math.max(0, Number(formData.get("engagement_pct") || 0));
  if (![followers, views, engagement_pct].every(Number.isFinite)) return { error: "Valores numéricos no válidos." };

  const { error } = await supabase.from("social_metrics").upsert(
    { company_id, network, period_date, followers, views, engagement_pct, created_by: user?.id ?? null, updated_at: new Date().toISOString() },
    { onConflict: "company_id,network,period_date" },
  );
  if (error) return { error: error.message };
  revalidatePath("/social");
  return { ok: true };
}
```

- [ ] **Step 3:** `npx tsc --noEmit` → clean (needs Task 1's regenerated `db.ts`).
- [ ] **Step 4: Commit:**
```bash
git add src/lib/social/metrics-queries.ts src/lib/social/metrics-actions.ts
git commit -m "feat(social): listSocialMetrics query + saveSocialMetric upsert action"
```

---

## Task 4: Section component + form + page insert

**Files:** Create `src/components/social/social-metrics.tsx`, `src/components/social/metric-form.tsx`; Modify `src/app/(app)/social/page.tsx`.

- [ ] **Step 1:** Create `src/components/social/metric-form.tsx`:

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/atelier/field-error";
import { SOCIAL_NETWORKS } from "@/lib/social/metrics";
import { saveSocialMetric } from "@/lib/social/metrics-actions";

const labelCls = "font-mono text-[10px] uppercase tracking-[0.06em] text-ink-4";
const inputCls = "block w-full border border-line bg-paper px-2 py-1.5 text-sm text-ink";

export function MetricForm({ companyId }: { companyId: string }) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setError(undefined);
    const fd = new FormData(form);
    fd.set("company_id", companyId);
    const res = await saveSocialMetric(fd);
    setBusy(false);
    if ("error" in res) {
      setError(res.error);
      toast.error(res.error);
      return;
    }
    toast.success("Métricas guardadas");
    form.reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3 border border-line bg-elevated p-4 sm:grid-cols-5">
      <label className="space-y-1">
        <span className={labelCls}>Red</span>
        <select name="network" defaultValue="instagram" className={inputCls}>
          {SOCIAL_NETWORKS.map((n) => <option key={n.key} value={n.key}>{n.label}</option>)}
        </select>
      </label>
      <label className="space-y-1">
        <span className={labelCls}>Fecha</span>
        <input type="date" name="period_date" defaultValue={today} className={inputCls} />
      </label>
      <label className="space-y-1">
        <span className={labelCls}>Followers</span>
        <input type="number" name="followers" min={0} defaultValue={0} className={inputCls} />
      </label>
      <label className="space-y-1">
        <span className={labelCls}>Visualizaciones</span>
        <input type="number" name="views" min={0} defaultValue={0} className={inputCls} />
      </label>
      <label className="space-y-1">
        <span className={labelCls}>Engagement %</span>
        <input type="number" name="engagement_pct" min={0} step="0.01" defaultValue={0} className={inputCls} />
      </label>
      <div className="col-span-2 flex items-center gap-3 sm:col-span-5">
        <Button type="submit" disabled={busy}>{busy ? "Guardando…" : "Registrar métricas"}</Button>
        <FieldError msg={error} />
      </div>
    </form>
  );
}
```

- [ ] **Step 2:** Create `src/components/social/social-metrics.tsx`:

```tsx
import { KpiGrid, KpiCard } from "@/components/atelier/kpi";
import { listSocialMetrics } from "@/lib/social/metrics-queries";
import { SOCIAL_NETWORKS, latestPerNetwork, totals, previousFor } from "@/lib/social/metrics";
import { MetricForm } from "./metric-form";

export async function SocialMetrics({ company }: { company: string | "all" }) {
  const rows = await listSocialMetrics(company);
  const latest = latestPerNetwork(rows);
  const t = totals(latest);
  const nf = (n: number) => n.toLocaleString("es-ES");

  return (
    <section className="space-y-4">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-4">Métricas por red</h2>
      <KpiGrid>
        <KpiCard label="Followers (total)" value={nf(t.followers)} index="Σ" />
        <KpiCard label="Visualizaciones (total)" value={nf(t.views)} index="Σ" />
        <KpiCard label="Redes con datos" value={latest.size} index="nº" />
      </KpiGrid>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SOCIAL_NETWORKS.map((n) => {
          const m = latest.get(n.key);
          const prev = m ? previousFor(rows, n.key) : undefined;
          const delta = m && prev ? m.followers - prev.followers : null;
          return (
            <div key={n.key} className="border border-line bg-elevated p-4">
              <p className="font-display text-lg text-ink">{n.label}</p>
              {m ? (
                <dl className="mt-2 space-y-1 text-[13px]">
                  <div className="flex justify-between">
                    <dt className="text-ink-4">Followers</dt>
                    <dd className="text-ink">
                      {nf(m.followers)}
                      {delta != null && delta !== 0 ? (
                        <span className={delta > 0 ? "text-[var(--ok,#176c2e)]" : "text-[var(--danger,#b00)]"}>
                          {" "}{delta > 0 ? "+" : ""}{nf(delta)}
                        </span>
                      ) : null}
                    </dd>
                  </div>
                  <div className="flex justify-between"><dt className="text-ink-4">Visualizaciones</dt><dd className="text-ink">{nf(m.views)}</dd></div>
                  <div className="flex justify-between"><dt className="text-ink-4">Engagement</dt><dd className="text-ink">{m.engagement_pct}%</dd></div>
                  <p className="pt-1 font-mono text-[10px] text-ink-4">al {m.period_date}</p>
                </dl>
              ) : (
                <p className="mt-2 text-[13px] text-ink-4">— sin datos</p>
              )}
            </div>
          );
        })}
      </div>
      {company !== "all" ? (
        <MetricForm companyId={company} />
      ) : (
        <p className="text-[12px] text-ink-4">Elige una empresa concreta (selector superior) para registrar métricas.</p>
      )}
    </section>
  );
}
```

- [ ] **Step 3:** Modify `src/app/(app)/social/page.tsx` — add the import and render the section after `<SummaryCards .../>`:

```tsx
import { SocialMetrics } from "@/components/social/social-metrics";
```
and immediately after the `<SummaryCards ... />` element:
```tsx
      <SocialMetrics company={company} />
```
(Leave everything else — `SummaryCards`, `SocialViews`, the header — unchanged.)

- [ ] **Step 4:** `npx tsc --noEmit` → clean; `npx vitest run src/lib/social/` → green.
- [ ] **Step 5: Commit:**
```bash
git add src/components/social/social-metrics.tsx src/components/social/metric-form.tsx "src/app/(app)/social/page.tsx"
git commit -m "feat(social): metrics dashboard section + manual entry form in /social"
```

---

## Task 5: Verify, deploy, memory

- [ ] **Step 1:** `npm test` (green incl. `metrics.test.ts`) and `npm run build` (success; `/social` builds; no type errors).
- [ ] **Step 2: Manual smoke:** `/social` with a concrete company → register Instagram metrics → card + totals update; same date again → upsert (no dup); company "all" → "elige empresa" note.
- [ ] **Step 3: Deploy (FF to `main`):**
```bash
git push origin frontend-atelier
git fetch origin main
git push origin frontend-atelier:main   # FF-only; if rejected: git merge origin/main --no-edit, retry
```
- [ ] **Step 4: Update memory:** add the social metrics dashboard to `panel-modulos-atelier.md` (migration `0035`; `social_metrics`; manual v1, auto-sync later via Conexiones; next free migration now **0036**) and refresh `MEMORY.md`.

---

## Self-Review

**Spec coverage:** §3 table → Task 1 ✅; §4 pure helpers → Task 2 ✅; §5 query+action → Task 3 ✅; §6 UI (cards + form + page insert) → Task 4 ✅; §7 security (RLS, validation, upsert idempotent) → Tasks 1,3 ✅; §8 isolation (new files + one section insert, migration 0035) ✅; §10 testing → Tasks 2,5 ✅. Out-of-scope (no API sync / charts) respected.

**Placeholder scan:** none — complete SQL/code/commands throughout.

**Type consistency:** `MetricRow`/`SocialNetwork`/`SOCIAL_NETWORKS` from `metrics.ts` (Task 2) consumed by `metrics-queries.ts`, `metrics-actions.ts` (Task 3) and `social-metrics.tsx` (Task 4); `listSocialMetrics(company)` and `saveSocialMetric(formData)` signatures match call sites; `SocialMetrics` takes `company: string | "all"` matching the page's `getActiveCompany()` value. `social_metrics` table known after Task 1's regenerated `db.ts`. Atelier imports verified.

**Migration numbering:** 0035 is this terminal's next free slot; after this, next free = 0036.
