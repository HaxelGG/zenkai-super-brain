# Panel ZENKAI · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el panel de control interno de ZENKAI v1: sitio Astro estático que lee los markdown del repo (agentes, sectores, workflows, conexiones, finanzas) con frontmatter validado por Zod, estilo "ejecutivo limpio", responsive, deployado en Vercel con auth.

**Architecture:** Subcarpeta `panel/` dentro de `Kenzai Super Brain/`. Astro 5 + TypeScript + Tailwind. Content Collections con loaders `glob` apuntando a `../<carpeta>/*.md`. Build estático puro · sin runtime de servidor en producción. Deploy a Vercel con root directory `panel/` y Vercel Authentication activado.

**Tech Stack:** Astro 5.x · TypeScript estricto · Tailwind CSS 3.x · Zod (vía Astro) · `@fontsource-variable/inter` y `@fontsource-variable/jetbrains-mono` self-hosted · Node 20+ · git · Vercel.

**Spec de referencia:** `docs/specs/2026-05-01-panel-zenkai-design.md`

---

## Estructura final de archivos

Estos archivos se crean a lo largo del plan. Mapa para localizar cada uno:

```
Kenzai Super Brain/
├── .gitignore                                  ← MODIFICAR (añadir node_modules, panel/dist, .vercel)
├── agentes/<NOMBRE>.md (×12)                   ← MODIFICAR (añadir frontmatter)
├── sectores/<slug>.md (×11)                    ← MODIFICAR (añadir frontmatter)
├── workflows/<slug>.md (×6)                    ← MODIFICAR (añadir frontmatter)
├── sops/<slug>.md (×5)                         ← MODIFICAR (añadir frontmatter)
├── conexiones/conexiones-<slug>.md (×4)        ← MODIFICAR (añadir frontmatter)
├── finanzas/<slug>.md (×5)                     ← MODIFICAR (añadir frontmatter)
├── templates/<slug>.md (×6)                    ← MODIFICAR (añadir frontmatter)
├── skills/skill-<slug>.md (×6)                 ← MODIFICAR (añadir frontmatter)
└── panel/                                      ← CREAR todo
    ├── package.json
    ├── astro.config.mjs
    ├── tailwind.config.mjs
    ├── tsconfig.json
    ├── .gitignore
    ├── .vercel/                                (auto-generado al conectar)
    ├── README.md
    ├── public/
    │   └── favicon.svg
    └── src/
        ├── env.d.ts
        ├── content.config.ts                   (las 8 colecciones + Zod schemas)
        ├── styles/
        │   └── global.css                      (Tailwind directives + variables CSS)
        ├── lib/
        │   ├── agentes.ts                      (helpers: getBySlug, getAll, byModelo)
        │   └── cross-refs.ts                   (validación cruzada agentes↔sectores↔workflows)
        ├── layouts/
        │   ├── PanelLayout.astro
        │   └── DetalleLayout.astro
        ├── components/
        │   ├── TopNav.astro
        │   ├── Logo.astro
        │   ├── PageHeader.astro
        │   ├── KPIStat.astro
        │   ├── KPIStrip.astro
        │   ├── Badge.astro
        │   ├── Chip.astro
        │   ├── EmptyState.astro
        │   ├── AgenteCard.astro
        │   ├── SectorCard.astro
        │   ├── WorkflowCard.astro
        │   ├── ConexionCard.astro
        │   └── DiagramaFlujo.astro
        └── pages/
            ├── index.astro
            ├── 404.astro
            ├── agentes/
            │   ├── index.astro
            │   └── [slug].astro
            ├── sectores/
            │   ├── index.astro
            │   └── [slug].astro
            ├── workflows/
            │   ├── index.astro
            │   └── [slug].astro
            ├── conexiones.astro
            ├── finanzas.astro
            └── rendimiento.astro
```

---

# FASE 0 · Setup del proyecto

## Task 0.1 · Verificar Node.js 20+

**Files:** ninguno (verificación de entorno)

- [ ] **Step 1:** Abrir PowerShell y verificar versión de Node

Run:
```powershell
node --version
npm --version
```
Expected: `v20.x.x` o superior, npm `10.x.x` o superior.

- [ ] **Step 2:** Si Node falta o es <20, instalar

Descargar instalador LTS desde https://nodejs.org/ → "next next finish" en Windows. Reabrir PowerShell y reverificar el Step 1.

---

## Task 0.2 · Inicializar git en el repo ZENKAI

**Files:**
- Modify: `Kenzai Super Brain/.gitignore`
- Create: rama `main` y commit inicial

- [ ] **Step 1:** Verificar si ya es repo

Run:
```powershell
cd "C:\Users\jordy\Desktop\Kenzai Super Brain"
git rev-parse --is-inside-work-tree
```
Expected: error `fatal: not a git repository`. Confirma que falta `git init`.

- [ ] **Step 2:** Inicializar repo + rama main

Run:
```powershell
git init -b main
git config user.name "Jordy"
git config user.email "jordycapital@gmail.com"
```
Expected: mensaje `Initialized empty Git repository in C:/Users/jordy/Desktop/Kenzai Super Brain/.git/`.

- [ ] **Step 3:** Verificar que `.gitignore` excluye lo correcto

Read: `Kenzai Super Brain/.gitignore`. Confirmar que ya cubre:
- `.env`, `.env.local`, `.env.production`
- `secrets/`, `*.pem`, `*.key`, `google-service-account.json`
- `clientes/*/contrato-firmado.pdf`, `clientes/*/datos-sensibles/`
- `node_modules/`, `dist/`, `.next/`
- `.superpowers/` (brainstorming local)

Si falta `node_modules/` o `dist/` (deberían estar), no agregar duplicados.

- [ ] **Step 4:** Commit inicial con todo el contenido actual

Run:
```powershell
git add .
git status
```
Expected: lista de ~100+ archivos en staging (markdown del proyecto, docs, etc.). Verificar que ningún archivo de `.env*`, `secrets/`, ni el `.superpowers/` aparezca en staging. Si aparece, abortar y revisar `.gitignore`.

```powershell
git commit -m "Initial commit · ZENKAI Super Cerebro Capa 1 + spec del panel"
```
Expected: commit exitoso con ~100+ archivos.

---

## Task 0.3 · Crear repo en GitHub y push

**Files:** repo remoto en GitHub

- [ ] **Step 1:** Crear repo privado en GitHub

Ir a https://github.com/new · nombre: `zenkai-super-brain` · visibility: **Private** · NO inicializar con README · NO añadir .gitignore (ya lo tenemos local).

- [ ] **Step 2:** Conectar remoto y push

Run (reemplazar URL con la URL real del repo creado):
```powershell
git remote add origin https://github.com/<tu-usuario>/zenkai-super-brain.git
git push -u origin main
```
Expected: push exitoso con todos los commits.

- [ ] **Step 3:** Verificar en GitHub

Abrir el repo en navegador. Confirmar que aparecen `agentes/`, `sectores/`, `CLAUDE.md`, etc. y que NO aparece `.env` ni `secrets/`.

---

## Task 0.4 · Scaffold del proyecto Astro

**Files:**
- Create: `panel/package.json`
- Create: `panel/astro.config.mjs`
- Create: `panel/tsconfig.json`
- Create: `panel/.gitignore`
- Create: `panel/src/env.d.ts`
- Create: `panel/public/favicon.svg`

- [ ] **Step 1:** Crear directorio `panel/`

Run:
```powershell
cd "C:\Users\jordy\Desktop\Kenzai Super Brain"
mkdir panel
cd panel
```

- [ ] **Step 2:** Inicializar package.json

Create `panel/package.json` con este contenido exacto:

```json
{
  "name": "zenkai-panel",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro check && astro build",
    "preview": "astro preview",
    "astro": "astro"
  },
  "dependencies": {
    "astro": "^5.0.0",
    "@astrojs/check": "^0.9.0",
    "@astrojs/tailwind": "^5.1.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.5.0",
    "@fontsource-variable/inter": "^5.0.0",
    "@fontsource-variable/jetbrains-mono": "^5.0.0"
  }
}
```

- [ ] **Step 3:** Crear `panel/.gitignore`

```
node_modules/
dist/
.astro/
.vercel/
.DS_Store
*.log
```

- [ ] **Step 4:** Instalar dependencias

Run:
```powershell
npm install
```
Expected: instalación exitosa, `node_modules/` creado, `package-lock.json` generado.

- [ ] **Step 5:** Crear `panel/astro.config.mjs`

```js
// @ts-check
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  integrations: [tailwind()],
  site: "https://zenkai-panel.vercel.app",
  build: {
    format: "directory",
  },
});
```

- [ ] **Step 6:** Crear `panel/tsconfig.json`

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": ["src/**/*", "*.mjs"],
  "exclude": ["dist", "node_modules"]
}
```

- [ ] **Step 7:** Crear `panel/src/env.d.ts`

```ts
/// <reference path="../.astro/types.d.ts" />
```

- [ ] **Step 8:** Crear `panel/public/favicon.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#0a0a0a"/>
  <path d="M9 9h14L9 23h14" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

- [ ] **Step 9:** Verificar el scaffold con dev server

Run:
```powershell
npm run dev
```
Expected: servidor corriendo en `http://localhost:4321`. La página inicial dará 404 (no hay pages aún) — normal. Detener con Ctrl+C.

- [ ] **Step 10:** Commit

Run:
```powershell
cd ..
git add panel/ .gitignore
git commit -m "feat(panel): scaffold Astro + Tailwind + TypeScript en panel/"
git push
```

---

## Task 0.5 · Configurar Tailwind con paleta ZENKAI

**Files:**
- Create: `panel/tailwind.config.mjs`
- Create: `panel/src/styles/global.css`

