# Fase 2 · Plan 6 — Carrito (drawer + página) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Carrito de la tienda: un **drawer lateral** que abre al añadir un producto y desde el icono de carrito del header, más una página `/cart` completa, ambos con cantidades AJAX, subtotal, barra de progreso "envío gratis desde 300€" y CTA al checkout de Shopify.

**Architecture:** `cart.js` encapsula toda la interacción con la **Cart AJAX API** de Shopify (`/cart/add.js`, `/cart/change.js`, `/cart.js`) y re-renderiza el drawer con la **Section Rendering API** (`?sections=cart-drawer`). El drawer es una sección (`cart-drawer.liquid`) renderizada en `theme.liquid`; la página `/cart` usa `main-cart.liquid`. Reutiliza los tokens/clases de `assets/juana-sanchez.css` y el lenguaje visual del modal Área Empresarial (panel deslizante). Es la **base** sobre la que el Plan 5 (ficha) engancha su botón "añadir".

**Tech Stack:** Shopify Liquid (sections), JS vanilla (fetch + Cart AJAX + Section Rendering API), CSS con design tokens de la marca.

**Repo del tema:** `Online store/tienda online/theme/` (repo git propio). **Verificación:** `shopify theme check` (0 errores) por tarea + preview en Shopify (acción usuario al final). No hay tests unitarios.

---

## Notas
- Ejecutar desde `Online store/tienda online/theme/`. Commit por tarea (repo git).
- El drawer reusa el patrón visual del modal Área Empresarial (panel lateral, backdrop, cierre con ×/Esc).
- El badge del carrito ya existe en `header.liquid`: `<span class="cart-badge">{{ cart.item_count }}</span>`.

---

## Task 1: Estilos del carrito (CSS) en `assets/juana-sanchez.css`

**Files:**
- Modify: `theme/assets/juana-sanchez.css` (añadir al final)

- [ ] **Step 1: Añadir el bloque CSS del carrito**

Añadir AL FINAL de `theme/assets/juana-sanchez.css`:
```css
/* ═══════ CARRITO (drawer + página) ═══════ */
.cart-drawer{position:fixed;inset:0;z-index:300;visibility:hidden;pointer-events:none}
.cart-drawer.open{visibility:visible;pointer-events:auto}
.cart-drawer-backdrop{position:absolute;inset:0;background:rgba(26,22,18,.4);opacity:0;transition:opacity .4s var(--ease-out)}
.cart-drawer.open .cart-drawer-backdrop{opacity:1}
.cart-drawer-panel{position:absolute;top:0;right:0;height:100%;width:min(440px,92vw);background:var(--paper);display:flex;flex-direction:column;transform:translateX(100%);transition:transform .45s var(--ease-out);box-shadow:-20px 0 60px rgba(26,22,18,.14)}
.cart-drawer.open .cart-drawer-panel{transform:translateX(0)}
.cart-drawer-head{display:flex;align-items:center;justify-content:space-between;padding:24px 28px;border-bottom:1px solid var(--line)}
.cart-drawer-title{font-family:var(--f-display);font-size:22px;color:var(--ink)}
.cart-drawer-close{font-size:26px;line-height:1;color:var(--ink-3);background:none;border:none}
.cart-ship-bar{padding:14px 28px;border-bottom:1px solid var(--line);font-family:var(--f-sans);font-size:11px;letter-spacing:1px;color:var(--ink-3);text-transform:uppercase}
.cart-ship-track{height:3px;background:var(--line-2);margin-top:8px;border-radius:2px;overflow:hidden}
.cart-ship-fill{height:100%;background:var(--gold);transition:width .5s var(--ease-out)}
.cart-items{flex:1;overflow-y:auto;padding:8px 28px}
.cart-line{display:grid;grid-template-columns:64px 1fr auto;gap:14px;padding:18px 0;border-bottom:1px solid var(--line)}
.cart-line-img{width:64px;height:80px;background-size:cover;background-position:center;background-color:var(--bone)}
.cart-line-name{font-family:var(--f-serif);font-size:16px;color:var(--ink)}
.cart-line-variant{font-family:var(--f-sans);font-size:11px;letter-spacing:1px;color:var(--ink-3);text-transform:uppercase;margin-top:2px}
.cart-qty{display:inline-flex;align-items:center;gap:10px;margin-top:8px;border:1px solid var(--line-2);padding:4px 8px}
.cart-qty button{background:none;border:none;font-size:15px;color:var(--ink-2);width:18px}
.cart-line-price{font-family:var(--f-sans);font-size:14px;color:var(--ink)}
.cart-line-remove{display:block;margin-top:8px;font-family:var(--f-sans);font-size:10px;letter-spacing:1px;color:var(--ink-4);text-transform:uppercase;text-decoration:underline;background:none;border:none}
.cart-foot{padding:22px 28px;border-top:1px solid var(--line)}
.cart-subtotal{display:flex;justify-content:space-between;font-family:var(--f-sans);font-size:13px;letter-spacing:1px;text-transform:uppercase;color:var(--ink);margin-bottom:16px}
.cart-checkout{display:block;width:100%;text-align:center;background:var(--mauve);color:var(--cream);padding:16px;font-family:var(--f-sans);font-size:12px;letter-spacing:2px;text-transform:uppercase;border:none;transition:background .3s}
.cart-checkout:hover{background:var(--mauve-deep)}
.cart-empty{padding:60px 28px;text-align:center;font-family:var(--f-serif);font-size:18px;color:var(--ink-3)}
@media (prefers-reduced-motion:reduce){.cart-drawer-panel,.cart-drawer-backdrop,.cart-ship-fill{transition:none}}
/* página /cart */
.cart-page{max-width:var(--maxw);margin:0 auto;padding:80px var(--pad-x)}
.cart-page .cart-line{grid-template-columns:90px 1fr auto auto}
```

