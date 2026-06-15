# BRIEF v2 — Addendum al proyecto en curso

> **Este documento se SUMA al `CLAUDE-CODE-BRIEF.md` original. No lo reemplaza.**
>
> Asume que ya estás trabajando en el proyecto Next.js + Tailwind + shadcn con la estructura, paleta y plan de fases definido en el brief v1. Este addendum introduce **tres cambios nuevos** que se aplican sobre lo ya construido o en construcción.
>
> Léelo entero antes de tocar nada. Los cambios afectan estructura de página, navegación y experiencia de cursor. No son cosméticos.

---

## 0 · TL;DR

| # | Cambio | Impacto |
|---|--------|---------|
| 1 | FIMI Valencia 2026 está **EN VIVO HOY** (14-16 mayo). La sección sube de posición y aparece una **burbuja flotante** persistente | Reordenamiento de secciones + nuevo componente flotante + Event Config Pattern |
| 2 | Botón **WhatsApp en la nav superior** con mensaje preformateado | Modificación del componente Nav |
| 3 | **Experiencia de cursor premium**: magnetic cursor en CTAs + cursor follower minimalista global | Nuevo componente `<MagneticCursor />` + hook `useMagnetic` |

**Tiempo estimado adicional**: 4-6 horas sobre el plan original. Cabe en la Fase 3 (animaciones premium) del brief v1, §13.

---

## 1 · Cambio estructural — reordenamiento de secciones

### 1.1 Nuevo orden de la landing (de top a bottom)

| Posición | Componente | Cambio vs brief v1 |
|----------|-----------|-------|
| 1 | `EventStrip` (top bar negro) | sin cambios |
| 2 | `Nav` | **+ botón WhatsApp** (ver §3) |
| 3 | `Hero` | sin cambios |
| **4** | **`FimiEvent`** | **↑ subió de la posición 13 a la 4** |
| 5 | `LaunchCountdown` | bajó un puesto |
| 6 | `Declaration` | bajó un puesto |
| 7 | `PullQuote` | bajó un puesto |
| 8 | `Timeline` | bajó un puesto |
| 9 | `TrioIntro` | bajó un puesto |
| 10 | `ChapterJuana` | bajó un puesto |
| 11 | `ChapterLolikas` | bajó un puesto |
| 12 | `ChapterPrintellar` | bajó un puesto |
| 13 | `Manifesto` | bajó un puesto |
| 14 | `Shops` | sin cambios |
| 15 | `Footer` | sin cambios |
| 🆕 | `<FimiLiveBubble />` | **flotante global, no es sección** |
| 🆕 | `<MagneticCursor />` | **layer global, no es sección** |

### 1.2 Razón del reordenamiento

FIMI Valencia es la feria de moda infantil más importante de Europa y el cliente está participando esta semana. Mientras la feria esté EN VIVO, ese es el evento más urgente — más que el countdown al lanzamiento de la tienda. Cuando termine FIMI (16 mayo 20:00), la sección y burbuja se ocultan automáticamente y el LaunchCountdown sube al puesto 4 sin intervención.

---

## 2 · Event Config Pattern — fechas centralizadas

Crea un único módulo de configuración para todos los eventos. Cualquier sección que dependa de un evento (FimiEvent, FimiLiveBubble, EventStrip) lee de aquí.

### 2.1 `src/lib/events.ts`

