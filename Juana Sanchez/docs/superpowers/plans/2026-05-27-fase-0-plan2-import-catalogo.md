# Fase 0 · Plan 2 — Import del catálogo (Workstream B) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar el catálogo de `juanasanchez.es` (WooCommerce, ~150–300 productos) a Shopify (My Store 4): extraer cada producto con Firecrawl (estructurado), mapear a un CSV nativo de Shopify con variantes de talla, imágenes por URL, colecciones por ocasión y metafields de clasificación; productos sin precio ("N/D") como borrador.

**Architecture:** Pipeline de datos en 3 etapas. (1) **Extracción**: Firecrawl `map` para descubrir URLs `/producto/*` + extracción **estructurada con schema JSON** por producto → JSON limpio en `.firecrawl/catalogo/`. (2) **Transformación**: script Node que normaliza (ocasión, tipo de pieza, familia de color, tallas→variantes, N/D→draft) → `productos-shopify.csv`. (3) **Carga**: import del CSV en Shopify (Productos → Importar) + creación de colecciones por ocasión. Las 38 fotos studio ya clasificadas (`fotos producto/0X_*`) son imágenes editoriales para hero/destacados (Plan 3), independientes de las imágenes de producto del crawl.

**Tech Stack:** Firecrawl CLI/MCP (extract estructurado), Node.js (transformación CSV), Shopify product CSV import, Shopify metafields/collections.

**Fuentes:** `Online store/tienda online/CATALOGO-INTEL.md` (estructura ya mapeada: URL `/producto/{slug}`, categorías, tallas EU 20–41, imágenes WP, precio o "N/D"). **Spec:** `docs/superpowers/specs/2026-05-27-fase-0-1-fundaciones-tema-porting-home-design.md` (§6, decisión B-1: N/D → draft).
**Working dir de datos:** `Online store/tienda online/` (subcarpeta `.firecrawl/catalogo/` y salida `import/`).

---

## Notas de ejecución
- **Verificación** = conteos + validación de CSV + muestreo (no hay tests unitarios).
- **Firecrawl** ya está instalado (CLI global + MCP). `FIRECRAWL_API_KEY` en entorno o `~/.claude.json`.
- **Carga en Shopify**: el import del CSV y la creación de colecciones requieren **ACCIÓN USUARIO** (admin de Shopify) o el MCP de Shopify autenticado (hoy NO lo está). El resto (crawl, transformación, CSV) es 100% automatizable.
- Respetar rate limits de Firecrawl: crawl por lotes; si un job falla, `firecrawl ask` con el jobId.

---

## Task 1: Descubrir todas las URLs de producto

**Files:**
- Create: `Online store/tienda online/.firecrawl/product-urls.txt`

- [ ] **Step 1: Map del dominio filtrando productos**

Run (desde `Online store/tienda online/`, con `FIRECRAWL_API_KEY` en entorno):
```bash
firecrawl map https://www.juanasanchez.es --search "producto" --limit 1000 \
  | grep -E "/producto/" | sort -u > .firecrawl/product-urls.txt
wc -l .firecrawl/product-urls.txt
```
Expected: un fichero con N URLs `https://www.juanasanchez.es/producto/<slug>` (esperado ~150–300). Si sale < 100, el `--search` filtró de más → reintentar `firecrawl map https://www.juanasanchez.es --limit 2000 | grep "/producto/"`.

- [ ] **Step 2: Sanity-check**

Run: `head -5 .firecrawl/product-urls.txt && echo "..." && tail -5 .firecrawl/product-urls.txt`
Expected: todas las líneas casan `^https://www\.juanasanchez\.es/producto/`.

---

## Task 2: Extracción estructurada por producto (Firecrawl + schema)

**Files:**
- Create: `Online store/tienda online/.firecrawl/extract-schema.json`
- Create: `Online store/tienda online/.firecrawl/catalogo/<slug>.json` (uno por producto)

- [ ] **Step 1: Definir el schema de extracción**

