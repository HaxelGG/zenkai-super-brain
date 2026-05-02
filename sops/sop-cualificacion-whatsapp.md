# SOP · Cualificación por WhatsApp
## Conversación que cualifica sin sonar a interrogatorio

**Owner:** HERMES-WA + HERMES-QUALIFY
**Skill:** `skill-cualificar-lead`
**Última revisión:** 2026-05-01

---

## OBJETIVO

Cualificar un lead a través de una conversación de WhatsApp que se sienta natural — no formulario disfrazado. El humano debe tener brief listo en <30 minutos sin que el lead haya sentido "fricción".

---

## PRINCIPIOS

1. **Conversación, no formulario.** Una pregunta a la vez, contextual.
2. **Calidad > velocidad.** Mejor 3 mensajes pensados que 8 atropellados.
3. **Empatía primero.** Validar lo que dijo el lead antes de preguntar.
4. **Honestidad.** Si no somos fit, decirlo · si tenemos que cobrar, decirlo.
5. **Cero presión.** El cliente decide cuándo está listo · nuestro trabajo es facilitarle, no presionarlo.

---

## SECUENCIA TIPO

### MENSAJE 1 — Acuse de recibo (T+0 a T+30s)
```
Hola [nombre], gracias por escribirnos. 

Vi que mencionaste [tema-específico-del-mensaje]. 
Me da mucho gusto que te interese.

Cuéntame un poco más para entender bien tu situación.
```

### MENSAJE 2 — Pregunta abierta (T+1 a T+5 min)
```
[Pregunta abierta sobre dolor o situación actual]
```

Ejemplos por contexto:
- Ecommerce: "¿Cómo va el negocio hoy? ¿Cuántos pedidos manejas en promedio al mes?"
- Salud: "Dime un poco de tu clínica. ¿Cuántos profesionales atienden? ¿Cómo manejan agenda hoy?"
- Servicios: "¿Cómo llegan los clientes hoy? ¿Sientes que tienes el flujo que necesitas?"

### MENSAJE 3 — Validar la respuesta (T+2 a T+10 min)
```
Entiendo. [Repetir en otras palabras lo que dijo · señal de escucha]

[Hacer la pregunta de presupuesto/timing de forma indirecta]
```

Ejemplos de pregunta indirecta de presupuesto:
- "¿Han trabajado con alguna agencia o consultor antes? ¿Cómo fue?"
- "¿Tienen un presupuesto explorando o todavía en fase de descubrimiento?"
- "¿Cuándo te gustaría tener esto resuelto idealmente?"

### MENSAJE 4 — Detectar urgencia y decision-maker (T+5 a T+15 min)
```
[Pregunta sobre quién decide / cuándo deciden]
```

Ejemplos:
- "¿Decides tú directamente o lo conversas con alguien más?"
- "¿Tienes en mente arrancar este mes o más adelante?"

### MENSAJE 5 — Propuesta de llamada (T+15 a T+30 min)
**Si score ≥6:**
```
[nombre], esto es justo lo que resolvemos. Te propongo:

Una llamada de 30 min donde te muestro cómo lo hacemos para empresas como [empresa similar].

Te dejo mi calendario: [CAL_LINK]

Si te encaja, agendamos. Si no, no pasa nada — seguimos por aquí.
```

**Si score 4-5:**
```
[nombre], te paso un caso similar al tuyo: [link · breve]

Cuando estés listo para conversar, aquí estoy.
```

**Si score ≤3:**
```
[nombre], aprecio que nos hayas escrito.

Por lo que me cuentas, en este momento no somos el match ideal porque [razón honesta]. 

Si tu situación cambia, [opción · ej. "te puedo recomendar a alguien" o "la puerta queda abierta"].

Saludos,
ZENKAI
```

---

## QUÉ NUNCA SE PREGUNTA POR WHATSAPP

❌ "¿Cuál es tu presupuesto exacto?" (frontal · cierra la conversación)
❌ "¿Quién es tu competencia?" (suena agresivo · no es nuestra info)
❌ "¿Cuántos empleados tienen?" (datos de census · busca otra forma)
❌ "Mándame tu balance / facturación" (alarmas)
❌ "¿Por qué no funcionó la otra agencia?" (sin contexto suena a chisme)

**Estos datos sí se obtienen, pero en la llamada de descubrimiento, no por chat.**

---

## QUÉ SÍ SE PREGUNTA POR WHATSAPP

✅ Sector · tamaño aproximado de operación
✅ Dolor principal (en sus palabras)
✅ Timing (urgente · próximos 30 días · explorando)
✅ Decision-maker (¿decides tú?)
✅ Experiencia previa con agencias/consultores (sin entrar en detalles negativos)

---

## DURACIÓN MÁXIMA

**Una conversación de cualificación no debe tomar más de 30 minutos en total** (mensajes ida y vuelta). Si después de 30 min no hay claridad para scoring, agendar llamada · WhatsApp ya no es el canal correcto.

---

## DETECCIÓN DE BANDERAS ROJAS

Durante la conversación, atención a:

🚩 **"Necesito que sea muy barato / casi gratis"** → score -3
🚩 **"Te pago si me funciona"** → score -3 (no aceptamos modelo de éxito así)
🚩 **"Mándame primero un demo personalizado gratis"** → score -3
🚩 **"Estoy hablando con varias agencias, mándame tu mejor precio"** → score -2
🚩 **Mensaje copy-paste sin nombre / contexto** → -2
🚩 **Pide que firmemos NDA antes de cualquier conversación** → escalada a LEX (puede ser legítimo en sectores regulados)

---

## SI EL LEAD NO RESPONDE

**T+1 hora sin respuesta a tu primer mensaje:**
- No re-mensajear (te ven como necesitado)
- Esperar

**T+24 horas:**
```
Hola [nombre], cómo va? ¿Pudiste pensarlo o está fluyendo el día?

Si necesitas más info, aquí estoy. Si no es momento, sin presión.
```

**T+72 horas si aún no responde:**
- Marcar lead como "frío"
- Activar nurturing automatizado (D+7, D+14)
- Re-evaluar en 30 días

---

## DOCUMENTACIÓN

Cada conversación se loguea automáticamente en Airtable `leads`:
- Mensaje original
- Score evolución (preliminar · final)
- Razón del score
- Resultado (llamada agendada · nurturing · descalificado)
- Próxima acción programada
- Owner asignado si pasa a humano

---

## REGLAS INQUEBRANTABLES

1. **Una pregunta a la vez.** Nunca 3 preguntas en un mensaje.
2. **Validar antes de preguntar.** "Entiendo X" antes de preguntar Y.
3. **Honestidad sobre fit.** Si no somos match, decirlo claro y cordial.
4. **No mentir sobre disponibilidad / urgencia.** "Solo quedan 2 cupos" si NO es verdad → mata reputación.
5. **Personalizar siempre.** Nombre · sector · contexto en cada mensaje.
6. **No copiar la conversación a otro lead.** Cada uno es único.
