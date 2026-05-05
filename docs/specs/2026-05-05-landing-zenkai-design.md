# Landing pública ZENKAI · `zenkai.systems`
## Spec de diseño · 2026-05-05

> **Status:** brainstorming cerrado · pendiente review del usuario antes de pasar a writing-plans
> **Owner:** Jordy (founder) · construcción Claude/FORGE
> **Stack decidido:** Astro nativo en `web/` · deploy Vercel · dominio apex `zenkai.systems`
> **Plazo objetivo:** 4-5 días para MVP · automatización del Lite delivery construida en mes 1

---

## 0 · Contexto y filosofía

ZENKAI es una **agencia universal de digitalización con IA** dirigida a empresas tradicionales que aún no operan en internet (target primario) y a empresas digitales que quieren escalar (target secundario). La web pública es Capa 1 (estructura interna), no Capa 2 (servicio vendible) — es prerrequisito de la operación, no entregable opcional.

Regla rectora del diseño multi-sector (de `ZENKAI_SUPERBRAIN_v2.md` y `CLAUDE.md` §6.10):

> *"El sector define el vocabulario, no la estructura. Los 12 departamentos son universales. Los módulos los adaptan."*

Esta regla gobierna toda la arquitectura: **estructura técnica única para los 5 tiers · módulos específicos por sector**.

---

## 1 · Decisiones cerradas en brainstorming

| # | Decisión | Valor |
|---|---|---|
| 1 | Audiencia | Mixto frío + warm |
| 2 | CTA primario | Formulario → Lead Airtable + (si plan ≥ Starter) `/api/protocolo` automático |
| 3 | CTA escape | WhatsApp directo (FAB flotante en todas las páginas) |
| 4 | Oferta principal | 5 tiers escalables · Lite + Starter destacados · Growth visible · Pro + Enterprise sobrios |
| 5 | Sectores objetivo | 8 sectores priorizados · módulos cambian, estructura no |
| 6 | Stack | Astro nativo en `web/` · monorepo con `panel/` · deploy independiente Vercel |
| 7 | Modelo de negocio (ads) | Modelo C híbrido — cliente paga ads directo a Meta/Google · ZENKAI gestiona como admin |
| 8 | Tarifa interna | $30 USD/día-persona |
| 9 | Voz copy | Fundador-directa · honesta · "primeros cupos abiertos" como prueba social hasta que haya casos cerrados |
| 10 | Recursos disponibles | Sólo logo · resto se redacta/hereda |

---

## 2 · Sectores objetivo (orden de prioridad)

1. **E-commerce** — Shopify, WooCommerce, tiendas físicas con presencia digital incipiente
2. **Servicios profesionales** — abogados, contadores, consultores, agencias chicas
3. **Servicios al hogar** — plomería, limpieza, mudanzas, técnicos
4. **Salud** — clínicas, salones, consultorios, terapia
5. **Restaurantes y delivery**
6. **Inmobiliarias**
7. **Educación online** — cursos, coaching, info-productos
8. **Manufactura B2B** y mayoristas

---

## 3 · Los 5 tiers · catálogo público

### 3.1 LITE · `$300 setup + $90/mes`

**Para quién:** dueño de negocio tradicional que quiere su primera presencia digital sin compromiso de ads. Captura mercado de validación. Tier ancla del funnel de adquisición.

**Incluye:**
- Sitio web 1 página (hero · servicios · contacto · footer) en Astro
- Dominio del cliente conectado (cliente compra el dominio aparte)
- WhatsApp Business app + 5 templates manuales
- Agenda online básica (Cal.com Free)
- Google My Business optimizado
- Capacitación 1h (Loom + sesión en vivo)
- Soporte 15 días

**Tiempo de delivery objetivo:** 5h por cliente (requiere automatización pre-construida — ver §4).

**Costos:** $25 setup ZENKAI · $4/mes recurring · stack del cliente $0-15/mes.

**Margen:** $275 setup (92%) · $86 mensual (95%) · año 1 absoluto $1,257 (91%).

**Variantes por sector (módulos sobre la base universal):**