- [ ] **Step 2: Verificar + commit**
```bash
shopify theme check 2>&1 | grep -i error | head
git add assets/juana-sanchez.css && git commit -m "feat: cart styles (drawer + page)"
```

---

## Task 2: Sección `cart-drawer.liquid`

**Files:**
- Create: `theme/sections/cart-drawer.liquid`

- [ ] **Step 1: Crear la sección**

Create `theme/sections/cart-drawer.liquid`:
```liquid
{%- assign threshold = settings.free_shipping_threshold | times: 100 -%}
{%- assign remaining = threshold | minus: cart.total_price -%}
<div class="cart-drawer" id="cartDrawer" aria-hidden="true">
  <div class="cart-drawer-backdrop" data-cart-close></div>
  <aside class="cart-drawer-panel" role="dialog" aria-label="Carrito">
    <div class="cart-drawer-head">
      <div class="cart-drawer-title">Tu carrito ({{ cart.item_count }})</div>
      <button class="cart-drawer-close" data-cart-close aria-label="Cerrar">&times;</button>
    </div>
    {%- if cart.item_count > 0 -%}
      <div class="cart-ship-bar">
        {%- if remaining > 0 -%}
          Te faltan {{ remaining | money }} para el envío gratis
        {%- else -%}
          ✦ Envío gratis conseguido
        {%- endif -%}
        <div class="cart-ship-track"><div class="cart-ship-fill" style="width: {% if cart.total_price >= threshold %}100{% else %}{{ cart.total_price | times: 100.0 | divided_by: threshold }}{% endif %}%"></div></div>
      </div>
      <div class="cart-items">
        {%- for item in cart.items -%}
          <div class="cart-line" data-line="{{ forloop.index }}">
            <div class="cart-line-img" style="background-image:url({{ item.image | image_url: width: 200 }})"></div>
            <div>
              <div class="cart-line-name">{{ item.product.title }}</div>
              {%- unless item.variant.title contains 'Default' -%}<div class="cart-line-variant">Talla {{ item.variant.title }}</div>{%- endunless -%}
              <div class="cart-qty">
                <button data-qty-down aria-label="Menos">−</button>
                <span data-qty>{{ item.quantity }}</span>
                <button data-qty-up aria-label="Más">+</button>
              </div>
              <button class="cart-line-remove" data-remove>Eliminar</button>
            </div>
            <div class="cart-line-price">{{ item.final_line_price | money }}</div>
          </div>
        {%- endfor -%}
      </div>
      <div class="cart-foot">
        <div class="cart-subtotal"><span>Subtotal</span><span>{{ cart.total_price | money }}</span></div>
        <a href="{{ routes.cart_url }}/checkout" class="cart-checkout">Finalizar compra</a>
      </div>
    {%- else -%}
      <div class="cart-empty">Tu carrito está vacío.</div>
    {%- endif -%}
  </aside>
</div>
{% schema %}
{ "name": "Carrito (drawer)", "settings": [] }
{% endschema %}
```