```typescript
export type EventConfig = {
  id: string;
  label: string;
  shortLabel: string;
  where: string;
  whereShort: string;
  start: Date;
  end: Date;
  mapUrl?: string;
  ctaUrl?: string;
};

export const EVENTS: Record<string, EventConfig> = {
  fimi: {
    id: 'fimi',
    label: 'FIMI Valencia 2026 — Edición 40',
    shortLabel: 'FIMI Valencia 2026',
    where: 'Feria Valencia · Pabellón 8 · Stand C35',
    whereShort: 'Pab. 8 · Stand C35',
    // Hora de Madrid (CEST = UTC+2 en mayo)
    // 14 mayo 00:00 CEST → 13 mayo 22:00 UTC
    start: new Date(Date.UTC(2026, 4, 13, 22, 0, 0)),
    // 16 mayo 23:59 CEST → 16 mayo 21:59 UTC
    end:   new Date(Date.UTC(2026, 4, 16, 21, 59, 0)),
    mapUrl: 'https://maps.google.com/?q=Feria+Valencia+Pabellón+8',
    ctaUrl: 'https://maps.google.com/?q=Feria+Valencia+Pabellón+8'
  },
  launch: {
    id: 'launch',
    label: 'Lanzamiento nueva colección Juana Sánchez',
    shortLabel: 'Nueva colección',
    where: 'juanasanchez.es',
    whereShort: 'Tienda online',
    // 17 mayo 18:00 CEST → 17 mayo 16:00 UTC
    start: new Date(Date.UTC(2026, 4, 17, 16, 0, 0)),
    end:   new Date(Date.UTC(2026, 4, 24, 16, 0, 0)), // 7 días post-launch
    ctaUrl: 'https://www.juanasanchez.es'
  }
};

export type EventStatus = 'upcoming' | 'live' | 'ended';

export function getEventStatus(ev: EventConfig, now: Date = new Date()): EventStatus {
  if (now < ev.start) return 'upcoming';
  if (now > ev.end) return 'ended';
  return 'live';
}

export function msUntil(date: Date, now: Date = new Date()): number {
  return date.getTime() - now.getTime();
}
```

### 2.2 Uso esperado en componentes

```typescript
import { EVENTS, getEventStatus } from "@/lib/events";

// En FimiEvent.tsx
const status = getEventStatus(EVENTS.fimi);
if (status === 'ended') return null;  // se autodestruye
```

### 2.3 Variables de entorno (opcional, fase 2)

Si en el futuro el cliente quiere editar fechas sin redeploy, mover el objeto `EVENTS` a un Edge Config o KV de Vercel. Por ahora hardcoded está bien — son 2 eventos y la dueña no necesita autoservicio.

---

## 3 · Nuevo componente — `FimiEvent` (refactor) y `<FimiLiveBubble />`

### 3.1 `FimiEvent.tsx` — refactor del componente existente

La sección ya existe (estaba en posición 13). Hay que:
1. Moverla al puesto 4 en `app/page.tsx`
2. Cambiar su comportamiento según `getEventStatus(EVENTS.fimi)`:

```tsx
import { EVENTS, getEventStatus, msUntil } from "@/lib/events";

export function FimiEvent() {
  const ev = EVENTS.fimi;
  const status = getEventStatus(ev);
  if (status === 'ended') return null;

  return (
    <section className="event"> {/* mismo estilo del HTML original */}
      <div className="event-inner">
        <div className="event-left">
          {/* Tag dinámico */}
          {status === 'live' ? (
            <div className="live-tag live-tag--active">
              <span className="live-dot" />
              EN VIVO · Esta semana
            </div>
          ) : (
            <div className="live-tag">
              <span className="dot" />
              Próximo · {/* helper para days-until */}
            </div>
          )}

          <h2 className="event-title">
            {status === 'live' ? <>Estamos en<br /><em>FIMI Valencia.</em></>
                               : <>Nos vemos en<br /><em>FIMI Valencia.</em></>}
          </h2>
          {/* resto del contenido sin cambios */}
        </div>
        {/* event-right (composición visual) sin cambios */}
      </div>
    </section>
  );
}
```

### 3.2 `<FimiLiveBubble />` — burbuja flotante (componente nuevo)

**Comportamiento**:
- Aparece **solo cuando `status === 'live'`**
- Aparece **a los 4 segundos** después de carga inicial, no inmediato
- **Mobile**: posición `bottom-4 left-4 right-4` (no full-width, padding lateral)
- **Desktop**: posición `bottom-6 right-6`, ancho máximo 360px
- Tiene botón **cerrar (X)** que persiste decisión en `localStorage` con clave `js-bubble-fimi-dismissed` válida por 24h (no para siempre — si la vuelven a abrir mañana, debe reaparecer)
- Click en el cuerpo de la burbuja (no en el X) → abre `mapUrl` en nueva pestaña

**Diseño** (sigue la atmósfera negro + dorado):
```
┌──────────────────────────────────┐
│ ● EN VIVO                    [×]│
│                                 │
│ FIMI Valencia 2026              │
│ Pabellón 8 · Stand C35          │
│                                 │
│ Cómo llegar  →                  │
└──────────────────────────────────┘
```

**Implementación**:

```tsx
"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, MapPin } from "lucide-react";
import { EVENTS, getEventStatus } from "@/lib/events";

const DISMISS_KEY = "js-bubble-fimi-dismissed";
const DISMISS_HOURS = 24;
const SHOW_DELAY_MS = 4000;

export function FimiLiveBubble() {
  const [visible, setVisible] = useState(false);
  const ev = EVENTS.fimi;
  const status = getEventStatus(ev);

  useEffect(() => {
    if (status !== 'live') return;
    const raw = localStorage.getItem(DISMISS_KEY);
    if (raw) {
      const dismissedAt = parseInt(raw, 10);
      if (Date.now() - dismissedAt < DISMISS_HOURS * 3600 * 1000) return;
    }
    const t = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, [status]);

  const dismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  if (status !== 'live') return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.a
          href={ev.ctaUrl}
          target="_blank"
          rel="noopener"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          className="
            fixed z-[80]
            bottom-4 left-4 right-4
            md:bottom-6 md:right-6 md:left-auto md:w-[360px]
            bg-black/92 backdrop-blur-xl
            border border-gold/30
            p-5 pr-12
            text-cream
            shadow-2xl shadow-black/40
            cursor-pointer group
          "
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-gold">
              EN VIVO
            </span>
          </div>

          <div className="font-display text-2xl leading-tight mb-1">
            {ev.shortLabel}
          </div>
          <div className="font-mono text-[11px] tracking-[0.15em] text-cream/70 uppercase mb-4">
            {ev.whereShort}
          </div>

          <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.25em] uppercase text-gold-soft group-hover:translate-x-1 transition-transform">
            <MapPin className="w-3.5 h-3.5" />
            Cómo llegar →
          </div>

          <button
            onClick={dismiss}
            aria-label="Cerrar"
            className="absolute top-3 right-3 p-2 text-cream/50 hover:text-cream"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.a>
      )}
    </AnimatePresence>
  );
}
```

**Montaje**: en `app/layout.tsx`, dentro del body, como hermano del `<main>`. Es overlay global.

**Animación de entrada**: spring suave desde abajo. NO bouncy.
**Animación de salida**: igual pero invertida.

### 3.3 `EventStrip` — actualizar el top bar

El strip del HTML actual dice "Nueva colección · 17 Mayo · 18:00 · FIMI Valencia ...". Mientras FIMI esté en vivo, **invertir el orden**: FIMI primero, lanzamiento segundo.

```tsx
{statusFimi === 'live' && (
  <>
    <span className="live-dot" />
    <strong>EN VIVO · FIMI Valencia · Pab. 8 Stand C35</strong>
    <span className="sep">·</span>
    <span className="hide-mob">Nueva colección 17 Mayo · 18:00</span>
  </>
)}
{statusFimi !== 'live' && (
  <>
    <span className="live-dot" />
    <strong>Nueva colección · 17 Mayo · 18:00</strong>
    {/* etc */}
  </>
)}
```

---

## 4 · Nuevo componente — `<WhatsAppNavButton />`

### 4.1 Especificación visual

- **NO usar el verde clásico de WhatsApp Business** (`#25D366`). Rompe la atmósfera editorial premium.
- **Sí usar**: icono outline minimalista, color crema sobre fondo transparente. En hover, fondo `mauve/15` y borde `mauve/40`.
- **Desktop**: icono 16x16 + texto "Hablar con la casa" en `font-mono` 10px tracking 0.25em uppercase
- **Mobile**: solo icono dentro de un círculo de 40x40 (touch target adecuado)
- **Sobre secciones oscuras** (Printellar, FIMI, footer, launch): cambiar a borde `gold/40` y texto `gold-soft`. Detectar con el mismo IntersectionObserver que ya cambia la nav a `on-dark`.

### 4.2 Implementación

```tsx
"use client";
import { motion } from "motion/react";
import { MessageCircle } from "lucide-react";  // o un SVG outline custom de WhatsApp

const WA_URL = "https://wa.me/34613775981?text=" + encodeURIComponent(
  "Hola, vengo de la landing page Grupo Juana Sánchez"
);

export function WhatsAppNavButton() {
  return (
    <motion.a
      href={WA_URL}
      target="_blank"
      rel="noopener"
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      className="
        group inline-flex items-center gap-2
        px-3 py-2 md:px-4
        border border-ink/15 rounded-full
        font-mono text-[10px] tracking-[0.25em] uppercase
        text-ink/70 hover:text-mauve-deep hover:border-mauve/40 hover:bg-mauve/5
        transition-colors duration-300
        [.on-dark_&]:text-cream/70 [.on-dark_&]:border-gold/30
        [.on-dark_&]:hover:text-gold-soft [.on-dark_&]:hover:border-gold/60
      "
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle className="w-3.5 h-3.5 stroke-[1.5]" />
      <span className="hidden md:inline">Hablar con la casa</span>
    </motion.a>
  );
}
```