- [ ] **Step 1:** Crear `panel/tailwind.config.mjs`

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        "bg-muted": "rgb(var(--bg-muted) / <alpha-value>)",
        "bg-card": "rgb(var(--bg-card) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        "border-hover": "rgb(var(--border-hover) / <alpha-value>)",
        text: "rgb(var(--text) / <alpha-value>)",
        "text-muted": "rgb(var(--text-muted) / <alpha-value>)",
        "text-faint": "rgb(var(--text-faint) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        "accent-soft": "rgb(var(--accent-soft) / <alpha-value>)",
        success: "rgb(var(--success) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["'Inter Variable'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono Variable'", "Consolas", "monospace"],
      },
      borderRadius: {
        chip: "6px",
        card: "10px",
        hero: "16px",
      },
      fontSize: {
        h1: ["32px", { lineHeight: "36px", letterSpacing: "-0.02em", fontWeight: "600" }],
        h2: ["24px", { lineHeight: "28px", letterSpacing: "-0.02em", fontWeight: "600" }],
        h3: ["18px", { lineHeight: "24px", letterSpacing: "-0.01em", fontWeight: "600" }],
        body: ["15px", { lineHeight: "1.55" }],
        small: ["13px", { lineHeight: "1.5" }],
        micro: ["11px", { lineHeight: "1.4", letterSpacing: "0.06em" }],
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 2:** Crear `panel/src/styles/global.css`

```css
@import "@fontsource-variable/inter/standard.css";
@import "@fontsource-variable/jetbrains-mono/standard.css";

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --bg: 255 255 255;
    --bg-muted: 250 250 250;
    --bg-card: 255 255 255;
    --border: 236 236 236;
    --border-hover: 212 212 212;
    --text: 10 10 10;
    --text-muted: 82 82 82;
    --text-faint: 163 163 163;
    --accent: 79 70 229;
    --accent-soft: 238 242 255;
    --success: 16 185 129;
    --warning: 245 158 11;
    --danger: 239 68 68;
  }

  html {
    font-family: theme("fontFamily.sans");
    color: rgb(var(--text));
    background: rgb(var(--bg));
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  body {
    @apply min-h-screen;
  }
}

@layer components {
  .label-micro {
    @apply text-micro font-medium uppercase text-text-muted;
  }

  .card-base {
    @apply bg-bg-card border border-border rounded-card;
    @apply transition-colors hover:border-border-hover;
  }

  .prose-zenkai {
    @apply text-body text-text leading-relaxed max-w-none;
  }

  .prose-zenkai h2 {
    @apply text-h2 mt-10 mb-4 text-text;
  }

  .prose-zenkai h3 {
    @apply text-h3 mt-6 mb-3 text-text;
  }

  .prose-zenkai p {
    @apply mb-4;
  }

  .prose-zenkai a {
    @apply text-accent underline underline-offset-2 hover:text-accent;
  }

  .prose-zenkai code {
    @apply font-mono text-small bg-bg-muted px-1.5 py-0.5 rounded-chip;
  }

  .prose-zenkai pre {
    @apply font-mono text-small bg-bg-muted p-4 rounded-card overflow-x-auto my-4 border border-border;
  }

  .prose-zenkai pre code {
    @apply bg-transparent p-0 rounded-none;
  }

  .prose-zenkai table {
    @apply w-full text-small my-4 border-collapse;
  }

  .prose-zenkai th,
  .prose-zenkai td {
    @apply border border-border px-3 py-2 text-left;
  }

  .prose-zenkai th {
    @apply bg-bg-muted font-semibold;
  }

  .prose-zenkai ul,
  .prose-zenkai ol {
    @apply my-4 ml-6;
  }

  .prose-zenkai ul li {
    @apply list-disc mb-1;
  }

  .prose-zenkai ol li {
    @apply list-decimal mb-1;
  }
}
```

- [ ] **Step 3:** Smoke test — crear página vacía que use el CSS

Crear `panel/src/pages/index.astro` (temporal, se reescribe en Fase 5):

```astro
---
import "../styles/global.css";
---

<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>ZENKAI · Panel</title>
  </head>
  <body class="bg-bg text-text">
    <main class="p-8">
      <h1 class="text-h1">Panel ZENKAI · scaffold OK</h1>
      <p class="text-body text-text-muted mt-4">Tipografía Inter + paleta cargadas.</p>
    </main>
  </body>
</html>
```

- [ ] **Step 4:** Verificar visualmente

Run:
```powershell
cd panel
npm run dev
```
Abrir http://localhost:4321 . Expected: fondo blanco, título en Inter (no en Times), color del texto negro. Si se ve serif, las fonts no cargaron — revisar el `@import` en `global.css`.

Detener con Ctrl+C.

- [ ] **Step 5:** Commit

```powershell
cd ..
git add panel/
git commit -m "feat(panel): tipografía + paleta + smoke page"
git push
```

---

# FASE 1 · Frontmatter pass · 8 colecciones

## Task 1.1 · Schema de la colección `agentes`

**Files:**
- Create: `panel/src/content.config.ts`

- [ ] **Step 1:** Crear `panel/src/content.config.ts` con la colección `agentes`

```ts
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const MODELO_ENUM = z.enum([
  "claude-opus-4-7",
  "claude-sonnet-4-6",
  "claude-haiku-4-5-20251001",
]);

const ESTADO_AGENTE = z.enum(["documentado", "en_revision", "activo"]);

const agentes = defineCollection({
  loader: glob({ pattern: ["*.md", "!README.md"], base: "../agentes" }),
  schema: z.object({
    name: z.string(),
    numero: z.number().int().min(1).max(12),
    departamento: z.string(),
    modelo: MODELO_ENUM,
    modelo_label: z.string(),
    sectores_lidera: z.array(z.string()).default([]),
    subagentes: z.array(z.string()).default([]),
    skills_default: z.array(z.string()).default([]),
    estado: ESTADO_AGENTE.default("documentado"),
    color_acento: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  }),
});

export const collections = { agentes };
```

- [ ] **Step 2:** Verificar el build (debe FALLAR porque ningún agente tiene frontmatter)

Run:
```powershell
cd panel
npm run build
```
Expected: el comando termina con error tipo `agentes/ZEUS.md: Required field "name" missing`. Esto valida que el schema está activo.

---

## Task 1.2 · Frontmatter para los 12 agentes

**Files:**
- Modify: `agentes/ZEUS.md`
- Modify: `agentes/ARES.md`
- Modify: `agentes/HERMES.md`
- Modify: `agentes/ATLAS.md`
- Modify: `agentes/NEXUS.md`
- Modify: `agentes/APOLLO.md`
- Modify: `agentes/MUSE.md`
- Modify: `agentes/FORGE.md`
- Modify: `agentes/ORACLE.md`
- Modify: `agentes/HIVE.md`
- Modify: `agentes/ECHO.md`
- Modify: `agentes/LEX.md`

> **Procedimiento por archivo:** leer el contenido completo · extraer subagentes y skills_default del cuerpo (suelen estar en sección IDENTIDAD o similar) · añadir frontmatter al inicio del archivo (antes del primer `#`).

- [ ] **Step 1:** Aplicar frontmatter a `agentes/ZEUS.md` (worked example completo)

Editar `agentes/ZEUS.md` y prepender este bloque (después no se toca el resto del archivo):

```yaml
---
name: ZEUS
numero: 12
departamento: "Estrategia & Decisiones"
modelo: claude-opus-4-7
modelo_label: "Opus 4.7"
sectores_lidera: [startups]
subagentes: [ZEUS-OKR, ZEUS-MARKET, ZEUS-DECIDE, ZEUS-TREND]
skills_default: [brainstorming, writing-plans, verification-before-completion]
estado: documentado
color_acento: "#4f46e5"
---

```

- [ ] **Step 2:** Verificar el build con un solo agente

Run:
```powershell
npm run build
```
Expected: error similar al anterior pero ahora apuntando a otros agentes (`ARES.md: Required field...`), confirmando que ZEUS pasó.

- [ ] **Step 3:** Aplicar frontmatter a los 11 agentes restantes

**Procedimiento por archivo:**
1. Leer el cuerpo del `.md` actual.
2. Buscar dos cosas en el cuerpo (típicamente bajo "## IDENTIDAD" o sección equivalente):
   - **Subagentes:** línea con formato `**Subagentes:** ZEUS-OKR · ZEUS-MARKET · ...` (separados por bullet · o coma o salto de línea). Extraer los nombres como array.
   - **Skills activados por defecto:** línea con formato `**Skills activados por defecto:** \`brainstorming\`, \`writing-plans\`, ...`. Extraer los slugs como array.
3. Si la sección no documenta subagentes o skills, dejar `[]` (el schema permite default vacío).
4. Prepender el frontmatter con los datos canónicos abajo + lo extraído del cuerpo.

Datos canónicos derivados de `CLAUDE.md` §2 y §5 (los campos `subagentes` y `skills_default` se completan leyendo el cuerpo según el procedimiento arriba):

`agentes/ARES.md`:
```yaml
---
name: ARES
numero: 1
departamento: "Marketing Digital"
modelo: claude-sonnet-4-6
modelo_label: "Sonnet 4.6"
sectores_lidera: [ecommerce, restaurantes, educacion, retail, ong, inmobiliaria]
subagentes: []  # COMPLETAR: extraer del cuerpo según procedimiento del Step 3
skills_default: []  # COMPLETAR: extraer del cuerpo según procedimiento del Step 3
estado: documentado
color_acento: "#dc2626"
---

```

`agentes/HERMES.md`:
```yaml
---
name: HERMES
numero: 2
departamento: "Ventas & CRM"
modelo: claude-sonnet-4-6
modelo_label: "Sonnet 4.6"
sectores_lidera: [inmobiliaria, ecommerce, retail, servicios-profesionales]
subagentes: []  # leer cuerpo
skills_default: []  # leer cuerpo
estado: documentado
color_acento: "#0891b2"
---

```

`agentes/ATLAS.md`:
```yaml
---
name: ATLAS
numero: 3
departamento: "Operaciones & Delivery"
modelo: claude-sonnet-4-6
modelo_label: "Sonnet 4.6"
sectores_lidera: [salud, manufactura, gobierno]
subagentes: []  # leer cuerpo
skills_default: []  # leer cuerpo
estado: documentado
color_acento: "#65a30d"
---

```

`agentes/NEXUS.md`:
```yaml
---
name: NEXUS
numero: 4
departamento: "IA & Automatización"
modelo: claude-sonnet-4-6
modelo_label: "Sonnet 4.6"
sectores_lidera: []
subagentes: []  # leer cuerpo
skills_default: []  # leer cuerpo
estado: documentado
color_acento: "#7c3aed"
---

```

`agentes/APOLLO.md`:
```yaml
---
name: APOLLO
numero: 5
departamento: "Diseño & Branding"
modelo: claude-sonnet-4-6
modelo_label: "Sonnet 4.6"
sectores_lidera: []
subagentes: []  # leer cuerpo
skills_default: []  # leer cuerpo
estado: documentado
color_acento: "#ea580c"
---

```

`agentes/MUSE.md`:
```yaml
---
name: MUSE
numero: 6
departamento: "Contenido & Social Media"
modelo: claude-sonnet-4-6
modelo_label: "Sonnet 4.6"
sectores_lidera: [restaurantes, educacion, ong]
subagentes: []  # leer cuerpo
skills_default: []  # leer cuerpo
estado: documentado
color_acento: "#db2777"
---

```

`agentes/FORGE.md`:
```yaml
---
name: FORGE
numero: 7
departamento: "Developer & Infraestructura"
modelo: claude-sonnet-4-6
modelo_label: "Sonnet 4.6"
sectores_lidera: [manufactura, startups]
subagentes: []  # leer cuerpo
skills_default: []  # leer cuerpo
estado: documentado
color_acento: "#475569"
---

```

`agentes/ORACLE.md`:
```yaml
---
name: ORACLE
numero: 8
departamento: "Finanzas & Métricas"
modelo: claude-sonnet-4-6
modelo_label: "Sonnet 4.6"
sectores_lidera: []
subagentes: []  # leer cuerpo
skills_default: []  # leer cuerpo
estado: documentado
color_acento: "#0d9488"
---

```

`agentes/HIVE.md`:
```yaml
---
name: HIVE
numero: 9
departamento: "RRHH & Equipo"
modelo: claude-sonnet-4-6
modelo_label: "Sonnet 4.6"
sectores_lidera: []
subagentes: []  # leer cuerpo
skills_default: []  # leer cuerpo
estado: documentado
color_acento: "#ca8a04"
---

```

`agentes/ECHO.md`:
```yaml
---
name: ECHO
numero: 10
departamento: "Atención al Cliente"
modelo: claude-sonnet-4-6
modelo_label: "Sonnet 4.6"
sectores_lidera: [salud]
subagentes: []  # leer cuerpo
skills_default: []  # leer cuerpo
estado: documentado
color_acento: "#0284c7"
---

```

`agentes/LEX.md`:
```yaml
---
name: LEX
numero: 11
departamento: "Legal & Contratos"
modelo: claude-sonnet-4-6
modelo_label: "Sonnet 4.6"
sectores_lidera: [servicios-profesionales, gobierno]
subagentes: []  # leer cuerpo
skills_default: []  # leer cuerpo
estado: documentado
color_acento: "#1e40af"
---

```

Para cada agente, completar `subagentes` y `skills_default` leyendo la sección "IDENTIDAD" o equivalente en el cuerpo del markdown. Si no existen subagentes documentados, dejar `[]`.

- [ ] **Step 4:** Verificar el build pasa

Run:
```powershell
npm run build
```
Expected: build exitoso (puede dar errores de "no pages" pero no de schema). Si algún agente falla por schema, leer el error y arreglar el frontmatter.

- [ ] **Step 5:** Commit

```powershell
cd ..
git add agentes/
git commit -m "feat(content): añadir frontmatter YAML a los 12 agentes"
git push
```

---

## Task 1.3 · Schema y frontmatter para `sectores`

**Files:**
- Modify: `panel/src/content.config.ts` (añadir colección)
- Modify: `sectores/<slug>.md` (×11)

- [ ] **Step 1:** Añadir el schema de `sectores` a `content.config.ts`

Editar `panel/src/content.config.ts`. Después del schema de `agentes`, añadir:

```ts
const FASE_SECTOR = z.union([z.literal(1), z.literal(2), z.literal("futuro")]);

const sectores = defineCollection({
  loader: glob({ pattern: ["*.md", "!README.md"], base: "../sectores" }),
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    fase: FASE_SECTOR,
    prioridad: z.enum(["alta", "media", "baja"]),
    agentes_prioritarios: z.array(z.string()),
    mercados_objetivo: z.array(z.enum(["colombia", "españa", "usa", "latam", "europa"])).default(["colombia"]),
  }),
});
```

Y actualizar el export:
```ts
export const collections = { agentes, sectores };
```

- [ ] **Step 2:** Aplicar frontmatter a los 11 sectores

Datos derivados de `CLAUDE.md` §5:

`sectores/ecommerce.md`:
```yaml
---
name: "E-commerce"
slug: ecommerce
fase: 1
prioridad: alta
agentes_prioritarios: [ARES, HERMES, NEXUS, APOLLO]
mercados_objetivo: [colombia, españa, usa]
---

```

`sectores/salud.md`:
```yaml
---
name: "Clínicas & Salud"
slug: salud
fase: 2
prioridad: alta
agentes_prioritarios: [ATLAS, ECHO, LEX, NEXUS]
mercados_objetivo: [colombia, latam]
---

```

`sectores/restaurantes.md`:
```yaml
---
name: "Restaurantes & Food"
slug: restaurantes
fase: futuro
prioridad: media
agentes_prioritarios: [ARES, MUSE, ATLAS, HERMES]
mercados_objetivo: [colombia, latam]
---

```

`sectores/servicios-profesionales.md`:
```yaml
---
name: "Servicios Profesionales"
slug: servicios-profesionales
fase: futuro
prioridad: media
agentes_prioritarios: [LEX, HERMES, MUSE, ATLAS]
mercados_objetivo: [colombia, latam, españa]
---

```

`sectores/educacion.md`:
```yaml
---
name: "Educación"
slug: educacion
fase: futuro
prioridad: media
agentes_prioritarios: [ARES, MUSE, ATLAS, ECHO]
mercados_objetivo: [colombia, latam]
---

```

`sectores/inmobiliaria.md`:
```yaml
---
name: "Inmobiliaria"
slug: inmobiliaria
fase: futuro
prioridad: media
agentes_prioritarios: [HERMES, ARES, LEX, APOLLO]
mercados_objetivo: [colombia, latam]
---

```

`sectores/manufactura.md`:
```yaml
---
name: "Manufactura"
slug: manufactura
fase: futuro
prioridad: baja
agentes_prioritarios: [ATLAS, FORGE, ORACLE, HIVE]
mercados_objetivo: [colombia, latam]
---

```

`sectores/retail.md`:
```yaml
---
name: "Retail"
slug: retail
fase: futuro
prioridad: media
agentes_prioritarios: [ARES, HERMES, MUSE, ATLAS]
mercados_objetivo: [colombia, latam]
---

```

`sectores/startups.md`:
```yaml
---
name: "Startups & Tech"
slug: startups
fase: futuro
prioridad: media
agentes_prioritarios: [ZEUS, FORGE, NEXUS, ARES]
mercados_objetivo: [colombia, usa, europa]
---

```

`sectores/gobierno.md`:
```yaml
---
name: "Gobierno"
slug: gobierno
fase: futuro
prioridad: baja
agentes_prioritarios: [LEX, ATLAS, FORGE, ECHO]
mercados_objetivo: [colombia, latam]
---

```

`sectores/ong.md`:
```yaml
---
name: "ONG & Fundaciones"
slug: ong
fase: futuro
prioridad: baja
agentes_prioritarios: [ARES, MUSE, ORACLE, LEX]
mercados_objetivo: [colombia, latam, españa]
---

```

- [ ] **Step 3:** Verificar build

Run: `cd panel && npm run build`. Expected: pasa schemas de agentes y sectores.

- [ ] **Step 4:** Commit

```powershell
cd ..
git add panel/src/content.config.ts sectores/
git commit -m "feat(content): añadir schema y frontmatter de sectores"
git push
```

---

## Task 1.4 · Schema y frontmatter para `workflows`

**Files:**
- Modify: `panel/src/content.config.ts`
- Modify: `workflows/<slug>.md` (×6)

- [ ] **Step 1:** Añadir schema a `content.config.ts`

```ts
const CATEGORIA_WORKFLOW = z.enum([
  "ventas",
  "onboarding",
  "delivery",
  "reporting",
  "recuperacion",
]);

const workflows = defineCollection({
  loader: glob({ pattern: ["*.md", "!README.md"], base: "../workflows" }),
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    tiempo_objetivo: z.string(),
    agentes_principales: z.array(z.string()),
    categoria: CATEGORIA_WORKFLOW,
  }),
});
```

Actualizar export: `export const collections = { agentes, sectores, workflows };`

- [ ] **Step 2:** Aplicar frontmatter a los 6 workflows

`workflows/workflow-nuevo-cliente.md`:
```yaml
---
name: "Nuevo Cliente"
slug: workflow-nuevo-cliente
tiempo_objetivo: "7-21 días"
agentes_principales: [ARES, HERMES, ORACLE, LEX, ATLAS]
categoria: ventas
---

```

`workflows/workflow-onboarding.md`:
```yaml
---
name: "Onboarding del Cliente"
slug: workflow-onboarding
tiempo_objetivo: "3-7 días"
agentes_principales: [ATLAS, HERMES, FORGE, ECHO]
categoria: onboarding
---

```

`workflows/workflow-crear-landing.md`:
```yaml
---
name: "Crear Landing Page"
slug: workflow-crear-landing
tiempo_objetivo: "2-5 días"
agentes_principales: [APOLLO, MUSE, FORGE, NEXUS]
categoria: delivery
---

```

`workflows/workflow-diagnostico-empresa.md`:
```yaml
---
name: "Diagnóstico de Empresa"
slug: workflow-diagnostico-empresa
tiempo_objetivo: "1-3 días"
agentes_principales: [ZEUS, ATLAS, ORACLE, NEXUS]
categoria: delivery
---

```

`workflows/workflow-reporte-semanal.md`:
```yaml
---
name: "Reporte Semanal al Cliente"
slug: workflow-reporte-semanal
tiempo_objetivo: "Recurrente · semanal"
agentes_principales: [ORACLE, ATLAS, ECHO]
categoria: reporting
---

```

`workflows/workflow-recuperar-lead-frio.md`:
```yaml
---
name: "Recuperar Lead Frío"
slug: workflow-recuperar-lead-frio
tiempo_objetivo: "30-90 días"
agentes_principales: [HERMES, ARES, MUSE]
categoria: recuperacion
---

```

> Si el `tiempo_objetivo` o agentes principales reales en el cuerpo del markdown difieren, actualizar el frontmatter para que coincida con el cuerpo (el cuerpo es la verdad documentada · el frontmatter solo lo expone estructurado).

- [ ] **Step 3:** Verificar build · `npm run build`. Expected: pasa.

- [ ] **Step 4:** Commit

```powershell
git add panel/src/content.config.ts workflows/
git commit -m "feat(content): añadir schema y frontmatter de workflows"
git push
```

---

## Task 1.5 · Schemas y frontmatter para `sops`, `conexiones`, `finanzas`, `templates`, `skills_zenkai`

**Files:**
- Modify: `panel/src/content.config.ts`
- Modify: `sops/*.md` (×5)
- Modify: `conexiones/conexiones-*.md` (×4)
- Modify: `finanzas/*.md` (×5)
- Modify: `templates/*.md` (×6)
- Modify: `skills/skill-*.md` (×6)

- [ ] **Step 1:** Añadir los 5 schemas restantes a `content.config.ts`

Append al archivo (antes del `export`):

```ts
const sops = defineCollection({
  loader: glob({ pattern: ["*.md", "!README.md"], base: "../sops" }),
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    sla: z.string(),
    agentes_responsables: z.array(z.string()),
    frecuencia: z.enum(["por_evento", "diaria", "semanal", "mensual"]),
    criticidad: z.enum(["alta", "media", "baja"]),
  }),
});

const conexiones = defineCollection({
  loader: glob({ pattern: "conexiones-*.md", base: "../conexiones" }),
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    servicios_dependientes: z.array(z.string()).default([]),
    criticidad: z.enum(["alta", "media", "baja"]),
    estado_conexion: z.enum(["pendiente", "en_proceso", "activo", "bloqueado"]).default("pendiente"),
    fase_conexion: z.number().int().min(1).max(7),
  }),
});

const finanzas = defineCollection({
  loader: glob({ pattern: ["*.md", "!README.md"], base: "../finanzas" }),
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    tipo: z.enum(["calculadora", "stack", "proyeccion"]),
    tier: z.enum(["eco", "pro", "premium"]).optional(),
    costo_mensual_usd: z.number().nonnegative().optional(),
  }),
});

const templates = defineCollection({
  loader: glob({ pattern: ["*.md", "!README.md"], base: "../templates" }),
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    categoria: z.enum(["ventas", "legal", "landing", "reporting", "brief", "diagnostico"]),
    agentes_dueños: z.array(z.string()),
    variables_principales: z.array(z.string()).default([]),
  }),
});

const skills_zenkai = defineCollection({
  loader: glob({ pattern: "skill-*.md", base: "../skills" }),
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    agentes_que_usan: z.array(z.string()),
    tipo: z.enum(["rigid", "flexible"]),
  }),
});
```

Y actualizar export final:
```ts
export const collections = {
  agentes,
  sectores,
  workflows,
  sops,
  conexiones,
  finanzas,
  templates,
  skills_zenkai,
};
```

- [ ] **Step 2:** Frontmatter para los 5 SOPs

`sops/sop-respuesta-lead.md`:
```yaml
---
name: "Respuesta a Lead"
slug: sop-respuesta-lead
sla: "<10 min"
agentes_responsables: [HERMES]
frecuencia: por_evento
criticidad: alta
---

```

`sops/sop-cualificacion-whatsapp.md`:
```yaml
---
name: "Cualificación por WhatsApp"
slug: sop-cualificacion-whatsapp
sla: "<2 horas"
agentes_responsables: [HERMES, ECHO]
frecuencia: por_evento
criticidad: alta
---

```

`sops/sop-entrega-proyecto.md`:
```yaml
---
name: "Entrega de Proyecto"
slug: sop-entrega-proyecto
sla: "Según contrato (típico 2-4 semanas)"
agentes_responsables: [ATLAS, FORGE]
frecuencia: por_evento
criticidad: alta
---

```

`sops/sop-mantenimiento-sistemas.md`:
```yaml
---
name: "Mantenimiento de Sistemas"
slug: sop-mantenimiento-sistemas
sla: "Recurrente · semanal"
agentes_responsables: [FORGE, NEXUS]
frecuencia: semanal
criticidad: media
---

```

`sops/sop-escalada-problemas.md`:
```yaml
---
name: "Escalada de Problemas"
slug: sop-escalada-problemas
sla: "<1 hora desde detección"
agentes_responsables: [ZEUS, ECHO, FORGE]
frecuencia: por_evento
criticidad: alta
---

```

- [ ] **Step 3:** Frontmatter para las 4 conexiones

`conexiones/conexiones-airtable.md`:
```yaml
---
name: "Airtable"
slug: airtable
servicios_dependientes: [Make, agentes]
criticidad: alta
estado_conexion: pendiente
fase_conexion: 2
---

```

`conexiones/conexiones-make.md`:
```yaml
---
name: "Make"
slug: make
servicios_dependientes: [Airtable, WhatsApp, Stripe]
criticidad: alta
estado_conexion: pendiente
fase_conexion: 3
---

```

`conexiones/conexiones-whatsapp.md`:
```yaml
---
name: "WhatsApp Cloud API"
slug: whatsapp
servicios_dependientes: [Meta, BSP]
criticidad: alta
estado_conexion: pendiente
fase_conexion: 4
---

```

`conexiones/conexiones-framer.md`:
```yaml
---
name: "Framer"
slug: framer
servicios_dependientes: []
criticidad: media
estado_conexion: pendiente
fase_conexion: 5
---

```

- [ ] **Step 4:** Frontmatter para los 5 archivos de finanzas

`finanzas/calculadora-precios.md`:
```yaml
---
name: "Calculadora de Precios"
slug: calculadora-precios
tipo: calculadora
---

```

`finanzas/stack-eco.md`:
```yaml
---
name: "Stack Eco"
slug: stack-eco
tipo: stack
tier: eco
costo_mensual_usd: 0
---

```

`finanzas/stack-pro.md`:
```yaml
---
name: "Stack Pro"
slug: stack-pro
tipo: stack
tier: pro
costo_mensual_usd: 250
---

```

`finanzas/stack-premium.md`:
```yaml
---
name: "Stack Premium"
slug: stack-premium
tipo: stack
tier: premium
costo_mensual_usd: 1200
---

```

> Los `costo_mensual_usd` son estimados orientativos · ajustar al valor real del cuerpo del markdown si difiere.

`finanzas/proyeccion-facturacion.md`:
```yaml
---
name: "Proyección de Facturación 2026"
slug: proyeccion-facturacion
tipo: proyeccion
---

```

- [ ] **Step 5:** Frontmatter para los 6 templates

`templates/template-propuesta-comercial.md`:
```yaml
---
name: "Propuesta Comercial"
slug: template-propuesta-comercial
categoria: ventas
agentes_dueños: [HERMES, LEX, ORACLE]
variables_principales: [CLIENTE_NOMBRE, PRECIO_USD, ALCANCE, FECHA_INICIO]
---

```

`templates/template-contrato-servicios.md`:
```yaml
---
name: "Contrato de Servicios"
slug: template-contrato-servicios
categoria: legal
agentes_dueños: [LEX]
variables_principales: [CLIENTE_NOMBRE, RAZON_SOCIAL, NIT, MONTO_TOTAL, ENTREGABLES]
---

```

`templates/template-landing-universal.md`:
```yaml
---
name: "Landing Page Universal · 9 secciones"
slug: template-landing-universal
categoria: landing
agentes_dueños: [APOLLO, MUSE, ARES]
variables_principales: [PRODUCTO_NOMBRE, PROPUESTA_VALOR, CTA_PRINCIPAL, TESTIMONIOS, PRECIO]
---

```

`templates/template-diagnostico-empresa.md`:
```yaml
---
name: "Diagnóstico de Empresa"
slug: template-diagnostico-empresa
categoria: diagnostico
agentes_dueños: [ZEUS, ATLAS, ORACLE]
variables_principales: [EMPRESA_NOMBRE, SECTOR, TAMAÑO_EQUIPO, MADUREZ_DIGITAL]
---

```

`templates/template-reporte-cliente.md`:
```yaml
---
name: "Reporte Semanal al Cliente"
slug: template-reporte-cliente
categoria: reporting
agentes_dueños: [ORACLE, ATLAS]
variables_principales: [CLIENTE_NOMBRE, SEMANA, KPIS, AVANCES, BLOQUEOS, PROXIMA_SEMANA]
---

```

`templates/template-brief-proyecto.md`:
```yaml
---
name: "Brief de Proyecto"
slug: template-brief-proyecto
categoria: brief
agentes_dueños: [ZEUS, HERMES]
variables_principales: [CLIENTE_NOMBRE, OBJETIVO, KPIS_CRITICOS, RESTRICCIONES, BUDGET]
---

```

- [ ] **Step 6:** Frontmatter para los 6 skills nativos

`skills/skill-diagnostico-empresa.md`:
```yaml
---
name: "Diagnóstico de Empresa"
slug: skill-diagnostico-empresa
agentes_que_usan: [ZEUS, ATLAS, ORACLE]
tipo: flexible
---

```

`skills/skill-calcular-precio.md`:
```yaml
---
name: "Calcular Precio"
slug: skill-calcular-precio
agentes_que_usan: [ORACLE, HERMES]
tipo: rigid
---

```

`skills/skill-crear-landing.md`:
```yaml
---
name: "Crear Landing"
slug: skill-crear-landing
agentes_que_usan: [APOLLO, FORGE]
tipo: flexible
---

```

`skills/skill-cualificar-lead.md`:
```yaml
---
name: "Cualificar Lead"
slug: skill-cualificar-lead
agentes_que_usan: [HERMES]
tipo: rigid
---

```

`skills/skill-generar-propuesta.md`:
```yaml
---
name: "Generar Propuesta"
slug: skill-generar-propuesta
agentes_que_usan: [HERMES, LEX, ORACLE]
tipo: flexible
---

```

`skills/skill-onboarding-cliente.md`:
```yaml
---
name: "Onboarding del Cliente"
slug: skill-onboarding-cliente
agentes_que_usan: [ATLAS, ECHO, FORGE]
tipo: flexible
---

```

- [ ] **Step 7:** Verificar build con TODAS las colecciones

Run: `cd panel && npm run build`. Expected: build PASA en validación de schemas (puede dar otros warnings pero no errores Zod).

- [ ] **Step 8:** Commit

```powershell
cd ..
git add panel/src/content.config.ts sops/ conexiones/ finanzas/ templates/ skills/
git commit -m "feat(content): añadir schemas y frontmatter para sops/conexiones/finanzas/templates/skills"
git push
```

---

## Task 1.6 · Helpers de cross-references

**Files:**
- Create: `panel/src/lib/cross-refs.ts`

- [ ] **Step 1:** Crear helpers que validan y consultan referencias cruzadas

Create `panel/src/lib/cross-refs.ts`:

```ts
import { getCollection, type CollectionEntry } from "astro:content";

/** Valida que cada referencia entre colecciones apunte a un slug existente. Lanza error en build si falla. */
export async function validateCrossRefs(): Promise<void> {
  const agentes = await getCollection("agentes");
  const sectores = await getCollection("sectores");
  const workflows = await getCollection("workflows");
  const sops = await getCollection("sops");

  const agenteNames = new Set(agentes.map((a) => a.data.name));
  const sectorSlugs = new Set(sectores.map((s) => s.data.slug));

  const errors: string[] = [];

  for (const agente of agentes) {
    for (const slug of agente.data.sectores_lidera) {
      if (!sectorSlugs.has(slug)) {
        errors.push(`agentes/${agente.id}: sectores_lidera incluye "${slug}" que no existe en sectores/`);
      }
    }
  }

  for (const sector of sectores) {
    for (const name of sector.data.agentes_prioritarios) {
      if (!agenteNames.has(name)) {
        errors.push(`sectores/${sector.id}: agentes_prioritarios incluye "${name}" que no existe en agentes/`);
      }
    }
  }

  for (const workflow of workflows) {
    for (const name of workflow.data.agentes_principales) {
      if (!agenteNames.has(name)) {
        errors.push(`workflows/${workflow.id}: agentes_principales incluye "${name}" que no existe en agentes/`);
      }
    }
  }

  for (const sop of sops) {
    for (const name of sop.data.agentes_responsables) {
      if (!agenteNames.has(name)) {
        errors.push(`sops/${sop.id}: agentes_responsables incluye "${name}" que no existe en agentes/`);
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Cross-reference validation failed:\n${errors.join("\n")}`);
  }
}

