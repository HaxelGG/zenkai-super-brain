---
name: "Stack Eco"
slug: stack-eco
tipo: stack
tier: eco
costo_mensual_usd: 0
---

# STACK ECO · ZENKAI
## Costos reales · herramientas free y básicas · capacidad 3-5 clientes simultáneos máx

**Cuándo usar:** clientes con presupuesto limitado · validación de servicio · proyectos N1.
**Modelo prohibido:** Claude Opus 4.6 / 4.7 (costo no se justifica).
**Modelos permitidos:** Claude Sonnet 4.6, Claude Haiku 4.5 (volumen), Gemini free.

---

## STACK CANÓNICO POR DEPARTAMENTO

| Categoría | Herramienta | Plan | Costo USD/mes | Limitación |
|-----------|-------------|------|---------------|------------|
| **Automatización** | Make | Free | $0 | 1,000 ops/mes (advertir 800) |
| **Database** | Airtable | Free | $0 | 1,000 registros por base, 5 editors |
| **CRM** | Airtable o Google Sheets | Free | $0 | manual workflows |
| **WhatsApp** | Business App | Manual | $0 | sin API · sin chatbot · uno-a-uno |
| **Email** | Klaviyo | Free | $0 | 250 contactos · branding visible |
| Email alt. | Mailerlite | Free | $0 | 1,000 contactos · 12k emails/mes |
| **Calendar** | Cal.com | Free | $0 | sin custom branding · 1 calendario |
| **Web/Landing** | Framer | Free | $0 | dominio framer.website · branding |
| Web alt. | HTML/CSS/JS + Netlify | Free | $0 | requiere dev (FORGE) · sin CMS |
| **Diseño** | Figma | Free | $0 | 3 archivos máx |
| Diseño alt. | Canva | Free | $0 | sin brand kit · marcas de agua |
| **Tienda** | Shopify | Basic | $39 | sí, en Eco — no hay free real |
| **Análisis** | Google Analytics 4 | Free | $0 | suficiente para empezar |
| Pixel | Meta Pixel | Free | $0 | suficiente · sin atribución avanzada |
| **Firma electrónica** | Docuseal | Free | $0 | self-host requerido o plan free limitado |
| **Pagos** | Wompi (CO) / Stripe | Pay-as-you-go | 0 fijo | comisión por transacción |
| **Reseñas** | Google My Business | Free | $0 | suficiente para mayoría |
| **PM tool** | Notion | Free | $0 | unlimited blocks personal |
| **Documentación** | Google Drive | Free | $0 | 15GB |
| **LLM API** | Anthropic Claude (Sonnet 4.6) | Pay-as-you-go | ~$10-50 | según volumen |
| **LLM gratis** | Gemini 2.0 Flash | Free | $0 | rate limits razonables |

**Costo herramientas (sin LLM):** **$39 USD/mes** (solo Shopify si aplica)
**Con LLM Sonnet (uso ligero):** **+$10-30/mes**
**Costo total típico Eco:** **$40-80 USD/mes** sin contar ads del cliente

---

## CAPACIDADES Y LIMITACIONES

### Capacidades reales del Stack Eco
✅ Landing page funcional con captura de leads
✅ Lead llega a Airtable / Google Sheets
✅ Email automatizado de bienvenida (Klaviyo free 250 contactos)
✅ Recordatorios de cita (Cal.com → email)
✅ Anuncios Meta funcionando con pixel
✅ Atención WhatsApp manual con plantillas
✅ Reportes básicos en Google Sheets
✅ Una identidad visual coherente

### Limitaciones que SIEMPRE se comunican al cliente
⚠️ **Sin WhatsApp instantáneo automatizado** — todo manual
⚠️ **Sin chatbot de soporte** — ECHO-BOT requiere Cloud API (Pro)
⚠️ **Sin recordatorios automáticos por WA** — solo email
⚠️ **Sin atribución multi-touch** — solo modelos last-click básicos
⚠️ **Sin BI / dashboards complejos** — solo Sheets
⚠️ **Sin testing A/B avanzado** — A/B manual sí, optimización auto no
⚠️ **Capacidad de delivery ZENKAI:** 3-5 clientes Eco simultáneos máximo (más es ZENKAI saturada)
⚠️ **Make 1k ops/mes:** se acaba rápido si hay >50 leads/mes con flow complejo

---

## PRECIOS TÍPICOS DE PROYECTO ECO

### Precio mínimo según fórmula

```
Costo operativo Eco mínimo: $40 USD/mes
Costo trimestral: $120 USD
Precio mínimo (×2): $240 USD
```

Este es el **piso teórico**. En práctica, agregar:
- Componente humano (typically 10-30h × $20-40/h)
- Buffer para complejidad

**Rango de precios reales Eco:**
- Setup: $400-1,200 USD
- Retainer mensual: $80-250 USD/mes (si aplica)

### Casos típicos

| Proyecto | Setup USD | Retainer USD/mes |
|----------|-----------|------------------|
| Landing + WA Business + email Klaviyo free | $400-700 | opcional $80-150 |
| Restaurante: IG manual + WA + landing | $500-800 | $100-180 |
| Clínica con 1 odontólogo: Cal.com + WA | $600-900 | $120-200 |
| Tienda Shopify Basic + Klaviyo + Meta | $700-1,200 | $150-250 |
| Coach con 1 curso Hotmart: landing + email | $450-750 | $100-180 |

---

## CUÁNDO ESCALAR DE ECO A PRO

Señales claras de que el cliente debe migrar a Pro:

1. **Volumen excede límites:**
   - Make >800 ops/mes (advertir, planear migración)
   - Klaviyo >250 contactos (forzoso migrar)
   - Airtable >1,000 registros (necesita Plus o Team)

2. **Necesidad funcional:**
   - Cliente pide chatbot WhatsApp → necesita Cloud API
   - Cliente pide recordatorios automáticos por WA → ídem
   - Cliente quiere A/B test de landing → necesita Framer paid

3. **Capacidad de delivery:**
   - Cliente está creciendo y atiende >50 leads/mes manual → no escala

**ZEUS-DECIDE evalúa la migración. ORACLE recalcula precio Pro. HERMES vende el upgrade.**

---

## ANTI-PATRONES (NUNCA hacer en Eco)

❌ Prometer SLA de respuesta WhatsApp <2 min sin Cloud API (mentira)
❌ Vender "automatización completa" si Make va a quedarse en free 1k ops
❌ Construir flow con >300 ops/mes esperadas en Make free (se va a quemar)
❌ Sin pixel + GA4 — incluso Eco lleva analytics básico
❌ Dejar al cliente sin ninguna herramienta para ver leads (siempre Airtable o Sheets compartido)
❌ Cobrar tarifa Pro o Premium · si vendes Pro entrega Pro
