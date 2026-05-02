# SECTOR · CLÍNICAS & SALUD
## Fase 2 nicho de ZENKAI (mes 4+ del 2026)

---

## NOTA CRÍTICA DE ENTRADA

Salud maneja **datos sensibles**. LEX se activa **siempre** desde el primer contacto. Habeas Data (Colombia · Ley 1581/2012), HIPAA si USA, GDPR si EU. **Ningún sistema entra en producción sin política de privacidad firmada y cláusula de tratamiento de datos en el contrato.**

---

## AGENTES PRIORITARIOS

1. **ATLAS** — gestión de citas, no-shows, recordatorios
2. **ECHO** — soporte de pacientes, escalada de urgencias
3. **LEX** — datos sensibles, consentimiento informado
4. **NEXUS** — integraciones (Cal.com, formularios, HC)
5. ARES — captación local (Meta + Google Local)
6. APOLLO — landing con identidad médica

---

## KPIs CLAVE

| KPI | Benchmark sano |
|-----|----------------|
| Tasa de citas agendadas / leads | >40% |
| No-show rate | <15% (sin ZENKAI suele ser 25-35%) |
| Retención de pacientes (segunda visita) | >50% |
| Tiempo promedio de espera (telefónico) | <2 min |
| Tiempo de primera respuesta WA | <10 min |
| NPS post-consulta | >70 |
| Recuperación de pacientes inactivos | 15-25% por campaña |
| LTV por paciente | sube cada trimestre |

---

## DOLORES TÍPICOS DEL SECTOR

1. "La agenda es un caos, doble-citan a pacientes" → falta CRM o uso manual
2. "Tengo 30% de no-shows" → no hay sistema de recordatorios
3. "Pacientes me llaman a las 11 PM con dudas" → no hay chatbot 24/7
4. "Después de la primera visita pierdo a la mayoría" → no hay seguimiento
5. "El staff médico no usa la herramienta que compré" → no hay capacitación
6. "Los datos están en Excel, papel y mi cabeza" → no hay fuente única
7. "Anuncios traen clientes sin presupuesto" → segmentación mala
8. "No tengo presencia en Google" → SEO local nulo

---

## STACK RECOMENDADO POR TIER

### TIER ECO
- **Agendamiento:** Cal.com gratis (sí, suficiente para empezar)
- **CRM:** Airtable free (1,000 registros) o Google Sheets
- **WhatsApp:** Business App manual + plantillas
- **Recordatorios:** vía WhatsApp manual o Make free + Cal.com webhook
- **Anamnesis:** formulario Google
- **Política de privacidad:** template estándar (LEX-PRIVACY)
- **Total:** ~$0 (solo budget de ads $300-500 USD/mes)

### TIER PRO (clínica establecida 2-10 profesionales)
- **Agendamiento:** Cal.com Pro ($12/mes) integrado a WhatsApp
- **CRM:** Airtable Team ($20/mes) — base "PACIENTES" estructurada
- **WhatsApp:** Cloud API + BSP + recordatorios automáticos D-1, D-3h
- **Anamnesis:** Typeform o JotForm Pro ($25/mes)
- **HC digital:** según país (Doctorli, eClinicWorks, etc.) — usualmente ya lo tienen
- **Reseñas:** automatización post-consulta (Google + redes)
- **Reportes:** Looker Studio gratis con datos de Airtable
- **Total tools:** $80-150 USD/mes (sin HC)

### TIER PREMIUM (clínica >10 profesionales o cadena)
- **HC integrado:** integración custom con HC (NEXUS-API + FORGE)
- **Telemedicina:** integración con plataforma (Zoom Health, Doxy.me)
- **Marketing automation:** Klaviyo segmentado por tipo de tratamiento
- **Reportes BI:** Metabase o Looker conectado a HC
- **Compliance:** auditoría anual de seguridad
- **Total tools:** $500-2,500+ USD/mes

---

## TEMPLATE DE PROPUESTA COMERCIAL — SALUD