/** Para un agente dado, devuelve los workflows donde participa como agente principal. */
export async function workflowsDeAgente(
  agenteName: string,
): Promise<CollectionEntry<"workflows">[]> {
  const workflows = await getCollection("workflows");
  return workflows.filter((w) => w.data.agentes_principales.includes(agenteName));
}

/** Para un agente dado, devuelve los sectores donde aparece como prioritario (no solo donde lidera). */
export async function sectoresDeAgente(
  agenteName: string,
): Promise<CollectionEntry<"sectores">[]> {
  const sectores = await getCollection("sectores");
  return sectores.filter((s) => s.data.agentes_prioritarios.includes(agenteName));
}

/** Para un sector dado, devuelve los agentes prioritarios completos (con su data). */
export async function agentesDeSector(
  sectorSlug: string,
): Promise<CollectionEntry<"agentes">[]> {
  const sectores = await getCollection("sectores");
  const sector = sectores.find((s) => s.data.slug === sectorSlug);
  if (!sector) return [];
  const agentes = await getCollection("agentes");
  return sector.data.agentes_prioritarios
    .map((name) => agentes.find((a) => a.data.name === name))
    .filter((a): a is CollectionEntry<"agentes"> => a !== undefined);
}
```

- [ ] **Step 2:** Verificar typecheck

Run: `cd panel && npm run build`. Expected: pasa typecheck. Si Zod schemas no son inferidos, revisar que `astro/tsconfigs/strict` esté en `tsconfig.json`.

- [ ] **Step 3:** Commit

```powershell
cd ..
git add panel/src/lib/
git commit -m "feat(panel): helpers de cross-references entre colecciones"
git push
```

---

# FASE 2 · Sistema visual base

## Task 2.1 · Layout principal `PanelLayout.astro`

**Files:**
- Create: `panel/src/layouts/PanelLayout.astro`

- [ ] **Step 1:** Crear layout

```astro
---
import "../styles/global.css";
import TopNav from "../components/TopNav.astro";