| Sector | Módulos específicos |
|---|---|
| E-commerce | Catálogo dinámico 3-9 productos · CTA WA con producto preseleccionado · integración Shopify mínima |
| Servicios profesionales | Bio + áreas de práctica · CTA WA con consulta predefinida · agenda visible |
| Servicios al hogar | Zonas de cobertura · WA con tipo de servicio · galería de trabajos |
| Salud | Especialidades + profesionales · agenda visible · WA con motivo de consulta |
| Restaurantes | Menú visible · WA para pedidos · reservas básicas |
| Inmobiliaria | 3-6 propiedades destacadas · filtro zona/precio · WA con propiedad de interés |
| Educación | Cursos disponibles · WA con curso de interés · landing de inscripción |
| Manufactura B2B | Catálogo PDF descargable · WA para cotización · cualificación básica |

---

### 3.2 STARTER · `$2,000 setup + $700/mes`

**Para quién:** dueño de negocio que ya factura $2-8K USD/mes y quiere multiplicar adquisición + automatizar operación. **Plan ancla del modelo de venta.**

**Incluye:** Lite + WA Cloud API (no Business app) + 5 templates dinámicos + recordatorios automáticos SMS+WA + Meta Ads (BM + Pixel + CAPI + 3-5 creatividades) + Google Ads + LSA + CRM Airtable + reporte semanal automatizado + capacitación 2h + soporte 30 días intensivo.

**Tiempo de delivery:** 6 días · 45.5h.

**Costos:** $180 setup ZENKAI · $32/mes recurring · stack del cliente $75-170/mes (no incluye ad spend que paga el cliente directo).

**Margen:** $1,820 setup (91%) · $668 mensual (95%) · año 1 absoluto $9,836 (95%).

**Variantes por sector:**

| Sector | Módulos específicos |
|---|---|
| E-commerce | Recuperación carritos abandonados (Klaviyo flow) · integración Shopify (sync productos/stock) · WhatsApp con catálogo |
| Servicios profesionales | Agendamiento Cal.com sincronizado · plantillas propuesta automáticas · seguimiento post-consulta |
| Servicios al hogar | Cotizador automático por zona/servicio · WhatsApp con disponibilidad en tiempo real · reviews automáticas post-trabajo |
| Salud | Recordatorios cita 24h+1h · reducción no-shows · protocolo derivación urgencia |
| Restaurantes | Reservas online integradas · WhatsApp pedidos · integración con plataformas de delivery |
| Inmobiliaria | Catálogo de propiedades dinámico · lead nurturing por interés · agenda de visitas automatizada |
| Educación | Landing de cursos con checkout · email automation post-compra · agente IA para soporte de alumnos |
| Manufactura B2B | Cotizador con escalas de cantidad · lead form con cualificación técnica · integración con catálogo PDF |

---

### 3.3 GROWTH · `$4,000 setup + $1,200/mes`

**Para quién:** consultorio/salón con varios profesionales o multi-sede; o dueño que quiere *vender mientras duerme* — el agente IA es el wow.

**Incluye:** Starter + agente IA conversacional voz + texto (paisa o neutral, M/H · cliente elige) + entrenamiento del agente + atención multicanal WhatsApp + llamadas + integración con Airtable + escalación automática a humano + 2 voces clonadas + capacitación 2h + revisión de logs primer mes.

**Tiempo de delivery:** 12 días · 95.5h.

**Costos:** $380 setup ZENKAI · $155/mes recurring (incluye $99 ElevenLabs Pro a costo de ZENKAI) · stack del cliente $155-380/mes.

**Margen:** $3,620 setup (91%) · $1,045 mensual (87%) · año 1 absoluto $16,160 (88%).

**Variantes por sector:**

| Sector | Módulos específicos del agente IA |
|---|---|
| E-commerce | Recomienda productos · recovery de carritos por voz · post-venta 24/7 · soporte tracking |
| Servicios profesionales | Cualifica leads · agenda consultas iniciales · recopila docs previos · seguimiento |
| Servicios al hogar | Cotiza al instante (descripción → rango precio) · agenda visita · zona auto |
| Salud | Filtra urgencias · agenda según especialidad · recordatorios · protocolo paciente nuevo |
| Restaurantes | Toma pedidos por voz · sugiere combos · gestiona reservas · upsell |
| Inmobiliaria | Cualifica intención · agenda visitas · envía info detallada |
| Educación | Responde dudas de cursos · tutoría 24/7 alumnos · onboarding · retención |
| Manufactura B2B | Toma especificaciones técnicas · cotiza por escalas · agenda demo |

