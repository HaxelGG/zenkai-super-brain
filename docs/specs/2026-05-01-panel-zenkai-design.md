# Spec de Diseño · Panel de Control ZENKAI · v1

**Fecha:** 2026-05-01
**Autor:** Brainstorming Claude Code (Opus 4.7) · validado con Jordy
**Proyecto:** ZENKAI Growth Systems · Capa 1 · Super Cerebro
**Estado:** Aprobado · listo para `writing-plans`
**Ubicación destino del código:** `Kenzai Super Brain/panel/`

---

## 1 · Resumen ejecutivo

Construir un panel de control interno (web estática) que visualice la **Capa 1** del Super Cerebro de ZENKAI: los 12 agentes Master, los 11 sectores, los 6 workflows, las conexiones de sistema, las finanzas y un dashboard de rendimiento (con placeholders en v1, datos reales en v2 cuando las APIs estén conectadas).

El panel:

- Lee directamente los markdown existentes del repo (vía Astro Content Layer API).
- Obliga a añadir frontmatter YAML estructurado a cada documento (~55 archivos · pasada inicial automatizada).
- Se sirve en localhost durante desarrollo y se despliega como sitio estático en Vercel con acceso protegido.
- Es responsive (móvil + tablet + desktop) desde día uno.
- Estética "ejecutivo limpio" estilo Linear / Vercel / Notion.

**Tiempo estimado a v1 funcional:** 3-4 días de trabajo enfocado.

**Audiencia:** Jordy + socio. Sin capa pública.

**Out of scope explícito de v1** (ver §11): autenticación robusta multi-usuario, datos en vivo de Airtable, dark mode, página de Clientes, página de SOPs como vista propia, generación de propuestas/contratos en línea, comentarios/colaboración.

---

## 2 · Contexto y problema a resolver

ZENKAI Growth Systems tiene la Capa 1 del Super Cerebro construida íntegramente en markdown (~55 archivos en `agentes/`, `sectores/`, `workflows/`, `sops/`, `templates/`, `skills/`, `conexiones/`, `finanzas/`, `clientes/`).

**Problemas concretos del estado actual:**

1. La cantidad de documentación supera lo que cabe en la cabeza del fundador. Para tomar decisiones tácticas (qué sector priorizar, qué precio cobrar, qué agentes activar) hay que abrir y releer múltiples archivos.
2. No existe una vista agregada que cruce información (ej.: "qué agentes lideran el sector E-commerce y qué workflows los involucran").
3. Mostrarle la plataforma a un socio o a un prospect requiere navegar archivos de markdown desde VS Code — fricción alta, presentación pobre.
4. Las APIs externas (Anthropic, Airtable, Make, WhatsApp, etc.) aún no están conectadas (Fases 1-7 pausadas), por lo que un "dashboard de rendimiento operativo" hoy estaría vacío.

**Lo que el panel resuelve:**

- Convertir los 80 markdown en un sistema navegable, filtrable y visual.
- Cruzar entidades automáticamente (agente → sectores donde lidera → workflows que ejecuta).
- Ser presentable desde móvil en una reunión sin abrir el editor de código.
- Dejar el chasis listo para enchufar datos reales en v2 sin reescribir nada.

---

## 3 · Decisiones cerradas durante el brainstorming

| # | Decisión | Valor |
|---|----------|-------|
| 1 | Audiencia v1 | Solo interna · Jordy + socio · sin vitrina pública |
| 2 | Origen de datos v1 | Markdown del repo · sin APIs todavía |
| 3 | Stack | Astro 5 + TypeScript + Tailwind CSS |
| 4 | Páginas v1 | 7 visibles (Home, Agentes, Sectores, Workflows, Conexiones, Finanzas, Rendimiento) |
| 5 | Estética | Ejecutivo limpio · Linear/Vercel/Notion · light mode |
| 6 | Despliegue | Localhost dev + Vercel estático + responsive |
| 7 | Modelo de datos | Frontmatter YAML en cada `.md` (Enfoque 2) |
| 8 | Ubicación | Subcarpeta `panel/` dentro del repo ZENKAI |