interface Props {
  title: string;
  description?: string;
}

const { title, description = "Panel interno de control · ZENKAI Growth Systems" } = Astro.props;
---

<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content={description} />
    <meta name="robots" content="noindex, nofollow" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>{title} · ZENKAI</title>
  </head>
  <body class="bg-bg text-text">
    <TopNav />
    <main class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <slot />
    </main>
    <footer class="border-t border-border mt-16">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 text-small text-text-faint flex flex-col sm:flex-row justify-between items-center gap-2">
        <span>ZENKAI Growth Systems · Super Cerebro v2.0 · Capa 1</span>
        <span class="font-mono text-micro">localhost dev · privado</span>
      </div>
    </footer>
  </body>
</html>
```

---

## Task 2.2 · `Logo.astro` y `TopNav.astro`

**Files:**
- Create: `panel/src/components/Logo.astro`
- Create: `panel/src/components/TopNav.astro`

- [ ] **Step 1:** Crear `panel/src/components/Logo.astro`

```astro
---
interface Props {
  withText?: boolean;
}
const { withText = true } = Astro.props;
---

<a href="/" class="flex items-center gap-2.5 text-text hover:text-text no-underline">
  <span class="inline-block w-6 h-6 bg-text rounded-[6px] flex-shrink-0"></span>
  {withText && (
    <span class="font-semibold text-[15px] tracking-tight whitespace-nowrap">
      ZENKAI <span class="text-text-faint hidden md:inline">· Super Cerebro</span>
    </span>
  )}
</a>
```

- [ ] **Step 2:** Crear `panel/src/components/TopNav.astro`

```astro
---
import Logo from "./Logo.astro";

const items = [
  { href: "/", label: "Home" },
  { href: "/agentes", label: "Agentes" },
  { href: "/sectores", label: "Sectores" },
  { href: "/workflows", label: "Workflows" },
  { href: "/conexiones", label: "Conexiones" },
  { href: "/finanzas", label: "Finanzas" },
  { href: "/rendimiento", label: "Rendimiento" },
];

const path = Astro.url.pathname;
const isActive = (href: string) =>
  href === "/" ? path === "/" : path.startsWith(href);
---

<header class="sticky top-0 z-50 bg-bg/95 backdrop-blur border-b border-border">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
    <Logo />

    <nav class="hidden md:flex items-center gap-6 text-small">
      {items.slice(1).map((item) => (
        <a
          href={item.href}
          class:list={[
            "text-text-muted hover:text-text transition-colors",
            isActive(item.href) && "text-text font-medium border-b-2 border-accent pb-[2px]",
          ]}
        >
          {item.label}
        </a>
      ))}
    </nav>

    <button
      type="button"
      class="md:hidden p-2 -mr-2 text-text"
      aria-label="Abrir menú"
      data-nav-toggle
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="4" y1="6" x2="20" y2="6" />
        <line x1="4" y1="12" x2="20" y2="12" />
        <line x1="4" y1="18" x2="20" y2="18" />
      </svg>
    </button>
  </div>

  <div
    class="md:hidden hidden border-t border-border bg-bg"
    data-nav-mobile
  >
    <nav class="px-4 py-3 flex flex-col gap-1 text-body">
      {items.slice(1).map((item) => (
        <a
          href={item.href}
          class:list={[
            "py-2 px-2 rounded-chip text-text-muted hover:bg-bg-muted hover:text-text",
            isActive(item.href) && "text-text font-medium bg-accent-soft",
          ]}
        >
          {item.label}
        </a>
      ))}
    </nav>
  </div>
</header>

<script>
  const toggle = document.querySelector<HTMLButtonElement>("[data-nav-toggle]");
  const mobile = document.querySelector<HTMLElement>("[data-nav-mobile]");
  toggle?.addEventListener("click", () => {
    mobile?.classList.toggle("hidden");
  });
</script>
```

- [ ] **Step 3:** Smoke test del layout

Reemplazar el contenido temporal de `panel/src/pages/index.astro` con:

```astro
---
import PanelLayout from "../layouts/PanelLayout.astro";
---

<PanelLayout title="Home">
  <h1 class="text-h1">Panel ZENKAI</h1>
  <p class="text-body text-text-muted mt-2">Layout y nav OK.</p>
