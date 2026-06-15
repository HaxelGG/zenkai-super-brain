# Fase 1 · Plan 3 — Porting de la Home (Workstream C) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconstruir las 7 secciones de contenido de la Home del `v2.html` como **secciones Liquid configurables** en el tema Shopify, reutilizando las clases CSS exactas (ya portadas en `juana-sanchez.css`) para que se vea idéntico, pero con: grid alimentado por una colección real, hero con vídeo/poster por ajuste, y bloques repetibles en ocasiones/testimonios. Sustituir el `home-placeholder` por la Home real en `index.json`.

**Architecture:** El chrome global (header, announce, footer, modal) y TODO el CSS ya existen del Plan 1. Aquí solo se crean secciones de contenido + 1 snippet (`product-card`). Cada sección es una unidad con su `{% schema %}` (settings/blocks editables). Nada de base64 ni datos hardcodeados donde Shopify provee datos: las imágenes de producto salen de la colección; las de hero/proceso/ocasiones son `image_picker`/`video` de sección; testimonios y ocasiones son `blocks` repetibles. `cursor.js`/`animations.js` (cargados por `theme.liquid`) ya animan `.reveal`, contador `[data-count]` y parallax `.hero-visual`.

**Tech Stack:** Shopify Liquid (sections + blocks + schema), `juana-sanchez.css` existente, datos de producto/colección de Shopify.

**Repo del tema:** `Online store/tienda online/theme/` (repo git propio). **Fuente de markup/clases:** `juana-sanchez-tienda-v2.html` (secciones: hero 1935–1981, manifest 1983–2032, collection 2034–2143, proceso 2145–2185, ocasiones 2187–2230, testimonios 2232–2282, newsletter 2284–2301).
**Spec:** `docs/superpowers/specs/2026-05-27-fase-0-1-fundaciones-tema-porting-home-design.md` (§7).

---

## Notas de ejecución
- Repo git → commit por tarea. Verificación: `shopify theme check` (0 errores) por tarea; visual real = preview en Shopify (acción usuario, al final).
- Reusar las **clases exactas** del v2 (ya estilizadas). No reescribir CSS.
- Para las secciones "porting por rango": extraer el markup interno del v2 con `sed -n 'A,Bp'`, **quitar el base64** (reemplazar `style="background-image: url(data:...)"` por el setting correspondiente), y envolver en `{% schema %}`.
- Ejecutar desde `Online store/tienda online/theme/`.

---

## Task 1: Snippet `product-card` (reutilizable por el grid)

**Files:**
- Create: `theme/snippets/product-card.liquid`

Estructura objetivo del v2 (clases a reproducir): `article.product-card.reveal > .product-card-img(.product-card-img-inner[bg], .product-badge?, .product-quickview) + .product-info(div(.product-name,.product-meta), .product-price)`.

- [ ] **Step 1: Crear el snippet**

Create `theme/snippets/product-card.liquid`:
```liquid
{%- comment -%} Espera: product (objeto), delay (0|100|200) {%- endcomment -%}
{%- assign img = product.featured_image -%}
<a href="{{ product.url }}" class="product-card reveal" data-delay="{{ delay | default: 0 }}">
  <div class="product-card-img">
    <div class="product-card-img-inner" {% if img %}style="background-image: url({{ img | image_url: width: 900 }});"{% endif %}></div>
    {%- assign badge = product.metafields.custom.badge.value -%}
    {%- if badge != blank -%}
      {%- assign bclass = '' -%}
      {%- if badge contains 'Nuevo' -%}{%- assign bclass = 'new' -%}{%- elsif badge contains 'Limitada' -%}{%- assign bclass = 'gold' -%}{%- endif -%}
      <span class="product-badge {{ bclass }}">{{ badge }}</span>
    {%- endif -%}
    <div class="product-quickview">Vista rápida</div>
  </div>
  <div class="product-info">
    <div>
      <h3 class="product-name">{{ product.title }}</h3>
      <p class="product-meta">{{ product.metafields.custom.color_familia.value | default: product.type }}</p>
    </div>
    <div class="product-price">{{ product.price | money_without_trailing_zeros | remove: '€' | remove: ',00' | strip }}<small>€</small></div>
  </div>
</a>
```
NOTE: el v2 usaba `<article>` no enlazado; aquí es `<a>` (la card enlaza al producto) manteniendo las clases. Si el tema necesita exactamente `<article>`, envolver el `<a>` dentro; pero `<a class="product-card">` conserva el estilo y mejora UX.