---

## 4 · Arquitectura general

### 4.1 Estructura de carpetas

```
Kenzai Super Brain/
├── agentes/                   ← intacto · solo se le añade frontmatter
├── sectores/                  ← intacto · solo se le añade frontmatter
├── workflows/                 ← intacto · solo se le añade frontmatter
├── sops/                      ← intacto · solo se le añade frontmatter
├── conexiones/                ← intacto · solo se le añade frontmatter (excepto credenciales.md)
├── finanzas/                  ← intacto · solo se le añade frontmatter
├── templates/                 ← intacto · solo se le añade frontmatter
├── skills/                    ← intacto · solo se le añade frontmatter
├── clientes/                  ← intacto (sin frontmatter en v1 · vacío)
├── CLAUDE.md                  ← intacto
├── ESTADO-ACTUAL.md           ← intacto
├── docs/
│   └── specs/
│       └── 2026-05-01-panel-zenkai-design.md   ← este documento
└── panel/                     ← 🆕 todo el código del panel
    ├── package.json
    ├── astro.config.mjs
    ├── tsconfig.json
    ├── tailwind.config.mjs
    ├── .gitignore             (node_modules, dist, .vercel)
    ├── README.md
    ├── public/
    │   └── favicon.svg
    └── src/
        ├── content.config.ts        ← define las 8 colecciones
        ├── env.d.ts
        ├── styles/
        │   └── global.css            ← variables CSS · directivas Tailwind
        ├── layouts/
        │   ├── PanelLayout.astro     ← layout base con TopNav y footer
        │   └── DetalleLayout.astro   ← layout para páginas de detalle (sidebar)
        ├── components/
        │   ├── TopNav.astro
        │   ├── Logo.astro
        │   ├── AgenteCard.astro
        │   ├── SectorCard.astro
        │   ├── WorkflowCard.astro
        │   ├── ConexionCard.astro
        │   ├── KPIStat.astro
        │   ├── KPIStrip.astro
        │   ├── Badge.astro
        │   ├── Chip.astro
        │   ├── EmptyState.astro
        │   ├── PageHeader.astro
        │   ├── DiagramaFlujo.astro    ← renderiza bloques ASCII bonitos
        │   └── Markdown.astro
        └── pages/
            ├── index.astro                      ← Home
            ├── 404.astro
            ├── agentes/
            │   ├── index.astro                  ← lista de los 12
            │   └── [slug].astro                 ← detalle
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

### 4.2 Cómo Astro lee los markdown sin moverlos

Astro 5 introdujo la **Content Layer API**, que permite definir colecciones con loaders custom. El loader `glob()` acepta cualquier ruta relativa al `astro.config.mjs`:

```ts
// panel/src/content.config.ts
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const agentes = defineCollection({
  loader: glob({ pattern: "*.md", base: "../agentes" }),
  schema: z.object({
    name: z.string(),
    numero: z.number().int().min(1).max(12),
    departamento: z.string(),
    modelo: z.enum([
      "claude-opus-4-7",
      "claude-sonnet-4-6",
      "claude-haiku-4-5-20251001",
    ]),
    modelo_label: z.string(),
    sectores_lidera: z.array(z.string()).default([]),
    subagentes: z.array(z.string()).default([]),
    skills_default: z.array(z.string()).default([]),
    estado: z.enum(["documentado", "en_revision", "activo"]).default("documentado"),
    color_acento: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  }),
});

export const collections = { agentes /* + las otras 7 */ };
```

### 4.3 Build pipeline

```
markdown editado
    ↓
Astro dev/build detecta cambio
    ↓
Content Layer parsea frontmatter
    ↓
