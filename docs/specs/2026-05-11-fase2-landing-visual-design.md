# Spec · Fase 2 landing zenkai.systems — Visual design + storytelling

**Fecha:** 2026-05-11
**Estado:** draft · pendiente de dispatch
**Spec relacionado:** `docs/specs/2026-05-05-landing-zenkai-design.md` (estructura + tiers + sectores)
**Plan relacionado:** `docs/plans/2026-05-10-landing-zenkai-implementation.md` (Fase 2 expandida en este spec)
**Live actual:** `https://zenkai-web-rho.vercel.app` (versión placeholder de Fase 1)

---

## 0 · Objetivo

Transformar la landing de **"placeholder técnico que muestra datos"** a **"landing comercial que convierte visitantes en leads calificados"**.

Fase 1 cerró con la arquitectura completa: content collections funcionando, 5 tiers + 8 sectores renderizados, 404 con `noindex`, dark theme con tokens, fonts Inter Variable + JetBrains Mono Variable cargadas. Lo que NO tiene es identidad visual real, storytelling, copy de marketing, jerarquía de tiers, ni proof de capacidad. Fase 2 cierra ese gap.

---

## 1 · Criterios de éxito

La Fase 2 está cerrada cuando los 7 criterios se cumplen objetivamente:

1. **CONVERSIÓN** — Un visitante random debe entender en **<8 segundos** qué hace ZENKAI, para quién es, y por qué confiar. Test: pasarle la landing a 3 personas que no conozcan ZENKAI y preguntar "¿qué hace esta empresa y a quién le vende?". 3/3 deben acertar sin ayuda.

2. **DESEO** — El visitante debe **sentir** que ZENKAI es la agencia más avanzada de IA en LATAM/España, no solo verlo. Test: la landing debe lograr que el visitante quiera leer todo, no rebote al hero.

3. **JERARQUÍA VISUAL** — Lite y Starter destacados deben **dominar visualmente**, no estar en el mismo grid plano que Pro y Enterprise. Test: en un screenshot del fold de tiers, Lite + Starter deben ser perceptiblemente más prominentes (tamaño, peso visual, contraste, o posición).

4. **STORYTELLING** — La landing debe **contar una historia**, no listar datos. Cada sección debe llevar al visitante al siguiente nivel de compromiso emocional (problema → solución → diferenciación → proof → call to action).

5. **PROOF** — Aunque no hay casos de cliente todavía, debe haber **proof de capacidad técnica** visible (el panel ZENKAI mismo es proof · la arquitectura de 12 agentes es proof · stack visible es proof). La capa visual debe comunicar "construido por gente que sabe".

6. **PERFORMANCE** — Lighthouse score **≥ 90** en mobile y desktop en las 4 métricas (Performance · Accessibility · Best Practices · SEO). Carga inicial **<2s** en simulación 4G (Chrome DevTools throttling).

7. **ACCESIBILIDAD** — **WCAG AA mínimo**. Navegación por teclado funcional (tab order coherente, focus rings visibles, skip-link al main). Contraste de texto ≥ 4.5:1 (verificable con Lighthouse + axe-core).

---

## 2 · Referencias visuales (nivel de calidad esperado)

El subagent de Fase 2 debe internalizar estas referencias antes de empezar a diseñar:

| Referencia | Qué tomar de ahí |
|---|---|
| **Linear.app** | Dark theme premium · microinteracciones sutiles · copy directo · uso magistral de mono font como acento técnico |
| **Vercel.com** | Uso de gradientes sobre dark · jerarquía visual perfecta · grids con propósito · transiciones suaves |
| **Resend.com** | Landing de agencia técnica · copy que vende sin gritar · proof inline sin testimonios falsos |
| **Stripe.com** | Secciones que cuentan historia · ilustraciones funcionales · arquitectura de información clara |
| **Cursor.com** | Energía de producto AI nativo · demo visual del producto en hero · diferenciación clara vs competencia |

---

## 3 · Anti-referencias (lo que NO queremos)