- [ ] **Step 2: Theme check + commit**
```bash
shopify theme check 2>&1 | grep -iE "product-card|error" | head
git add snippets/product-card.liquid && git commit -m "feat: product-card snippet (Shopify product data)"
```

---

## Task 2: Sección `featured-collection` (grid editorial con productos reales)

**Files:**
- Create: `theme/sections/featured-collection.liquid`

- [ ] **Step 1: Crear la sección**

Create `theme/sections/featured-collection.liquid`:
```liquid
<section class="collection" id="coleccion">
  <div class="container">
    <div class="section-head reveal">
      <div>
        <div class="section-label">{{ section.settings.label }}</div>
        <h2 class="section-title">{{ section.settings.title }}</h2>
      </div>
      <div class="section-head-right">
        <div>{{ section.settings.right_top }}</div>
        <div><a href="{{ section.settings.right_link }}">{{ section.settings.right_link_text }}</a></div>
      </div>
    </div>
    <div class="product-grid">
      {%- assign col = section.settings.collection -%}
      {%- assign limit = section.settings.products_count -%}
      {%- for product in col.products limit: limit -%}
        {%- assign d = forloop.index0 | modulo: 3 | times: 100 -%}
        {% render 'product-card', product: product, delay: d %}
      {%- else -%}
        <p class="product-meta">Selecciona una colección en el editor de temas.</p>
      {%- endfor -%}
    </div>
    {%- if section.settings.cta_text != blank -%}
    <div class="collection-cta reveal">
      <a href="{{ section.settings.cta_link | default: col.url }}" class="btn-link">{{ section.settings.cta_text }} <span class="arr">→</span></a>
    </div>
    {%- endif -%}
  </div>
</section>
{% schema %}
{
  "name": "Colección destacada",
  "settings": [
    { "type": "text", "id": "label", "label": "Etiqueta", "default": "Colección Comunión 2026" },
    { "type": "richtext", "id": "title", "label": "Título", "default": "<p>Piezas que pasan<br><em>de armario en armario.</em></p>" },
    { "type": "collection", "id": "collection", "label": "Colección a mostrar" },
    { "type": "range", "id": "products_count", "min": 3, "max": 12, "step": 1, "label": "Nº de productos", "default": 6 },
    { "type": "text", "id": "right_top", "label": "Texto derecha (arriba)", "default": "06 modelos seleccionados" },
    { "type": "text", "id": "right_link_text", "label": "Enlace derecha (texto)", "default": "Ver catálogo completo →" },
    { "type": "url", "id": "right_link", "label": "Enlace derecha (URL)" },
    { "type": "text", "id": "cta_text", "label": "CTA inferior", "default": "Ver toda la colección" },
    { "type": "url", "id": "cta_link", "label": "CTA inferior (URL)" }
  ],
  "presets": [{ "name": "Colección destacada" }]
}
{% endschema %}
```
NOTE: `title` es richtext (permite el `<br><em>`). Si en el render aparece envuelto en `<p>`, es aceptable; si molesta para el estilo, cambiar a `text` y usar `| newline_to_br`.

- [ ] **Step 2: Theme check + commit**
```bash
shopify theme check 2>&1 | grep -iE "collection|error" | head
git add sections/featured-collection.liquid && git commit -m "feat: featured-collection section (real products)"
```

---

## Task 3: Sección `hero` (vídeo cinematográfico + poster por ajuste)

**Files:**
- Create: `theme/sections/hero.liquid`

- [ ] **Step 1: Crear la sección** (reproduce hero del v2: `.hero > .hero-content + .hero-visual + .hero-meta + .hero-scroll`)

