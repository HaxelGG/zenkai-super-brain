# Fase A — Corrección de marca y mejora del boceto · Tienda Juana Sánchez

> **Estado:** spec en revisión · **Fecha:** 2026-05-27
> **Sub-proyecto:** Fase A del roadmap de la tienda online.
> **Archivo único intervenido:** `Online store/tienda online/juana-sanchez-tienda-v2.html`

---

## 1. Contexto

`juana-sanchez-tienda-v2.html` es la **fuente de verdad del diseño** de la futura tienda: un
mockup editorial estático (~992 KB, ~2.480 líneas) con sistema de diseño completo (tokens,
5 familias tipográficas, easings), 9 secciones, modal de registro B2B, cursor custom y
animaciones por scroll.

El objetivo final del proyecto es un **tema custom de Shopify** (Liquid + CSS + JS) entregado
en `.zip`, con Supabase como espejo para el ERP. Antes de portar nada a Shopify, esta Fase A
**refina el boceto base** sobre el propio HTML, porque es CSS/JS puro y se itera mucho más
rápido en un archivo standalone que sobre una dev store. Todo lo que se mejore aquí se portará
1:1 a las secciones Liquid en la Fase 1.

### Decisión de arquitectura ya fijada (contexto, no alcance de esta fase)
Shopify headless-as-theme + frontend editorial propio como tema Shopify + Supabase compartido
con el panel-ERP (espejo por webhooks). B2B = catálogo único, zona oculta tras login, precio
neto en metafield, compra vía solicitud → ERP. Sin Shopify Plus.

---

## 2. Objetivo de la Fase A

Dejar el `v2.html` con:
1. La **información de marca correcta** (nombre, años, terminología B2B).
2. Un **cursor de polvo de estrellas dorado** que sustituya el punto actual.
3. El **hero preparado para vídeo cinematográfico** con placeholder claro para subirlo luego.
4. Una **barra de navegación superior rediseñada**: funcional, minimalista y editorial, muy por
   encima del boceto actual.

Criterio de éxito global: el archivo se abre en el navegador, se ve notablemente más pulido que
el actual, no hay regresiones visuales en el resto de secciones, y respeta `prefers-reduced-motion`.

---

## 3. Alcance

### Dentro
- Edición exclusiva de `juana-sanchez-tienda-v2.html` (HTML + `<style>` + `<script>` inline).
- Las cuatro mejoras de la sección 2.

### Fuera (no en esta fase)
- Cualquier código Shopify/Liquid, dev store, import de catálogo, metafields.
- Backend, Supabase, webhooks, pagos.
- Migración de imágenes base64 → CDN.
- Lógica funcional real del modal B2B (sigue siendo `alert()` de demo).
- Subir el vídeo real del hero (solo se deja el hueco preparado).

---

## 4. Requisitos detallados

### 4.1 Correcciones de copy y marca

| Cambio | Ubicación (líneas aprox.) | De | A |
|---|---|---|---|
| Marca (title) | L8 `<title>` | `Juana Sánchez · Atelier de Ceremonia · Hecho en España` | `Grupo Juana Sánchez · Hecho en España` |
| Marca (loader) | L1717 `.loader-mark` | `JUANA SÁNCHEZ` | `GRUPO JUANA SÁNCHEZ` |
| Marca (loader sub) | L1718 `.loader-sub` | `Atelier de Ceremonia · Hecho en España` | `Hecho en España` |
| Marca (header) | L1752-1753 `.brand` | `JUANA SÁNCHEZ` / `<small>Atelier de Ceremonia</small>` | `GRUPO JUANA SÁNCHEZ` / `<small>Hecho en España</small>` |
| Años (announce ×2) | L1727, L1732 | `+10 años de artesanía` | `+50 años de artesanía` |
| Años (manifiesto) | L1822 | `llevamos diez años poniéndoles` | `llevamos cincuenta años poniéndoles` |
| Años (contador) | L1831 | `data-count="10"` | `data-count="50"` |
| Terminología B2B | L1748 nav, L2138 footer label, L2191 footer link, L2223 modal sub, L2233/L2250-2251 modal copy | "Mayorista" / "mayorista" / "mayoristas" | "Área Empresarial" / "empresarial" (ver nota) |

