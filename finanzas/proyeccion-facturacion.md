---
name: "Proyección de Facturación 2026"
slug: proyeccion-facturacion
tipo: proyeccion
---

# PROYECCIÓN DE FACTURACIÓN · ZENKAI
## Modelo hacia $100,000 USD facturados antes de diciembre 2026

**Owner:** ORACLE-FORECAST + ZEUS
**Cadencia de revisión:** semanal (run rate) · mensual (escenarios) · trimestral (modelo completo)
**Fecha de baseline:** 2026-05-01
**Meses restantes para meta:** 8 meses (mayo a diciembre 2026)

---

## OBJETIVO 2026

```
Meta: $100,000 USD facturados acumulados antes de 2026-12-31
Meses restantes: 8 (mayo · junio · julio · agosto · septiembre · octubre · noviembre · diciembre)
Run rate necesario: $12,500 USD/mes promedio
```

**Distribución estacional realista** (no es lineal):
- Q2 (mayo-junio): rampa · esperar $8K-10K/mes
- Q3 (julio-septiembre): pleno · esperar $12K-15K/mes
- Q4 (octubre-diciembre): cierre · esperar $14K-18K/mes (decisiones de fin de año + bonos)

---

## ESCENARIOS

### ESCENARIO BASE (lo que esperamos si ejecutamos)

| Mes | Setup fees | Retainers | Servicios puntuales | Total |
|-----|-----------|-----------|---------------------|-------|
| Mayo 2026 | $5,000 | $1,500 | $1,500 | $8,000 |
| Junio | $7,000 | $2,500 | $1,000 | $10,500 |
| Julio | $8,000 | $3,500 | $1,500 | $13,000 |
| Agosto | $7,500 | $4,500 | $2,000 | $14,000 |
| Septiembre | $7,000 | $5,500 | $1,500 | $14,000 |
| Octubre | $8,000 | $6,500 | $2,000 | $16,500 |
| Noviembre | $7,000 | $7,500 | $1,500 | $16,000 |
| Diciembre | $4,000 | $8,000 | $1,500 | $13,500 (mes corto) |
| **TOTAL** | **$53,500** | **$39,500** | **$12,500** | **$105,500** |

✅ Cumple meta $100K con buffer de $5,500.

### ESCENARIO OPTIMISTA (+30%)

```
TOTAL Mayo-Diciembre: ~$137K
Implica: 12-15 clientes Pro/Premium nuevos en el periodo
Implica: pipeline a 3 meses de >$30K cualificado
```

Variables que activan optimista:
- Caso de éxito viral en LinkedIn que genera leads inbound
- Fundadores ZENKAI publicando contenido orgánico que convierte
- Referidos en cadena (1 cliente trae 2-3 más)
- Expansion en clientes existentes (upsell + cross-sell)

### ESCENARIO CONSERVADOR (-30%)

```
TOTAL Mayo-Diciembre: ~$74K
NO cumple meta · falta $26K
```

Variables que activan conservador:
- Pipeline débil en mayo-junio
- Capacidad humana saturada antes de tiempo
- Crisis de algún cliente que consume tiempo
- Cambios de mercado (CPM Meta sube · regulación nueva)

**Plan de contingencia si conservador en julio:**
1. ZEUS-DECIDE protocolo de aceleración
2. Pivot a sectores de ciclo corto (e-com Eco/Pro vs B2B largo)
3. Contratar primer freelancer comercial part-time
4. Aumentar inversión propia en captación

---

## DESCOMPOSICIÓN DEL OBJETIVO

### Por mix de revenue

```
Setup fees:      ~$53K (50%) — entrada cliente nuevo
Retainers:       ~$40K (38%) — recurrente compounding
Servicios extra: ~$12K (12%) — upsells y proyectos puntuales
```

### Por ticket promedio

| Tier | Ticket promedio (setup + 6 meses retainer) | Clientes a cerrar |
|------|--------------------------------------------|-------------------|
| Eco | $1,200 setup + $150×6 = $2,100 | 12-15 clientes Eco |
| Pro | $4,000 setup + $500×6 = $7,000 | 8-10 clientes Pro |
| Premium | $25,000 setup + $5,000×6 = $55,000 | 1-2 clientes Premium |

**Mix óptimo (escenario base):**
- 10 clientes Eco × $2,100 = $21,000
- 8 clientes Pro × $7,000 = $56,000
- 1 cliente Premium × $55,000 = $55,000 (en LATAM con multiplicador 1.0)
- **Total: $132,000** ✅ supera meta

### Por sector (fase 2026)