Create `theme/sections/hero.liquid`:
```liquid
<section class="hero">
  <div class="hero-content">
    <div class="hero-eyebrow">{{ section.settings.eyebrow }}</div>
    <h1 class="hero-title">{{ section.settings.title }}</h1>
    <p class="hero-sub">{{ section.settings.subtitle }}</p>
    <div class="hero-cta">
      <a href="{{ section.settings.cta1_link }}" class="btn-link">{{ section.settings.cta1_text }} <span class="arr">→</span></a>
      <a href="{{ section.settings.cta2_link }}" class="btn-link ghost">{{ section.settings.cta2_text }}</a>
    </div>
  </div>
  <div class="hero-visual">
    {%- if section.settings.video != blank -%}
      {{ section.settings.video | video_tag: image_size: '1200x', autoplay: true, loop: true, muted: true, controls: false, class: 'hero-video' }}
    {%- elsif section.settings.poster != blank -%}
      <div class="hero-video" style="background-image: url({{ section.settings.poster | image_url: width: 1600 }});"></div>
    {%- else -%}
      <div class="hero-video"><span class="hero-video-badge">Sube un vídeo o imagen en el editor</span></div>
    {%- endif -%}
    <div class="hero-video-overlay"></div>
    <div class="hero-video-frame">{{ section.settings.frame_text }}</div>
  </div>
  <div class="hero-meta">
    {%- for block in section.blocks -%}
      <span>{{ block.settings.text }}</span>{%- unless forloop.last -%}<span>·</span>{%- endunless -%}
    {%- endfor -%}
  </div>
  <div class="hero-scroll"></div>
</section>
{% schema %}
{
  "name": "Hero",
  "settings": [
    { "type": "text", "id": "eyebrow", "label": "Eyebrow", "default": "Colección Comunión 2026" },
    { "type": "richtext", "id": "title", "label": "Título", "default": "<p>Hecho a mano<br>en España.<br><em>Para siempre.</em></p>" },
    { "type": "textarea", "id": "subtitle", "label": "Subtítulo", "default": "Cada par nace en nuestro taller de Almansa. Esparteñas y manoletinas tejidas a mano, una a una, para los días que se recuerdan toda la vida." },
    { "type": "text", "id": "cta1_text", "label": "CTA 1 texto", "default": "Ver colección" },
    { "type": "url", "id": "cta1_link", "label": "CTA 1 enlace" },
    { "type": "text", "id": "cta2_text", "label": "CTA 2 texto", "default": "Descubrir el atelier" },
    { "type": "url", "id": "cta2_link", "label": "CTA 2 enlace" },
    { "type": "video", "id": "video", "label": "Vídeo cinematográfico (vertical, sin sonido)" },
    { "type": "image_picker", "id": "poster", "label": "Imagen/poster (fallback si no hay vídeo)" },
    { "type": "text", "id": "frame_text", "label": "Texto del marco", "default": "REEL · 01 / 2026" }
  ],
  "blocks": [
    { "type": "meta", "name": "Dato meta", "settings": [ { "type": "text", "id": "text", "label": "Texto", "default": "EST. 1975" } ] }
  ],
  "presets": [{ "name": "Hero", "blocks": [
    { "type": "meta", "settings": { "text": "EST. 1975" } },
    { "type": "meta", "settings": { "text": "ALMANSA · ESPAÑA" } },
    { "type": "meta", "settings": { "text": "CONFECCIÓN 100% ARTESANAL" } }
  ]}]
}
{% endschema %}
```

- [ ] **Step 2: Theme check + commit**
```bash
shopify theme check 2>&1 | grep -iE "hero|error" | head
git add sections/hero.liquid && git commit -m "feat: hero section (video/poster settings + meta blocks)"
```

---

## Task 4: Sección `ocasiones` (bloques repetibles → colecciones)

**Files:**
- Create: `theme/sections/ocasiones.liquid`

- [ ] **Step 1: Crear la sección** (reproduce `.ocasiones > .section-head + .ocasiones-grid > a.ocasion-card`)

