---
name: "Reporte Semanal al Cliente"
slug: template-reporte-cliente
categoria: reporting
agentes_dueños: [ORACLE, ATLAS]
variables_principales: [CLIENTE_NOMBRE, SEMANA, KPIS, AVANCES, BLOQUEOS, PROXIMA_SEMANA]
---

# REPORTE SEMANAL · [CLIENTE_NOMBRE]
## Semana [SEMANA_N] de [SEMANAS_TOTALES]
**Periodo:** [FECHA_INICIO] al [FECHA_FIN]

---

## ESTADO GENERAL: [🟢 EN MARCHA · 🟡 ATENCIÓN · 🔴 ACCIÓN URGENTE]

**Resumen en 1 línea:** [RESUMEN_LINEA_UNICA]

---

## 🎯 ENTREGABLES DE LA SEMANA

**Completados:**
- ✅ [ENTREGABLE_COMPLETADO_1]
- ✅ [ENTREGABLE_COMPLETADO_2]
- ✅ [ENTREGABLE_COMPLETADO_3]

**En progreso:**
- 🔄 [ENTREGABLE_PROGRESO_1] · [%_AVANCE]%
- 🔄 [ENTREGABLE_PROGRESO_2] · [%_AVANCE]%

**No iniciados (próxima semana):**
- ⏳ [ENTREGABLE_PROXIMO_1]
- ⏳ [ENTREGABLE_PROXIMO_2]

---

## 📊 MÉTRICAS

### Marketing y Adquisición (ARES)

| Métrica | Esta semana | Semana anterior | Cambio |
|---------|-------------|-----------------|--------|
| Inversión ads | $[ADS_INVERSION] | $[ADS_ANTERIOR] | [%_CAMBIO]% |
| Impresiones | [IMPRESIONES] | [IMPRESIONES_ANT] | [%]% |
| Clicks | [CLICKS] | [CLICKS_ANT] | [%]% |
| CTR | [CTR]% | [CTR_ANT]% | [pp_CAMBIO]pp |
| Leads totales | [LEADS] | [LEADS_ANT] | [%]% |
| Leads cualificados | [LEADS_CUAL] | [LEADS_CUAL_ANT] | [%]% |
| CAC | $[CAC] | $[CAC_ANT] | [%]% |
| ROAS | [ROAS]× | [ROAS_ANT]× | [%]% |

### Ventas y CRM (HERMES)

| Métrica | Esta semana |
|---------|-------------|
| Mensajes WhatsApp recibidos | [WA_RECIBIDOS] |
| Tasa de respuesta <10 min | [WA_TASA_RESP]% |
| Conversaciones a llamada | [LLAMADAS_AGENDADAS] |
| Cierres (clientes nuevos) | [CIERRES] |
| Revenue capturado | $[REVENUE_SEMANA] |

### Orgánico (MUSE)

| Métrica | Esta semana | Cambio |
|---------|-------------|--------|
| Alcance IG | [ALCANCE_IG] | [%]% |
| Engagement rate IG | [ENGAGEMENT_IG]% | [pp_CAMBIO]pp |
| Reels alcance | [REELS_ALCANCE] | [%]% |
| Top post de la semana | "[TOP_POST_HOOK]" | [TOP_ALCANCE] |
| Saves totales | [SAVES] | [%]% |
| Mensajes DM nuevos | [DMS_NUEVOS] | [%]% |

### [SECCION_PERSONALIZADA_POR_SECTOR]

[METRICAS_ESPECIFICAS_SECTOR]

---

## 📅 PRÓXIMA SEMANA

**Plan:**
1. [TAREA_1]
2. [TAREA_2]
3. [TAREA_3]
4. [TAREA_4]

**Hitos:**
- [HITO_PROXIMA_SEMANA]

---

## 🚨 BLOQUEOS / DECISIONES NECESARIAS DEL CLIENTE

[Si no hay bloqueos:]
> Sin bloqueos esta semana. Todo en marcha.

[Si hay bloqueos:]
- ⚠️ [BLOQUEO_1] → necesitamos: [QUE_NECESITAMOS_1] de [CLIENTE_NOMBRE] antes de [FECHA_LIMITE]
- ⚠️ [BLOQUEO_2] → necesitamos: [QUE_NECESITAMOS_2] de [CLIENTE_NOMBRE] antes de [FECHA_LIMITE]

---

## 🎓 INSIGHT DE LA SEMANA

[INSIGHT_PARRAFO_1_2_LINEAS]

**Qué replicamos:** [QUE_REPLICAR]
**Qué cortamos:** [QUE_CORTAR]
**Qué probamos próxima semana:** [QUE_PROBAR]

---

## 💬 NOTAS ADICIONALES

[NOTAS_LIBRES_OPCIONALES]

---

**Cualquier duda, escríbenos por WhatsApp:**
[CONTACTO_WHATSAPP]

**Próximo status semanal:**
[FECHA_PROXIMO_REPORTE] · [HORA_PROXIMO_REPORTE]

---

ZENKAI Growth Systems · Equipo asignado a [CLIENTE_NOMBRE]
[OWNER_NOMBRE] · [OWNER_EMAIL]

---

> **VARIABLES DE PERSONALIZACIÓN POR SECTOR**
> 
> **E-COMMERCE:** AOV · % carritos recuperados · ticket promedio
> **SALUD:** citas agendadas · no-show rate · NPS pacientes
> **RESTAURANTES:** ocupación · pedidos delivery · reseñas Google
> **SERVICIOS:** propuestas enviadas · conversion consulta-cliente
> **EDUCACIÓN:** inscripciones · tasa de completación · NPS estudiantes
> **INMOBILIARIA:** leads cualificados · visitas agendadas · cierres
> **MANUFACTURA:** OTs procesadas · tiempo de ciclo · OEE
> **RETAIL:** tráfico · ticket · pedidos WhatsApp
> **STARTUPS:** MRR · churn · activation rate
> **GOBIERNO:** trámites digitales · ciudadanos atendidos
> **ONG:** donaciones · donantes recurrentes · alcance
