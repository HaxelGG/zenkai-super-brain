# Landing pública ZENKAI · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir y desplegar `zenkai.systems` — landing pública en Astro con catálogo de los 5 tiers, módulos por sector, formulario de leads que persiste en Airtable y dispara `/api/protocolo` para planes ≥ Starter, FAB de WhatsApp y page de "agendar conversación" para Pro/Enterprise. MVP en 4-5 días.

**Architecture:** Subcarpeta `web/` dentro de `Kenzai Super Brain/` (paralela a `panel/`). Astro 5 SSG + serverless endpoint `/api/lead.ts` (sólo) corriendo en Node runtime de Vercel. Content Collections con Zod para tiers (5) y sectores (8). APIs existentes en raíz `/api/clasificar` y `/api/protocolo` se invocan vía URL absoluta. Deploy en project Vercel separado (`zenkai-web`) con root `web/` y dominio apex `zenkai.systems`.

**Tech Stack:** Astro 5.x · TypeScript estricto · Tailwind CSS 4.x · Zod · `airtable` 0.12 · `resend` SDK · `@fontsource-variable/inter` y `@fontsource-variable/jetbrains-mono` self-hosted · Node 20+ · Vercel.

**Spec de referencia:** `docs/specs/2026-05-05-landing-zenkai-design.md`

**Estimación total:** 32-40h ≈ 4-5 días @ 8h/día.

**Versión del plan:** v1.1 (2026-05-10) — aprobado con ajustes:
- Email obligatorio en form (no opcional · sin email el lead es inutilizable)
- Cloudflare como nameserver intermedio diferido a Sprint 2 post-launch (Hostinger DNS directo es suficiente para v1)
- Tarea 0.0 nueva: pre-flight check de assets, env vars, .gitignore, Vercel CLI

---

## Assets y config confirmados (cierre plan v1.1)

| # | Item | Valor confirmado |
|---|------|------------------|
| 1 | Marca | ZENKAI · AI Growth Systems |
| 2 | Dominio apex | `zenkai.systems` (Hostinger, ya registrado) |
| 3 | Logo horizontal | `C:\Users\jordy\Desktop\zenkai ai agency\ChatGPT Image Apr 21, 2026, 11_04_37 AM.png` |
| 4 | Logo cuadrado (favicon) | disponible localmente · path por confirmar en Tarea 0.0 |
| 5 | Email comercial | `hola@zenkai.systems` (Hostinger Starter Business Email · creado) |
| 6 | WhatsApp E.164 | `+573226272302` (display: `+57 322 627 2302`) |
| 7 | Cal.com event link | `https://cal.com/zenkai-growth-systems/strategy-call` |
| 8 | Resend API key | en `.env` local + Vercel env vars |
| 9 | Resend dominio | `zenkai.systems` verificado · Enable Sending ON · Receiving OFF |
| 10 | DNS provider | Hostinger directo (Cloudflare diferido a Sprint 2) |

### Paleta de colores (extraída del logo · NO reutilizar índigo del panel)

| Token | Valor | Uso |
|-------|-------|-----|
| `--bg-primary` | `#000000` o `#0A0A0A` | Background principal de la landing |
| `--text-primary` | `#FFFFFF` | Texto sobre fondo oscuro |
| `--accent-blue` | `#1E6FFF` (ajustar al exacto si lectura mejor) | CTAs · acentos · links |
| `--gray-100..900` | escala `#1A1A1A → #999999` | Fondos secundarios · texto secundario |

### Item pendiente único

- Decisión Framer Basic ($15/mes) — ¿cancelar en mes 2? · Fase 5 cleanup post-launch (no bloquea ninguna fase de implementación)

---

## Estructura final de archivos

```
Kenzai Super Brain/
├── .gitignore                                       ← MODIFICAR (añadir web/dist, web/.vercel)
├── api/                                             ← SIN CAMBIOS (clasificar, protocolo en raíz)
├── panel/                                           ← SIN CAMBIOS
└── web/                                             ← CREAR todo
    ├── package.json
    ├── astro.config.mjs
    ├── tsconfig.json
    ├── tailwind.config.mjs
    ├── .env.example
    ├── .gitignore
    ├── README.md
    ├── vercel.json
    ├── public/
    │   ├── favicon.svg
    │   ├── logo.svg                                  (placeholder hasta item #1)
    │   ├── og-image.png                              (1200×630 generado en Fase 2)
    │   └── robots.txt
    └── src/
        ├── content.config.ts                         (Zod: tiers, sectores)
        ├── content/
        │   ├── tiers/
        │   │   ├── lite.md
        │   │   ├── starter.md
        │   │   ├── growth.md
        │   │   ├── pro.md
        │   │   └── enterprise.md
        │   └── sectores/
        │       ├── ecommerce.md
        │       ├── servicios-profesionales.md
        │       ├── hogar.md
        │       ├── salud.md
        │       ├── restaurantes.md
        │       ├── inmobiliaria.md
        │       ├── educacion.md
        │       └── manufactura.md
        ├── layouts/
        │   └── WebLayout.astro
        ├── components/
        │   ├── NavBar.astro
        │   ├── Footer.astro
        │   ├── Hero.astro
        │   ├── TierCard.astro
        │   ├── TierDetail.astro
        │   ├── SectorGrid.astro
        │   ├── SectorCard.astro
        │   ├── ProofSection.astro
        │   ├── FormularioLead.astro
        │   ├── WhatsAppFloat.astro
        │   └── SeoHead.astro
        ├── lib/
        │   ├── airtable.ts                           (cliente Airtable + createLead)
        │   ├── resend.ts                             (cliente Resend + sendConfirmacion / sendNotificacion)
        │   ├── protocolo.ts                          (fetch a /api/protocolo · server-side)
        │   ├── ratelimit.ts                          (5/IP/h vía Airtable)
        │   ├── validation.ts                         (Zod schemas del lead)
        │   └── env.ts                                (import.meta.env tipado)
        ├── pages/
        │   ├── index.astro
        │   ├── 404.astro
        │   ├── gracias.astro
        │   ├── conversacion.astro
        │   ├── planes/index.astro
        │   ├── sectores/[slug].astro
        │   └── api/
        │       └── lead.ts
        ├── styles/
        │   └── tokens.css
        └── tests/
            ├── lead.test.ts
            ├── validation.test.ts
            └── ratelimit.test.ts
```

---

# FASE 0 · Setup monorepo `web/` (3.5-4.5h)

**Objetivo:** Pre-flight checks pasando · proyecto Astro vacío que builds · dev-server arranca en puerto distinto al panel · Vercel project nuevo creado y conectado al repo con root `web/`.

### Tarea 0.0 · Pre-flight check (assets, env, .gitignore, Vercel CLI) (30-45min)

**Sin nuevos archivos.** Verificación de bloqueantes antes de tocar código. Si **cualquiera** de los 4 checks falla, **PARAR y consultar al usuario** antes de continuar con Tarea 0.1.

**Criterios de done:** los 4 checks devuelven ✅.

- [ ] **Check 1 — Resend key en `.env` local**

```bash
grep -c "^RESEND_API_KEY=." .env
```

Esperado: `1` (línea existe **y tiene valor** después del `=`). Si devuelve `0`, la línea está vacía o ausente · pedir al usuario que pegue el valor antes de seguir. **No imprimir el valor.**

- [ ] **Check 2 — `.gitignore` raíz cubre `.env`, `web/.env`, `web/.env.local`**

```bash
git check-ignore -v .env web/.env web/.env.local 2>&1
```

Esperado: las 3 rutas reportadas como ignoradas. Patrones globales (`.env`, `.env.local` sin slash) en `.gitignore` raíz ya matchean a cualquier profundidad — si así es, ✅. Si alguna ruta NO está cubierta, añadir explícito al `.gitignore` raíz:

```
web/.env
web/.env.local
```

- [ ] **Check 3 — Logos del usuario disponibles**

```bash
ls "C:\Users\jordy\Desktop\zenkai ai agency\"
```