### 4.3 Mensaje preformateado exacto

```
Hola, vengo de la landing page Grupo Juana Sánchez
```

URL-encoded en el `?text=`:
```
https://wa.me/34613775981?text=Hola%2C%20vengo%20de%20la%20landing%20page%20Grupo%20Juana%20S%C3%A1nchez
```

### 4.4 Ubicación en el Nav

Insertar como **último elemento** del bloque `nav-links` (a la derecha de "Tiendas"). En mobile, mover al lado del menú hamburguesa (si lo añades) o reemplaza el último link visible.

### 4.5 SVG WhatsApp outline custom (si `lucide-react` no convence)

Si `MessageCircle` no se ve suficientemente "WhatsApp", reemplazar con SVG custom outline:

```tsx
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
  <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
  <path d="M9 10a.5 .5 0 0 0 1 0V9a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1" strokeLinecap="round" />
</svg>
```

---

## 5 · Nuevo componente — Experiencia de cursor premium

### 5.1 Filosofía

**No usar partículas tipo polvo de estrellas en el cursor.** Las marcas de lujo (Hermès, Bottega Veneta, Loewe, Aesop) no las usan porque distraen del producto y restan seriedad.

**Sí usar**:
- **Cursor follower minimalista** global — un círculo de 8px que sigue al cursor con leve delay
- **Magnetic effect** en CTAs específicos — el botón "atrae" el cursor y crece sutilmente cuando te acercas

El cliente preguntó por polvo de estrellas. Después de explicarle, dejamos ambas opciones documentadas; arrancamos con la sofisticada (follower + magnetic). Si más adelante el cliente confirma que SÍ quiere partículas, hay un toggle (§5.5).

### 5.2 `<MagneticCursor />` — cursor follower global

```tsx
"use client";
import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

export function MagneticCursor() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 24, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 300, damping: 24, mass: 0.4 });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Hide on touch devices and on prefers-reduced-motion
    const isTouch = window.matchMedia('(hover: none)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isTouch || reducedMotion) {
      if (ref.current) ref.current.style.display = 'none';
      return;
    }

    const onMove = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener('pointermove', onMove);

    // Grow over interactive elements
    const onOver = (e: Event) => {
      const t = e.target as HTMLElement;
      if (t.closest('a, button, [data-magnetic], [role="button"]')) {
        ref.current?.classList.add('is-active');
      } else {
        ref.current?.classList.remove('is-active');
      }
    };
    window.addEventListener('pointerover', onOver);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerover', onOver);
    };
  }, [x, y]);

  return (
    <motion.div
      ref={ref}
      style={{ x: springX, y: springY }}
      className="
        fixed top-0 left-0 z-[9999] pointer-events-none
        w-2 h-2 -ml-1 -mt-1
        rounded-full bg-ink/70
        mix-blend-difference
        transition-[width,height,margin] duration-300 ease-out
        [&.is-active]:w-8 [&.is-active]:h-8
        [&.is-active]:-ml-4 [&.is-active]:-mt-4
        [&.is-active]:bg-ink/0
        [&.is-active]:border [&.is-active]:border-ink/50
      "
    />
  );
}
```

**Detalles**:
- 8x8 px por defecto, crece a 32x32 sobre clickeables
- `mix-blend-difference` para que se vea bien sobre claro y oscuro
- Spring suave (no perfect tracking — ese delay es lo que se siente premium)
- Se oculta en touch y en reduced-motion
- Se monta en `app/layout.tsx` como hermano del main

### 5.3 `useMagnetic` — hook para el magnetic effect en CTAs

```tsx
"use client";
import { useRef, useEffect } from "react";
import { useMotionValue, useSpring, animate } from "motion/react";

export function useMagnetic<T extends HTMLElement>(strength = 0.25) {
  const ref = useRef<T>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 240, damping: 22, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 240, damping: 22, mass: 0.5 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(hover: none)').matches) return;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      x.set((e.clientX - cx) * strength);
      y.set((e.clientY - cy) * strength);
    };
    const onLeave = () => { x.set(0); y.set(0); };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [x, y, strength]);

  return { ref, x: sx, y: sy };
}
```

