# Grupo Juana Sánchez — Landing Page · Brief de continuación para Claude Code

> **Lee este documento entero antes de tocar código.** Contiene contexto del cliente, decisiones de diseño ya tomadas, stack técnico, mapa de secciones, especificaciones de animación, datos reales y el plan de ejecución por fases. No es un brief opcional: cada sección responde decisiones que ya están validadas con el cliente. Si algo no está aquí, pregunta antes de inventar.

---

## 0 · TL;DR — Mission

Continuar la landing page editorial nivel Apple/Hermès para **Grupo Juana Sánchez** (3 firmas: Juana Sánchez · Lolikas · Printellar) que **conviertes desde un HTML standalone existente** a una webapp moderna en **Next.js 15 + Tailwind 4 + shadcn/ui**, deployada en Vercel sobre el dominio **grupojuanasanchez.com**.

**Plazo crítico**: el **17 de mayo de 2026 a las 18:00 CEST** se lanza la nueva tienda online de Juana Sánchez. La landing debe estar publicada antes y mostrar countdown en vivo a ese momento.

**Lo que NO es esta landing**: una página de venta. Es una pieza de **branding** que existe para que la audiencia se enamore del Grupo Juana Sánchez y conozca las 3 firmas. La venta sucede en `juanasanchez.es`, `lolikas.com` y por cotización en WhatsApp para Printellar.

---

## 1 · Contexto del cliente

**Grupo Juana Sánchez** es un conglomerado familiar español fundado en **Madrid en 1975**. Tres firmas hermanas bajo una misma escuela:

### 1.1 Juana Sánchez (casa madre · ceremonia)
- Especialidad: complementos y calzado artesanal para **comunión, arras, novia, madrina**
- Productos: coronas, tocados, diademas, velos, esparteñas, limosneras, guantes, agujones, cestas, collares, pulseras, pamelas, turbantes, cancanes, prendidos, bastidor y pañuelos, conjuntos
- Producción: 100% hecho a mano, bajo pedido, taller en Madrid
- Distribución: tienda online `juanasanchez.es` + boutiques selectas en España
- Slogan oficial: *"La casa marida tradición artesanal con visión contemporánea, definida por una sofisticación que trasciende generaciones."*
- Pasarelas históricas (datos validados):
  - **FIMI Valencia/Madrid · 1986** — líderes en moda infantil de autor
  - **Novia España · Barcelona Bridal Week · 1998** — la esencia de la novia artesanal
  - **Puerta de Europa · Madrid · 2003** — proyección internacional
  - **Pasarela Cibeles · Madrid · 2012** — el reconocimiento de la moda española

### 1.2 Lolikas (la hermana joven · moda)
- Especialidad: **bolsos y complementos** para uso diario, no ceremonia
- Productos: bolsos, tocados, cinturones, accesorios para bolsos, monederos, collares
- Slogan oficial: *"La esencia refrescante. Juventud y sofisticación. La mirada joven y vibrante del legado Juana Sánchez. Cada pieza es artesanía con tendencia."*
- Tienda: `lolikas.com`
- Paleta confirmada: **rosa pastel + turquesa/agua + crema** (NO la malva de Juana Sánchez)

### 1.3 Printellar (taller técnico · personalización)
- Especialidad: estampación textil directa, impresión sobre lienzo y lonas, corte y grabado láser, pegatinas, pósters
- Slogan oficial: *"Artesanía técnica con sofisticación sin compromisos. La versión técnica y creativa del legado Juana Sánchez."*
- Distribución: cotización vía WhatsApp `+34 613 775 981`
- Paleta confirmada: **negro + dorado** (contraste deliberado con las dos firmas femeninas)

### 1.4 Audiencia objetivo
- Mujeres entre 25 y 60 años, nivel económico medio-alto
- Madres organizando comuniones (mayo es temporada alta), novias, madrinas
- Mercado primario: España. Secundario: resto de Europa
- Compra **emocional**, no transaccional. Buscan exclusividad, herencia, momentos memorables
- Quieren que el evento sea perfecto, valoran lo artesanal y único

### 1.5 Eventos en agenda real
- **FIMI Valencia 2026** — 15 y 16 mayo · Pabellón 8 · Stand C35 (edición 40 de FIMI)
- **Lanzamiento nueva tienda Juana Sánchez** — **17 mayo 2026 · 18:00 CET** (`Date.UTC(2026, 4, 17, 16, 0, 0)`)