</PanelLayout>
```

Run: `npm run dev`. Verificar en navegador (desktop) que aparece el TopNav con los 7 items, el logo a la izquierda. Reducir a <640px de ancho — el menú colapsa a hamburguesa, click muestra menú.

- [ ] **Step 4:** Commit

```powershell
cd ..
git add panel/src/
git commit -m "feat(panel): PanelLayout · TopNav responsive · Logo"
git push
```

---

## Task 2.3 · Componentes base · `Badge`, `Chip`, `KPIStat`, `KPIStrip`, `EmptyState`, `PageHeader`

**Files:**
- Create: `panel/src/components/Badge.astro`
- Create: `panel/src/components/Chip.astro`
- Create: `panel/src/components/KPIStat.astro`
- Create: `panel/src/components/KPIStrip.astro`
- Create: `panel/src/components/EmptyState.astro`
- Create: `panel/src/components/PageHeader.astro`

- [ ] **Step 1:** Crear `Badge.astro`

```astro
---
type Variant = "neutral" | "accent" | "success" | "warning" | "danger" | "mono";

interface Props {
  variant?: Variant;
  class?: string;
}

const { variant = "neutral", class: className = "" } = Astro.props;

const variantClasses: Record<Variant, string> = {
  neutral: "bg-bg-muted text-text-muted",
  accent: "bg-accent-soft text-accent",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  mono: "bg-bg-muted text-text-muted font-mono",
};
---

<span class:list={[
  "inline-flex items-center gap-1 px-2 py-0.5 rounded-chip text-micro font-medium uppercase tracking-wide",
  variantClasses[variant],
  className,
]}>
  <slot />
</span>
```

- [ ] **Step 2:** Crear `Chip.astro`

```astro
---
interface Props {
  href?: string;
  class?: string;
}
const { href, class: className = "" } = Astro.props;
const baseClasses = "inline-flex items-center px-2.5 py-1 text-small rounded-full bg-bg-muted text-text-muted hover:bg-accent-soft hover:text-accent transition-colors no-underline";
---

{href ? (
  <a href={href} class:list={[baseClasses, className]}>
    <slot />
  </a>
) : (
  <span class:list={[baseClasses, "cursor-default", className]}>
    <slot />
  </span>
)}
```

- [ ] **Step 3:** Crear `KPIStat.astro`

```astro
---
interface Props {
  label: string;
  value: string | number;
  caption?: string;
  variant?: "default" | "muted";
}
const { label, value, caption, variant = "default" } = Astro.props;
---

<div class="card-base p-4 sm:p-5">
  <div class="label-micro">{label}</div>
  <div class:list={[
    "mt-1 text-[28px] font-semibold tracking-tight leading-none",
    variant === "muted" ? "text-text-faint" : "text-text",
  ]}>
    {value}
  </div>
  {caption && (
    <div class="mt-1 text-micro text-text-faint normal-case tracking-normal">{caption}</div>
  )}
</div>
```

- [ ] **Step 4:** Crear `KPIStrip.astro`

```astro
---
// Container responsivo. Pone los KPIStats en grid: 2 cols mobile · 4 cols desktop.
---
<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
  <slot />
</div>
```

- [ ] **Step 5:** Crear `EmptyState.astro`

```astro
---
interface Props {
  icon?: string;
  title: string;
  message: string;
}
const { icon = "🔌", title, message } = Astro.props;
---

<div class="card-base p-6 text-center">
  <div class="text-2xl mb-2" aria-hidden="true">{icon}</div>
  <div class="text-h3 text-text mb-1">{title}</div>
  <div class="text-small text-text-muted max-w-md mx-auto">{message}</div>
</div>
```

- [ ] **Step 6:** Crear `PageHeader.astro`

```astro
---
interface Props {
  eyebrow?: string;
  title: string;
  description?: string;
}
const { eyebrow, title, description } = Astro.props;
---

<header class="mb-8 sm:mb-10">
  {eyebrow && <div class="label-micro mb-2">{eyebrow}</div>}
  <h1 class="text-h1">{title}</h1>
  {description && (
    <p class="mt-3 text-body text-text-muted max-w-3xl">{description}</p>
  )}
</header>
```

- [ ] **Step 7:** Verificar build

Run: `cd panel && npm run build`. Expected: build PASA. (Las páginas listing/detail no existen todavía, pero los componentes deben compilar.)

- [ ] **Step 8:** Commit

```powershell
cd ..
git add panel/src/components/
git commit -m "feat(panel): componentes base · Badge · Chip · KPIStat · KPIStrip · EmptyState · PageHeader"
git push
```

---

# FASE 3 · Páginas de listado

## Task 3.1 · `AgenteCard` y `/agentes/index.astro`

**Files:**
- Create: `panel/src/components/AgenteCard.astro`
- Create: `panel/src/pages/agentes/index.astro`

- [ ] **Step 1:** Crear `AgenteCard.astro`

```astro
---
import Badge from "./Badge.astro";
import type { CollectionEntry } from "astro:content";

interface Props {
  agente: CollectionEntry<"agentes">;
}

const { agente } = Astro.props;
const { name, numero, departamento, modelo_label, modelo, sectores_lidera } = agente.data;

const modeloVariant =
  modelo === "claude-opus-4-7" ? "accent" :
  modelo === "claude-sonnet-4-6" ? "neutral" :
  "mono";
---

<a href={`/agentes/${agente.id}`} class="card-base p-5 block hover:shadow-sm no-underline">
  <div class="flex items-start justify-between gap-3 mb-2">
    <div class="flex items-baseline gap-2 min-w-0">
      <span class="font-mono text-micro text-text-faint">#{String(numero).padStart(2, "0")}</span>
      <span class="text-h3 font-semibold tracking-tight truncate">{name}</span>
    </div>
    <Badge variant={modeloVariant}>{modelo_label}</Badge>
  </div>
  <div class="text-small text-text-muted mb-3">{departamento}</div>
  {sectores_lidera.length > 0 && (
    <div class="text-micro text-text-faint">
      Lidera: {sectores_lidera.slice(0, 3).join(" · ")}
      {sectores_lidera.length > 3 && ` +${sectores_lidera.length - 3}`}
    </div>
  )}
</a>
```

- [ ] **Step 2:** Crear `panel/src/pages/agentes/index.astro`

```astro
---
import { getCollection } from "astro:content";
import PanelLayout from "../../layouts/PanelLayout.astro";
import PageHeader from "../../components/PageHeader.astro";
import AgenteCard from "../../components/AgenteCard.astro";

const agentes = (await getCollection("agentes")).sort(
  (a, b) => a.data.numero - b.data.numero,
);
---

<PanelLayout title="Agentes">
  <PageHeader
    eyebrow="Capa 1 · Departamentos"
    title="Los 12 Agentes Master"
    description="Cada agente representa un departamento. ZEUS razona · los otros 11 ejecutan. Modelo default por agente y sectores donde lidera."
  />

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {agentes.map((a) => <AgenteCard agente={a} />)}
  </div>
</PanelLayout>
```

- [ ] **Step 3:** Verificar visualmente

Run: `npm run dev` · ir a http://localhost:4321/agentes . Expected: 12 cards en grid. ZEUS con badge índigo (Opus 4.7), los demás con badge gris (Sonnet 4.6). Mobile responsive.

- [ ] **Step 4:** Commit

```powershell
cd ..
git add panel/src/
git commit -m "feat(panel): /agentes index + AgenteCard"
git push
```

---

## Task 3.2 · `SectorCard` y `/sectores/index.astro`

**Files:**
- Create: `panel/src/components/SectorCard.astro`
- Create: `panel/src/pages/sectores/index.astro`

- [ ] **Step 1:** Crear `SectorCard.astro`

```astro
---
import Badge from "./Badge.astro";
import type { CollectionEntry } from "astro:content";

interface Props {
  sector: CollectionEntry<"sectores">;
}

const { sector } = Astro.props;
const { name, slug, fase, prioridad, agentes_prioritarios } = sector.data;

const faseLabel = fase === 1 ? "Fase 1" : fase === 2 ? "Fase 2" : "Futuro";
const faseVariant: "success" | "warning" | "neutral" =
  fase === 1 ? "success" : fase === 2 ? "warning" : "neutral";

const prioridadVariant: "danger" | "warning" | "neutral" =
  prioridad === "alta" ? "danger" : prioridad === "media" ? "warning" : "neutral";
---

<a href={`/sectores/${slug}`} class="card-base p-5 block hover:shadow-sm no-underline">
  <div class="flex items-center justify-between gap-2 mb-2">
    <h3 class="text-h3 font-semibold tracking-tight">{name}</h3>
    <div class="flex gap-1.5 flex-shrink-0">
      <Badge variant={faseVariant}>{faseLabel}</Badge>
    </div>
  </div>
  <div class="text-small text-text-muted mb-3 capitalize">Prioridad <span class="font-medium">{prioridad}</span></div>
  <div class="text-micro text-text-faint">
    Agentes top: {agentes_prioritarios.slice(0, 4).join(" · ")}
  </div>
</a>
```

- [ ] **Step 2:** Crear `panel/src/pages/sectores/index.astro`

```astro
---
import { getCollection } from "astro:content";
import PanelLayout from "../../layouts/PanelLayout.astro";
import PageHeader from "../../components/PageHeader.astro";
import SectorCard from "../../components/SectorCard.astro";

const PRIORIDAD_ORDER = { alta: 0, media: 1, baja: 2 } as const;
const FASE_ORDER: Record<string | number, number> = { 1: 0, 2: 1, futuro: 2 };

const sectores = (await getCollection("sectores")).sort((a, b) => {
  const pa = PRIORIDAD_ORDER[a.data.prioridad];
  const pb = PRIORIDAD_ORDER[b.data.prioridad];
  if (pa !== pb) return pa - pb;
  return FASE_ORDER[String(a.data.fase)] - FASE_ORDER[String(b.data.fase)];
});
---

<PanelLayout title="Sectores">
  <PageHeader
    eyebrow="Capa 1 · Verticales"
    title="Los 11 Sectores"
    description="Sectores donde ZENKAI puede operar. Ordenados por prioridad y fase. El sector ajusta vocabulario y agentes prioritarios — no la estructura."
  />

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {sectores.map((s) => <SectorCard sector={s} />)}
  </div>
</PanelLayout>
```

- [ ] **Step 3:** Verificar y commit

Run: `npm run dev` → http://localhost:4321/sectores . Expected: 11 cards, e-commerce y salud arriba (prioridad alta), gobierno/manufactura/ong abajo (baja).

```powershell
cd ..
git add panel/src/
git commit -m "feat(panel): /sectores index + SectorCard"
git push
```

---

## Task 3.3 · `WorkflowCard` y `/workflows/index.astro`

**Files:**
- Create: `panel/src/components/WorkflowCard.astro`
- Create: `panel/src/pages/workflows/index.astro`

- [ ] **Step 1:** Crear `WorkflowCard.astro`

```astro
---
import Badge from "./Badge.astro";
import Chip from "./Chip.astro";
import type { CollectionEntry } from "astro:content";

interface Props {
  workflow: CollectionEntry<"workflows">;
}

const { workflow } = Astro.props;
const { name, slug, tiempo_objetivo, agentes_principales, categoria } = workflow.data;
---

<a href={`/workflows/${slug}`} class="card-base p-5 block hover:shadow-sm no-underline">
  <div class="flex items-center justify-between gap-2 mb-3">
    <h3 class="text-h3 font-semibold tracking-tight">{name}</h3>
    <Badge variant="neutral">{categoria}</Badge>
  </div>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-small">
    <div>
      <div class="label-micro mb-1">Tiempo objetivo</div>
      <div class="text-text font-mono">{tiempo_objetivo}</div>
    </div>
    <div>
      <div class="label-micro mb-1">Agentes principales</div>
      <div class="flex flex-wrap gap-1">
        {agentes_principales.map((nombre) => <Chip>{nombre}</Chip>)}
      </div>
    </div>
  </div>
</a>
```

- [ ] **Step 2:** Crear `panel/src/pages/workflows/index.astro`

```astro
---
import { getCollection } from "astro:content";
import PanelLayout from "../../layouts/PanelLayout.astro";
import PageHeader from "../../components/PageHeader.astro";
import WorkflowCard from "../../components/WorkflowCard.astro";