### 5.4 Aplicación del magnetic en CTAs específicos

Aplicar en:
- Los **3 botones de tienda** (`Shops`)
- El **CTA principal del `LaunchCountdown`** ("Avísame por email" / "Sé de las primeras")
- El **botón WhatsApp** del Nav

Ejemplo en Shops:
```tsx
function ShopButton({ brand, name, href }) {
  const { ref, x, y } = useMagnetic(0.3);
  return (
    <motion.a ref={ref} href={href} style={{ x, y }} className="shop-btn">
      {/* contenido */}
    </motion.a>
  );
}
```

Marcar otros elementos como magnetic en HTML con `data-magnetic` para que el cursor follower también los detecte y crezca.

### 5.5 ⚠️ Opción "polvo de estrellas" (deshabilitada por defecto)

El cliente preguntó por partículas de estrellas siguiendo al cursor + explosión al click. **No implementar a menos que el cliente lo confirme explícitamente.** Mi recomendación es no hacerlo (rompe la atmósfera editorial). Pero documentado y listo por si cambia de opinión:

```tsx
// src/lib/feature-flags.ts
export const FEATURE_FLAGS = {
  cursorStarDust: false  // true → activar partículas + click explosion
};
```

Si se activa, especificaciones obligatorias para que no se vea barato:
- **Tamaño**: 2-3px máximo
- **Color**: `gold-soft` con opacidad 0.4 (no blanco fluorescente)
- **Cantidad**: máximo 1 partícula nueva cada 80ms al moverse el cursor
- **Vida útil**: 600ms con fade-out cubic-out
- **Click explosion**: máximo 8 partículas, dispersión radial, vida 400ms
- **Solo desktop**, deshabilitado en touch y `prefers-reduced-motion`
- **No competir** con el video de Lolikas autoplay (pausar partículas cuando el video está en viewport)

Implementación sugerida: canvas 2D fijo full-screen con `pointer-events: none`. NO usar muchos divs animados (mata performance).

---

## 6 · Decisiones tomadas con default (cambia si no te convencen)

Como no confirmaste antes de pedir el brief, tomé los siguientes defaults razonables. Cambiar requiere editar 1-3 líneas:

| Decisión | Default | Dónde se cambia |
|----------|---------|-----------------|
| Rango FIMI | 14 mayo 00:00 → 16 mayo 23:59 (hora Madrid) | `src/lib/events.ts` |
| Icono WhatsApp | Outline minimalista (no verde clásico) | `WhatsAppNavButton.tsx` |
| Texto botón WhatsApp | "Hablar con la casa" | `WhatsAppNavButton.tsx` |
| Mensaje preformateado | "Hola, vengo de la landing page Grupo Juana Sánchez" | `WhatsAppNavButton.tsx` |
| Experiencia de cursor | Follower + magnetic, sin partículas | `app/layout.tsx` (montar `<MagneticCursor />`) |
| Polvo de estrellas | Deshabilitado | `src/lib/feature-flags.ts` |
| Posición burbuja desktop | `bottom-6 right-6`, ancho 360px | `FimiLiveBubble.tsx` |
| Persistencia "cerrar" | 24h en localStorage | `DISMISS_HOURS` en `FimiLiveBubble.tsx` |
| Delay aparición burbuja | 4 segundos post-load | `SHOW_DELAY_MS` |

---

## 7 · Tareas concretas a sumar al plan de fases

Insertar en la **Fase 3 (animaciones premium)** del brief v1 §13:

### Fase 3 — adendum

