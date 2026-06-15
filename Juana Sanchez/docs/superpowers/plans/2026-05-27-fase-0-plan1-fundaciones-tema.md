# Fase 0 · Plan 1 — Fundaciones del tema Shopify (Workstream A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear el repo del tema Shopify OS 2.0 (`juana-sanchez-tienda`) basado en el Skeleton Theme oficial, con los tokens/fuentes/JS del `v2.html` portados a `assets/`, el chrome global (announce, header editorial con mega-menús, footer, modal "Área Empresarial") portado, ajustes de tema, y sincronización GitHub → My Store 4.

**Architecture:** Tema OS 2.0 estándar. Base = Shopify Skeleton Theme (trae todas las plantillas requeridas stubbeadas → tema válido y subible desde el primer commit). Encima portamos el CSS completo del `v2.html` a un único `assets/juana-sanchez.css`, el JS a `assets/cursor.js` + `assets/animations.js`, y el chrome global a secciones Liquid. Entrega vía GitHub sync (repo ↔ Shopify), tema sin publicar sobre My Store 4. Verificación: `shopify theme check` (lint, offline) + preview en Shopify.

**Tech Stack:** Shopify CLI, Liquid, CSS (custom properties del v2), JS vanilla (Canvas 2D, IntersectionObserver), Git + GitHub, Shopify GitHub integration.

**Fuente de diseño:** `Online store/tienda online/juana-sanchez-tienda-v2.html` (CSS en `<style>` L12–1819; JS en `<script>` L2548–2737; markup por marcadores de comentario `<!-- ANNOUNCEMENT BAR -->`, `<!-- HEADER -->`, `<!-- MENÚ MÓVIL -->`, `<!-- FOOTER -->`, `<div class="modal" id="modal">`).
**Spec:** `docs/superpowers/specs/2026-05-27-fase-0-1-fundaciones-tema-porting-home-design.md`
**Repo/working dir del tema:** `Online store/tienda online/theme/`

---

## Notas de ejecución
- **Esto SÍ es un repo git** (el tema): se hace `git init` y hay commits por tarea.
- **Verificación:** no hay tests unitarios. Cada tarea cierra con `shopify theme check` (debe pasar sin *errores*; los *warnings* de plantillas vacías del Skeleton son aceptables) y/o comprobación de estructura. La preview visual real la valida el usuario tras el GitHub sync (Tareas con **ACCIÓN USUARIO**).
- **Portar bloques grandes** (CSS/JS/markup) = copiar el bloque exacto del `v2.html` indicado. No reescribir a mano.
- Comandos desde `Online store/tienda online/theme/` salvo que se indique otra ruta.

---

## Task 1: Scaffold del tema desde Skeleton Theme + git

**Files:**
- Create: `Online store/tienda online/theme/` (árbol del tema)
- Create: `Online store/tienda online/theme/.gitignore`

- [ ] **Step 1: Verificar/instalar Shopify CLI**

Run:
```bash
shopify version || npm install -g @shopify/cli@latest
shopify version
```
Expected: imprime una versión (p.ej. `3.x`).

- [ ] **Step 2: Clonar el Skeleton Theme como base**

Run (desde `Online store/tienda online/`):
```bash
git clone --depth 1 https://github.com/Shopify/skeleton-theme.git theme
cd theme && rm -rf .git
```
Expected: estructura OS 2.0 con `assets/ config/ layout/ locales/ sections/ snippets/ templates/`.

- [ ] **Step 3: Inicializar git propio del tema**

Run (desde `theme/`):
```bash
git init && git add -A && git commit -m "chore: scaffold from Shopify skeleton-theme"
```
Expected: commit inicial creado.

- [ ] **Step 4: .gitignore**

Create `theme/.gitignore`:
```
node_modules/
.shopify/
*.log
.DS_Store
```

- [ ] **Step 5: Verificar Theme Check**

