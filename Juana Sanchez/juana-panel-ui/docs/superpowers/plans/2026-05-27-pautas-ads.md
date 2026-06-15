# Las Pautas (Publicidad/Ads) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el módulo «Las Pautas» (`/pautas`): núcleo normalizado de publicidad de pago + conector Meta Ads + IA data scientist, en la rama `frontend-atelier`.

**Architecture:** Núcleo normalizado (`ad_*`) alimentado por conectores enchufables. v1 = Meta. KPIs derivados al leer. IA aislada de `lib/ia` (reusa solo `OPENROUTER_API_KEY`). Multi-empresa con RLS; token Meta en tabla owner-only.

**Tech Stack:** Next.js 16 (App Router, server actions), Supabase (Postgres + RLS), TypeScript, Recharts, Vitest. Patrones Atelier existentes (KpiGrid, Money, StatusPill, Markdown, PageHeader, ImageUpload).

---

## File Structure

- `supabase/migrations/0030_ads.sql` — esquema (enum + 5 tablas + RLS).
- `src/types/db.ts` — tipos de las nuevas tablas/enum (edición quirúrgica).
- `src/lib/ads/kpi.ts` + `kpi.test.ts` — lógica pura (derivar KPIs, agregar, snapshot, prompt).
- `src/lib/ads/openrouter.ts` — cliente OpenRouter mínimo propio (server-only).
- `src/lib/ads/queries.ts` — lecturas (cuentas, campañas+KPIs, insights, overview).
- `src/lib/ads/meta.ts` — conector Meta Graph API (server-only).
- `src/lib/ads/actions.ts` — server actions (alta cuenta, sync, analizar, desconectar).
- `src/components/pautas/{summary-cards,campaign-list,campaign-row,platform-breakdown,insight-panel,account-form,campaign-chart}.tsx`.
- `src/app/(app)/pautas/{page,ajustes/page,[campaignId]/page}.tsx`.
- `src/components/app-shell/nav-config.tsx` + `topbar.tsx` — encender la entrada.

---

## Task 1: Migración 0030 (esquema ads + RLS)

**Files:**
- Create: `supabase/migrations/0030_ads.sql`
- Modify: `src/types/db.ts`

- [ ] **Step 1: Escribir la migración**

```sql
create type public.ad_platform as enum ('meta', 'google', 'tiktok', 'pinterest');

create table public.ad_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  platform public.ad_platform not null,
  name text not null,
  external_account_id text not null,
  currency text not null default 'EUR',
  status text not null default 'active',
  last_synced_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.ad_accounts (company_id);

create table public.ad_account_secrets (
  account_id uuid primary key references public.ad_accounts(id) on delete cascade,
  access_token text not null,
  meta jsonb,
  updated_at timestamptz not null default now()
);

create table public.ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.ad_accounts(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  external_campaign_id text not null,
  name text not null,
  objective text,
  status text,
  started_at date,
  ended_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (account_id, external_campaign_id)
);
create index on public.ad_campaigns (company_id);

create table public.ad_metrics (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.ad_campaigns(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  date date not null,
  spend numeric(14,2) not null default 0,
  impressions bigint not null default 0,
  clicks bigint not null default 0,
  conversions numeric(14,2) not null default 0,
  conversion_value numeric(14,2) not null default 0,
  unique (campaign_id, date)
);
create index on public.ad_metrics (company_id);

create table public.ad_insights (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  account_id uuid references public.ad_accounts(id) on delete set null,
  campaign_id uuid references public.ad_campaigns(id) on delete set null,
  period_from date,
  period_to date,
  content text not null,
  model text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index on public.ad_insights (company_id);

alter table public.ad_accounts enable row level security;
alter table public.ad_account_secrets enable row level security;
alter table public.ad_campaigns enable row level security;
alter table public.ad_metrics enable row level security;
alter table public.ad_insights enable row level security;

create policy "ad_accounts por empresa" on public.ad_accounts for all to authenticated
  using (company_id in (select public.accessible_company_ids()))
  with check (company_id in (select public.accessible_company_ids()));
create policy "ad_campaigns por empresa" on public.ad_campaigns for all to authenticated
  using (company_id in (select public.accessible_company_ids()))
  with check (company_id in (select public.accessible_company_ids()));
create policy "ad_metrics por empresa" on public.ad_metrics for all to authenticated
  using (company_id in (select public.accessible_company_ids()))
  with check (company_id in (select public.accessible_company_ids()));
create policy "ad_insights por empresa" on public.ad_insights for all to authenticated
  using (company_id in (select public.accessible_company_ids()))
  with check (company_id in (select public.accessible_company_ids()));

-- Secretos: solo owner
create policy "ad_account_secrets owner" on public.ad_account_secrets for all to authenticated
  using (public.is_owner())
  with check (public.is_owner());
```