Create `theme/sections/ocasiones.liquid`:
```liquid
<section class="ocasiones" id="ocasiones">
  <div class="container">
    <div class="section-head reveal">
      <div>
        <div class="section-label">{{ section.settings.label }}</div>
        <h2 class="section-title">{{ section.settings.title }}</h2>
      </div>
      <div class="section-head-right">
        <div>{{ section.settings.right_top }}</div>
        <div>{{ section.settings.right_bottom }}</div>
      </div>
    </div>
    <div class="ocasiones-grid">
      {%- for block in section.blocks -%}
        <a href="{{ block.settings.link }}" class="ocasion-card reveal" {% if forloop.index0 > 0 %}data-delay="{{ forloop.index0 | times: 100 }}"{% endif %} {{ block.shopify_attributes }}>
          <div class="ocasion-img" {% if block.settings.image %}style="background-image: url({{ block.settings.image | image_url: width: 800 }});"{% endif %}></div>
          <div class="ocasion-content">
            <div class="ocasion-num">{{ forloop.index | prepend: '0' }} / {{ section.blocks.size | prepend: '0' }}</div>
            <h3 class="ocasion-name">{{ block.settings.name }}</h3>
            <p class="ocasion-desc">{{ block.settings.desc }}</p>
            <div class="ocasion-arrow">Ver colección</div>
          </div>
        </a>
      {%- endfor -%}
    </div>
  </div>
</section>
{% schema %}
{
  "name": "Ocasiones",
  "settings": [
    { "type": "text", "id": "label", "label": "Etiqueta", "default": "Por ocasión" },
    { "type": "richtext", "id": "title", "label": "Título", "default": "<p>Cada día especial<br><em>tiene su pieza.</em></p>" },
    { "type": "text", "id": "right_top", "label": "Texto derecha arriba", "default": "03 ceremonias" },
    { "type": "text", "id": "right_bottom", "label": "Texto derecha abajo", "default": "Diseños únicos por evento" }
  ],
  "blocks": [
    { "type": "ocasion", "name": "Ocasión", "settings": [
      { "type": "image_picker", "id": "image", "label": "Imagen" },
      { "type": "text", "id": "name", "label": "Nombre", "default": "Comunión" },
      { "type": "textarea", "id": "desc", "label": "Descripción", "default": "Esparteñas en blanco roto y marfil, con detalles de flores de seda y encaje." },
      { "type": "url", "id": "link", "label": "Enlace a colección" }
    ]}
  ],
  "presets": [{ "name": "Ocasiones", "blocks": [
    { "type": "ocasion", "settings": { "name": "Comunión", "desc": "Esparteñas en blanco roto y marfil, con detalles de flores de seda y encaje." } },
    { "type": "ocasion", "settings": { "name": "Bautizo", "desc": "Manoletinas y esparteñas para los más pequeños, en tonos rosa empolvado y azul agua." } },
    { "type": "ocasion", "settings": { "name": "Arras & Ceremonia", "desc": "Conjuntos completos para niños de arras: esparteñas, complementos y detalles a juego." } }
  ]}]
}
{% endschema %}
```

- [ ] **Step 2: Theme check + commit**
```bash
shopify theme check 2>&1 | grep -iE "ocasion|error" | head
git add sections/ocasiones.liquid && git commit -m "feat: ocasiones section (blocks -> collections)"
```

---

## Task 5: Sección `testimonios` (bloques repetibles)

**Files:**
- Create: `theme/sections/testimonios.liquid`

- [ ] **Step 1: Crear la sección** (reproduce `.testimonios > .section-head + .testimonios-grid > .testi-card`)

