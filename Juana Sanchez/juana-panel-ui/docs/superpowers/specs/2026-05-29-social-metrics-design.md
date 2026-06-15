# Spec — Dashboard de métricas sociales (en `/social`)

**Fecha:** 2026-05-29
**Terminal:** Frontend/Atelier (`frontend-atelier`)
**Estado:** Diseño aprobado por el usuario — pendiente de revisión del spec.

## 1. Resumen

Añadir a `/social` (mío) un **dashboard de métricas** por red social: **followers**,
**visualizaciones totales** y **engagement %**, con total agregado. v1 = **snapshots manuales**
(tabla nueva `social_metrics`); el dashboard muestra el último snapshot por red. El **auto-sync**
desde las APIs (Instagram/TikTok…) llega después vía Conexiones — la misma tabla/UI, solo cambia la
fuente. Migración **0035**. Se añade una sección arriba de `/social` sin tocar el calendario de
publicaciones existente.

Decisiones (aprobadas):
- **Entrada manual** en v1 (las métricas reales necesitan credenciales de plataforma → Conexiones).
- **Dentro de `/social`** (sección), no subpágina.
- Redes v1: Instagram, TikTok, Facebook, YouTube, Pinterest.

## 2. Infra existente (verificada)

- `/social` (`src/app/(app)/social/page.tsx`): server; `getActiveCompany()`, `listPosts`,
  `socialSummary`, `SummaryCards`, `SocialViews`. Es el calendario de publicaciones (`social_posts`,
  migr. 0018/0019). **No se modifica esa parte**, solo se inserta `<SocialMetrics>`.
- `accessible_company_ids()` RLS; `companies(id,name)`; patrón de form con FormData + `revalidatePath`.
- Componentes Atelier (`KpiGrid`/`KpiCard`, `Button`, `FieldError`), toasts `sonner`.
- Migración libre: **0035** (mía).

## 3. Modelo de datos (migración `0035_social_metrics.sql`)

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
Aplicar a la BD viva (MCP `apply_migration`) + regenerar `src/types/db.ts`.

## 4. Lógica pura (`lib/social/metrics.ts`) — TDD

- `SOCIAL_NETWORKS: { key; label }[]` = instagram/tiktok/facebook/youtube/pinterest.
- `type MetricRow = { network; period_date; followers; views; engagement_pct }`.
- `latestPerNetwork(rows)` → `Map<network, MetricRow>` (el de `period_date` más reciente por red).
- `totals(latest)` → `{ followers, views }` (suma de followers/views del último por red).
- `previousFor(rows, network)` → el segundo snapshot más reciente de esa red (para "vs anterior") o
  `undefined`.
- Tests: último por red con fechas mezcladas, totales, previous con 0/1/2+ snapshots.

## 5. Lectura + acción

- `lib/social/metrics-queries.ts`: `listSocialMetrics(companyFilter)` → `MetricRow[]`
  (`select network,period_date,followers,views,engagement_pct ... order by period_date desc`;
  filtra por empresa salvo `"all"`).
- `lib/social/metrics-actions.ts` (`"use server"`): `saveSocialMetric(formData)` — upsert por
  `(company_id, network, period_date)`: campos `network` (∈ SOCIAL_NETWORKS), `period_date`
  (YYYY-MM-DD; default hoy), `followers`/`views` (enteros ≥0), `engagement_pct` (numérico),
  `created_by`. Valida network y números; `revalidatePath("/social")`. Devuelve `{ok}|{error}`.

## 6. UI

- `src/components/social/social-metrics.tsx` (**server**, `async`): props `{ company: string | "all" }`.
  Llama `listSocialMetrics(company)`, calcula `latestPerNetwork`/`totals`. Renderiza:
  - `KpiGrid` con total followers, total views, y nº de redes con datos.
  - una tarjeta por red (de SOCIAL_NETWORKS) con followers / views / engagement % del último snapshot
    (o "— sin datos"); si hay previo, muestra Δ followers.
  - si `company !== "all"`, renderiza `<MetricForm companyId={company} />` (registrar/actualizar);
    si `"all"`, una nota "elige una empresa para registrar métricas".
- `src/components/social/metric-form.tsx` (`"use client"`): select de red + fecha + followers + views
  + engagement% → `saveSocialMetric`; toast; `router.refresh()`. `FieldError` inline.
- **Edición de página:** en `src/app/(app)/social/page.tsx`, insertar `<SocialMetrics company={company} />`
  tras `<SummaryCards .../>` (una línea + import). El resto intacto.
- **Nav:** sin cambios (ya existe `/social`).

## 7. Seguridad / validación

- RLS por empresa; `company_id` de la empresa activa; `created_by` de sesión.
- `saveSocialMetric` valida red ∈ lista, enteros ≥ 0, engagement numérico; upsert idempotente por
  (empresa, red, fecha).
- Sin secretos; sin llamadas externas en v1.

## 8. Coordinación

- Todo nuevo (`social_metrics`, `lib/social/metrics*`, `components/social/social-metrics|metric-form`)
  + edición de **mi** página `/social`. No toca otras terminales ni `sidebar.tsx`. Migración **0035**
  (mía; la otra terminal usa 0040+). Tras 0035, mi siguiente libre = **0036**.

## 9. Fuera de alcance v1 (YAGNI)

- Auto-sync por API de redes (requiere credenciales → Conexiones).
- Gráficas de evolución histórica (Recharts) — ampliable luego desde la misma tabla.
- Comparativa entre redes / objetivos / alertas.

## 10. Testing

- `metrics.test.ts` (puro): `latestPerNetwork`, `totals`, `previousFor`.
- `npm run build` + `npm test`. Smoke: en `/social` (empresa concreta), registrar métricas de
  Instagram → ver la tarjeta y los totales; actualizar el mismo día → upsert (no duplica); con
  empresa "all" → nota para elegir empresa.

## 11. Fases (el plan lo detalla)

1. Migración `0035_social_metrics.sql` → aplicar + regenerar `db.ts`.
2. `metrics.ts` (puro) — TDD.
3. `metrics-queries.ts` + `metrics-actions.ts`.
4. `social-metrics.tsx` + `metric-form.tsx` + insertar en `/social`.
5. Build + test + deploy (FF a `main`) + memoria.