Esperado: aparece `ChatGPT Image Apr 21, 2026, 11_04_37 AM.png` (versión horizontal) y un segundo archivo de logo cuadrado (nombre puede variar). Confirmar que ambos son legibles. Si falta el cuadrado, **pedir al usuario** la ruta exacta vía mensaje (necesario para favicon en Fase 1.3 y Fase 2.8).

- [ ] **Check 4 — Vercel CLI instalado**

```bash
vercel --version
```

Esperado: imprime versión (ej. `Vercel CLI 39.x.x`). Si comando no encontrado, **pedir al usuario instalar**: `npm install -g vercel` (instalación global · requiere PowerShell con permisos · alternativa = usar Vercel solo via dashboard web durante todo el plan, sin CLI).

- [ ] **Reporte:** publicar los 4 checks con ✅/❌ + acción si alguno falla. Solo continuar a Tarea 0.1 si los 4 son ✅ o el usuario aprueba excepción.



**Criterios de done global de la fase:**
- `cd web && npm run dev` levanta en `http://localhost:4322` (panel sigue en 4321)
- `cd web && npm run build` produce `dist/` sin errores
- Push a `main` triggerea deploy de un nuevo project Vercel `zenkai-web` que sirve la página por defecto en una URL `*.vercel.app`
- `panel/` sigue funcionando sin regresiones (deploy del project `zenkaibrain` no se afecta)

### Tarea 0.1 · Crear esqueleto del proyecto Astro (1h)

**Files:**
- Create: `web/package.json`
- Create: `web/astro.config.mjs`
- Create: `web/tsconfig.json`
- Create: `web/tailwind.config.mjs`
- Create: `web/.gitignore`
- Create: `web/README.md`

- [ ] **Step 1:** `cd "C:\Users\jordy\Desktop\Kenzai Super Brain"` y correr `npm create astro@latest web -- --template minimal --typescript strict --install no --git no --yes`
- [ ] **Step 2:** Editar `web/package.json` para añadir scripts y dependencias:

```json
{
  "name": "zenkai-web",
  "type": "module",
  "version": "0.1.0",
  "scripts": {
    "dev": "astro dev --port 4322",
    "build": "astro build",
    "preview": "astro preview --port 4322",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@astrojs/tailwind": "^5.1.0",
    "@astrojs/vercel": "^7.8.0",
    "@fontsource-variable/inter": "^5.1.0",
    "@fontsource-variable/jetbrains-mono": "^5.1.0",
    "airtable": "^0.12.2",
    "astro": "^5.0.0",
    "resend": "^4.0.0",
    "tailwindcss": "^3.4.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 3:** `cd web && npm install`
- [ ] **Step 4:** Editar `web/astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  site: 'https://zenkai.systems',
  output: 'static',
  adapter: vercel({ webAnalytics: { enabled: true } }),
  integrations: [tailwind({ applyBaseStyles: false })],
  server: { port: 4322 }
});
```

- [ ] **Step 5:** Editar `web/.gitignore` para incluir `node_modules`, `dist`, `.vercel`, `.env`, `.env.local`
- [ ] **Step 6:** `npm run build` y verificar que produce `dist/index.html`
- [ ] **Step 7:** Commit:

```bash
git add web/package.json web/astro.config.mjs web/tsconfig.json web/tailwind.config.mjs web/.gitignore web/README.md web/src
git commit -m "feat(web): scaffolding Astro · Fase 0.1"
```

### Tarea 0.2 · Vercel project + env vars (1h)

**Criterios de done:** project `zenkai-web` aparece en `mrhaxel26-sketchs-projects`, deploy del último commit pasa, URL temporal sirve la página default.

- [ ] **Step 1:** En `vercel.com/mrhaxel26-sketchs-projects/new` importar repo `HaxelGG/zenkai-super-brain` como **nuevo project** llamado `zenkai-web`
- [ ] **Step 2:** Configurar Project Settings → Root Directory = `web` · Framework Preset = `Astro` · Build Command = `npm run build` · Output = `dist`
- [ ] **Step 3:** Settings → Environment Variables, copiar todas las que ya están en `zenkaibrain` y que `web/` también necesita:
  - `AIRTABLE_TOKEN`
  - `AIRTABLE_BASE_VENTAS=appmiicsbFsvRfxQ9`
  - `ZENKAI_API_KEY` (para llamar a `/api/protocolo`)
  - `ANTHROPIC_API_KEY` (no se usa directo desde web/, pero útil tener)
- [ ] **Step 4:** Settings → Deployment Protection = **OFF** (landing es pública)
- [ ] **Step 5:** Disparar deploy → URL temporal `https://zenkai-web-...vercel.app/` debe servir la página default de Astro
- [ ] **Step 6:** Crear `web/.env.example` documentando todas las env vars necesarias (sin valores reales):

```
AIRTABLE_TOKEN=patXXX...
AIRTABLE_BASE_VENTAS=appmiicsbFsvRfxQ9
ZENKAI_API_KEY=...
RESEND_API_KEY=re_...
ZENKAI_NOTIFY_EMAIL=jordycapital@gmail.com
ZENKAI_FROM_EMAIL=contacto@zenkai.systems
PUBLIC_WA_NUMBER=573000000000
PUBLIC_API_BASE=https://zenkaibrain-git-main-mrhaxel26-sketchs-projects.vercel.app
PUBLIC_CALCOM_LINK=https://cal.com/zenkai-growth-systems/strategy-call
```

- [ ] **Step 7:** Commit:

```bash
git add web/.env.example
git commit -m "chore(web): vercel project zenkai-web + env example · Fase 0.2"
```

### Tarea 0.3 · Actualizar `.gitignore` raíz y CLAUDE.md (15min)

**Files:**
- Modify: `.gitignore` (raíz)
- Modify: `CLAUDE.md` §9 mapa de plataforma

- [ ] **Step 1:** Añadir a `.gitignore` raíz:

```
# Web pública
web/dist/
web/.vercel/
web/.astro/
```

- [ ] **Step 2:** Editar `CLAUDE.md` §9 para incluir `web/` en el árbol del repo (después de `panel/`):

```
├── panel/              ← cerebro interno (ya existente)
├── web/                ← landing pública zenkai.systems
```

- [ ] **Step 3:** Commit:

```bash
git add .gitignore CLAUDE.md
git commit -m "docs(web): registrar web/ en mapa de plataforma · Fase 0.3"
```

### Tarea 0.4 · Smoke test del split deploy (30min)

**Criterios de done:** ambos projects (panel y web) deployan en paralelo sin conflicto.

- [ ] **Step 1:** `git push` y verificar en Vercel dashboard que ambos projects (`zenkaibrain` y `zenkai-web`) corren build simultáneamente
- [ ] **Step 2:** Abrir URL del panel y URL temporal de web · ambos responden 200
- [ ] **Step 3:** Confirmar en logs de `zenkaibrain` que sigue corriendo build con root = raíz del repo (no afectado por la creación de `web/`)

---

# FASE 1 · Estructura Astro base (6-8h)

**Objetivo:** WebLayout funcional con SEO, NavBar, Footer, fonts cargadas, design tokens del panel heredados, content collections de tiers y sectores con frontmatter validado por Zod, página index renderiza un Hero placeholder.

**Criterios de done global:**
- `npm run build` valida frontmatter de los 5 tiers + 8 sectores sin errores
- Layout renderiza con Inter Variable + JetBrains Mono Variable self-hosted (sin Google Fonts CDN)
- Tailwind preview muestra paleta índigo idéntica al panel
- Lighthouse desktop home ≥ 95 en Performance, Accessibility, Best Practices, SEO

### Tarea 1.1 · Design tokens + WebLayout (2h)

**Files:**
- Create: `web/src/styles/tokens.css`
- Create: `web/src/layouts/WebLayout.astro`
- Create: `web/src/components/SeoHead.astro`

