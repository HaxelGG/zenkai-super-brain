# Auditoría de la Landing Page — Grupo Juana Sánchez

**Sitio:** https://grupo-juana-sanchez.vercel.app
**Stack:** Next.js 15 (App Router) sobre Vercel · edge cache activo
**Fecha de la auditoría:** 21 de mayo de 2026
**Metodología:** Mediciones reales sobre la página en producción (tiempos de respuesta, pesos de transferencia con compresión Brotli, cabeceras HTTP, negociación de formato de imagen) combinadas con revisión del código fuente.

---

## Resumen ejecutivo

La landing de Grupo Juana Sánchez es un sitio **sólido y profesional**, con una estética editorial de nivel agencia, un SEO técnico muy completo y una respuesta de servidor rápida. El margen de mejora se concentra en la **eficiencia de assets** (fuentes y JavaScript de animación) y en el **endurecimiento de seguridad** mediante cabeceras HTTP.

### Puntuación global: **8.6 / 10**

| Área | Nota |
|---|---|
| Diseño visual / estética | 9.0 |
| Tipografía | 9.0 |
| Coherencia de marca | 8.5 |
| SEO técnico | 9.0 |
| Velocidad de respuesta (TTFB / edge) | 9.0 |
| Animación / interacción | 8.5 |
| Peso de assets (JS + fuentes) | 7.0 |
| Seguridad (cabeceras) | 7.5 (8.5 tras P1) |
| Accesibilidad | 7.5 |
| Conversión / CTAs | 8.0 |

---

## Métricas medidas

| Métrica | Valor | Veredicto |
|---|---|---|
| TTFB (time to first byte) | 0.33 – 0.47 s (cache HIT) | Muy bueno |
| HTML | 104 KB → 17.6 KB comprimido (Brotli) | Excelente |
| JS + CSS transferido | ~370 KB (≈349 JS + 21 CSS) | Pesado |
| Chunk de JS mayor | ~130 KB (Motion / React / Lenis) | Pesado |
| Fuentes | ~275 KB en 6 archivos woff2 (mayor: 120 KB) | Pesado |
| Imagen hero (LCP) | Precargada · AVIF 40.9 KB | Muy bueno |
| Formatos de imagen | AVIF + WebP | Óptimo (tras P1) |
| Compresión (Brotli / gzip) | Activa | Óptimo |
| HSTS | Activo | Óptimo |
| Cabeceras de seguridad | Aplicadas (tras P1) | Bueno |
| SEO técnico | Schema.org, OpenGraph, sitemap, robots, manifest | Excelente |

---

## Fortalezas

- **Estética y tipografía de nivel agencia.** Sistema tipográfico coherente (Italiana, Cormorant, Fraunces, Jost, JetBrains Mono) y una paleta cromática cuidada (crema, malva, menta, dorado, marrón tabaco) que da a cada una de las tres firmas su propio mundo sin perder unidad.
- **Base técnica moderna y limpia.** Next.js 15, componentes bien organizados, renderizado estático con caché de edge.
- **SEO técnico muy completo.** Datos estructurados Schema.org, imagen OpenGraph dinámica, sitemap, robots y manifest PWA.
- **Respuesta de servidor rápida.** TTFB por debajo de medio segundo gracias al edge cache de Vercel.
- **Detalles de marca cuidados.** Microcopys, espaciados, numeración y color trabajados con criterio editorial.

## Áreas de mejora

El grueso del margen está en eficiencia de assets, no en diseño ni en arquitectura.

---

## Recomendaciones priorizadas

### P1 — Alto impacto, bajo esfuerzo · **IMPLEMENTADO**

**1. Activar AVIF en imágenes.** Antes solo se servía WebP. Con AVIF habilitado, la imagen del hero pasó de 70.5 KB (JPEG) / 51.5 KB (WebP) a **40.9 KB (AVIF)** — un ahorro del 42 % frente a JPEG y del 21 % frente a WebP, aplicable a todas las fotos del sitio.

**2. Cabeceras de seguridad.** Se añadieron `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` y `Permissions-Policy` (antes no existía ninguna). El `Content-Security-Policy` se deja para un paso dedicado, ya que requiere pruebas para no bloquear los scripts inline de Next, Motion ni Vercel Analytics.

### P2 — Alto impacto, esfuerzo medio · pendiente

**3. Aligerar las fuentes (~275 KB).** Seis archivos woff2, uno de 120 KB. Acciones: limitar a los pesos realmente usados de cada familia, subsetear a `latin`, y evaluar si las cinco familias son imprescindibles (Cormorant y Fraunces son ambas serif). Objetivo: bajar a 120–150 KB.

**4. Reducir el JavaScript de animación (Motion / Lenis).** Es el mayor peso individual (~130 KB). Cargar Motion solo en las secciones que lo usan y trasladar las animaciones simples a CSS / IntersectionObserver. Objetivo: First Load JS por debajo de 200 KB, mejorando el Total Blocking Time y el INP.

### P3 — Pulido

**5. Caché de imágenes.** Afinar la retención de las imágenes optimizadas (gestionada por el edge de Vercel).

**6. Accesibilidad.** Auditar el contraste de los textos tenues (rótulos a baja opacidad pueden quedar por debajo del ratio 4.5:1) y verificar el foco visible en todos los elementos interactivos.

**7. Descubribilidad de la navegación del timeline.** Hacer las flechas de la línea de tiempo algo más evidentes como método de navegación.

**8. Mantenimiento del countdown.** La fecha de lanzamiento (3 de junio de 2026) está fija; tras esa fecha el banner cambia automáticamente a "Ya disponible".

---

## Conclusión

Con una base de **8.6 / 10**, la landing ya transmite calidad y profesionalismo. Completadas las recomendaciones P1 (hechas) y P2 (fuentes y JavaScript), el sitio se situaría con holgura en el rango **9 – 9.5**, con tiempos de carga más ligeros y una postura de seguridad reforzada — sin sacrificar nada del diseño actual.
