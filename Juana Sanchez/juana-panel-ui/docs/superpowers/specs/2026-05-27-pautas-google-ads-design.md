# Spec — Conector Google Ads (módulo Las Pautas)

**Fecha:** 2026-05-27
**Terminal:** Frontend/Atelier (`frontend-atelier`)
**Estado:** Diseño — pendiente de revisión del usuario. Bloqueado en credenciales (ver §7).

## 1. Resumen

Segundo conector del módulo «Las Pautas», sobre el **mismo núcleo normalizado** (`ad_accounts`,
`ad_account_secrets`, `ad_campaigns`, `ad_metrics`, `ad_insights`) ya en producción. Añade la
capacidad de conectar una cuenta de **Google Ads**, sincronizar campañas + métricas diarias al
formato común, y reutilizar tal cual las vistas, KPIs y la IA data scientist existentes.

**Sin cambios de esquema ni migración:** el enum `ad_platform` ya incluye `google`, y las
credenciales adicionales de Google caben en la columna `ad_account_secrets.meta` (jsonb).

## 2. Decisión de autenticación

Google Ads API exige OAuth2 + un **developer token** (no admite "pegar un token" simple como el
System User de Meta). Para una herramienta interna de un solo dueño se evita construir un flujo
OAuth con redirección: el owner genera **una vez** un *refresh token* y lo pega, junto al resto de
credenciales, en Ajustes. El conector intercambia el refresh token por un access token efímero en
cada sync.

Credenciales (guardadas en `ad_account_secrets.meta` jsonb, RLS owner-only):
- `developer_token` — token de desarrollador de Google Ads (requiere aprobación de Google).
- `client_id`, `client_secret` — del cliente OAuth (Google Cloud Console).
- `refresh_token` — generado una vez vía OAuth playground/script con scope `https://www.googleapis.com/auth/adwords`.
- `login_customer_id` — (opcional) ID de la cuenta MCC si la cuenta cuelga de un manager.

`ad_accounts.external_account_id` = el `customer_id` de Google Ads (10 dígitos, sin guiones).
La columna `ad_account_secrets.access_token` queda sin uso para Google (se mintea on-the-fly).

## 3. Conector (`src/lib/ads/google.ts`, server-only)

- `mintAccessToken(creds)`: POST `https://oauth2.googleapis.com/token` con
  `grant_type=refresh_token`, `client_id`, `client_secret`, `refresh_token` → `access_token`.
- `syncGoogleAccount(accountId, sinceDays=30)`:
  1. Lee creds de `ad_account_secrets.meta`.
  2. Mintea access token.
  3. POST `https://googleads.googleapis.com/v17/customers/{customer_id}/googleAds:searchStream`
     con headers `Authorization: Bearer <token>`, `developer-token`, y `login-customer-id` si existe.
     GAQL:
     ```
     SELECT campaign.id, campaign.name, campaign.status,
            campaign.advertising_channel_type, segments.date,
            metrics.cost_micros, metrics.impressions, metrics.clicks,
            metrics.conversions, metrics.conversions_value
     FROM campaign
     WHERE segments.date DURING LAST_30_DAYS
     ```
  4. Mapea cada fila: upsert de `ad_campaigns` (por `external_campaign_id` = campaign.id) y
     `ad_metrics` (por `campaign_id,date`). Conversión clave: `spend = cost_micros / 1_000_000`.
     `conversions`, `conversions_value` directos; `impressions`/`clicks` directos.
     Estado: mapear `ENABLED→active`, `PAUSED→paused`, `REMOVED→ended`.
  5. Marca `last_synced_at` y `status=active` (o `disconnected` + mensaje claro si la API falla).
- Versión de API fijada (`v17`).

## 4. Lógica pura testeable (`src/lib/ads/google-map.ts` + test)

Para no depender de la red en tests, la transformación va aparte:
- `gaqlRowToMetric(row)`: `{ campaign, metric }` con `spend = cost_micros/1e6`, etc.
- `mapGoogleStatus(s)`: ENABLED/PAUSED/REMOVED → active/paused/ended.
- Tests (`google-map.test.ts`): cost_micros→€, estados, fila sin conversiones (0).

## 5. Server actions / routing (`src/lib/ads/actions.ts`)

- `addAccount` se extiende: si `platform==='google'`, guarda en `ad_account_secrets.meta` el objeto
  de credenciales (developer_token/client_id/client_secret/refresh_token/login_customer_id) en vez
  de `access_token`.
- `syncAccount(accountId)` enruta por `account.platform`: `meta → syncMetaAccount`, `google → syncGoogleAccount`.
- `runAnalysis` no cambia (opera sobre el núcleo normalizado, agnóstico de plataforma).

## 6. UI (`src/components/pautas/account-form.tsx`)

- El formulario muestra campos condicionales según la plataforma elegida:
  - Meta → un campo "Token (System User)".
  - Google → cinco campos: developer token, client id, client secret, refresh token, login customer id (opcional).
- Resto de páginas (`/pautas`, `/pautas/[campaignId]`, `/pautas/ajustes`) **sin cambios**: ya son
  agnósticas de plataforma (leen del núcleo). El desglose por plataforma de `/pautas` mostrará Meta y Google.

## 7. Riesgos / dependencias (BLOQUEANTE)

El sync real requiere que el owner obtenga, en este orden:
1. **Cuenta de Google Cloud** + proyecto, habilitar **Google Ads API**.
2. **Developer token** en Google Ads (API Center). El nivel "Test" solo accede a cuentas de prueba;
   datos reales requieren **Basic access** (solicitud aprobada por Google, suele tardar días).
3. **Cliente OAuth** (client_id/secret) y generar un **refresh_token** una vez.
4. El `customer_id` (y `login_customer_id` si hay MCC).

Hasta tener (2), el conector se puede construir y testear con la lógica pura, pero el sync real no
se valida. Por eso es una spec aparte y posterior a Meta.

## 8. Coordinación / numeración

- **Sin migración** (reusa núcleo + `secrets.meta`). No consume número; mi siguiente libre sigue siendo 0031.
- Aislado de la otra terminal; reusa solo el núcleo `ad_*` y `OPENROUTER_API_KEY` (vía analyst existente).

## 9. Alcance

- IN: conector Google Ads (auth por credenciales pegadas, sync GAQL, mapeo), routing de sync, form condicional, tests de mapeo puro.
- OUT: flujo OAuth con redirección; TikTok/Pinterest (specs propias); cron de sync programado.
