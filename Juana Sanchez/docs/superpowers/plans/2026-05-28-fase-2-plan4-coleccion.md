# Fase 2 · Plan 4 — Colección + filtros Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Plantilla de colección editorial: cabecera, **grid** (reusa `product-card`), **filtros nativos de Shopify** por ocasión / color / talla + **orden** (novedad, precio), paginación y estado vacío; en móvil, drawer de filtros.

**Architecture:** `main-collection.liquid` (sección de `collection.json`) usa el sistema de **storefront filtering nativo** de Shopify (`collection.filters`, form GET con `?filter.*` y `?sort_by`), sin estado custom. El snippet `collection-filters.liquid` renderiza las facetas y el orden. Reutiliza tokens/clases de marca + `product-card`. Las facetas (ocasión=`custom.ocasion`, color=`custom.color_familia`, talla=opción variante, precio) se activan en la app **Search & Discovery** del admin (paso de setup documentado).

**Tech Stack:** Shopify Liquid (storefront filters + paginate), JS mínimo (drawer de filtros móvil), CSS con design tokens. Reutiliza `product-card` (Plan 3).

**Repo:** `Online store/tienda online/theme/`. Verificación: `shopify theme check` 0 errores + preview. Commit por tarea.

---

## Task 1: CSS de colección (en `assets/juana-sanchez.css`)

**Files:** Modify: `theme/assets/juana-sanchez.css` (añadir al final)

- [ ] **Step 1:** Añadir AL FINAL:
```css
/* ═══════ COLECCIÓN ═══════ */
.coll-head{max-width:var(--maxw);margin:0 auto;padding:70px var(--pad-x) 24px;text-align:center}
.coll-head .section-label{justify-content:center}
.coll-title{font-family:var(--f-display);font-size:clamp(34px,5vw,64px);color:var(--ink);line-height:1.05}
.coll-desc{font-family:var(--f-serif);font-size:17px;color:var(--ink-3);max-width:560px;margin:14px auto 0}
.coll-bar{max-width:var(--maxw);margin:0 auto;padding:0 var(--pad-x);display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:16px}
.coll-count{font-family:var(--f-sans);font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--ink-3)}
.coll-body{max-width:var(--maxw);margin:0 auto;padding:32px var(--pad-x) 90px;display:grid;grid-template-columns:230px 1fr;gap:48px;align-items:start}
.coll-filters .filter-group{border-bottom:1px solid var(--line);padding:14px 0}
.coll-filters summary{font-family:var(--f-sans);font-size:12px;letter-spacing:2px;text-transform:uppercase;color:var(--ink-2);cursor:pointer;list-style:none;display:flex;justify-content:space-between}
.coll-filters summary::-webkit-details-marker{display:none}
.coll-filters .filter-values{margin-top:12px;display:flex;flex-direction:column;gap:8px}
.coll-filters label{font-family:var(--f-serif);font-size:15px;color:var(--ink-2);display:flex;gap:8px;align-items:center;cursor:pointer}
.coll-sort select{font-family:var(--f-sans);font-size:12px;letter-spacing:1px;border:1px solid var(--line-2);background:var(--paper);padding:8px 12px;color:var(--ink-2)}
.coll-filters-toggle{display:none;font-family:var(--f-sans);font-size:12px;letter-spacing:2px;text-transform:uppercase;border:1px solid var(--line-2);background:var(--paper);padding:10px 18px}
.coll-empty{text-align:center;padding:80px 0;font-family:var(--f-serif);font-size:18px;color:var(--ink-3)}
.coll-pagination{display:flex;gap:14px;justify-content:center;padding:50px 0;font-family:var(--f-sans);font-size:13px}
.coll-pagination a,.coll-pagination span{color:var(--ink-3)}.coll-pagination .current{color:var(--ink);border-bottom:1px solid var(--mauve)}
.active-filters{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px}
.active-filter{font-family:var(--f-sans);font-size:11px;letter-spacing:1px;background:var(--cream-warm);padding:6px 12px;color:var(--ink-2)}
@media (max-width:968px){
  .coll-body{grid-template-columns:1fr;padding:20px}
  .coll-filters{position:fixed;inset:0;z-index:200;background:var(--paper);transform:translateX(-100%);transition:transform .4s var(--ease-out);padding:24px;overflow-y:auto}
  .coll-filters.open{transform:translateX(0)}
  .coll-filters-toggle{display:inline-block}
}
```
- [ ] **Step 2:** `shopify theme check 2>&1 | grep -i error | head` · `git add assets/juana-sanchez.css && git commit -m "feat: collection styles"`

