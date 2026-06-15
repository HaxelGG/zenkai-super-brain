# Fase A — Corrección de marca y mejora del boceto · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refinar el mockup `juana-sanchez-tienda-v2.html` con la marca correcta, un cursor de polvo de estrellas dorado, el hero preparado para vídeo cinematográfico y una barra de navegación editorial con mega-menús, sin tocar nada más.

**Architecture:** Un único archivo HTML standalone con `<style>` y `<script>` inline. Cada tarea aplica ediciones puntuales (find→replace exactos) o añade un bloque CSS/JS autónomo. La verificación es por **preview de navegador** + **grep de control** (no hay tests automatizados ni repo git). Todo el JS/CSS nuevo debe ser portable a `assets/` de un futuro tema Shopify sin reescritura.

**Tech Stack:** HTML5, CSS (custom properties ya definidas en `:root`), JavaScript vanilla (`requestAnimationFrame`, Canvas 2D, `matchMedia`). Fuentes: Fraunces / Cormorant Garamond / Italiana / Jost / JetBrains Mono.

**Archivo único:** `Online store/tienda online/juana-sanchez-tienda-v2.html` (rutas relativas a la raíz del proyecto `C:\Users\jordy\Desktop\Juana Sanchez`).

**Spec:** `docs/superpowers/specs/2026-05-27-fase-a-correccion-marca-mejora-boceto-design.md`

---

## Nota sobre verificación

- **Preview:** servir el archivo y abrirlo en el navegador (mcp `preview_start` apuntando al archivo, o un estático). Tras cada tarea: `preview_console_logs` (cero errores JS) + `preview_screenshot` (evidencia visual).
- **Grep de control:** comandos `grep` que deben devolver vacío o el resultado esperado.
- **No hay `git`** en este directorio → no hay pasos de commit. Si el usuario lo pide, se inicializa repo aparte.
- Todas las ediciones se hacen con la herramienta Edit usando el `old_string` mostrado (con contexto suficiente para ser único).

---

## Task 1: Correcciones de copy y marca

**Files:**
- Modify: `Online store/tienda online/juana-sanchez-tienda-v2.html`

- [ ] **Step 1: Title de la página (L8)**

`old_string`:
```html
<title>Juana Sánchez · Atelier de Ceremonia · Hecho en España</title>
```
`new_string`:
```html
<title>Grupo Juana Sánchez · Hecho en España</title>
```

- [ ] **Step 2: Loader (L1717-1718)**

`old_string`:
```html
  <div class="loader-mark">JUANA SÁNCHEZ</div>
  <div class="loader-sub">Atelier de Ceremonia · Hecho en España</div>
```
`new_string`:
```html
  <div class="loader-mark">GRUPO JUANA SÁNCHEZ</div>
  <div class="loader-sub">Hecho en España</div>
```

- [ ] **Step 3: Marca del header (L1751-1754)**

`old_string`:
```html
      <a href="#" class="brand">
        JUANA SÁNCHEZ
        <small>Atelier de Ceremonia</small>
      </a>
```
`new_string`:
```html
      <a href="#" class="brand">
        GRUPO JUANA SÁNCHEZ
        <small>Hecho en España</small>
      </a>
```

- [ ] **Step 4: Marca del modal (L2222-2223)**

`old_string`:
```html
    <div class="modal-mark">JUANA SÁNCHEZ</div>
    <div class="modal-mark-sub">◆ PORTAL MAYORISTA</div>
```
`new_string`:
```html
    <div class="modal-mark">GRUPO JUANA SÁNCHEZ</div>
    <div class="modal-mark-sub">◆ ÁREA EMPRESARIAL</div>
```

- [ ] **Step 5: Barra announce — años (replace_all)**

Usar Edit con `replace_all: true` (aparece 2 veces, L1727 y L1732):
`old_string`: `<span>+10 años de artesanía</span>`
`new_string`: `<span>+50 años de artesanía</span>`

- [ ] **Step 6: Manifiesto — años (L1822)**