- [ ] **Step 2: Verificar + commit**
```bash
shopify theme check 2>&1 | grep -iE "cart-drawer|error" | head
git add sections/cart-drawer.liquid && git commit -m "feat: cart-drawer section"
```

---

## Task 3: `cart.js` (Cart AJAX + Section Rendering)

**Files:**
- Create: `theme/assets/cart.js`

- [ ] **Step 1: Crear el script**

Create `theme/assets/cart.js`:
```javascript
// Cart AJAX + drawer (Section Rendering API)
const Cart = {
  drawer: () => document.getElementById('cartDrawer'),
  open() { const d = this.drawer(); if (d) { d.classList.add('open'); d.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; } },
  close() { const d = this.drawer(); if (d) { d.classList.remove('open'); d.setAttribute('aria-hidden','true'); document.body.style.overflow=''; } },
  async add(id, qty = 1) {
    const r = await fetch('/cart/add.js', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, quantity: qty }) });
    if (!r.ok) { const e = await r.json().catch(()=>({})); alert(e.description || 'No se pudo añadir al carrito.'); return false; }
    await this.refresh(); this.open(); return true;
  },
  async change(line, quantity) {
    await fetch('/cart/change.js', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ line, quantity }) });
    await this.refresh();
  },
  async refresh() {
    // re-render drawer via Section Rendering API
    const res = await fetch('/?sections=cart-drawer');
    const data = await res.json();
    const html = data['cart-drawer'];
    if (html) {
      const wrap = document.createElement('div'); wrap.innerHTML = html;
      const fresh = wrap.querySelector('#cartDrawer');
      const cur = this.drawer();
      if (fresh && cur) { const wasOpen = cur.classList.contains('open'); cur.replaceWith(fresh); if (wasOpen) this.open(); this.bindLines(); }
    }
    // update header badge
    const c = await (await fetch('/cart.js')).json();
    document.querySelectorAll('.cart-badge').forEach(b => b.textContent = c.item_count);
  },
  bindLines() {
    const d = this.drawer(); if (!d) return;
    d.querySelectorAll('[data-cart-close]').forEach(el => el.addEventListener('click', () => this.close()));
    d.querySelectorAll('.cart-line').forEach(line => {
      const idx = parseInt(line.dataset.line, 10);
      const qty = parseInt(line.querySelector('[data-qty]').textContent, 10);
      line.querySelector('[data-qty-up]')?.addEventListener('click', () => this.change(idx, qty + 1));
      line.querySelector('[data-qty-down]')?.addEventListener('click', () => this.change(idx, Math.max(0, qty - 1)));
      line.querySelector('[data-remove]')?.addEventListener('click', () => this.change(idx, 0));
    });
  }
};
window.Cart = Cart;
document.addEventListener('DOMContentLoaded', () => {
  Cart.bindLines();
  document.addEventListener('keydown', e => { if (e.key === 'Escape') Cart.close(); });
  // icono carrito del header abre el drawer
  document.querySelectorAll('a[href$="/cart"], .nav-act[aria-label="Carrito"]').forEach(a =>
    a.addEventListener('click', e => { if (Cart.drawer()) { e.preventDefault(); Cart.refresh().then(()=>Cart.open()); } }));
});
```

- [ ] **Step 2: Verificar sintaxis + commit**
```bash
node --check assets/cart.js && echo OK
git add assets/cart.js && git commit -m "feat: cart.js (AJAX + section rendering drawer)"
```

---

## Task 4: Render del drawer + script en `theme.liquid`

**Files:**
- Modify: `theme/layout/theme.liquid`

- [ ] **Step 1: Renderizar el drawer y cargar cart.js**

En `theme.liquid`, localizar `{% render 'modal-empresarial' %}` y añadir justo después:
```liquid
  {% render 'modal-empresarial' %}
  {% section 'cart-drawer' %}
```
Y junto a los `<script src=...>` existentes (cursor.js/animations.js), añadir:
```liquid
  <script src="{{ 'cart.js' | asset_url }}" defer></script>
```

- [ ] **Step 2: Verificar + commit**
```bash
shopify theme check 2>&1 | grep -iE "theme.liquid|error" | head
git add layout/theme.liquid && git commit -m "feat: render cart-drawer + load cart.js"
```

---

