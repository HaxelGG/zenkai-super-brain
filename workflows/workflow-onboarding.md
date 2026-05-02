# WORKFLOW · Onboarding
## De contrato firmado a primer entregable visible

**Tiempo objetivo:** 7 días end-to-end
**Agentes principales:** ATLAS-ONBOARD + departamentos del proyecto
**Skill base:** `skill-onboarding-cliente`

---

## DIAGRAMA DE FLUJO

```
[Contrato firmado + primer pago confirmado]
    ↓
H+0 · Mensaje WhatsApp bienvenida
H+0 · Crear estructura clientes/[slug]/
H+0 · Crear Notion del cliente
H+4 · Asignar equipo interno (HIVE-TASKS)
H+24 · Kickoff agendado (Cal.com)
H+24 · Brief detallado enviado al cliente
H+48 · Brief recibido y procesado
H+48 · Plan v1 elaborado
H+72 · Kickoff call (60 min)
H+96 · Minuta + plan v1 actualizado
D+5 · NPS de onboarding (CSAT 1-10)
D+7 · Primer entregable visible al cliente
```

---

## PASOS DETALLADOS (Ver `skill-onboarding-cliente.md` para detalle completo)

### Pre-requisitos (si NO se cumplen, NO empezar)
- ✅ Contrato firmado por ambas partes
- ✅ Primer pago confirmado (ORACLE)

### H+0 a H+4
1. WhatsApp de bienvenida personalizado (no genérico)
2. Crear `clientes/[slug]/` desde template
3. Crear Notion del cliente y compartirlo
4. Asignar owner interno + agentes activos + freelancers (HIVE)

### H+4 a H+24
5. Agendar kickoff via Cal.com (próximos 5 días laborales)
6. Enviar formulario de brief detallado (Typeform Pro/JotForm/Google Form según tier)

### H+24 a H+48
7. Procesar respuestas del brief
8. Distribuir contexto a agentes (APOLLO · NEXUS · LEX según aplique)
9. Preparar plan v1 (Gantt en Airtable)

### H+48 a H+72 (KICKOFF)
10. Kickoff call de 60 min (estructura en skill)
11. Validación bilateral del plan v1

### H+72 a H+96
12. Minuta del kickoff enviada
13. Plan v1 actualizado con cambios de la call
14. Status semanal recurrente agendado (default lunes 10 AM)

### D+5
15. NPS del onboarding (Google Form / Typeform → Airtable)
16. Si NPS <8: llamada del owner para entender gap

### D+7
17. Primer entregable visible (puede ser mockup, primer flow, primera campaña preparada)
18. Loom del entregable explicando qué se hizo
19. Notion del cliente actualizado

---

## ESTRUCTURA QUE SE CREA EN clientes/[slug]/

```
clientes/[slug]/
├── briefing.md          ← respuestas del brief detallado
├── propuesta.md         ← copy de la propuesta firmada
├── contrato.md          ← link al PDF firmado en Drive
├── proyecto.md          ← plan v1 + actualizaciones · vivo
├── reportes/            ← reportes semanales y mensuales
├── assets/              ← logos, fotos, marca del cliente
└── automatizaciones/    ← documentación de cada flow Make
```

---

## CHECKLIST DE CIERRE DE ONBOARDING (D+7)

- ✅ Cliente tiene acceso a Notion · Drive · Airtable (read)
- ✅ Plan v1 firmado / aprobado por cliente
- ✅ Status semanal recurrente en ambos calendarios
- ✅ Canales de comunicación definidos:
  - WhatsApp grupo (con bot ECHO)
  - Email para formal
  - Notion para documentación
  - Status semanal para review
- ✅ Primer entregable visible D+7
- ✅ NPS del onboarding capturado
- ✅ Lead time hasta primer reporte definido (default D+14)

---

## KPIs DEL WORKFLOW

| KPI | Objetivo |
|-----|----------|
| Brief enviado en | <H+24 |
| Brief recibido del cliente en | <H+72 |
| Kickoff agendado en | <H+24 |
| Kickoff realizado en | <H+72 |
| Primer entregable visible en | <D+7 |
| NPS del onboarding | >8 |

---

## ALERTAS

- **Brief no recibido del cliente en 5 días:** llamada directa del owner (no email)
- **Kickoff no agendado en 5 días:** congelar inicio del cronograma + escalar a HERMES
- **NPS del onboarding <7:** llamada urgente · postmortem · plan de recuperación
- **Cliente cambia de mind post-firma:** activar LEX para orden de cambio · NO empezar build hasta clarificar

---

## REGLAS INQUEBRANTABLES

- **Nunca** empezar onboarding sin contrato + primer pago.
- **Nunca** dejar al cliente >24h sin contacto en primera semana.
- **Nunca** kickoff sin brief recibido y procesado.
- **Nunca** prometer en kickoff lo que no está en propuesta firmada.
- **Siempre** primer hito visible <D+7.
- **Siempre** Loom personalizado de bienvenida + del primer entregable.
- **Siempre** todo documentado en Notion del cliente desde día 1.