| Sector | % del revenue 2026 | Razón |
|--------|--------------------|----|
| E-commerce | 50% | Fase 1 nicho prioritario |
| Salud (clínicas) | 25% | Fase 2 desde mes 4 |
| Servicios profesionales | 15% | Captación oportunista |
| Restaurantes | 5% | Casos pequeños · alto NPS |
| Otros | 5% | Casos especiales |

---

## METRICS DE SEGUIMIENTO SEMANAL

ORACLE-REPORT genera cada lunes:

```
Acumulado YTD: $[X]
Faltante a meta: $[100,000 - X]
Run rate necesario restante: $[(100K - X) / meses_restantes]/mes
Pipeline ponderado: $[Y]
Pipeline cualificado a cierre 30d: $[Z]
Semáforo:
  🟢 YTD ≥ baseline acumulado
  🟡 YTD ±10% del baseline acumulado
  🔴 YTD <90% del baseline acumulado
```

---

## PROTOCOLO DE ACELERACIÓN (si rojo)

Si el run rate cae bajo el necesario por 2 semanas consecutivas, ZEUS activa:

1. **Más leads:** ARES aumenta presupuesto propio en captación
2. **Más conversión:** HERMES revisa pipeline · llamadas a leads tibios
3. **Ticket más alto:** ORACLE recalcula precios · sube si mercado lo permite
4. **Más recurrencia:** convertir setup-only a setup+retainer en propuestas nuevas
5. **Reducir churn:** ECHO hace check-in con clientes activos

Si después de 4 semanas sigue rojo: revisión profunda de modelo de negocio (pivot, nicho, modelo de cobro).

---

## COSTOS Y MARGEN

### Costo de operar ZENKAI 2026

```
Herramientas internas ZENKAI:
- Claude Max plan:           $20-200/mes (varía con uso)
- Notion Team:               $20/mes (2 usuarios)
- Airtable Team:             $40/mes (2 usuarios)
- Make Team:                 $29/mes (todos los proyectos)
- Cal.com Pro:               $24/mes (2 usuarios)
- LinkedIn Sales Nav (1):    $80/mes
- WhatsApp Cloud (interno):  $30/mes
- Adobe / Canva Pro:         $40/mes
- Hosting (Netlify, Vercel): $20/mes
- GitHub Team:               $0-12/mes
- Otros (Loom, Slack):       $50/mes
TOTAL HERRAMIENTAS:          ~$370/mes = $4,440/año

Freelancers (estimado):
- 2-4 freelancers part-time: $2,000-5,000/mes según volumen
PROMEDIO ESTIMADO:           $3,000/mes = $36,000/año

Marketing propio:
- Ads ZENKAI:                $500-1,500/mes
- LinkedIn / contenido:      $200/mes
PROMEDIO:                    $1,000/mes = $12,000/año

Operativos varios:           $500/mes = $6,000/año
```

**Total costos ZENKAI 2026 estimado:** ~$58,440 USD

### Margen bruto

```
Revenue 2026 (escenario base): $105,500
Costos directos atribuibles:    ~$60,000
Margen bruto:                   ~$45,500
Margen %:                       ~43%
```

⚠️ **Atención:** este margen % es bajo de la meta ZENKAI (60%). Razones esperadas en fase de construcción:
- Inversión en construcción de Capa 1 (esta plataforma)
- Captación inicial requiere más inversión ZENKAI
- Curva de aprendizaje y ajuste de procesos

**Plan de margen:** subir a 60% mínimo en 2027 con (a) eficiencia operativa de Capa 1 madura, (b) menos costo por cliente porque procesos están automatizados, (c) tickets más altos por marca consolidada.

---

## INDICADORES CLAVE A 12 MESES

| KPI | Baseline mayo 2026 | Objetivo dic 2026 |
|-----|--------------------|--------------------|
| Revenue YTD | $0 | $100,000+ |
| Clientes activos | 0-2 | 15-20 |
| MRR (recurrente) | $0 | $8,000+ |
| CAC | n/a (medir) | <30% del LTV |
| LTV promedio | n/a | >$5,000 |
| NPS de clientes | n/a | >70 |
| Margen bruto | n/a | 50%+ |
| Reservas pipeline (sig 90 días) | n/a | $30,000+ |

---

## REVISIÓN MENSUAL (primer lunes del mes)

ORACLE-FORECAST + ZEUS revisan:
1. Ejecución del mes anterior vs proyección
2. Ajuste de proyección de mes siguiente
3. Cambios en mix de clientes/sectores
4. Nuevos riesgos identificados
5. Decisiones de inversión propia

Output: documento de proyección actualizado · alertas si necesarias · ajuste de OKRs trimestrales si la realidad lo justifica.
