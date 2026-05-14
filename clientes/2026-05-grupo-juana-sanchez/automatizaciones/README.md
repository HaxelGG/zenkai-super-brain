# /automatizaciones
## Documentación de flows Make/n8n y agentes IA de [CLIENTE_NOMBRE]

Cada automatización en producción debe tener un archivo `.md` aquí con su documentación completa. Es responsabilidad de NEXUS mantenerlo actualizado.

## Convención de nombres

- `flow-<numero>-<descripcion-corta>.md`

Ejemplos:
- `flow-01-lead-formulario-a-airtable.md`
- `flow-02-recordatorio-cita-d-1.md`
- `flow-03-recuperacion-carrito-3-emails.md`
- `agente-01-bot-soporte-whatsapp.md`

## Estructura de cada archivo de flow

```markdown
# Flow [N] · [Descripción]

## Metadata
- Plataforma: [Make · n8n · custom]
- ID del escenario: [...]
- Estado: [PRODUCCION · STAGING · DESARROLLO]
- Activo desde: [fecha]
- Última modificación: [fecha · qué cambió]
- Owner técnico: [persona / agente]

## Disparador
[Webhook · cron · trigger Airtable · etc.]

## Pasos
1. [Módulo / acción / dato in / dato out]
2. [...]

## Variables de entorno
- [VAR_1]: [descripción]

## Operaciones por ejecución: [N]
## Ejecuciones esperadas/mes: [M]

## Manejo de errores
- Paso N: [acción si falla · alerta a quién · canal]

## Logging
- Tabla destino: [Airtable base/tabla]

## Test
- Caso feliz: [...]
- Edge cases conocidos: [...]
- Frecuencia de re-test: [mensual]

## Costos
- Make ops: $[X]/mes
- API tokens: $[Y]/mes
- Total: $[Z]/mes

## Diagrama
[mermaid o link a screenshot del flow]
```

## Estructura para agentes IA del cliente

```markdown
# Agente [N] · [Nombre del agente custom]

## Metadata
- Modelo: [Sonnet 4.6 · Haiku 4.5 · Opus 4.7]
- Estado: [PRODUCCION · etc.]
- Tasks-per-day esperados: [N]
- Costo de tokens estimado: $[X]/mes

## System prompt
```
[prompt completo del agente]
```

## Tools disponibles
- [tool_1]: [...]
- [tool_2]: [...]

## Eval set
[Casos felices y edge cases con respuestas esperadas para regresión]

## Memoria
[stateless · vector DB · airtable record per session]

## Métricas a monitorear
- Latencia p95: <[X]s
- Error rate: <[%]
- Costo por interacción: <$[X]
- CSAT (si aplica): >[X]
```

## Reglas

- **Nunca** poner credenciales en estos archivos. Variables de entorno o vault.
- **Nunca** desplegar en producción sin documentación aquí.
- **Siempre** actualizar al modificar (NEXUS-MONITOR puede alertar si pasa >30 días sin update y el flow tuvo cambios).
- **Siempre** diagrama (Mermaid mejor que screenshot porque versiona limpio).