- [ ] **Step 2: Aplicar la migración** vía MCP Supabase `apply_migration` (project `hfwhrwdmwgdicpsfdvyq`, name `ads`). Expected: `{"success":true}`.

- [ ] **Step 3: Añadir tipos a `src/types/db.ts`** — bloques `Row/Insert/Update/Relationships` para `ad_accounts`, `ad_account_secrets`, `ad_campaigns`, `ad_metrics`, `ad_insights`; añadir `ad_platform: "meta" | "google" | "tiktok" | "pinterest"` en `Enums` (sección tipo y sección Constants). Seguir el formato alfabético/estructura existente (ver `circle_members` como plantilla).

- [ ] **Step 4: Verificar build de tipos** — `npx tsc --noEmit` (o continuar; se valida en Task 10).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0030_ads.sql src/types/db.ts
git commit -m "feat(pautas): esquema ads (0030) + tipos"
```

---

## Task 2: Lógica pura de KPIs (`kpi.ts`) — TDD

**Files:**
- Create: `src/lib/ads/kpi.ts`, `src/lib/ads/kpi.test.ts`

- [ ] **Step 1: Test que falla**

```ts
import { describe, it, expect } from "vitest";
import { deriveKpis, sumMetrics, type Metric } from "./kpi";

const m = (p: Partial<Metric>): Metric => ({
  spend: 0, impressions: 0, clicks: 0, conversions: 0, conversion_value: 0, ...p,
});

describe("deriveKpis", () => {
  it("deriva ctr/cpc/cpa/roas", () => {
    const k = deriveKpis(m({ spend: 100, impressions: 1000, clicks: 50, conversions: 5, conversion_value: 400 }));
    expect(k.ctr).toBeCloseTo(0.05);
    expect(k.cpc).toBeCloseTo(2);
    expect(k.cpa).toBeCloseTo(20);
    expect(k.roas).toBeCloseTo(4);
  });
  it("evita división por cero", () => {
    const k = deriveKpis(m({ spend: 0, impressions: 0, clicks: 0, conversions: 0 }));
    expect(k).toMatchObject({ ctr: 0, cpc: 0, cpa: 0, roas: 0 });
  });
});

describe("sumMetrics", () => {
  it("suma filas", () => {
    const s = sumMetrics([m({ spend: 10, clicks: 1 }), m({ spend: 5, clicks: 2 })]);
    expect(s.spend).toBe(15);
    expect(s.clicks).toBe(3);
  });
  it("vacío = ceros", () => {
    expect(sumMetrics([])).toMatchObject({ spend: 0, impressions: 0 });
  });
});
```

- [ ] **Step 2: Ejecutar y ver fallar** — `npm test -- kpi` → FAIL (module not found).

- [ ] **Step 3: Implementar `kpi.ts`**

```ts
export type Metric = {
  spend: number; impressions: number; clicks: number;
  conversions: number; conversion_value: number;
};
export type DerivedKpis = Metric & { ctr: number; cpc: number; cpa: number; roas: number };

const div = (a: number, b: number) => (b > 0 ? a / b : 0);

export function deriveKpis(m: Metric): DerivedKpis {
  return {
    ...m,
    ctr: div(m.clicks, m.impressions),
    cpc: div(m.spend, m.clicks),
    cpa: div(m.spend, m.conversions),
    roas: div(m.conversion_value, m.spend),
  };
}

export function sumMetrics(rows: Metric[]): Metric {
  return rows.reduce<Metric>(
    (a, r) => ({
      spend: a.spend + Number(r.spend ?? 0),
      impressions: a.impressions + Number(r.impressions ?? 0),
      clicks: a.clicks + Number(r.clicks ?? 0),
      conversions: a.conversions + Number(r.conversions ?? 0),
      conversion_value: a.conversion_value + Number(r.conversion_value ?? 0),
    }),
    { spend: 0, impressions: 0, clicks: 0, conversions: 0, conversion_value: 0 }
  );
}
```

- [ ] **Step 4: Ejecutar y ver pasar** — `npm test -- kpi` → PASS.

- [ ] **Step 5: Commit** — `git add src/lib/ads/kpi.* && git commit -m "feat(pautas): lógica pura de KPIs con tests"`

---

## Task 3: Snapshot + prompt de IA (en `kpi.ts`) — TDD

**Files:**
- Modify: `src/lib/ads/kpi.ts`, `src/lib/ads/kpi.test.ts`

- [ ] **Step 1: Test que falla**

```ts
import { buildAdsSnapshot, buildAdsAnalystMessages, type CampaignKpi } from "./kpi";

