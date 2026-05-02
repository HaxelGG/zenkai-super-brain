---
name: "Stack Premium"
slug: stack-premium
tipo: stack
tier: premium
costo_mensual_usd: 1200
---

# STACK PREMIUM · ZENKAI
## Infraestructura enterprise · sin límite de stack · Opus orquesta

**Cuándo usar:** empresas grandes · multi-departamento · sectores regulados · revenue >$50K USD/mes.
**Modelos:** Opus 4.7 orquesta · Sonnet 4.6 ejecuta · Haiku 4.5 volumen · Gemini Ultra multimodal.
**Capacidad ZENKAI:** 1-3 clientes Premium simultáneos máx (consume capacity 3-5× más que Pro).

---

## REGLA DE MODELOS EN PREMIUM

```
Opus 4.7    → orquestador (ZEUS · arquitectura · decisiones)
Sonnet 4.6  → subagentes de ejecución (todos los demás)
Haiku 4.5   → subagentes de volumen (>500 ops/día · clasificación)
Gemini Ultra → multimodal complejo (PDFs largos · imágenes · video)
```

**Premium NO significa "todo con Opus".** Significa "el modelo correcto para cada nivel". Usar Opus para clasificar es desperdicio.

---

## STACK CANÓNICO POR DEPARTAMENTO

### Automatización & Orquestación

| Herramienta | Plan | Costo USD/mes |
|-------------|------|---------------|
| Make | Business | $99 (100k ops) |
| n8n self-hosted (alt.) | Hosting + mantenimiento | $50-200 |
| Anthropic API (Opus + Sonnet + Haiku) | PAYG | $200-2,000 según uso |
| Vector DB (Pinecone / Weaviate) | Standard | $70+ |
| Temporal (workflows complejos) | Cloud | $100+ |

### Database & Data Layer

| Herramienta | Plan | Costo USD/mes |
|-------------|------|---------------|
| Airtable | Business | $45/usuario (250k registros) |
| Postgres (Supabase / Neon / RDS) | Pro/Pay | $25-500 |
| Redis (cache · queue) | $0-100 | |
| Snowflake / BigQuery | PAYG | $200-3,000 |

### CRM & Marketing Automation

| Herramienta | Plan | Costo USD/mes |
|-------------|------|---------------|
| HubSpot | Sales Pro + Marketing Pro | $890+ |
| Salesforce | Sales Cloud Pro | $80/usuario+ |
| Klaviyo | Hasta 50k contactos | $360+ |
| Attentive (SMS) | Enterprise | $500+ |

### WhatsApp & Mensajería

| Herramienta | Costo USD/mes |
|-------------|---------------|
| WhatsApp Cloud API + BSP certificado (360dialog Enterprise) | $200-1,000+ |
| Plataforma de mensajería (Yalo, Zenvia) | $300-2,000 |

### E-commerce

| Herramienta | Plan | Costo USD/mes |
|-------------|------|---------------|
| Shopify Plus | Enterprise | $2,000+ |
| Headless commerce (Medusa, Saleor) | self-host | $200-1,000 |
| Salesforce Commerce | Enterprise | $5,000+ |

### Atribución & BI

| Herramienta | Plan | Costo USD/mes |
|-------------|------|---------------|
| Triple Whale Pro | $349+ |
| Northbeam | $400+ |
| Hyros | $499+ |
| Looker | Enterprise | $500-3,000 |
| Mode | Pro | $500+ |
| Metabase Cloud | $100+ |

### Customer Data Platform (CDP)

| Herramienta | Plan | Costo USD/mes |
|-------------|------|---------------|
| Segment | Team | $120+ (50k MTUs) |
| RudderStack | Pro | $0-300 (open source alternative) |

### Helpdesk & Soporte

| Herramienta | Plan | Costo USD/mes |
|-------------|------|---------------|
| Intercom | Plus | $39+/seat |
| Zendesk | Suite Professional | $115/seat |
| Gorgias (e-com) | Pro | $300+ |

### Hosting & Infraestructura

| Herramienta | Plan | Costo USD/mes |
|-------------|------|---------------|
| AWS | varía | $200-5,000+ |
| GCP | varía | $200-5,000+ |
| Vercel Enterprise | $20+/seat | + tráfico |
| Cloudflare Workers / Pages | $5-200 | edge compute |

### CI/CD & Monitoreo

| Herramienta | Plan | Costo USD/mes |
|-------------|------|---------------|
| GitHub Enterprise | $21/seat | |
| Sentry | Team / Business | $26-80+ |
| BetterStack (logs + uptime) | $25-150+ | |
| Datadog | varía | $200-2,000+ |

### Diseño & Producción

