# Spec — Importador / Migración de datos (CSV)

**Fecha:** 2026-05-28
**Terminal:** Frontend/Atelier (`frontend-atelier`)
**Estado:** Diseño aprobado — pendiente de revisión del usuario.

## 1. Resumen

Hub nuevo `/importar` para **migrar datos de otro software al panel vía CSV**. Wizard de
5 pasos: subir archivo → mapear columnas → vista previa con validación → opciones de
deduplicación → resultado. v1 cubre **clientes** (`customers`) y **productos**
(`products` + `categories`). **Sin migración SQL** — escribe en tablas existentes vía
server actions. Módulo aislado `lib/importar` + componentes `components/importar` +
páginas `/importar`. **Única modificación a fichero existente:** `nav-config.tsx`
(añadir entrada). No toca páginas de `/crm` ni `/inventario` (territorio de la otra terminal).

Decisiones tomadas (brainstorming):
- **Entidades v1:** clientes y productos (las dos tablas con alta por FormData ya existentes).
- **Formato:** CSV únicamente, parser propio TDD (sin dependencias nuevas).
- **Deduplicación:** elegible por importación — **upsert** (actualizar si existe) o **skip**
  (saltar si existe). Clave: `email` (clientes) / `sku` (productos). Si la clave viene
  vacía → siempre inserta.
- **Enfoque:** hub dedicado, wizard cliente + server action de carga masiva; el servidor
  es la **fuente de verdad** (re-parsea y re-valida; nunca confía en el cliente).

## 2. Infra existente (verificada)

- **`customers`** (`0007_crm.sql`): `company_id` (req), `name` (req), `type customer_type`
  (`particular|tienda|mayorista`, default `particular`), `status customer_status`
  (`lead|active|inactive`, default `lead`), `email` (nullable, **sin unique**), `phone`,
  `tags text[] default '{}'`, `notes`, `created_by`. Alta vía `createCustomer(FormData)`
  (`lib/crm/actions.ts`); `parseTags` en `lib/crm/customer`.
- **`products`** (`0004_inventory.sql`): `company_id` (req), `category_id` (nullable FK,
  `on delete set null`), `name` (req), `sku` (nullable, **`unique(company_id, sku)`**),
  `description`, `cost numeric default 0`, `price numeric default 0`, `image_url`,
  `status` (`active|inactive`, default `active`), `low_stock_threshold int default 0`.
  Alta vía `createProduct(FormData)` (`lib/inventory/actions.ts`) — **no** setea `category_id`.
- **`categories`** (`0004_inventory.sql`): `company_id`, `name`, **`unique(company_id, name)`**.
- **Empresa activa:** `getActiveCompany()` → `string | "all"` (cookie `active_company`).
  Patrón de alta con selector: `supabase.from("companies").select("id,name").order("name")`
  → pasar al form; RLS (`accessible_company_ids()`) acota a empresas accesibles.
- Toasts `sonner`, componentes Atelier (`PageHeader`, `KpiGrid`/`Kpi`, `FieldError`, `StatusPill`).

## 3. Sin modelo de datos nuevo

No hay migración. El importador inserta/actualiza en `customers`, `products` y `categories`
con la sesión del usuario (RLS aplica). Se preserva la numeración de migraciones (siguiente
libre **0034** intacta).

## 4. Lógica pura testeable

### `lib/importar/csv.ts` (TDD)
- `parseCSV(text: string): string[][]` — RFC 4180: campos entre comillas, comillas escapadas
  (`""`), comas y saltos de línea dentro de comillas, `CRLF`/`LF`, BOM inicial, ignora última
  línea vacía. Sin dependencias.
- `toRecords(rows: string[][]): { headers: string[]; records: Record<string,string>[] }`
  — primera fila = cabeceras; cada registro mapea cabecera→celda (rellena `""` si faltan columnas).
- Tests: comillas/escapes, saltos embebidos, CRLF, BOM, filas desiguales, vacío.

### `lib/importar/entities.ts` (TDD)
- Tipo `FieldDef = { key, label, required, aliases: string[], kind: "text"|"enum"|"number"|"int"|"tags"|"email"; enumValues?, synonyms? }`.
- `CUSTOMER_FIELDS` / `PRODUCT_FIELDS` (ver §5).
- `normalize(s)` — `trim().toLowerCase()` sin acentos (para matching de cabeceras y enums).
- `autoMatch(headers, fields): Record<csvHeader, fieldKey>` — empareja por igualdad
  normalizada con `key`/`label`/`aliases`; no asigna dos cabeceras al mismo campo.