- [ ] **Step 1:** Copiar `panel/src/styles/tokens.css` a `web/src/styles/tokens.css` (mantiene paleta índigo, spacing, type scale). Importar en layout.
- [ ] **Step 2:** Crear `web/src/components/SeoHead.astro` con props `title`, `description`, `canonical?`, `ogImage?` que renderiza meta tags Open Graph + Twitter Card + canonical + JSON-LD Organization
- [ ] **Step 3:** Crear `web/src/layouts/WebLayout.astro`:

```astro
---
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import '../styles/tokens.css';
import SeoHead from '../components/SeoHead.astro';
import NavBar from '../components/NavBar.astro';
import Footer from '../components/Footer.astro';
import WhatsAppFloat from '../components/WhatsAppFloat.astro';

interface Props {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
}
const { title, description, canonical, ogImage } = Astro.props;
---
<!DOCTYPE html>
<html lang="es">
  <head>
    <SeoHead {title} {description} {canonical} {ogImage} />
  </head>
  <body class="bg-white text-slate-900 antialiased">
    <NavBar />
    <main><slot /></main>
    <Footer />
    <WhatsAppFloat />
  </body>
</html>
```

- [ ] **Step 4:** Crear stubs vacíos pero compilables de `NavBar.astro`, `Footer.astro`, `WhatsAppFloat.astro` (cada uno con un `<div>` placeholder); contenido real va en Fase 2 y Fase 4
- [ ] **Step 5:** `npm run build` debe pasar
- [ ] **Step 6:** Commit:

```bash
git add web/src/styles web/src/layouts web/src/components
git commit -m "feat(web): WebLayout + design tokens heredados del panel · Fase 1.1"
```

### Tarea 1.2 · Content Collections con Zod (2h)

**Files:**
- Create: `web/src/content.config.ts`
- Create: `web/src/content/tiers/*.md` (×5)
- Create: `web/src/content/sectores/*.md` (×8)

- [ ] **Step 1:** Crear `web/src/content.config.ts`:

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const tierSlug = z.enum(['lite', 'starter', 'growth', 'pro', 'enterprise']);
const sectorSlug = z.enum([
  'ecommerce', 'servicios-profesionales', 'hogar', 'salud',
  'restaurantes', 'inmobiliaria', 'educacion', 'manufactura',
]);

const tiers = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/tiers' }),
  schema: z.object({
    slug: tierSlug,
    nombre: z.string(),
    setup_USD: z.number().int().nonnegative(),
    mensual_USD: z.number().int().nonnegative(),
    delivery_dias: z.number().int().positive(),
    delivery_horas: z.number().positive(),
    publico_objetivo: z.string(),
    cta_tipo: z.enum(['form', 'agendar']),
    destacado: z.boolean().default(false),
    incluye: z.array(z.string()).min(3),
    margen_setup_pct: z.number(),
    margen_mensual_pct: z.number(),
    modulos_por_sector: z.record(sectorSlug, z.string()),
    orden: z.number().int(),
  }),
});

const sectores = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/sectores' }),
  schema: z.object({
    slug: sectorSlug,
    nombre: z.string(),
    nombre_plural: z.string(),
    icono: z.string(),
    dolor_principal: z.string(),
    dolor_secundario: z.string(),
    propuesta_valor: z.string(),
    orden: z.number().int(),
  }),
});

export const collections = { tiers, sectores };
```

- [ ] **Step 2:** Crear los 5 archivos de tiers en `web/src/content/tiers/` extrayendo datos del spec §3 (lite.md, starter.md, growth.md, pro.md, enterprise.md). Ejemplo de `lite.md`:

```yaml
---
slug: lite
nombre: Lite
setup_USD: 300
mensual_USD: 90
delivery_dias: 5
delivery_horas: 5
publico_objetivo: Dueño de negocio tradicional sin presencia digital
cta_tipo: form
destacado: true
orden: 1
margen_setup_pct: 92
margen_mensual_pct: 95
incluye:
  - Sitio web 1 página en Astro
  - Dominio del cliente conectado
  - WhatsApp Business + 5 templates manuales
  - Agenda online (Cal.com Free)
  - Google My Business optimizado
  - Capacitación 1h
  - Soporte 15 días
modulos_por_sector:
  ecommerce: Catálogo dinámico 3-9 productos · CTA WA con producto preseleccionado · integración Shopify mínima
  servicios-profesionales: Bio + áreas de práctica · CTA WA con consulta predefinida · agenda visible
  hogar: Zonas de cobertura · WA con tipo de servicio · galería de trabajos
  salud: Especialidades + profesionales · agenda visible · WA con motivo de consulta
  restaurantes: Menú visible · WA para pedidos · reservas básicas
  inmobiliaria: 3-6 propiedades destacadas · filtro zona/precio · WA con propiedad de interés
  educacion: Cursos disponibles · WA con curso de interés · landing de inscripción
  manufactura: Catálogo PDF descargable · WA para cotización · cualificación básica
---

# Lite — primera presencia digital

Tier ancla del funnel. Para validar mercado con dueños tradicionales que aún no operan en internet.
```

- [ ] **Step 3:** Crear los 4 restantes (starter, growth, pro, enterprise) con el mismo patrón, datos del spec §3.2-3.5
- [ ] **Step 4:** Crear los 8 archivos de sectores en `web/src/content/sectores/` con `slug`, `nombre`, `nombre_plural`, `icono` (nombre de un Heroicon o emoji), `dolor_principal`, `dolor_secundario`, `propuesta_valor`. Datos extraídos del spec §2 + §3 tablas de módulos
- [ ] **Step 5:** `npm run build` debe pasar y mostrar "Generated 13 entries: 5 tiers, 8 sectores" en el log
- [ ] **Step 6:** Commit:

```bash
git add web/src/content.config.ts web/src/content
git commit -m "feat(web): content collections tiers (5) + sectores (8) · Fase 1.2"
```

### Tarea 1.3 · Página 404 + index placeholder (1h)

**Files:**
- Create: `web/src/pages/index.astro`
- Create: `web/src/pages/404.astro`

- [ ] **Step 1:** `web/src/pages/index.astro` mínimo: importa `WebLayout`, renderiza `<h1>ZENKAI Growth Systems</h1>` + lista de tiers desde la collection. Sirve como smoke test de que collections funcionan
- [ ] **Step 2:** `web/src/pages/404.astro` con mensaje "Página no encontrada" + link a home + WhatsApp FAB
- [ ] **Step 3:** `npm run dev` y abrir `http://localhost:4322` y `http://localhost:4322/no-existe` para verificar 404
- [ ] **Step 4:** Commit:

```bash
git add web/src/pages
git commit -m "feat(web): index placeholder + 404 · Fase 1.3"
```

### Tarea 1.4 · Helper de env tipado (45min)

**Files:**
- Create: `web/src/lib/env.ts`

- [ ] **Step 1:** Crear `web/src/lib/env.ts` con un Zod schema que valida todas las env vars del runtime y falla loud al boot si falta alguna:

```ts
import { z } from 'zod';

const serverSchema = z.object({
  AIRTABLE_TOKEN: z.string().startsWith('pat'),
  AIRTABLE_BASE_VENTAS: z.string().startsWith('app'),
  ZENKAI_API_KEY: z.string().min(20),
  RESEND_API_KEY: z.string().startsWith('re_'),
  ZENKAI_NOTIFY_EMAIL: z.string().email(),
  ZENKAI_FROM_EMAIL: z.string().email(),
  PUBLIC_API_BASE: z.string().url(),
});

const publicSchema = z.object({
  PUBLIC_WA_NUMBER: z.string().regex(/^\d{10,15}$/),
  PUBLIC_API_BASE: z.string().url(),
  PUBLIC_CALCOM_LINK: z.string().url(),
});

export const serverEnv = () => serverSchema.parse(import.meta.env);
export const publicEnv = () => publicSchema.parse(import.meta.env);
```

- [ ] **Step 2:** Commit:

```bash
git add web/src/lib/env.ts
git commit -m "feat(web): env tipado con Zod · Fase 1.4"
```