Create `.firecrawl/extract-schema.json`:
```json
{
  "type": "object",
  "properties": {
    "nombre": { "type": "string", "description": "Nombre del producto, ej. 'Valenciana 10078'" },
    "sku": { "type": "string", "description": "SKU/referencia del producto" },
    "precio_eur": { "type": ["number", "null"], "description": "Precio en euros como número; null si aparece 'N/D' o sin precio" },
    "categorias": { "type": "array", "items": { "type": "string" }, "description": "Breadcrumb/categorías, ej. ['Comunión y arras','Esparteñas niña']" },
    "tallas": { "type": "array", "items": { "type": "string" }, "description": "Tallas disponibles, ej. ['25','26',...,'41']" },
    "descripcion": { "type": "string", "description": "Descripción del producto, texto plano" },
    "imagenes": { "type": "array", "items": { "type": "string" }, "description": "URLs absolutas de imágenes del producto (wp-content/uploads), sin miniaturas duplicadas" }
  },
  "required": ["nombre", "categorias", "imagenes"]
}
```

- [ ] **Step 2: Extraer cada producto (estructurado)**

Por cada URL de `product-urls.txt`, ejecutar extracción estructurada y guardar JSON. Usar el CLI de Firecrawl con extracción por schema (formato JSON). Patrón por URL:
```bash
mkdir -p .firecrawl/catalogo
while read url; do
  slug=$(echo "$url" | sed -E 's#.*/producto/([^/?]+).*#\1#')
  out=".firecrawl/catalogo/${slug}.json"
  if [ -s "$out" ]; then continue; fi   # idempotente: no re-extraer
  firecrawl scrape "$url" --json-schema .firecrawl/extract-schema.json -o "$out" \
    || echo "FALLO: $url" >> .firecrawl/extract-errors.log
done < .firecrawl/product-urls.txt
```
NOTA: si el flag exacto del CLI difiere (`--extract`/`--schema`/`--format json`), consultar `firecrawl scrape --help`; el objetivo es **una llamada de extracción estructurada por URL** que escriba el JSON del schema. Alternativa MCP: `firecrawl_extract` con `urls=[...]` y `schema` del fichero. Si una extracción devuelve vacío, reintentar una vez; si vuelve a fallar, registrar en `extract-errors.log` y seguir.

- [ ] **Step 3: Verificar cobertura**

Run:
```bash
echo "URLs:"; wc -l < .firecrawl/product-urls.txt
echo "JSON extraídos:"; ls .firecrawl/catalogo/*.json | wc -l
echo "Errores:"; [ -f .firecrawl/extract-errors.log ] && wc -l < .firecrawl/extract-errors.log || echo 0
```
Expected: nº de JSON ≈ nº de URLs (menos los de `extract-errors.log`). Si faltan > 10%, revisar el flag de extracción y re-ejecutar (es idempotente).

---

## Task 3: Normalización (ocasión, tipo, color, precio)

**Files:**
- Create: `Online store/tienda online/import/normalize.mjs`
- Create: `Online store/tienda online/import/productos.normalizado.json`

- [ ] **Step 1: Script de normalización**