---

### 3.4 PRO · `$9,500 setup + $3,000/mes` · CTA "agendar conversación estratégica"

**Para quién:** empresa media tradicional con equipo de 5-15 personas que quiere automatizar departamentos enteros (marketing, contenido, ventas, RRHH, contabilidad, estrategia, email, diseño).

**En la landing pública:** presencia sobria sin descripción granular del setup. Brief de oferta + CTA "agendar conversación estratégica". El cierre se hace en call, no en form.

**Incluye:** Growth + automatizaciones de los 8 departamentos universales (ARES marketing · MUSE contenido · HERMES ventas · HIVE RRHH · ORACLE contabilidad · ZEUS estrategia · ARES-EMAIL email · APOLLO diseño) + integración cross-departamental (Airtable hub) + dashboard ejecutivo unificado + documentación operativa + capacitación equipo cliente (4h).

**Tiempo de delivery:** 30 días · 239.5h.

**Costos:** $956 setup ZENKAI · $235/mes recurring · stack del cliente $400-800/mes.

**Margen:** $8,544 setup (90%) · $2,765 mensual (92%) · año 1 absoluto $41,724 (92%).

**Variantes por sector (departamentos prioritarios + módulos):**

| Sector | Departamentos + módulos prioritarios |
|---|---|
| E-commerce | ARES email retention masivo · ORACLE BI atribución multitouch · NEXUS Shopify↔Klaviyo↔Triple Whale |
| Servicios profesionales | HERMES pipeline largo · LEX contratos auto · ORACLE facturación · MUSE thought leadership |
| Servicios al hogar | ATLAS programación equipos · HIVE staff técnico · ORACLE rentabilidad por trabajo · ECHO reseñas |
| Salud | ATLAS staff turnos · HIVE programación · LEX consentimientos · ORACLE rentabilidad por procedimiento |
| Restaurantes | ATLAS turnos cocina · ORACLE COGS · MUSE social diario · ECHO reseñas |
| Inmobiliaria | HERMES nurture largo · LEX contratos auto · APOLLO fotografía/staging · ORACLE comisiones |
| Educación | HIVE staff profesores · ORACLE rentabilidad por curso · MUSE contenido · ECHO comunidad |
| Manufactura B2B | ATLAS producción · ORACLE COGS · LEX contratos B2B · HERMES pipeline largo |

---

### 3.5 ENTERPRISE · `$30,000 setup + $5,500/mes` · CTA "agendar conversación estratégica"

**Para quién:** empresa establecida que quiere salir del SaaS disperso y tener su propia plataforma con su branding, dominio y workflows propietarios.

**En la landing pública:** presencia mínima — un brief de la categoría con la misma CTA "agendar conversación estratégica" del Pro.

**Incluye:** Pro + app web/plataforma custom (Next.js + Supabase + branding cliente + auth + dashboards departamentales + migración de datos + integraciones API custom + 3 meses soporte premium SLA <4h).

**Tiempo de delivery:** 100 días humanos · 796h (distribuidos en 8-16 semanas calendario).

**Costos:** $3,184 setup ZENKAI · $472/mes recurring (incluye Vercel Pro/Supabase Pro/ElevenLabs/Sentry) · stack del cliente $200-700/mes.

**Margen:** $26,816 setup (89%) · $5,028 mensual (91%) · año 1 absoluto $87,152 (91%).

**Variantes por sector (plataforma custom incluye):**

| Sector | Plataforma custom incluye |
|---|---|
| E-commerce | PIM/OMS unificado · checkout custom · headless commerce · analytics in-house |
| Servicios profesionales | Portal cliente con casos · facturación in-house · biblioteca documental |
| Servicios al hogar | App móvil técnicos · dispatch inteligente · cliente portal con tracking |
| Salud | HCE/EHR custom · portal paciente · telemedicina · integración aseguradoras |
| Restaurantes | POS unificado · delivery propio · loyalty · multi-sede dashboard |
| Inmobiliaria | CRM con CMA · portal propietarios · tour virtual · closing platform |
| Educación | LMS custom · community · cohort management · payment con financiamiento |
| Manufactura B2B | ERP ligero · portal distribuidores · cotizador avanzado · EDI con clientes grandes |

