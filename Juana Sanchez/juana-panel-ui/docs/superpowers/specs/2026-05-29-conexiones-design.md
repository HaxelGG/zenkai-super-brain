# Spec — Centro de Conexiones (esqueleto)

**Fecha:** 2026-05-29
**Terminal:** Frontend/Atelier (`frontend-atelier`)
**Estado:** Aprobado por el usuario ("monta el esqueleto") — pendiente de revisión del spec.

## 1. Resumen

Hub `/conexiones` para **gestionar integraciones externas**: una **bóveda segura de credenciales**
(tokens) por empresa, **owner-only**, + el **estado** de cada integración. v1 = **esqueleto**: registra
proveedores conocidos (WhatsApp Business, Instagram), permite al **owner** pegar/guardar sus
credenciales y marca la integración como "configurada", **sin cablear todavía** ninguna API (eso
llega cuando el usuario aporte los tokens de Meta). Migración **0034**. Módulo aislado
`lib/conexiones` + `/conexiones`. **No** toca `lib/automatizaciones`, `automation_*`, `lib/ia` ni
`sidebar.tsx`.

Decisiones (del usuario + diseño):
- **Almacenamiento:** en BD por empresa (no env globales) — distintas empresas pueden tener
  números/cuentas distintos. Secretos **owner-only**, nunca enviados al navegador (calca el patrón
  `ad_account_secrets` de Pautas).
- **Alcance v1:** solo el esqueleto (bóveda + estado + UI). Sin envío/recepción de mensajes, sin
  webhooks, sin llamadas a Graph API. Proveedores: WhatsApp e Instagram. MCP queda fuera hasta
  aclarar su forma (panel-como-servidor vs panel-consume-MCP).

## 2. Infra existente (verificada)

- `is_owner()` → boolean (security definer; `profiles.role = 'owner'`), `accessible_company_ids()`
  (migración `0001`).
- Patrón de secretos owner-only: `ad_account_secrets` (`0030`) con RLS
  `for all to authenticated using (public.is_owner()) with check (public.is_owner())`.
- Patrón por-empresa: `using (company_id in (select public.accessible_company_ids()))`.
- `getActiveCompany()` → `string | "all"`; selector con `companies(id,name)`.
- Numeración de migraciones: **0034** libre (mía). La otra terminal usa `0040+`.

## 3. Modelo de datos (migración `0034_integrations.sql`)

- **`integration_connections`** (legible por la empresa):
  - `id uuid pk default gen_random_uuid()`
  - `company_id uuid not null references public.companies(id) on delete cascade`
  - `provider text not null` (clave del registro: `'whatsapp'`, `'instagram'`, …)
  - `status text not null default 'disconnected' check (status in ('disconnected','connected','error'))`
  - `config jsonb not null default '{}'` (ajustes **no secretos**, p. ej. nombre visible)
  - `notes text`
  - `created_by uuid references public.profiles(id)`
  - `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()`
  - `unique (company_id, provider)`; índice en `company_id`.
- **`integration_secrets`** (owner-only):
  - `connection_id uuid not null references public.integration_connections(id) on delete cascade`
  - `name text not null` (p. ej. `'WHATSAPP_TOKEN'`)
  - `value text not null`
  - `updated_at timestamptz not null default now()`
  - `primary key (connection_id, name)`
- **RLS:**
  - `integration_connections`: `for all to authenticated using (company_id in (select
    public.accessible_company_ids())) with check (...)`.
  - `integration_secrets`: `for all to authenticated using (public.is_owner()) with check
    (public.is_owner())`. (Los valores solo los lee/escribe el owner; el server jamás los devuelve
    al cliente.)
- Aplicación: vía Supabase MCP `apply_migration` a la BD viva (`hfwhrwdmwgdicpsfdvyq`) + regenerar
  `src/types/db.ts` (`generate_typescript_types`). Conflicto típico de `db.ts` con la otra terminal
  → se resuelve regenerando (contiene la unión de todas las tablas).

## 4. Registro de proveedores (estático, en código: `lib/conexiones/providers.ts`)

`type Provider = { key; label; description; category; secrets: { name; label; help? }[] }`. v1:
- `whatsapp` — "WhatsApp Business" — secrets: `WHATSAPP_TOKEN` (token permanente System User),
  `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN` (lo elige el usuario para el webhook).
- `instagram` — "Instagram (Mensajes)" — secrets: `IG_ACCESS_TOKEN`, `IG_BUSINESS_ACCOUNT_ID`.

`PROVIDERS: Provider[]` + `getProvider(key)`. Añadir un proveedor en el futuro = una entrada aquí.
(Función pura, testeable: que cada proveedor tenga al menos un secreto y claves únicas.)

## 5. Lecturas (`lib/conexiones/queries.ts`)

- `listConnections(companyId)` → `Map<provider, { status, config }>` (de `integration_connections`).
  Legible por la empresa; **no** devuelve secretos.
- `configuredProviders(companyId)` → set de providers con `status='connected'` (para badges).
- (Owner) los valores de secretos **no** se leen para la UI; el formulario siempre va en blanco
  (write-only). En el futuro, el conector los leerá server-side.