### 1.6 Contacto y credenciales
- WhatsApp ventas/servicio: `+34 613 775 981`
- Email corporativo: `juanasalmacen@gmail.com`
- Instagram: `@grupojuanasanchez`
- Stripe: ya vinculada al correo corporativo
- Dominio: IONOS — credenciales en el archivo `plan_maestro_juana_sanchez_y_lolikas.md` del cliente (NO incluirlas en repo)
- Presupuesto pauta Meta Ads: 10 EUR/día mínimo cuando esté publicada

---

## 2 · Estado actual del proyecto

### 2.1 Lo que recibes (input)

Un único archivo: **`grupo-juana-sanchez-landing.html`** (≈ 2 MB). Es un HTML standalone con:
- Toda la estructura de 12 secciones ya construida
- 5 imágenes embebidas en base64 (niña con corona × 3 crops, peonías, rosas)
- 1 video MP4 embebido en base64 (1 MB, peonías/rosas con gotas de rocío, generado con Seedance)
- CSS completo con paletas, tipografías y animaciones
- JavaScript vanilla: countdown live, parallax hero, IntersectionObserver para reveals, animación de contadores, marquee CSS, blob URL sharing del video
- Meta tags básicos OG + theme-color

**Este HTML es la spec visual.** No es el deliverable final — es el plano que tradujiste a Next.js.

### 2.2 Lo que ya está validado con el cliente

- Estructura editorial de 12 capítulos (no es una landing de venta clásica)
- Tipografía: **Italiana** (display), **Cormorant Garamond** (serif), **Fraunces** (variable), **Jost** (sans), **JetBrains Mono** (mono)
- Paleta diferenciada por marca: crema+malva (JS), crema+mint (Lolikas), negro+dorado (Printellar)
- Tono: poético, editorial, en español peninsular, sin agresividad comercial
- Countdown al lanzamiento del 17 mayo como pieza central
- Marquee de boutiques en footer (las ciudades reales aún están por confirmar — usa las del HTML como placeholder)
- Botón sutil con 3 puertas a las tiendas online (no venta dentro de la landing)

### 2.3 Lo que falta y NO debes asumir
- Fotos reales del taller y de productos individuales (cliente las está produciendo)
- Lista real de boutiques físicas en España (12 ciudades placeholder por ahora)
- Versión EN/FR (mercado europeo) — pendiente decisión
- Logo SVG vectorial (solo tengo un JPG del logo dorado tejido)

---

## 3 · Stack técnico obligatorio

```
Framework         Next.js 15 (App Router, RSC, Server Actions)
Lenguaje          TypeScript estricto
Estilos           Tailwind CSS 4 + CSS variables OKLCH
Componentes       shadcn/ui (instalación CLI, no copy-paste manual)
Animaciones       Motion (framer-motion v11+) + CSS scroll-driven
Smooth scroll     Lenis (opcional pero recomendado)
Fonts             next/font/google
Iconos            lucide-react
Forms             react-hook-form + zod
Email capture     Resend o ConvertKit (decidir con cliente)
Analytics         Vercel Analytics + Vercel Speed Insights (gratis)
Deploy            Vercel
DNS               IONOS → Vercel
```

**Justificación de Next.js sobre Astro**: el cliente quiere captura de leads pre-lanzamiento, formularios reales, eventualmente carrito/Stripe. Server Actions y Route Handlers de Next lo cubren sin saltar a otro stack. Si en revisión se decide que NO habrá ningún dynamic, evaluar Astro 5.

---

## 4 · Setup inicial

```bash
# 1. Crear el proyecto
npx create-next-app@latest juana-sanchez-landing \
  --typescript --tailwind --app --src-dir --use-pnpm \
  --import-alias "@/*"

cd juana-sanchez-landing

# 2. Inicializar shadcn (Tailwind 4 + tw-animate-css)
pnpm dlx shadcn@latest init -d

# 3. Componentes shadcn base que se van a usar
pnpm dlx shadcn@latest add button input textarea label sonner separator

# 4. Dependencias de animación y UX
pnpm add motion lucide-react react-use-measure
pnpm add framer-motion  # legacy alias por si algún snippet la pide
pnpm add @studio-freight/lenis  # smooth scroll opcional

# 5. Formularios
pnpm add react-hook-form @hookform/resolvers zod
pnpm add resend  # cuando se decida email provider

# 6. Validar typecheck
pnpm tsc --noEmit
```

Estructura de carpetas esperada:

```
src/
  app/
    layout.tsx
    page.tsx                    # landing principal
    api/
      subscribe/route.ts        # captura emails pre-lanzamiento
    globals.css                 # variables OKLCH (ver §5)
  components/
    sections/
      Hero.tsx
      Declaration.tsx
      PullQuote.tsx
      Timeline.tsx
      TrioIntro.tsx
      LaunchCountdown.tsx
      ChapterJuana.tsx
      ChapterLolikas.tsx
      ChapterPrintellar.tsx
      Manifesto.tsx
      FimiEvent.tsx
      Shops.tsx
      Footer.tsx
    ui/                         # shadcn output dir
    primitives/
      RevealOnScroll.tsx
      CountdownDigit.tsx
      MarqueeStrip.tsx
      StoryStickyVisual.tsx
  lib/
    utils.ts
    fonts.ts                    # next/font config
    countdown.ts                # date math helpers
public/
  assets/
    images/                     # mover aquí desde el HTML embebido
    video/lolikas.mp4
    logos/
```

---

## 5 · Sistema de diseño — paleta OKLCH y tipografía

### 5.1 `globals.css` — variables a copiar/pegar

```css
@import "tailwindcss";
@import "tw-animate-css";

@theme inline {
  /* Crema · casa madre */
  --color-cream:        oklch(0.945 0.018 88);
  --color-cream-warm:   oklch(0.910 0.030 85);
  --color-cream-deep:   oklch(0.872 0.034 84);
  --color-bone:         oklch(0.962 0.018 88);
  --color-paper:        oklch(0.974 0.015 87);

  /* Juana Sánchez · malva y rosa polvo */
  --color-mauve:        oklch(0.700 0.038 12);
  --color-mauve-deep:   oklch(0.610 0.045 10);
  --color-rose-dust:    oklch(0.805 0.045 18);
  --color-rose-soft:    oklch(0.870 0.034 22);

  /* Lolikas · mint / turquesa + peach */
  --color-mint:         oklch(0.808 0.038 175);
  --color-mint-soft:    oklch(0.882 0.026 170);
  --color-mint-deep:    oklch(0.690 0.038 173);
  --color-peach:        oklch(0.860 0.054 50);

  /* Printellar · negro + dorado */
  --color-black:        oklch(0.135 0 0);
  --color-black-warm:   oklch(0.160 0.010 75);
  --color-gold:         oklch(0.728 0.107 78);
  --color-gold-warm:    oklch(0.660 0.105 70);
  --color-gold-soft:    oklch(0.800 0.084 80);

  /* Tinta */
  --color-ink:          oklch(0.225 0.012 70);
  --color-ink-soft:     oklch(0.450 0.015 75);
  --color-ink-faint:    oklch(0.640 0.018 78);

  /* Tipografías (asignadas por next/font en lib/fonts.ts) */
  --font-display:  var(--font-italiana);
  --font-serif:    var(--font-cormorant);
  --font-serif-2:  var(--font-fraunces);
  --font-sans:     var(--font-jost);
  --font-mono:     var(--font-jetbrains);

  /* Padding fluido (mismo del HTML) */
  --pad-x:  clamp(20px, 5vw, 80px);
  --pad-y:  clamp(80px, 12vw, 180px);
}

:root {
  /* Sobreescribe defaults de shadcn con la paleta del cliente */
  --background:           var(--color-cream);
  --foreground:           var(--color-ink);
  --primary:              var(--color-mauve-deep);
  --primary-foreground:   var(--color-cream);
  --secondary:            var(--color-cream-warm);
  --secondary-foreground: var(--color-ink);
  --muted:                var(--color-cream-warm);
  --muted-foreground:     var(--color-ink-soft);
  --accent:               var(--color-mauve);
  --border:               oklch(0.225 0.012 70 / 0.14);
  --input:                oklch(0.225 0.012 70 / 0.14);
  --ring:                 var(--color-mauve-deep);
  --radius:               0.125rem;
}
```

### 5.2 `lib/fonts.ts`

```typescript
import { Italiana, Cormorant_Garamond, Fraunces, Jost, JetBrains_Mono } from "next/font/google";

export const italiana = Italiana({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-italiana",
  display: "swap",
});

export const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

export const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz", "SOFT"],
  display: "swap",
});

export const jost = Jost({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500"],
  variable: "--font-jost",
  display: "swap",
});

export const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});
```

Asignar todas las variables en el `<html>` de `app/layout.tsx`.

---

## 6 · Mapa de secciones — qué hay en el HTML y qué componente shadcn/animación usar

> Léelo como tabla maestra. Cada fila es un componente React que reemplaza una sección del HTML actual.

### Sección 1 · `EventStrip`
- **Qué es**: franja superior negra con punto dorado pulsante, anuncia el lanzamiento + FIMI
- **Animación nueva sugerida**: opacidad del strip baja al scrollear más de 600px (cede protagonismo a la nav)
- **Datos**: texto del HTML actual; el live-dot usa `animate-pulse` de tailwind

