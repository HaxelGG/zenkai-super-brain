# SOP · Escalada de Problemas
## Cuándo y cómo escalar · qué se decide a qué nivel

**Owner:** todos los agentes · ZEUS recibe
**Última revisión:** 2026-05-01

---

## OBJETIVO

Que los problemas se resuelvan al nivel más bajo posible donde realmente se pueden resolver — pero que escalen rápido cuando la ejecución de bajo nivel está agotada o cuando el riesgo lo justifica.

**Mal escalada:** todo se escala a humano (saturas a humanos · agentes no aprenden).
**Mal NO-escalada:** problemas críticos no llegan a humanos a tiempo (pérdida de cliente · daño legal · daño reputacional).

---

## NIVELES DE ESCALADA

```
NIVEL 0 · Subagente (Haiku · Sonnet específico)
  ↓ (si no resuelve)
NIVEL 1 · Agente Master (Sonnet)
  ↓ (si no resuelve)
NIVEL 2 · Otro agente Master relevante
  ↓ (si no resuelve)
NIVEL 3 · ZEUS (Opus)
  ↓ (decisión estratégica o requiere humano)
NIVEL 4 · Humano ZENKAI (Perfil 1 o Perfil 2)
  ↓ (si requiere experto externo)
NIVEL 5 · Externo (abogado · contador · consultor especializado)
```

---

## CRITERIOS DE ESCALADA POR TIPO DE PROBLEMA

### Técnico · sistema en producción

| Tipo | Nivel | Ejemplos |
|------|-------|----------|
| Bug menor | NEXUS-MONITOR (N0) | Texto desalineado · timezone wrong en email |
| Bug funcional | NEXUS o FORGE (N1) | Webhook no dispara · email no llega |
| Performance | NEXUS o FORGE (N1) | Latencia >5s · pixel desconectado |
| Sistema caído | NEXUS-MONITOR → escala FORGE inmediato → ZEUS si >30 min sin resolver | Landing 500 · API down |
| Pérdida de datos | FORGE → ZEUS inmediato → humano | DB corrupta · backup fallido |
| Brecha de seguridad | FORGE → LEX → ZEUS → humano → posible externo | Credencial filtrada · acceso anómalo |

### Comercial · cliente activo

| Tipo | Nivel | Ejemplos |
|------|-------|----------|
| Pregunta operativa | ECHO (N0) | "¿Cómo cambio el horario?" |
| Bug reportado por cliente | ECHO → NEXUS/FORGE | "El sistema no me deja…" |
| Queja sobre delivery | ECHO → ATLAS (N1) | "El proyecto va lento" |
| Solicitud cambio de alcance | ECHO → ATLAS → LEX | "Necesito agregar feature X" |
| Riesgo de churn | ECHO → ATLAS → ZEUS | NPS bajó · uso bajó · 3+ tickets/sem |
| Cliente furioso | ECHO → ATLAS → humano (sí, salta a humano rápido) | Amenaza pública · cancelación |
| Acción legal | LEX → humano → externo | "Vamos a demandar" |

### Comercial · pipeline

| Tipo | Nivel | Ejemplos |
|------|-------|----------|
| Lead nuevo | HERMES-WA (N0) | Cualquiera entrando |
| Cualificación | HERMES-QUALIFY (N0) | Score 1-10 |
| Llamada de cierre | HERMES-CLOSE → humano (siempre humano) | Score ≥6 |
| Negociación de precio | HERMES → ORACLE → ZEUS | Cliente pide -25% sobre setup |
| Deal grande (>$30K USD) | HERMES → ORACLE → ZEUS → humano | Enterprise con condiciones especiales |

### Financiero

| Tipo | Nivel | Ejemplos |
|------|-------|----------|
| Cotización rutinaria | ORACLE-PRICE (N0) | Aplicar fórmula |
| Margen <60% | ORACLE → ZEUS (N3) | Caso especial · validar |
| Cuenta por cobrar >30 días | ORACLE → HERMES (N1) | Recordar al cliente |
| Cuenta por cobrar >60 días | HERMES → LEX → humano | Disputa · acción cobranza |
| Decisión de inversión propia | ZEUS → humano | Contratar empleado · invertir en herramienta |

### Operativo

