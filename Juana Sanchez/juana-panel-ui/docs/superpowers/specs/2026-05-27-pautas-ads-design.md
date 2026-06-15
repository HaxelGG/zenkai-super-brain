# Spec — Módulo «Las Pautas» (Publicidad / Ads)

**Fecha:** 2026-05-27
**Terminal:** Frontend/Atelier (rama `frontend-atelier`)
**Estado:** Diseño aprobado — pendiente de plan de implementación

## 1. Resumen

Nuevo módulo del ERP para gestionar y analizar la **publicidad de pago** del Grupo
Juana Sánchez (Meta, Google, TikTok, Pinterest Ads). Permite conectar cuentas
publicitarias reales, sincronizar resultados de campañas, revisarlos con KPIs y
gráficos, y obtener **conclusiones, recomendaciones y próximos pasos de una IA
"data scientist"**.

Arquitectura: **núcleo normalizado + conectores enchufables**. El núcleo guarda
métricas de cualquier plataforma en un formato común; cada plataforma es un conector
que alimenta ese núcleo.

### Alcance v1 (este spec)
- Núcleo del módulo (modelo de datos + páginas + análisis IA).
- **Conector Meta Ads** de punta a punta (auth por token de System User + sync).
- IA data scientist sobre los datos sincronizados.

### Fuera de alcance v1 (specs futuras, mismo núcleo)
- Conectores Google Ads, TikTok Ads, Pinterest Ads.
- Flujo OAuth con redirección (v1 usa token pegado).
- Sincronización programada por cron (v1 usa botón "Sincronizar"; cron es mejora posterior).

## 2. Ubicación y navegación

- Sección **Voz** del sidebar (junto a Social Media), entrada **Las Pautas**, ruta `/pautas`.
- Icono: `Megaphone` (lucide).
- La entrada del sidebar la enciende esta terminal (dueña de `nav-config.tsx`).

## 3. Modelo de datos

Migración `0030_ads.sql` (siguiente número libre de esta terminal). Todas las tablas
con `company_id` y RLS por `accessible_company_ids()`, salvo la de secretos (owner-only).

### Enum
- `ad_platform`: `meta | google | tiktok | pinterest`

### Tablas
**`ad_accounts`** — cuenta publicitaria conectada
- `id uuid pk`, `company_id uuid fk companies`, `platform ad_platform`,
  `name text`, `external_account_id text` (p.ej. `act_123` en Meta),
  `currency text default 'EUR'`, `status text default 'active'` (active/paused/disconnected),
  `last_synced_at timestamptz`, `created_by`, `created_at`, `updated_at`.
- RLS: empresa accesible.

**`ad_account_secrets`** — credenciales (aisladas)
- `account_id uuid pk fk ad_accounts on delete cascade`, `access_token text`,
  `meta jsonb` (campos extra futuros), `updated_at`.
- **RLS owner-only** (`is_owner()`), tanto using como with check. Nunca se lee desde el cliente;
  solo lo leen server actions del conector.

**`ad_campaigns`** — campañas dentro de una cuenta
- `id uuid pk`, `account_id fk`, `company_id`, `external_campaign_id text`,
  `name text`, `objective text`, `status text` (active/paused/ended),
  `started_at date`, `ended_at date`, `created_at`, `updated_at`.
- `unique(account_id, external_campaign_id)` para upsert al sincronizar.

**`ad_metrics`** — serie diaria por campaña
- `id uuid pk`, `campaign_id fk`, `company_id`, `date date`,
  `spend numeric(14,2)`, `impressions bigint`, `clicks bigint`,
  `conversions numeric(14,2)`, `conversion_value numeric(14,2)`.
- `unique(campaign_id, date)` para upsert.
- Derivados al leer (no se almacenan): `ctr = clicks/impressions`,
  `cpc = spend/clicks`, `cpa = spend/conversions`, `roas = conversion_value/spend`.

**`ad_insights`** — análisis de IA persistidos
- `id uuid pk`, `company_id`, `account_id uuid null fk`, `campaign_id uuid null fk`,
  `period_from date`, `period_to date`, `content text` (markdown:
  conclusiones + recomendaciones + próximos pasos), `model text`, `created_by`, `created_at`.

## 4. Conector Meta (`src/lib/ads/meta.ts`, server-only)

- Lee `access_token` de `ad_account_secrets` para la cuenta.
- Llama a la Graph API de Meta:
  - Campañas: `GET /{account}/campaigns` (id, name, objective, status, start/stop).
  - Insights: `GET /{account}/insights` con `level=campaign`, `time_increment=1`,
    `fields=spend,impressions,clicks,actions,action_values`, rango de fechas (por defecto últimos 30 días).
  - Mapear `actions`/`action_values` (tipo `purchase`/`omni_purchase`) → `conversions` / `conversion_value`.