- `coerceValue(field, raw)` — text: `trim`; email: lowercase + check básico `@`; number/int:
  limpia símbolos de moneda y separador de miles, acepta coma decimal; tags: split por `,`/`;`;
  enum: normaliza + `synonyms` → valor canónico, blanco → `default`. Devuelve
  `{ value } | { error }`.
- `validateRecord(record, fields, mapping)` → `{ values: Record<fieldKey,unknown>; errors: string[] }`
  — exige campos `required` no vacíos; agrega errores de coerción por campo.
- Tests: autoMatch con alias/acentos, números con coma/€, enums por sinónimo, required ausente.

## 5. Catálogo de campos

**Clientes** (`CUSTOMER_FIELDS`)

| key | req | tipo | alias reconocidos | normalización |
|---|---|---|---|---|
| `name` | ✅ | text | nombre, name, cliente, razón social | trim |
| `email` | — | email | email, correo, e-mail, mail | lowercase, debe contener `@` |
| `phone` | — | text | phone, teléfono, tel, celular, móvil | trim |
| `type` | — | enum | tipo, type | particular/tienda/mayorista (def. `particular`) |
| `status` | — | enum | estado, status | lead/active/inactive (def. `lead`); sinónimos activo→active, cliente→active |
| `tags` | — | tags | etiquetas, tags, categorías | split `,`/`;` |
| `notes` | — | text | notas, notes, observaciones, comentarios | trim |

**Productos** (`PRODUCT_FIELDS`)

| key | req | tipo | alias reconocidos | normalización |
|---|---|---|---|---|
| `name` | ✅ | text | nombre, name, producto, artículo, título | trim |
| `sku` | — | text | sku, código, codigo, ref, referencia | trim |
| `category` | — | text | categoría, categoria, category, rubro | resuelve/crea en `categories` |
| `cost` | — | number | costo, coste, cost, precio costo | núm. (coma/€) |
| `price` | — | number | precio, price, pvp, precio venta | núm. (coma/€) |
| `description` | — | text | descripción, descripcion, description, detalle | trim |
| `status` | — | enum | estado, status | active/inactive (def. `active`); activo→active |
| `low_stock_threshold` | — | int | stock mínimo, umbral, threshold | entero ≥ 0 |

> `image_url` queda **fuera** de v1 (no se suben imágenes). El stock inicial **no** se importa
> aquí (entra por movimientos en Inventario); v1 sólo crea/actualiza la ficha de producto.

## 6. Server actions (`lib/importar/actions.ts`, "use server")

Entrada común: `{ companyId, csvText, mapping, mode: "upsert"|"skip" }`. El servidor
**re-parsea** `csvText` con `parseCSV` (misma función pura que el preview) y **re-valida**
cada fila — nunca confía en valores del cliente. Devuelve
`ImportResult = { created, updated, skipped, errors: { row: number; message: string }[] }`.

- **`importCustomers(input)`**
  1. `SELECT id,email FROM customers WHERE company_id = companyId` → `Map<emailLower, id>`.
  2. Por fila: `validateRecord`; si error → `errors.push`, continúa.
  3. Dedup por `email` (lowercase): existe → `upsert` (UPDATE por id) o `skip` (`skipped++`);
     sin email o no existe → INSERT (`company_id`, `created_by`, `tags` vía array, resto).
  4. Inserciones/updates en **lotes** (chunk ~200) para no saturar; acumula contadores.
- **`importProducts(input)`**
  1. `SELECT id,sku FROM products WHERE company_id` → `Map<sku, id>`;
     `SELECT id,name FROM categories WHERE company_id` → `Map<nameLower, id>`.
  2. Por fila: `validateRecord`; resolver `category_id`: lookup en mapa; si falta y hay
     nombre → INSERT en `categories` (y cachear); errores de categoría → fila a `errors`.
  3. Dedup por `sku`: existe → `upsert`/`skip`; sin sku o no existe → INSERT.
     (La constraint `unique(company_id, sku)` es la red de seguridad final.)
  4. Lotes; contadores.
- Ambas: al terminar `revalidatePath("/crm")` / `revalidatePath("/inventario")` +
  `revalidatePath("/importar")`. Errores de fila **no** abortan el lote (importación parcial
  con reporte), salvo fallo de conexión global → `{ error }`.

> **Límite conocido:** el `csvText` viaja en el cuerpo del server action (límite Next por
> defecto ~1 MB). v1: avisar y sugerir dividir archivos muy grandes; documentar
> `serverActions.bodySizeLimit` como ajuste futuro si hiciera falta.

## 7. UI / pantallas