Create `theme/sections/testimonios.liquid`:
```liquid
<section class="testimonios">
  <div class="container">
    <div class="section-head reveal">
      <div>
        <div class="section-label">{{ section.settings.label }}</div>
        <h2 class="section-title">{{ section.settings.title }}</h2>
      </div>
    </div>
    <div class="testimonios-grid">
      {%- for block in section.blocks -%}
        <div class="testi-card reveal" {% if forloop.index0 > 0 %}data-delay="{{ forloop.index0 | times: 100 }}"{% endif %} {{ block.shopify_attributes }}>
          <div class="testi-stars">★★★★★</div>
          <p class="testi-quote">«{{ block.settings.quote }}»</p>
          <div class="testi-author">
            <div class="testi-avatar" {% if block.settings.avatar %}style="background-image: url({{ block.settings.avatar | image_url: width: 200 }});"{% endif %}></div>
            <div>
              <div class="testi-name">{{ block.settings.name }}</div>
              <div class="testi-loc">{{ block.settings.loc }}</div>
            </div>
          </div>
        </div>
      {%- endfor -%}
    </div>
  </div>
</section>
{% schema %}
{
  "name": "Testimonios",
  "settings": [
    { "type": "text", "id": "label", "label": "Etiqueta", "default": "Madres que han elegido Juana Sánchez" },
    { "type": "richtext", "id": "title", "label": "Título", "default": "<p>El día de mi hija,<br><em>de pies a cabeza.</em></p>" }
  ],
  "blocks": [
    { "type": "testi", "name": "Testimonio", "settings": [
      { "type": "textarea", "id": "quote", "label": "Cita" },
      { "type": "image_picker", "id": "avatar", "label": "Foto cliente" },
      { "type": "text", "id": "name", "label": "Nombre", "default": "María del Carmen R." },
      { "type": "text", "id": "loc", "label": "Ubicación", "default": "Sevilla · Verificada" }
    ]}
  ],
  "presets": [{ "name": "Testimonios", "blocks": [
    { "type": "testi", "settings": { "quote": "Las compré para la comunión de mi hija mayor en 2019. Las acaba de estrenar mi pequeña en la suya. Siguen perfectas.", "name": "María del Carmen R.", "loc": "Sevilla · Verificada" } },
    { "type": "testi", "settings": { "quote": "Llegó envuelta como un regalo de joyería. Mi hija las quiere usar todos los días desde entonces.", "name": "Elena V.", "loc": "Valencia · Verificada" } },
    { "type": "testi", "settings": { "quote": "Tengo una boutique pequeña en Madrid y llevo cuatro años con la colección. Las clientas vuelven.", "name": "Carmen P.", "loc": "Madrid · Cliente B2B" } }
  ]}]
}
{% endschema %}
```

- [ ] **Step 2: Theme check + commit**
```bash
shopify theme check 2>&1 | grep -iE "testi|error" | head
git add sections/testimonios.liquid && git commit -m "feat: testimonios section (blocks)"
```

---

## Task 6: Secciones estáticas — `manifest`, `proceso`, `newsletter` (porting por rango)

**Files:**
- Create: `theme/sections/manifest.liquid`, `theme/sections/proceso.liquid`, `theme/sections/newsletter.liquid`

- [ ] **Step 1: manifest** (v2 líneas 1983–2032; ya tiene el copy correcto "Más de cinco décadas / perfeccionando el arte." y `data-count="50"`)

Extraer el interior del `<section class="manifest" id="atelier">…</section>`:
```bash
sed -n '1984,2031p' "../juana-sanchez-tienda-v2.html" > /tmp/manifest-inner.html   # ajustar A,B al contenido entre <section> y </section>
```
Crear `theme/sections/manifest.liquid` con: `<section class="manifest" id="atelier">` + (markup interno extraído, **sin base64** — los iconos de confianza del v2 son SVG inline, se conservan) + `</section>` + schema:
```liquid
{% schema %}
{ "name": "Manifiesto", "settings": [], "presets": [{ "name": "Manifiesto" }] }
{% endschema %}
```
Si el interior trae algún `background-image: url(data:...)`, sustituirlo por un `{{ section.settings.image | image_url }}` y añadir un `image_picker` al schema. Verificar que el contador conserva `<span data-count="50">0</span>`.

- [ ] **Step 2: proceso** (v2 líneas 2145–2185; sección oscura con vídeo de fondo)

