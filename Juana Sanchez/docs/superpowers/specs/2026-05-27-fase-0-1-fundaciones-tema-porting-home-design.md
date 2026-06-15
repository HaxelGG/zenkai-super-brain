# Fase 0 + 1 — Fundaciones del tema Shopify + Porting de la Home

> **Estado:** spec en revisión · **Fecha:** 2026-05-27
> **Sub-proyecto:** Fase 0 (fundaciones + import catálogo) + Fase 1 (porting Home) del roadmap de la tienda.
> **Spec previa:** `2026-05-27-fase-a-correccion-marca-mejora-boceto-design.md` (Fase A, completada).

---

## 1. Contexto y decisiones fijadas

La tienda se entrega como **tema custom de Shopify** (Liquid + CSS + JS). El diseño ya existe y está refinado en `Online store/tienda online/juana-sanchez-tienda-v2.html` (Fase A hecha). El catálogo real vive hoy en WooCommerce (`juanasanchez.es`) y está mapeado en `Online store/tienda online/CATALOGO-INTEL.md`.

**Decisiones cerradas (2026-05-27):**
| Tema | Decisión |
|---|---|
| Tienda de desarrollo | **My Store 4** (`uasepn-7j`), protegida con contraseña |
| Sincronización del tema | **GitHub sync** (repo ↔ Shopify, auto-sync en cada push) |
| Base del tema | **Skeleton custom OS 2.0 desde cero**; patrones de Dawn solo para plantillas de plumbing (carrito, cuenta, 404, búsqueda) |
| Import del catálogo | **Ahora** (Firecrawl crawl `/producto/*` → CSV Shopify) |
| Nombre zona B2B | **"Área Empresarial"** |
| Envío gratis | **300 €** (corrige el "70 €" del mockup) |
| Plan Shopify | Basic/Advanced (sin Plus) |

**Arquitectura global ya fijada:** Shopify motor de comercio; tema custom front; Supabase (del panel-ERP) como espejo por webhooks (workstream paralelo, fuera de esta fase). B2B = catálogo único + zona oculta tras login + precio neto en metafield + solicitud de pedido → ERP.

---

## 2. Objetivo

Al cerrar esta fase tendremos:
1. Un **repo de tema Shopify** OS 2.0 conectado por GitHub a My Store 4, con la estructura, los tokens de diseño y las fuentes del `v2.html` portados a `assets/`.
2. El **catálogo real importado** a Shopify (productos, tallas como variantes, imágenes por URL, categorías → colecciones, metafields de clasificación).
3. La **Home portada** a secciones Liquid configurables (las 9 secciones del `v2.html`, ya mejoradas en Fase A), renderizando datos reales de Shopify donde corresponde, con animaciones y cursor estelar.

**Criterio de éxito:** subir el tema a My Store 4 (vía GitHub), abrir la preview y ver la Home editorial idéntica al `v2.html` pero alimentada por el catálogo real, editable desde el editor de temas, sin errores de Liquid ni de consola, Lighthouse mobile ≥ 90.

---

## 3. Alcance

### Dentro
- Repo + estructura de tema OS 2.0 + GitHub sync a My Store 4.
- Tokens, fuentes, `cursor.js` (estela dorada) y `animations.js` portados desde `v2.html`.
- Crawl del catálogo con Firecrawl → CSV de import de Shopify → metafields + colecciones.
- Las 9 secciones de la Home como secciones Liquid + `templates/index.json`.
- Layout global mínimo necesario para que la Home funcione: `layout/theme.liquid`, `header`, `footer`, `announce`, drawer de carrito básico.
- Plantillas de plumbing mínimas (carrito, cuenta, 404, búsqueda) basadas en patrones de Dawn, sin estilizar a fondo (se pulen en fases posteriores).

### Fuera (fases posteriores)
- Ficha de producto y plantilla de colección a fondo (Fase 2).
- Checkout (nativo Shopify), newsletter con cupón, cuenta cliente a fondo (Fases 2–3).
- Zona "Área Empresarial" / B2B (Fase 4).
- Webhooks Shopify → Supabase (workstream ⟂, lado ERP).
- Blog/Noticias (Fase 6).
- Multi-idioma / Markets (Fase 5).

---

## 4. Arquitectura del tema (estructura de archivos)

Repo nuevo: **`juana-sanchez-tienda`** (working dir local: `Online store/tienda online/theme/`). Estructura OS 2.0:

```
theme/
├── assets/
│   ├── juana-sanchez.css        ← tokens (:root) + estilos de las 9 secciones, portados del v2.html
│   ├── cursor.js                ← cursor + estela de polvo de estrellas (de Fase A)
│   ├── animations.js            ← IntersectionObserver reveals + contador + parallax (del v2.html)
│   └── (fuentes vía Google Fonts <link> en theme.liquid, igual que v2.html)
├── config/
│   ├── settings_schema.json     ← ajustes globales del tema (colores, claims, redes, teléfonos)
│   └── settings_data.json
├── layout/
│   └── theme.liquid             ← <head> (fuentes, meta, JSON-LD base), loader, cursor, canvas, header, footer, scripts
├── locales/
│   └── es.default.json          ← strings es-ES
├── sections/
│   ├── header.liquid            ← nav editorial + mega-menús + overlay móvil (de Fase A)
│   ├── announce-bar.liquid      ← barra superior (envío 300€, +50 años…)
│   ├── hero.liquid              ← hero con vídeo cinematográfico (ajuste de vídeo + poster)
│   ├── manifest.liquid          ← "Más de cinco décadas / perfeccionando el arte." + contador 50
│   ├── featured-collection.liquid ← grid editorial con productos REALES de Shopify
│   ├── proceso.liquid           ← storytelling con vídeo
│   ├── ocasiones.liquid         ← bloques de ocasión → links a colecciones
│   ├── testimonios.liquid       ← prueba social
│   ├── newsletter.liquid        ← captura email (form nativo)
│   └── footer.liquid            ← footer editorial + link discreto a "Área Empresarial"
├── snippets/
│   ├── product-card.liquid      ← card de producto (reutilizable)
│   ├── icon-*.liquid            ← iconos SVG del v2.html
│   └── meta-tags.liquid         ← SEO/OG básico
├── templates/
│   ├── index.json               ← orden y settings de las secciones de la Home
│   ├── cart.json + sections/main-cart-*.liquid     ← plumbing (patrón Dawn, sin estilizar a fondo)
│   ├── customers/* + 404 + search ← plumbing mínimo
└── .github/workflows/ (opcional) ← lint Theme Check en cada push
```

**Principio:** cada sección Liquid es una unidad aislada con su `{% schema %}` (settings editables) y su responsabilidad única; los estilos compartidos viven en `juana-sanchez.css`. Nada de datos hardcodeados donde Shopify ya los provee (productos, colecciones).

---

## 5. Workstream A — Fundaciones del tema

1. **Repo + GitHub sync:** crear repo `juana-sanchez-tienda` (rama `main`), scaffold OS 2.0 mínimo, conectar Shopify → "Conectar desde GitHub" sobre My Store 4 (tema sin publicar).
2. **Tokens y assets:** extraer el bloque `:root` del `v2.html` (paleta mauve/sage/gold/cream, líneas, fuentes, easings, maxw/pad) a `assets/juana-sanchez.css`. Portar `cursor.js` (estela dorada de Fase A) y `animations.js` (reveals/contador/parallax) a `assets/`.
3. **Fuentes:** mismo `<link>` de Google Fonts que el v2 (Fraunces, Cormorant Garamond, Italiana, Jost, JetBrains Mono) en `theme.liquid` con `display=swap`.
4. **`settings_schema.json`:** exponer en el editor de temas: claims ("Hecho en España", "+50 años", "EST. 1975"), umbral de envío gratis (default **300 €**), teléfonos (+34 968 70 57 22 · +34 680 12 83 05), redes, y el vídeo/poster del hero.
5. **Theme Check** local para validar Liquid.

**Hecho cuando:** el tema vacío (con layout, header, footer, tokens) sube por GitHub a My Store 4 y la preview carga sin errores de Theme Check.

## 6. Workstream B — Import del catálogo

1. **Crawl:** Firecrawl crawl de `https://www.juanasanchez.es/producto/*` (límite alto; el sitio tiene ~150–300 productos). Guardar markdown/JSON en `.firecrawl/catalogo/`.
2. **Estructurar:** por producto extraer: nombre, SKU, categorías (Comunión y arras / Niñas y bebés / Madrinas / Novias / Conjuntos / Ofertas + subcategoría), tallas (variantes EU 20–41), precio (o "N/D" → sin precio público), URLs de imágenes (`wp-content/uploads/...`), descripción.
3. **Mapear a CSV de Shopify** (formato nativo `products.csv`): columnas Handle, Title, Body, Vendor=Grupo Juana Sánchez, Type (tipo de pieza: esparteña/corona/diadema/…), Tags (ocasión, tipo), Option1 Name=Talla, Option1 Value (cada talla), Variant SKU, Variant Price, Image Src (URL real), Image Position.
4. **Colecciones:** crear colecciones por **ocasión** (Comunión, Bautizo/Arras, Ceremonia, Novias, Niñas y bebés) y, si conviene, *smart collections* por tipo de pieza vía tag.
5. **Metafields** (definir en Shopify): `custom.ocasion` (lista), `custom.tipo_pieza`, `custom.color`, `b2b.price` (precio neto, vacío de momento), `custom.badge` (Nuevo/Limitada/Artesanía).
6. **Import:** subir el CSV en Shopify (Productos → Importar). Verificar recuento, variantes e imágenes.