Run:
```bash
shopify theme check 2>&1 | tail -20
```
Expected: corre sin *errores* fatales (warnings del skeleton OK). Si `theme check` no está, viene con la CLI.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "chore: add gitignore"
```

---

## Task 2: Portar el stylesheet completo → assets/juana-sanchez.css

**Files:**
- Create: `theme/assets/juana-sanchez.css`

- [ ] **Step 1: Copiar el CSS del v2**

Copiar **todo el contenido entre `<style>` y `</style>`** del `v2.html` (líneas 13–1818, es decir, SIN las etiquetas `<style>`/`</style>`) a `theme/assets/juana-sanchez.css`. Empieza por el bloque `:root` (tokens) y termina en las últimas reglas (`.reveal` y media queries).

Sanity-check: el archivo debe empezar con:
```css
:root {
  --cream:        #F4EFE6;
  --cream-warm:   #EBE1CD;
  /* ... resto de tokens, fuentes, easings ... */
  --f-display:    'Fraunces', Georgia, serif;
  --f-sans:       'Jost', system-ui, sans-serif;
  ...
}
```

- [ ] **Step 2: Verificar tamaño y tokens**

Run (desde `theme/`):
```bash
grep -c -- "--mauve\|--gold\|--ink\|--f-display" assets/juana-sanchez.css
grep -c "@media" assets/juana-sanchez.css
```
Expected: varias coincidencias de tokens y media queries (no vacío).

- [ ] **Step 3: Commit**

```bash
git add assets/juana-sanchez.css && git commit -m "feat: port full stylesheet from v2 mockup to theme asset"
```

---

## Task 3: Portar el JS → assets/cursor.js + assets/animations.js

**Files:**
- Create: `theme/assets/cursor.js`
- Create: `theme/assets/animations.js`

- [ ] **Step 1: cursor.js**

Copiar a `theme/assets/cursor.js` el bloque **"CURSOR + STARDUST"** del `v2.html` (líneas 2554–2635): desde `// CURSOR + STARDUST (polvo de estrellas dorado)` hasta el cierre del bloque `if (sd && isDesktop && !reduceMotion) { ... loopStardust(); }` (la llave `}` de la línea 2635 inclusive).

- [ ] **Step 2: animations.js**

Copiar a `theme/assets/animations.js` **el resto del `<script>`**: LOADER (2549–2552), HEADER SCROLL (2637–2644), REVEAL (2646–2650), COUNTER (2652–2674), PARALLAX HERO (2676–2682), MODAL (2684–2700), SMOOTH SCROLL (2702–2711), los dos `console.log` (2713–2714) y NAV mega-menú + móvil (2716–2736).

**Corrección al copiar:** en el `console.log` cambiar `Desde 2014` → `Desde 1975`:
```js
console.log('%c Hecho a mano en España · Desde 1975 ', 'color:#9C7B7F;font-style:italic;letter-spacing:2px;');
```

- [ ] **Step 3: Verificar sintaxis JS**

Run (desde `theme/`):
```bash
node --check assets/cursor.js && echo "cursor OK"
node --check assets/animations.js && echo "animations OK"
```
Expected: ambos imprimen OK (sin errores de sintaxis).

- [ ] **Step 4: Commit**

```bash
git add assets/cursor.js assets/animations.js && git commit -m "feat: port cursor stardust + UI animations to theme assets"
```

---

## Task 4: layout/theme.liquid

**Files:**
- Modify/Replace: `theme/layout/theme.liquid`

- [ ] **Step 1: Escribir el layout**

Reemplazar el contenido de `theme/layout/theme.liquid` por:
```liquid
<!doctype html>
<html lang="{{ request.locale.iso_code }}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#F4EFE6">
  <link rel="canonical" href="{{ canonical_url }}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300;1,9..144,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Italiana&family=Jost:wght@300;400;500&family=JetBrains+Mono:wght@300;400&display=swap" rel="stylesheet">
  {{ 'juana-sanchez.css' | asset_url | stylesheet_tag }}
  <title>{{ page_title }}{% unless page_title contains shop.name %} · {{ shop.name }}{% endunless %}</title>
  {% if page_description %}<meta name="description" content="{{ page_description | escape }}">{% endif %}
  {% render 'meta-tags' %}
  {{ content_for_header }}
</head>
<body class="template-{{ request.page_type | handle }}">
  <a class="skip-link" href="#MainContent">Saltar al contenido</a>

  <div class="loader" id="loader">
    <div class="loader-mark">GRUPO JUANA SÁNCHEZ</div>
    <div class="loader-sub">Hecho en España</div>
    <div class="loader-bar"></div>
  </div>

  <div class="cursor-dot" id="cursor"></div>
  <canvas class="stardust-canvas" id="stardust" aria-hidden="true"></canvas>

  {% section 'announce-bar' %}
  {% section 'header' %}

  <main id="MainContent" role="main">
    {{ content_for_layout }}
  </main>

  {% section 'footer' %}
  {% render 'modal-empresarial' %}

  <script src="{{ 'cursor.js' | asset_url }}" defer></script>
  <script src="{{ 'animations.js' | asset_url }}" defer></script>
</body>
</html>
```

- [ ] **Step 2: Theme check**

