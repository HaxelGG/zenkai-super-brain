# Fase 2 · Plan 5 — Ficha de producto Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Página de producto editorial: galería (imagen grande + miniaturas + zoom), info, selector de talla en botones, añadir al carrito (AJAX → abre el drawer del Plan 6), guía de tallas (modal), "Completa el look" (relacionados), sticky add-to-cart en móvil y JSON-LD de producto.

**Architecture:** `main-product.liquid` (sección de la plantilla `product.json`) renderiza la ficha reutilizando tokens/clases de marca y el snippet `product-card` para los relacionados. `product.js` maneja galería, zoom, selección de talla y el botón añadir, que llama a `window.Cart.add(variantId)` (API pública del Plan 6 que abre el drawer). El selector de talla respeta el setting `mostrar_todas_tallas` (D-1: ON mientras no haya inventario real). Snippets `size-guide` (modal) y `price` (formato precio consistente).

**Tech Stack:** Shopify Liquid, JS vanilla, CSS con design tokens. Depende del **Plan 6** (carrito drawer + `window.Cart`).

**Repo:** `Online store/tienda online/theme/`. Verificación: `shopify theme check` 0 errores + preview. Commit por tarea.

---

## Nota de inventario (D-1)
El setting `mostrar_todas_tallas` (default ON) controla solo la **visualización** (las tallas no salen tachadas). Para que **añadir** funcione de verdad con stock 0, las variantes deben tener `Variant Inventory Policy = continue` (permitir venta sin stock) o inventario no rastreado. → En el import (Plan 2) o por edición masiva en el admin, poner policy `continue` mientras no haya inventario real. Esta nota se documenta; no bloquea la construcción de la ficha.

---

## Task 1: Snippet `price`

**Files:**
- Create: `theme/snippets/price.liquid`

- [ ] **Step 1:** Create `theme/snippets/price.liquid`:
```liquid
{%- comment -%} Espera: price (en céntimos) {%- endcomment -%}
{%- assign euros = price | divided_by: 100 -%}
<span class="product-price">{{ euros }}<small>€</small></span>
```
- [ ] **Step 2:** `shopify theme check 2>&1 | grep -i error | head` · `git add snippets/price.liquid && git commit -m "feat: price snippet"`

---

## Task 2: CSS de la ficha (en `assets/juana-sanchez.css`)

**Files:**
- Modify: `theme/assets/juana-sanchez.css` (añadir al final)

- [ ] **Step 1:** Añadir AL FINAL:
```css
/* ═══════ FICHA DE PRODUCTO ═══════ */
.pdp{max-width:var(--maxw);margin:0 auto;padding:60px var(--pad-x);display:grid;grid-template-columns:1.1fr .9fr;gap:64px}
.pdp-gallery{display:grid;grid-template-columns:72px 1fr;gap:16px;align-items:start}
.pdp-thumbs{display:flex;flex-direction:column;gap:10px}
.pdp-thumb{width:72px;height:90px;background-size:cover;background-position:center;background-color:var(--bone);cursor:pointer;opacity:.55;transition:opacity .3s;border:1px solid transparent}
.pdp-thumb.active,.pdp-thumb:hover{opacity:1;border-color:var(--line-2)}
.pdp-main{position:relative;aspect-ratio:4/5;background:var(--bone);background-size:cover;background-position:center;overflow:hidden}
.pdp-main.zoom{background-size:180%}
.pdp-eyebrow{font-family:var(--f-sans);font-size:11px;letter-spacing:3px;text-transform:uppercase;color:var(--mauve);margin-bottom:14px}
.pdp-title{font-family:var(--f-display);font-size:clamp(32px,4vw,52px);color:var(--ink);line-height:1.05;margin-bottom:18px}
.pdp .product-price{font-family:var(--f-sans);font-size:24px;color:var(--ink)}
.pdp-desc{font-family:var(--f-serif);font-size:17px;line-height:1.7;color:var(--ink-2);margin:28px 0}
.pdp-sizes-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.pdp-sizes-label{font-family:var(--f-sans);font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--ink-3)}
.pdp-size-guide{font-family:var(--f-sans);font-size:11px;letter-spacing:1px;text-decoration:underline;color:var(--ink-3);background:none;border:none}
.pdp-sizes{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px}
.pdp-size{min-width:48px;padding:12px;font-family:var(--f-sans);font-size:13px;background:var(--paper);border:1px solid var(--line-2);color:var(--ink-2);cursor:pointer;transition:all .25s}
.pdp-size:hover{border-color:var(--ink-3)}
.pdp-size.selected{background:var(--ink);color:var(--cream);border-color:var(--ink)}
.pdp-size.soldout{opacity:.35;text-decoration:line-through;cursor:not-allowed}
.pdp-add{width:100%;background:var(--mauve);color:var(--cream);padding:18px;font-family:var(--f-sans);font-size:12px;letter-spacing:2px;text-transform:uppercase;border:none;cursor:pointer;transition:background .3s}
.pdp-add:hover{background:var(--mauve-deep)}
.pdp-add:disabled{background:var(--ink-5);cursor:not-allowed}
.pdp-madein{margin-top:18px;font-family:var(--f-sans);font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--ink-4)}
.pdp-sticky{position:fixed;left:0;right:0;bottom:0;z-index:90;background:var(--paper);border-top:1px solid var(--line);padding:12px 20px;display:none;align-items:center;justify-content:space-between;gap:12px}
.pdp-sticky .pdp-add{width:auto;padding:14px 28px}
.completa{max-width:var(--maxw);margin:0 auto;padding:40px var(--pad-x) 90px}
@media (max-width:968px){.pdp{grid-template-columns:1fr;gap:32px;padding:32px 20px}.pdp-gallery{grid-template-columns:1fr}.pdp-thumbs{flex-direction:row;order:2}.pdp-sticky{display:flex}}
```
- [ ] **Step 2:** `shopify theme check` · `git add assets/juana-sanchez.css && git commit -m "feat: product page styles"`