---

## Task 2: Snippet `collection-filters.liquid`

**Files:** Create: `theme/snippets/collection-filters.liquid`

- [ ] **Step 1:** Create `theme/snippets/collection-filters.liquid`:
```liquid
<form method="get" class="coll-filters-form" id="collFiltersForm">
  {%- comment -%} preserva el orden actual al filtrar {%- endcomment -%}
  {%- if collection.sort_by != blank -%}<input type="hidden" name="sort_by" value="{{ collection.sort_by }}">{%- endif -%}
  <div class="coll-filters" id="collFilters">
    {%- for filter in collection.filters -%}
      <details class="filter-group" open>
        <summary>{{ filter.label }} <span>+</span></summary>
        <div class="filter-values">
          {%- case filter.type -%}
          {%- when 'list', 'boolean' -%}
            {%- for value in filter.values -%}
              <label>
                <input type="checkbox" name="{{ value.param_name }}" value="{{ value.value | escape }}" {% if value.active %}checked{% endif %} {% if value.count == 0 and value.active == false %}disabled{% endif %} onchange="document.getElementById('collFiltersForm').submit()">
                {{ value.label }} ({{ value.count }})
              </label>
            {%- endfor -%}
          {%- when 'price_range' -%}
            <div style="display:flex;gap:8px;align-items:center">
              <input type="number" name="{{ filter.min_value.param_name }}" value="{{ filter.min_value.value }}" placeholder="Mín €" style="width:70px">
              <input type="number" name="{{ filter.max_value.param_name }}" value="{{ filter.max_value.value }}" placeholder="Máx €" style="width:70px">
              <button type="submit" class="btn-link">OK</button>
            </div>
          {%- endcase -%}
        </div>
      </details>
    {%- endfor -%}
    {%- if collection.filters.size > 0 -%}
      <a href="{{ collection.url }}" class="active-filter" style="margin-top:16px;display:inline-block">Limpiar filtros</a>
    {%- endif -%}
  </div>
</form>
```
NOTE: las facetas solo aparecen si están **activadas en Search & Discovery** (Task 5). Sin activar, `collection.filters` viene vacío y se ve solo el grid.

- [ ] **Step 2:** `shopify theme check` · `git add snippets/collection-filters.liquid && git commit -m "feat: collection-filters snippet (native facets)"`

---

## Task 3: Sección `main-collection.liquid`

**Files:** Create: `theme/sections/main-collection.liquid`

- [ ] **Step 1:** Create `theme/sections/main-collection.liquid`:
```liquid
<div class="coll-head">
  <div class="section-label">{{ collection.metafields.custom.eyebrow | default: 'Colección' }}</div>
  <h1 class="coll-title">{{ collection.title }}</h1>
  {%- if collection.description != blank -%}<p class="coll-desc">{{ collection.description }}</p>{%- endif -%}
</div>

<div class="coll-bar">
  <button class="coll-filters-toggle" onclick="document.getElementById('collFilters').classList.toggle('open')">Filtros</button>
  <div class="coll-count">{{ collection.products_count }} piezas</div>
  <div class="coll-sort">
    <select onchange="(function(s){var u=new URL(location);u.searchParams.set('sort_by',s.value);location=u})(this)" aria-label="Ordenar">
      {%- assign current = collection.sort_by | default: collection.default_sort_by -%}
      {%- for opt in collection.sort_options -%}
        <option value="{{ opt.value }}" {% if opt.value == current %}selected{% endif %}>{{ opt.name }}</option>
      {%- endfor -%}
    </select>
  </div>
</div>

<div class="coll-body">
  {% render 'collection-filters' %}
  <div>
    {%- paginate collection.products by 24 -%}
      {%- if collection.products.size > 0 -%}
        <div class="product-grid">
          {%- for product in collection.products -%}
            {%- assign d = forloop.index0 | modulo: 3 | times: 100 -%}
            {% render 'product-card', product: product, delay: d %}
          {%- endfor -%}
        </div>
        {%- if paginate.pages > 1 -%}
          <div class="coll-pagination">
            {%- if paginate.previous -%}<a href="{{ paginate.previous.url }}">← Anterior</a>{%- endif -%}
            {%- for part in paginate.parts -%}
              {%- if part.is_link -%}<a href="{{ part.url }}">{{ part.title }}</a>
              {%- else -%}<span class="current">{{ part.title }}</span>{%- endif -%}
            {%- endfor -%}
            {%- if paginate.next -%}<a href="{{ paginate.next.url }}">Siguiente →</a>{%- endif -%}
          </div>
        {%- endif -%}
      {%- else -%}
        <div class="coll-empty">No hay piezas para estos filtros. <a href="{{ collection.url }}" class="btn-link">Limpiar filtros</a></div>
      {%- endif -%}
    {%- endpaginate -%}
  </div>
</div>
{% schema %}
{ "name": "Colección", "settings": [] }
{% endschema %}
```