Zod valida → si falla, error visible
    ↓
Componentes .astro renderizan
    ↓
[dev] hot reload en navegador
[build] HTML estático en panel/dist/
```

### 4.4 Stack técnico exacto

- **Astro** 5.x (Content Layer API)
- **TypeScript** estricto (`strict: true` en `tsconfig.json`)
- **Tailwind CSS** 3.x vía `@astrojs/tailwind`
- **Zod** (incluido transitivamente vía Astro) para schemas
- **Inter** + **JetBrains Mono** (vía `@fontsource/inter` y `@fontsource/jetbrains-mono` para self-hosting · cero llamadas a Google Fonts en producción)
- **Node** 20.x o superior (prerequisito local · una sola vez)

Cero dependencias adicionales en v1 (sin React, sin Vue, sin librerías de iconos pesadas — se usan SVG inline cuando hace falta).

---

## 5 · Modelo de datos · 8 colecciones

### 5.1 `agentes` (12 documentos · `../agentes/*.md`)

```yaml
name: ZEUS                            # string · canónico
numero: 12                            # 1-12
departamento: "Estrategia & Decisiones"
modelo: claude-opus-4-7               # enum estricto (3 valores)
modelo_label: "Opus 4.7"              # display name
sectores_lidera: [startups]           # slugs de sectores
subagentes: [ZEUS-OKR, ZEUS-MARKET]   # nombres canónicos
skills_default: [brainstorming]       # slugs de skills
estado: documentado                   # documentado | en_revision | activo
color_acento: "#4f46e5"               # opcional · hex 6 dígitos
```

### 5.2 `sectores` (11 documentos · `../sectores/*.md`)

```yaml
name: "E-commerce"
slug: ecommerce
fase: 1                               # 1 | 2 | "futuro"
prioridad: alta                       # alta | media | baja
agentes_prioritarios: [ARES, HERMES, NEXUS]
mercados_objetivo: [colombia, españa, usa]
```

### 5.3 `workflows` (6 documentos · `../workflows/*.md`)

```yaml
name: "Nuevo Cliente"
slug: workflow-nuevo-cliente
tiempo_objetivo: "7-21 días"
agentes_principales: [ARES, HERMES, ORACLE, LEX, ATLAS]
categoria: ventas                     # ventas | onboarding | delivery | reporting | recuperacion
```

### 5.4 `sops` (5 documentos · `../sops/*.md`)

```yaml
name: "Respuesta a lead"
slug: sop-respuesta-lead
sla: "<10 min"
agentes_responsables: [HERMES]
frecuencia: por_evento                # por_evento | diaria | semanal | mensual
criticidad: alta                      # alta | media | baja
```

### 5.5 `conexiones` (4 documentos · `../conexiones/conexiones-*.md`)

```yaml
name: "Airtable"
slug: airtable
servicios_dependientes: [Make, agentes]
criticidad: alta
estado_conexion: pendiente            # pendiente | en_proceso | activo | bloqueado
fase_conexion: 2                      # 1-7 (la fase del roadmap donde se conecta)
```

> Nota: `credenciales.md` y `mapa-sistema.md` se excluyen del loader. `credenciales.md` contiene metadata sensible. `mapa-sistema.md` es la narrativa general del sistema (se usa como intro de la página `/conexiones`, importada directamente, no como entrada de colección). El pattern `conexiones-*.md` auto-excluye ambos.

### 5.6 `finanzas` (5 documentos · `../finanzas/*.md`)

```yaml
name: "Stack Eco"
slug: stack-eco
tipo: stack                           # calculadora | stack | proyeccion
tier: eco                             # eco | pro | premium · solo si tipo=stack
costo_mensual_usd: 0                  # opcional · informativo
```

### 5.7 `templates` (6 documentos · `../templates/*.md`)

```yaml
name: "Propuesta comercial"
slug: template-propuesta-comercial
categoria: ventas                     # ventas | legal | landing | reporting | brief
agentes_dueños: [HERMES, LEX]
variables_principales: [CLIENTE_NOMBRE, PRECIO_USD, ALCANCE]
```

### 5.8 `skills_zenkai` (6 documentos · `../skills/skill-*.md`)

```yaml
name: "Diagnóstico de empresa"
slug: skill-diagnostico-empresa
agentes_que_usan: [ZEUS, ATLAS, ORACLE]
tipo: flexible                        # rigid | flexible
```

> Nota: `skills/README.md` se excluye del loader (no es un skill, es índice). Se filtra por pattern `skill-*.md`.

### 5.9 Validación cruzada (build-time)

Después de cargar todas las colecciones, un check post-load verifica:

- Cada `agente.sectores_lidera[]` apunta a un slug existente en `sectores`
- Cada `sector.agentes_prioritarios[]` apunta a un nombre existente en `agentes`
- Cada `workflow.agentes_principales[]` apunta a `agentes`
- Cada `sop.agentes_responsables[]` apunta a `agentes`

Si una referencia rota → error de build con mensaje claro: `sectores/ecommerce.md: agente "ARESS" no existe (¿quisiste decir "ARES"?)`.

---

## 6 · Páginas y navegación

### 6.1 Top navigation (sticky)

```
[ZENKAI · Super Cerebro]   Home   Agentes   Sectores   Workflows   Conexiones   Finanzas   Rendimiento
```

- **Mobile (<640px):** colapsa a hamburguesa con menú off-canvas
- **Tablet (640-1024px):** texto reducido a 13px, sin "Super Cerebro" en logo
- **Desktop (>1024px):** layout completo

### 6.2 Detalle de cada página

#### `/` — Home / Dashboard

- **Hero:** título "ZENKAI · Super Cerebro" + subtítulo "Capa 1 · Plataforma interna"
- **KPI strip (4 stats):**
  - Clientes activos: `—` con caption "🔌 conecta Airtable"
  - Facturado 2026: `$0 / $100,000` con barra de progreso
  - Agentes documentados: `12 / 12 ✓`
  - Stack actual: `Eco`
- **Quick-cards (grid 2x2 desktop · 1col mobile):** Agentes · Sectores · Workflows · Finanzas
- **Estado de la plataforma:** lista chequeada de qué está documentado vs. vacío (12 agentes ✓ · 11 sectores ✓ · 6 workflows ✓ · 0 clientes activos ✗)

#### `/agentes` — Lista de los 12

- Filtros (chips): `Todos / Opus / Sonnet / Haiku` · `Todos los departamentos / Marketing / Ventas / ...`
- Grid 3 columnas desktop · 2 tablet · 1 mobile
- Cada card: número, nombre grande, badge de modelo, departamento, primeros 2 sectores que lidera

#### `/agentes/[slug]` — Detalle

Layout con sidebar derecha:

- **Cuerpo (col izquierda):** markdown completo renderizado con prose styles
- **Sidebar (col derecha, sticky):**
  - Modelo (con badge)
  - Departamento
  - Subagentes (lista)
  - Skills default (chips)
  - Sectores donde lidera (links)
  - Workflows donde participa (links · cross-reference automática)
  - Estado

#### `/sectores` — Lista de los 11

- Ordenados por `prioridad: alta → media → baja`, secundario por `fase`
- Cada card: nombre, badge de fase, badge de prioridad, primeros 4 agentes prioritarios

#### `/sectores/[slug]` — Detalle

- KPIs del sector (renderizados desde la tabla del markdown)
- Dolores típicos (lista numerada)
- Agentes prioritarios (chips con links a sus detalles)
- Markdown completo del sector

#### `/workflows` — Lista de los 6

- Cards horizontales, una por fila
- Cada card: nombre, tiempo objetivo, número de pasos, agentes involucrados como chips, badge de categoría

#### `/workflows/[slug]` — Detalle

- **Diagrama de flujo:** se detecta el bloque de código del markdown que contiene flechas (`↓`, `→`, `└─`) y se renderiza como caja con tipografía mono, bordes y resaltado de los nombres de agentes detectados (`ARES`, `HERMES`, etc. → chips con link a su página)
- **Stage-by-stage:** se renderiza el cuerpo completo del markdown con prose styles, manteniendo las secciones H2/H3 como pasos del workflow
- Sidebar derecha: tiempo objetivo · agentes principales (chips con links) · categoría

#### `/conexiones` — Mapa del sistema

- Grid de cards de servicios (Anthropic, Airtable, Make, WhatsApp, Cal.com, Stripe, Wompi, Klaviyo, Docuseal, Notion, Drive, Sentry, BetterStack)
- Cada card: nombre, badge de estado (`pendiente` ámbar / `activo` verde / `bloqueado` rojo), fase del roadmap donde se conecta
- Sección "Mapa visual" al final: SVG simple mostrando las relaciones (Airtable como hub central → Make → resto)

#### `/finanzas` — Stacks + calculadora + proyección

- 3 cards comparativos lado a lado: **Eco** / **Pro** / **Premium** con costo mensual y herramientas
- Sección "Calculadora de precios" (markdown de `calculadora-precios.md`)
- Sección "Proyección 2026 → $100K USD" (markdown + barra de progreso)

#### `/rendimiento` — Dashboard operativo

- Sección **"Capacidad construida"** (datos reales que tenemos):
  - 12/12 agentes documentados
  - 11/11 sectores documentados
  - 6/6 workflows mapeados
  - 5/5 SOPs definidos
  - 0/13 conexiones activas
- Sección **"Métricas operativas"** con `EmptyState` elegante por cada bloque:
  - Clientes activos · Facturación · Conversión · CSAT
  - Cada uno con icono 🔌 y mensaje "Conecta Airtable + WhatsApp para ver datos"
- Sección **"Próximas fases"**: timeline visual de las 7 fases pendientes con su estado

---

## 7 · Sistema visual

### 7.1 Tipografía

- **Sans:** `Inter` (variable, self-hosted)
- **Mono:** `JetBrains Mono` (variable, self-hosted)
- **Sin Google Fonts en producción.** Las fuentes se sirven desde `panel/public/fonts/` empaquetadas por `@fontsource-variable/*`.

**Escala:**

| Token | Tamaño | Uso |
|-------|--------|-----|
| `text-h1` | 32px / 36px tablet+ | títulos de página |
| `text-h2` | 24px | secciones |
| `text-h3` | 18px | subsecciones · titulares de cards |
| `text-body` | 14-15px | cuerpo · estándar |
| `text-small` | 12px | captions · metadata |
| `text-micro` | 11px uppercase | labels |

### 7.2 Paleta (light mode)

```css
:root {
  --bg:           #ffffff;
  --bg-muted:     #fafafa;
  --bg-card:      #ffffff;
  --border:       #ececec;
  --border-hover: #d4d4d4;
  --text:         #0a0a0a;
  --text-muted:   #525252;
  --text-faint:   #a3a3a3;
  --accent:       #4f46e5; /* índigo · acción primaria */
  --accent-soft:  #eef2ff;
  --success:      #10b981;
  --warning:      #f59e0b;
  --danger:       #ef4444;
}
```

### 7.3 Espaciado, radios, sombras

- **Spacing:** múltiplos de 4 (`4 8 12 16 24 32 48 64`)
- **Border radius:** `6` chips · `10` cards · `16` hero · `9999` pills
- **Sombras:** solo `shadow-sm` (cards) y `shadow-md` (hover de cards)
- **Sin gradientes ni glow** (anti-AI-slop)

### 7.4 Componentes (especificados en §4.1)

Cada componente tiene tipos TS estrictos en sus props. Documentación inline mínima en cada archivo.

### 7.5 Responsive

| Breakpoint | Rango | Comportamiento clave |
|------------|-------|----------------------|
| `mobile` | < 640px | Hamburguesa nav · cards full-width · sidebars colapsados |
| `tablet` | 640-1023px | Top nav compacta · grid 2 cols |
| `desktop` | ≥ 1024px | Top nav completa · grid 3 cols · sidebars sticky |

Diseño **mobile-first**: estilos base apuntan a mobile, los breakpoints suman.

---

## 8 · Pipeline · dev · build · deploy

### 8.1 Setup inicial (una vez por máquina)

```powershell
# Verificar Node 20+
node --version