describe("buildAdsSnapshot", () => {
  it("incluye nombre y KPIs por campaña", () => {
    const rows: CampaignKpi[] = [
      { name: "Rebajas", spend: 100, impressions: 1000, clicks: 50, conversions: 5, conversion_value: 400, ctr: 0.05, cpc: 2, cpa: 20, roas: 4 },
    ];
    const s = buildAdsSnapshot(rows, "2026-01-01", "2026-01-31");
    expect(s).toContain("Rebajas");
    expect(s).toContain("ROAS");
  });
});

describe("buildAdsAnalystMessages", () => {
  it("pide conclusiones, recomendaciones y próximos pasos", () => {
    const msgs = buildAdsAnalystMessages("datos...");
    expect(msgs[0].role).toBe("system");
    const joined = msgs.map((m) => m.content).join(" ").toLowerCase();
    expect(joined).toContain("recomendaciones");
    expect(joined).toContain("próximos pasos");
    expect(joined).toContain("datos...");
  });
});
```

- [ ] **Step 2: Ejecutar y ver fallar** — `npm test -- kpi` → FAIL.

- [ ] **Step 3: Implementar (añadir a `kpi.ts`)**

```ts
export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };
export type CampaignKpi = DerivedKpis & { name: string };

const eur = (n: number) => `${Math.round(n).toLocaleString("es-ES")} €`;
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

export function buildAdsSnapshot(rows: CampaignKpi[], from: string, to: string): string {
  if (rows.length === 0) return `Periodo ${from}–${to}: sin datos de campañas.`;
  const lines = rows.map(
    (r) =>
      `- ${r.name}: gasto ${eur(r.spend)}, impresiones ${r.impressions}, clics ${r.clicks} ` +
      `(CTR ${pct(r.ctr)}, CPC ${eur(r.cpc)}), conversiones ${r.conversions} ` +
      `(CPA ${eur(r.cpa)}), ROAS ${r.roas.toFixed(2)}.`
  );
  return [`Periodo ${from}–${to}. Campañas:`, ...lines].join("\n");
}

export function buildAdsAnalystMessages(snapshot: string): ChatMessage[] {
  return [
    {
      role: "system",
      content:
        "Eres una data scientist de marketing del Grupo Juana Sánchez (moda de lujo). " +
        "Analizas SOLO los datos proporcionados, en español, con tono claro y ejecutivo. " +
        "Estructura tu respuesta en tres secciones Markdown: **Conclusiones**, " +
        "**Recomendaciones** (accionables) y **Próximos pasos**. No inventes datos.",
    },
    { role: "user", content: snapshot },
  ];
}
```

- [ ] **Step 4: Ejecutar y ver pasar** — `npm test -- kpi` → PASS.

- [ ] **Step 5: Commit** — `git commit -am "feat(pautas): snapshot + prompt de IA (TDD)"`

---

## Task 4: Cliente OpenRouter propio (`openrouter.ts`)

**Files:**
- Create: `src/lib/ads/openrouter.ts`

- [ ] **Step 1: Implementar** (aislado de `lib/ia`, mismo patrón seguro)

```ts
import type { ChatMessage } from "./kpi";

export const ADS_MODEL = process.env.OPENROUTER_MODEL_PRO ?? "deepseek/deepseek-r1";

export async function adsChat(messages: ChatMessage[], maxTokens = 1200): Promise<{ text: string } | { error: string }> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return { error: "Falta OPENROUTER_API_KEY en el entorno." };
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: ADS_MODEL, messages, max_tokens: maxTokens }),
    });
    if (!res.ok) return { error: `OpenRouter ${res.status}: ${(await res.text()).slice(0, 200)}` };
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== "string" || !text.trim()) return { error: "Respuesta vacía del modelo." };
    return { text: text.trim() };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error de red." };
  }
}
```

- [ ] **Step 2: Commit** — `git add src/lib/ads/openrouter.ts && git commit -m "feat(pautas): cliente OpenRouter propio (aislado de lib/ia)"`

---

## Task 5: Capa de lecturas (`queries.ts`)

**Files:**
- Create: `src/lib/ads/queries.ts`

- [ ] **Step 1: Implementar**

```ts
import { createClient } from "@/lib/supabase/server";
import { deriveKpis, sumMetrics, type Metric, type CampaignKpi } from "./kpi";

export type AccountRow = {
  id: string; platform: string; name: string; external_account_id: string;
  currency: string; status: string; last_synced_at: string | null;
};

export async function listAccounts(companyFilter: string | "all"): Promise<AccountRow[]> {
  const supabase = await createClient();
  let q = supabase.from("ad_accounts").select("id,platform,name,external_account_id,currency,status,last_synced_at").order("name");
  if (companyFilter !== "all") q = q.eq("company_id", companyFilter);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as AccountRow[];
}