Create `import/normalize.mjs`:
```javascript
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const SRC = '../.firecrawl/catalogo';
const files = readdirSync(SRC).filter(f => f.endsWith('.json'));

// Mapeo categoría WooCommerce -> ocasión Shopify (tag/colección)
const OCASION = [
  [/comuni/i, 'Comunión'],
  [/arras/i, 'Arras'],
  [/bautiz/i, 'Bautizo'],
  [/novia/i, 'Novias'],
  [/madrina|jovencita/i, 'Ceremonia'],
  [/ni(ñ|n)as?\s*y\s*bebes|bebe/i, 'Niñas y bebés'],
];
// Tipo de pieza por palabras clave en nombre/categoría
const TIPO = [
  [/esparte/i, 'Esparteña'], [/manoletina/i, 'Manoletina'], [/sandal/i, 'Sandalia'],
  [/corona/i, 'Corona'], [/diadema/i, 'Diadema'], [/tocado/i, 'Tocado'],
  [/guante/i, 'Guante'], [/rosario|cruz/i, 'Rosario'], [/pulsera/i, 'Pulsera'],
  [/bolso|limosnera|cesta/i, 'Complemento'], [/tira|agujon|prendido|pinza/i, 'Adorno'],
];
const pick = (rules, text, def='') => (rules.find(([re]) => re.test(text)) || [,def])[1];

function handleize(s){ return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')
  .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80); }

const out = [];
for (const f of files) {
  const p = JSON.parse(readFileSync(join(SRC, f), 'utf8'));
  // Firecrawl puede envolver en { data: {...} } o { extract: {...} } o {...}
  const d = p.data?.extract || p.extract || p.data || p;
  const catText = [d.nombre, ...(d.categorias||[])].join(' ');
  const ocasiones = OCASION.filter(([re]) => re.test(catText)).map(([,v]) => v);
  out.push({
    handle: handleize(f.replace(/\.json$/,'')),
    nombre: (d.nombre||'').trim(),
    sku: (d.sku||'').toString().trim(),
    precio: (typeof d.precio_eur === 'number' && d.precio_eur > 0) ? d.precio_eur : null,
    publicado: (typeof d.precio_eur === 'number' && d.precio_eur > 0),  // N/D -> draft
    tipo: pick(TIPO, catText, 'Otro'),
    ocasiones: ocasiones.length ? ocasiones : ['Ceremonia'],
    tallas: (d.tallas||[]).map(t => t.toString().replace(/[^0-9]/g,'')).filter(Boolean),
    descripcion: (d.descripcion||'').trim(),
    imagenes: [...new Set((d.imagenes||[]).filter(u => /^https?:\/\//.test(u) && !/-\d+x\d+\./.test(u)))], // sin miniaturas
  });
}
mkdirSync('.', { recursive: true });
writeFileSync('productos.normalizado.json', JSON.stringify(out, null, 2));
const conPrecio = out.filter(o=>o.publicado).length;
console.log(`Productos: ${out.length} · con precio (activos): ${conPrecio} · sin precio (draft): ${out.length-conPrecio}`);
console.log('Sin tallas:', out.filter(o=>!o.tallas.length).length, '· Sin imágenes:', out.filter(o=>!o.imagenes.length).length);
```

- [ ] **Step 2: Ejecutar y verificar**

Run (desde `Online store/tienda online/import/`):
```bash
node normalize.mjs
node -e "const a=require('./productos.normalizado.json'); console.log(JSON.stringify(a[0],null,2))"
```
Expected: imprime conteos coherentes (total ≈ JSON extraídos) y un producto de muestra bien formado (nombre, tallas, imágenes, ocasiones, tipo). Si "Sin imágenes" o "Sin tallas" es alto, revisar el schema/extracción de la Task 2.

---

## Task 4: Generar el CSV de Shopify

**Files:**
- Create: `Online store/tienda online/import/to-shopify-csv.mjs`
- Create: `Online store/tienda online/import/productos-shopify.csv`

- [ ] **Step 1: Script CSV (formato nativo Shopify, una fila por variante)**