## 6. Server actions (`lib/conexiones/actions.ts`, "use server")

- **`saveIntegrationCredentials(provider, formData)`** — **owner-only**.
  1. Comprueba `is_owner` (consulta `profiles.role`); si no, `{ error: "Solo el propietario…" }`.
  2. Valida que el `provider` existe en el registro y que **todos** sus `secrets` requeridos vienen
     no vacíos en `formData`; si falta alguno → `{ error }` (no se marca conectado a medias).
  3. Upsert `integration_connections (company_id, provider, status='connected', created_by)` por
     `(company_id, provider)`; obtiene `connection_id`.
  4. Upsert cada secreto en `integration_secrets (connection_id, name, value)`.
  5. `revalidatePath('/conexiones')`. La RLS owner-only es el backstop si el check de código fallara.
- **`disconnectIntegration(provider)`** — **owner-only**. Borra los `integration_secrets` del
  `connection_id` y pone `status='disconnected'` (conserva la fila/config). `revalidatePath`.
- (Sin acciones de envío/lectura de mensajes en v1.)

## 7. UI / pantallas

- **`/conexiones/page.tsx`** (server): `PageHeader eyebrow="Atelier digital" title="Centro de
  Conexiones"`; carga empresa activa + `companies` + `listConnections`. Lista las tarjetas de
  `PROVIDERS` con su **badge de estado** (`StatusPill`: "Sin configurar" / "Configurada" / "Error").
  Aviso si la empresa activa es `"all"` (pide elegir empresa). Texto que explique que esto guarda
  credenciales pero el envío de mensajes llega en una fase posterior.
- **`components/conexiones/connection-card.tsx`** (`"use client"`): por proveedor; si el usuario es
  **owner**, muestra un formulario con los campos de secretos (siempre en blanco, `type="password"`,
  autocomplete off) + botón **Guardar** (llama `saveIntegrationCredentials`) y **Desconectar**
  (si está configurada). Si **no es owner**, solo el badge + nota "Solo el propietario puede editar
  credenciales". Toasts `sonner`; `FieldError`.
- `page.tsx` pasa `isOwner` (de `profiles.role`) a las tarjetas.
- **Nav:** `nav-config.tsx` — entrada "Conexiones" (icono `Plug`/`Cable`) bajo *Atelier digital*
  (junto a IA Tools / Asistente). **No** `sidebar.tsx`.

## 8. Seguridad / validación

- Secretos **owner-only** por RLS (`is_owner()`), **nunca** serializados al cliente (el formulario es
  write-only; la UI solo conoce el `status`, no los valores).
- Acción `saveIntegrationCredentials`/`disconnect` comprueban `is_owner` en código **y** la RLS lo
  refuerza.
- `company_id` de la empresa elegida; RLS por empresa para `integration_connections`.
- Sin secretos en git; el valor vive en BD (cifrado en reposo por Supabase, igual que
  `ad_account_secrets`). Sin llamadas externas en v1 (nada que filtrar).

## 9. Coordinación (otra terminal)

- **Roce conocido:** la otra terminal posee *Automatizaciones+* (orquestación de integraciones). Este
  Centro de Conexiones se construye **a petición explícita del usuario** y **aislado**: tablas propias
  `integration_*`, `lib/conexiones`, `/conexiones`. **No** toca `automation_*`, `lib/automatizaciones`,
  `lib/ia`, ni `sidebar.tsx`. Único fichero compartido: `nav-config.tsx` (aditivo) y `types/db.ts`
  (regenerado). **Avisar** a la otra terminal de las tablas nuevas por si su capa de integraciones
  quisiera leer estas credenciales en el futuro.
- Migración **0034** (no colisiona con su bloque `0040+`).

## 10. Fuera de alcance v1 (YAGNI)

- Envío/recepción de WhatsApp/Instagram, webhooks, Graph API, app review (fase posterior, requiere
  los tokens de Meta del usuario).
- MCP (panel-como-servidor o panel-consume-MCP): pendiente de aclarar; no se construye aún.
- Rotación/caducidad de tokens, registro de actividad, prueba de conexión en vivo.
- Email marketing / n8n / otros conectores de Automatizaciones+ (territorio de la otra terminal).

## 11. Testing

- `providers.test.ts` (puro): el registro tiene claves únicas y cada proveedor ≥ 1 secreto con
  nombres no vacíos.
- `npm run build` + `npm test`. Smoke: como owner, abrir `/conexiones`, guardar credenciales de
  WhatsApp → badge pasa a "Configurada"; recargar y comprobar que los campos siguen en blanco (no se
  filtran valores); "Desconectar" → vuelve a "Sin configurar". Como no-owner, ver badges sin
  formulario.

## 12. Fases (el plan lo detalla)

1. Migración `0034_integrations.sql` (tablas + RLS) → aplicar a BD viva + regenerar `db.ts`.
2. `providers.ts` (registro, puro) — test.
3. `queries.ts` + `actions.ts` (owner-only).
4. `connection-card.tsx` + `/conexiones/page.tsx` + entrada nav.
5. Build + test + deploy (FF a `main`) + memoria.
