# Spec — Sync con Shopify (solo lectura) · `/tienda`

**Fecha:** 2026-05-29
**Terminal:** Frontend/Atelier (`frontend-atelier`)
**Estado:** Diseño aprobado por el usuario — pendiente de revisión del spec.

## 1. Resumen

Página nueva `/tienda` que muestra **en vivo** datos de Shopify (ventas/pedidos + productos/stock)
**junto** a lo manual del panel (NO reemplaza `/inventario` ni `/ventas`). Lectura pura: cada visita
consulta la **Admin GraphQL API** de Shopify server-side con el token guardado en la **bóveda de
Conexiones**. **Sin migración** (no se copian datos a tablas propias). v1 lo ve la **propietaria**
(el token es owner-only en la bóveda); abrir al resto del equipo = mejora posterior (requiere
`SUPABASE_SERVICE_ROLE_KEY`). Módulo aislado `lib/shopify`; reutiliza el proveedor de Conexiones.

Decisiones (aprobadas):
- **Solo lectura** (ver, no escribir en Shopify) en v1.
- **Lectura en vivo** (read-through), sin sincronizar a BD ni migración.
- **Credenciales por la bóveda de Conexiones** (proveedor `shopify`): dominio + token Admin API.
- **v1 = propietaria** ve los datos; staff ve "configurado, pendiente de habilitar para el equipo".

## 2. Infra existente (verificada)

- **MCP de Shopify conectado** (para diseño/verificación, NO para el runtime del panel). Tienda
  `My Store 4` (`uasepn-7j.myshopify.com`, plan Basic, EUR, España). GraphQL **validado** contra la
  tienda real (ver §4): `shop`, `orders`, `products` con los campos usados existen y responden.
- **Centro de Conexiones** (`/conexiones`, migración `0034`): `integration_connections`
  (company-readable: provider+status+config) + `integration_secrets` (**owner-only** vía
  `is_owner()`). Registro `lib/conexiones/providers.ts`; acción `saveIntegrationCredentials`
  (owner-only) ya guarda N secretos por proveedor. **Reutilizo esto** — solo añado un proveedor.
- `getActiveCompany()`, `companies(id,name)`, RLS por empresa. Componentes Atelier
  (`PageHeader`, `KpiGrid`/`KpiCard`, `StatusPill`).

## 3. Sin modelo de datos nuevo

No hay migración (0035 sigue libre para el dashboard social). El token vive en `integration_secrets`
(owner-only, ya existe). El connector lo lee con la sesión del usuario: si es propietaria → token
disponible → datos en vivo; si no → sin token → la página muestra aviso. Los valores de secreto
**nunca** se serializan al cliente.

## 4. Conector (`lib/shopify/client.ts`)

- `getShopifyCreds(companyId)` → `{ domain, token } | null`:
  1. Lee `integration_connections` (provider `shopify`, status) — company-readable.
  2. Lee `integration_secrets` del `connection_id` (`SHOPIFY_SHOP_DOMAIN`, `SHOPIFY_ADMIN_TOKEN`) —
     owner-only RLS. Si falta el token (no owner o no configurado) → `null`.
- `shopifyGraphQL(creds, query, variables?)` → `{ data } | { error }`: `POST` a
  `https://{domain}/admin/api/2025-01/graphql.json` con header `X-Shopify-Access-Token: {token}`,
  `Content-Type: application/json`. Maneja `res.ok` falso y `errors[]` de GraphQL → `{ error }`.
  Versión de API en constante (`SHOPIFY_API_VERSION = "2025-01"`).

**GraphQL validado** (campos confirmados en vivo):
```graphql
shop { name currencyCode }
orders(first: 50, sortKey: CREATED_AT, reverse: true, query: "created_at:>={inicioMes}") {
  edges { node { name createdAt displayFinancialStatus
    currentTotalPriceSet { shopMoney { amount currencyCode } }
    customer { displayName } } }
}
products(first: 25, sortKey: TITLE) {
  edges { node { title status totalInventory variants(first: 1) { edges { node { price } } } } }
}
```

## 5. Lecturas + lógica (`lib/shopify/queries.ts` + `summary.ts`)

- `getStoreData(companyId)` → `{ configured: boolean; ownerOnly?: boolean; shopName; currency;
  orders: OrderRow[]; products: ProductRow[] } | { error }`. Si `getShopifyCreds` es null:
  distingue "no configurado" vs "configurado pero sin acceso (no owner)" leyendo
  `integration_connections.status`.
- **Lógica pura testeable** (`lib/shopify/summary.ts`):
  - `salesInRange(orders, fromISO, toISO?)` → suma de `amount` de pedidos cuyo `createdAt` cae en el
    rango (string ISO compara lexicográfico con prefijo fecha). Usado para "hoy" y "mes".
  - `ordersCount(orders, fromISO)` → nº de pedidos desde fecha.
  - `lowStock(products, threshold = 0)` → productos `ACTIVE` con `totalInventory <= threshold`.
  - `firstOfMonthISO(today)` / `todayISO(today)` → helpers de fecha deterministas.
  - Tests: sumas por rango, conteo, filtro low-stock, límites de fecha.