- ❌ Landing de Bootstrap con templates de 2018
- ❌ WordPress con plugins de page builder
- ❌ Estilo "agencia tradicional" con stock photos y testimonios cliché
- ❌ Texto gigante centrado en cada sección sin propósito
- ❌ Demasiados emojis o iconos infantiles
- ❌ Animaciones excesivas que distraen del mensaje
- ❌ Hero con video autoplay genérico
- ❌ Carruseles de "Nuestros clientes" con logos inventados

---

## 4 · Decisiones estratégicas

Estas son decisiones cerradas por el usuario (NO re-discutir en dispatch · refinable en pulido):

### 4.1 — Hero TEXT-FIRST, no slogan-first

Mostrar la **propuesta concreta en 1 frase + sub-frase**. Sin lorem ipsum, sin "Revoluciona tu negocio con IA". El hero debe responder en su primera línea: ¿qué hago yo, ZENKAI, por vos?

Ejemplo de dirección (no copy final): *"Tu negocio en internet en 7 días. IA, agenda, WhatsApp, ads. Empezás por $300."*

El subagent NO inventa copy de hero — el copy real viene del usuario o Claude.ai web colaborando con el usuario.

### 4.2 — Sección Tiers rediseñada completamente

Tres opciones a evaluar por el subagent (decide en Tarea 2.2 con justificación):

- **(a) 2 + 3:** Lite + Starter en cards grandes arriba (destacadas, ocupan el ancho), Growth/Pro/Enterprise en row horizontal compacto abajo
- **(b) Toggle Pricing:** Tabs "Para empezar" (Lite + Starter) vs "Para escalar" (Growth + Pro + Enterprise)
- **(c) Tabla comparativa horizontal** con highlight visual en Lite + Starter (rows con accent background)

Recomendación del usuario: **(a)** o **(b)** sobre (c) porque (c) es más denso y menos emocional. Subagent elige y justifica.

### 4.3 — Iconos SVG reales (NO texto literal)

Reemplazar el patrón actual de Tarea 1.2 (`icon: "lucide:shopping-cart"` renderizado como `<span>` con el string literal) por **iconos SVG reales**.

Librerías a evaluar:
- **Lucide** (recomendado · ya tenemos los nombres en `web/src/content/sectores/*.md` · paquete `lucide-static` o `astro-icon` con `@iconify-json/lucide`)
- Heroicons (Tailwind-friendly · más limitado)
- Tabler Icons (set más grande · menos diseñado)

Decisión en Tarea 2.3 (parte del scope · el subagent puede recomendar al usuario antes de implementar si tiene duda).

### 4.4 — Copy real de sectores (3-4 frases por card + página dedicada)

Los 8 sectores hoy tienen `dolor_principal`, `copy_corto`, `copy_largo` como `"TODO: redactar en Fase 2"`. El bloqueante de Tarea 2.3 y 2.7 es que el usuario + Claude.ai web generen y validen el copy ANTES del dispatch.

Formato esperado por sector:
- `dolor_principal`: 1 frase concisa que captura el dolor central
- `copy_corto`: 1-2 frases para card preview en home (40-80 caracteres óptimo)
- `copy_largo`: 3-5 párrafos para la página dedicada `/sectores/<slug>` (200-400 palabras)

### 4.5 — Hero con elemento visual de impacto

El hero debe tener un elemento visual diferenciador (no solo texto + botón):

Opciones que el subagent puede proponer:
- Animación sutil (gradient shift sobre el fondo dark · partículas mínimas · líneas conectando agentes)
- Gradiente animado en el accent blue
- **Demo de producto** (typing effect: "Generando propuesta..." → propuesta aparece — refleja que la landing usa el mismo `/api/protocolo` que vende)

El demo de producto es la opción más fuerte si el subagent lo puede implementar sin agregar peso. Si requiere lib pesada (animation framework > 30 KB), preferir animación sutil con CSS puro.

### 4.6 — Sección NUEVA: "Cómo trabajamos"

3-4 pasos visuales que cuentan el journey del cliente:

1. **Diagnóstico** — conversación o form → entendemos tu negocio y dolor
2. **Propuesta** — `/api/protocolo` genera dos rutas (Eco / Pro) con precios reales
3. **Implementación** — equipo construye en N días según tier
4. **Operación** — entregamos · capacitamos · soporte continuo según tier

Visual: iconos + 1 línea de copy por paso · idealmente conectados visualmente (línea de flujo).

### 4.7 — Sección NUEVA: "Construido sobre infraestructura real"

Proof indirecto al panel interno sin exponerlo. Comunicar:

- "12 agentes IA especializados" (link visible a la lista de agentes · NO al panel interno)
- "11 sectores con módulos pre-construidos"
- "Workflows reales que ya operan: clasificación de leads, generación de propuestas, persistencia automática en CRM"
- Stack visible: Anthropic Claude · Airtable · Vercel · Make/n8n (logos pequeños · sin afiliación falsa)

Esto es proof sin caso de estudio externo. Va al final del fold, antes del form final.

### 4.8 — Footer profesional

Tres columnas en desktop · stack en mobile:

- **Marca + tagline + ubicación**: ZENKAI Growth Systems · "Digitalizamos empresas con IA" · Pereira, Colombia · Madrid, España (desde junio 2026)
- **Producto**: links a Planes, Sectores, Cómo trabajamos, Conversación
- **Legal + contacto**: Política de privacidad (placeholder en `/legal/privacidad`), Términos, `hola@zenkai.systems`, WhatsApp link
- **Cuarta columna pequeña (opcional)**: créditos técnicos "Construido con `/api/protocolo` · Astro + Vercel" linkeando al stack page o al repo público (decidir si exponer GitHub)

Copyright `© 2026 ZENKAI Growth Systems` en línea inferior.

---

## 5 · Estructura de tareas (10 tareas · 12-15h)

