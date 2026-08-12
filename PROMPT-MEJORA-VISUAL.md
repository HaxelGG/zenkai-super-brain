# Prompt de Mejora Visual y UX — ZENKAI Landing Page

---

## CONTEXTO

Eres un diseñador senior de producto especializado en landing pages de alto rendimiento. 
El sitio actual en `web/src/pages/index.astro` tiene una estructura narrativa sólida pero
necesita elevarse visualmente al nivel de las mejores landings del mercado (Linear, Vercel,
Stripe, Anthropic). El stack es Astro v5 + Tailwind CSS v3. Los componentes están en
`web/src/components/landing/`. El sistema de diseño usa CSS custom properties definidas en
`web/src/styles/tokens.css` y `web/src/styles/global.css`. Las fuentes son Sora Variable
(titulares) y Geist Variable (cuerpo).

El sitio vive en `D:\Zenkai Agency\ZENKAI-website\Zenkai Super Brain\web\`.
Ejecuta `npm run build` desde `web/` para verificar que compila.

---

## OBJETIVO

Transformar la landing actual en una experiencia de scroll inmersiva que un empresario
no pueda dejar de mirar. Cada sección debe sentirse como un producto premium. El scroll
debe ser adictivo — cada pantalla revela algo más impresionante que la anterior.

---

## 8 MEJORAS ESPECÍFICAS

### 1. ANIMACIONES DE ENTRADA POR SCROLL

Reemplaza el sistema actual de `.reveal` / `.reveal-stagger` por animaciones más
sofisticadas usando solo CSS (sin librerías externas):

- Los elementos deben aparecer con `@keyframes` que combinen `opacity`, `transform: 
  translateY(24px)` y un sutil `scale(0.97 → 1)`.
- Cada elemento debe tener un `animation-delay` incremental basado en su posición 
  (usa `--i` como custom property, ya implementado en `.reveal-stagger`).
- La duración debe ser `0.6s` con `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo).
- Añade un efecto de "stagger" también a las filas de la tabla Antes/Después y a 
  los items del Plan Zenkai.
- Usa `animation-timeline: view()` y `animation-range: entry 0% entry 100%` donde 
  el soporte de navegador lo permita, con fallback al IntersectionObserver actual.

### 2. EFECTO DE PARTÍCULAS EN EL HERO

Sustituye `ShaderField.astro` y `Constelacion.astro` por un sistema de partículas
más ligero y moderno:

- Crea `ParticleField.astro` — un `<canvas>` de 200 partículas que flotan con 
  movimiento browniano suave.
- Las partículas deben reaccionar sutilmente a la posición del mouse (parallax 
  suave, no agresivo).
- Colores: tonos indigo/violeta con opacidad variable (0.02 a 0.08).
- Tamaño de partícula: 2-4px con blur gaussiano.
- El canvas debe ser `position: absolute; inset: 0; pointer-events: none; z-index: 0`.
- Performance: usa `requestAnimationFrame`, limita a 30fps en móviles, desactiva 
  completamente si `prefers-reduced-motion`.
- El script debe ser `is:inline` con un guard de seguridad: si no se ha renderizado 
  un frame en 3 segundos, el canvas se oculta.

### 3. EFECTO DE LUZ QUE SIGUE EL SCROLL

Añade un gradiente radial que siga el scroll del usuario como iluminación ambiental:

- Crea `ScrollGlow.astro` — un div fijo con `pointer-events: none; z-index: 0`.
- El gradiente se mueve verticalmente con `--scroll-y` (0 a 1 basado en el progreso 
  de scroll).
- El gradiente: `radial-gradient(ellipse 80% 50% at 50% var(--scroll-pos), 
  rgba(99,102,241,0.04) 0%, transparent 60%)`.
- Actualiza `--scroll-pos` vía `requestAnimationFrame` con throttling.
- Aplica una segunda capa más pequeña que siga al mouse con un retraso de 200ms 
  (lerp suave).

### 4. TARJETAS CON EFECTO 3D MEJORADO

El sistema actual de `.card-3d` con gradiente radial es bueno. Mejóralo:

- Añade `transform: perspective(1000px) rotateY(var(--rotate-y, 0deg)) 
  rotateX(var(--rotate-x, 0deg))` además del gradiente.
- Calcula `--rotate-y` y `--rotate-x` en el handler de mousemove (±3deg máximo).
- Transición de vuelta a la posición neutral: `transition: transform 0.4s 
  cubic-bezier(0.16, 1, 0.3, 1)`.
- En móviles (sin hover), desactiva el efecto 3D pero mantén el gradiente sutil.
- Aplica este efecto a: tarjetas del Ecosistema, tarjetas de Cómo Funciona, 
  y la tarjeta del Plan Zenkai.