const CATEGORIA_ORDER: Record<string, number> = {
  ventas: 0,
  onboarding: 1,
  delivery: 2,
  reporting: 3,
  recuperacion: 4,
};

const workflows = (await getCollection("workflows")).sort(
  (a, b) => CATEGORIA_ORDER[a.data.categoria] - CATEGORIA_ORDER[b.data.categoria],
);
---

<PanelLayout title="Workflows">
  <PageHeader
    eyebrow="Capa 1 · Flujos end-to-end"
    title="Los 6 Workflows"
    description="Procesos completos del negocio · de lead entrante a delivery cerrado. Cada uno orquesta múltiples agentes con tiempo objetivo y SLA."
  />

  <div class="flex flex-col gap-4">
    {workflows.map((w) => <WorkflowCard workflow={w} />)}
  </div>
</PanelLayout>
```

- [ ] **Step 3:** Verificar y commit

Run: `npm run dev` → /workflows. Expected: 6 cards horizontales, ordenadas ventas → onboarding → delivery → reporting → recuperacion.

```powershell
cd ..
git add panel/src/
git commit -m "feat(panel): /workflows index + WorkflowCard"
git push
```

---

## Task 3.4 · `ConexionCard` y `/conexiones.astro`

**Files:**
- Create: `panel/src/components/ConexionCard.astro`
- Create: `panel/src/pages/conexiones.astro`

- [ ] **Step 1:** Crear `ConexionCard.astro`

```astro
---
import Badge from "./Badge.astro";
import type { CollectionEntry } from "astro:content";

interface Props {
  conexion: CollectionEntry<"conexiones">;
}

const { conexion } = Astro.props;
const { name, estado_conexion, fase_conexion, criticidad } = conexion.data;

const estadoVariant: "success" | "warning" | "danger" | "neutral" =
  estado_conexion === "activo" ? "success" :
  estado_conexion === "en_proceso" ? "warning" :
  estado_conexion === "bloqueado" ? "danger" :
  "neutral";

const estadoLabel = estado_conexion.replace("_", " ");
---

<div class="card-base p-5">
  <div class="flex items-start justify-between gap-2 mb-3">
    <h3 class="text-h3 font-semibold tracking-tight">{name}</h3>
    <Badge variant={estadoVariant}>{estadoLabel}</Badge>
  </div>
  <div class="grid grid-cols-2 gap-3 text-small text-text-muted">
    <div>
      <div class="label-micro mb-0.5">Fase</div>
      <div class="font-mono text-text">{fase_conexion} / 7</div>
    </div>
    <div>
      <div class="label-micro mb-0.5">Criticidad</div>
      <div class="font-medium capitalize text-text">{criticidad}</div>
    </div>
  </div>
</div>
```

- [ ] **Step 2:** Crear `panel/src/pages/conexiones.astro`

```astro
---
import { getCollection } from "astro:content";
import PanelLayout from "../layouts/PanelLayout.astro";
import PageHeader from "../components/PageHeader.astro";
import ConexionCard from "../components/ConexionCard.astro";
import mapaSistema from "../../../conexiones/mapa-sistema.md";

const conexiones = (await getCollection("conexiones")).sort(
  (a, b) => a.data.fase_conexion - b.data.fase_conexion,
);

const { Content: MapaContent } = mapaSistema;
---

<PanelLayout title="Conexiones">
  <PageHeader
    eyebrow="Capa 1 · Integraciones"
    title="Mapa de Conexiones"
    description="Servicios externos del stack ZENKAI. Estado actualizado por agente NEXUS · plan de conexión por fase del roadmap."
  />

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
    {conexiones.map((c) => <ConexionCard conexion={c} />)}
  </div>

  <section class="mt-10">
    <h2 class="text-h2 mb-4">Mapa del sistema</h2>
    <article class="prose-zenkai card-base p-6 sm:p-8">
      <MapaContent />
    </article>
  </section>
</PanelLayout>
```

> Nota: el `import` de `../../../conexiones/mapa-sistema.md` requiere que Astro tenga habilitada la importación de markdown como módulos (es default en Astro 5).

- [ ] **Step 3:** Verificar y commit

Run: `npm run dev` → /conexiones. Expected: 4 cards (Airtable, Make, WhatsApp, Framer) ordenadas por fase. Debajo, el mapa-sistema.md renderizado.

```powershell
cd ..
git add panel/src/
git commit -m "feat(panel): /conexiones + ConexionCard + intro desde mapa-sistema.md"
git push
```

---

## Task 3.5 · `/finanzas.astro`

**Files:**
- Create: `panel/src/pages/finanzas.astro`

- [ ] **Step 1:** Crear `panel/src/pages/finanzas.astro`

```astro
---
import { getCollection, render } from "astro:content";
import PanelLayout from "../layouts/PanelLayout.astro";
import PageHeader from "../components/PageHeader.astro";
import Badge from "../components/Badge.astro";

const finanzas = await getCollection("finanzas");
const stacks = finanzas
  .filter((f) => f.data.tipo === "stack")
  .sort((a, b) => (a.data.costo_mensual_usd ?? 0) - (b.data.costo_mensual_usd ?? 0));

const calculadora = finanzas.find((f) => f.data.slug === "calculadora-precios");
const proyeccion = finanzas.find((f) => f.data.slug === "proyeccion-facturacion");

const stackContents = await Promise.all(
  stacks.map(async (s) => ({ entry: s, ...(await render(s)) })),
);

const calculadoraRender = calculadora ? await render(calculadora) : null;
const proyeccionRender = proyeccion ? await render(proyeccion) : null;
---

<PanelLayout title="Finanzas">
  <PageHeader
    eyebrow="Capa 1 · Costos y precios"
    title="Finanzas"
    description="Tres stacks · una fórmula sagrada · un objetivo de $100K USD para 2026."
  />

  <section class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-10">
    {stackContents.map(({ entry, Content }) => (
      <article class="card-base p-6">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-h3">{entry.data.name}</h3>
          <Badge variant={entry.data.tier === "eco" ? "success" : entry.data.tier === "pro" ? "warning" : "accent"}>
            {entry.data.tier?.toUpperCase()}
          </Badge>
        </div>
        <div class="font-mono text-h2 text-text mb-4">
          ${entry.data.costo_mensual_usd ?? 0}<span class="text-small text-text-faint"> / mes</span>
        </div>
        <div class="prose-zenkai text-small">
          <Content />
        </div>
      </article>
    ))}
  </section>

  {calculadoraRender && (
    <section class="mb-10">
      <h2 class="text-h2 mb-4">Calculadora de precios</h2>
      <article class="prose-zenkai card-base p-6 sm:p-8">
        <calculadoraRender.Content />
      </article>
    </section>
  )}

  {proyeccionRender && (
    <section>
      <h2 class="text-h2 mb-4">Proyección 2026</h2>
      <article class="prose-zenkai card-base p-6 sm:p-8">
        <proyeccionRender.Content />
      </article>
    </section>
  )}
</PanelLayout>
```

- [ ] **Step 2:** Verificar y commit

Run: `npm run dev` → /finanzas. Expected: 3 cards (Eco $0, Pro $250, Premium $1200). Calculadora y proyección debajo.

```powershell
cd ..
git add panel/src/pages/finanzas.astro
git commit -m "feat(panel): /finanzas con 3 stacks + calculadora + proyeccion"
git push
```

---

## Task 3.6 · `/rendimiento.astro`

**Files:**
- Create: `panel/src/pages/rendimiento.astro`

- [ ] **Step 1:** Crear `panel/src/pages/rendimiento.astro`

```astro
---
import { getCollection } from "astro:content";
import PanelLayout from "../layouts/PanelLayout.astro";
import PageHeader from "../components/PageHeader.astro";
import KPIStat from "../components/KPIStat.astro";
import KPIStrip from "../components/KPIStrip.astro";
import EmptyState from "../components/EmptyState.astro";

const [agentes, sectores, workflows, sops, conexiones] = await Promise.all([
  getCollection("agentes"),
  getCollection("sectores"),
  getCollection("workflows"),
  getCollection("sops"),
  getCollection("conexiones"),
]);

const conexionesActivas = conexiones.filter((c) => c.data.estado_conexion === "activo").length;

const fases = [
  { num: 1, nombre: "Anthropic Claude API", estado: "pendiente" },
  { num: 2, nombre: "Airtable + 6 bases", estado: "pendiente" },
  { num: 3, nombre: "Make + connections", estado: "pendiente" },
  { num: 4, nombre: "WhatsApp Cloud API + BSP", estado: "pendiente" },
  { num: 5, nombre: "Cal.com + Stripe/Wompi", estado: "pendiente" },
  { num: 6, nombre: "Docuseal + Notion + Drive", estado: "pendiente" },
  { num: 7, nombre: "Monitoreo (Sentry + BetterStack)", estado: "pendiente" },
];
---

<PanelLayout title="Rendimiento">
  <PageHeader
    eyebrow="Estado operativo"
    title="Rendimiento"
    description="Capacidad construida vs métricas operativas. En v1 mostramos lo que sabemos de la plataforma; las métricas reales se conectan en Fases 1-7."
  />

  <section class="mb-12">
    <h2 class="text-h2 mb-4">Capacidad construida</h2>
    <KPIStrip>
      <KPIStat label="Agentes" value={`${agentes.length} / 12`} caption="documentados" />
      <KPIStat label="Sectores" value={`${sectores.length} / 11`} caption="con KPIs y dolores" />
      <KPIStat label="Workflows" value={`${workflows.length} / 6`} caption="end-to-end" />
      <KPIStat label="SOPs" value={`${sops.length} / 5`} caption="con SLA" />
    </KPIStrip>
    <div class="mt-4">
      <KPIStrip>
        <KPIStat label="Conexiones activas" value={`${conexionesActivas} / ${conexiones.length}`} caption="planeadas" variant={conexionesActivas === 0 ? "muted" : "default"} />
        <KPIStat label="Stack actual" value="Eco" caption="hasta primer cliente Pro" />
        <KPIStat label="Clientes activos" value="—" caption="🔌 conecta Airtable" variant="muted" />
        <KPIStat label="Facturado 2026" value="$0" caption="objetivo $100,000 USD" variant="muted" />
      </KPIStrip>
    </div>
  </section>

  <section class="mb-12">
    <h2 class="text-h2 mb-4">Métricas operativas</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <EmptyState title="Conversión de leads" message="Conecta Airtable + WhatsApp Cloud API (Fases 2 y 4) para ver el embudo lead → cliente." />
      <EmptyState title="Tiempo de delivery" message="Conecta Airtable (Fase 2) para medir tiempo desde firma de contrato a entrega." />
      <EmptyState title="CSAT post-entrega" message="Conecta el SOP de cierre para capturar satisfacción del cliente." />
      <EmptyState title="Margen por proyecto" message="Requiere Airtable + Stripe/Wompi (Fases 2 y 5) para cruzar costo operativo vs precio cobrado." />
    </div>
  </section>

  <section>
    <h2 class="text-h2 mb-4">Próximas fases · roadmap de conexión</h2>
    <ol class="card-base divide-y divide-border">
      {fases.map((f) => (
        <li class="flex items-center justify-between p-4">
          <div>
            <div class="text-small text-text-faint font-mono">Fase {f.num}</div>
            <div class="text-body text-text">{f.nombre}</div>
          </div>
          <span class="text-micro uppercase tracking-wide text-warning bg-warning/10 px-2 py-0.5 rounded-chip">
            {f.estado}
          </span>
        </li>
      ))}
    </ol>
  </section>
</PanelLayout>
```

- [ ] **Step 2:** Verificar y commit

Run: `npm run dev` → /rendimiento. Expected: Capacidad construida con 4 KPIs sólidos · Métricas operativas con 4 EmptyStates · roadmap con 7 fases pendientes.

```powershell
cd ..
git add panel/src/pages/rendimiento.astro
git commit -m "feat(panel): /rendimiento con capacidad + empty states + roadmap"
git push
```

---

# FASE 4 · Páginas de detalle

## Task 4.1 · Layout de detalle y `/agentes/[slug].astro`

**Files:**
- Create: `panel/src/layouts/DetalleLayout.astro`
- Create: `panel/src/pages/agentes/[slug].astro`

- [ ] **Step 1:** Crear `DetalleLayout.astro`

```astro
---
import PanelLayout from "./PanelLayout.astro";