## 6. UI / pantallas

- **`/tienda/page.tsx`** (server): `PageHeader eyebrow="Operaciones" title="Tienda (Shopify)"`.
  Resuelve empresa activa (+ aviso si `"all"`). Llama `getStoreData`:
  - **No configurado** → tarjeta CTA "Conecta Shopify en /conexiones" (enlace).
  - **Configurado, sin acceso** (no owner) → aviso "La propietaria debe habilitar la vista para el
    equipo (pendiente)".
  - **Con datos** → `KpiGrid` (ventas hoy, ventas mes, nº pedidos del mes, productos activos) +
    tabla "Pedidos recientes" (nº, cliente, total, estado financiero con `StatusPill`) + tabla
    "Productos" (título, estado, stock, precio) con realce de **stock bajo**.
  - **Error de API** → aviso "No se pudo conectar con Shopify; revisa el token en /conexiones" +
    el mensaje de error.
  - Nota fija: "Esto es lo que ve Shopify (solo lectura). Tu inventario/ventas manuales siguen en
    Inventario y Ventas."
- Server component (sin cliente): es solo lectura/visualización. Money/format con helpers existentes
  o `toFixed(2)`.
- **Nav:** `nav-config.tsx` — entrada "Tienda" (icono `ShoppingBag`) bajo *Operaciones*. No `sidebar.tsx`.

## 7. Conexiones: nuevo proveedor (edita `lib/conexiones/providers.ts`)

Añadir al registro:
```
{ key: "shopify", label: "Shopify", description: "Lee inventario, pedidos y ventas de tu tienda Shopify.",
  category: "Tienda", secrets: [
    { name: "SHOPIFY_SHOP_DOMAIN", label: "Dominio de la tienda", help: "p. ej. uasepn-7j.myshopify.com" },
    { name: "SHOPIFY_ADMIN_TOKEN", label: "Token Admin API", help: "Shopify → Ajustes → Apps → Desarrollar apps → token Admin API" },
  ] }
```
No cambia la acción `saveIntegrationCredentials` (ya guarda N secretos genéricos). El dominio se
guarda como secreto por simplicidad (v1 owner-only); aceptable porque la vista v1 es owner-only.

## 8. Seguridad / validación

- Token **owner-only** (RLS de `integration_secrets`), leído solo server-side, **nunca** al cliente.
- Llamada a Shopify server-side; si el token es inválido → Shopify responde 401 → la página muestra
  aviso, no rompe.
- Solo lectura: ninguna mutación a Shopify (queries GraphQL, no mutations).
- `company_id` de la empresa activa; el connector empareja por empresa+provider.
- Rate limits: v1 hace pocas queries por visita (1 GraphQL combinada o 2). Aceptable para uso interno.

## 9. Coordinación (otra terminal)

- Todo nuevo (`lib/shopify`, `/tienda`) + edición aditiva a `lib/conexiones/providers.ts` (mío) y
  `nav-config.tsx`. **No** toca `/inventario`, `/ventas`, ni módulos de la otra terminal, ni
  `lib/ia`/`lib/automatizaciones`/`sidebar.tsx`. Sin migración.

## 10. Fuera de alcance v1 (YAGNI)

- Escribir en Shopify (cambiar stock/precio, crear productos/pedidos).
- Importar pedidos de Shopify a `sales`/`products` del panel (sigue el flujo manual).
- Webhooks/tiempo real; ShopifyQL/analytics avanzado; paginación más allá de 50 pedidos del mes.
- Vista para todo el equipo (requiere `SUPABASE_SERVICE_ROLE_KEY`; mejora posterior).
- Multi-tienda por empresa (una conexión Shopify por empresa en v1).

## 11. Testing

- `summary.test.ts` (puro): `salesInRange`, `ordersCount`, `lowStock`, helpers de fecha.
- `npm run build` + `npm test`. Smoke: como propietaria, pegar dominio+token en `/conexiones`
  (proveedor Shopify) → abrir `/tienda` → ver KPIs + productos reales (los pedidos pueden estar
  vacíos en la tienda de pruebas); token inválido → aviso de error. (Durante la construcción, las
  queries GraphQL se re-verifican vía MCP `graphql_query`.)

## 12. Fases (el plan lo detalla)

1. `lib/shopify/summary.ts` (puro) — TDD.
2. `lib/shopify/client.ts` (creds + GraphQL fetch) + `queries.ts` (`getStoreData`).
3. Proveedor `shopify` en `lib/conexiones/providers.ts`.
4. `/tienda/page.tsx` + entrada nav.
5. Build + test + deploy (FF a `main`) + memoria.
