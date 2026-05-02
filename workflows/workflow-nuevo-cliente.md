# WORKFLOW · Nuevo Cliente
## De lead entrante a contrato firmado y primer pago

**Tiempo objetivo end-to-end:** 7-21 días según tier
**Agentes principales:** ARES → HERMES → ORACLE → LEX → ATLAS

---

## DIAGRAMA DE FLUJO

```
[Lead entra]
    ↓
ARES o canal orgánico
    ↓
HERMES-WA (primera respuesta <10 min)
    ↓
HERMES-QUALIFY (skill-cualificar-lead, score 1-10)
    ↓
    ├─ Score ≤3 → email cortés · archivar
    ├─ Score 4-5 → HERMES-FOLLOW (nurturing automatizado)
    └─ Score ≥6 → CONTINUAR ↓
    ↓
Llamada de descubrimiento (humano · HERMES-CLOSE prepara brief)
    ↓
ORACLE-PRICE (skill-calcular-precio)
    ↓
LEX-PROPOSAL (skill-generar-propuesta)
    ↓
PDF enviado · seguimiento HERMES
    ↓
    ├─ NO firma en 21 días → archivar como perdida
    └─ FIRMA → CONTINUAR ↓
    ↓
LEX-CONTRACT (genera contrato definitivo)
    ↓
LEX-SIGN (proceso de firma)
    ↓
Primer pago (Stripe · MercadoPago · Wompi · transferencia)
    ↓
ATLAS-ONBOARD (workflow-onboarding.md)
```

---

## PASOS DETALLADOS

### PASO 1 · Captura del lead
**Owner:** ARES (si pago) o canal directo (orgánico · referido)
**Tiempo:** instantáneo

- Lead llega vía Meta Ads · Google · WhatsApp · web · referido
- Webhook → Make → Airtable base VENTAS tabla `leads`
- Trigger automático a HERMES-WA

### PASO 2 · Primera respuesta
**Owner:** HERMES-WA
**SLA:** <10 minutos en horario laboral

```
Mensaje automático inicial (si fuera de horario):
"Hola [nombre], gracias por escribirnos. Estamos en sesión, 
te respondemos antes de las [hora cierre]. Mientras, ¿quieres 
contarme un poco más sobre tu proyecto?"

Mensaje manual/conversacional (en horario):
"Hola [nombre], soy [persona] de ZENKAI. Vi tu mensaje sobre [tema].
[1 pregunta clarificadora]"
```

### PASO 3 · Cualificación
**Owner:** HERMES-QUALIFY
**Skill:** `skill-cualificar-lead`
**Tiempo:** <30 min de la primera respuesta

- Aplicar rúbrica de scoring 1-10
- Generar brief si score ≥6
- Loguear en Airtable con razón

### PASO 4 · Llamada de descubrimiento
**Owner:** Humano (Perfil 1 o Perfil 2 según asignación)
**Tiempo:** 30-45 min · agendada por Cal.com en <72h del primer contacto

Estructura de la llamada:
```
0-5 min · Romper el hielo · contexto del lead
5-20 min · Descubrimiento
  · ¿Qué te trae? (que cuente con sus palabras)
  · ¿Cómo es hoy? (situación actual)
  · ¿Qué has intentado? (validar que no busca lo gratis)
  · ¿Qué pasa si no resuelves esto? (urgencia real)
  · ¿Cuándo necesitas tener resuelto? (timeline)
  · ¿Cuál es el presupuesto disponible? (validar fit)
20-30 min · Propuesta de valor de ZENKAI (alto nivel, sin precio aún)
30-40 min · Próximos pasos y plazos
40-45 min · Cierre · agendar follow-up de propuesta
```

**Regla:** NO dar precio en esta llamada. Decir "te paso la propuesta personalizada en 24-48h".

### PASO 5 · Cotización
**Owner:** ORACLE-PRICE
**Skill:** `skill-calcular-precio`
**Tiempo:** <24h post-llamada

- Listar herramientas del proyecto
- Aplicar fórmula (costo trimestral × 2)
- Ajustar por mercado
- Validar margen >60%
- Si margen <60%, escalar a ZEUS