### Sección 2 · `Nav`
- **Qué es**: header sticky transparente con backdrop-blur que cambia a oscuro sobre las secciones negras (Printellar + FIMI Event + Launch)
- **shadcn**: ninguno necesario
- **Animación**:
  - Detectar secciones oscuras con IntersectionObserver y aplicar `nav.on-dark`
  - Hover en links con underline animado por transform scaleX
- **Mejora obligatoria**: añadir menú hamburguesa mobile (drawer de shadcn) en lugar de ocultar links

### Sección 3 · `Hero`
- **Qué es**: imagen pantalla completa de la niña con corona, tipografía Italiana sobre overlay
- **Componente shadcn aplicable**: **`scroll-expansion-hero.tsx`** (el que mandó el cliente). Adaptar para que la imagen del hero se inicie pequeña y se expanda al hacer scroll, revelando la sección siguiente.
- **Animaciones nivel premium**:
  - Reveal por máscara línea por línea del título (clip-path inset)
  - Parallax con `useScroll` + `useTransform` de motion
  - Zoom-out lento al cargar (12-14s)
  - Cursor follower opcional con motion
- **Imagen**: `/public/assets/images/girl-hero.jpg` (extraer del base64 del HTML)
- **Texto literal**: "Cincuenta años *cosiendo* memoria." (la última palabra italic en mauve)

### Sección 4 · `Declaration`
- **Qué es**: "Grupo Juana Sánchez" gigante centrado + 3 stats (1975 · 3 firmas · 50+ años)
- **Animación**:
  - Stats con `useMotionValue` + `useTransform` animando del 0 al target con easing cubic-out cuando entran al viewport
  - El nombre se revela por palabras con stagger

### Sección 5 · `PullQuote`
- **Qué es**: cita editorial centrada con tipografía masiva
- **Texto literal actual**: *"Un legado. Tres firmas. Cincuenta años cosiendo lo único que no caduca."* — atribuida a "Grupo Juana Sánchez · MCMLXXV — MMXXVI"
- **Animación**: text-gradient animation suave del ink al mauve al hacer scroll (background-clip text + animation-timeline scroll)

### Sección 6 · `Timeline`
- **Qué es**: línea horizontal scrolleable con 7 hitos (1975 → 2026)
- **Datos hardcoded** (no inventar):
  ```
  1975 · Origen · Madrid · Se funda la casa
  1983 · Consolidación · Un hito en la industria
  1986 · FIMI Valencia/Madrid · Líderes en moda infantil de autor
  1998 · Novia España · Barcelona · La esencia de la novia artesanal
  2003 · Puerta de Europa · Madrid · Proyección internacional
  2012 · Pasarela Cibeles · Madrid · El reconocimiento de la moda española
  2026 · FIMI 40 · Pabellón 8 — Stand C35 (presente, marcado con dot dorado)
  ```
- **Componente custom**: `Timeline.tsx` con scroll-snap horizontal nativo + botones prev/next (shadcn Button) en desktop
- **Animación premium**: usar `useScroll({ container })` para mapear la posición del scroll horizontal a un progreso del rail (la línea de fondo se rellena en mauve a medida que avanzas)
- **Mobile**: lista vertical en lugar de scroll horizontal

### Sección 7 · `TrioIntro`
- **Qué es**: tres cards con las 3 firmas
- **Componente shadcn aplicable**: **`spotlight-card.tsx` (GlowCard)** — perfecto para esta sección. Cada card sigue el cursor con un glow del color de la marca:
  - Juana Sánchez: `glowColor="orange"` o crear preset custom `mauve`
  - Lolikas: `glowColor="green"` (mint) o custom
  - Printellar: `glowColor="purple"` o custom dorado
- Necesitas extender el `glowColorMap` para añadir tonos custom

### Sección 8 · `LaunchCountdown` ⚠️ CRÍTICO
- **Qué es**: la pieza central. Cuenta atrás al lanzamiento de la tienda Juana Sánchez con video como visual.
- **Target date exacto**: `new Date(Date.UTC(2026, 4, 17, 16, 0, 0))` = 17 mayo 2026 18:00 CEST
- **Componente shadcn aplicable**: **`the-future-arrives-soon-cta.tsx` (CountdownBanner)** — adaptarlo:
  - Cambiar paleta a negro + dorado
  - 4 unidades: Días, Horas, Minutos, Segundos (el shadcn original solo tiene 3)
  - Tipografía Italiana en los dígitos
  - CTA: "Sé de las primeras en verla" → link a `https://instagram.com/grupojuanasanchez`
  - Sub-CTA: "Avísame por email" → abre dialog con formulario de suscripción (ver §10)
