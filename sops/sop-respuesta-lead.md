---
name: "Respuesta a Lead"
slug: sop-respuesta-lead
sla: "<10 min"
agentes_responsables: [HERMES]
frecuencia: por_evento
criticidad: alta
---

# SOP · Respuesta a Lead Nuevo
## Estándar SLA: <10 minutos en horario laboral

**Owner del SOP:** HERMES-WA
**Última revisión:** 2026-05-01
**Frecuencia de revisión:** trimestral

---

## OBJETIVO

Toda primera respuesta a lead nuevo debe ocurrir en <10 minutos en horario laboral. Fuera de horario, mensaje automático con expectativa concreta.

**Por qué <10 min:** la probabilidad de cualificar al lead cae >80% si la primera respuesta toma >5 horas (estudio MIT/InsideSales). 10 min es el sweet spot práctico.

---

## DEFINICIONES

- **Horario laboral ZENKAI:** L-V 9:00 AM - 7:00 PM Colombia (UTC-5)
- **Horario extendido:** S 10:00 AM - 1:00 PM (solo respuestas críticas)
- **Lead nuevo:** primer contacto · no existe en `leads` Airtable o existe pero >90 días sin interacción

---

## DISPARADOR

Cualquiera de estos eventos activa este SOP:
- Webhook desde formulario web → Airtable `leads` (nuevo registro)
- Mensaje en WhatsApp Business / Cloud API a número ZENKAI
- DM en Instagram / LinkedIn · Twitter
- Email entrante a contacto@zenkai · ventas@zenkai
- Mención directa de cliente actual recomendando

---

## PASOS

### PASO 1 · Captura automática del lead (T+0)
**Owner:** Make + Airtable

- Make detecta el evento
- Crea registro en Airtable `leads` (base VENTAS)
- Datos mínimos: timestamp · canal · mensaje original · contacto
- Trigger automático a HERMES-WA

### PASO 2 · Mensaje automático inicial (T+30 segundos)
**Owner:** HERMES-WA (Cloud API en Pro+) · manual en Eco

**Si en horario laboral:**
```
Hola [nombre], gracias por escribirnos.

Soy de ZENKAI. Vi tu mensaje sobre [tema-detectado].

[1 pregunta clarificadora específica al mensaje]

Estoy revisando tu caso ya. Te respondo con detalle en menos de 10 minutos.
```

**Si fuera de horario:**
```
Hola [nombre], gracias por escribirnos.

Estamos fuera de horario. Te respondo con detalle mañana antes de las 10 AM.

Si es urgente, déjame nota acá y la priorizo.

Equipo ZENKAI
```

### PASO 3 · Análisis del mensaje (T+0 a T+5 min)
**Owner:** HERMES-QUALIFY (vía Skill `skill-cualificar-lead`)

- Detectar sector
- Detectar señales de urgencia
- Detectar señales de presupuesto
- Detectar si es decision-maker
- Score preliminar 1-10

### PASO 4 · Primera respuesta sustantiva (T+5 a T+10 min)
**Owner:** HERMES-WA + humano supervisión

**Si score ≥6 (pasa a humano):**
- Mensaje personalizado con propuesta de llamada
- Link Cal.com con disponibilidad próximas 72h
- Brief generado para el humano que tomará la llamada

```
[nombre], me gustaría conocer más sobre [proyecto]. 

¿Te suena bien si agendamos 30 min esta semana? 
Aquí el calendario: [CAL_LINK]

Mientras, ¿podrías contarme rapidito:
1. ¿Cuántas [unidad relevante: clientes / pedidos / etc.] manejas hoy?
2. ¿Cuál es el dolor #1 que quieres resolver?

Saludos,
[Persona ZENKAI]
```

**Si score 4-5 (nurturing):**
- Activar secuencia D+1/3/7/14 automatizada
- Enviar contenido educativo relevante al sector

**Si score ≤3 (descalificar):**
```
[nombre], gracias por escribirnos.

Después de revisar tu caso, creo que en este momento no somos el match correcto.

[Razón específica · honesta · sin condescendencia]

Si en algún momento tu situación cambia, la puerta queda abierta.

Saludos,
ZENKAI
```

### PASO 5 · Logging completo (T+10 min)
**Owner:** Make + Airtable

Actualizar `leads` con:
- Score final
- Acción tomada
- Tiempo a primera respuesta (medir SLA)
- Próxima acción programada
- Owner asignado

### PASO 6 · Seguimiento si aplica
- Score ≥6: humano hace la llamada · al concluir actualiza `leads` con resultado
- Score 4-5: HERMES-FOLLOW ejecuta secuencia
- Score ≤3: archivado · análisis trimestral por ZEUS

---

## ALERTAS

🔴 **Lead sin respuesta en >15 min en horario:**
- Notificación a humano de guardia (WhatsApp + Slack)
- Si no respuesta en 30 min, escalada a owner principal
- Postmortem si pasó 2+ veces en una semana

🟡 **Tiempo de primera respuesta >10 min trending up:**
- Análisis ZEUS-DECIDE de capacidad
- ¿Necesidad de freelancer comercial?
- ¿Necesidad de mejorar bot?

---

## MÉTRICAS

Reporte semanal incluye:
- % de leads respondidos en <10 min en horario
- Tiempo promedio a primera respuesta
- % de score ≥6 sobre total leads
- Conversión a llamada
- Conversión a cierre

**Objetivos:**
- SLA: >95% respondidos en <10 min en horario
- Tiempo promedio: <5 min
- Score ≥6 sobre total: >40%
- Conversión a llamada (de score ≥6): >70%

---

## EXCEPCIONES Y CASOS ESPECIALES

### Lead spam o consulta no comercial
- Detectar palabras clave (link en mensaje, oferta no solicitada)
- Marcar como spam · no responder
- Si es persona pero pregunta no es ventas (ej. soporte), redirigir cordialmente

### Lead que mensajea por canal "incorrecto" (ej. WhatsApp personal del fundador)
- Responder cordialmente y redirigir al canal oficial
- Loguear igual en `leads` con marca "canal-no-oficial"

### Lead que escribe en idioma distinto a español/inglés
- Responder en el idioma del lead si es posible
- Si no es posible, responder en inglés con disculpa
- Loguear el idioma para análisis de mercado

### Lead que es competidor
- Detectar (LinkedIn, sitio web)
- Responder cordialmente · sin compartir información competitiva
- Marcar en Airtable

---

## REGLAS INQUEBRANTABLES

1. **SLA <10 min siempre en horario.** No negociable.
2. **Personalizar siempre** el mensaje. Nada de "te paso info".
3. **Loguear todos los leads,** incluyendo descalificados.
4. **No responder fuera de horario excepto crisis** (criterio: cliente actual con problema en producción).
5. **Humano supervisa todas las respuestas a score ≥6** antes de enviar.
6. **No pasar precio en primera respuesta.** Mejor agendar llamada.