### PASO 6 · Generación de propuesta
**Owner:** LEX-PROPOSAL + APOLLO-TEMPLATE
**Skill:** `skill-generar-propuesta`
**Tiempo:** <48h post-llamada (puede ser mismo día)

- 8 secciones según skill
- 2 rutas (Eco + Pro · salvo cliente pre-elegido)
- PDF profesional con branding ZENKAI

### PASO 7 · Envío de propuesta
**Owner:** HERMES
**Tiempo:** <48h post-llamada

- Email con resumen ejecutivo + PDF adjunto
- WhatsApp avisando "te envié la propuesta"
- Loguear en Airtable: tabla `propuestas` · estado "enviada"

### PASO 8 · Seguimiento
**Owner:** HERMES-FOLLOW
**Cadencia:**
- D+3 · "¿pudiste revisar?"
- D+7 · "agendamos llamada para resolver dudas?"
- D+14 · "vence en X días, alguna preocupación?"
- D+21 · "vencida la oferta, podemos extender si me dices algo"

### PASO 9 · Decisión del cliente

**Si cliente FIRMA:**
- HERMES marca propuesta como "aceptada"
- Activar PASO 10

**Si cliente RECHAZA:**
- Capturar razón en Airtable
- Insumo para análisis de ZEUS y ARES (mejora futura)
- Email cortés · "puerta abierta"

**Si cliente NO RESPONDE en 21 días:**
- Archivar como "perdida sin razón"
- Activar `workflow-recuperar-lead-frio.md` en 60 días

### PASO 10 · Generación de contrato
**Owner:** LEX-CONTRACT
**Tiempo:** <24h post-aceptación

- Adaptar template al sector y particularidades del cliente
- Verificar variables [VARIABLE] están todas reemplazadas
- Si sector regulado, escalada a abogado humano antes de firma

### PASO 11 · Firma
**Owner:** LEX-SIGN
**Tiempo:** <72h post-generación

- Plataforma: Docuseal (Eco) · PandaDoc (Pro) · DocuSign (Premium)
- Orden de firma: ZENKAI primero, después cliente
- Recordatorio si cliente no firma en 48h

### PASO 12 · Primer pago
**Owner:** ORACLE
**Tiempo:** <72h post-firma

- Generar factura / link de pago
- Plataformas: Stripe · MercadoPago · Wompi · transferencia bancaria
- NO empezar trabajo hasta confirmar pago

### PASO 13 · Handoff a ATLAS
**Owner:** HERMES → ATLAS
**Tiempo:** mismo día del pago confirmado

- HERMES marca lead como "ganado"
- ATLAS-ONBOARD inicia automáticamente
- Activar `workflow-onboarding.md`

---

## KPIs DEL WORKFLOW

| KPI | Objetivo |
|-----|----------|
| SLA primera respuesta | <10 min |
| Conversión lead score ≥6 → llamada agendada | >70% |
| Conversión llamada → propuesta enviada | 100% (siempre se envía) |
| Conversión propuesta → firma | >35% |
| Tiempo total lead → firma | <21 días en Pro |
| Tiempo total firma → primer pago | <7 días |

---

## AUTOMATIZACIONES (Make / n8n)

```
1. Webhook desde formulario web → Airtable `leads`
2. Trigger Airtable `leads` (nuevo) → WhatsApp Cloud API mensaje inicial
3. Trigger Airtable `leads` (score actualizado) → email a humano si ≥6
4. Cron diario → revisión de seguimiento pendiente · enviar D+3/7/14/21
5. Trigger Airtable `propuestas` (firmada) → generar contrato + enviar a Docuseal
6. Webhook de Docuseal (firmado) → notificar humano + actualizar Airtable
7. Webhook de Stripe (pago confirmado) → activar ATLAS-ONBOARD
```

---

## ALERTAS Y ESCALADAS

- **Lead no respondido en 1h en horario:** alerta a humano de guardia
- **Propuesta sin respuesta en 14 días:** alerta a HERMES (intensificar follow-up)
- **Pago no confirmado en 7 días post-firma:** alerta a ORACLE + HERMES
- **Cliente con score 6-7 que rechaza propuesta 2× consecutivas:** review con ZEUS (mismatch en posicionamiento?)