- **Video**: `/public/assets/video/lolikas.mp4` (1 MB, extraer del base64)
- **Animación del dígito**: `motion.span` con `AnimatePresence mode="popLayout"` igual al componente shadcn original
- **Layout**: countdown a la izquierda, video framed a la derecha (mismo del HTML)

### Sección 9 · `ChapterJuana` (sticky scroll storytelling)
- **Qué es**: capítulo completo de Juana Sánchez con texto que scrollea + imagen sticky
- **Componente shadcn aplicable**: ninguno directo. Construir con motion `useScroll` para sticky behavior.
- **Animación premium**:
  - Imagen sticky con un crossfade entre `girl_hero`, `girl_crown`, `girl_lace` según `useTransform` del scroll
  - Productos en grid con stagger reveal (motion `whileInView`)
  - Hover en cada producto: padding-left + tag opacity 1
- **Datos**: 16 productos reales (lista en el HTML actual). NO inventar.

### Sección 10 · `ChapterLolikas`
- **Qué es**: igual estructura que Juana Sánchez pero paleta mint+rosa, layout reverse
- **Video como visual**: el mismo `lolikas.mp4` autoplay muted loop
- **Animación premium adicional**: cuando entra el chapter, fundir el background de crema a `linear-gradient(180deg, bone, cream, rose-soft)` con transition de 1.2s
- **Productos**: 6 (bolsos, tocados, cinturones, accesorios para bolsos, monederos, collares)

### Sección 11 · `ChapterPrintellar` 🖤
- **Qué es**: capítulo con fondo NEGRO + dorado. Contraste total con las 2 anteriores.
- **Visual**: composición tipográfica custom (Tela / Madera / Lienzo / Metal / Papel) — no foto
- **Animación premium**: el background del body transiciona suavemente de cream a black cuando esta sección entra al viewport (>40% visible). Usar IntersectionObserver con threshold array.
- **Productos**: 6 servicios (estampación textil, pegatinas, lienzo, lonas, pósters, corte láser)
- **CTA**: "Cotizar por WhatsApp" → `https://wa.me/34613775981?text=Hola,%20quiero%20cotizar%20con%20Printellar`

### Sección 12 · `Manifesto`
- **Qué es**: pantalla casi vacía con frase grande centrada
- **Texto literal**: *"Hacemos lo mismo desde hace cincuenta años: convertir un día cualquiera en uno que se recuerda."*
- **Animación premium**: split por palabras con stagger 60ms entre cada una, fade-in + slide-up por palabra

### Sección 13 · `FimiEvent`
- **Qué es**: sección dedicada al evento FIMI Valencia 15-16 mayo
- **Datos**: Pabellón 8, Stand C35, edición 40
- **Visual derecho**: composición con 2 círculos concéntricos dorados + tipografía
- **Animación**: live-dot pulsando, líneas de la composición animando rotación lenta

### Sección 14 · `Shops`
- **Qué es**: 3 botones grandes a las tiendas online
- **Animación premium**: hover → background slide-up del color de la marca + texto invertido (ya está en CSS, mantener)
- **Links**:
  - Juana Sánchez → `https://www.juanasanchez.es/`
  - Lolikas → `https://www.lolikas.com/`
  - Printellar → WhatsApp directo

### Sección 15 · `Footer`
- **Qué es**: footer negro con marquee de boutiques arriba + 4 columnas (brand, boutiques, tiendas online, contacto)
- **Componente shadcn aplicable**: **`logo-cloud-4.tsx` con `InfiniteSlider` + `ProgressiveBlur`** — adaptarlo para mostrar nombres de ciudades en lugar de logos. Pasar las ciudades como children del slider, con tipografía Italiana en cada uno.
- **Ciudades placeholder actuales** (12): Madrid, Barcelona, Valencia, Sevilla, Bilbao, Málaga, San Sebastián, Granada, Zaragoza, Palma, Santander, Salamanca
- ⚠️ **Pedir al cliente la lista real antes de publicar**

---

## 7 · Animaciones premium nivel Apple/Hermès — implementación

Lista priorizada de upgrades que el HTML vanilla no podía hacer pero Next + Motion sí:

### 7.1 Smooth scroll global con Lenis
```typescript
// app/layout.tsx (client component wrapper)
"use client";
import Lenis from "@studio-freight/lenis";
import { useEffect } from "react";

export function SmoothScroll({ children }) {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    function raf(time: number) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);
  return children;
}
```

### 7.2 Text reveal por palabras/caracteres
```typescript
// components/primitives/SplitText.tsx
import { motion } from "motion/react";
export function SplitText({ text, stagger = 0.06 }: { text: string; stagger?: number }) {
  const words = text.split(" ");
  return (
    <span>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden">
          <motion.span
            initial={{ y: "110%", opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: "-15% 0px" }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: i * stagger }}
            className="inline-block"
          >
            {word}&nbsp;
          </motion.span>
        </span>
      ))}
    </span>
  );
}
```
Usar en hero title, manifesto, declaration name.