Run: `shopify theme check 2>&1 | grep -iE "error|theme.liquid" | head`
Expected: sin errores en `theme.liquid` (puede avisar de secciones/snippets aún no creados — se crean en tareas siguientes).

- [ ] **Step 3: Commit**

```bash
git add layout/theme.liquid && git commit -m "feat: theme.liquid layout with fonts, loader, cursor, chrome hooks"
```

---

## Task 5: Ajustes globales del tema (settings_schema + data + locale)

**Files:**
- Modify: `theme/config/settings_schema.json`
- Modify: `theme/config/settings_data.json`
- Modify: `theme/locales/es.default.json`

- [ ] **Step 1: settings_schema.json**

Reemplazar `theme/config/settings_schema.json` por:
```json
[
  { "name": "theme_info", "theme_name": "Grupo Juana Sánchez", "theme_version": "1.0.0", "theme_author": "Grupo Juana Sánchez", "theme_documentation_url": "https://www.juanasanchez.es", "theme_support_url": "https://www.juanasanchez.es/contacta-con-juanasanchez/" },
  {
    "name": "Marca",
    "settings": [
      { "type": "text", "id": "brand_claim", "label": "Claim principal", "default": "Hecho en España" },
      { "type": "text", "id": "brand_years", "label": "Años de oficio", "default": "+50 años" },
      { "type": "text", "id": "brand_est", "label": "Año de fundación", "default": "EST. 1975" }
    ]
  },
  {
    "name": "Envío y promesa",
    "settings": [
      { "type": "number", "id": "free_shipping_threshold", "label": "Umbral de envío gratis (€)", "default": 300 }
    ]
  },
  {
    "name": "Contacto",
    "settings": [
      { "type": "text", "id": "phone_1", "label": "Teléfono 1", "default": "+34 968 70 57 22" },
      { "type": "text", "id": "phone_2", "label": "Teléfono 2", "default": "+34 680 12 83 05" },
      { "type": "url", "id": "instagram", "label": "Instagram" },
      { "type": "url", "id": "facebook", "label": "Facebook" }
    ]
  }
]
```

- [ ] **Step 2: settings_data.json**

Asegurar que `theme/config/settings_data.json` es JSON válido con al menos:
```json
{ "current": {}, "presets": { "Default": {} } }
```

- [ ] **Step 3: locale es por defecto**

Asegurar que existe `theme/locales/es.default.json` (renombrar el `en.default.json` del skeleton a `es.default.json` o crearlo) con un objeto JSON válido (puede ser `{}` mínimo o las claves del skeleton). Run:
```bash
ls locales/
```
Expected: existe un `*.default.json` para español.

- [ ] **Step 4: Theme check + commit**

```bash
shopify theme check 2>&1 | grep -i error | head
git add config/ locales/ && git commit -m "feat: global theme settings (brand, shipping 300€, contact)"
```

---

## Task 6: Sección announce-bar (envío 300€)

**Files:**
- Create: `theme/sections/announce-bar.liquid`

- [ ] **Step 1: Crear la sección**

Portar el markup entre `<!-- ANNOUNCEMENT BAR -->` y el cierre de `<div class="announce">` del `v2.html`, parametrizando el envío con el setting. Crear `theme/sections/announce-bar.liquid`:
```liquid
<div class="announce">
  <div class="announce-track">
    <span>Envío gratuito desde {{ settings.free_shipping_threshold }}€</span>
    <span>Hecho a mano en España</span>
    <span>{{ settings.brand_years }} de artesanía</span>
    <span>Nueva colección Comunión 2026</span>
    <span>Distribución en boutiques de toda España</span>
    <span>Envío gratuito desde {{ settings.free_shipping_threshold }}€</span>
    <span>Hecho a mano en España</span>
    <span>{{ settings.brand_years }} de artesanía</span>
    <span>Nueva colección Comunión 2026</span>
    <span>Distribución en boutiques de toda España</span>
  </div>
</div>
{% schema %}
{ "name": "Barra de anuncio", "settings": [] }
{% endschema %}
```

- [ ] **Step 2: Theme check + commit**

```bash
shopify theme check 2>&1 | grep -iE "announce|error" | head
git add sections/announce-bar.liquid && git commit -m "feat: announce-bar section (free shipping 300€)"
```

---

## Task 7: Sección header (nav editorial + mega-menús + móvil)

**Files:**
- Create: `theme/sections/header.liquid`
- Create: `theme/snippets/mobile-nav.liquid`

- [ ] **Step 1: header.liquid**