## Task 5: Página `/cart` (`main-cart.liquid` + `cart.json`)

**Files:**
- Create: `theme/sections/main-cart.liquid`
- Modify/Create: `theme/templates/cart.json`

- [ ] **Step 1: Crear `main-cart.liquid`**

Create `theme/sections/main-cart.liquid`:
```liquid
<section class="cart-page">
  <div class="section-label">Tu carrito</div>
  <h1 class="section-title" style="margin-bottom:40px">Carrito ({{ cart.item_count }})</h1>
  {%- if cart.item_count > 0 -%}
    <form action="{{ routes.cart_url }}" method="post">
      {%- for item in cart.items -%}
        <div class="cart-line">
          <div class="cart-line-img" style="background-image:url({{ item.image | image_url: width: 240 }})"></div>
          <div>
            <div class="cart-line-name">{{ item.product.title }}</div>
            {%- unless item.variant.title contains 'Default' -%}<div class="cart-line-variant">Talla {{ item.variant.title }}</div>{%- endunless -%}
          </div>
          <input type="number" name="updates[]" value="{{ item.quantity }}" min="0" aria-label="Cantidad" style="width:60px">
          <div class="cart-line-price">{{ item.final_line_price | money }}</div>
        </div>
      {%- endfor -%}
      <div class="cart-subtotal" style="margin-top:24px"><span>Subtotal</span><span>{{ cart.total_price | money }}</span></div>
      <div style="display:flex;gap:16px;margin-top:24px">
        <button type="submit" name="update" class="btn-link">Actualizar</button>
        <button type="submit" name="checkout" class="cart-checkout" style="width:auto;padding:16px 40px">Finalizar compra</button>
      </div>
    </form>
  {%- else -%}
    <div class="cart-empty">Tu carrito está vacío. <a href="{{ routes.all_products_collection_url }}" class="btn-link">Ver la colección</a></div>
  {%- endif -%}
</section>
{% schema %}
{ "name": "Carrito", "settings": [] }
{% endschema %}
```

- [ ] **Step 2: `cart.json`**

Reemplazar/crear `theme/templates/cart.json`:
```json
{ "sections": { "main": { "type": "main-cart" } }, "order": ["main"] }
```

- [ ] **Step 3: Theme check final + commit**
```bash
shopify theme check 2>&1 | tail -15
git add sections/main-cart.liquid templates/cart.json && git commit -m "feat: /cart page"
```

---

## Task 6: Verificación (ACCIÓN USUARIO)

- [ ] **Step 1:** Subir el tema a My Store 4 (zip o GitHub) → preview. Con al menos un producto activo, añadirlo (cuando el Plan 5 enganche el add; o probar con un producto desde su URL `/products/x?variant=...` + `window.Cart.add(<variantId>)` en consola).
- [ ] **Step 2:** Comprobar: el icono de carrito del header abre el drawer; ± cantidades actualizan subtotal y badge sin recargar; barra de envío gratis refleja el progreso hacia 300€; "Finalizar compra" lleva al checkout de Shopify; página `/cart` funciona. Capturas.

---

## Self-Review

**1. Cobertura del spec §5.3:** drawer lateral (Task 2), abre al añadir + desde header (Task 3), líneas con ± AJAX (Task 2+3), subtotal (Task 2), barra envío gratis 300€ (Task 2, usa `settings.free_shipping_threshold`), CTA checkout (Task 2), página `/cart` (Task 5), `cart.js` Cart AJAX + badge header (Task 3). ✔

**2. Placeholders:** ninguno; todo el Liquid/JS/CSS es completo. Task 6 es acción usuario (preview Shopify, requiere credenciales).

**3. Consistencia:** `#cartDrawer`, clases `.cart-*` coherentes entre CSS (Task 1), sección (Task 2) y JS (Task 3). `window.Cart.add(id)` es la API pública que el **Plan 5 (ficha)** llamará desde su botón añadir. Section Rendering key = nombre de sección `cart-drawer`. Badge `.cart-badge` ya existe en header. `settings.free_shipping_threshold` definido en el Plan 1.

---

## Execution Handoff

Plan 6 (Carrito) completo y guardado en `docs/superpowers/plans/2026-05-28-fase-2-plan6-carrito.md`. Es el primero del orden de ejecución (Carrito → Ficha → Colección). Faltan por escribir el Plan 5 (Ficha) y el Plan 4 (Colección).
