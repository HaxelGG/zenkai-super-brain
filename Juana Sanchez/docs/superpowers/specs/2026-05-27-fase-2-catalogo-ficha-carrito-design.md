# Fase 2 — Catálogo + Ficha de producto + Carrito

> **Estado:** spec en revisión · **Fecha:** 2026-05-27
> **Sub-proyecto:** Fase 2 del roadmap de la tienda (tras Fase A, Plan 1 Fundaciones, Plan 3 Home; Plan 2 Import validado).

---

## 1. Contexto

El tema Shopify (repo `Online store/tienda online/theme/`) ya tiene fundaciones, chrome global y la Home portada (`shopify theme check` = 0 errores). Falta lo que hace la tienda **comprable**: navegar la colección, ver la ficha de un producto y un carrito.

**Clave:** el mockup `v2.html` es una landing de una sola página — **NO existe diseño de colección, ficha ni carrito**. Esta fase es **diseño nuevo** en el lenguaje editorial ya establecido (tokens, tipografías y clases base de `assets/juana-sanchez.css`), reutilizando el snippet `product-card` y los patrones visuales del v2 (section-head, .reveal, btn-link, etc.). Implica **CSS nuevo** para estas tres vistas, escrito con los design tokens de la marca.

**Decisiones fijadas (2026-05-27):**
| Tema | Decisión |
|---|---|
| Alcance | Colección + Ficha + Carrito (un sub-proyecto) |
| Carrito | **Drawer lateral** (abre al añadir) + página `/cart` |
| Colección | **Filtros nativos Shopify** por ocasión + color + talla + orden |
| Galería ficha | Imagen grande + miniaturas verticales + zoom hover |
| Ficha extras | Tallas en botones (agotadas tachadas) · Guía de tallas (modal) · "Completa el look" (relacionados) · Sticky add-to-cart móvil |
| Reseñas | Fuera de esta fase (más adelante) |
| Checkout | Shopify alojado (pagos/IVA/PCI) — no se construye |

---

## 2. Objetivo

Al cerrar la fase, un cliente puede: entrar a una colección, filtrar/ordenar, abrir una ficha, elegir talla, añadir al carrito (drawer), ajustar cantidades y pasar al checkout de Shopify — todo en el lenguaje editorial de la marca, sin errores de Theme Check, Lighthouse mobile ≥ 90.

**Criterio de éxito:** en la preview de My Store 4 con catálogo importado, las tres vistas funcionan end-to-end (colección filtrable → ficha con talla → drawer → checkout) y se ven coherentes con la Home.

---

## 3. Alcance

### Dentro
- **Plantilla de colección**: grid (reusa `product-card`), filtros nativos (ocasión/color/talla) + orden, cabecera editorial, paginación, estados vacíos.
- **Ficha de producto**: galería (grande+miniaturas+zoom), info, selector de talla en botones (stock por variante), add-to-cart AJAX→drawer, descripción, guía de tallas (modal), "Completa el look" (relacionados), sticky add-to-cart móvil, JSON-LD Product.
- **Carrito**: drawer lateral (líneas, ± cantidades AJAX, subtotal, barra progreso envío gratis 300€, CTA checkout) + página `/cart` completa.
- **JS nuevo**: `cart.js` (Cart AJAX API), `product.js` (galería/talla/sticky), filtros (nativos Shopify + JS mínimo para el drawer de filtros móvil).
- **CSS nuevo** en `assets/juana-sanchez.css` (o `assets/juana-sanchez-shop.css` separado) para colección/ficha/carrito, con los tokens de marca.
- Doc de **setup de facetas** (Search & Discovery) para el admin.

### Fuera (otras fases)
- Reseñas de producto (fase posterior).
- Newsletter avanzada / cuenta de cliente a fondo (Fase 3).
- Área Empresarial / B2B (Fase 4).
- SEO global, legal/RGPD, multi-idioma (Fase 5).
- Construir el checkout (es de Shopify).
- Lógica de cupón 10% (Fase 3).

---

## 4. Arquitectura (estructura de archivos)

```
theme/
├── templates/
│   ├── collection.json        ← usa main-collection
│   ├── product.json           ← usa main-product
│   └── cart.json              ← usa main-cart
├── sections/
│   ├── main-collection.liquid ← cabecera + filtros + grid + paginación
│   ├── main-product.liquid     ← galería + info + talla + add-to-cart + extras
│   ├── main-cart.liquid        ← página de carrito completa
│   └── cart-drawer.liquid      ← drawer (render en theme.liquid)
├── snippets/
│   ├── product-card.liquid     ← (existe) reutilizado en grid y "completa el look"
│   ├── collection-filters.liquid ← facetas (collection.filters) + orden
│   ├── size-guide.liquid       ← modal tabla de tallas EU↔edad/cm
│   └── price.liquid            ← formato de precio consistente (reutilizable)
├── assets/
│   ├── juana-sanchez.css        ← (existe) + estilos nuevos de shop (o fichero aparte)
│   ├── cart.js                  ← Cart AJAX API (add/change/remove/render drawer)
│   └── product.js               ← galería (thumb↔main, zoom), selector talla, sticky bar
└── layout/theme.liquid          ← (modificar) añadir {% render 'cart-drawer' %} + product.js/cart.js
```

**Unidades con responsabilidad única:** cada sección/snippet hace una cosa; `cart.js` encapsula toda la interacción con el carrito; `product.js` solo la ficha; `collection-filters` solo facetas. `product-card` y `price` se comparten.

---

## 5. Detalle por pieza