export type CampaignWithKpis = CampaignKpi & { id: string; status: string | null; objective: string | null };

/** Devuelve campañas con sus KPIs agregados en el rango [from,to]. */
export async function listCampaignKpis(companyFilter: string | "all", from: string, to: string): Promise<CampaignWithKpis[]> {
  const supabase = await createClient();
  let cq = supabase.from("ad_campaigns").select("id,name,status,objective,company_id");
  if (companyFilter !== "all") cq = cq.eq("company_id", companyFilter);
  const { data: camps, error: ce } = await cq;
  if (ce) throw ce;
  if (!camps || camps.length === 0) return [];

  let mq = supabase.from("ad_metrics").select("campaign_id,spend,impressions,clicks,conversions,conversion_value").gte("date", from).lte("date", to);
  if (companyFilter !== "all") mq = mq.eq("company_id", companyFilter);
  const { data: metrics, error: me } = await mq;
  if (me) throw me;

  const byCampaign = new Map<string, Metric[]>();
  for (const r of metrics ?? []) {
    const arr = byCampaign.get(r.campaign_id) ?? [];
    arr.push(r as unknown as Metric);
    byCampaign.set(r.campaign_id, arr);
  }
  return camps.map((c) => {
    const agg = sumMetrics(byCampaign.get(c.id) ?? []);
    return { id: c.id, name: c.name, status: c.status, objective: c.objective, ...deriveKpis(agg) };
  });
}

export async function adsOverview(companyFilter: string | "all", from: string, to: string) {
  const rows = await listCampaignKpis(companyFilter, from, to);
  const total = deriveKpis(sumMetrics(rows));
  return { total, campaigns: rows };
}

export async function latestInsight(companyFilter: string | "all") {
  const supabase = await createClient();
  let q = supabase.from("ad_insights").select("content,created_at,period_from,period_to").order("created_at", { ascending: false }).limit(1);
  if (companyFilter !== "all") q = q.eq("company_id", companyFilter);
  const { data } = await q;
  return data?.[0] ?? null;
}

export async function getCampaignDaily(campaignId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ad_metrics").select("date,spend,impressions,clicks,conversions,conversion_value")
    .eq("campaign_id", campaignId).order("date");
  if (error) throw error;
  return data ?? [];
}
```

- [ ] **Step 2: Commit** — `git add src/lib/ads/queries.ts && git commit -m "feat(pautas): capa de lecturas (cuentas, campañas+KPIs, insights)"`

---

## Task 6: Conector Meta (`meta.ts`)

**Files:**
- Create: `src/lib/ads/meta.ts`

- [ ] **Step 1: Implementar** (server-only; versión de API fijada)

```ts
import { createClient } from "@/lib/supabase/server";

const GRAPH = "https://graph.facebook.com/v21.0";

type MetaResult = { ok: true; campaigns: number; days: number } | { ok: false; error: string };

async function token(accountId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("ad_account_secrets").select("access_token").eq("account_id", accountId).maybeSingle();
  return data?.access_token ?? null;
}