interface Props {
  title: string;
  eyebrow?: string;
}
const { title, eyebrow } = Astro.props;
---

<PanelLayout title={title}>
  {eyebrow && <div class="label-micro mb-2">{eyebrow}</div>}
  <h1 class="text-h1 mb-8">{title}</h1>
  <div class="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 lg:gap-12">
    <article class="prose-zenkai min-w-0">
      <slot />
    </article>
    <aside class="lg:sticky lg:top-20 lg:self-start space-y-6">
      <slot name="sidebar" />
    </aside>
  </div>
</PanelLayout>
```

- [ ] **Step 2:** Crear `panel/src/pages/agentes/[slug].astro`

```astro
---
import { getCollection, render } from "astro:content";
import DetalleLayout from "../../layouts/DetalleLayout.astro";
import Badge from "../../components/Badge.astro";
import Chip from "../../components/Chip.astro";
import { workflowsDeAgente, sectoresDeAgente } from "../../lib/cross-refs";

export async function getStaticPaths() {
  const agentes = await getCollection("agentes");
  return agentes.map((agente) => ({
    params: { slug: agente.id },
    props: { agente },
  }));
}

const { agente } = Astro.props;
const { Content } = await render(agente);
const { name, numero, departamento, modelo_label, modelo, sectores_lidera, subagentes, skills_default, estado } = agente.data;

const [workflowsParticipa, sectoresAparece] = await Promise.all([
  workflowsDeAgente(name),
  sectoresDeAgente(name),
]);

const modeloVariant = modelo === "claude-opus-4-7" ? "accent" : "neutral";
---

<DetalleLayout
  title={name}
  eyebrow={`Departamento ${String(numero).padStart(2, "0")} · ${departamento}`}
>
  <Content />

  <aside slot="sidebar">
    <section class="card-base p-5 space-y-4">
      <div>
        <div class="label-micro mb-1.5">Modelo</div>
        <Badge variant={modeloVariant}>{modelo_label}</Badge>
        <div class="text-micro text-text-faint mt-1 font-mono normal-case tracking-normal">{modelo}</div>
      </div>

      <div>
        <div class="label-micro mb-1.5">Estado</div>
        <Badge variant={estado === "activo" ? "success" : "neutral"}>{estado}</Badge>
      </div>

      {subagentes.length > 0 && (
        <div>
          <div class="label-micro mb-1.5">Subagentes</div>
          <div class="flex flex-wrap gap-1">
            {subagentes.map((s) => <Chip>{s}</Chip>)}
          </div>
        </div>
      )}

      {skills_default.length > 0 && (
        <div>
          <div class="label-micro mb-1.5">Skills default</div>
          <div class="flex flex-wrap gap-1">
            {skills_default.map((s) => <Chip>{s}</Chip>)}
          </div>
        </div>
      )}
    </section>

    {sectoresAparece.length > 0 && (
      <section class="card-base p-5">
        <div class="label-micro mb-2">Sectores donde participa</div>
        <div class="flex flex-col gap-1">
          {sectoresAparece.map((s) => (
            <a href={`/sectores/${s.data.slug}`} class="text-small text-accent hover:underline flex items-center gap-1.5">
              {sectores_lidera.includes(s.data.slug) && <span class="text-warning" title="Lidera">★</span>}
              {s.data.name}
            </a>
          ))}
        </div>
      </section>
    )}

    {workflowsParticipa.length > 0 && (
      <section class="card-base p-5">
        <div class="label-micro mb-2">Workflows donde participa</div>
        <div class="flex flex-col gap-1">
          {workflowsParticipa.map((w) => (
            <a href={`/workflows/${w.data.slug}`} class="text-small text-accent hover:underline">
              {w.data.name}
            </a>
          ))}
        </div>
      </section>
    )}
  </aside>
</DetalleLayout>
```

- [ ] **Step 3:** Verificar y commit

Run: `npm run dev` → /agentes/ZEUS . Expected: cuerpo de ZEUS.md renderizado · sidebar con Modelo Opus 4.7, 4 subagentes, 3 skills default, sectores [Startups con ★], workflows donde participa (probablemente "Diagnóstico de Empresa").

```powershell
cd ..
git add panel/src/
git commit -m "feat(panel): /agentes/[slug] con sidebar de metadata + cross-refs"
git push
```

---

## Task 4.2 · `/sectores/[slug].astro`

**Files:**
- Create: `panel/src/pages/sectores/[slug].astro`

- [ ] **Step 1:** Crear el archivo

```astro
---
import { getCollection, render } from "astro:content";
import DetalleLayout from "../../layouts/DetalleLayout.astro";
import Badge from "../../components/Badge.astro";
import Chip from "../../components/Chip.astro";
import { agentesDeSector } from "../../lib/cross-refs";

export async function getStaticPaths() {
  const sectores = await getCollection("sectores");
  return sectores.map((sector) => ({
    params: { slug: sector.data.slug },
    props: { sector },
  }));
}

const { sector } = Astro.props;
const { Content } = await render(sector);
const { name, fase, prioridad, mercados_objetivo } = sector.data;
const agentes = await agentesDeSector(sector.data.slug);

const faseLabel = fase === 1 ? "Fase 1" : fase === 2 ? "Fase 2" : "Futuro";
const faseVariant: "success" | "warning" | "neutral" =
  fase === 1 ? "success" : fase === 2 ? "warning" : "neutral";
---

<DetalleLayout title={name} eyebrow="Sector · vertical">
  <Content />

  <aside slot="sidebar">
    <section class="card-base p-5 space-y-4">
      <div>
        <div class="label-micro mb-1.5">Fase</div>
        <Badge variant={faseVariant}>{faseLabel}</Badge>
      </div>

      <div>
        <div class="label-micro mb-1.5">Prioridad</div>
        <div class="text-body capitalize">{prioridad}</div>
      </div>

      <div>
        <div class="label-micro mb-1.5">Mercados objetivo</div>
        <div class="flex flex-wrap gap-1">
          {mercados_objetivo.map((m) => <Chip>{m}</Chip>)}
        </div>
      </div>
    </section>

    {agentes.length > 0 && (
      <section class="card-base p-5">
        <div class="label-micro mb-2">Agentes prioritarios</div>
        <div class="flex flex-col gap-2">
          {agentes.map((a, i) => (
            <a href={`/agentes/${a.id}`} class="flex items-center justify-between text-small hover:underline">
              <span class="flex items-center gap-2">
                <span class="font-mono text-text-faint">{i + 1}.</span>
                <span class="text-accent font-medium">{a.data.name}</span>
              </span>
              <span class="text-text-faint text-micro">{a.data.modelo_label}</span>
            </a>
          ))}
        </div>
      </section>
    )}
  </aside>
</DetalleLayout>
```

- [ ] **Step 2:** Verificar y commit

Run: `npm run dev` → /sectores/ecommerce . Expected: cuerpo de ecommerce.md (KPIs, dolores, etc.) · sidebar con Fase 1, prioridad alta, mercados, 4 agentes prioritarios numerados.

```powershell
cd ..
git add panel/src/
git commit -m "feat(panel): /sectores/[slug] con sidebar de prioridad y agentes"
git push
```

---

## Task 4.3 · `/workflows/[slug].astro`

**Files:**
- Create: `panel/src/pages/workflows/[slug].astro`

- [ ] **Step 1:** Crear el archivo

```astro
---
import { getCollection, render } from "astro:content";
import DetalleLayout from "../../layouts/DetalleLayout.astro";
import Chip from "../../components/Chip.astro";
import Badge from "../../components/Badge.astro";

export async function getStaticPaths() {
  const workflows = await getCollection("workflows");
  return workflows.map((workflow) => ({
    params: { slug: workflow.data.slug },
    props: { workflow },
  }));
}

const { workflow } = Astro.props;
const { Content } = await render(workflow);
const { name, tiempo_objetivo, agentes_principales, categoria } = workflow.data;
---

<DetalleLayout title={name} eyebrow={`Workflow · ${categoria}`}>
  <Content />

  <aside slot="sidebar">
    <section class="card-base p-5 space-y-4">
      <div>
        <div class="label-micro mb-1.5">Categoría</div>
        <Badge>{categoria}</Badge>
      </div>

      <div>
        <div class="label-micro mb-1.5">Tiempo objetivo</div>
        <div class="text-body font-mono">{tiempo_objetivo}</div>
      </div>

      <div>
        <div class="label-micro mb-2">Agentes principales</div>
        <div class="flex flex-col gap-1">
          {agentes_principales.map((nombre) => (
            <a href={`/agentes/${nombre}`} class="text-small text-accent hover:underline">
              {nombre}
            </a>
          ))}
        </div>
      </div>
    </section>
  </aside>
</DetalleLayout>
```

- [ ] **Step 2:** Verificar y commit

Run: `npm run dev` → /workflows/workflow-nuevo-cliente . Expected: cuerpo del workflow renderizado (con su bloque de diagrama de flujo en `<pre>`) · sidebar con tiempo objetivo, agentes con links.

```powershell
cd ..
git add panel/src/
git commit -m "feat(panel): /workflows/[slug] con sidebar y diagrama renderizado"
git push
```

---

# FASE 5 · Home / Dashboard

## Task 5.1 · `/index.astro`

**Files:**
- Modify: `panel/src/pages/index.astro` (reemplazar smoke test)

- [ ] **Step 1:** Reemplazar el contenido de `panel/src/pages/index.astro`

```astro
---
import { getCollection } from "astro:content";
import PanelLayout from "../layouts/PanelLayout.astro";
import KPIStat from "../components/KPIStat.astro";
import KPIStrip from "../components/KPIStrip.astro";
import { validateCrossRefs } from "../lib/cross-refs";

// Build-time gate: si las referencias cruzadas están rotas, el build falla aquí
// con mensaje claro. Solo se ejecuta una vez al renderizar Home (la página raíz).
await validateCrossRefs();

const [agentes, sectores, workflows, conexiones] = await Promise.all([
  getCollection("agentes"),
  getCollection("sectores"),
  getCollection("workflows"),
  getCollection("conexiones"),
]);

const sectoresAlta = sectores.filter((s) => s.data.prioridad === "alta").length;
const conexionesActivas = conexiones.filter((c) => c.data.estado_conexion === "activo").length;

const quickCards = [
  { href: "/agentes",     titulo: "12 Agentes Master",    desc: "1 con Opus · 11 con Sonnet · capacidad multi-departamento" },
  { href: "/sectores",    titulo: "11 Sectores",          desc: `${sectoresAlta} de prioridad alta · 1 fase 1 · 1 fase 2 · 9 futuro` },
  { href: "/workflows",   titulo: "6 Workflows end-to-end", desc: "Lead → contrato → delivery → reporte semanal" },
  { href: "/finanzas",    titulo: "Finanzas y stacks",    desc: "Calculadora · 3 tiers · proyección a $100K USD" },
];

const checklistPlatform = [
  { label: "12 / 12 Agentes Master documentados", done: agentes.length === 12 },
  { label: "11 / 11 Sectores con KPIs y dolores", done: sectores.length === 11 },
  { label: "6 / 6 Workflows end-to-end mapeados", done: workflows.length === 6 },
  { label: "5 / 5 SOPs con SLA definido",         done: true },
  { label: "Conexiones APIs activas",             done: conexionesActivas > 0, partial: `${conexionesActivas} / ${conexiones.length}` },
  { label: "Primer cliente activo",               done: false },
];
---