---

# FASE 2 · Secciones públicas (10-12h)

**Objetivo:** Las 12 páginas estáticas del sitio renderizan con copy real, responsive perfect en mobile/tablet/desktop, contenido de tiers y sectores se lee de las collections.

**Criterios de done global:**
- 12 páginas renderan: home + 8 sectores + planes + gracias + conversacion + 404
- `npm run build` produce 12 HTMLs en `dist/`
- En browse skill, screenshot de home en mobile (375px), tablet (768px), desktop (1440px) sin overflow
- Lighthouse mobile ≥ 90 en Performance/Accessibility/SEO

### Tarea 2.1 · NavBar + Footer (1h)

**Files:**
- Modify: `web/src/components/NavBar.astro`
- Modify: `web/src/components/Footer.astro`

- [ ] **Step 1:** NavBar sticky top con logo (placeholder SVG si item #1 no llegó) + links: Inicio · Planes · Sectores ▾ (dropdown con los 8) · Conversación · CTA "Empezar" (scroll-link al form en home). Mobile = hamburger menu
- [ ] **Step 2:** Footer 3 columnas: marca + tagline · enlaces (Planes, Sectores, Política privacidad, Términos) · contacto (WA, email, ubicación Pereira). Cuarta columna pequeña con créditos "Construido con `/api/protocolo`" linkeando a panel
- [ ] **Step 3:** Commit:

```bash
git add web/src/components/NavBar.astro web/src/components/Footer.astro
git commit -m "feat(web): NavBar sticky + Footer 3 cols · Fase 2.1"
```

### Tarea 2.2 · Hero + ProofSection (1.5h)

**Files:**
- Create: `web/src/components/Hero.astro`
- Create: `web/src/components/ProofSection.astro`

- [ ] **Step 1:** `Hero.astro` con headline §9 ("Tu negocio en internet en 7 días. IA, agenda, WhatsApp, ads. Empezás por $300."), subheadline 1 frase, dos CTAs (primario form scroll, secundario WhatsApp `wa.me/<num>`), badge "3 cupos abiertos · primeros 30 con descuento de fundador"
- [ ] **Step 2:** `ProofSection.astro` con los 3 bullets §9 ("/api/protocolo genera tu propuesta automática · 12 agentes especializados · Panel operativo en zenkaibrain.vercel.app") · cada uno linkeable
- [ ] **Step 3:** Commit:

```bash
git add web/src/components/Hero.astro web/src/components/ProofSection.astro
git commit -m "feat(web): Hero + ProofSection · Fase 2.2"
```

### Tarea 2.3 · TierCard + TierDetail (2h)

**Files:**
- Create: `web/src/components/TierCard.astro`
- Create: `web/src/components/TierDetail.astro`

- [ ] **Step 1:** `TierCard.astro` recibe prop `tier` (de la collection) · render compacto: nombre, precio setup + mensual, public objetivo, CTA según `cta_tipo`. Variante visual `destacado=true` (Lite, Starter) usa borde/sombra; `cta_tipo=agendar` (Pro, Enterprise) usa CTA "agendar conversación"
- [ ] **Step 2:** `TierDetail.astro` para sección expandida del Lite (la única que aparece al detalle en home según wireframe §8): renderiza todos los `incluye`, los 8 módulos por sector en grid, el SOP de 5 días, margen visible
- [ ] **Step 3:** Commit:

```bash
git add web/src/components/TierCard.astro web/src/components/TierDetail.astro
git commit -m "feat(web): TierCard + TierDetail · Fase 2.3"
```

### Tarea 2.4 · SectorGrid + SectorCard (1h)

**Files:**
- Create: `web/src/components/SectorGrid.astro`
- Create: `web/src/components/SectorCard.astro`

- [ ] **Step 1:** `SectorGrid.astro` recibe `sectores` de la collection · grid 4×2 desktop, 2×4 tablet, 1×8 mobile
- [ ] **Step 2:** `SectorCard.astro` muestra `icono`, `nombre`, `dolor_principal` truncado · link a `/sectores/<slug>`
- [ ] **Step 3:** Commit:

```bash
git add web/src/components/SectorGrid.astro web/src/components/SectorCard.astro
git commit -m "feat(web): SectorGrid + SectorCard · Fase 2.4"
```

### Tarea 2.5 · Página index completa (2h)

**Files:**
- Modify: `web/src/pages/index.astro`

- [ ] **Step 1:** Estructura por wireframe §8: `<Hero />` → `<TierDetail tier={lite} />` → sección "Upgrade path" (TierCards de Starter + Growth en grid 2 cols) → sección "Para empresas" (TierCards de Pro + Enterprise sobrios) → `<SectorGrid />` → `<ProofSection />` → sección CTA final con `<FormularioLead />` (componente stub por ahora · contenido real en Fase 3)
- [ ] **Step 2:** `npm run dev` y verificar visualmente en browser cada sección
- [ ] **Step 3:** Commit:

```bash
git add web/src/pages/index.astro
git commit -m "feat(web): home con 7 secciones del wireframe · Fase 2.5"
```

### Tarea 2.6 · Página dinámica `/sectores/[slug]` (2h)

**Files:**
- Create: `web/src/pages/sectores/[slug].astro`

- [ ] **Step 1:** `getStaticPaths()` itera collection sectores · página renderiza: `<Hero />` específico al sector (headline con nombre del sector + dolor) · 5 TierCards con `modulos_por_sector[<slug>]` visible en cada tier · `<FormularioLead />` con `sector` pre-seleccionado
- [ ] **Step 2:** Cada página debe tener canonical único `https://zenkai.systems/sectores/<slug>` y OG image dedicada (usar fallback compartido en MVP, generación per-sector queda fuera de scope)
- [ ] **Step 3:** Verificar build genera 8 HTMLs en `dist/sectores/`
- [ ] **Step 4:** Commit:

```bash
git add web/src/pages/sectores
git commit -m "feat(web): páginas dinámicas /sectores/[slug] (8) · Fase 2.6"
```

### Tarea 2.7 · `/planes` comparativa + `/gracias` + `/conversacion` (1.5h)

**Files:**
- Create: `web/src/pages/planes/index.astro`
- Create: `web/src/pages/gracias.astro`
- Create: `web/src/pages/conversacion.astro`

- [ ] **Step 1:** `/planes` = tabla comparativa de los 5 tiers · filas = features (sitio, WA, ads, IA, agente IA, app custom, etc.) · columnas = tiers · iconos ✓/✗
- [ ] **Step 2:** `/gracias` = mensaje "Recibimos tu mensaje. En 24h te contactamos por WhatsApp." + link al WhatsApp + sugerencia "Mientras tanto, mirá los 8 sectores que servimos →"
- [ ] **Step 3:** `/conversacion` = página minimal con embed Cal.com (`<iframe>` apuntando a `PUBLIC_CALCOM_LINK`) + texto "Reservá 30 min con Jordy para ver si Pro o Enterprise es para tu empresa". Cal.com link real va en Fase 4 — por ahora dejar placeholder
- [ ] **Step 4:** Commit:

```bash
git add web/src/pages/planes web/src/pages/gracias.astro web/src/pages/conversacion.astro
git commit -m "feat(web): /planes + /gracias + /conversacion · Fase 2.7"
```

### Tarea 2.8 · OG image + favicon + responsive QA (1h)

**Files:**
- Create: `web/public/og-image.png` (1200×630)
- Create: `web/public/favicon.svg`
- Create: `web/public/robots.txt`

- [ ] **Step 1:** Generar OG image con headline "ZENKAI · Tu negocio en internet en 7 días" + logo + paleta índigo. Usar Figma/Canva o `frontend-design` skill si está activado
- [ ] **Step 2:** Crear favicon SVG simple (monograma "Z" en color índigo)
- [ ] **Step 3:** `robots.txt` permite todo (`User-agent: * \n Allow: /`) + apunta a sitemap auto-generado por Astro (`Sitemap: https://zenkai.systems/sitemap-index.xml`)
- [ ] **Step 4:** Activar `@astrojs/sitemap` en `astro.config.mjs` (instalar `npm i @astrojs/sitemap` + añadir a integrations)
- [ ] **Step 5:** Browse skill: tomar screenshot home en 375px, 768px, 1440px · documentar issues · arreglar
- [ ] **Step 6:** Commit:

```bash
git add web/public web/astro.config.mjs web/package.json
git commit -m "feat(web): OG image + favicon + robots + sitemap · Fase 2.8"
```

---

# FASE 3 · Formulario + integración API (8-10h)

**Objetivo:** Form en home y en sectores submit a `/api/lead` que: valida payload, crea Lead en Airtable, dispara `/api/protocolo` si plan_interes ≥ Starter, manda email confirmación al usuario y notificación a Jordy, redirige a `/gracias`. Rate limiting 5/IP/h.

**Criterios de done global:**
- Submit del form crea row real en Airtable VENTAS / Leads
- Para plan_interes=Starter: además crea propuesta en `propuestas` linkeada al Lead
- Usuario recibe email de Resend con asunto "Recibimos tu mensaje · ZENKAI"
- Jordy recibe email con datos del lead
- Tests Vitest passing en `web/tests/`
- 6º submit del mismo IP en una hora retorna 429

**Bloqueante:** items 2 + 4 de prerrequisitos del usuario (email comercial + cuenta Resend).

### Tarea 3.1 · Verificar/crear tabla Leads en Airtable (30min)

**Criterios de done:** tabla `Leads` en base VENTAS tiene los campos requeridos.

- [ ] **Step 1:** Vía MCP Airtable, listar tablas de base VENTAS (`appmiicsbFsvRfxQ9`) y verificar si `Leads` existe (debe existir desde Fase 2.1 que ya linkeó propuestas a Leads)
- [ ] **Step 2:** Confirmar campos mínimos requeridos (crear los que falten):

| Campo | Tipo |
|---|---|
| nombre | Single line text |
| empresa | Single line text |
| sector | Single select (8 opciones · slugs) |
| etapa | Single select (4 opciones) |
| plan_interes | Single select (6 opciones) |
| presupuesto | Single select (5 rangos) |
| whatsapp | Phone number |
| mensaje | Long text |
| origen | Single select ("landing", "manual", "import") · default landing |
| ip_hash | Single line text (SHA-256 del IP, para rate limit + privacidad) |
| created_at | Created time |
| propuestas | Link to record → tabla propuestas (inverso ya existe) |

- [ ] **Step 3:** Documentar en `conexiones/conexiones-airtable.md` los nuevos campos si se agregaron
- [ ] **Step 4:** Si hubo cambios de schema:

```bash
git add conexiones/conexiones-airtable.md
git commit -m "docs(airtable): campos tabla Leads para landing · Fase 3.1"
```

### Tarea 3.2 · Validation schemas (45min)

**Files:**
- Create: `web/src/lib/validation.ts`
- Create: `web/tests/validation.test.ts`

- [ ] **Step 1:** `validation.ts` con Zod schema `leadSchema` que matchea §6.1 del spec **+ campo `email` REQUERIDO añadido a este plan v1.1** (nombre 2-80, empresa 2-100, sector enum 8, etapa enum 4, plan_interes enum 6, presupuesto enum 5, whatsapp regex E.164 `^\+?[1-9]\d{7,14}$`, mensaje 0-1000, **email `z.string().email()` requerido**). Razón del email obligatorio: sin él no llega propuesta automática del `/api/protocolo`, no hay follow-up posible, lead inutilizable. Patrón estándar B2B (Linear, Vercel, Notion). Quien quiera evitar dar email tiene escape vía FAB WhatsApp o `/conversacion` con Cal.com.
- [ ] **Step 2:** Exportar `type LeadInput = z.infer<typeof leadSchema>` y enum constants (`SECTORES`, `ETAPAS`, etc.) para usar en form y server
- [ ] **Step 3:** `validation.test.ts` con vitest: 6 casos · happy path, cada campo failing por separado, mensaje vacío válido, whatsapp con/sin `+`
- [ ] **Step 4:** `npm run test` debe pasar 6/6
- [ ] **Step 5:** Commit:

```bash
git add web/src/lib/validation.ts web/tests/validation.test.ts
git commit -m "feat(web): leadSchema + tests · Fase 3.2"
```

### Tarea 3.3 · Cliente Airtable + createLead (1h)

**Files:**
- Create: `web/src/lib/airtable.ts`

- [ ] **Step 1:** Importar `airtable` SDK · `getBase("VENTAS")` (idéntico al patrón de `panel/`/raíz)
- [ ] **Step 2:** Exportar `createLead(input: LeadInput, ipHash: string): Promise<{ id: string }>` que hace `base("Leads").create([{ fields: { ...input, ip_hash: ipHash, origen: "landing" } }])` y retorna el record id
- [ ] **Step 3:** Manejar errores: si Airtable falla, throw error con mensaje específico; el handler decide qué hacer (probable retry queue · ver Fase 3.7)
- [ ] **Step 4:** No tests dedicados (es wrapper del SDK · cubierto por integration test del endpoint)
- [ ] **Step 5:** Commit:

```bash
git add web/src/lib/airtable.ts
git commit -m "feat(web): cliente airtable + createLead · Fase 3.3"
```

### Tarea 3.4 · Cliente Resend + emails (1h)

**Files:**
- Create: `web/src/lib/resend.ts`

**Bloqueante:** cuenta Resend creada + dominio `zenkai.systems` verificado en Resend.

- [ ] **Step 1:** Importar `Resend` · inicializar con `RESEND_API_KEY`
- [ ] **Step 2:** Exportar `sendConfirmacion(lead: LeadInput)` que envía email a `lead.email` (siempre presente · campo requerido desde plan v1.1 · ver Fase 3.2). From: `hola@zenkai.systems`.
- [ ] **Step 3:** Exportar `sendNotificacion(lead, leadId, propuestaId?)` que manda email a `ZENKAI_NOTIFY_EMAIL` con todos los datos del lead + link al record en Airtable
- [ ] **Step 4:** Templates HTML inline simples (sin librería de templates) — voz fundador-directa: "Hola [nombre], recibí tu mensaje. Te contacto por WhatsApp en menos de 24h. — Jordy"
- [ ] **Step 5:** Commit:

```bash
git add web/src/lib/resend.ts
git commit -m "feat(web): cliente resend (confirmacion + notificacion) · Fase 3.4"
```

### Tarea 3.5 · Llamar a /api/protocolo (45min)

**Files:**
- Create: `web/src/lib/protocolo.ts`

- [ ] **Step 1:** Función `triggerPropuesta(lead: LeadInput, leadId: string): Promise<string | null>` que:
  - Construye `input` formateado: `[CLIENTE] Empresa: ${empresa}. Sector: ${sector}. Etapa: ${etapa}. Plan de interés: ${plan_interes}. Presupuesto: ${presupuesto}. ${mensaje}`
  - `fetch(\`${PUBLIC_API_BASE}/api/protocolo?persist=true&lead_id=${leadId}\`, { method: 'POST', headers: { Authorization: \`Bearer ${ZENKAI_API_KEY}\`, 'Content-Type': 'application/json' }, body: JSON.stringify({ input }) })`
  - Retorna `X-Airtable-Record-Id` header del response (ID de la propuesta) o `null` si falla
  - **No-throw:** si la propuesta falla, el lead ya quedó guardado · retorna null y el handler logea
- [ ] **Step 2:** Solo invocar si `plan_interes ∈ ["Starter", "Growth", "Pro", "Enterprise"]` (Lite y "No sé" no disparan propuesta)
- [ ] **Step 3:** Commit:

```bash
git add web/src/lib/protocolo.ts
git commit -m "feat(web): trigger /api/protocolo desde lead handler · Fase 3.5"
```

### Tarea 3.6 · Rate limit por IP (1h)

**Files:**
- Create: `web/src/lib/ratelimit.ts`
- Create: `web/tests/ratelimit.test.ts`

**Decisión arquitectónica:** sin Redis/KV (no en stack actual). Implementación: tabla `RateLimit` en base VENTAS con campos `ip_hash`, `count`, `window_start` · upsert atómico simulado con check-then-update (acepta race conditions menores · 5/IP/h es soft limit, no security boundary).

- [ ] **Step 1:** Crear tabla `RateLimit` en Airtable (vía MCP) con esos 3 campos + `created_at` (Created time)
- [ ] **Step 2:** Helper `hashIp(ip: string): string` con `crypto.createHash('sha256')` (no guardar IP en claro · privacidad)
- [ ] **Step 3:** Función `checkRateLimit(ipHash: string): Promise<{ allowed: boolean; retryAfterSec?: number }>`:
  - Buscar record con `ip_hash = ipHash` y `window_start` > now − 1h
  - Si no existe o ventana expiró: crear/reset record con count=1, retornar allowed=true
  - Si existe y count < 5: increment, retornar allowed=true
  - Si count >= 5: retornar allowed=false + retryAfterSec calculado
- [ ] **Step 4:** Tests: 6 submissions desde IP "1.2.3.4" · primeras 5 allowed, 6ª denied con retryAfter > 0
- [ ] **Step 5:** Commit:

```bash
git add web/src/lib/ratelimit.ts web/tests/ratelimit.test.ts
git commit -m "feat(web): rate limit 5/IP/h vía Airtable · Fase 3.6"
```

### Tarea 3.7-pre · Mitigación CVE `x-astro-path` · middleware (30min)

**Bloqueante de Tarea 3.7.** Debe estar mergeada **antes** de crear `/api/lead.ts` (primer endpoint serverless del adapter Vercel · abre la ventana de exposición de la CVE).

**Files:**
- Create: `web/src/middleware.ts`
- Create: `web/tests/middleware.test.ts`

**Contexto:** `@astrojs/vercel ^8.0.0` tiene CVE [GHSA-mr6q-rp88-fx84](https://github.com/advisories/GHSA-mr6q-rp88-fx84) (HIGH · CVSS 6.5) que permite override de path interno vía header `x-astro-path`. v10 parchea pero exige Astro 6 (no stable). Decisión documentada: aceptar v8 + middleware. Ver `docs/security/2026-05-10-cve-astrojs-vercel-x-astro-path.md`.

- [ ] **Step 1:** Crear `web/src/middleware.ts` que strippea ambos headers en TODAS las requests:

```ts
// Mitigación CVE GHSA-mr6q-rp88-fx84 · @astrojs/vercel <10.0.2
// Ver: docs/security/2026-05-10-cve-astrojs-vercel-x-astro-path.md
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const sanitized = new Headers(context.request.headers);
  sanitized.delete('x-astro-path');
  sanitized.delete('x_astro_path');
  // Reemplazar el request con headers limpios para que el adapter no lea el header malicioso
  context.request = new Request(context.request.url, {
    method: context.request.method,
    headers: sanitized,
    body: context.request.body,
    redirect: context.request.redirect,
  });
  return next();
});
```

- [ ] **Step 2:** Crear `web/tests/middleware.test.ts` que verifica el strip:

```ts
import { describe, it, expect } from 'vitest';
import { onRequest } from '../src/middleware';

describe('middleware · CVE x-astro-path mitigation', () => {
  it('elimina header x-astro-path antes de llamar next()', async () => {
    const req = new Request('http://localhost/test', {
      headers: { 'x-astro-path': '/api/admin', 'content-type': 'application/json' },
    });
    let observed: Headers | null = null;
    const next = async () => { observed = req.headers; return new Response('ok'); };
    await onRequest({ request: req } as any, next);
    expect(observed?.get('x-astro-path')).toBeNull();
    expect(observed?.get('content-type')).toBe('application/json');
  });

  it('elimina variante x_astro_path también', async () => {
    const req = new Request('http://localhost/test', { headers: { 'x_astro_path': '/api/admin' } });
    let observed: Headers | null = null;
    const next = async () => { observed = req.headers; return new Response('ok'); };
    await onRequest({ request: req } as any, next);
    expect(observed?.get('x_astro_path')).toBeNull();
  });
});
```

- [ ] **Step 3:** `npm run test` debe pasar 2/2 tests del middleware
- [ ] **Step 4:** Commit:

```bash
git add web/src/middleware.ts web/tests/middleware.test.ts
git commit -m "security(web): middleware mitigación CVE x-astro-path · Tarea 3.7-pre"
```

**Criterios de done:**
- ✅ `web/src/middleware.ts` existe y filtra `x-astro-path` + `x_astro_path` en todas las requests
- ✅ Tests `middleware.test.ts` pasan 2/2 (ambas variantes del header)
- ✅ Comentario en `middleware.ts` apunta al doc en `docs/security/2026-05-10-cve-astrojs-vercel-x-astro-path.md`
- ✅ Commit creado · sin push (push se decide en checkpoint normal)

---

### Tarea 3.7 · Endpoint /api/lead.ts (2h)

**Files:**
- Create: `web/src/pages/api/lead.ts`
- Create: `web/tests/lead.test.ts`

- [ ] **Step 1:** Endpoint `POST /api/lead` con `export const prerender = false` (server-side):

```ts
import type { APIRoute } from 'astro';
import { leadSchema } from '../../lib/validation';
import { hashIp, checkRateLimit } from '../../lib/ratelimit';
import { createLead } from '../../lib/airtable';
import { triggerPropuesta } from '../../lib/protocolo';
import { sendConfirmacion, sendNotificacion } from '../../lib/resend';

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const ipHash = hashIp(clientAddress);
  const rl = await checkRateLimit(ipHash);
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: 'rate_limit', retry_after_sec: rl.retryAfterSec }),
      { status: 429, headers: { 'Content-Type': 'application/json' } });
  }
  let payload: unknown;
  try { payload = await request.json(); } catch { return jsonError(400, 'invalid_json'); }
  const parsed = leadSchema.safeParse(payload);
  if (!parsed.success) return jsonError(400, 'invalid_payload', parsed.error.flatten());

  const lead = parsed.data;
  let leadId: string;
  try { ({ id: leadId } = await createLead(lead, ipHash)); }
  catch (err) { return jsonError(500, 'airtable_failed', String(err)); }

  let propuestaId: string | null = null;
  if (['Starter', 'Growth', 'Pro', 'Enterprise'].includes(lead.plan_interes)) {
    propuestaId = await triggerPropuesta(lead, leadId);
  }

  // Emails: best-effort, no bloquear respuesta
  Promise.allSettled([
    sendConfirmacion(lead),
    sendNotificacion(lead, leadId, propuestaId),
  ]).catch(() => {});

  return new Response(JSON.stringify({ ok: true, lead_id: leadId, propuesta_id: propuestaId }),
    { status: 200, headers: { 'Content-Type': 'application/json' } });
};

function jsonError(status: number, code: string, detail?: unknown) {
  return new Response(JSON.stringify({ error: code, detail }),
    { status, headers: { 'Content-Type': 'application/json' } });
}
```

- [ ] **Step 2:** Tests integración (vitest + nock o `msw`): mock Airtable + Resend + protocolo · verificar happy path, 400 payload inválido, 429 rate limit, 500 Airtable down (sin propuesta queda con lead null)
- [ ] **Step 3:** Smoke test manual:

```bash
curl -X POST http://localhost:4322/api/lead \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test","empresa":"Test SAS","sector":"ecommerce","etapa":"Empezando","plan_interes":"Lite","presupuesto":"<$1,000","whatsapp":"+573000000000"}'
```

Esperado: `{ ok: true, lead_id: "recXXX", propuesta_id: null }` · row aparece en Airtable.

- [ ] **Step 4:** Commit:

```bash
git add web/src/pages/api/lead.ts web/tests/lead.test.ts
git commit -m "feat(web): endpoint /api/lead con airtable + protocolo + emails + rate limit · Fase 3.7"
```

### Tarea 3.8 · FormularioLead.astro componente (1.5h)

**Files:**
- Create: `web/src/components/FormularioLead.astro`

- [ ] **Step 1:** Form HTML semántico con todos los campos · labels accesibles · validación HTML5 (required, pattern, min/max length) · `<script>` inline mínimo que intercepta submit, hace fetch al endpoint, muestra loading, redirige a `/gracias?id=<lead_id>` o muestra error inline
- [ ] **Step 2:** Props del componente: `sectorPredeterminado?: SectorSlug` (para usar en `/sectores/[slug].astro`), `planPredeterminado?: TierSlug`
- [ ] **Step 3:** Estados visuales: idle, loading (CTA disabled + spinner), error (alert rojo con detail del backend), success (redirect)
- [ ] **Step 4:** Honeypot field oculto (`<input name="website" style="display:none">`) — si viene rellenado, retornar 200 fake sin hacer nada (anti-bot básico)
- [ ] **Step 5:** Sustituir el stub de FormularioLead en `index.astro` y `sectores/[slug].astro` por el real
- [ ] **Step 6:** Browse skill: rellenar form de prueba en localhost · verificar redirect a /gracias · verificar lead aparece en Airtable
- [ ] **Step 7:** Commit:

```bash
git add web/src/components/FormularioLead.astro web/src/pages/index.astro web/src/pages/sectores
git commit -m "feat(web): FormularioLead funcional + integrado en home y sectores · Fase 3.8"
```

---

# FASE 4 · WhatsApp FAB + Cal.com (3-4h)

**Objetivo:** FAB de WhatsApp visible en todas las páginas con mensaje pre-rellenado contextual; página `/conversacion` con embed Cal.com funcional; CTAs Pro/Enterprise dirigen a `/conversacion`.

**Criterios de done global:**
- Click en FAB abre `wa.me/<num>?text=<mensaje>` con número real y mensaje pre-rellenado
- Mensaje se contextualiza según página (en /sectores/salud → "Hola, tengo una clínica…", default = "Hola, vi zenkai.systems y…")
- `/conversacion` carga embed Cal.com sin errores · agendar slot funciona end-to-end
- TierCards Pro y Enterprise tienen botón "Agendar conversación" que va a `/conversacion`

**Bloqueante:** items 3 + 5 de prerrequisitos del usuario.

### Tarea 4.1 · WhatsAppFloat.astro funcional (1h)

**Files:**
- Modify: `web/src/components/WhatsAppFloat.astro`

- [ ] **Step 1:** Componente recibe prop opcional `mensajeContextual?: string` · default usa `"Hola, vi zenkai.systems y quiero más info."` · construye URL `https://wa.me/${PUBLIC_WA_NUMBER}?text=${encodeURIComponent(mensaje)}`
- [ ] **Step 2:** Visual: botón redondo 56×56px · fixed bottom-right (24px margin) · fondo verde WA `#25D366` · ícono SVG inline de WhatsApp · sombra elevada · hover scale 1.05 · z-index alto (50)
- [ ] **Step 3:** Mobile: bottom-right 16px margin · 48×48px
- [ ] **Step 4:** Para `/sectores/[slug]` pasar mensaje contextual desde frontmatter del sector (ej. salud → "Hola, tengo una clínica/consultorio y quiero…")
- [ ] **Step 5:** Verificar en browse: tap en FAB en mobile abre WhatsApp app (en desktop abre wa.me en tab nuevo)
- [ ] **Step 6:** Commit:

```bash
git add web/src/components/WhatsAppFloat.astro web/src/pages/sectores
git commit -m "feat(web): WhatsApp FAB con mensaje contextual por sector · Fase 4.1"
```

### Tarea 4.2 · Cal.com embed en /conversacion (1h)

**Files:**
- Modify: `web/src/pages/conversacion.astro`

- [ ] **Step 1:** Crear event type "Conversación estratégica · 30min" en cal.com de Jordy · obtener URL pública (`PUBLIC_CALCOM_LINK`)
- [ ] **Step 2:** Reemplazar placeholder por embed oficial Cal.com (script + div · ver docs cal.com/docs/embed):

```astro
<div style="width:100%;height:700px;overflow:scroll" id="my-cal-inline"></div>
<script type="text/javascript">
  (function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () {
    let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if(typeof namespace === "string"){cal.ns[namespace] = cal.ns[namespace] || api;p(cal.ns[namespace], ar);p(cal, ["initNamespace", namespace]);} else p(cal, ar); return;} p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
  Cal("init", "conversacion", {origin:"https://cal.com"});
  Cal.ns.conversacion("inline", { elementOrSelector:"#my-cal-inline", config: {"layout":"month_view"}, calLink: "zenkai-growth-systems/strategy-call" });
</script>
```

- [ ] **Step 3:** Texto antes del embed: "Reservá 30 min con Jordy. Esta llamada es para Pro y Enterprise — vemos juntos si tu empresa califica y qué armaríamos."
- [ ] **Step 4:** Browse skill: agendar un slot real de prueba · verificar email confirmación de cal.com llega a la cuenta
- [ ] **Step 5:** Commit:

```bash
git add web/src/pages/conversacion.astro
git commit -m "feat(web): embed Cal.com funcional en /conversacion · Fase 4.2"
```

### Tarea 4.3 · CTAs Pro/Enterprise → /conversacion (30min)

**Files:**
- Modify: `web/src/components/TierCard.astro`

- [ ] **Step 1:** En TierCard, cuando `tier.cta_tipo === 'agendar'`, el botón principal debe ser `<a href="/conversacion">Agendar conversación →</a>` en vez del scroll-link al form
- [ ] **Step 2:** Verificar en home y en /sectores/[slug] que las cards Pro y Enterprise muestran este CTA
- [ ] **Step 3:** Commit:

```bash
git add web/src/components/TierCard.astro
git commit -m "feat(web): CTA agendar en Pro/Enterprise → /conversacion · Fase 4.3"
```

### Tarea 4.4 · Documentar conexión Cal.com (15min)

**Files:**
- Create: `conexiones/conexiones-calcom.md`

- [ ] **Step 1:** Frontmatter consistente con las otras conexiones (`estado_conexion: activo`, `responsable: Jordy`, etc.) · resumen del event type creado, link al embed, notas de mantenimiento
- [ ] **Step 2:** Commit:

```bash
git add conexiones/conexiones-calcom.md
git commit -m "docs(conexiones): activar Cal.com · Fase 4.4"
```

---

# FASE 5 · QA + Deploy producción (4-6h)

**Objetivo:** Sitio en `https://zenkai.systems` (apex) sirviendo la landing en producción · panel sigue corriendo en su URL Vercel sin regresiones · DNS configurado · `setup-deploy` (gstack) registrado para auto-deploys futuros · Lighthouse mobile + desktop ≥ 90 en las 4 categorías · smoke test end-to-end pasa.

**Criterios de done global:**
- `https://zenkai.systems` carga la landing real (no la página default de Vercel)
- Form en producción crea Lead en Airtable real + dispara propuesta para plan ≥ Starter
- FAB WhatsApp con número real abre conversación
- `/conversacion` agenda slots reales en Cal.com
- Panel sigue accesible en su URL
- Lighthouse mobile home: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95
- ESTADO-ACTUAL.md actualizado con la nueva fase cerrada

### Tarea 5.1 · QA con browse skill — checklist completo (1.5h)

**Sin nuevos archivos. Browse skill testing.**

- [ ] **Step 1:** En preview de Vercel del último PR (o local con `npm run preview`), correr checklist:
  - Home renderiza · Hero visible · CTA primario funciona (scroll al form)
  - Form happy path: rellenar todos los campos · submit · redirige a /gracias · lead aparece en Airtable
  - Form rate limit: 6 submits seguidos · 6º muestra error 429
  - Form error: dejar nombre vacío · submit · muestra error inline sin recargar
  - 8 páginas de sectores cargan · cada una con módulos correctos por tier
  - /planes tabla comparativa visible
  - /conversacion embed Cal.com carga
  - 404 funciona
  - FAB WhatsApp visible en todas las páginas · click abre wa.me
  - Mobile (375px) sin overflow · NavBar hamburger funciona
- [ ] **Step 2:** Documentar issues en archivo temporal · arreglar uno por uno con commits separados
- [ ] **Step 3:** Re-run checklist hasta que todo pase

### Tarea 5.2 · Lighthouse audit (45min)

- [ ] **Step 1:** Vercel preview URL → Lighthouse desktop home · capturar scores
- [ ] **Step 2:** Si alguna categoría < 90, identificar issues típicos:
  - Performance: imágenes sin lazy loading · fuentes blocking · CSS no purged
  - Accessibility: contraste · alt en imágenes · landmarks · labels en forms
  - SEO: meta description faltante · h1 único por página · canonical presente
- [ ] **Step 3:** Iterar hasta scores ≥ 90 en mobile y desktop
- [ ] **Step 4:** Commit final de polish:

```bash
git add web
git commit -m "perf(web): lighthouse polish · ≥90 en 4 categorías · Fase 5.2"
```

### Tarea 5.3 · DNS Hostinger + custom domains Vercel (1h)

**Bloqueante:** acceso al panel Hostinger (usuario lo tiene · asistir si requiere apoyo).

- [ ] **Step 1:** Vercel `zenkai-web` → Settings → Domains → Add `zenkai.systems` (apex). Vercel pedirá un A record o ALIAS/ANAME. Para apex en Hostinger, usar registros A: `76.76.21.21` (o los que Vercel indique en ese momento).
- [ ] **Step 2:** Hostinger DNS panel:
  - Tipo A · Host @ · Valor 76.76.21.21 · TTL 14400
  - Tipo CNAME · Host www · Valor cname.vercel-dns.com · TTL 14400 (para `www.zenkai.systems` redirect)
  - Tipo CNAME · Host panel · Valor cname.vercel-dns.com · TTL 14400 (para `panel.zenkai.systems`)
- [ ] **Step 3:** Vercel `zenkai-web` → marcar `zenkai.systems` como Production · `www.zenkai.systems` como redirect a apex
- [ ] **Step 4:** Vercel `zenkaibrain` → Settings → Domains → Add `panel.zenkai.systems`
- [ ] **Step 5:** Esperar propagación (5-30min) · `dig zenkai.systems` debe responder con IP Vercel
- [ ] **Step 6:** Verificar HTTPS válido (Vercel emite Let's Encrypt automático)

### Tarea 5.4 · setup-deploy + smoke production (45min)

- [ ] **Step 1:** Invocar skill `setup-deploy` para registrar config de deploy de `web/` (auto-detect Vercel project, health URL `https://zenkai.systems/`, build = `npm run build` en root `web/`)
- [ ] **Step 2:** Smoke production:

```bash
curl -sSf https://zenkai.systems/ | head -20
curl -sSf https://zenkai.systems/sectores/ecommerce | head -5
curl -X POST https://zenkai.systems/api/lead \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Smoke","empresa":"Smoke Test","sector":"ecommerce","etapa":"Empezando","plan_interes":"Starter","presupuesto":"$1,000-3,000","whatsapp":"+573000000000","mensaje":"smoke test prod"}'
```

Esperado: form responde 200 con `lead_id` y `propuesta_id` ambos no null.

- [ ] **Step 3:** Verificar en Airtable que el lead "Smoke Test" aparece y tiene propuesta linkeada · borrar después
- [ ] **Step 4:** Verificar email notificación llega a `ZENKAI_NOTIFY_EMAIL`

### Tarea 5.5 · Actualizar ESTADO-ACTUAL.md + cerrar fase (30min)

**Files:**
- Modify: `ESTADO-ACTUAL.md`
- Modify: `CLAUDE.md` (si aplica · §11 contexto fijo)

- [ ] **Step 1:** Añadir bloque a `ESTADO-ACTUAL.md` bajo "DÓNDE ESTAMOS":

```
✅ **LANDING PÚBLICA · zenkai.systems LIVE**
- Astro 5 + Tailwind + TypeScript estricto en `web/`
- 12 páginas: home + 8 sectores + planes + gracias + conversacion + 404
- 5 tiers + 8 sectores en content collections con Zod
- /api/lead crea Lead en Airtable + dispara /api/protocolo (≥Starter) + emails Resend
- WhatsApp FAB contextual + Cal.com embed en /conversacion
- Vercel project `zenkai-web` separado · root `web/` · DNS apex en Hostinger
- panel.zenkai.systems sirve el panel interno (sin regresiones)
- Lighthouse mobile + desktop ≥ 90 en 4 categorías
```

- [ ] **Step 2:** Actualizar `CLAUDE.md` §11 Stack activo añadiendo "Resend" y "Cal.com" si no estaban
- [ ] **Step 3:** Actualizar `MEMORY.md` (auto-memory) si hubo decisiones nuevas relevantes — ej. "rate limit por Airtable es soft limit aceptado"
- [ ] **Step 4:** Commit:

```bash
git add ESTADO-ACTUAL.md CLAUDE.md
git commit -m "docs: cerrar landing pública zenkai.systems v0.1 LIVE · Fase 5"
```

- [ ] **Step 5:** Push final · verificar deploy en producción

---

## Resumen de fases y horas

| Fase | Tareas | Horas | Estado |
|------|--------|-------|--------|
| 0 · Setup monorepo `web/` (incluye 0.0 pre-flight) | 0.0 - 0.4 | 3.5-4.5h | pending |
| 1 · Estructura Astro base | 1.1 - 1.4 | 5-7h | pending |
| 2 · Secciones públicas | 2.1 - 2.8 | 9-11h | pending |
| 3 · Formulario + integración API (incluye 3.7-pre · CVE) | 3.1 - 3.8 (+3.7-pre) | 8.5-10.5h | pending |
| 4 · WhatsApp FAB + Cal.com | 4.1 - 4.4 | 3-4h | pending |
| 5 · QA + Deploy producción | 5.1 - 5.5 | 3.5-4.5h | pending |
| **TOTAL** | **29 tareas** | **32.5-40.5h** | **pending** |

Reducción de horas vs v1.0 (34-44h → 32.5-40.5h) viene de: assets + env ya confirmados (menos discovery en Fase 1 y 2) · DNS Hostinger directo sin Cloudflare en Fase 5. Compensado por +30min de Tarea 3.7-pre (mitigación CVE `@astrojs/vercel`).

**Camino crítico:** Fase 0 → 1 → 2 (puede paralelizarse algo de 1.4 con 2.1) → 3 → 4 → 5. Fases 3 y 4 dependen de prerrequisitos del usuario (Resend, WA, Cal.com), pueden retrasarse si esos no están listos.

**Riesgos:**
- Cal.com embed puede dar problemas de CSP en producción · plan B = link externo en lugar de iframe
- Resend dominio no verificado a tiempo · **mitigado:** dominio ya verificado al cierre de plan v1.1 (Enable Sending ON · From `hola@zenkai.systems`)
- Apex domain en Hostinger con A records modernos · **decisión v1:** usar Hostinger DNS directo (no Cloudflare). Cloudflare como nameserver intermedio queda diferido a Sprint 2 post-launch si surge problema real de performance o caching.

---

## Out of scope (este plan)

Confirmado por spec §11. **No incluido aquí, va en planes separados:**
- Construcción de la automatización del Lite (los 8 SOPs/templates · 44h · sub-proyecto)
- Migración del proyecto Framer existente (cancelar Basic en mes 2)
- Plan de adquisición / ad spend (proyecto ARES)
- Integración WA Cloud API a nivel productivo (Fase 4 del roadmap general)

---

**Siguiente paso después de aprobar el plan:** invocar `superpowers:subagent-driven-development` (recomendado) o `superpowers:executing-plans` para arrancar Fase 0.1.