---

## 4 · Automatización requerida del setup LITE

A $300 setup, Lite sólo es viable si delivery baja de 17h actuales a 4-6h. **Esto es trabajo previo a empezar a vender Lite en volumen.**

| # | SOP / Template | Tiempo construcción | Reduce delivery |
|---|---|---|---|
| 1 | Plantilla Astro modular reusable (8 variantes por sector con frontmatter) | 16h | −4h por cliente |
| 2 | Onboarding form (Tally/Typeform) que captura nombre · sector · servicios · ubicación · WA · brand colors · 3-5 fotos | 4h | −2h |
| 3 | Prompt Claude con templates por sector que genera copy completo (hero, dolor, solución, FAQ) a partir del form | 8h | −3h |
| 4 | Script de deploy automático (npm template → Vercel deployment con dominio) | 4h | −1h |
| 5 | GMB optimization checklist + script (descripción auto + horarios + categorías) | 3h | −1h |
| 6 | Cal.com + WA Business setup guide (Loom 5min + checklist cliente self-serve) | 2h | −0.5h |
| 7 | Manual de capacitación grabado (Loom 15min · una sola vez · entregable a todo cliente Lite) | 3h | −1h |
| 8 | QA checklist automatizado (script verifica sitemap, robots, OG, performance) | 4h | −0.5h |
| **Total inversión** | | **44h ≈ $165 USD** | **−13h por cliente** |

**ROI:** se paga sola con el primer Lite vendido. Después es margen puro escalable.

**SOP estricto del Lite (5 días):**
- **Día 1 (kickoff)**: discovery 30min + envío form al cliente (cliente lo llena off-line)
- **Día 2 (build)**: Claude genera copy desde form → setup web Astro template + GMB
- **Día 3 (cliente revisa)**: link de preview, asíncrono
- **Día 4 (ajustes + WA + Cal.com)**: ajustes finales + setup tools
- **Día 5 (handoff)**: capacitación 30min + Loom + checklist cerrado

---

## 5 · Arquitectura técnica

### 5.1 Estructura del repo

```
Kenzai Super Brain/
├── panel/                  ← ya existe · sin cambios (operativo interno)
├── web/                    ← NUEVO (landing pública)
│   ├── astro.config.mjs
│   ├── package.json
│   ├── public/
│   │   ├── favicon.svg
│   │   ├── og-image.png
│   │   └── logo.svg        ← cuando el usuario lo pase
│   ├── src/
│   │   ├── components/     ← Hero · Tier · SectorCard · FormularioLead · WhatsAppFloat · etc.
│   │   ├── content/
│   │   │   ├── tiers/      ← MD por tier (lite.md, starter.md, growth.md, pro.md, enterprise.md)
│   │   │   └── sectores/   ← MD por sector (8 archivos con frontmatter)
│   │   ├── content.config.ts (Zod schemas)
│   │   ├── layouts/
│   │   │   └── WebLayout.astro
│   │   ├── pages/
│   │   │   ├── index.astro                  → homepage
│   │   │   ├── sectores/[slug].astro         → 8 páginas dinámicas
│   │   │   ├── planes/index.astro           → comparativa de tiers
│   │   │   ├── 404.astro
│   │   │   ├── gracias.astro                → post-submit del formulario
│   │   │   ├── conversacion.astro           → page Pro/Enterprise (form de calendario)
│   │   │   └── api/
│   │   │       └── lead.ts                   → endpoint POST · crea Lead Airtable + opcional /api/protocolo
│   │   └── styles/
│   │       └── tokens.css                    → design system heredado del panel
│   └── README.md
├── api/                    ← ya existe (clasificar, protocolo) · sin cambios
└── scripts/                ← ya existe · sin cambios
```

### 5.2 Deploy en Vercel — 2 projects independientes