`old_string`: `primero que ve son sus pies. Por eso llevamos diez años poniéndoles`
`new_string`: `primero que ve son sus pies. Por eso llevamos cincuenta años poniéndoles`

- [ ] **Step 7: Contador animado (L1831)**

`old_string`: `<span data-count="10">0</span><span class="counter-plus">+</span>`
`new_string`: `<span data-count="50">0</span><span class="counter-plus">+</span>`

- [ ] **Step 8: Hero meta — fundación (L1804)**

`old_string`: `<span>EST. 2014</span>`
`new_string`: `<span>EST. 1975</span>`

- [ ] **Step 9: Nav — etiqueta "Mayorista" → "Área Empresarial" (L1748)**

`old_string`:
```html
        <a href="#" class="pro" onclick="openModal(); return false;">Mayorista</a>
```
`new_string`:
```html
        <a href="#" class="pro" onclick="openModal(); return false;">Área Empresarial</a>
```
(Nota: la Task 4 reestructura el nav pero conserva esta etiqueta.)

- [ ] **Step 10: Footer — label B2B (L2138)**

`old_string`: `<div class="footer-b2b-label">◆ Mayorista · Boutiques &amp; Tiendas</div>`
`new_string`: `<div class="footer-b2b-label">◆ Área Empresarial · Boutiques &amp; Tiendas</div>`

- [ ] **Step 11: Footer — texto "precios mayoristas" (L2141-2142)**

`old_string`:
```html
          Trabajamos con más de 80 boutiques en España. Catálogo profesional,
          precios mayoristas, exclusividad por zona, atención personalizada.
```
`new_string`:
```html
          Trabajamos con más de 80 boutiques en España. Catálogo profesional,
          precios para empresas, exclusividad por zona, atención personalizada.
```

- [ ] **Step 12: Footer — link "Acceso mayoristas" (L2191)**

`old_string`: `<li><a href="#" onclick="openModal(); return false;">Acceso mayoristas</a></li>`
`new_string`: `<li><a href="#" onclick="openModal(); return false;">Acceso Área Empresarial</a></li>`

- [ ] **Step 13: Modal login — subtítulo (L2233)**

`old_string`: `<p class="modal-sub">Catálogo mayorista, precios netos, condiciones especiales por volumen y exclusividad geográfica.</p>`
`new_string`: `<p class="modal-sub">Catálogo profesional, precios netos, condiciones especiales por volumen y exclusividad geográfica.</p>`

- [ ] **Step 14: Modal login — alert demo (L2234)**

`old_string`: `<form onsubmit="event.preventDefault(); alert('Bienvenido al portal mayorista.');">`
`new_string`: `<form onsubmit="event.preventDefault(); alert('Bienvenido al Área Empresarial.');">`

- [ ] **Step 15: Modal registro — título (L2250)**

`old_string`:
```html
      <h2 class="modal-title">Solicita acceso<br>mayorista.</h2>
```
`new_string`:
```html
      <h2 class="modal-title">Solicita acceso<br>profesional.</h2>
```

- [ ] **Step 16: Verificación grep (sin residuos)**

Run (desde `Online store/tienda online/`):
```bash
grep -niE "mayorista|atelier de ceremonia|EST\. 2014|\+10 años|diez años" juana-sanchez-tienda-v2.html | grep -v base64
```
Expected: **sin resultados** (vacío). Si aparece algo, corregir esa ocurrencia.

Run (confirmar que la marca nueva está):
```bash
grep -nE "GRUPO JUANA SÁNCHEZ|Área Empresarial|data-count=\"50\"|EST\. 1975|\+50 años" juana-sanchez-tienda-v2.html | grep -v base64
```
Expected: varias coincidencias (title/loader/brand/modal/nav/footer/contador/hero).

- [ ] **Step 17: Verificación en navegador**

Abrir el archivo en el preview. Comprobar: loader muestra "GRUPO JUANA SÁNCHEZ", header muestra la marca nueva con "Hecho en España", el contador del manifiesto anima hasta **50+**, el hero-meta dice "EST. 1975", y el modal (abrir con el link del nav) muestra "◆ ÁREA EMPRESARIAL".
`preview_console_logs` → sin errores. `preview_screenshot` del header + manifiesto como evidencia.