**Nota terminología B2B:** sustituir el término *Mayorista* por **Área Empresarial** como nombre
de la zona/acceso. En frases donde "mayorista" es adjetivo de precio/catálogo ("precios mayoristas",
"catálogo mayorista", L2141-2142, L2233) usar **"precios para empresas" / "catálogo profesional"**
según lea mejor. La palabra **"boutique" se mantiene** (es el tipo de cliente, no la terminología
de la zona).

**Consistencia de antigüedad (RESUELTO):** con "+50 años", `EST. 2014` (L1804) → **`EST. 1975`**
(confirmado por el cliente, 2026-05-27). Revisar que no quede ninguna otra fecha fundacional
incoherente. El testimonio "llevo cuatro años con la..." (L2100) es de una clienta — **no se toca**.

### 4.2 Cursor — polvo de estrellas dorado

**Estado actual:** `.cursor-dot#cursor`, un punto que sigue al ratón con lerp (JS L2385-2398) y
crece a `.lg` sobre elementos interactivos.

**Objetivo:** mantener el punto guía sutil, pero que **emita una estela de partículas doradas**
(polvo de estrellas) que brillan y se desvanecen a medida que el cursor se mueve.

Requisitos:
- Partículas en tonos `--gold #B58E47`, `--gold-soft #D4B883` (y un blanco cálido puntual para el
  brillo). Tamaño pequeño (2–5 px), opacidad y escala decrecientes, vida ~500–900 ms.
- Emisión proporcional a la velocidad del cursor (más movimiento → más polvo); en reposo, emisión
  mínima o nula para no saturar.
- Implementación **GPU-friendly**: un único `<canvas>` a pantalla completa con `position: fixed`,
  `pointer-events: none`, `z-index` por encima del contenido y por debajo de modales; pool de
  partículas reutilizables (sin crear/destruir nodos DOM por partícula). Un solo bucle
  `requestAnimationFrame`.
- Conservar el comportamiento `.lg` (expansión sobre links/imágenes) del punto guía.
- **Rendimiento:** cap de partículas vivas (p.ej. ≤ 120) y de emisión por frame para no tirar el
  FPS. Objetivo: 60 fps en desktop medio.
- **Accesibilidad:** si `prefers-reduced-motion: reduce`, **desactivar la estela** (dejar solo el
  punto, o cursor nativo). En `max-width: 968px` el cursor custom ya está oculto (L108) — la estela
  también debe estar desactivada en móvil.

### 4.3 Hero — soporte de vídeo cinematográfico

**Estado actual (L1792-1802):** `.hero-visual` contiene un comentario-placeholder y un
`<div class="hero-video" style="background-image: url(data:image...)">` con imagen base64, más
`.hero-video-overlay` y `.hero-video-frame`.

Objetivo: dejar el hero **listo para un vídeo vertical cinematográfico** que inspire a comprar, con
el hueco preparado para subirlo más tarde.

Requisitos:
- Estructura `<video>` real, comentada/preparada y con **placeholder visible y claramente marcado**
  para que el cliente entienda dónde va el vídeo. Patrón:
  ```html
  <video class="hero-video" autoplay muted loop playsinline poster="POSTER.jpg" preload="metadata">
    <!-- SUBIR AQUÍ EL VÍDEO CINEMATOGRÁFICO (vertical 4:5, <2MB, sin sonido) -->
    <source src="hero-cinematic.webm" type="video/webm">
    <source src="hero-cinematic.mp4"  type="video/mp4">
  </video>
  ```
- Mientras no haya vídeo, mantener la **imagen base64 actual como poster/fallback** para que el
  archivo siga viéndose bien standalone, con un rótulo discreto tipo "Vídeo próximamente" o el
  comentario de instrucción bien visible en el código.
- Conservar `.hero-video-overlay` y el marco `REEL · 01 / 2026`.
- `autoplay` solo funciona `muted` → mantener `muted playsinline`. Respetar
  `prefers-reduced-motion`: con reduce, no autoplay (mostrar poster).
- No romper el aspect-ratio ni el layout del hero existente.

### 4.4 Navegación superior — rediseño editorial

**Estado actual (L1742-1749):** `.nav` con 6 enlaces ancla (`Colección`, `Comunión`, `Bautizo`,
`Ceremonia`, `Atelier`, `Mayorista`); los tres de ocasión apuntan todos a `#ocasiones`. Brand
centrado, acciones (Buscar/Cuenta/Carrito) a la derecha. Encima, una `.announce` con marquesina.