Crear `theme/sections/proceso.liquid` reproduciendo `.proceso` del v2. El fondo de vídeo del v2 es base64/placeholder → sustituir por ajuste de sección:
```liquid
<section class="proceso">
  {%- if section.settings.video != blank -%}
    {{ section.settings.video | video_tag: autoplay: true, loop: true, muted: true, controls: false, class: 'proceso-video' }}
  {%- elsif section.settings.poster != blank -%}
    <div class="proceso-video" style="background-image:url({{ section.settings.poster | image_url: width: 1800 }});"></div>
  {%- endif -%}
  <!-- resto del markup interior del v2 (.proceso-content/.proceso-title/etc.), conservando clases -->
</section>
{% schema %}
{ "name": "Proceso", "settings": [
  { "type": "video", "id": "video", "label": "Vídeo del proceso (sin sonido)" },
  { "type": "image_picker", "id": "poster", "label": "Imagen de fondo (fallback)" },
  { "type": "richtext", "id": "title", "label": "Titular", "default": "<p>Cada par lleva horas de<br><em>trabajo invisible.</em></p>" }
], "presets": [{ "name": "Proceso" }] }
{% endschema %}
```
Extraer el markup interior real (`sed -n '2146,2184p'`), quitar el base64 del fondo, y mapear el titular a `{{ section.settings.title }}` si procede.

- [ ] **Step 3: newsletter** (v2 líneas 2284–2301; formulario)

Crear `theme/sections/newsletter.liquid` reproduciendo `.newsletter` del v2, pero con **form nativo de Shopify**:
```liquid
<section class="newsletter">
  <div class="container">
    <div class="section-label">{{ section.settings.label }}</div>
    <h2 class="section-title">{{ section.settings.title }}</h2>
    <p class="newsletter-sub">{{ section.settings.subtitle }}</p>
    {%- form 'customer' -%}
      <input type="hidden" name="contact[tags]" value="newsletter">
      <div class="newsletter-form">
        <input type="email" name="contact[email]" class="newsletter-input" placeholder="{{ section.settings.placeholder }}" required>
        <button type="submit" class="newsletter-btn">{{ section.settings.button }}</button>
      </div>
      {%- if form.posted_successfully? -%}<p class="newsletter-ok">{{ section.settings.success }}</p>{%- endif -%}
    {%- endform -%}
  </div>
</section>
{% schema %}
{ "name": "Newsletter", "settings": [
  { "type": "text", "id": "label", "label": "Etiqueta", "default": "Accede antes que nadie" },
  { "type": "richtext", "id": "title", "label": "Título", "default": "<p>Sé la primera en<br><em>verlo todo.</em></p>" },
  { "type": "textarea", "id": "subtitle", "label": "Subtítulo", "default": "Sé la primera en ver las nuevas colecciones y recibe un 10% en tu primera compra." },
  { "type": "text", "id": "placeholder", "label": "Placeholder", "default": "Tu correo electrónico" },
  { "type": "text", "id": "button", "label": "Botón", "default": "Suscribirme" },
  { "type": "text", "id": "success", "label": "Mensaje de éxito", "default": "¡Gracias! Revisa tu correo." }
], "presets": [{ "name": "Newsletter" }] }
{% endschema %}
```
Ajustar las clases del form a las que use el v2 (`.newsletter-form/.newsletter-input/.newsletter-btn` — verificar en el rango 2284–2301 y reutilizar las exactas).

- [ ] **Step 4: Theme check + commit**
```bash
shopify theme check 2>&1 | grep -iE "manifest|proceso|newsletter|error" | head
git add sections/manifest.liquid sections/proceso.liquid sections/newsletter.liquid && git commit -m "feat: manifest, proceso, newsletter sections"
```

---

## Task 7: Ensamblar la Home en `index.json` + retirar placeholder

**Files:**
- Modify: `theme/templates/index.json`
- Delete: `theme/sections/home-placeholder.liquid`

- [ ] **Step 1: index.json con el orden del v2**