Create `import/to-shopify-csv.mjs`:
```javascript
import { readFileSync, writeFileSync } from 'node:fs';
const prods = JSON.parse(readFileSync('productos.normalizado.json','utf8'));

const COLS = [
  'Handle','Title','Body (HTML)','Vendor','Type','Tags','Published',
  'Option1 Name','Option1 Value','Variant SKU','Variant Inventory Tracker',
  'Variant Inventory Qty','Variant Inventory Policy','Variant Fulfillment Service',
  'Variant Price','Variant Requires Shipping','Variant Taxable',
  'Image Src','Image Position','Status',
  'Product Category',
  'Metafield: custom.tipo_pieza [single_line_text_field]',
  'Metafield: custom.ocasion [list.single_line_text_field]',
  'Metafield: b2b.price [number_decimal]'
];
const esc = v => { v = (v??'').toString(); return /[",\n]/.test(v) ? '"'+v.replace(/"/g,'""')+'"' : v; };
const rows = [COLS.join(',')];

for (const p of prods) {
  const tags = [...p.ocasiones, p.tipo].join(', ');
  const tallas = p.tallas.length ? p.tallas : [''];          // sin tallas -> variante única
  const status = p.publicado ? 'active' : 'draft';
  const ocasionList = JSON.stringify(p.ocasiones);            // metafield list -> JSON array
  tallas.forEach((talla, ti) => {
    const first = ti === 0;
    const row = {
      'Handle': p.handle,
      'Title': first ? p.nombre : '',
      'Body (HTML)': first ? p.descripcion : '',
      'Vendor': first ? 'Grupo Juana Sánchez' : '',
      'Type': first ? p.tipo : '',
      'Tags': first ? tags : '',
      'Published': first ? (p.publicado ? 'TRUE':'FALSE') : '',
      'Option1 Name': talla ? 'Talla' : 'Título',
      'Option1 Value': talla || 'Default Title',
      'Variant SKU': p.sku ? `${p.sku}-${talla||'U'}` : `${p.handle}-${talla||'U'}`,
      'Variant Inventory Tracker': 'shopify',
      'Variant Inventory Qty': '0',
      'Variant Inventory Policy': 'deny',
      'Variant Fulfillment Service': 'manual',
      'Variant Price': p.precio ?? '',
      'Variant Requires Shipping': 'TRUE',
      'Variant Taxable': 'TRUE',
      'Image Src': '', 'Image Position': '',
      'Status': first ? status : '',
      'Product Category': first ? 'Apparel & Accessories > Shoes' : '',
      'Metafield: custom.tipo_pieza [single_line_text_field]': first ? p.tipo : '',
      'Metafield: custom.ocasion [list.single_line_text_field]': first ? ocasionList : '',
      'Metafield: b2b.price [number_decimal]': '',
    };
    rows.push(COLS.map(c => esc(row[c])).join(','));
  });
  // filas extra solo-imagen (Shopify acepta filas con Handle + Image Src + Image Position)
  p.imagenes.forEach((img, ii) => {
    const row = Object.fromEntries(COLS.map(c => [c,'']));
    row['Handle'] = p.handle; row['Image Src'] = img; row['Image Position'] = (ii+1).toString();
    rows.push(COLS.map(c => esc(row[c])).join(','));
  });
}
writeFileSync('productos-shopify.csv', '﻿' + rows.join('\n'));   // BOM para acentos
console.log(`CSV escrito: ${rows.length-1} filas para ${prods.length} productos`);
```

- [ ] **Step 2: Generar y validar el CSV**

Run (desde `import/`):
```bash
node to-shopify-csv.mjs
head -3 productos-shopify.csv
echo "Filas:"; wc -l < productos-shopify.csv
node -e "const t=require('fs').readFileSync('productos-shopify.csv','utf8').split('\n'); const h=t[0].split(','); console.log('Columnas:', h.length); console.log('Primera col:', h[0]==='﻿Handle'||h[0]==='Handle')"
```
Expected: cabecera con las columnas definidas, BOM presente, nº de filas = (variantes + imágenes) de todos los productos. Abrir el CSV en un editor y comprobar que un producto multi-talla tiene la 1ª fila con Title/Tags/Status y filas siguientes solo con Handle+Option1 Value (variantes) e Handle+Image Src (imágenes).

---

## Task 5: Definir metafields y colecciones (preparación para Shopify)

**Files:**
- Create: `Online store/tienda online/import/shopify-setup.md`

- [ ] **Step 1: Documento de configuración Shopify**