Crear `theme/sections/header.liquid`. Copiar el markup entre `<!-- HEADER -->` y `</header>` del `v2.html` (el `<header class="header" id="header">…</header>` con la nav editorial, los dos mega-menús de Colección y Ocasiones, `.menu-trigger`, `.brand` = "GRUPO JUANA SÁNCHEZ / Hecho en España", y `.nav-actions` con Buscar/Cuenta/Carrito). Ajustes Liquid mínimos:
- En las acciones, enlazar carrito a `{{ routes.cart_url }}`, cuenta a `{{ routes.account_url }}`, búsqueda a `{{ routes.search_url }}`.
- La badge del carrito: `<span class="cart-badge">{{ cart.item_count }}</span>`.
- El enlace "Área Empresarial" mantiene `onclick="openModal(); return false;"`.

Cerrar con:
```liquid
{% schema %}
{ "name": "Cabecera", "settings": [] }
{% endschema %}
```

- [ ] **Step 2: mobile-nav.liquid**

Crear `theme/snippets/mobile-nav.liquid` copiando el bloque entre `<!-- MENÚ MÓVIL -->` y el cierre de `<div class="mobile-nav" id="mobileNav">` del `v2.html`. Renderizarlo dentro de `header.liquid` justo después de `</header>` con `{% render 'mobile-nav' %}` (o incluir el markup directamente al final del header, antes del `{% schema %}`).

- [ ] **Step 3: Theme check + commit**

```bash
shopify theme check 2>&1 | grep -iE "header|error" | head
git add sections/header.liquid snippets/mobile-nav.liquid && git commit -m "feat: editorial header with mega-menus + mobile nav"
```

---

## Task 8: Sección footer

**Files:**
- Create: `theme/sections/footer.liquid`

- [ ] **Step 1: footer.liquid**

Crear `theme/sections/footer.liquid` copiando el markup entre `<!-- FOOTER -->` y `</footer>` del `v2.html`. Ajustes:
- Teléfonos: usar `{{ settings.phone_1 }}` / `{{ settings.phone_2 }}`.
- El enlace "Acceso Área Empresarial" mantiene `onclick="openModal(); return false;"`.
- Año dinámico donde aplique: `{{ 'now' | date: '%Y' }}`.

Cerrar con:
```liquid
{% schema %}
{ "name": "Pie de página", "settings": [] }
{% endschema %}
```

- [ ] **Step 2: Theme check + commit**

```bash
shopify theme check 2>&1 | grep -iE "footer|error" | head
git add sections/footer.liquid && git commit -m "feat: editorial footer"
```

---

## Task 9: Snippet modal "Área Empresarial" + meta-tags

**Files:**
- Create: `theme/snippets/modal-empresarial.liquid`
- Create: `theme/snippets/meta-tags.liquid`

- [ ] **Step 1: modal-empresarial.liquid**

Crear `theme/snippets/modal-empresarial.liquid` copiando el markup completo del `<div class="modal" id="modal"> … </div>` del `v2.html` (con "GRUPO JUANA SÁNCHEZ", "◆ ÁREA EMPRESARIAL", pestañas Acceder/Solicitar cuenta, formularios). Mantener los `onclick` y `data-*` (el JS de `animations.js` ya gestiona tabs y cierre). Nota: el formulario sigue siendo demo (la lógica real es de la Fase 4).

- [ ] **Step 2: meta-tags.liquid (SEO/OG básico)**

Crear `theme/snippets/meta-tags.liquid`:
```liquid
<meta property="og:site_name" content="{{ shop.name }}">
<meta property="og:url" content="{{ canonical_url }}">
<meta property="og:title" content="{{ page_title }}">
<meta property="og:type" content="{% if request.page_type == 'product' %}product{% else %}website{% endif %}">
{% if page_description %}<meta property="og:description" content="{{ page_description | escape }}">{% endif %}
<meta name="twitter:card" content="summary_large_image">
```

- [ ] **Step 3: Theme check + commit**

```bash
shopify theme check 2>&1 | grep -iE "modal|meta|error" | head
git add snippets/modal-empresarial.liquid snippets/meta-tags.liquid && git commit -m "feat: Área Empresarial modal + meta tags snippet"
```

---

## Task 10: Home placeholder + cierre de Theme Check

**Files:**
- Modify: `theme/templates/index.json`
- Create: `theme/sections/home-placeholder.liquid`

- [ ] **Step 1: Sección placeholder de Home**