# Si no, instalar desde https://nodejs.org/  · LTS · Windows installer

# Inicializar
cd "C:\Users\jordy\Desktop\Kenzai Super Brain\panel"
npm install
```

### 8.2 Desarrollo

```powershell
npm run dev
# → http://localhost:4321
# Hot reload al editar cualquier .md (en cualquier carpeta del repo) o cualquier .astro
```

### 8.3 Build estático

```powershell
npm run build      # → panel/dist/  · ~37 archivos HTML
npm run preview    # → sirve dist/ localmente para QA
```

### 8.4 Deploy a Vercel

1. Cuenta gratuita en Vercel.com
2. New Project → import del repo de GitHub (cuando exista) · Root directory: `panel/`
3. Vercel detecta Astro automáticamente
4. Cada `git push` → rebuild + redeploy en ~30s
5. URL pública: `zenkai-panel-<hash>.vercel.app` · custom domain en v1.1

### 8.5 Acceso protegido en Vercel · decisión abierta menor

Tres opciones, ordenadas de menos a más esfuerzo:

- **(a) URL secreta** — Vercel genera URLs largas y aleatorias. Suficiente para v1 si el panel no contiene secretos. Cero esfuerzo.
- **(b) Vercel Authentication (Hobby plan · gratis)** — login vía cuenta de Vercel · solo tú y el socio entran. 2 clicks en Settings → Deployment Protection → "Vercel Authentication".
- **(c) Cloudflare Access (gratis · más robusto)** — login con Google/GitHub · listas de email permitidos. Requiere conectar el dominio a Cloudflare.

**Recomendación para v1:** **(b) Vercel Authentication.** Es gratis en Hobby plan, requiere cero infraestructura y es exactamente para este caso (panel interno de pocos usuarios). Si en algún momento se vuelve insuficiente, se migra a (c).

---

## 9 · Manejo de errores · testing

### 9.1 Errores en build

| Tipo | Cómo se manifiesta | Cómo se arregla |
|------|---------------------|-----------------|
| Frontmatter inválido | Error Zod con `file:line` y campo problemático | Editar el `.md` |
| Referencia cruzada rota (ej. `sector → agente` inexistente) | Error de validación cruzada con sugerencia tipo "¿quisiste decir X?" | Corregir el slug |
| TypeScript error en componente | Error con `file:line:col` | Corregir tipo |
| Markdown malformado | Astro renderiza con warning en consola | Revisar sintaxis |

### 9.2 Errores en runtime (browser)

Como el panel es **HTML estático puro**, prácticamente no hay superficie de error en runtime:

- Sin fetching de APIs en v1 → sin errores de red
- Sin auth runtime → sin estados de sesión que fallen
- Solo un servicio dinámico potencial: el menú hamburguesa móvil (vanilla JS · 20 líneas)

**404 personalizado:** `src/pages/404.astro` con diseño consistente y link de vuelta a Home.

### 9.3 Testing v1 (lightweight justificado)

- `npm run build` exitoso = smoke test (si las 37 páginas compilan, renderizan)
- Revisión manual responsive después del primer deploy: viewport desktop · iPad · iPhone (tools del browser)
- **No se incluye Playwright/Vitest en v1.** Justificación: el costo de mantener tests vs. el riesgo de regresión es desfavorable para un sitio de HTML estático con datos del repo. Se reconsidera en v1.1 si se añade interactividad o data en vivo.

---

## 10 · Plan de implementación a alto nivel

> El plan detallado se produce en la siguiente fase con el skill `writing-plans`. Aquí solo el shape:

1. **Fase 0 · Setup (0.5 día)** — instalar Node si falta · scaffold Astro · configurar Tailwind, TypeScript, fonts · git ignore correcto
2. **Fase 1 · Frontmatter pass (1 día)** — Claude ejecuta la pasada de frontmatter automáticamente, lote por lote (12 agentes · 11 sectores · 6 workflows · 5 sops · 4 conexiones · 5 finanzas · 6 templates · 6 skills). Por cada lote: Claude lee el contenido existente, infiere el frontmatter, lo añade al inicio del archivo, presenta los primeros 2-3 ejemplos al usuario para validar el shape, y solo entonces procesa el resto del lote. El usuario no edita archivos a mano · su única tarea es decir "ok" o "ajusta X" entre lotes.
3. **Fase 2 · Sistema visual base (0.5 día)** — `PanelLayout`, `TopNav`, paleta CSS, tipografía, componentes base (`Badge`, `Chip`, `KPIStat`, `EmptyState`)
4. **Fase 3 · Páginas listado (1 día)** — `/agentes`, `/sectores`, `/workflows`, `/conexiones`, `/finanzas`, `/rendimiento`
5. **Fase 4 · Páginas detalle (0.5-1 día)** — `[slug].astro` para agentes, sectores, workflows
6. **Fase 5 · Home (0.5 día)** — KPI strip · quick-cards · estado de plataforma
7. **Fase 6 · Responsive polish + deploy (0.5 día)** — testing manual responsive · primer deploy a Vercel · activar Vercel Authentication

**Total:** 4-5 días con margen · 3 días sin imprevistos.

---

## 11 · Out of scope explícito de v1

Lo siguiente NO se incluye en v1 y queda registrado como v1.1+ o v2:

- ❌ Datos en vivo de Airtable / WhatsApp / Make (requiere Fases 1-7 de APIs)
- ❌ Autenticación robusta multi-usuario con roles (v1 usa Vercel Authentication binaria · adentro o afuera)
- ❌ Dark mode (v1.1 si se pide · light mode primero)
- ❌ Página de Clientes (vacía hoy · se agrega cuando haya clientes)
- ❌ Páginas dedicadas de SOPs / Templates / Skills nativos como vistas top-level (existen como colecciones referenciadas desde otras páginas, pero no tienen entrada propia en TopNav)
- ❌ Edición in-app de markdown (el panel es read-only · se edita en VS Code)
- ❌ Comentarios / colaboración / historial
- ❌ Generación de propuestas o contratos en línea desde templates
- ❌ Búsqueda full-text (v1.1 con Pagefind si hace falta)
- ❌ Internacionalización (v1 solo español)
- ❌ Custom domain (v1 usa el subdominio `*.vercel.app` · custom domain con `panel.zenkai.[dominio]` en v1.1 cuando se defina el dominio)

---

## 12 · Criterios de éxito de v1

El v1 se considera exitoso cuando:

1. ✅ Los 80+ markdown tienen frontmatter válido y pasan el build
2. ✅ Las 7 páginas principales renderizan correctamente en desktop, tablet y mobile
3. ✅ Las 37+ páginas estáticas se generan en `npm run build` sin errores
4. ✅ El panel se despliega en Vercel con Vercel Authentication activado
5. ✅ Jordy puede abrir el panel desde su celular en una reunión y mostrar los 12 agentes, 11 sectores y la calculadora de precios sin abrir VS Code
6. ✅ Editar un `.md` y hacer `git push` resulta en panel actualizado en producción en <1 min
7. ✅ Las referencias cruzadas (agente ↔ sector ↔ workflow) funcionan automáticamente sin mantener listas duplicadas

---

## 13 · Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Astro Content Layer API cambia entre minor versions | Baja | Alto | Pinear versión exacta en `package.json` · upgrade explícito |
| Frontmatter pass se convierte en cuello de botella si los markdowns tienen estructura inconsistente | Media | Medio | Lotes pequeños · validación visible · ajuste de schema sobre la marcha |
| Windows + paths relativos `../` rompen el `glob` loader | Baja | Alto | Probar en Fase 0 con un solo agente antes de seguir · si falla, usar `path.resolve` + `import.meta.dirname` |
| Vercel Authentication no permite suficientes invitados (futuro socios o consultores) | Baja en v1 | Bajo | Migrar a Cloudflare Access (también gratis) si pasa |
| Self-hosting de Inter + JetBrains Mono añade peso al bundle | Baja | Bajo | Usar `@fontsource-variable/*` (variable fonts · ~30KB total) |
| Tiempo real excede 5 días | Media | Medio | Reportar en cada fase del plan · cortar features de §11 antes de extender |

---

## 14 · Decisiones cerradas el 2026-05-01

Las 3 decisiones que quedaban abiertas en la versión inicial del spec fueron confirmadas por el usuario:

1. ✅ **Auth en producción:** **Vercel Authentication** (Hobby plan, gratis). 2 clicks en Settings → Deployment Protection. Solo Jordy y el socio pueden entrar con su login de Vercel.
2. ✅ **Repo:** **Mismo repo de ZENKAI**, subcarpeta `panel/`. Vercel se configura con `Root Directory: panel/` para que solo compile el panel y no toque la documentación del resto del repo.
3. ✅ **Custom domain:** se difiere a v1.1 cuando se defina el dominio ZENKAI. En v1 se usa el subdominio auto-generado por Vercel (`zenkai-panel-<hash>.vercel.app`).

---

## 15 · Anexos

### A. Versiones exactas (a fijar en `package.json`)

```json
{
  "dependencies": {
    "astro": "^5.0.0",
    "@astrojs/tailwind": "^5.1.0",
    "tailwindcss": "^3.4.0",
    "@fontsource-variable/inter": "^5.0.0",
    "@fontsource-variable/jetbrains-mono": "^5.0.0"
  }
}
```

### B. Convenciones de nombres

- Slugs: kebab-case (`workflow-nuevo-cliente`, `stack-eco`)
- Nombres canónicos de agentes: MAYÚSCULAS (`ZEUS`, `ARES`)
- Subagentes: `MAYÚSCULAS-MAYÚSCULAS` (`ZEUS-OKR`)
- Frontmatter: snake_case (`agentes_prioritarios`, `tiempo_objetivo`)
- Componentes Astro: PascalCase con extensión `.astro`

### C. Archivos del repo a NO incluir como contenido

Cada loader de colección excluye lo siguiente vía pattern de negación:

| Colección | Pattern | Excluye |
|-----------|---------|---------|
| `agentes` | `["*.md", "!README.md"]` | README si existe |
| `sectores` | `["*.md", "!README.md"]` | README si existe |
| `workflows` | `["*.md", "!README.md"]` | README si existe |
| `sops` | `["*.md", "!README.md"]` | README si existe |
| `conexiones` | `"conexiones-*.md"` | credenciales.md (sensible) + mapa-sistema.md (intro de página) + README |
| `finanzas` | `["*.md", "!README.md"]` | README si existe |
| `templates` | `["*.md", "!README.md"]` | README si existe |
| `skills_zenkai` | `"skill-*.md"` | README (auto-excluido por prefijo) |

`clientes/` no se carga como colección en v1 (solo contiene `_template-cliente/` que es plantilla, no datos).

---

**Fin del spec · v1**