---

## Task 2: Cursor — polvo de estrellas dorado

**Files:**
- Modify: `Online store/tienda online/juana-sanchez-tienda-v2.html` (markup L1713, CSS tras L108, JS L2385-2399)

**Contexto:** el cursor actual es `.cursor-dot#cursor` (CSS L85-108) seguido por JS (L2385-2399) con lerp + clase `.lg` sobre `.product-card, .ocasion-card, .proceso-play`. Se conserva ese punto guía y se añade una estela de partículas doradas en un `<canvas>` independiente.

- [ ] **Step 1: Añadir el canvas de la estela (tras L1713)**

`old_string`:
```html
<div class="cursor-dot" id="cursor"></div>
```
`new_string`:
```html
<div class="cursor-dot" id="cursor"></div>
<canvas class="stardust-canvas" id="stardust" aria-hidden="true"></canvas>
```

- [ ] **Step 2: Añadir CSS del canvas (justo después de la regla `@media (max-width: 968px) { .cursor-dot { display: none; } }`, L108)**

`old_string`:
```css
@media (max-width: 968px) { .cursor-dot { display: none; } }
```
`new_string`:
```css
@media (max-width: 968px) { .cursor-dot { display: none; } }
.stardust-canvas {
  position: fixed; inset: 0;
  width: 100vw; height: 100vh;
  pointer-events: none;
  z-index: 9998;
}
@media (max-width: 968px) { .stardust-canvas { display: none; } }
@media (prefers-reduced-motion: reduce) { .stardust-canvas { display: none; } }
```

- [ ] **Step 3: Reemplazar el bloque JS del cursor (L2385-2399)**

`old_string`:
```javascript
// CURSOR
const cursor = document.getElementById('cursor');
let mouseX = 0, mouseY = 0, cursorX = 0, cursorY = 0;
document.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });
function animateCursor() {
  cursorX += (mouseX - cursorX) * 0.18;
  cursorY += (mouseY - cursorY) * 0.18;
  cursor.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%, -50%)`;
  requestAnimationFrame(animateCursor);
}
animateCursor();
document.querySelectorAll('.product-card, .ocasion-card, .proceso-play').forEach(el => {
  el.addEventListener('mouseenter', () => cursor.classList.add('lg'));
  el.addEventListener('mouseleave', () => cursor.classList.remove('lg'));
});
```
`new_string`:
```javascript
// CURSOR + STARDUST (polvo de estrellas dorado)
const cursor = document.getElementById('cursor');
const sd = document.getElementById('stardust');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isDesktop = window.matchMedia('(min-width: 969px)').matches;
let mouseX = 0, mouseY = 0, cursorX = 0, cursorY = 0, lastX = 0, lastY = 0;
document.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });

// Punto guía (lerp)
function animateCursor() {
  cursorX += (mouseX - cursorX) * 0.18;
  cursorY += (mouseY - cursorY) * 0.18;
  cursor.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%, -50%)`;
  requestAnimationFrame(animateCursor);
}
animateCursor();
document.querySelectorAll('.product-card, .ocasion-card, .proceso-play').forEach(el => {
  el.addEventListener('mouseenter', () => cursor.classList.add('lg'));
  el.addEventListener('mouseleave', () => cursor.classList.remove('lg'));
});

// Estela de polvo de estrellas (canvas)
if (sd && isDesktop && !reduceMotion) {
  const ctx = sd.getContext('2d');
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  function resizeStardust() {
    sd.width = window.innerWidth * DPR;
    sd.height = window.innerHeight * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resizeStardust();
  window.addEventListener('resize', resizeStardust);

  const GOLD = ['#B58E47', '#D4B883', '#8E6E36', '#F4E4BC'];
  const MAX_PARTICLES = 120;
  const particles = [];

  function spawn(x, y, count) {
    for (let i = 0; i < count && particles.length < MAX_PARTICLES; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 0.6;
      particles.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.15,
        life: 1,
        decay: 0.012 + Math.random() * 0.02,
        size: 1.5 + Math.random() * 3,
        color: GOLD[(Math.random() * GOLD.length) | 0],
        twinkle: Math.random() * Math.PI * 2,
      });
    }
  }

  function loopStardust() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const dx = mouseX - lastX, dy = mouseY - lastY;
    const speed = Math.hypot(dx, dy);
    lastX = mouseX; lastY = mouseY;
    if (speed > 1.5) spawn(mouseX, mouseY, Math.min(3, Math.round(speed / 8)));

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.01;
      p.life -= p.decay; p.twinkle += 0.3;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      const alpha = Math.max(0, p.life * (0.6 + 0.4 * Math.sin(p.twinkle)));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    requestAnimationFrame(loopStardust);
  }
  loopStardust();
}
```