- `syncMetaAccount(accountId, sinceDays = 30)`: upsert de campañas y métricas; actualiza `last_synced_at`.
- Manejo de errores: token inválido/permiso → marcar cuenta `disconnected` y devolver mensaje claro.

## 5. IA data scientist (`src/lib/ads/analyst.ts`, server-only)

- **Aislado de `src/lib/ia/**`** (módulo de la otra terminal): cliente OpenRouter propio y mínimo
  que reusa la env var `OPENROUTER_API_KEY` y `OPENROUTER_MODEL_PRO` (mismo modelo, sin importar su código).
- `analyzeAds({ companyFilter, accountId?, campaignId?, from, to })`:
  1. Agrega KPIs del periodo (por campaña: gasto, impresiones, clics, CTR, CPC, conversiones, ROAS, CPA).
  2. Construye prompt en español pidiendo: **conclusiones**, **recomendaciones accionables** y **próximos pasos**, basadas solo en los datos.
  3. Llama a OpenRouter; guarda el resultado en `ad_insights`.
- Lógica pura testeable: el constructor del prompt y la agregación de KPIs van en `src/lib/ads/kpi.ts`
  con tests (`kpi.test.ts`): derivación de ctr/cpc/cpa/roas, agregación por campaña, manejo de divisores 0.

## 6. Páginas (`src/app/(app)/pautas/`)

- **`/pautas`** (server):
  - KPIs de cabecera (KpiGrid): gasto total, ROAS medio, conversiones, CPA medio (empresa activa, últimos 30 días).
  - Desglose por plataforma (de momento Meta).
  - Lista de campañas con sus KPIs + `StatusPill` por estado.
  - Panel del último `ad_insight` (render `<Markdown>`) + botón **Analizar con IA**.
  - Estado vacío editorial si no hay cuentas conectadas → enlaza a `/pautas/ajustes`.
- **`/pautas/[campaignId]`** (server): ficha de campaña — serie temporal (Recharts), KPIs, e historial de análisis IA de la campaña.
- **`/pautas/ajustes`** (server + client form): gestionar cuentas — añadir (plataforma, nombre, `external_account_id`, pegar token), **Sincronizar ahora**, desconectar.

## 7. Componentes (`src/components/pautas/`)

- `summary-cards.tsx` — KPIs (reusa KpiGrid/KpiCard/Money).
- `campaign-list.tsx` + `campaign-row.tsx` — lista de campañas con KPIs y StatusPill.
- `platform-breakdown.tsx` — gasto/ROAS por plataforma.
- `insight-panel.tsx` — render del análisis IA (Markdown) + botón Analizar (client).
- `account-form.tsx` — alta/edición de cuenta + pegar token (client).
- `campaign-chart.tsx` — serie temporal con Recharts (client).

## 8. Seguridad

- Token Meta en `ad_account_secrets` con RLS **owner-only**; nunca se selecciona en consultas
  de cliente; solo lo leen server actions del conector.
- Sin claves en el bundle de cliente. El análisis IA usa `OPENROUTER_API_KEY` (ya en Vercel), server-side.
- Advisor de Supabase tras la migración para verificar RLS.

## 9. Coordinación entre terminales

- Módulo y tablas (`ad_*`) **aislados**; no toca el esquema ni los módulos de la otra terminal.
- Reusa solo la env var `OPENROUTER_API_KEY` (no importa `src/lib/ia/**`).
- Migración `0030` (la otra terminal va por 0028/0029 de `automation_rules`).
- La expansión de **Automatizaciones+** (n8n/Claude/OpenRouter/OpenClaw/Higgsfield/HeyGen/ElevenLabs/email)
  es de la otra terminal (subsistema A, fuera de este spec).

## 10. Testing

- `kpi.test.ts`: derivaciones (ctr/cpc/cpa/roas), agregación por campaña, divisores 0, construcción de prompt.
- Build + advisor de seguridad tras migración.
- Verificación manual del sync con una cuenta Meta real (requiere token del owner).

## 11. Riesgos / dependencias

- **Bloqueado por credenciales**: el sync real requiere que el owner genere un token de System User
  en Meta Business Manager y el `external_account_id`. El núcleo + UI + IA se pueden construir y probar
  sin token (con datos sembrados); el conector se valida cuando haya credenciales.
- Cambios de la Graph API de Meta (versión): fijar versión en el cliente.