- [ ] **Step 2:** `shopify theme check` · `git add sections/main-collection.liquid && git commit -m "feat: main-collection section (grid + filters + pagination)"`

---

## Task 4: Plantilla `collection.json`

**Files:** Modify/Create: `theme/templates/collection.json`

- [ ] **Step 1:** Reemplazar `theme/templates/collection.json`:
```json
{ "sections": { "main": { "type": "main-collection" } }, "order": ["main"] }
```
- [ ] **Step 2:** `shopify theme check 2>&1 | tail -15` · `git add templates/collection.json && git commit -m "feat: collection template"`

---

## Task 5: Documentar setup de facetas (Search & Discovery)

**Files:** Modify: `Online store/tienda online/import/shopify-setup.md` (añadir sección)

- [ ] **Step 1:** Añadir a `import/shopify-setup.md`:
```markdown
## Filtros de colección (app Search & Discovery)
Instalar la app gratuita **Search & Discovery** de Shopify → pestaña **Filtros** → añadir:
- **Ocasión** → fuente: metafield `custom.ocasion`
- **Color** → fuente: metafield `custom.color_familia`
- **Talla** → fuente: opción de producto "Talla"
- **Precio** → filtro de precio (nativo)
Sin esto, `collection.filters` viene vacío y la colección muestra solo el grid + orden.
```
- [ ] **Step 2:** (no es repo git la carpeta padre) — solo guardar el archivo.

---

## Task 6: Verificación (ACCIÓN USUARIO)
- [ ] Subir tema → preview de una colección (p. ej. `/collections/comunion`). Con facetas activadas: filtrar por ocasión/color/talla recarga el grid (`?filter.*`), el orden funciona (`?sort_by`), paginación a 24, estado vacío correcto, drawer de filtros en móvil. Capturas.

---

## Self-Review
**1. Cobertura spec §5.1:** grid reusando product-card (Task 3), filtros nativos ocasión/color/talla/precio (Tasks 2,5), orden (Task 3), cabecera editorial (Task 3), paginación 24 (Task 3), estado vacío (Task 3), drawer filtros móvil (Tasks 1,3), setup facetas documentado (Task 5). ✔
**2. Placeholders:** ninguno; Liquid/CSS completo. Task 6 = acción usuario. Las facetas dependen de la app (documentado, no es un placeholder de plan).
**3. Consistencia:** clases `.coll-*`/`.filter-*` coherentes CSS↔Liquid; `product-card` (Plan 3) reutilizado con `delay`; filtros usan la API nativa `collection.filters`/`sort_options`/`paginate`; metafields `custom.ocasion`/`custom.color_familia` = los del Plan 2; `#collFilters`/`#collFiltersForm` consistentes entre snippet (Task 2) y toggle (Task 3).

---

## Execution Handoff
Plan 4 (Colección) completo y guardado en `docs/superpowers/plans/2026-05-28-fase-2-plan4-coleccion.md`. **Fase 2 ya tiene sus 3 planes** (6 Carrito · 5 Ficha · 4 Colección). Orden de ejecución recomendado: Plan 6 → Plan 5 → Plan 4.