- [ ] **Step 4: Verificación en navegador**

Abrir el preview en desktop. Mover el ratón: debe aparecer una **estela de partículas doradas** que brillan (twinkle) y se desvanecen; el punto guía sigue funcionando y crece sobre product-cards. `preview_console_logs` → sin errores. `preview_screenshot` moviendo el cursor (o `preview_eval` para forzar movimiento si hace falta) como evidencia.

- [ ] **Step 5: Verificación reduced-motion + móvil**

`preview_eval`: comprobar que con `prefers-reduced-motion: reduce` (emular) el canvas `#stardust` está `display:none` y no se emiten partículas. `preview_resize` a 375px: el canvas y el cursor están ocultos (`@media max-width:968px`). Sin errores en consola.

---

## Task 3: Hero — soporte de vídeo cinematográfico

**Files:**
- Modify: `Online store/tienda online/juana-sanchez-tienda-v2.html` (L1792-1802, bloque `.hero-visual`)

**Contexto actual (L1792-1802):**
```html
  <div class="hero-visual">
    <!-- VIDEO PLACEHOLDER · El cliente subirá su video cinematográfico aquí -->
    <!-- Reemplazar el div siguiente por: ... -->
    <div class="hero-video" style="background-image: url(data:image...);"></div>
    <div class="hero-video-overlay"></div>
    <div class="hero-video-frame">REEL · 01 / 2026</div>
  </div>
```
La imagen base64 actual se conserva como **poster/fallback** mientras no haya vídeo.

- [ ] **Step 1: Localizar el atributo base64 del hero**

Run:
```bash
grep -n 'class="hero-video"' "Online store/tienda online/juana-sanchez-tienda-v2.html"
```
Anotar la línea exacta del `<div class="hero-video" style="background-image: url(data:image/...);"></div>`. El `data:image/...` es largo; al editar, copiar el `style` íntegro como parte del `old_string` (o editar solo la etiqueta de apertura conservando el resto).

- [ ] **Step 2: Convertir el placeholder en estructura de vídeo lista**

Reemplazar el bloque (conservando el valor base64 existente en `[POSTER_BASE64]` — no inventarlo, usar el real del archivo):

`old_string` (las dos líneas de comentario + el div hero-video):
```html
    <!-- VIDEO PLACEHOLDER · El cliente subirá su video cinematográfico aquí -->
    <!-- Reemplazar el div siguiente por:
         <video class="hero-video" autoplay muted loop playsinline poster="POSTER.jpg">
           <source src="hero-cinematic.mp4" type="video/mp4">
         </video>
    -->
    <div class="hero-video" style="background-image: url([POSTER_BASE64]);"></div>
```
`new_string`:
```html
    <!-- ════════════════════════════════════════════════════════════════ -->
    <!-- HERO · VÍDEO CINEMATOGRÁFICO                                       -->
    <!-- ▶ PARA ACTIVARLO: sube el vídeo (vertical 4:5, <2MB, SIN sonido)   -->
    <!--   y descomenta el <video> de abajo. El <div> con poster es el      -->
    <!--   fallback mientras no haya vídeo. En Shopify será un ajuste de    -->
    <!--   sección (video_url + poster).                                    -->
    <!-- ════════════════════════════════════════════════════════════════ -->
    <!--
    <video class="hero-video" autoplay muted loop playsinline preload="metadata"
           poster="[POSTER_BASE64]">
      <source src="hero-cinematic.webm" type="video/webm">
      <source src="hero-cinematic.mp4"  type="video/mp4">
    </video>
    -->
    <div class="hero-video" style="background-image: url([POSTER_BASE64]);">
      <span class="hero-video-badge">Vídeo próximamente</span>
    </div>
```