| Herramienta | Plan | Costo USD/mes |
|-------------|------|---------------|
| Figma | Organization | $45/seat |
| Adobe Creative Cloud | All Apps | $54/seat |
| Storybook | Cloud | $40+ |

### Documentación & Comunicación

| Herramienta | Plan | Costo USD/mes |
|-------------|------|---------------|
| Notion | Enterprise | $20+/usuario (negociable) |
| Slack | Business+ | $12.50/usuario |
| Loom | Business+ | $20/usuario |

### Firma & Legal

| Herramienta | Plan | Costo USD/mes |
|-------------|------|---------------|
| DocuSign | Business Pro | $40/usuario |
| Adobe Sign | Enterprise | varies |
| Cláusulas y compliance custom | + abogado externo | varía |

### Pagos

| Herramienta | Plan | Costo USD/mes |
|-------------|------|---------------|
| Stripe | + Stripe Connect, Tax, Billing | varía + comisiones |
| Banco corresponsal | varía |

---

## EJEMPLO DE STACK PREMIUM TÍPICO POR SECTOR

### E-commerce Premium ($100K+ USD/mes revenue cliente)
```
Make Business:           $99
Airtable Business:       $45
Shopify Plus:            $2,000
Apps Shopify:            $200
Triple Whale Pro:        $349
Klaviyo (10k contactos): $260
Segment:                 $120
WhatsApp Cloud + BSP:    $300
Sonnet + Opus + Haiku:   $500
Atribución (Hyros):      $499
Helpdesk Gorgias:        $300
Otros (Sentry, etc.):    $150
TOTAL:                   ~$4,822 USD/mes
```

Precio proyecto: $4,822 × 6 = **$28,932 USD setup** (LATAM) — × 3-5 si USA = **$86K-145K USD setup**.
Retainer: $4,822 × 1.7 ≈ **$8,200/mes** (LATAM).

### Empresa Manufactura Premium
```
n8n self-host:           $200
Postgres + Redis:        $300
Airtable Business:       $45
HubSpot Pro:             $1,200
ERP integration build:   custom
LinkedIn Sales Nav Team: $300
Power BI Pro:            $200
Sonnet + Opus:           $400
Otros:                   $300
TOTAL:                   ~$2,945/mes (sin contar el ERP custom)
```

### Clínica/Cadena Médica Premium (HIPAA si USA)
```
HC integration custom:   $1,500-5,000 dependiendo del HC
WhatsApp Cloud + BSP:    $300
Cal.com Enterprise:      $200
Compliance audit:        $500/mes amortizado
Sonnet + Opus + Haiku:   $500
Telemedicina platform:   $300
BI custom:               $200
TOTAL:                   ~$3,500-7,000/mes
```

---

## RANGOS DE PRECIO PREMIUM

| Tipo de proyecto Premium | Setup USD | Retainer USD/mes |
|--------------------------|-----------|------------------|
| Premium N3 (multi-dept) | $20K-60K | $5K-12K |
| Premium N4 (empresa completa) | $60K-200K+ | $12K-40K+ |

**Ajuste por mercado:**
- LATAM: rangos arriba
- España: × 1.5-2.0
- USA: × 2-3

---

## REQUISITOS NO NEGOCIABLES EN PREMIUM

1. **SLA contractual:** uptime >99.5% · respuesta crítica <2h
2. **Postmortems** después de cada incidente
3. **Auditoría de seguridad** anual (LEX + FORGE)
4. **Backups geo-redundantes**
5. **DR plan** documentado y testeado trimestralmente
6. **Onboarding del staff del cliente** (capacitación formal · no solo Loom)
7. **Account manager dedicado** del lado ZENKAI
8. **Escalada formal** a ZEUS para cualquier cambio mayor
9. **Reportes ejecutivos mensuales** + reuniones trimestrales con C-level del cliente

---

## RIESGOS DE PREMIUM (que ZENKAI debe gestionar)

⚠️ **Concentración:** un solo cliente >30% del revenue → alto riesgo
⚠️ **Cycle time:** Premium ciclo venta 2-6 meses · Eco/Pro <30 días
⚠️ **Capacidad humana:** Premium consume 3-5× más capacity que Pro
⚠️ **Stakeholder management:** múltiples stakeholders del cliente complican
⚠️ **Compliance:** un sector regulado mal manejado puede ser caro

---

## ANTI-PATRONES PREMIUM

❌ Vender Premium a empresa que cabe en Pro (sobre-stacking)
❌ Premium sin contrato claro de IP (problema futuro)
❌ Premium sin postmortem cultura (incidentes no aprendidos)
❌ Premium con un solo punto de contacto técnico ZENKAI (bus factor)
❌ Sobre-promesa en SLA (mejor 99.5% real que 99.99% imposible)