Reemplazar `theme/templates/index.json`:
```json
{
  "sections": {
    "hero":        { "type": "hero" },
    "manifest":    { "type": "manifest" },
    "coleccion":   { "type": "featured-collection" },
    "proceso":     { "type": "proceso" },
    "ocasiones":   { "type": "ocasiones" },
    "testimonios": { "type": "testimonios" },
    "newsletter":  { "type": "newsletter" }
  },
  "order": ["hero","manifest","coleccion","proceso","ocasiones","testimonios","newsletter"]
}
```
NOTA: las secciones con `blocks` (hero/ocasiones/testimonios) tomarán sus bloques por defecto del `preset` si no se especifican aquí; para fijar los bloques iniciales, añadir `"blocks"` y `"block_order"` replicando los `presets`. Mínimo viable: lo de arriba (el editor permite añadirlos). Recomendado: incluir los blocks de los presets para que la Home salga poblada sin tocar el editor.

- [ ] **Step 2: Borrar el placeholder**
```bash
git rm sections/home-placeholder.liquid
```

- [ ] **Step 3: Theme check final**
Run: `shopify theme check 2>&1 | tail -20`
Expected: **0 errores** (warnings RemoteAsset de fonts, OK). Si una sección referencia un setting/clase inexistente, corregir.

- [ ] **Step 4: Commit**
```bash
git add templates/index.json && git commit -m "feat: assemble editorial Home (replace placeholder)"
```

---

## Task 8: Verificación visual (ACCIÓN USUARIO)

- [ ] **Step 1:** Subir el tema (push GitHub o re-zip) a My Store 4 → Vista previa.
- [ ] **Step 2:** Comprobar la Home: hero (con poster/vídeo si se subió), manifiesto con contador animando a 50, grid con productos reales de la colección elegida, proceso, ocasiones (3 bloques → colecciones), testimonios, newsletter. Animaciones `.reveal` + cursor estelar OK. Asignar en el editor la **colección** del grid y las **imágenes** de hero/ocasiones (usar las 38 fotos studio / editoriales de modelo). Capturas como evidencia.

---

## Self-Review

**1. Cobertura del spec §7:** hero, manifest, featured-collection (productos reales), proceso, ocasiones, testimonios, newsletter → Tasks 1–6. index.json + quitar placeholder → Task 7. ✔ El chrome (header/announce/footer/modal) ya estaba en Plan 1, por eso no se repite.

**2. Placeholders:** Task 6 usa "porting por rango" con `sed` sobre rangos concretos del v2 (no es placeholder: es extracción de markup real y conocido, + transformación explícita base64→setting). Las secciones dinámicas (1–5) llevan Liquid completo. Task 8 es acción usuario (preview en Shopify, requiere credenciales).

**3. Consistencia de nombres:** clases reproducidas del v2 (existentes en `juana-sanchez.css`): `hero/hero-content/hero-visual/hero-meta`, `manifest`, `collection/product-grid/product-card/product-card-img-inner/product-badge(.new/.gold)/product-quickview/product-info/product-name/product-meta/product-price`, `proceso`, `ocasiones-grid/ocasion-card/ocasion-img/ocasion-content/ocasion-num/ocasion-name/ocasion-desc/ocasion-arrow`, `testimonios-grid/testi-card/testi-stars/testi-quote/testi-author/testi-avatar/testi-name/testi-loc`, `newsletter`. Snippet `product-card` definido en Task 1, usado en Task 2. Tipos de sección en index.json (Task 7) = ficheros creados en Tasks 2–6. `data-count="50"` conservado (Task 6.1). Metafields usados en product-card (`custom.badge`, `custom.color_familia`) coinciden con los del Plan 2.

**4. Riesgo:** las clases internas exactas de manifest/proceso/newsletter deben verificarse contra el v2 al portar (Task 6 lo indica). Si alguna clase difiere, reutilizar la del v2 (no inventar) para no romper el CSS.

---

## Execution Handoff

Plan 3 (Porting de la Home) completo y guardado en `docs/superpowers/plans/2026-05-27-fase-1-plan3-porting-home.md`.