- [ ] **Step 3: CSS del badge del placeholder (añadir junto a las reglas de `.hero-video`)**

Localizar la regla `.hero-video-frame` en el `<style>` (Run: `grep -n "hero-video-frame" ...`) y añadir tras ella:
```css
.hero-video-badge {
  position: absolute;
  bottom: 18px; left: 18px;
  font-family: var(--f-sans);
  font-size: 9px;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--cream);
  background: rgba(26,22,18,0.55);
  padding: 6px 12px;
  border: 1px solid rgba(251,248,241,0.25);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
@media (prefers-reduced-motion: reduce) {
  .hero-video { /* sin animación; el poster ya es estático */ }
}
```

- [ ] **Step 4: Verificación**

Abrir el preview: el hero se ve igual que antes (poster intacto) con el badge discreto "Vídeo próximamente" abajo a la izquierda; el código tiene el `<video>` comentado y bien marcado para subir el vídeo. `preview_console_logs` → sin errores. `preview_screenshot` del hero como evidencia. Comprobar que no hay saltos de layout.

---

## Task 4: Navegación superior — rediseño editorial con mega-menús

**Files:**
- Modify: `Online store/tienda online/juana-sanchez-tienda-v2.html` (markup nav L1742-1749, CSS nav L207-298, JS: nuevo bloque al final del script, antes del cierre)

**Contexto actual:** `.nav` (L1742-1749) son 6 enlaces ancla; Comunión/Bautizo/Ceremonia van todos a `#ocasiones`. CSS en L207-298. En ≤968px `.nav` se oculta y aparece `.menu-trigger` (sin JS funcional en el mockup).

- [ ] **Step 1: Reemplazar el markup del nav (L1742-1749)**

`old_string`:
```html
      <nav class="nav">
        <a href="#coleccion">Colección</a>
        <a href="#ocasiones">Comunión</a>
        <a href="#ocasiones">Bautizo</a>
        <a href="#ocasiones">Ceremonia</a>
        <a href="#atelier">Atelier</a>
        <a href="#" class="pro" onclick="openModal(); return false;">Área Empresarial</a>
      </nav>
```
`new_string`:
```html
      <nav class="nav" id="nav">
        <div class="nav-item has-mega" data-mega="coleccion">
          <a href="#coleccion" aria-haspopup="true" aria-expanded="false">Colección</a>
          <div class="mega" role="menu" aria-label="Colección">
            <div class="mega-inner">
              <div class="mega-col">
                <span class="mega-label">Comunión 2026</span>
                <a href="#coleccion">Esparteñas</a>
                <a href="#coleccion">Manoletinas</a>
                <a href="#coleccion">Novedades</a>
                <a href="#coleccion">Edición limitada</a>
              </div>
              <div class="mega-col">
                <span class="mega-label">Por color</span>
                <a href="#coleccion">Rosa empolvado</a>
                <a href="#coleccion">Salvia</a>
                <a href="#coleccion">Marfil</a>
                <a href="#coleccion">Lavanda</a>
              </div>
              <a class="mega-feature" href="#coleccion">
                <span>Ver toda la colección</span>
                <span class="mega-arrow">→</span>
              </a>
            </div>
          </div>
        </div>
        <div class="nav-item has-mega" data-mega="ocasiones">
          <a href="#ocasiones" aria-haspopup="true" aria-expanded="false">Ocasiones</a>
          <div class="mega" role="menu" aria-label="Ocasiones">
            <div class="mega-inner">
              <div class="mega-col">
                <span class="mega-label">Celebra</span>
                <a href="#ocasiones">Comunión</a>
                <a href="#ocasiones">Bautizo</a>
                <a href="#ocasiones">Ceremonia</a>
                <a href="#ocasiones">Arras</a>
              </div>
              <a class="mega-feature" href="#ocasiones">
                <span>Encuentra tu ocasión</span>
                <span class="mega-arrow">→</span>
              </a>
            </div>
          </div>
        </div>
        <div class="nav-item"><a href="#atelier">Atelier</a></div>
        <div class="nav-item"><a href="#" class="pro" onclick="openModal(); return false;">Área Empresarial</a></div>
      </nav>
```