**Decisión B-1 (RESUELTA):** productos con precio **"N/D"** se **importan como borrador** (estado `draft`/oculto) hasta asignarles precio. No se pierden y no se venden sin precio. Marcar en el CSV `Published=FALSE` / `Status=draft`.

**Hecho cuando:** los productos reales aparecen en My Store 4 con tallas, imágenes y colecciones por ocasión, y al menos una colección "destacada" tiene piezas para alimentar la Home.

## 7. Workstream C — Porting de la Home

Portar 1:1 las 9 secciones del `v2.html` (ya mejoradas en Fase A) a secciones Liquid con `{% schema %}` (todo editable):

| Sección v2.html | Sección Liquid | Datos dinámicos |
|---|---|---|
| header + nav + mega-menús + móvil | `header.liquid` | menús desde `linklists` de Shopify |
| announce (envío **300€**, +50 años…) | `announce-bar.liquid` | textos como settings |
| hero (vídeo + poster) | `hero.liquid` | vídeo/poster/CTA como settings |
| manifest ("Más de cinco décadas…") | `manifest.liquid` | textos + nº contador como settings |
| collection (grid 6 piezas) | `featured-collection.liquid` | **colección real** (collection picker) vía `snippets/product-card.liquid` |
| proceso (vídeo) | `proceso.liquid` | vídeo + stats como settings |
| ocasiones | `ocasiones.liquid` | bloques → URLs de colección |
| testimonios | `testimonios.liquid` | bloques repetibles |
| newsletter | `newsletter.liquid` | `form 'customer'` nativo |
| footer (+ link Área Empresarial) | `footer.liquid` | linklists + settings |

- `templates/index.json` define el orden y los settings por defecto.
- `cursor.js` + `animations.js` se cargan desde `theme.liquid`; respetan `prefers-reduced-motion`.
- El grid usa productos reales: precios y enlaces salen de Shopify; la card mantiene el diseño editorial (zoom hover, "Vista rápida", badge).

**Hecho cuando:** la Home en la preview de My Store 4 reproduce el `v2.html` (visual + animaciones + cursor) con el grid alimentado por el catálogo real, editable en el editor de temas, sin errores.

---

## 8. Restricciones de marca (del brief, siempre)
- Fondo oscuro = `--ink #1A1612` (nunca negro puro). Solo el sistema tipográfico de la marca. Logo siempre visible en header. "Hecho en España" en varios touchpoints. `prefers-reduced-motion` respetado. Lighthouse mobile ≥ 90.

## 9. Verificación
- **Theme Check** sin errores en cada push.
- **Preview en My Store 4** (vía GitHub sync): Home idéntica al v2, grid con productos reales, mega-menús/cursor/animaciones OK, sin errores de consola.
- **Import:** recuento de productos/variantes/imágenes coincide con lo crawleado; colecciones por ocasión pobladas.
- **Lighthouse mobile ≥ 90** en la Home.
- Capturas antes/después como evidencia.

## 10. Riesgos y decisiones abiertas
- **(B-1 resuelto)** Productos "N/D" sin precio → importar como borrador (`Status=draft`).
- **Imágenes:** Shopify descarga por URL; si alguna `wp-content` falla, reintentar o subir manual.
- **GitHub sync + dos terminales:** el panel-ERP ya tiene regla de integrar por `main`; este repo de tema es independiente, sin conflicto.
- **Peso/perf:** el v2.html standalone es pesado por base64; en el tema las imágenes son del CDN de Shopify → mejora automática. Vigilar JS del cursor (ya capado a 120 partículas).
- **Crawl incompleto:** si Firecrawl no captura los ~300, iterar con `firecrawl map` + crawl por categoría.

## 11. Nota de descomposición (para writing-plans)
Esta fase se implementa en **3 planes independientes** que producen software/datos testables por separado:
- **Plan 1 — Fundaciones del tema** (Workstream A): repo, scaffold OS 2.0, tokens/assets, GitHub sync, settings_schema. Entregable: tema vacío en preview.
- **Plan 2 — Import del catálogo** (Workstream B): crawl Firecrawl → CSV → metafields/colecciones → import. Entregable: catálogo en Shopify. *(Independiente del tema; puede ir en paralelo.)*
- **Plan 3 — Porting de la Home** (Workstream C): 9 secciones Liquid + index.json + assets JS. Depende del Plan 1 (skeleton) y se beneficia del Plan 2 (datos reales).

Orden recomendado: Plan 1 y Plan 2 en paralelo → Plan 3.