---

## Task 3: Snippet `size-guide` (modal)

**Files:**
- Create: `theme/snippets/size-guide.liquid`

- [ ] **Step 1:** Create `theme/snippets/size-guide.liquid`:
```liquid
<div class="modal" id="sizeGuide">
  <div class="modal-backdrop" data-sizeguide-close></div>
  <div class="modal-panel">
    <button class="modal-close" data-sizeguide-close aria-label="Cerrar">&times;</button>
    <div class="modal-mark-sub">◆ GUÍA DE TALLAS</div>
    <h2 class="modal-title">Encuentra<br>tu talla.</h2>
    <p class="modal-sub">Tallas europeas (EU). Si dudas entre dos, elige la mayor.</p>
    <table style="width:100%;border-collapse:collapse;font-family:var(--f-sans);font-size:13px;margin-top:20px">
      <thead><tr style="text-align:left;color:var(--ink-3)"><th style="padding:8px 0">Talla EU</th><th>Edad orientativa</th><th>Largo pie (cm)</th></tr></thead>
      <tbody>
        {%- assign edades = '1-1½ años|2-2½ años|3 años|3-4 años|4-5 años|5-6 años|6-7 años|7-8 años|8-9 años|9-10 años|10-11 años|11-12 años|12-13 años|Adulto XS|Adulto S|Adulto S|Adulto M|Adulto M|Adulto M/L|Adulto L|Adulto L|Adulto XL' | split: '|' -%}
        {%- for i in (20..41) -%}
          {%- assign cm = i | minus: 20 | times: 0.67 | plus: 12.5 | round: 1 -%}
          <tr style="border-top:1px solid var(--line)"><td style="padding:8px 0">{{ i }}</td><td>{{ edades[forloop.index0] }}</td><td>~{{ cm }} cm</td></tr>
        {%- endfor -%}
      </tbody>
    </table>
  </div>
</div>
<script>
  document.addEventListener('click', e => {
    if (e.target.closest('.pdp-size-guide')) document.getElementById('sizeGuide')?.classList.add('open');
    if (e.target.closest('[data-sizeguide-close]')) document.getElementById('sizeGuide')?.classList.remove('open');
  });
</script>
```
NOTE: reutiliza las clases `.modal*` ya existentes (del modal Área Empresarial). La tabla cm es orientativa; ajustar si el cliente da medidas reales.

- [ ] **Step 2:** `shopify theme check` · `git add snippets/size-guide.liquid && git commit -m "feat: size-guide modal"`

---

## Task 4: `product.js` (galería, zoom, talla, add-to-cart, sticky)

**Files:**
- Create: `theme/assets/product.js`