Objetivo: navegación **funcional, minimalista y editorial**, claramente mejor que el boceto.

Requisitos:
- **Jerarquía limpia**: links en Jost (`--f-sans`), tracking generoso, peso ligero; subrayado
  inferior **animado al hover** (línea que crece de 0→100% con `--ease-out`), coherente con el
  lenguaje del resto del sitio.
- **Mega-menú editorial** para los apartados con sub-navegación:
  - *Colección* → desplegable con las piezas/categorías destacadas + (opcional) una imagen editorial
    de apoyo.
  - *Ocasiones* (agrupar Comunión / Bautizo / Ceremonia bajo un único punto de entrada, en vez de
    tres enlaces que van al mismo sitio) → desplegable con las 4 ocasiones.
  - El mega-menú aparece con fade + leve `translateY`, fondo `--paper`/`--bone`, respetando tokens.
- **Minimalismo**: reducir ruido visual; la barra debe sentirse aireada y de lujo accesible.
  Mantener marca centrada y acciones a la derecha (o reorganizar si mejora la limpieza, sin perder
  el logo siempre visible —mandato del brief—).
- **"Área Empresarial"** sustituye a "Mayorista" como acceso, manteniéndolo discreto pero visible.
- **Barra announce**: mantenerla minimalista (puede simplificarse el contenido), coherente con el
  nuevo nav. Texto ya corregido (+50 años).
- **Responsive**: en móvil se conserva el `menu-trigger` (hamburguesa, L1750); el mega-menú colapsa
  a un patrón móvil usable. No romper el `padding-bottom: 64px` / barra inferior móvil existente.
- **Sticky**: el header sigue fijo en scroll (comportamiento `#header` actual) con el logo siempre
  presente.
- **Accesibilidad**: mega-menús navegables por teclado (focus, `aria-expanded`), `prefers-reduced-motion`
  respetado en las transiciones.

---

## 5. Restricciones de marca (del brief, aplican siempre)
- Nunca negro puro como fondo; el oscuro es `--ink #1A1612`.
- Solo el sistema tipográfico (Fraunces / Cormorant / Italiana / Jost / JetBrains Mono).
- Logo/marca siempre visible en el header, incluso en scroll.
- "Hecho en España" visible en varios touchpoints.
- Animaciones respetan `prefers-reduced-motion: reduce`.
- No sacrificar rendimiento por las animaciones.

---

## 6. Verificación

Tras los cambios, abrir el HTML en el preview del navegador y comprobar:
1. **Copy/marca:** title, loader, header, announce, contador (anima a 50), modal y footer muestran
   los textos nuevos; no queda ningún "Mayorista" ni "10 años" residual (grep de control).
2. **Cursor:** la estela dorada se emite al mover el ratón, brilla y se desvanece, no baja de
   ~60 fps, y desaparece con `prefers-reduced-motion` y en móvil.
3. **Hero:** la estructura de vídeo está lista y el placeholder es evidente; el hero se sigue viendo
   correctamente con el poster/fallback; sin saltos de layout.
4. **Nav:** los hover y mega-menús funcionan, el diseño es claramente más editorial y limpio, y el
   responsive no se rompe.
5. **Sin regresiones:** el resto de secciones (manifiesto, colección, proceso, ocasiones, testimonios,
   newsletter, footer) se ven igual o mejor.

Capturas antes/después como evidencia.

---

## 7. Riesgos y decisiones abiertas
- **Antigüedad/consistencia (resuelto):** `EST. 2014 → EST. 1975` (confirmado). Verificar que no
  quede otra fecha fundacional incoherente con "+50 años".
- **Coste del cursor:** el efecto de partículas debe quedar elegante y discreto (lujo, no videojuego).
  Si en revisión resulta excesivo, se reduce densidad/vida de las partículas.
- **Base64 pesado:** el archivo ya es grande (~992 KB). Esta fase no lo agrava; la migración a CDN
  es tarea de fases posteriores.
- **Portabilidad a Shopify:** todo el JS/CSS de esta fase debe escribirse pensando en moverlo luego
  a `assets/` del tema (cursor.js, animations.js) sin reescritura — evitar dependencias del DOM
  específicas que no existan en Liquid.