### 7.3 Sticky scroll storytelling con `useScroll`
```typescript
const { scrollYProgress } = useScroll({
  target: chapterRef,
  offset: ["start start", "end end"],
});
const imageOpacity = useTransform(scrollYProgress, [0, 0.33, 0.66, 1], [1, 0.4, 0.4, 1]);
const currentImage = useTransform(scrollYProgress, [0, 0.33, 0.66, 1], [img1, img2, img3, img1]);
```

### 7.4 Magnetic cursor en CTAs
```typescript
// Hook reusable
function useMagnetic(strength = 0.3) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  // Listener pointermove → calcular offset → spring
  // ...devolver { ref, x, y }
}
```
Aplicar a los 3 botones de tienda.

### 7.5 Cambio de fondo de body entre secciones
```typescript
// Use IntersectionObserver con threshold array para detectar % de visibilidad
// Cuando ChapterPrintellar > 40% visible → body.classList.add('on-dark')
// CSS: body { transition: background 1.2s ease; } body.on-dark { background: var(--color-black); }
```

### 7.6 View Transitions API
En `next.config.ts` activar experimental viewTransition para transiciones suaves entre rutas (cuando haya rutas extra como /aviso o /privacidad).

### 7.7 Image reveal con clip-path
```css
@keyframes image-reveal {
  from { clip-path: inset(0 100% 0 0); }
  to   { clip-path: inset(0 0 0 0); }
}
.image-reveal { animation: image-reveal 1.4s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
```
Aplicar a las imágenes de detalle (corona + encaje) en el chapter Juana Sánchez.

### 7.8 Hover preview de productos
Cuando hover en una fila de producto (ej. "Coronas"), aparece un pequeño preview de imagen flotante junto al cursor. Construir con motion + position fixed.

### 7.9 Scroll progress indicator
Barra delgada arriba que llena con mauve a medida que se scrollea la página. `useScroll` + `useSpring`.

### 7.10 Number counter con motion values
Reemplazar el `requestAnimationFrame` manual del HTML actual por motion `useMotionValue` + `useTransform` + `useSpring` para los stats — más performante y declarativo.

---

## 8 · Performance targets (Lighthouse)

- **LCP** < 1.5s — el hero image debe servirse desde Vercel Image Optimization (`next/image`)
- **CLS** < 0.1 — reservar `aspect-ratio` en todos los containers de imagen
- **FID** / **INP** < 100ms
- **Bundle JS inicial** < 150KB gz
- **Imágenes** servidas en WebP/AVIF, lazy-load por defecto, eager solo en hero
- **Video** servido con HLS o MP4 H.264 baseline, `preload="metadata"`, autoplay solo en sections visibles
- **Tipografías** con `display: swap` y subset latin

Verificar con `pnpm dlx unlighthouse` antes de cada release.

---

## 9 · SEO y meta

### 9.1 Meta tags por página
- `title`: "Grupo Juana Sánchez — Cincuenta años cosiendo memoria"
- `description`: "Un legado. Tres firmas. Cincuenta años cosiendo lo único que no caduca. Juana Sánchez · Lolikas · Printellar. Madrid, desde 1975."
- `og:image`: generar con `next/og` un OG image dinámico de 1200x630 con la tipografía Italiana + foto de la niña

### 9.2 Schema.org markup en `app/page.tsx`
```typescript
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "name": "Grupo Juana Sánchez",
      "foundingDate": "1975",
      "founder": "Juana Sánchez",
      "address": { "@type": "PostalAddress", "addressLocality": "Madrid", "addressCountry": "ES" },
      "sameAs": ["https://www.juanasanchez.es", "https://www.lolikas.com", "https://instagram.com/grupojuanasanchez"]
    },
    {
      "@type": "Brand",
      "name": "Juana Sánchez",
      "slogan": "La casa marida tradición artesanal con visión contemporánea"
    },
    {
      "@type": "Event",
      "name": "FIMI Valencia 2026 — Edición 40",
      "startDate": "2026-05-15",
      "endDate": "2026-05-16",
      "location": {
        "@type": "Place",
        "name": "Feria Valencia · Pabellón 8 · Stand C35",
        "address": "Valencia, España"
      },
      "organizer": { "@type": "Organization", "name": "FIMI" },
      "performer": { "@type": "Organization", "name": "Grupo Juana Sánchez" }
    }
  ]
};
```