<PanelLayout title="Home">
  <header class="mb-10 sm:mb-12">
    <div class="label-micro mb-2">Capa 1 · Plataforma interna</div>
    <h1 class="text-h1">ZENKAI · Super Cerebro</h1>
    <p class="mt-3 text-body text-text-muted max-w-2xl">
      Panel de control de la plataforma. La fábrica que produce soluciones para clientes.
    </p>
  </header>

  <section class="mb-10">
    <KPIStrip>
      <KPIStat label="Clientes activos" value="—" caption="🔌 conecta Airtable" variant="muted" />
      <KPIStat label="Facturado 2026"   value="$0" caption="objetivo $100K USD" variant="muted" />
      <KPIStat label="Agentes listos"   value={`${agentes.length} / 12`} caption="documentados" />
      <KPIStat label="Stack actual"     value="Eco" caption="$0 / mes" />
    </KPIStrip>
  </section>

  <section class="mb-12">
    <h2 class="text-h2 mb-4">Áreas del Super Cerebro</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {quickCards.map((c) => (
        <a href={c.href} class="card-base p-6 block hover:shadow-sm no-underline">
          <h3 class="text-h3 font-semibold tracking-tight mb-1.5">{c.titulo}</h3>
          <p class="text-small text-text-muted">{c.desc}</p>
        </a>
      ))}
    </div>
  </section>

  <section>
    <h2 class="text-h2 mb-4">Estado de la plataforma</h2>
    <ul class="card-base divide-y divide-border">
      {checklistPlatform.map((c) => (
        <li class="flex items-center justify-between p-4">
          <span class={c.done ? "text-text" : "text-text-muted"}>{c.label}</span>
          {c.done ? (
            <span class="text-success font-medium" title="Completo">✓</span>
          ) : c.partial ? (
            <span class="text-warning font-mono text-small">{c.partial}</span>
          ) : (
            <span class="text-text-faint" title="Pendiente">—</span>
          )}
        </li>
      ))}
    </ul>
  </section>
</PanelLayout>
```

- [ ] **Step 2:** Verificar y commit

Run: `npm run dev` → / . Expected: hero · KPI strip 4 stats · 4 quick-cards · checklist con 4 ✓ y 2 pendientes.

```powershell
cd ..
git add panel/src/pages/index.astro
git commit -m "feat(panel): home con hero · KPIs · áreas · checklist"
git push
```

---

## Task 5.2 · Página 404

**Files:**
- Create: `panel/src/pages/404.astro`

- [ ] **Step 1:** Crear

```astro
---
import PanelLayout from "../layouts/PanelLayout.astro";
---

<PanelLayout title="404 · No encontrado">
  <div class="text-center py-16">
    <div class="font-mono text-h1 text-text-faint mb-4">404</div>
    <h1 class="text-h2 mb-3">Esta página no existe en el Super Cerebro</h1>
    <p class="text-body text-text-muted mb-8 max-w-md mx-auto">
      Probablemente el slug cambió o nunca existió. Volvé al Home y navegá desde ahí.
    </p>
    <a href="/" class="inline-block px-5 py-2.5 bg-text text-bg rounded-card hover:opacity-90 no-underline text-small font-medium">
      ← Volver al Home
    </a>
  </div>
</PanelLayout>
```

- [ ] **Step 2:** Commit

```powershell
git add panel/src/pages/404.astro
git commit -m "feat(panel): 404 personalizado"
git push
```

---

# FASE 6 · Responsive polish + deploy

## Task 6.1 · QA responsive manual

**Files:** ninguno (verificación visual)

- [ ] **Step 1:** Build completo y preview

Run:
```powershell
cd panel
npm run build
npm run preview
```
Expected: build exitoso con ~37 páginas generadas. Preview server arranca en `http://localhost:4321`.

- [ ] **Step 2:** Recorrer cada página en 3 viewports

Usar las DevTools del navegador (F12 → toggle device toolbar). Probar cada página en:

- **Mobile:** 375x667 (iPhone SE) o 390x844 (iPhone 14)
- **Tablet:** 768x1024 (iPad)
- **Desktop:** 1440x900

Páginas a recorrer:
- `/`
- `/agentes` y `/agentes/ZEUS`, `/agentes/ARES`
- `/sectores` y `/sectores/ecommerce`, `/sectores/salud`
- `/workflows` y `/workflows/workflow-nuevo-cliente`
- `/conexiones`
- `/finanzas`
- `/rendimiento`

Para cada combinación verificar:
- [ ] Top nav funciona (hamburguesa en mobile)
- [ ] Cards no se salen del viewport
- [ ] Texto legible (mínimo 13px)
- [ ] Links son tappable (mínimo 44x44px target en mobile)
- [ ] Sidebar de detalle se mueve abajo en mobile (no a la derecha)
- [ ] Tablas (en sectores con KPIs) hacen scroll horizontal sin romper layout

- [ ] **Step 3:** Anotar issues encontrados

Crear un archivo temporal `panel/QA-NOTES.md` con cualquier problema encontrado. Si no hay, omitir.

- [ ] **Step 4:** Arreglar issues encontrados

Por cada issue, hacer la edición + verificar de nuevo + commit individual con mensaje `fix(panel): <descripción>`.

- [ ] **Step 5:** Borrar `QA-NOTES.md` y commit final

```powershell
rm QA-NOTES.md
cd ..
git add -A
git commit -m "chore(panel): QA responsive completado"
git push
```

---

## Task 6.2 · Deploy inicial a Vercel

**Files:** configuración remota en Vercel (no archivos)

- [ ] **Step 1:** Crear cuenta o login en Vercel

Ir a https://vercel.com/signup · usar el mismo email de GitHub para el repo `zenkai-super-brain`. Plan: Hobby (gratis).

- [ ] **Step 2:** Importar el repo

En el Dashboard de Vercel → **Add New** → **Project** → **Import Git Repository** → seleccionar `zenkai-super-brain`.

En la pantalla de configuración:
- **Framework Preset:** Astro (auto-detectado)
- **Root Directory:** click "Edit" · escribir `panel` · click "Continue"
- **Build Command:** dejar default (`astro build`)
- **Output Directory:** dejar default (`dist`)
- **Install Command:** dejar default

Click **Deploy**.

- [ ] **Step 3:** Esperar el primer deploy

~1-2 minutos. Al terminar, Vercel da una URL del tipo `zenkai-panel-<hash>-<usuario>.vercel.app`. Abrirla y verificar que el panel carga.

- [ ] **Step 4:** Activar Vercel Authentication

En el Dashboard del proyecto → **Settings** → **Deployment Protection** → activar **Vercel Authentication** para "Production Deployments". Save.

- [ ] **Step 5:** Verificar protección

Abrir la URL en una ventana incógnito (sin sesión de Vercel). Expected: redirect a login de Vercel. Tras autenticar con la cuenta dueña del proyecto, acceso permitido.

- [ ] **Step 6:** Invitar al socio

Settings → **Members** → invitar el email del socio como **Member**. Recibe email de invitación. Una vez acepta, también puede acceder al panel autenticado.

- [ ] **Step 7:** Documentar la URL final en README

Editar `panel/README.md`:

```markdown
# ZENKAI Panel

Panel interno de control · Capa 1 del Super Cerebro.

## URLs

- **Producción:** https://zenkai-panel-<hash>.vercel.app (requiere login Vercel · solo miembros del equipo)
- **Local dev:** http://localhost:4321 después de `npm run dev`

## Comandos

```bash
npm install     # primera vez
npm run dev     # desarrollo · hot reload
npm run build   # genera dist/ con HTML estático
npm run preview # sirve dist/ localmente
```

## Estructura

Ver `docs/specs/2026-05-01-panel-zenkai-design.md` en la raíz del repo.

## Cómo se actualiza el contenido

Editar cualquier `.md` en `agentes/`, `sectores/`, `workflows/`, etc. → `git push` → Vercel rebuild + deploy en <1 min.
```

- [ ] **Step 8:** Commit y push final

```powershell
cd ..
git add panel/README.md
git commit -m "docs(panel): README con URLs y comandos"
git push
```

Verificar que Vercel hace rebuild automático y la URL final muestra el panel actualizado.

---

## Task 6.3 · Actualizar `ESTADO-ACTUAL.md` del repo

**Files:**
- Modify: `Kenzai Super Brain/ESTADO-ACTUAL.md`

- [ ] **Step 1:** Reemplazar el contenido con el nuevo estado

```markdown
# ESTADO ACTUAL · ZENKAI Super Cerebro
## Punto de continuación entre sesiones de Claude Code

**Última sesión cerrada:** [fecha de hoy]
**Modo recomendado para continuar:** `claude --dangerously-skip-permissions`

---

## DÓNDE ESTAMOS

✅ **PANEL DE CONTROL DESPLEGADO (v1)**
- Astro + Tailwind + TypeScript en `panel/`
- 7 páginas visibles · 37 páginas estáticas generadas
- Frontmatter en los ~55 markdown del repo · validación Zod en build
- Cross-references automáticas agentes ↔ sectores ↔ workflows
- Deploy en Vercel · URL: https://zenkai-panel-<hash>.vercel.app
- Vercel Authentication activado · solo miembros del equipo

⏸️ **PRÓXIMO PASO: Fase 1 de conexión de APIs (Anthropic Claude API)** — pausada antes del pivote al panel.

---

## TAREAS EN PROGRESO

| # | Tarea | Estado |
|---|-------|--------|
| 11 | Fase 1 · Anthropic Claude API | pending — empezar aquí |
| 12 | Fase 2 · Airtable + 6 bases | pending |
| 13 | Fase 3 · Make + connections | pending |
| 14 | Fase 4 · WhatsApp Cloud API + BSP | pending |
| 15 | Fase 5 · Cal.com + Stripe/Wompi | pending |
| 16 | Fase 6 · Docuseal + Notion + Drive | pending |
| 17 | Fase 7 · Monitoreo (Sentry + BetterStack) | pending |

---

## QUÉ HACER EN LA NUEVA SESIÓN

Continuar con la Fase 1 (Anthropic API) según la guía original. El panel ya muestra el estado de cada conexión · al activar una API hay que actualizar el frontmatter de la conexión correspondiente:

```yaml
# conexiones/conexiones-airtable.md
estado_conexion: activo  # antes era "pendiente"
```

Esto actualiza automáticamente la página `/conexiones` y los KPIs del Home.

---

## NO REHACER

❌ Panel de control · ya desplegado en Vercel.
❌ Frontmatter de los markdown · ya añadido y validado.
❌ Schemas Zod · ya definidos en `panel/src/content.config.ts`.
```

- [ ] **Step 2:** Commit final

```powershell
git add ESTADO-ACTUAL.md
git commit -m "docs: actualizar ESTADO-ACTUAL post-deploy del panel v1"
git push
```

---

# Verificación final · v1 cerrado

- [ ] Todas las páginas cargan en producción (Vercel URL)
- [ ] Login de Vercel Authentication funciona
- [ ] Editar un `.md` (ej: cambiar `prioridad: alta` en un sector) + push → panel actualizado en <1 min
- [ ] Mobile · tablet · desktop probados sin issues
- [ ] El criterio de éxito #5 del spec se cumple: "Jordy puede abrir el panel desde su celular en una reunión"

---

# Spec coverage check (self-review)

| Sección del spec | Tarea(s) que la implementa |
|------------------|------------------------------|
| §4.1 Estructura de carpetas | Task 0.4 + creación incremental por fase |
| §4.2 Astro lee markdowns sin moverlos | Task 1.1 (loader `glob`) |
| §4.3 Build pipeline | Task 0.4, 0.5 + cada fase termina con `npm run build` |
| §4.4 Stack técnico exacto | Task 0.4 (`package.json`) |
| §5 Schemas (8 colecciones) | Task 1.1 (agentes), 1.3 (sectores), 1.4 (workflows), 1.5 (resto) |
| §5.9 Validación cruzada | Task 1.6 (`validateCrossRefs`) |
| §6.1 Top navigation | Task 2.2 |
| §6.2 Cada página | Task 3.1-3.6 (listados) + 4.1-4.3 (detalles) + 5.1 (home) |
| §7.1 Tipografía | Task 0.5 (fonts + Tailwind config) |
| §7.2 Paleta | Task 0.5 (CSS variables) |
| §7.3 Espaciado/radios/sombras | Task 0.5 (Tailwind config) |
| §7.4 Componentes | Task 2.2-2.3, 3.1-3.4 |
| §7.5 Responsive | Task 6.1 (QA) + estilos responsive en cada componente |
| §8 Pipeline dev/build | Task 0.4-0.5 |
| §8.4 Deploy Vercel | Task 6.2 |
| §8.5 Vercel Authentication | Task 6.2 step 4 |
| §9 Manejo de errores | Schemas Zod en Task 1.1-1.5 + validación cruzada Task 1.6 + 404 Task 5.2 |
| §11 Out of scope | (no se implementa por definición) |
| §12 Criterios de éxito | Verificación final · §13 mitigaciones aplicadas |

**Sin gaps detectados.** Todos los requisitos del spec tienen una tarea correspondiente.

---

**Fin del plan · v1 · listo para ejecución**
