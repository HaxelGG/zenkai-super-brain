---
name: "Crear Landing Page"
slug: workflow-crear-landing
tiempo_objetivo: "2-5 días"
agentes_principales: [APOLLO, MUSE, FORGE, NEXUS]
categoria: delivery
---

# WORKFLOW · Crear Landing Page
## De brief a landing publicada con integraciones activas

**Tiempo objetivo:** 2-7 días según tier
**Agentes principales:** APOLLO → NEXUS → ATLAS

---

## DIAGRAMA DE FLUJO

```
[Brief recibido]
    ↓
APOLLO-LANDING (skill-crear-landing FASE 1: 5 preguntas)
    ↓
APOLLO + frontend-design skill → estructura + copy + visual
    ↓
Implementación (HTML · Framer · custom)
    ↓
NEXUS-API (integraciones: pixel · CAPI · Airtable · WhatsApp)
    ↓
ATLAS-QA (checklist universal + específico)
    ↓
    ├─ NO pasa QA → devolver a APOLLO/NEXUS
    └─ PASA QA → publicar
    ↓
DNS · SSL · dominio configurado
    ↓
Loom de capacitación al cliente
    ↓
[Landing en producción · primer reporte D+7]
```

---

## PASOS DETALLADOS

### PASO 1 · Brief
**Owner:** APOLLO
**Skill:** `skill-crear-landing` FASE 1
**Tiempo:** <30 min

5 preguntas:
1. Servicio/producto principal
2. Cliente ideal
3. Dolor principal
4. CTA primario
5. Referencias visuales

### PASO 2 · Estructura y copy
**Owner:** APOLLO-LANDING
**Tiempo:** 1-2 días

- 9 secciones según skill
- Copy completo (no lorem ipsum) por sección
- Framework DOLOR → AGITACIÓN → SOLUCIÓN → PRUEBA → CTA
- WhatsApp como CTA primario (mercado hispanohablante)

### PASO 3 · Diseño visual
**Owner:** APOLLO + skill `frontend-design`
**Tiempo:** 1-2 días

- Mockup en Figma (Eco/Pro) o directo en Framer
- Paleta · tipografía · espaciados consistentes
- Mobile-first
- Validar contraste WCAG AA mínimo

### PASO 4 · Implementación

**Tier ECO (HTML/CSS/JS):**
- 2-4 días
- FORGE-FRONTEND si requiere componentes interactivos
- Hosting Netlify free

**Tier PRO (Framer):**
- 3-5 días
- APOLLO-LANDING construye en Framer
- Dominio propio configurado

**Tier PREMIUM (custom):**
- 1-3 semanas
- FORGE-FRONTEND construye con Next.js o stack custom
- Hosting Vercel · AWS según tier

### PASO 5 · Integraciones técnicas
**Owner:** NEXUS-API + NEXUS-MAKE
**Tiempo:** 1-2 días en paralelo con implementación

Configurar:
- ✅ Pixel de Meta + CAPI con eventos (PageView, Lead, Purchase)
- ✅ Google Analytics 4 (GTM si Premium)
- ✅ Webhook al formulario → Make → Airtable `leads`
- ✅ WhatsApp Cloud API (respuesta automática <30s)
- ✅ Email automático al cliente (vía Resend/SendGrid)
- ✅ Email interno al equipo del cliente con datos del lead
- ✅ UTMs estructurados

### PASO 6 · QA
**Owner:** ATLAS-QA
**Tiempo:** 4-8 horas

Checklist universal:
- ✅ Mobile (iPhone + Android, Chrome + Safari)
- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ Tiempos de carga: LCP <2.5s · CLS <0.1
- ✅ Imágenes optimizadas (WebP, <300KB)
- ✅ Sin errores en consola
- ✅ Sin typos (especial atención: ñ, tildes)
- ✅ Contraste WCAG AA · AAA en CTA
- ✅ Botones >44×44px en mobile
- ✅ Formulario testeado con datos reales
- ✅ Pixel verificado en Meta Events Manager
- ✅ CAPI funcionando
- ✅ Mensaje WhatsApp llega en <30s
- ✅ Lead aparece en Airtable
- ✅ Política de privacidad publicada y enlazada
- ✅ Robots.txt + sitemap.xml
- ✅ Open Graph + Twitter Card

Si NO pasa: devolver a APOLLO/NEXUS con lista de fixes.

### PASO 7 · Publicación
**Owner:** FORGE-INFRA (si custom) · APOLLO-LANDING (si Framer)
**Tiempo:** <2h

- DNS apuntando al hosting
- SSL activo (Let's Encrypt o equivalente)
- Dominio principal redirige a www (o viceversa según preferencia)
- Smoke test final en URL real

### PASO 8 · Capacitación al cliente
**Owner:** ATLAS
**Tiempo:** <1h

- Loom de 5-10 min explicando:
  - Cómo ver leads en Airtable
  - Cómo recibir mensajes en WhatsApp del lead
  - Cómo editar la landing (si Framer / Eco con admin)
  - Cómo ver reportes
- Acceso a Notion del cliente con manual escrito
- Calendario de soporte (primer mes ilimitado · luego según tier)

### PASO 9 · Primer reporte D+7
**Owner:** ARES-REPORT
**Tiempo:** automático

Reporte incluye:
- Visitas totales
- Tasa de conversión
- Leads generados (cualificados / no cualificados)
- Performance del pixel + CAPI
- Recomendación para semana 2

---

## KPIs DEL WORKFLOW

| KPI | Objetivo |
|-----|----------|
| Tiempo brief → publicación | <7 días Pro · <14 días Premium |
| QA pass rate primera ronda | >80% |
| Conversión visita → lead | >2% (sector dependiente) |
| Latencia WhatsApp post-formulario | <30s |
| Pixel + CAPI sin errores | 100% |
| Mobile lighthouse score | >90 |

---

## AUTOMATIZACIONES (Make)

```
1. Webhook formulario landing → Airtable `leads` (con score inicial)
2. Trigger Airtable `leads` (nuevo) → WhatsApp Cloud API mensaje
3. Trigger Airtable `leads` (nuevo) → email interno al cliente final
4. Trigger Airtable `leads` (nuevo) → email al lead con confirmación
5. Cron diario → reporte de leads del día anterior a Notion
```

---

## ALERTAS

- Pixel de Meta sin eventos en 24h post-publicación → NEXUS revisa
- Formulario sin envíos en 7 días con tráfico >100 visitas → ATLAS escala (problema de conversión)
- WhatsApp no responde → NEXUS revisa flow Make