- [ ] **Step 2: Actualizar el CSS del nav (reemplazar bloque L207-239)**

`old_string`:
```css
.nav {
  display: flex;
  gap: 38px;
  font-family: var(--f-sans);
  font-size: 11px;
  font-weight: 300;
  letter-spacing: 2.5px;
  text-transform: uppercase;
}
.nav a {
  position: relative;
  padding: 6px 0;
  color: var(--ink-2);
}
.nav a::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0;
  width: 0; height: 1px;
  background: var(--mauve);
  transition: width .45s var(--ease-out);
}
.nav a:hover::after { width: 100%; }
.nav a.pro {
  color: var(--sage-deep);
  position: relative;
}
.nav a.pro::before {
  content: '◆';
  font-size: 8px;
  margin-right: 6px;
  color: var(--sage);
}
```
`new_string`:
```css
.nav {
  display: flex;
  align-items: center;
  gap: 38px;
  font-family: var(--f-sans);
  font-size: 11px;
  font-weight: 300;
  letter-spacing: 2.5px;
  text-transform: uppercase;
}
.nav-item { position: relative; }
.nav-item > a {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 0;
  color: var(--ink-2);
}
.nav-item > a::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0;
  width: 0; height: 1px;
  background: var(--mauve);
  transition: width .45s var(--ease-out);
}
.nav-item > a:hover::after,
.nav-item.open > a::after { width: 100%; }
.nav-item.has-mega > a::before {
  content: '';
  width: 4px; height: 4px;
  border-right: 1px solid var(--ink-4);
  border-bottom: 1px solid var(--ink-4);
  transform: rotate(45deg) translateY(-1px);
  transition: transform .35s var(--ease-out);
  order: 2;
}
.nav-item.has-mega.open > a::before { transform: rotate(-135deg) translateY(-1px); }
.nav a.pro { color: var(--sage-deep); }
.nav a.pro::before {
  content: '◆';
  font-size: 8px;
  margin-right: 6px;
  color: var(--sage);
  border: none; width: auto; height: auto; transform: none;
}

/* ─── Mega-menú editorial ─── */
.mega {
  position: absolute;
  top: calc(100% + 20px);
  left: 0;
  min-width: 380px;
  background: var(--paper);
  border: 1px solid var(--line);
  box-shadow: 0 30px 64px rgba(26,22,18,0.12);
  padding: 30px 34px;
  opacity: 0;
  visibility: hidden;
  transform: translateY(8px);
  transition: opacity .35s var(--ease-out), transform .35s var(--ease-out), visibility .35s;
  z-index: 120;
}
.nav-item.open .mega,
.nav-item:hover .mega { opacity: 1; visibility: visible; transform: translateY(0); }
.mega-inner { display: flex; gap: 44px; align-items: flex-start; }
.mega-col { display: flex; flex-direction: column; gap: 11px; }
.mega-label {
  font-family: var(--f-sans);
  font-size: 9px; letter-spacing: 3px; text-transform: uppercase;
  color: var(--ink-4); margin-bottom: 4px;
}
.mega-col a {
  font-family: var(--f-serif);
  font-size: 17px; letter-spacing: .3px; text-transform: none;
  color: var(--ink-2); padding: 0;
  transition: color .25s, transform .25s var(--ease-out);
}
.mega-col a::after { display: none; }
.mega-col a:hover { color: var(--mauve-deep); transform: translateX(4px); }
.mega-feature {
  display: inline-flex; align-items: center; gap: 10px; align-self: flex-end;
  font-family: var(--f-sans); font-size: 10px; letter-spacing: 2px; text-transform: uppercase;
  color: var(--mauve); padding: 0; white-space: nowrap;
}
.mega-feature::after { display: none; }
.mega-arrow { transition: transform .3s var(--ease-out); }
.mega-feature:hover .mega-arrow { transform: translateX(6px); }
```