Create `import/shopify-setup.md` con los pasos exactos para el admin (se ejecutan en Task 6):
```markdown
## Metafields a crear (Configuración → Metafields → Productos)
- custom.tipo_pieza · Texto de una línea
- custom.ocasion · Texto de una línea (lista)
- custom.color_familia · Texto de una línea   (marfil-novia | lavanda | rosa-empolvado | agua-menta)
- b2b.price · Decimal (precio neto B2B; vacío por ahora, se rellena en Fase 4)
- custom.badge · Texto de una línea (Nuevo | Limitada | Artesanía)

## Colecciones por ocasión (automáticas por tag)
- Comunión  (tag = Comunión)
- Bautizo   (tag = Bautizo)
- Arras     (tag = Arras)
- Ceremonia (tag = Ceremonia)
- Novias    (tag = Novias)
- Niñas y bebés (tag = Niñas y bebés)
Tipo: colección automática, condición "Tag es igual a <Ocasión>".

## Colección "Destacados" (para el grid de la Home, Plan 3)
- Manual; añadir ahí las piezas con mejores fotos studio (familias clasificadas en `fotos producto/`).
```

---

## Task 6: Carga en Shopify (ACCIÓN USUARIO) + verificación

**Files:** —

- [ ] **Step 1: ACCIÓN USUARIO — Crear metafields**
Indicar al usuario: crear los 5 metafields de `shopify-setup.md` en My Store 4 (Configuración → Metafields → Productos). (Si el MCP de Shopify queda autenticado, se pueden crear vía API.)

- [ ] **Step 2: ACCIÓN USUARIO — Importar el CSV**
Indicar: Productos → Importar → subir `import/productos-shopify.csv` → "Publicar productos nuevos" **desactivado** (respetar la columna Status; los N/D quedan draft). Confirmar el resumen de import (nº de productos creados).

- [ ] **Step 3: ACCIÓN USUARIO — Crear colecciones automáticas**
Indicar: crear las 6 colecciones automáticas por tag de `shopify-setup.md`.

- [ ] **Step 4: Verificación post-import**
Comprobar en el admin (o vía MCP si está): (a) nº de productos ≈ nº de JSON extraídos; (b) un producto multi-talla tiene sus variantes de talla; (c) las imágenes cargaron (Shopify descarga las URLs WP); (d) las colecciones por ocasión tienen piezas; (e) los productos sin precio están en `draft`. Capturas como evidencia.

---

## Self-Review

**1. Cobertura del spec (Workstream B):**
- Crawl `/producto/*` → Tasks 1–2. ✔
- Estructurar (nombre, SKU, categorías, tallas, precio, imágenes, descripción) → Task 2 (schema) + Task 3. ✔
- CSV Shopify con tallas=variantes, imágenes por URL, tags ocasión, metafields, Vendor=Grupo Juana Sánchez → Task 4. ✔
- Colecciones por ocasión + metafields (ocasión, tipo, color, b2b.price vacío, badge) → Tasks 5–6. ✔
- N/D → draft (decisión B-1) → Task 3 (`publicado`) + Task 4 (Status/Published). ✔
- Import + verificación → Task 6. ✔

**2. Placeholders:** Las "ACCIÓN USUARIO" de Task 6 no son placeholders: son pasos del admin de Shopify que requieren credenciales del usuario (documentados con exactitud). El flag exacto de extracción de Firecrawl (Task 2 Step 2) se resuelve con `--help` en ejecución; el objetivo y el schema están completos.

**3. Consistencia de nombres:** `productos.normalizado.json` se escribe en Task 3 y se lee en Task 4. Campos coherentes (`handle, nombre, sku, precio, publicado, tipo, ocasiones, tallas, descripcion, imagenes`). Metafields nombrados igual en Tasks 4, 5 y 6 (`custom.tipo_pieza`, `custom.ocasion`, `b2b.price`, `custom.color_familia`, `custom.badge`). Colecciones por tag = valores de `ocasiones`.

**4. Relación con las 38 fotos studio:** aclarada — imágenes de producto = URLs del crawl (Task 4); las 38 studio clasificadas son para hero/destacados (Plan 3) y la colección manual "Destacados" (Task 5). No se mezclan en el import automático.

---

## Execution Handoff

Plan 2 (Import del catálogo) completo y guardado en `docs/superpowers/plans/2026-05-27-fase-0-plan2-import-catalogo.md`.