| Tipo | Nivel | Ejemplos |
|------|-------|----------|
| Tarea diaria | Agente correspondiente (N0/N1) | Cualquier flujo normal |
| Bloqueo de delivery | Agente → ATLAS-COORD | Dependencia no llega |
| Capacidad insuficiente | ATLAS → HIVE | No hay quien haga la tarea |
| Crisis operativa | ATLAS → ZEUS → humano | Múltiples proyectos simultáneamente en rojo |

### Estratégico

| Tipo | Nivel | Ejemplos |
|------|-------|----------|
| Pivot de modelo | ZEUS → humano | Cambiar de cobro setup a revenue share |
| Nuevo sector | ZEUS → humano | Empezar a atender industria nueva |
| Asociación / partnership | ZEUS → humano → LEX | Alianza con agencia complementaria |
| Crisis pública | ZEUS → humano → posible externo (PR) | Cliente expone problema en redes |

---

## CÓMO ESCALAR (PROTOCOLO)

### Cuando un agente decide escalar:

1. **Marcar el ticket/asunto** con label "escalada"
2. **Resumir el problema** en formato:
```
ESCALADA · [tipo] · [urgencia]
Owner actual: [agente]
Solicitando ayuda de: [agente/nivel destino]

CONTEXTO:
[3 líneas máx · qué pasó]

QUÉ INTENTÉ:
[acciones · resultado de cada una]

POR QUÉ NO PUEDO RESOLVER:
[razón clara · no "no sé"]

QUÉ NECESITO:
[decisión específica · información · acción]

URGENCIA:
[crítico <2h · alto <24h · normal <48h]

RIESGO SI NO SE RESUELVE:
[concreto · no "el cliente se va a enojar"]
```

3. **Notificar al destinatario** por canal apropiado:
   - Crítico: WhatsApp + Slack al humano
   - Alto: Slack + email
   - Normal: ticket en Airtable + Notion

4. **No abandonar** mientras escala. El owner original sigue siendo responsable hasta que el destinatario confirme recibo.

### Cuando ZEUS recibe escalada:

1. Validar que esté bien clasificado
2. Si requiere humano, escalar de inmediato (no demorar)
3. Si es decisión propia, aplicar `ZEUS-DECIDE` (skill `brainstorming` si necesario)
4. Documentar la decisión en Notion (futuro yo · postmortem)
5. Comunicar la decisión al solicitante con razonamiento

### Cuando humano recibe escalada:

Filtros de "vale la pena interrumpir mi día":
- Crítico: SÍ · respuesta <2h
- Alto: SÍ · respuesta <24h
- Normal: NO si tengo prioridades · respuesta <48h

Si humano está saturado y NO puede atender:
- Comunicarlo claramente al solicitante
- Establecer plazo realista
- Si no puede en plazo, delegar a ZEUS para tomar decisión "best effort" sin humano

---

## ESCALADAS QUE NUNCA SE HACEN

❌ Saltar niveles sin razón (escalar a humano sin pasar por ZEUS si no es crítico)
❌ Escalar sin haber intentado resolver (ZEUS no es la primera opción)
❌ Escalar problemas que se resuelven leyendo documentación
❌ Escalar a humano por urgencia inventada
❌ Escalar sin contexto suficiente (humano pregunta más que decide)

---

## POSTMORTEM DE ESCALADAS FRECUENTES

ZEUS revisa trimestralmente:
- ¿Qué tipos de problemas escalan más?
- ¿Hay patrones que sugieren faltas de skill / agente / SOP?
- ¿Hay escalaciones que pudieron resolverse en nivel inferior?

Output: nuevos skills · ajustes a SOPs · nuevos protocolos de subagentes · capacitación.

---

## REGLAS INQUEBRANTABLES

1. **Crítico sin esperar.** Sistema caído · pérdida de datos · brecha → escalar inmediato.
2. **Estabilizar antes de escalar.** Rollback primero · explicación después.
3. **Cliente furioso · escalar a humano sin demora.** No intentar "manejar".
4. **Decisión >$5K USD · ZEUS mínimo.** Decisión >$30K USD · humano siempre.
5. **Postmortem de cada P0.** No hay excepción.
6. **Documentar la decisión.** Para futuro nosotros y para que los agentes aprendan.
7. **Confirmar handoff.** No abandonar problema hasta que el destinatario confirme.