- [ ] **Step 1:** Create `theme/assets/product.js`:
```javascript
// Ficha de producto: galería, zoom, selección de talla, add-to-cart, sticky
(function () {
  const pdp = document.querySelector('.pdp'); if (!pdp) return;
  const main = pdp.querySelector('.pdp-main');
  // Galería: miniatura -> principal
  pdp.querySelectorAll('.pdp-thumb').forEach(t => t.addEventListener('click', () => {
    pdp.querySelectorAll('.pdp-thumb').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    if (main) main.style.backgroundImage = `url(${t.dataset.img})`;
  }));
  // Zoom hover (desktop)
  if (main && window.matchMedia('(min-width:969px)').matches) {
    main.addEventListener('mousemove', e => {
      const r = main.getBoundingClientRect();
      main.style.backgroundPosition = `${(e.clientX-r.left)/r.width*100}% ${(e.clientY-r.top)/r.height*100}%`;
    });
    main.addEventListener('mouseenter', () => main.classList.add('zoom'));
    main.addEventListener('mouseleave', () => { main.classList.remove('zoom'); main.style.backgroundPosition='center'; });
  }
  // Selección de talla
  let selected = null;
  const addBtns = pdp.querySelectorAll('[data-add-to-cart]');
  const setEnabled = on => addBtns.forEach(b => { b.disabled = !on; b.textContent = on ? 'Añadir al carrito' : 'Elige una talla'; });
  setEnabled(false);
  pdp.querySelectorAll('.pdp-size').forEach(s => s.addEventListener('click', () => {
    if (s.classList.contains('soldout')) return;
    pdp.querySelectorAll('.pdp-size').forEach(x => x.classList.remove('selected'));
    s.classList.add('selected'); selected = s.dataset.variantId; setEnabled(true);
  }));
  // Añadir al carrito -> abre el drawer (Plan 6)
  addBtns.forEach(b => b.addEventListener('click', () => {
    if (!selected) return;
    if (window.Cart) window.Cart.add(parseInt(selected,10), 1);
    else { // fallback sin drawer
      fetch('/cart/add.js',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:parseInt(selected,10),quantity:1})}).then(()=>location.href='/cart');
    }
  }));
  // Sticky bar en móvil: mostrar al salir el add principal de viewport
  const sticky = document.querySelector('.pdp-sticky');
  const mainAdd = pdp.querySelector('.pdp-add');
  if (sticky && mainAdd && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { sticky.style.display = e.isIntersecting ? 'none' : 'flex'; },
      { rootMargin: '0px' }).observe(mainAdd);
  }
})();
```
- [ ] **Step 2:** `node --check assets/product.js && echo OK` · `git add assets/product.js && git commit -m "feat: product.js (gallery, size, add-to-cart, sticky)"`

---

## Task 5: Sección `main-product.liquid`

**Files:**
- Create: `theme/sections/main-product.liquid`