```
PROPUESTA · CLÍNICA TIER [X]

CLIENTE: [nombre clínica]
ESPECIALIDAD: [...]
FECHA: [...]

DIAGNÓSTICO INICIAL:
- N profesionales: [...]
- Citas/semana actuales: [...]
- No-show rate actual: [%]
- Canal principal de captación: [...]
- HC actual: [...]

OBJETIVOS A 90 DÍAS:
- Reducir no-shows: [-15pp]
- Aumentar agenda: [+20%]
- Tiempo respuesta WA: <10 min
- NPS objetivo: >70

QUÉ INCLUYE:

AGENDAMIENTO Y RECORDATORIOS (ATLAS):
✓ Cal.com configurado por profesional
✓ Integración con WhatsApp Cloud API
✓ Recordatorios automáticos D-1 y D-3h
✓ Confirmación con un click
✓ Reagendamiento automático si cancelan

WHATSAPP CLINICA (HERMES-WA + ECHO-BOT):
✓ Cloud API + BSP certificado
✓ Bot de primera línea (FAQs · agenda · ubicación)
✓ Escalada a humano para urgencias clínicas
✓ Templates de mensaje con HSM aprobado

CRM PACIENTES (HERMES + ATLAS):
✓ Base Airtable "PACIENTES" estructurada
✓ Histórico de visitas
✓ Segmentación por tratamiento
✓ Campañas de recall (post-tratamiento, anual, etc.)

CAPTACIÓN LOCAL (ARES):
✓ Meta Ads + Google Local
✓ Optimización de Google My Business
✓ 6 creatividades iniciales
✓ Landing de captación

CUMPLIMIENTO LEGAL (LEX):
✓ Política de tratamiento de datos
✓ Consentimiento informado para comunicaciones
✓ Cláusula contractual Habeas Data / HIPAA / GDPR
✓ Aviso de privacidad publicado

CAPACITACIÓN AL STAFF:
✓ 1 sesión de 90 min con todo el equipo
✓ Manual de uso en Notion (acceso permanente)
✓ Soporte primer mes ilimitado

INVERSIÓN:
- Setup: $[X] USD
- Retainer mensual: $[Y] USD/mes
- Budget ads sugerido: $300-1,500 USD/mes (no incluido)

PLAZO: 4-6 semanas

[Cláusulas legales LEX]
```

---

## PREGUNTAS DE CUALIFICACIÓN ESPECÍFICAS

1. ¿Cuántos profesionales atienden actualmente?
2. ¿Qué especialidad? (general · estética · dental · psicología · otra)
3. ¿Cuántas citas a la semana en promedio?
4. ¿Qué % son pacientes recurrentes vs nuevos?
5. ¿Cómo agendan hoy? (teléfono · WhatsApp · web · presencial)
6. ¿Tienen historia clínica digital? ¿Cuál?
7. ¿Cuánto invierten hoy en ads?
8. ¿Cuál es el ticket promedio por consulta?
9. ¿Tienen política de privacidad publicada?
10. ¿Cuántos pacientes inactivos (>6 meses sin visita) tienen?

---

## CASOS DE USO TÍPICOS

### Caso 1: Clínica dental con 1 odontólogo + 1 asistente
- Tier sugerido: ECO o PRO
- Foco: agenda + WhatsApp + recordatorios
- Resultado típico: -15pp no-shows en 60 días

### Caso 2: Clínica estética con 3-5 profesionales
- Tier sugerido: PRO
- Foco: captación + agendamiento + recall
- Resultado típico: +30% citas/mes en 90 días

### Caso 3: Centro médico con 10+ profesionales
- Tier sugerido: PREMIUM
- Foco: integración con HC + telemedicina + BI
- Resultado típico: +40% eficiencia operativa, -25% en costos administrativos

### Caso 4: Psicólogo independiente
- Tier sugerido: ECO
- Foco: agenda + landing + Cal.com
- Resultado típico: agenda al 90% en 60 días

---

## PROHIBICIONES ESPECÍFICAS DEL SECTOR

- **Nunca** automatizar respuestas a urgencias médicas (siempre escalada a humano).
- **Nunca** enviar comunicaciones masivas sin consentimiento explícito.
- **Nunca** almacenar diagnósticos en herramientas no compliance (Google Sheets sin encriptar).
- **Nunca** compartir datos entre profesionales sin autorización.
- **Nunca** usar fotos de pacientes reales sin consentimiento por escrito.
- **Nunca** prometer resultados clínicos en el copy de ads (Meta lo banea).