function isoDaysAgo(n: number): string {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Sincroniza campañas + métricas diarias de una cuenta Meta. */
export async function syncMetaAccount(accountId: string, sinceDays = 30): Promise<MetaResult> {
  const supabase = await createClient();
  const { data: acc } = await supabase.from("ad_accounts").select("id,company_id,external_account_id").eq("id", accountId).single();
  if (!acc) return { ok: false, error: "Cuenta no encontrada." };
  const tk = await token(accountId);
  if (!tk) return { ok: false, error: "Sin token. Conéctala en Ajustes." };
  const act = acc.external_account_id;

  // 1) Campañas
  const cRes = await fetch(`${GRAPH}/${act}/campaigns?fields=id,name,objective,status,start_time,stop_time&limit=200&access_token=${tk}`);
  if (!cRes.ok) {
    await supabase.from("ad_accounts").update({ status: "disconnected" }).eq("id", accountId);
    return { ok: false, error: `Meta ${cRes.status}: ${(await cRes.text()).slice(0, 160)}` };
  }
  const campaigns = (await cRes.json())?.data ?? [];
  const idMap = new Map<string, string>();
  for (const c of campaigns) {
    const { data: up } = await supabase.from("ad_campaigns").upsert({
      account_id: accountId, company_id: acc.company_id, external_campaign_id: c.id,
      name: c.name, objective: c.objective ?? null, status: (c.status ?? "").toLowerCase() || null,
      started_at: c.start_time ? c.start_time.slice(0, 10) : null,
      ended_at: c.stop_time ? c.stop_time.slice(0, 10) : null, updated_at: new Date().toISOString(),
    }, { onConflict: "account_id,external_campaign_id" }).select("id").single();
    if (up) idMap.set(c.id, up.id);
  }

  // 2) Insights diarios por campaña
  const since = isoDaysAgo(sinceDays);
  const until = isoDaysAgo(0);
  let days = 0;
  const iRes = await fetch(
    `${GRAPH}/${act}/insights?level=campaign&time_increment=1&fields=campaign_id,spend,impressions,clicks,actions,action_values` +
      `&time_range=${encodeURIComponent(JSON.stringify({ since, until }))}&limit=500&access_token=${tk}`
  );
  if (iRes.ok) {
    const rows = (await iRes.json())?.data ?? [];
    for (const r of rows) {
      const cid = idMap.get(r.campaign_id);
      if (!cid) continue;
      const purch = (r.actions ?? []).find((a: { action_type: string; value: string }) => a.action_type.includes("purchase"));
      const pval = (r.action_values ?? []).find((a: { action_type: string; value: string }) => a.action_type.includes("purchase"));
      await supabase.from("ad_metrics").upsert({
        campaign_id: cid, company_id: acc.company_id, date: r.date_start,
        spend: Number(r.spend ?? 0), impressions: Number(r.impressions ?? 0), clicks: Number(r.clicks ?? 0),
        conversions: purch ? Number(purch.value) : 0, conversion_value: pval ? Number(pval.value) : 0,
      }, { onConflict: "campaign_id,date" });
      days++;
    }
  }
  await supabase.from("ad_accounts").update({ status: "active", last_synced_at: new Date().toISOString() }).eq("id", accountId);
  return { ok: true, campaigns: campaigns.length, days };
}
```

- [ ] **Step 2: Commit** — `git add src/lib/ads/meta.ts && git commit -m "feat(pautas): conector Meta Graph API (sync campañas + métricas)"`

---

## Task 7: Server actions (`actions.ts`)

**Files:**
- Create: `src/lib/ads/actions.ts`

- [ ] **Step 1: Implementar**

```ts
"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveCompany } from "@/lib/active-company";
import { syncMetaAccount } from "./meta";
import { listCampaignKpis } from "./queries";
import { buildAdsSnapshot, buildAdsAnalystMessages } from "./kpi";
import { adsChat, ADS_MODEL } from "./openrouter";

export async function addAccount(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const token = String(formData.get("access_token") ?? "").trim();
  const { data: acc, error } = await supabase.from("ad_accounts").insert({
    company_id: String(formData.get("company_id")),
    platform: String(formData.get("platform") || "meta"),
    name: String(formData.get("name") ?? ""),
    external_account_id: String(formData.get("external_account_id") ?? "").trim(),
    created_by: user?.id ?? null,
  }).select("id").single();
  if (error) return { error: error.message };
  if (token) {
    const { error: se } = await supabase.from("ad_account_secrets").upsert({ account_id: acc.id, access_token: token, updated_at: new Date().toISOString() });
    if (se) return { error: se.message };
  }
  revalidatePath("/pautas/ajustes");
  return { id: acc.id };
}

export async function syncAccount(accountId: string) {
  const res = await syncMetaAccount(accountId);
  revalidatePath("/pautas");
  revalidatePath("/pautas/ajustes");
  return res.ok ? { ok: true } : { error: res.error };
}

export async function disconnectAccount(accountId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("ad_accounts").delete().eq("id", accountId);
  if (error) return { error: error.message };
  revalidatePath("/pautas/ajustes");
  return { ok: true };
}

export async function runAnalysis() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const company = await getActiveCompany();
  const filter = company ?? "all";
  const to = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const rows = await listCampaignKpis(filter, from, to);
  const snapshot = buildAdsSnapshot(rows, from, to);
  const res = await adsChat(buildAdsAnalystMessages(snapshot));
  if ("error" in res) return { error: res.error };
  await supabase.from("ad_insights").insert({
    company_id: company, period_from: from, period_to: to, content: res.text, model: ADS_MODEL, created_by: user?.id ?? null,
  });
  revalidatePath("/pautas");
  return { ok: true };
}
```

- [ ] **Step 2: Commit** — `git add src/lib/ads/actions.ts && git commit -m "feat(pautas): server actions (alta, sync, desconectar, analizar)"`

---

## Task 8: Componentes

**Files:**
- Create: `src/components/pautas/summary-cards.tsx`, `campaign-list.tsx`, `platform-breakdown.tsx`, `insight-panel.tsx`, `account-form.tsx`, `campaign-chart.tsx`

- [ ] **Step 1: `summary-cards.tsx`** (server) — KPIs con KpiGrid/KpiCard/Money

```tsx
import { KpiGrid, KpiCard } from "@/components/atelier/kpi";
import { Money } from "@/components/atelier/money";