### 5.1 Colección (`main-collection.liquid` + `collection-filters.liquid`)
- **Grid** reusando `product-card`; cabecera con `collection.title` + `collection.description` en estilo editorial (section-label/section-title).
- **Filtros nativos**: iterar `collection.filters` (Shopify) → facetas por **ocasión** (`custom.ocasion`), **color** (`custom.color_familia`), **talla** (opción variante "Talla") y **precio**; **orden** vía `collection.sort_options` (novedad, precio asc/desc). En desktop barra/aside; en móvil **drawer de filtros** (JS mínimo abrir/cerrar). Form GET que recarga con `?filter.*` (patrón nativo, sin estado custom).
- **Paginación** (`paginate`, 24/pág). **Estado vacío** ("sin resultados para estos filtros").
- *Setup admin:* activar las facetas en la app **Search & Discovery** (ocasión, color, talla, precio). Documentado en `import/shopify-setup.md` (ampliar).

### 5.2 Ficha (`main-product.liquid` + `size-guide.liquid` + `product.js`)
- **Galería**: imagen principal grande + miniaturas verticales (`product.images`); click cambia principal; **zoom al hover** (desktop). Usa `image_url` (CDN Shopify, responsive `srcset`).
- **Info**: `product.title`, precio (snippet `price`), `product.description`.
- **Selector de talla en botones**: una "pastilla" por variante (opción "Talla"); las variantes con `inventory_quantity <= 0` y `inventory_policy = deny` se muestran **deshabilitadas/tachadas**. Selección actualiza la variante activa (JS) y el precio/disponibilidad.
- **Add-to-cart**: POST AJAX a `/cart/add.js` → al éxito **abre el drawer** con la línea añadida (sin recargar). Si no hay talla elegida, deshabilitado con aviso.
- **Guía de tallas**: enlace que abre `size-guide.liquid` (modal con tabla EU 20–41 ↔ edad/cm; reduce devoluciones).
- **"Completa el look"**: sección de relacionados (`product.collections` o `recommendations` de Shopify) reusando `product-card`.
- **Sticky add-to-cart móvil**: barra inferior fija con precio + talla + añadir.
- **SEO**: JSON-LD `Product` (nombre, imágenes, precio, disponibilidad, marca "Grupo Juana Sánchez").

### 5.3 Carrito (`cart-drawer.liquid` + `main-cart.liquid` + `cart.js`)
- **Drawer**: panel lateral deslizante (mismo lenguaje que el modal Área Empresarial); líneas con miniatura/nombre/talla/precio, **± cantidad** (AJAX `/cart/change.js`), eliminar, **subtotal**, **barra de progreso "Envío gratis desde {{ settings.free_shipping_threshold }}€"**, y **CTA "Finalizar compra"** → `/checkout`. Abre al añadir y desde el icono de carrito del header.
- **Página `/cart`** (`main-cart.liquid`): versión completa equivalente (para quien prefiera página), con las mismas acciones.
- **`cart.js`**: encapsula add/change/remove + render del drawer (re-render desde `/cart.js` o secciones con la Section Rendering API). Actualiza el badge del header (`cart.item_count`).

---

## 6. Restricciones de marca (siempre)
- Tokens y tipografías de la marca; nada de negro puro (oscuro = `--ink`). Logo siempre visible. "Hecho en España" presente. `prefers-reduced-motion` respetado. Lighthouse mobile ≥ 90 (lazy-load imágenes no-fold, `srcset`, JS diferido).

## 7. Verificación
- **Theme check** 0 errores por tarea.
- **Preview en My Store 4** (con catálogo importado): colección filtra por ocasión/color/talla y ordena; ficha permite elegir talla (agotadas tachadas) y añadir → drawer; ± cantidades y subtotal correctos; CTA lleva al checkout de Shopify; sticky bar en móvil; JSON-LD válido (Rich Results test).
- **Lighthouse mobile ≥ 90** en colección y ficha.
- Capturas antes/después.

## 8. Riesgos y decisiones abiertas
- **Filtros nativos requieren la app Search & Discovery** + metafields del import (Plan 2). Si el catálogo aún no está importado, los filtros se prueban con datos de muestra. **(Dependencia: Plan 2 ejecutado.)**
- **Section Rendering API** para re-render del drawer: si se complica, fallback a re-render desde `/cart.js` + plantilla JS.
- **Stock (D-1 RESUELTO):** el import puso `Variant Inventory Qty = 0`. Decisión: **ignorar stock por ahora** — la sección de ficha lleva un setting `mostrar_todas_tallas` (por defecto **ON**) que muestra todas las tallas como disponibles mientras no haya inventario real; al cargar stock se desactiva y entonces las variantes con 0 (y policy `deny`) salen tachadas/deshabilitadas. El selector de talla debe respetar ese setting.
- **Precio "N/D" (draft)**: esos productos no se listan (draft) → no afectan a la ficha pública.

## 9. Nota de descomposición (para writing-plans)
Se implementa en **3 planes** independientes y testables:
- **Plan 4 — Colección + filtros** (template, grid, facetas nativas, orden, paginación, CSS).
- **Plan 5 — Ficha de producto** (galería, talla/stock, add-to-cart AJAX, guía tallas, completa el look, sticky, JSON-LD).
- **Plan 6 — Carrito** (drawer + página + `cart.js` + badge header + barra envío gratis).
Orden: Plan 6 (carrito) y Plan 5 (ficha) están acoplados por el add-to-cart→drawer; recomendado **Plan 6 drawer base → Plan 5 ficha (engancha el add) → Plan 4 colección**. (Ajustable.)