- [ ] Crear `src/lib/events.ts` con `EVENTS` y helpers
- [ ] Mover `<FimiEvent />` al puesto 4 en `app/page.tsx`
- [ ] Refactor de `<FimiEvent />` para leer status dinámico
- [ ] Refactor de `<EventStrip />` para priorizar FIMI cuando está live
- [ ] Crear `<FimiLiveBubble />` con localStorage persistence
- [ ] Montar `<FimiLiveBubble />` en `app/layout.tsx`
- [ ] Crear `<WhatsAppNavButton />` y añadir al `<Nav />`
- [ ] Crear `<MagneticCursor />` (cursor follower global)
- [ ] Montar `<MagneticCursor />` en `app/layout.tsx`
- [ ] Crear hook `useMagnetic` en `src/lib/hooks/useMagnetic.ts`
- [ ] Aplicar `useMagnetic` en `Shops` (3 botones) + `LaunchCountdown` CTA + Nav WhatsApp button
- [ ] Crear `src/lib/feature-flags.ts` con `cursorStarDust: false`
- [ ] Testear con `(prefers-reduced-motion: reduce)` activado — todos los efectos deben desactivarse
- [ ] Testear en touch device — cursor follower y magnetic deben estar ocultos

---

## 8 · Consideraciones de accesibilidad

Estos tres cambios pueden afectar accesibilidad si se implementan mal. Reglas duras:

1. **MagneticCursor y useMagnetic**: deshabilitar **siempre** si `(prefers-reduced-motion: reduce)` o `(hover: none)`. NO opcional.
2. **FimiLiveBubble**: debe ser dismissable por teclado (`Escape` cierra). Botón × accesible con `aria-label="Cerrar"`.
3. **WhatsAppNavButton**: `aria-label="Contactar por WhatsApp"` (en mobile que solo muestra icono). `rel="noopener"` obligatorio.
4. **Cursor follower NUNCA debe interceptar clicks** (`pointer-events: none` siempre).
5. **El botón × de la burbuja no debe dispararcss el evento click del link parent** (usar `stopPropagation`).

---

## 9 · Performance — coste estimado

| Componente | JS añadido | Impact LCP | Notas |
|-----------|------------|------------|-------|
| Event config + status helpers | < 1KB | 0 | Solo lógica |
| FimiLiveBubble | ~4KB con motion | < 5ms | Lazy-mounta con setTimeout |
| WhatsAppNavButton | ~2KB | 0 | Static markup, motion para hover |
| MagneticCursor + useMagnetic | ~6KB con motion | < 8ms | Spring + RAF muy ligero |
| **Total** | **~13KB gz** | despreciable | Cabe en el budget de §8 del brief v1 |

---

## 10 · Para probar después de implementar

1. Cargar la página en desktop → cursor follower aparece, 8px crema
2. Pasar sobre cualquier link → cursor crece a 32px (anillo)
3. Pasar sobre los 3 botones de tienda → ligero magnetic pull
4. Click cualquier botón shop → magnetic vuelve a 0 con spring
5. Cargar en mobile → cursor invisible, magnetic desactivado
6. Activar `prefers-reduced-motion` en DevTools → cursor desaparece, magnetic ya no atrae
7. Esperar 4 segundos en el primer load → burbuja FIMI aparece
8. Cerrar la burbuja → no vuelve a aparecer en las próximas 24h
9. Borrar localStorage → recargar → burbuja vuelve
10. Click en la burbuja (no en X) → abre Google Maps
11. Click en WhatsApp button del nav → abre WhatsApp con mensaje preformateado
12. Cambiar manualmente `EVENTS.fimi.end` a una fecha pasada → la sección FimiEvent y la burbuja desaparecen, el orden de la página se reordena solo

---

## 11 · Preguntas abiertas (resolver con el usuario antes de publicar)

- ¿El rango FIMI 14-16 mayo es correcto, o son solo 15-16? El poster original decía 15-16 pero el usuario verbalizó "hoy 14 estamos en vivo". Si es montaje el día 14 sin público, considerar bajar el rango a 15-16 y mostrar otro mensaje hoy ("Mañana en FIMI").
- ¿Cliente quiere también una **versión en inglés** del mensaje preformateado de WhatsApp para visitantes con `navigator.language === 'en-*'`? (no implementar a menos que se confirme)
- ¿Activar polvo de estrellas? Default: no. Si el cliente lo quiere igualmente, set `FEATURE_FLAGS.cursorStarDust = true`.

---

## 12 · Si algo del brief v1 contradice al v2

**El v2 gana siempre.** Es más reciente y específico. Si encuentras una contradicción que no se resuelve sola (por ejemplo el v1 dice "FIMI en posición 13" y este v2 dice "posición 4"), aplica el v2 sin preguntar y déjalo documentado en el commit message.

---

**Fin del brief v2.** Cuando termines la implementación de los 3 cambios, deploya a preview y comunica el URL al usuario para validar antes de marcar como done.