export function SummaryCards({ spend, roas, conversions, cpa }: { spend: number; roas: number; conversions: number; cpa: number }) {
  return (
    <KpiGrid>
      <KpiCard label="Gasto · 30 días" index="01" value={<Money value={spend} />} />
      <KpiCard label="ROAS medio" index="02" value={roas.toFixed(2)} />
      <KpiCard label="Conversiones" index="03" value={Math.round(conversions)} />
      <KpiCard label="CPA medio" index="04" value={<Money value={cpa} />} />
    </KpiGrid>
  );
}
```

- [ ] **Step 2: `campaign-list.tsx`** (server) — tabla/lista de campañas con KPIs + StatusPill + enlace a ficha

```tsx
import Link from "next/link";
import { Money } from "@/components/atelier/money";
import { StatusPill } from "@/components/atelier/status-pill";
import type { CampaignWithKpis } from "@/lib/ads/queries";

const tone = (s: string | null) => (s === "active" ? "good" : s === "paused" ? "warn" : "neutral");

export function CampaignList({ campaigns }: { campaigns: CampaignWithKpis[] }) {
  if (campaigns.length === 0)
    return (
      <div className="border border-line bg-elevated px-6 py-16 text-center">
        <p className="font-display text-lg text-ink-2">Sin campañas todavía</p>
        <p className="mt-1 text-sm text-ink-4">Conecta una cuenta y sincroniza en Ajustes.</p>
      </div>
    );
  return (
    <div className="grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
      {campaigns.map((c) => (
        <Link key={c.id} href={`/pautas/${c.id}`} className="flex flex-col gap-2 bg-elevated p-4 transition-colors hover:bg-paper">
          <div className="flex items-start justify-between gap-2">
            <span className="truncate text-[14px] font-medium text-ink">{c.name}</span>
            <StatusPill tone={tone(c.status)}>{c.status ?? "—"}</StatusPill>
          </div>
          <div className="flex items-end justify-between border-t border-line pt-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.04em] text-ink-4">ROAS {c.roas.toFixed(2)}</span>
            <Money value={c.spend} className="text-[15px]" />
          </div>
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: `insight-panel.tsx`** (client) — render Markdown + botón Analizar

```tsx
"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/atelier/markdown";
import { runAnalysis } from "@/lib/ads/actions";

export function InsightPanel({ content }: { content: string | null }) {
  const [loading, setLoading] = useState(false);
  async function analyze() {
    setLoading(true);
    const res = await runAnalysis();
    setLoading(false);
    if (res?.error) { toast.error("No se pudo analizar", { description: res.error }); return; }
    toast.success("Análisis generado");
  }
  return (
    <section className="border border-line bg-elevated p-5">
      <div className="mb-3 flex items-center justify-between border-b border-line pb-2">
        <h2 className="font-display text-xl text-ink">Análisis IA</h2>
        <Button type="button" size="sm" onClick={analyze} disabled={loading}>{loading ? "Analizando…" : "Analizar con IA"}</Button>
      </div>
      {content ? <Markdown content={content} /> : <p className="py-4 text-sm text-ink-4">Aún sin análisis. Pulsa «Analizar con IA».</p>}
    </section>
  );
}
```

- [ ] **Step 4: `account-form.tsx`** (client) — alta de cuenta + token, con sync/desconectar

```tsx
"use client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addAccount } from "@/lib/ads/actions";

type Company = { id: string; name: string };

export function AccountForm({ companies }: { companies: Company[] }) {
  const router = useRouter();
  async function onSubmit(fd: FormData) {
    const res = await addAccount(fd);
    if (res?.error) { toast.error("No se pudo guardar", { description: res.error }); return; }
    toast.success("Cuenta conectada");
    router.refresh();
  }
  return (
    <form action={onSubmit} className="max-w-lg space-y-4 border border-line bg-elevated p-5">
      <div className="space-y-2">
        <Label>Empresa</Label>
        <Select name="company_id" defaultValue={companies[0]?.id} required>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Plataforma</Label>
        <Select name="platform" defaultValue="meta">
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="meta">Meta Ads</SelectItem>
            <SelectItem value="google">Google Ads</SelectItem>
            <SelectItem value="tiktok">TikTok Ads</SelectItem>
            <SelectItem value="pinterest">Pinterest Ads</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2"><Label htmlFor="name">Nombre</Label><Input id="name" name="name" required placeholder="Meta · Juana Sánchez" /></div>
      <div className="space-y-2"><Label htmlFor="external_account_id">ID de cuenta</Label><Input id="external_account_id" name="external_account_id" required placeholder="act_123456789" /></div>
      <div className="space-y-2"><Label htmlFor="access_token">Token (System User)</Label><Input id="access_token" name="access_token" type="password" placeholder="EAAG…" /></div>
      <Button type="submit">Conectar cuenta</Button>
    </form>
  );
}
```

- [ ] **Step 5: `campaign-chart.tsx`** (client) — serie temporal Recharts

```tsx
"use client";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

type Daily = { date: string; spend: number; conversion_value: number };

export function CampaignChart({ data }: { data: Daily[] }) {
  if (data.length === 0) return <p className="text-sm text-ink-4">Sin datos diarios.</p>;
  return (
    <div className="h-64 w-full border border-line bg-elevated p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="2 4" stroke="var(--line)" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--ink-4)" }} />
          <YAxis tick={{ fontSize: 10, fill: "var(--ink-4)" }} />
          <Tooltip contentStyle={{ background: "var(--elevated)", border: "1px solid var(--line)", borderRadius: 0 }} />
          <Line type="monotone" dataKey="spend" stroke="var(--brand)" strokeWidth={1.5} dot={false} name="Gasto" />
          <Line type="monotone" dataKey="conversion_value" stroke="var(--good)" strokeWidth={1.5} dot={false} name="Valor" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 6: `platform-breakdown.tsx`** (server) — gasto/ROAS por plataforma (v1 muestra Meta; agrupa por `account.platform`). Implementar como tabla simple a partir de `listAccounts` + agregados; si solo hay una plataforma, una fila.

```tsx
import { Money } from "@/components/atelier/money";

export function PlatformBreakdown({ rows }: { rows: { platform: string; spend: number; roas: number }[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="border border-line">
      {rows.map((r) => (
        <div key={r.platform} className="flex items-center justify-between border-b border-line bg-elevated px-4 py-2.5 last:border-0">
          <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3">{r.platform}</span>
          <span className="flex items-center gap-4"><span className="text-[12px] text-ink-4">ROAS {r.roas.toFixed(2)}</span><Money value={r.spend} /></span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 7: Commit** — `git add src/components/pautas && git commit -m "feat(pautas): componentes (KPIs, lista, análisis, chart, ajustes)"`

---

## Task 9: Páginas

**Files:**
- Create: `src/app/(app)/pautas/page.tsx`, `src/app/(app)/pautas/ajustes/page.tsx`, `src/app/(app)/pautas/[campaignId]/page.tsx`

- [ ] **Step 1: `/pautas/page.tsx`**

```tsx
import Link from "next/link";
import { getActiveCompany } from "@/lib/active-company";
import { adsOverview, latestInsight, listAccounts } from "@/lib/ads/queries";
import { SummaryCards } from "@/components/pautas/summary-cards";
import { CampaignList } from "@/components/pautas/campaign-list";
import { InsightPanel } from "@/components/pautas/insight-panel";
import { PageHeader } from "@/components/atelier/page-header";
import { Button } from "@/components/ui/button";

export default async function PautasPage() {
  const company = await getActiveCompany();
  const filter = company ?? "all";
  const to = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const [{ total, campaigns }, insight, accounts] = await Promise.all([
    adsOverview(filter, from, to), latestInsight(filter), listAccounts(filter),
  ]);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader eyebrow="Voz · Publicidad" title="Las Pautas" />
        <Button asChild variant="outline"><Link href="/pautas/ajustes">Cuentas y sync</Link></Button>
      </div>
      {accounts.length === 0 ? (
        <div className="border border-line bg-elevated px-6 py-16 text-center">
          <p className="font-display text-lg text-ink-2">Sin cuentas conectadas</p>
          <p className="mt-1 text-sm text-ink-4">Conecta tu primera cuenta de Meta Ads en Ajustes.</p>
        </div>
      ) : (
        <>
          <SummaryCards spend={total.spend} roas={total.roas} conversions={total.conversions} cpa={total.cpa} />
          <InsightPanel content={insight?.content ?? null} />
          <CampaignList campaigns={campaigns} />
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: `/pautas/ajustes/page.tsx`** — lista de cuentas con sync/desconectar + AccountForm

```tsx
import { createClient } from "@/lib/supabase/server";
import { getActiveCompany } from "@/lib/active-company";
import { listAccounts } from "@/lib/ads/queries";
import { AccountForm } from "@/components/pautas/account-form";
import { PageHeader } from "@/components/atelier/page-header";

export default async function PautasAjustesPage() {
  const supabase = await createClient();
  const { data: companies } = await supabase.from("companies").select("id,name").order("name");
  const company = await getActiveCompany();
  const accounts = await listAccounts(company ?? "all");
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Las Pautas" title="Cuentas y sincronización" />
      {accounts.length > 0 && (
        <div className="border border-line">
          {accounts.map((a) => (
            <div key={a.id} className="flex items-center justify-between border-b border-line bg-elevated px-4 py-3 last:border-0">
              <span className="flex flex-col">
                <span className="text-[14px] text-ink">{a.name}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-4">{a.platform} · {a.external_account_id} · {a.status}</span>
              </span>
              <span className="font-mono text-[10px] text-ink-5">{a.last_synced_at ? new Date(a.last_synced_at).toLocaleString("es-ES") : "sin sincronizar"}</span>
            </div>
          ))}
        </div>
      )}
      <AccountForm companies={companies ?? []} />
    </div>
  );
}
```

> Nota: los botones «Sincronizar» y «Desconectar» por fila pueden añadirse como un pequeño client component que llame a `syncAccount(id)` / `disconnectAccount(id)`. Implementar `account-row-actions.tsx` (client) con dos botones y toasts, y usarlo en la lista. (Mismo patrón que InsightPanel.)

- [ ] **Step 3: `/pautas/[campaignId]/page.tsx`** — ficha con chart + KPIs

```tsx
import { getCampaignDaily } from "@/lib/ads/queries";
import { CampaignChart } from "@/components/pautas/campaign-chart";
import { PageHeader } from "@/components/atelier/page-header";

export default async function CampaignPage({ params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = await params;
  const daily = await getCampaignDaily(campaignId);
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Las Pautas · Campaña" title="Detalle de campaña" />
      <CampaignChart data={daily.map((d) => ({ date: d.date, spend: Number(d.spend), conversion_value: Number(d.conversion_value) }))} />
    </div>
  );
}
```

- [ ] **Step 4: Commit** — `git add "src/app/(app)/pautas" && git commit -m "feat(pautas): páginas (overview, ajustes, ficha de campaña)"`

---

## Task 10: Encender en navegación + build + deploy

**Files:**
- Modify: `src/components/app-shell/nav-config.tsx`, `src/components/app-shell/topbar.tsx`

- [ ] **Step 1: Añadir a `nav-config.tsx`** — import `Megaphone` de lucide; en la sección **Voz**, añadir `{ href: "/pautas", label: "Las Pautas", icon: Megaphone }`.

- [ ] **Step 2: Añadir a `topbar.tsx`** — en el mapa `SECTION`, `pautas: "Las Pautas"`.

- [ ] **Step 3: Test + build**

Run: `npm test` (Expected: PASS, incluye kpi.test) y luego, con el dev server parado, `rm -rf .next && npm run build` (Expected: compila; rutas `/pautas`, `/pautas/[campaignId]`, `/pautas/ajustes`).

- [ ] **Step 4: Advisor de seguridad** — MCP `get_advisors` (security) sobre `hfwhrwdmwgdicpsfdvyq`; confirmar que `ad_*` tienen RLS y `ad_account_secrets` es owner-only.

- [ ] **Step 5: Commit + deploy** (secuencia estándar de la terminal)

```bash
git add -A && git commit -m "feat(pautas): encender Las Pautas en el sidebar + topbar"
git fetch origin
# si origin/main adelantó: git merge origin/main --no-edit && resolver db.ts si dup && rebuild
git push -q origin frontend-atelier
# fast-forward de main vía API GitHub (TOKEN de git credential fill, SHA de frontend-atelier)
```

---

## Self-Review

- **Cobertura del spec:** modelo de datos (Task 1) ✓; KPIs/snapshot/prompt puros (Task 2,3) ✓; cliente OpenRouter aislado (Task 4) ✓; lecturas (Task 5) ✓; conector Meta (Task 6) ✓; actions (Task 7) ✓; componentes (Task 8) ✓; páginas (Task 9) ✓; navegación + seguridad + deploy (Task 10) ✓.
- **Sin placeholders:** todo el código va explícito. La única nota abierta es `account-row-actions.tsx` (Task 9 Step 2): patrón idéntico a `InsightPanel` (botón → `syncAccount`/`disconnectAccount` → toast → `router.refresh()`).
- **Consistencia de tipos:** `Metric`, `DerivedKpis`, `CampaignKpi`, `CampaignWithKpis` definidos en kpi.ts/queries.ts y reusados en componentes/acciones. `adsChat`/`ADS_MODEL` consistentes entre openrouter.ts y actions.ts.
- **Riesgo:** sync real requiere token Meta del owner; el núcleo+UI+IA se construyen y prueban sin él (estado vacío + datos sembrados opcionales).