- **`/importar/page.tsx`** (server): `PageHeader` + carga `companies` (id,name) → render
  `<ImportWizard companies=… />`. Si sólo hay 1 empresa accesible, se preselecciona.
- **`components/importar/import-wizard.tsx`** (`"use client"`): máquina de estados de 5 pasos.
  1. **Entidad + empresa + archivo**: toggle Clientes/Productos; selector de empresa (si
     `getActiveCompany="all"` o varias); `<input type="file" accept=".csv,text/csv">` →
     `FileReader.readAsText` → `parseCSV` + `toRecords` en cliente.
  2. **Mapear columnas**: tabla `cabecera CSV → <select> campo`; `autoMatch` pre-rellena;
     marca required sin mapear; muestra "ignorar" como opción.
  3. **Vista previa**: primeras ~20 filas con `validateRecord`; celdas con error en rojo
     (`FieldError`); contador `<Kpi>` válidas / con error / total.
  4. **Opciones**: radio Upsert / Skip; recuerda la clave de dedupe (email/sku) en texto.
  5. **Importar + Resultado**: botón → server action con `csvText` íntegro + mapping + mode +
     companyId; spinner; al volver, panel resumen (creados / actualizados / saltados / errores
     con nº de fila) + enlace a `/crm` o `/inventario`. Toast `sonner`.
- Estilo Atelier (tokens, esquinas rectas, `Kpi`, `StatusPill`, `FieldError`).

## 8. Navegación (única modificación a código existente)

`components/app-shell/nav-config.tsx`: importar `Upload` de `lucide-react` y añadir bajo
**Operaciones** (tras Devoluciones):
```ts
{ href: "/importar", label: "Importar datos", icon: Upload }
```
**No tocar `sidebar.tsx`** (regla de coordinación). No añadir botones en `/crm` ni
`/inventario` (páginas de la otra terminal).

## 9. Seguridad / validación

- Servidor **re-parsea y re-valida**; el cliente sólo aporta el texto del CSV + el mapeo + el modo.
- `company_id` tomado del selector y acotado por RLS (`accessible_company_ids()`); un usuario no
  puede escribir en una empresa que no ve.
- `created_by` = usuario de sesión. Enums coercionados a valores canónicos o fila rechazada.
- Importación **parcial tolerante a fallos**: una fila inválida no tumba el lote; se reporta.
- Sin secretos ni dependencias nuevas; CSV se procesa en memoria (no se persiste el archivo).

## 10. Coordinación (otra terminal)

- Todo nuevo y aislado (`lib/importar`, `components/importar`, `app/(app)/importar`).
- **Único fichero compartido tocado:** `nav-config.tsx` (aditivo, una línea). **No** toco
  `sidebar.tsx`, ni `lib/automatizaciones/**`, ni páginas/acciones de `/crm` ni `/inventario`.
- Escribe en `customers`/`products`/`categories` con las **mismas** reglas que sus formularios
  de alta (mismos campos, misma RLS). Avisar de que existe una vía de alta masiva.

## 11. Fuera de alcance v1 (YAGNI)

- Excel `.xlsx` / Google Sheets (sólo CSV).
- Importar ventas, cotizaciones, interacciones o movimientos de stock.
- Subida de imágenes (`image_url`).
- Stock inicial por producto (entra por Inventario).
- Importaciones programadas / webhooks / API de terceros.
- Undo/rollback de una importación (mitigado por modo `skip` y preview previo).
- Multi-archivo por lote; deduplicación difusa (sólo igualdad exacta de clave).

## 12. Testing

- `csv.test.ts`: comillas/escapes, saltos embebidos, CRLF, BOM, filas desiguales, vacío.
- `entities.test.ts`: `autoMatch` (alias/acentos), `coerceValue` (números coma/€, enums por
  sinónimo, email inválido), `validateRecord` (required ausente, agregación de errores).
- `npm run build` + `npm test`. Verificación manual: CSV de clientes y de productos →
  mapear → preview marca errores → importar en modo skip y upsert → comprobar altas en
  `/crm` y `/inventario`, categorías auto-creadas, y conteos del resumen.

## 13. Fases de implementación (resumen; el plan lo detalla)

1. `csv.ts` (puro) — TDD.
2. `entities.ts` (puro: campos, autoMatch, coerción, validación) — TDD.
3. `actions.ts` (`importCustomers` / `importProducts`, dedupe + lotes).
4. `import-wizard.tsx` (cliente, 5 pasos).
5. `/importar/page.tsx` (hub) + entrada en `nav-config.tsx`.
6. Build + test + deploy (fast-forward a `main`).