### Tarea 2.1 · Hero + NavBar reales (sin placeholder)
- Reemplazar `NavBar.astro` stub con NavBar sticky real: logo (PNG en `/brand/zenkai-logo-horizontal.png`) + links (Inicio, Planes, Sectores ▾ dropdown, Cómo trabajamos, Conversación) + CTA "Empezar"
- Reemplazar hero placeholder con hero real: headline + sub-headline + 2 CTAs (primario form scroll · secundario WhatsApp `wa.me/<num>`) + elemento visual de impacto (decisión §4.5)
- Mobile: hamburger menu funcional
- Decisión de paleta extendida acá si aplica (color secundario al accent #1E6FFF)
- **Estimación:** 2h

### Tarea 2.2 · Sección Tiers rediseñada
- Decidir formato (a/b/c de §4.2) con justificación en commit
- Implementar el nuevo grid/toggle/tabla
- Lite + Starter visualmente dominantes
- Pro + Enterprise sobrios con CTA "Agendar conversación estratégica"
- Reusar `TierCard.astro` pero permitir variante "compact" para los 3 no-destacados
- **Estimación:** 1.5h

### Tarea 2.3 · Sección Sectores con iconos SVG + copy real (HOME preview)
- Reemplazar `<span>` con el string `"lucide:shopping-cart"` por SVG real (instalar `astro-icon` + `@iconify-json/lucide` o `lucide-static`)
- Actualizar 8 archivos en `web/src/content/sectores/*.md` con `dolor_principal` + `copy_corto` reales (de copy validado por usuario)
- `SectorCard` muestra: icono SVG · nombre · `copy_corto` · `dolor_principal` · link a página dedicada
- **Bloqueante:** copy validado de los 8 sectores antes del dispatch
- **Estimación:** 1.5h (+ tiempo de generación de copy off-loop)

### Tarea 2.4 · Sección "Cómo trabajamos"
- 3-4 pasos según §4.6 · cada paso con icono + título + 1-2 frases
- Conexión visual entre pasos (línea, flecha, gradient)
- Component nuevo `ProcessSteps.astro`
- Mobile: stack vertical · desktop: row horizontal
- **Estimación:** 1.5h

### Tarea 2.5 · Sección "Proof de infraestructura"
- Component nuevo `InfraProof.astro`
- 3-4 stats numéricas: "12 agentes", "11 sectores", "8 workflows operativos", "$X procesados" (si hay datos · sino omitir el último)
- Stack logos pequeños (Anthropic, Airtable, Vercel, Astro) sin afiliación falsa
- Sin testimonios placeholder
- **Estimación:** 1h

### Tarea 2.6 · Footer profesional
- Reemplazar `Footer.astro` stub
- 3 columnas según §4.8 · stack en mobile
- Links a `/legal/privacidad` (placeholder route · página vacía con `noindex`) y `/legal/terminos` (igual)
- Decisión: incluir o no link a GitHub repo público
- **Estimación:** 1h

### Tarea 2.7 · Páginas dedicadas `/sectores/<slug>` (8 páginas)
- `web/src/pages/sectores/[slug].astro` con `getStaticPaths()` que itera la collection
- Cada página: hero específico al sector · `copy_largo` real · 5 TierCards con `modulos_por_sector[<slug>]` visible · CTA contextual al sector
- Canonical único por página
- **Bloqueante:** `copy_largo` validado de los 8 sectores antes del dispatch
- **Estimación:** 2h

### Tarea 2.8 · Pulido visual: animaciones, microinteracciones, gradientes, glows
- Decisión inicial: Motion lib vs CSS puro (trade-off bundle size vs polish)
- Hover states refinados en TierCard, SectorCard, CTAs
- Gradients sutiles en backgrounds de secciones (sin saturar el dark theme)
- Glow en CTAs destacados (Lite, Starter)
- Scroll-triggered fade-in en secciones (si Motion lib se aprueba) · sino solo `transition` CSS en hover/focus
- **Estimación:** 2h

### Tarea 2.9 · Performance + accesibilidad: Lighthouse audit + fixes
- Correr Lighthouse en mobile + desktop · capturar score baseline
- Fix issues hasta llegar a ≥90 en las 4 métricas
- Verificar contraste con axe-core (extension o CLI)
- Verificar navegación por teclado: tab order coherente, focus rings visibles, skip-link al `<main>`
- Verificar `prefers-reduced-motion` honra preferencia del usuario
- **Estimación:** 1.5h

### Tarea 2.10 · Visual regression check + QA cross-browser
- Browse skill: screenshots de cada página en mobile (375px), tablet (768px), desktop (1440px)
- Verificar render en Chrome, Firefox, Safari (acepta vía BrowserStack o equivalente si no hay Safari local)
- Documentar issues encontrados · fixes commit-by-commit
- Final: screenshot del fold de home en desktop · comparar con criterios de éxito §1 punto 3 (jerarquía visual)
- **Estimación:** 1h

**Total Fase 2:** 12-15h (rango por decisiones tomadas en cada tarea — Motion lib agrega 1-2h · iconos custom agrega 30 min · copy off-loop no cuenta acá)

---

## 6 · Dependencias bloqueantes

Antes del dispatch del subagent de Fase 2:

| # | Dependencia | Quién entrega | Status |
|---|---|---|---|
| 1 | **Copy real de los 8 sectores** (dolor_principal · copy_corto · copy_largo) | Usuario + Claude.ai web · subagent NO inventa | ⏸️ pendiente |
| 2 | **Decisión paleta extendida** — ¿agregamos color secundario al accent #1E6FFF? (violeta complementario · verde success · ámbar warning extendido) | Usuario | ⏸️ pendiente · decisión en Tarea 2.1 |
| 3 | **Decisión librería de iconos** — Lucide (recomendado) vs Heroicons vs Tabler | Usuario o subagent con justificación | ⏸️ pendiente · decisión en Tarea 2.3 |
| 4 | **Decisión animaciones** — Motion library (ej. `motion` o `@svelte-put/motion` adapter) vs solo CSS transitions · trade-off bundle size vs polish | Usuario o subagent con justificación | ⏸️ pendiente · decisión en Tarea 2.8 |
| 5 | **Copy real del hero** (1 frase + sub-frase) | Usuario + Claude.ai web | ⏸️ pendiente · bloqueante de Tarea 2.1 |
| 6 | **Logo cuadrado real** (placeholder actual usa el horizontal · TODO en SeoHead.astro) | Usuario (genera o aprueba) | ⏸️ pendiente · no crítico para Fase 2 pero deuda visible |

Tareas 2.1, 2.3, 2.7 son bloqueantes por copy. El resto puede arrancar sin copy (estructura primero, copy después en pase final).

---

## 7 · Out of scope (esta Fase 2)

- ❌ Formulario funcional `/api/lead` — eso es Fase 3
- ❌ Páginas `/planes`, `/gracias`, `/conversacion` — quedan en Fase 2 del plan v1.2 si entran en el budget de 12-15h, sino se mueven a Fase 3
- ❌ OG image generada (queda placeholder `/brand/og-image.png` · imagen real en Fase 3 o ad-hoc)
- ❌ Sitemap + robots.txt automatizado — Fase 3
- ❌ Casos de estudio reales (no existen aún · llegan post-primer-cliente)
- ❌ Multi-idioma — fuera del scope 2026 (todo en español hoy)
- ❌ Dark/light theme toggle — la landing es dark-only por decisión estética

---

## 8 · Métricas de éxito Fase 2 (medibles post-deploy)

| Métrica | Target | Cómo medir |
|---|---|---|
| Lighthouse Performance (mobile) | ≥ 90 | Chrome DevTools · 4G throttle |
| Lighthouse Accessibility | ≥ 90 | idem |
| Lighthouse SEO | ≥ 90 | idem |
| Lighthouse Best Practices | ≥ 90 | idem |
| First Contentful Paint | < 1.2s | Web Vitals |
| Largest Contentful Paint | < 2.0s | Web Vitals |
| Cumulative Layout Shift | < 0.05 | Web Vitals |
| Total Blocking Time | < 200ms | Lighthouse |
| Bundle size (gzipped) | < 80 KB total CSS + JS | `ls -la dist/_astro/*` |
| Bounce rate del visitor que llegó al hero | <60% (sin Analytics aún · monitor post-Fase 3) | Vercel Web Analytics |

---

## 9 · Riesgos identificados

- **Riesgo 1 · Copy genérico:** si el copy de sectores se genera con prompt débil, queda IA-evidente y rompe criterio §1 punto 2 (deseo). Mitigación: copy validado por usuario antes de dispatch · iteración 2-3 pases en Claude.ai web.
- **Riesgo 2 · Bundle size con Motion lib:** si se aprueba Motion library, puede agregar 30-60 KB al JS · podría romper criterio §1 punto 6 (performance). Mitigación: medir antes de mergear · si pasa el budget, fallback a CSS puro.
- **Riesgo 3 · Diferencias mobile/desktop:** referencias (Linear, Vercel) son magistrales en desktop pero a veces flojas en mobile. Mitigación: QA específica mobile-first en Tarea 2.10 con screenshots a 375px.
- **Riesgo 4 · Sobre-diseño:** el subagent puede caer en "AI slop polish" (gradientes excesivos, glows en todo, animaciones por gusto). Mitigación: criterios de éxito explícitos en §1 + anti-referencias §3 + visual check del usuario tras cada tarea bloqueante (2.1, 2.2, 2.8).
- **Riesgo 5 · Deriva de scope:** 10 tareas con creatividad estética tienden a expandir. Mitigación: cada tarea cierra con commit · estimaciones explícitas · usuario aprueba antes de continuar.

---

## 10 · Próxima acción

1. Usuario + Claude.ai web generan copy validado de los 8 sectores (dolor_principal · copy_corto · copy_largo · hero copy)
2. Usuario decide paleta extendida (sí/no) e iconos (Lucide recomendado)
3. Dispatch Tarea 2.1 con subagent fresh + scope del Tarea 2.1 + copy del hero + decisión de paleta

Fin del spec.