### 9.3 Archivos obligatorios
- `app/sitemap.ts` (Next 15 native)
- `app/robots.ts` (Next 15 native)
- `app/manifest.ts` para PWA básica (theme color, name, short_name)

---

## 10 · Captura de leads pre-lanzamiento

Funcionalidad crítica para los próximos 3 días. Cualquier visitante que vea el countdown debe poder pedir aviso por email.

### 10.1 UI
- Modal/Dialog (shadcn `Dialog`) que se abre desde el CTA del countdown
- Formulario con un solo campo: `email`
- Componente shadcn aplicable: el form de referencia que mandó el cliente es **`form-1.tsx`** — simplificarlo a un solo campo email + button

### 10.2 Backend
`app/api/subscribe/route.ts`:
```typescript
import { Resend } from "resend";
import { z } from "zod";
const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const body = await req.json();
  const { email } = schema.parse(body);
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.contacts.create({
    email,
    audienceId: process.env.RESEND_AUDIENCE_ID!,
    unsubscribed: false
  });
  return Response.json({ ok: true });
}
```

### 10.3 Confirmación
Toast con `sonner` ("Te avisaremos el 17 de mayo a las 18:00 CET") + email transaccional opcional con plantilla de marca.

---

## 11 · Internacionalización (fase 2)

Si el cliente pide multi-idioma:
- Activar i18n con Next App Router: estructura `app/[lang]/page.tsx`
- Idiomas: `es` (default), `en` (mercado UK + internacional), `fr` (Francia)
- Diccionarios en `dictionaries/es.json`, `en.json`, `fr.json`
- Selector de idioma sutil en footer
- `hreflang` automático en metadata

**NO hacer esta fase antes del lanzamiento del 17 de mayo.** Es post-launch.

---

## 12 · Deploy a Vercel + dominio

### 12.1 Primer deploy
```bash
pnpm dlx vercel login
pnpm dlx vercel link
pnpm dlx vercel deploy --prod
```

Resultado: URL tipo `juana-sanchez-landing-xxx.vercel.app`. Probar en mobile real (no solo Chrome DevTools).

### 12.2 Dominio custom
1. Configurar `grupojuanasanchez.com` en Vercel → Domains
2. En IONOS DNS panel:
   - Tipo `A` → `76.76.21.21`
   - Tipo `CNAME` para `www` → `cname.vercel-dns.com`
3. SSL automático por Vercel
4. Redirect `juanasanchez.es` → no tocar, sigue siendo la tienda
5. Redirect `www.grupojuanasanchez.com` → `grupojuanasanchez.com` (apex)

### 12.3 Variables de entorno (Vercel project settings)
```
RESEND_API_KEY=re_xxxxx
RESEND_AUDIENCE_ID=xxxxx
NEXT_PUBLIC_INSTAGRAM_URL=https://instagram.com/grupojuanasanchez
NEXT_PUBLIC_WHATSAPP=https://wa.me/34613775981
NEXT_PUBLIC_LAUNCH_DATE=2026-05-17T18:00:00+02:00
```

### 12.4 Vercel Analytics + Speed Insights
Activar ambos desde el panel. Gratis para hobby tier. Validar después del primer deploy que envían datos.

---

## 13 · Plan de fases — en qué orden ejecutar

### Fase 0 · Setup (1-2h)
- [ ] Inicializar Next + shadcn + dependencies
- [ ] Configurar globals.css con OKLCH
- [ ] Configurar next/font con las 5 familias
- [ ] Extraer imágenes y video del HTML base64 a `/public/assets/`
- [ ] Deploy inicial vacío a Vercel para confirmar pipeline

### Fase 1 · Estructura sin animación (4-6h)
- [ ] Crear los 15 componentes de sección con copy real
- [ ] Maquetar layouts sin motion (CSS estático)
- [ ] Navegación + scroll a anchors
- [ ] Footer con marquee CSS-only
- [ ] **Hito**: la página entera se ve bien en desktop y mobile sin animación

### Fase 2 · Countdown y formulario (2-3h) ⚠️ PRIORIDAD POR EL 17/05
- [ ] `LaunchCountdown` con countdown live a `2026-05-17T18:00:00+02:00`
- [ ] Dialog + formulario de captura de email
- [ ] API route `/api/subscribe` con Resend
- [ ] Probar suscripción end-to-end

### Fase 3 · Animaciones premium (6-8h)
- [ ] Split text en hero, manifesto, declaration
- [ ] Stats count-up con motion values
- [ ] Sticky scroll storytelling en chapters
- [ ] Image crossfade en sticky visual
- [ ] Magnetic cursor en CTAs
- [ ] Body bg transition cream → black en Printellar
- [ ] Scroll progress indicator superior
- [ ] Smooth scroll Lenis global
- [ ] Tick animation en countdown digits