### 5. TIPOGRAFÍA Y ESPACIADO PREMIUM

- Los H1 deben usar `letter-spacing: -0.03em` y `line-height: 1.05`.
- Los H2 deben usar `letter-spacing: -0.02em` y `line-height: 1.12`.
- El body text debe tener `line-height: 1.65` para legibilidad.
- Añade tracking negativo solo a titulares grandes (nunca a body text).
- El espaciado entre secciones debe ser generoso: `padding-block: clamp(4rem, 8vw, 7rem)`.
- Usa `text-wrap: balance` en todos los titulares y `text-wrap: pretty` en párrafos 
  de más de 3 líneas.
- Añade `hyphens: auto` y `language: es` en body text para separación silábica correcta.

### 6. MOBILE-FIRST RESPONSIVE

Revisa y corrige cada componente para mobile:

- **Hero**: En móvil, el H1 debe ser máximo 2.25rem. Los 7 items de "Incluye" 
  deben ser un grid de 2 columnas con iconos más pequeños. El CTA debe ser 
  full-width.
- **Antes/Después**: En móvil, la tabla debe colapsar a tarjetas individuales 
  apiladas donde cada "antes" está arriba y su "después" abajo con una flecha 
  hacia abajo.
- **Plan Zenkai**: En móvil, el precio de setup y el nombre del plan deben 
  apilarse verticalmente. La lista de inclusiones debe ser single-column.
- **Cómo Funciona**: Single column en móvil, con los números alineados a la 
  izquierda del texto (horizontal layout dentro de cada card).
- **Footer**: En móvil, apilar columnas. La columna de Productos debe aparecer 
  justo después de la marca.
- Touch targets: todos los elementos interactivos deben tener mínimo 44x44px 
  (ya casi lo cumples con `.min-h-11`).
- Testea todo en viewport de 375px (iPhone SE) y 390px (iPhone 14).

### 7. MICRO-INTERACCIONES

Pequeños detalles que hacen que el sitio se sienta vivo:

- Los iconos SVG en las tarjetas deben tener un sutil `scale(1.05)` en hover 
  con `transition: transform 0.2s`.
- Los botones deben tener un efecto de press: `scale(0.97)` en `:active` con 
  transición de 0.1s.
- Los enlaces del navbar y footer deben tener un subrayado animado que crece 
  desde el centro (`scaleX(0 → 1)` con `transform-origin: center`).
- Añade `scroll-behavior: smooth` al html.
- Los `<details>` del FAQ deben tener una animación de apertura suave 
  (usa `@keyframes` para `max-height` o `grid-template-rows`).
- El StickyBar de WhatsApp debe tener una animación de entrada `translateY(100% → 0)` 
  cuando aparece.

### 8. OPTIMIZACIONES DE CARGA Y PERFORMANCE

- Asegura que el LCP (Hero H1) se renderice con la fuente correcta en el primer 
  frame. Ya tienes `preload` de Sora — verifica que funcione.
- Los scripts inline deben ser mínimos. El de partículas no debe superar 3KB.
- Las imágenes del Ecosistema (si las hay) deben usar el componente `<Image />` 
  de Astro para optimización automática.
- Añade `<meta name="viewport" content="width=device-width, initial-scale=1,
  viewport-fit=cover">` para el notch del iPhone.
- Asegura `content-visibility: auto` en secciones below-the-fold para lazy 
  rendering.
- Añade `contain: layout style paint` en componentes que no afectan al layout 
  global.

---

## REGLAS

1. No uses librerías externas de animación (no Framer Motion, no GSAP, no AOS). 
   Todo CSS nativo + vanilla JS mínimo.
2. No rompas la narrativa actual. Las 8 secciones deben mantener su orden y 
   propósito de conversión.
3. Cada cambio debe compilar con `npm run build` sin errores ni warnings.
4. No modifiques el contenido ni los precios. Solo presentación visual.
5. Todo el JS nuevo debe tener un guard de seguridad: si falla, la página debe 
   verse completamente funcional sin la animación.
6. Respeta `prefers-reduced-motion` y `prefers-color-scheme`.
7. El sitio ya tiene modo oscuro por defecto. No añadas modo claro a menos que 
   complemente sin romper el diseño actual.
8. Haz commit por cada mejora completada, con mensajes descriptivos.

---

## ENTREGABLES

- `ParticleField.astro` — nuevo sistema de partículas
- `ScrollGlow.astro` — iluminación ambiental por scroll
- Actualización de `global.css` con las nuevas animaciones y utilidades
- Actualización de todos los componentes existentes con las mejoras de la 
  sección 5 (tipografía), 6 (mobile) y 7 (micro-interacciones)
- `npm run build` limpio
- Push a main para deploy automático en Vercel
