---
name: "Reporte Semanal al Cliente"
slug: workflow-reporte-semanal
tiempo_objetivo: "Recurrente · semanal"
agentes_principales: [ORACLE, ATLAS, ECHO]
categoria: reporting
---

# WORKFLOW · Reporte Semanal
## Generación automática de reportes para clientes y para ZENKAI interno

**Cadencia:** lunes 9:00 AM
**Agentes:** ARES-REPORT · ATLAS · ORACLE · MUSE-ANALYTICS

---

## DIAGRAMA DE FLUJO

```
[Cron lunes 7:00 AM]
    ↓
Por cada cliente activo:
    ↓
    Agregar datos de la semana anterior
    │
    ├─ ARES → métricas de ads
    ├─ HERMES → leads y pipeline
    ├─ MUSE → métricas orgánicas
    ├─ ATLAS → estado del proyecto
    └─ ORACLE → costos vs presupuesto
    ↓
    Generar PDF / Notion del cliente
    ↓
    Enviar a cliente vía email + WhatsApp 9:00 AM
    │
    Generar reporte interno ZENKAI:
    │
    ├─ Pipeline total
    ├─ Capacidad
    ├─ Pagos pendientes
    └─ Alertas
    ↓
    Reporte interno en Notion 9:30 AM
```

---

## REPORTE PARA CLIENTE (por proyecto activo)

### Estructura

```markdown
# REPORTE SEMANAL · [CLIENTE]
## Semana [N de M] · [fecha inicio - fecha fin]

## ESTADO GENERAL: 🟢 / 🟡 / 🔴

## 🎯 ENTREGABLES DE LA SEMANA
- ✅ [tarea completada]
- ✅ [tarea completada]
- 🔄 [tarea en progreso al X%]

## 📊 MÉTRICAS

### Marketing y Adquisición
| Métrica | Esta semana | Semana anterior | Cambio |
|---------|-------------|-----------------|--------|
| Inversión ads | $[X] | $[Y] | [%] |
| Leads totales | [N] | [M] | [%] |
| Leads cualificados | [N] | [M] | [%] |
| CAC | $[X] | $[Y] | [%] |
| ROAS | [X] | [Y] | [%] |

### Ventas y CRM
| Métrica | Esta semana |
|---------|-------------|
| Mensajes WhatsApp | [N] |
| Tasa de respuesta (<10 min) | [%] |
| Conversaciones a llamada | [N] |
| Cierres | [N] |
| Revenue | $[X] |

### Orgánico
| Métrica | Esta semana | Cambio |
|---------|-------------|--------|
| Alcance IG | [N] | [%] |
| Engagement IG | [%] | [pp] |
| Top post | "[hook]" |
| Saves | [N] | [%] |

## 📅 PRÓXIMA SEMANA
□ [tarea 1]
□ [tarea 2]
□ [tarea 3]

## 🚨 BLOQUEOS / DECISIONES NECESARIAS
[Ninguno o lista]

## 🎓 INSIGHT DE LA SEMANA
[1-2 párrafos · qué aprendimos · qué replicar · qué cortar]

---
Cualquier duda, escribimos por WhatsApp.
Equipo ZENKAI
```

### Canal de envío
- Email principal: HTML con datos + PDF adjunto
- WhatsApp: link al reporte (Notion público o link a PDF)
- Notion del cliente: actualización con sección expandida

---

## REPORTE INTERNO ZENKAI (resumen para Perfil 1 + Perfil 2)

### Estructura

```markdown
# REPORTE INTERNO ZENKAI · Semana [N]

## 📊 PIPELINE
- Leads nuevos esta semana: [N]
- En pipeline (cualificados): [N]
- Pipeline ponderado: $[X]
- Cierres esta semana: [N] · $[Y]
- Pérdidas: [N] · razón principal

## 💰 FINANZAS
- Revenue esta semana: $[X]
- Acumulado del mes: $[Y]
- Acumulado YTD: $[Z]
- Run rate hacia $100K USD 2026: 🟢/🟡/🔴
- Cuentas por cobrar >30 días: [lista]

## ⏱️ CAPACIDAD
- Horas comprometidas próximas 2 semanas: [N] / [capacidad]
- Semáforo: 🟢/🟡/🔴
- Necesidad freelancer: [lista]

## 🎯 PROYECTOS ACTIVOS
| Cliente | Estado | % avance | Riesgo |
|---------|--------|----------|--------|
| [...] | [...] | [%] | 🟢/🟡/🔴 |

## 🚨 ALERTAS
🔴 Crítico: [lista]
🟡 Importante: [lista]

## 🎓 APRENDIZAJES DE LA SEMANA
[Patrones detectados · postmortems · victorias]

## 🎯 PRIORIDADES PRÓXIMA SEMANA
1. [...]
2. [...]
3. [...]
```

---

## DATOS QUE SE AGREGAN (fuentes)

| Fuente | Datos |
|--------|-------|
| Meta Ads (vía API) | Impresiones · clicks · costo · conversiones |
| Google Ads (vía API) | Lo mismo |
| Airtable `leads` | Leads, scores, conversiones |
| Airtable `propuestas` | Pipeline, ponderado |
| Airtable `proyectos` | Estado, % avance, deadlines |
| Airtable `facturas` | Revenue, cuentas por cobrar |
| WhatsApp Cloud API | Mensajes, tasa de respuesta |
| Klaviyo | Open rate, CTR, conversiones email |
| Insights IG / TikTok / LinkedIn | Alcance, engagement |

---

## AUTOMATIZACIONES (Make / n8n)

```
1. Cron lunes 7:00 AM → trigger workflow
2. Por cliente activo:
   2.1 Llamar APIs (Meta, Google, Klaviyo, Airtable)
   2.2 Agregar datos en Airtable view "reporte_semanal"
   2.3 Generar JSON con datos
   2.4 Pasar a NEXUS-AGENT con prompt de redacción del reporte
   2.5 Generar PDF (PandaDoc/Docuseal API · custom con FORGE)
   2.6 Subir PDF a Drive
   2.7 Enviar email vía Resend con link + adjunto
   2.8 Enviar WA Cloud API con link
   2.9 Actualizar Notion del cliente
3. 9:00 AM → enviar todos los reportes a clientes
4. 9:30 AM → generar reporte interno ZENKAI consolidado
```

---

## REGLAS

- **Nunca** reporte enviado sin revisión rápida humana (5-10 min para ver que no tenga errores absurdos)
- **Nunca** datos no validados (si una API falla, marcar "datos no disponibles" no inventar)
- **Siempre** insight cualitativo, no solo números (qué aprendimos · qué hacemos al respecto)
- **Siempre** tabla comparativa vs semana anterior (la tendencia es lo que importa)
- **Siempre** reportes los lunes 9 AM puntual (genera disciplina y confianza)

---

## KPIs DEL WORKFLOW MISMO

| KPI | Objetivo |
|-----|----------|
| Reportes enviados a tiempo | 100% |
| Errores en datos detectados por cliente | 0 |
| Tiempo desde generación a envío | <30 min |
| NPS del reporte (encuesta trimestral) | >8 |