### Fase 4 · SEO + Performance (2-3h)
- [ ] OG image dinámico con `next/og`
- [ ] Schema.org JSON-LD
- [ ] sitemap.ts + robots.ts + manifest.ts
- [ ] Vercel Image Optimization en todas las `<img>` → `<Image>`
- [ ] Audit Lighthouse → ajustes hasta hit targets

### Fase 5 · Deploy producción (1-2h)
- [ ] Conectar dominio `grupojuanasanchez.com`
- [ ] Configurar variables de entorno
- [ ] Activar Analytics + Speed Insights
- [ ] Test cross-browser (Safari iOS, Chrome Android)
- [ ] Comunicar URL al cliente

**Total estimado**: 15-24 horas para llevarlo al nivel Hermès. Con un sprint enfocado, 3 días con foco completo.

---

## 14 · Tareas explícitas que ESTÁN bloqueadas por el cliente

No avances en estas hasta tener el input real:

1. **Lista de boutiques reales** en España (12 ciudades placeholder en uso ahora)
2. **Fotos reales del taller** y productos individuales (necesario al menos 5-10 fotos profesionales)
3. **Logo SVG vectorial** del monograma JS dorado (actualmente JPG)
4. **Audiencia ID de Resend** (cliente debe crear cuenta o decidir provider)
5. **Confirmación del slogan del Pull Quote** (propuse 3 opciones, default es "Un legado. Tres firmas. Cincuenta años cosiendo lo único que no caduca.")
6. **Email corporativo de marca**: actualmente `juanasalmacen@gmail.com` — para una marca de este nivel debería ser `hola@grupojuanasanchez.com` antes de publicar

---

## 15 · Decisiones de diseño que NO se cambian

Estas están validadas y no requieren discusión:

- Tres mundos cromáticos diferenciados (crema+malva / crema+mint / negro+dorado)
- Tipografía Italiana como display principal (NO Playfair, NO Cormorant para titulares de hero)
- Layout editorial por capítulos con números romanos
- Sin sliders/carousels de producto (esto NO es una tienda, es branding)
- Sin pop-ups intrusivos (excepto el dialog del countdown abierto por click)
- Sin chat widget tipo Intercom (rompe la atmósfera editorial)
- Sin cookies banner GDPR de terceros (usar uno custom mínimo de una línea)
- Sin testimonios "fake luxury" (testimonios reales solo si la gerente los aprueba)

---

## 16 · Tono editorial — guía de copy

Mantener estos principios al escribir cualquier copy nuevo:

- **Frases cortas, ritmo de tres**: "Un legado. Tres firmas. Cincuenta años."
- **Verbos artesanales**: coser, cuidar, sostener, transmitir, recordar. NO: comprar, encontrar, descubrir (vacíos)
- **Sin superlativos vacíos**: nunca "el mejor", "el único", "increíble". Sí concreto: "cincuenta años", "Cibeles 2012", "Pabellón 8 Stand C35"
- **Italic en cursiva selectiva**: una palabra por frase, no más, para marcar el énfasis
- **Mayúsculas pequeñas para metadata**: nombre de pasarelas en MAYÚSCULAS, eyebrows en mayúscula con tracking 0.3em
- **Números romanos** en fechas decorativas: MCMLXXV en lugar de 1975 (solo en footer y attribution)

---

## 17 · Cuándo pedir ayuda al usuario

Pide al usuario (no asumas) cuando:
- Necesites credenciales (Vercel token, IONOS, Resend API key, Mailchimp)
- Falten datos del cliente (lista de boutiques, fotos reales, copy nuevo)
- Haya conflicto entre el HTML base y este brief (este brief gana — pero notifica)
- Quieras introducir una dependencia nueva no listada en §3

NO pidas confirmación para:
- Refactor interno de componentes
- Decisiones de naming
- Microcopy obvio
- Optimizaciones de performance

---

## 18 · Cierre

El HTML que vas a recibir es una **buena spec visual**, no un buen producto final. Tu trabajo es preservar la **atmósfera editorial** y elevarla con animaciones, performance y prácticas modernas que solo se logran con Next + Motion.

El cliente espera nivel **Hermès**, no nivel "landing de agencia". Si una decisión técnica te ahorra tiempo pero abarata el resultado, **no la tomes**. Pregunta primero.

Cuando termines la Fase 2 (countdown funcional y formulario online), publica preview en Vercel y pásale el link al usuario para validar antes de seguir con la Fase 3. No esperes a tenerlo "todo perfecto" para mostrar.

Buena suerte. Coser, no construir.