- [ ] **Step 3: Asegurar el responsive del nav (reemplazar bloque `@media (max-width: 968px)` del header, L290-298)**

`old_string`:
```css
@media (max-width: 968px) {
  .nav { display: none; }
  .menu-trigger { display: flex; }
  .header-inner { grid-template-columns: auto 1fr auto; }
  .brand { font-size: 20px; letter-spacing: 4px; }
  .brand small { display: none; }
  .nav-act-label { display: none; }
  .nav-actions { gap: 18px; }
}
```
`new_string`:
```css
@media (max-width: 968px) {
  .nav { display: none; }
  .menu-trigger { display: flex; }
  .header-inner { grid-template-columns: auto 1fr auto; }
  .brand { font-size: 20px; letter-spacing: 4px; }
  .brand small { display: none; }
  .nav-act-label { display: none; }
  .nav-actions { gap: 18px; }
}
/* ─── Menú móvil (overlay) ─── */
.mobile-nav {
  position: fixed; inset: 0;
  background: var(--cream);
  z-index: 200;
  display: flex; flex-direction: column; justify-content: center;
  padding: 32px 28px;
  gap: 6px;
  transform: translateY(-100%);
  transition: transform .5s var(--ease-out);
}
.mobile-nav.open { transform: translateY(0); }
.mobile-nav a {
  font-family: var(--f-display);
  font-size: 30px;
  color: var(--ink);
  padding: 10px 0;
  border-bottom: 1px solid var(--line);
}
.mobile-nav a.pro { color: var(--sage-deep); font-size: 18px; font-family: var(--f-sans); letter-spacing: 2px; text-transform: uppercase; border: none; margin-top: 16px; }
.mobile-nav-close {
  position: absolute; top: 24px; right: 24px;
  font-size: 30px; color: var(--ink); line-height: 1;
}
@media (min-width: 969px) { .mobile-nav { display: none; } }
```

- [ ] **Step 4: Añadir el markup del menú móvil (justo después de `</header>`, tras L1772)**

`old_string`:
```html
</header>

<!-- HERO con espacio para VIDEO CINEMATOGRÁFICO -->
```
`new_string`:
```html
</header>

<!-- MENÚ MÓVIL -->
<div class="mobile-nav" id="mobileNav">
  <button class="mobile-nav-close" id="mobileNavClose" aria-label="Cerrar menú">×</button>
  <a href="#coleccion">Colección</a>
  <a href="#ocasiones">Ocasiones</a>
  <a href="#atelier">Atelier</a>
  <a href="#" class="pro" onclick="closeMobileNav(); openModal(); return false;">Área Empresarial</a>
</div>

<!-- HERO con espacio para VIDEO CINEMATOGRÁFICO -->
```

- [ ] **Step 5: Añadir JS de mega-menú + menú móvil (al final del `<script>`, justo antes de su `</script>` de cierre)**

