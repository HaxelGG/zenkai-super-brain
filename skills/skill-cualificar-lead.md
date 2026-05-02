---
name: "Cualificar Lead"
slug: skill-cualificar-lead
agentes_que_usan: [HERMES]
tipo: rigid
---

# Skill — Cualificar Lead

## Cuándo usar

Cada vez que entra un lead nuevo a HERMES (vía ARES, vía orgánico, vía referido, vía web). Antes de enviar cualquier respuesta automatizada o agendar llamada con humano.

## Cómo usar

### Paso 1 — Recopilar datos básicos

Mínimo necesario antes de scoring:
- Nombre · empresa · email · teléfono
- Sector
- Ubicación / mercado
- Mensaje original textual
- Source (Meta · Google · referido · orgánico · otro)
- Fecha y hora de entrada

Si falta algo crítico (ej. no hay sector ni descripción del negocio), el subagente HERMES-WA pregunta UNA cosa de forma conversacional.

### Paso 2 — Aplicar rúbrica de scoring

| Criterio | Cuándo aplica | Puntos |
|----------|---------------|--------|
| Presupuesto declarado o claramente estimable | Lead dice número o se infiere por su empresa | +2 |
| Decision-maker (CEO · founder · dueño) | No es intermediario | +2 |
| Urgencia real (necesita en <30 días) | Por mensaje o pregunta directa | +2 |
| Sector que sabemos resolver | E-commerce · salud · servicios · educación · inmobiliaria · restaurantes · retail | +2 |
| Empresa con +6 meses operando | Verificable en redes / web | +1 |
| Mercado prioritario | LATAM · España · USA | +1 |
| Pide gratis o "intercambio" | Por testimonios · "ayúdame y luego pagamos" | -3 |
| Ya intentó con otra agencia y "no funcionó" | Sin profundidad de razón | -3 |
| Sin email corporativo (gmail/hotmail personal) | Y empresa no es muy nueva | -2 |
| Mensaje claramente copy-paste (responde a 10 agencias) | Frase tipo "envíame tu portfolio y precios" sin contexto | -2 |

**Score máximo:** 10 (caso ideal de cierre rápido alto-ticket)
**Score mínimo:** -10 (descarte inmediato sin perder tiempo)

### Paso 3 — Clasificar y enrutar

| Score | Acción | Velocidad |
|-------|--------|-----------|
| ≥ 6 | Llamada con humano (HERMES-CLOSE prepara brief) | <2h en horario laboral |
| 4-5 | Nurturing automatizado (secuencia D+1/3/7/14) | Mensaje inicial inmediato |
| 1-3 | Email cortés explicando que no es match · archivar | Inmediato |
| ≤ 0 | Archivar sin respuesta o respuesta genérica | - |

### Paso 4 — Generar brief para humano (si score ≥6)

```
LEAD: [nombre] · [empresa] · [sector] · [ubicación]
SCORE: [X]/10
SOURCE: [...]

CONTEXTO RÁPIDO (3 líneas máx):
[descripción del negocio]

DOLOR DECLARADO:
"[cita textual del lead]"

PRESUPUESTO:
- Declarado: $[X] o "no declarado"
- Estimado por nosotros: $[Y] (basado en sector + tamaño)

OBJECIONES PROBABLES:
1. [...] → respuesta sugerida: [...]
2. [...] → respuesta sugerida: [...]
3. [...] → respuesta sugerida: [...]

RUTA SUGERIDA (de matriz ZENKAI):
- Tier: [Eco · Pro · Premium]
- Nivel: [...]
- Celda: [...]

PROPUESTA SUGERIDA:
- Ruta A (Eco): $[X] · [stack]
- Ruta B (Pro): $[Y] · [stack]
- Recomendación: [...]

PRÓXIMO PASO POST-LLAMADA:
[Enviar propuesta · agendar follow-up · cierre directo]
```

### Paso 5 — Loguear en Airtable

Tabla `leads` (base VENTAS):
- ID lead · datos básicos · score · source · sector
- Resultado (descalificado · nurturing · llamada agendada · cerrado · perdido)
- Razón si descalificado (alimenta análisis de ARES y ZEUS)
- Fecha primera respuesta (medir SLA)
- Owner (quién hizo la llamada si aplica)

## Output esperado

```
LEAD CUALIFICADO

[nombre] · [empresa] · [sector] · score [X]/10

ACCIÓN:
🟢 Pasar a humano · brief abajo
🟡 Nurturing automatizado · secuencia D+1/3/7/14 activada
🔴 Descalificar · email cortés enviado

[Brief si aplica]
```

## Reglas inquebrantables

- **Nunca** dar precio por escrito antes de la llamada de descubrimiento (si score ≥6).
- **Nunca** respuesta genérica "te paso info por email" — siempre personalizada.
- **Nunca** descalificar sin loguear razón (perdemos aprendizaje).
- **Siempre** SLA <10 min en horario laboral (mensaje inicial automático ok).
- **Siempre** loguear todos los leads, incluyendo los descalificados.
- **Siempre** humano cierra · IA cualifica.

## Casos edge

- **Lead con score 5-6:** evaluar señales cualitativas (entusiasmo · claridad · respeto). En empate, mejor agendar llamada que descartar.
- **Lead que ofrece intercambio (testimonio · exposure · etc.):** -3 directo, no aceptar.
- **Lead que dice "necesito algo barato":** preguntar presupuesto exacto. Si <costo mínimo del Tier Eco, descalificar con cordialidad.
- **Lead enviado por cliente actual (referido):** +3 puntos extra por confianza pre-construida.
- **Cliente actual que pide upsell:** no aplica este skill — flujo distinto en `workflow-nuevo-cliente.md` o atención por ECHO + HERMES directo.
