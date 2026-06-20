# Airtable Sprint 1 · campos requeridos

Base: **VENTAS** (`AIRTABLE_BASE_VENTAS`)

## Tabla `demos`

| Campo | Tipo | Uso |
|-------|------|-----|
| `email_capturado` | Email | Ya existe (landing) |
| `sector_detectado` | Text | Ya existe |
| `created_at` | Date/time | Opcional · S-01 usa `CREATED_TIME()` si falta |
| `autoreply_sent` | Checkbox | M-02 dedup |
| `respondido_at` | Date/time | S-01 · respuesta humana |
| `sla_alert_sent` | Checkbox | S-01 dedup |

## Tabla `Leads` (nombre exacto en Airtable)

Campos existentes usados por M-03: `Notas`, `Nombre`, `Email`, `Fuente`, `Servicio Interes`, `Presupuesto USD`, `Estado`, `Fecha Entrada`.

| Campo | Tipo | Uso |
|-------|------|-----|
| `score` | Number | M-03 output |
| `etapa` | Single select | `hot` · `nurturing` · `descalificado` |
| `cualificacion_razon` | Long text | M-03 |
| `cualificacion_brief` | Long text | M-03 · M-04 |
| `respondido_at` | Date/time | S-01 |
| `sla_alert_sent` | Checkbox | S-01 dedup |

## Fórmula S-01 · demos (referencia)

```
AND(
  {respondido_at}=BLANK(),
  OR({sla_alert_sent}=FALSE(), {sla_alert_sent}=BLANK()),
  IS_BEFORE(CREATED_TIME(), DATEADD(NOW(), -3, 'hours'))
)
```

## Fórmula S-01 · Leads (referencia)

```
AND(
  {respondido_at}=BLANK(),
  OR({sla_alert_sent}=FALSE(), {sla_alert_sent}=BLANK()),
  IS_BEFORE({Fecha Entrada}, DATEADD(NOW(), -3, 'hours'))
)
```

## Automations Airtable

Ver `docs/plans/2026-06-19-sprint1-automatizaciones-n8n.md` §4.