Localizar el cierre del `<script>` principal (Run: `grep -n "</script>" ...`; usar el último). Insertar antes:
```javascript

// ═══ NAV: mega-menú (accesible por teclado) ═══
document.querySelectorAll('.nav-item.has-mega').forEach(item => {
  const trigger = item.querySelector('a[aria-haspopup]');
  const open  = () => { item.classList.add('open');  trigger.setAttribute('aria-expanded', 'true');  };
  const close = () => { item.classList.remove('open'); trigger.setAttribute('aria-expanded', 'false'); };
  item.addEventListener('mouseenter', open);
  item.addEventListener('mouseleave', close);
  trigger.addEventListener('focus', open);
  item.addEventListener('focusout', e => { if (!item.contains(e.relatedTarget)) close(); });
  trigger.addEventListener('keydown', e => { if (e.key === 'Escape') { close(); trigger.blur(); } });
});

// ═══ NAV: menú móvil ═══
const mobileNav = document.getElementById('mobileNav');
const menuTrigger = document.querySelector('.menu-trigger');
function openMobileNav()  { if (mobileNav) mobileNav.classList.add('open'); }
function closeMobileNav() { if (mobileNav) mobileNav.classList.remove('open'); }
if (menuTrigger) menuTrigger.addEventListener('click', openMobileNav);
const mobileNavClose = document.getElementById('mobileNavClose');
if (mobileNavClose) mobileNavClose.addEventListener('click', closeMobileNav);
if (mobileNav) mobileNav.querySelectorAll('a:not(.pro)').forEach(a => a.addEventListener('click', closeMobileNav));
```

- [ ] **Step 6: Verificación desktop**

Abrir el preview en desktop. Hover sobre "Colección" y "Ocasiones": aparece el mega-menú editorial (fade + translateY), el caret rota, las columnas con etiquetas y links en serif se ven limpias, la línea inferior del item se completa. Hover en "Atelier"/"Área Empresarial": subrayado normal, sin mega. `preview_console_logs` → sin errores. `preview_screenshot` del mega-menú abierto como evidencia.

- [ ] **Step 7: Verificación teclado + móvil**

Desktop: `Tab` hasta "Colección" → el mega-menú se abre con focus; `Escape` lo cierra. 
Móvil (`preview_resize` 375px): el nav desktop está oculto, el hamburguesa abre el overlay `.mobile-nav` con los enlaces en Fraunces grande; la × y los enlaces lo cierran; "Área Empresarial" abre el modal. Sin errores en consola. `preview_screenshot` del overlay móvil.

---

## Self-Review (hecho por el autor del plan)

**1. Cobertura del spec:**
- §4.1 correcciones copy/marca → Task 1 (steps 1-15) + grep (step 16). ✔ (EST.1975, +50 años, contador 50, Grupo Juana Sánchez, Área Empresarial).
- §4.2 cursor polvo de estrellas → Task 2 (canvas, GPU pool, cap 120, reduced-motion/móvil off, conserva `.lg`). ✔
- §4.3 hero vídeo → Task 3 (estructura `<video>` lista, placeholder visible, poster/fallback conservado, reduced-motion). ✔
- §4.4 nav editorial → Task 4 (mega-menús Colección/Ocasiones, subrayado animado, minimalista, Área Empresarial, sticky conservado, teclado + `aria-expanded`, responsive con overlay móvil). ✔
- §6 verificación → cada task termina con preview + grep. ✔

**2. Placeholders:** `[POSTER_BASE64]` en Task 3 NO es un placeholder a inventar: es una instrucción explícita de conservar el valor base64 real ya presente en el archivo (Step 1 lo localiza). El resto del código está completo.

**3. Consistencia de tipos/nombres:** IDs y clases coherentes entre markup, CSS y JS: `#stardust`/`.stardust-canvas` (T2), `.nav-item.has-mega`/`.mega`/`.open`/`aria-expanded` (T4), `#mobileNav`/`.mobile-nav`/`openMobileNav`/`closeMobileNav`/`#mobileNavClose` (T4). `closeMobileNav()` se define en Step 5 y se usa en el markup del Step 4 — ambos en Task 4. ✔

**4. Orden:** Task 1 fija la etiqueta "Área Empresarial" que Task 4 conserva en el nuevo markup. Si se ejecuta Task 4 sin Task 1, el `old_string` del Step 1 de Task 4 no casaría ("Mayorista" en vez de "Área Empresarial") → **ejecutar en orden 1→2→3→4**.

---

## Execution Handoff

Plan completo y guardado en `docs/superpowers/plans/2026-05-27-fase-a-correccion-marca-mejora-boceto.md`.