| Project | Root | Domain |
|---|---|---|
| `zenkaibrain` (existente) | `panel/` | `panel.zenkai.systems` (futuro · hoy en `zenkaibrain-...vercel.app`) |
| `zenkai-web` (NUEVO) | `web/` | `zenkai.systems` (apex) |

### 5.3 DNS (Hostinger)

Pendiente cuando esté lista la web:
- `@` (apex) → CNAME a `cname.vercel-dns.com` → web
- `panel` → CNAME a `cname.vercel-dns.com` → panel

Hoy `zenkai.systems` no apunta a nada (confirmado por el usuario).

### 5.4 APIs

- **APIs compartidas en raíz** (`/api/clasificar`, `/api/protocolo`) → sirven ambos sitios
- **`/api/lead.ts` dentro de `web/`** → endpoint específico de la landing pública

---

## 6 · Data flow del formulario de contacto

```
Usuario completa form (campos esenciales abajo)
     ↓
POST /api/lead { nombre, empresa, sector, etapa, plan_interes, presupuesto, whatsapp, mensaje }
     ↓
Validación Zod del payload
     ↓
1. Crear Lead en Airtable base VENTAS · tabla `Leads`
     ↓
2. Si plan_interes IN [Starter, Growth, Pro, Enterprise]:
       → llamar a /api/protocolo con input formateado + persist=true + lead_id
       → propuesta queda en Airtable linkeada al Lead
   Si plan_interes = Lite o "No sé":
       → no llamar a protocolo · solo Lead creado
     ↓
3. Email de confirmación al usuario (Resend) — "Recibimos tu mensaje, te contactamos en 24h"
     ↓
4. Notificación interna (email a Jordy) — "Nuevo lead: [empresa] · [plan_interes] · [presupuesto]"
     ↓
5. Redirect a /gracias con mensaje "Recibimos tu mensaje. En 24h te contactamos por WhatsApp."
```

### 6.1 Campos del formulario

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| nombre | text | sí | Validación: 2-80 chars |
| empresa | text | sí | Validación: 2-100 chars |
| sector | select | sí | 8 opciones + "Otro" (con campo text si "Otro") |
| etapa | select | sí | "Nada digital" · "Empezando" · "Creciendo" · "Establecido" |
| plan_interes | select | sí | "Lite · Starter · Growth · Pro · Enterprise · No sé" |
| presupuesto | select | sí | Rangos: "<$1,000" · "$1,000-3,000" · "$3,000-10,000" · "$10,000-30,000" · ">$30,000" |
| whatsapp | tel | sí | Validación E.164 |
| mensaje | textarea | no | 0-1000 chars |

### 6.2 Error handling

- **400** payload inválido (Zod fail) → mensaje específico en form
- **401** auth (no aplica · endpoint público con rate limiting)
- **429** rate limit · 5 submissions por IP por hora
- **500** Airtable o `/api/protocolo` falla → guardar en cola local + responder OK al usuario · reintentar en background

---

## 7 · Capacidad y proyecciones

### 7.1 Capacidad real con 960h/mes (mix estabilizado mes 6+)

| Plan | Cantidad activa | Setup nuevos/mes | h setup | h recurring | h total/mes |
|---|---|---|---|---|---|
| Lite | 60 | 8 | 40 | 60 | 100 |
| Starter | 8 | 2 | 91 | 64 | 155 |
| Growth | 4 | 1 | 96 | 56 | 152 |
| Pro | 2 | 0-1 c/2 meses | 120 (prom) | 68 | 188 |
| Enterprise | 1 | sobre demanda | 200 (en mes setup) | 68 | 268 |
| Reserva ventas + ZENKAI interno | | | | | 97 |
| **Total** | | | | | **960h** |

**MRR estabilizado: $27,300/mes** = **$327,600 ARR** (3.3× objetivo $100K).

### 7.2 Funnel proyectado capitalización 90 días

| Mes | Lite nuevos | Starter | Growth | Setup ingresos | Retainer ingresos (acum) | Total mes |
|---|---|---|---|---|---|---|
| Mes 1 (build automatización + venta Lite mientras se construye) | 8 | 0 | 0 | $2,400 | $0 | $2,400 |
| Mes 2 | 15 | +1 (upsell) | +1 (case study) | $10,500 | $720 | $11,220 |
| Mes 3 | 20 | +3 (2 upsell + 1 nuevo) | +1 | $16,000 | $3,970 | $19,970 |
| **Acumulado 90 días** | **43 Lites** | **4 Starters** | **2 Growths** | **$28,900** | **$4,690** | **$33,590** |