- [ ] **Step 1:** Create `theme/sections/main-product.liquid`:
```liquid
{%- assign showAll = section.settings.mostrar_todas_tallas -%}
<section class="pdp">
  <div class="pdp-gallery">
    <div class="pdp-thumbs">
      {%- for image in product.images -%}
        <div class="pdp-thumb {% if forloop.first %}active{% endif %}" data-img="{{ image | image_url: width: 1200 }}" style="background-image:url({{ image | image_url: width: 200 }})"></div>
      {%- endfor -%}
    </div>
    <div class="pdp-main" style="background-image:url({{ product.featured_image | image_url: width: 1200 }})"></div>
  </div>
  <div class="pdp-info">
    <div class="pdp-eyebrow">{{ product.type | default: 'Atelier' }}</div>
    <h1 class="pdp-title">{{ product.title }}</h1>
    {% render 'price', price: product.price %}
    <div class="pdp-desc">{{ product.description }}</div>
    {%- if product.variants.size > 1 or product.options.first == 'Talla' -%}
    <div class="pdp-sizes-head">
      <span class="pdp-sizes-label">Talla</span>
      <button type="button" class="pdp-size-guide">Guía de tallas</button>
    </div>
    <div class="pdp-sizes">
      {%- for v in product.variants -%}
        {%- assign avail = showAll | default: v.available -%}
        <button type="button" class="pdp-size {% unless avail %}soldout{% endunless %}" data-variant-id="{{ v.id }}" {% unless avail %}aria-disabled="true"{% endunless %}>{{ v.title }}</button>
      {%- endfor -%}
    </div>
    {%- endif -%}
    <button type="button" class="pdp-add" data-add-to-cart>Elige una talla</button>
    <div class="pdp-madein">✦ Hecho a mano en España</div>
  </div>
</section>

<!-- Sticky móvil -->
<div class="pdp-sticky">
  <div><div class="pdp-eyebrow" style="margin:0">{{ product.title }}</div>{% render 'price', price: product.price %}</div>
  <button type="button" class="pdp-add" data-add-to-cart>Elige una talla</button>
</div>

{% render 'size-guide' %}

<!-- Completa el look -->
{%- assign rel = product.collections.first -%}
{%- if rel -%}
<section class="completa">
  <div class="section-head reveal"><div><div class="section-label">Completa el look</div><h2 class="section-title">También te puede gustar</h2></div></div>
  <div class="product-grid">
    {%- assign n = 0 -%}
    {%- for p in rel.products -%}
      {%- if p.id != product.id and n < 4 -%}
        {% render 'product-card', product: p, delay: 0 %}{%- assign n = n | plus: 1 -%}
      {%- endif -%}
    {%- endfor -%}
  </div>
</section>
{%- endif -%}

<script type="application/ld+json">
{
  "@context":"https://schema.org/","@type":"Product",
  "name": {{ product.title | json }},
  "image": [{{ product.featured_image | image_url: width: 1200 | prepend: 'https:' | json }}],
  "description": {{ product.description | strip_html | truncate: 300 | json }},
  "brand": {"@type":"Brand","name":"Grupo Juana Sánchez"},
  "offers": {"@type":"Offer","priceCurrency":"EUR","price": "{{ product.price | divided_by: 100.0 }}","availability":"https://schema.org/InStock","url": {{ shop.url | append: product.url | json }}}
}
</script>

<script src="{{ 'product.js' | asset_url }}" defer></script>
{% schema %}
{
  "name": "Ficha de producto",
  "settings": [
    { "type": "checkbox", "id": "mostrar_todas_tallas", "label": "Mostrar todas las tallas como disponibles (mientras no haya inventario real)", "default": true }
  ]
}
{% endschema %}
```
NOTE: `product.js` se carga aquí (no en theme.liquid) porque solo aplica a la ficha. El JSON-LD pone `InStock` fijo mientras `mostrar_todas_tallas` esté ON; cuando se cargue inventario real, condicionar a `product.available`.

- [ ] **Step 2:** `shopify theme check` · `git add sections/main-product.liquid && git commit -m "feat: main-product section"`

---

## Task 6: Plantilla `product.json`

**Files:**
- Modify/Create: `theme/templates/product.json`

- [ ] **Step 1:** Reemplazar `theme/templates/product.json`:
```json
{ "sections": { "main": { "type": "main-product" } }, "order": ["main"] }
```
- [ ] **Step 2: Theme check final + commit**
```bash
shopify theme check 2>&1 | tail -15
git add templates/product.json && git commit -m "feat: product template"
```

---

## Task 7: Verificación (ACCIÓN USUARIO)
- [ ] Subir tema → preview de un producto activo (`/products/<handle>`). Comprobar: galería (miniatura cambia principal, zoom desktop), tallas en botones (con D-1 ON todas activas), elegir talla habilita "Añadir", añadir abre el **drawer** del Plan 6, guía de tallas abre modal, "Completa el look" muestra relacionados, sticky bar en móvil, JSON-LD válido (Rich Results test). Capturas.

---

## Self-Review
**1. Cobertura spec §5.2:** galería grande+miniaturas+zoom (Tasks 2,4,5), info+precio (Tasks 1,5), selector talla en botones con soldout/showAll D-1 (Tasks 2,4,5), add-to-cart AJAX→drawer vía `window.Cart.add` (Task 4, depende Plan 6), guía tallas modal (Task 3), completa el look reusando product-card (Task 5), sticky móvil (Tasks 2,4,5), JSON-LD Product (Task 5). ✔
**2. Placeholders:** ninguno; código completo. Tabla cm orientativa (marcado). Task 7 = acción usuario.
**3. Consistencia:** `.pdp*` coherentes CSS↔Liquid↔JS; `data-variant-id`/`data-add-to-cart`/`.pdp-size.soldout` usados igual en Task 4 y 5; `window.Cart.add(id)` = API del Plan 6; `product-card` (Plan 3) y `price` (Task 1) reutilizados; setting `mostrar_todas_tallas` usado en Liquid (Task 5) y respeta D-1. `.modal*` del size-guide reusa clases del modal existente.

---

## Execution Handoff
Plan 5 (Ficha) completo y guardado en `docs/superpowers/plans/2026-05-28-fase-2-plan5-ficha.md`. Falta el Plan 4 (Colección). Orden de ejecución: Plan 6 → **Plan 5** → Plan 4.
