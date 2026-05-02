---
name: "Crear Landing"
slug: skill-crear-landing
agentes_que_usan: [APOLLO, FORGE]
tipo: flexible
---

# Skill — Crear Landing Page

## Cuándo usar

Para cualquier `[BUILD]` de landing page, sea cliente nuevo o iteración. Si el agente APOLLO-LANDING está activo, este es su protocolo.

**Antes de invocar este skill, invocar `frontend-design`** (skill rigid del plugin oficial). El skill `frontend-design` define los principios de diseño visual. Este skill define el protocolo específico ZENKAI de estructura + copy + integración.

## Cómo usar

### FASE 1 — BRIEF (5 preguntas máximo)

No más, no menos. Si el cliente no responde alguna en 24h, asumir y avanzar (la inacción mata más que una asunción imperfecta).

1. **¿Cuál es el servicio o producto principal?**
2. **¿Quién es el cliente ideal?** (edad, ocupación, situación)
3. **¿Cuál es el dolor principal que resuelve?**
4. **¿Cuál es el CTA primario?** (WhatsApp · formulario · compra · llamada)
5. **¿Tienes referencias visuales?** (opcional)

### FASE 2 — ESTRUCTURA UNIVERSAL (9 secciones, en este orden)

**01 · HERO**
- Promesa principal (1 línea, máx 12 palabras)
- Subheadline (2 líneas explicando cómo)
- CTA primario (botón grande, contraste alto)
- Imagen / video / mockup del producto
- Mobile-first: el CTA debe verse sin scroll

**02 · DOLOR**
- 3 bullets del dolor del cliente ideal
- Frases en primera persona del cliente ("siento que..." "no logro...")
- Visual: ícono o ilustración del dolor

**03 · SOLUCIÓN**
- "Así te ayudamos:" + proceso en 4 pasos
- Cada paso: ícono + título + 1 línea
- Visual progresivo (números 01-04)

**04 · PRUEBA SOCIAL**
- Casos reales (logos de clientes · capturas · testimonios con foto)
- Métricas concretas ("+30 clínicas digitalizadas", "$2M USD facturado para clientes")
- Si nuevo: testimonios de beta-users o aliados

**05 · QUÉ INCLUYE**
- Detalle del servicio o producto
- Lista de checkmarks
- Clarificación de lo que NO incluye (evita disputas)

**06 · PROCESO**
- "Cómo trabajamos:" + 4 pasos visuales
- Día 1 · Semana 1 · Semana 2 · Entrega

**07 · FAQ**
- 6-8 objeciones más comunes del sector (consultar `sectores/<X>.md`)
- Respuestas honestas y directas
- Acordeón expandible (mejor UX en mobile)

**08 · CTA FINAL**
- Llamada a la acción con urgencia real (no falsa)
- Si no hay urgencia real, omitir la urgencia (mejor honestidad)
- CTA + prueba social adicional debajo

**09 · FOOTER**
- Legal mínimo (política de privacidad · términos)
- Links necesarios
- Copyright + año

### FASE 3 — COPY: framework DOLOR → AGITACIÓN → SOLUCIÓN → PRUEBA → CTA

Por sección:

```
HERO       → DOLOR + SOLUCIÓN (promesa)
DOLOR      → DOLOR + AGITACIÓN
SOLUCIÓN   → SOLUCIÓN
PRUEBA     → PRUEBA
INCLUYE    → SOLUCIÓN (detalle)
PROCESO    → SOLUCIÓN (cómo)
FAQ        → AGITACIÓN (objeciones) + SOLUCIÓN
CTA FINAL  → CTA (acción)
```

**Regla del CTA primario en mercado hispanohablante:** SIEMPRE WhatsApp. Convierte 2-3× más que formulario porque (a) la barrera psicológica es baja (es chat) y (b) el lead llega caliente al CRM.

Excepción: e-commerce con ticket bajo (<$30 USD) — ahí el CTA es "Comprar ahora" directo al checkout.

### FASE 4 — IMPLEMENTACIÓN

**Tier ECO:**
- HTML + CSS + JS puro (sin frameworks)
- Hosting Netlify free
- Sin animaciones complejas
- Tiempo: 2-4 días
- Sin A/B test

**Tier PRO:**
- Framer Mini ($15/mes) o Basic ($25/mes)
- Dominio propio
- WhatsApp Cloud API integrado vía Make
- A/B test simple del hero
- Tiempo: 5-7 días

**Tier PREMIUM:**
- Framer Business o desarrollo custom (FORGE-FRONTEND)
- A/B test avanzado · personalización · CRO
- Analytics avanzado (Hotjar · Microsoft Clarity)
- Tiempo: 2-4 semanas

### FASE 5 — INTEGRACIÓN (handoff a NEXUS)

Antes de declarar la landing "lista", verificar:

- ✅ Pixel de Meta + CAPI configurado y eventos disparando
- ✅ Google Analytics 4 instalado
- ✅ Conversión a Airtable vía Make o Webhook
- ✅ Mensaje al cliente vía WhatsApp Cloud API en <30s
- ✅ Email automático al cliente con confirmación
- ✅ Email interno al equipo del cliente con datos del lead
- ✅ Tags y UTMs estructurados

Esta integración la hace NEXUS-API + NEXUS-MAKE basados en la spec que entrega APOLLO.

## Checklist QA antes de publicar

- ✅ Mobile (iPhone + Android · Chrome + Safari)
- ✅ Desktop (Chrome · Firefox · Safari · Edge)
- ✅ Tiempos de carga: LCP <2.5s · CLS <0.1 · FID <100ms
- ✅ Imágenes optimizadas (WebP · <300KB cada una)
- ✅ Sin errores en consola
- ✅ Sin typos en español (especialmente ñ y tildes)
- ✅ Contraste WCAG AA mínimo · AAA para CTA
- ✅ Botones >44×44px en mobile
- ✅ Formulario testeado con datos reales
- ✅ Pixel y CAPI verificados con Meta Events Manager
- ✅ Política de privacidad publicada y enlazada
- ✅ Robots.txt y sitemap.xml
- ✅ Open Graph tags + Twitter Card

## Output esperado

1. Mockup en Figma o HTML en Framer/Netlify
2. Copy completo (sin lorem ipsum) por sección
3. Documento de specs visuales (paleta · fuentes · espaciados)
4. Spec de integración para handoff a NEXUS
5. Checklist QA pasado
6. Capacitación al cliente (Loom de 5 min explicando cómo editar)

## Reglas inquebrantables

- **Nunca** publicar landing sin pixel + CAPI + verificación.
- **Nunca** lorem ipsum o "lorem texto" en producción (delito menor pero pasa).
- **Nunca** usar imágenes stock obvias (degrada credibilidad).
- **Nunca** "perfeccionar" antes de publicar — publica al 80%, itera con data real.
- **Siempre** WhatsApp como CTA primario en mercado hispanohablante.
- **Siempre** mobile-first (no "responsive después").
- **Siempre** documentación en Loom para que el cliente sepa qué tiene.