**Costos directos 90 días:** ~$3,400 (incluye $165 inversión automatización Lite).

**Margen 90 días: $30,190 (90%).**

**MRR mes 4:** $9,070/mes (recurrente, sin contar setups nuevos).

### 7.3 Riesgos del funnel

- **Lead generation activa requerida**: 43 Lites en 90 días requiere ads + contenido + referidos. Sin tráfico de calidad, números aspiracionales.
- **CAC de un Lite debe ser < $50 USD** para mantener margen sano ($300 − $25 costo − $50 CAC = $225).
- **Capacidad equipo de 2 personas + fábrica**: el cálculo asume 960h/mes (incluye agentes Claude + procesos automatizados). Si la realidad es 640h puro humano, los volúmenes se reducen ~33%.

---

## 8 · Wireframe textual de la landing

(Ver wireframe completo en mensaje de respuesta del 2026-05-05 · resumen aquí)

```
HERO       — Lite protagonista · CTA primario form + escape WA
SECCIÓN 1  — LITE detallado ($300/$90 · 7 días · bullets)
SECCIÓN 2  — Upgrade path (Starter + Growth) · cards visibles
SECCIÓN 3  — Pro + Enterprise sobrios · CTA "agendar conversación"
SECCIÓN 4  — 8 sectores · grid 4×2 · links a /sectores/[slug]
SECCIÓN 5  — Proof transparente ("la fábrica armada")
SECCIÓN 6  — CTA final con formulario embebido
FOOTER     — info, legales, redes
FAB        — WhatsApp directo flotante en todas las páginas
```

---

## 9 · Voz y copy

**Voz:** fundador-directa · honesta · sin marketing inflado.

**Headline principal del hero (home):**
> # Tu negocio en internet en 7 días.
> IA, agenda, WhatsApp, ads. Empezás por $300.

**Prueba social honesta** (mientras no haya casos):
> "3 cupos abiertos este mes · primeros 30 negocios con descuento de fundador."

**Sección "la fábrica armada":**
> ✓ /api/protocolo genera tu propuesta automática
> ✓ 12 agentes especializados
> ✓ Panel operativo en zenkaibrain.vercel.app

---

## 10 · Métricas de éxito

- **Conversion rate** form → lead: objetivo > 3% (benchmark e-commerce 2-4%)
- **Tasa cualificación** leads → propuesta auto-generada: > 60%
- **Tiempo de respuesta** lead → primer contacto humano: < 24h
- **CAC por canal**: tracking con UTMs · objetivo CAC promedio < $50 para Lite, < $200 para Starter
- **Performance Core Web Vitals**: LCP < 1.5s · CLS < 0.1 · FID < 100ms (Astro SSG lo hace fácil)
- **SEO local**: aparecer en top 5 Google para "agencia digital Pereira" + "automatización pyme Colombia" en 90 días

---

## 11 · Out of scope (esta spec)

- Construcción de la web (eso va en plan de implementación · Task #12 invoca writing-plans skill)
- Construcción de la automatización del Lite (sub-proyecto separado · spec aparte)
- Integración con WhatsApp Cloud API a nivel productivo (Fase 4 del roadmap general)
- Migración del proyecto Framer existente (queda como mockup interno · revisar cancelar Basic en mes 2)
- Plan de adquisición / ad spend para captar los 43 Lites del funnel (proyecto separado de ARES)

---

## 12 · Pendientes del usuario antes de implementar

1. **Pasar el logo** (PNG/SVG · drag al chat o ruta absoluta)
2. **Confirmar email comercial** (¿`contacto@zenkai.systems`? · requiere config en Hostinger)
3. **Confirmar número WhatsApp** para el FAB y los formularios
4. **Decidir si Framer Basic sigue activo** ($15/mes) o se cancela en mes 2 cuando esté lista la web Astro

---

**Status final:** spec completa · pendiente review del usuario antes de invocar writing-plans para el plan de implementación detallado.