Crear `theme/sections/home-placeholder.liquid` (provisional; el Plan 3 la sustituye por las secciones reales de la Home):
```liquid
<section class="container" style="padding:120px 0;text-align:center">
  <p class="section-label">Grupo Juana Sánchez</p>
  <h1 class="hero-title" style="font-size:clamp(40px,7vw,90px)">Tema base listo.<br><em>Home en construcción.</em></h1>
  <p class="manifest-text">Fundaciones del tema activas: tokens, fuentes, cursor estelar, chrome global. El porting de la Home llega en el Plan 3.</p>
</section>
{% schema %}
{ "name": "Home placeholder", "settings": [] }
{% endschema %}
```

- [ ] **Step 2: index.json**

Reemplazar `theme/templates/index.json` por:
```json
{
  "sections": { "main": { "type": "home-placeholder" } },
  "order": ["main"]
}
```

- [ ] **Step 3: Theme check completo**

Run: `shopify theme check 2>&1 | tail -30`
Expected: **0 errores** (warnings de plantillas vacías del skeleton, aceptables). Si hay errores, corregirlos antes de continuar.

- [ ] **Step 4: Commit**

```bash
git add templates/index.json sections/home-placeholder.liquid && git commit -m "feat: home placeholder + valid index template"
```

---

## Task 11: Repo GitHub + sync a My Store 4

**Files:** —

- [ ] **Step 1: Crear el repo en GitHub y push**

Run (desde `theme/`; usa `gh` si está autenticado, si no, el usuario crea el repo y da la URL):
```bash
gh repo create juana-sanchez-tienda --private --source=. --remote=origin --push || echo "ACCIÓN USUARIO: crear repo 'juana-sanchez-tienda' en GitHub y: git remote add origin <url>; git push -u origin main"
```
Expected: repo creado y `main` empujado.

- [ ] **Step 2: ACCIÓN USUARIO — Conectar GitHub en Shopify**

Indicar al usuario:
> En **My Store 4 → Tienda online → Temas → Añadir tema → Conectar desde GitHub**, autoriza la app de Shopify para GitHub, elige el repo `juana-sanchez-tienda`, rama `main`. Shopify añadirá el tema **sin publicar**.

- [ ] **Step 3: ACCIÓN USUARIO — Verificación visual (preview)**

Indicar al usuario:
> En Temas, abre **Vista previa** del tema `juana-sanchez-tienda`. Debe cargar: cursor con estela dorada (desktop), header editorial con mega-menús (Colección/Ocasiones) + overlay móvil, barra de anuncio con "Envío gratuito desde 300€", footer, y el botón "Área Empresarial" abre el modal. La Home muestra el placeholder.

Confirmar antes de cerrar el plan. (Si algo falla, suele ser un asset no referenciado o un error de Liquid → revisar `shopify theme check` y la consola del navegador.)

---

## Self-Review

**1. Cobertura del spec (Workstream A + chrome global):**
- Repo OS 2.0 + GitHub sync → Tasks 1, 11. ✔
- Tokens + fuentes + cursor.js + animations.js portados → Tasks 2, 3, 4. ✔
- settings_schema (claims, envío 300€, teléfonos) → Task 5. ✔
- Chrome global (announce, header editorial, footer, modal Área Empresarial) → Tasks 6–9. ✔ (movido a A por ser chrome de todas las páginas; el Plan 3 hará las secciones de contenido de la Home).
- theme.liquid con loader/cursor/canvas/JSON-LD hooks → Task 4. ✔
- Theme check sin errores → Tasks 5,6,7,8,9,10. ✔

**2. Placeholders:** "copiar bloque X–Y del v2.html" NO es placeholder: es una instrucción precisa sobre un archivo fuente estable y conocido. La sección `home-placeholder` es provisional **por diseño** (la sustituye el Plan 3), no un placeholder de plan. Sin "TBD/TODO".

**3. Consistencia de nombres:** ids/clases coherentes entre theme.liquid y los assets portados: `#loader`, `#cursor`, `#stardust`, `#header`, `#modal`, `#mobileNav`, `.nav-item.has-mega`, `[data-count]`, `.hero-visual`. El snippet del layout se llama `modal-empresarial` (Task 4 y Task 9 coinciden). `announce-bar`, `header`, `footer` como secciones (Task 4 las invoca, Tasks 6/7/8 las crean). ✔

**4. Dependencias:** Tasks 1→10 en orden (el theme.liquid de Task 4 referencia secciones/snippets creados en 6–10; Theme Check final en Task 10 valida todo junto). Task 11 requiere acción del usuario (GitHub auth + Shopify connect).

---

## Execution Handoff

Plan 1 (Fundaciones) completo y guardado en `docs/superpowers/plans/2026-05-27-fase-0-plan1-fundaciones-tema.md`.
