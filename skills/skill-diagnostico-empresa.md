---
name: skill-diagnostico-empresa
description: Diagnóstico estructurado de empresa para input [DIAGNÓSTICO] · 7 dimensiones · output ejecutivo
type: flexible
agentes_principales: [ZEUS, ATLAS, HERMES]
---

# Skill — Diagnóstico de Empresa

## Cuándo usar

Cuando un input clasifica como `[DIAGNÓSTICO]` o cuando un cliente dice algo como "queremos digitalizar la empresa", "todo está en papel", "no sabemos por dónde empezar".

NO usar cuando el cliente ya tiene claridad de qué necesita (ahí va `skill-cualificar-lead` + cotización directa).

## Cómo usar

### FASE 1 — Recopilación de datos (entrevista o formulario)

7 dimensiones · 3-5 preguntas por dimensión · 30-45 min total.

**1. NEGOCIO**
- ¿Cuál es el producto/servicio principal?
- ¿Quién es el cliente ideal? (perfil concreto)
- ¿Hace cuánto operan? Tamaño actual (empleados · revenue)
- ¿Cuál es la propuesta de valor diferenciadora?
- ¿Cuál es el sueño a 3 años?

**2. VENTAS**
- ¿Cómo llegan los clientes hoy? (canales en %)
- ¿Cuál es el ciclo de venta?
- ¿Ticket promedio · ticket más alto · ticket más bajo?
- ¿Cuántos leads/mes? Tasa de conversión?
- ¿Quién maneja ventas?

**3. MARKETING**
- ¿Tienen presencia digital? (web · redes · ads)
- ¿Han pagado ads? Resultado?
- ¿Quién maneja marketing? (interno · agencia · nadie)
- ¿Tienen audiencia/lista de email/contactos?

**4. OPERACIONES**
- ¿Cómo gestionan los proyectos/clientes activos?
- ¿Qué procesos están documentados?
- ¿Dónde viven los datos? (Excel · software · papel · cabezas)
- ¿Cuánto tiempo gastan en tareas repetitivas?

**5. TECNOLOGÍA**
- ¿Qué herramientas usan hoy? (lista completa)
- ¿Tienen ERP / CRM / LMS / específico del sector?
- ¿Quién las administra? (interno · proveedor · nadie)
- ¿Hay sistemas legacy?

**6. EQUIPO**
- ¿Cuántas personas? Roles?
- ¿Qué % del equipo es technical / operativo / comercial?
- ¿Hay alguien que toque IA / automation hoy?
- ¿Cuál es la cultura de adopción tecnológica?

**7. FINANZAS**
- ¿Revenue mensual aproximado?
- ¿Margen aproximado?
- ¿Presupuesto disponible para este proyecto?
- ¿Modelo de gasto preferido? (one-time · mensual · híbrido)

### FASE 2 — Análisis (1-2 horas, ZEUS interviene si es N3-N4)

Aplicar la matriz de decisión ZENKAI:
- **Tier sugerido:** ECO · PRO · PREMIUM (basado en finanzas + complejidad)
- **Nivel del proyecto:** N1 · N2 · N3 · N4 (basado en alcance)
- **Celda de matriz:** A-L
- **Sector:** consultar `sectores/<X>.md` para particularidades
- **Agentes prioritarios** del sector

Identificar **3 quick wins** (impacto alto · esfuerzo bajo) y **1 transformación principal**.

### FASE 3 — Output ejecutivo (1 doc · 3-5 páginas)

Estructura del documento de diagnóstico:

```markdown
# DIAGNÓSTICO · [EMPRESA]
Fecha: [YYYY-MM-DD] · Sector: [...] · Tier sugerido: [...]

## RESUMEN EJECUTIVO (3 bullets)
- [hallazgo 1]
- [hallazgo 2]  
- [hallazgo 3]

## ESTADO ACTUAL POR DIMENSIÓN
### Negocio
[2-3 líneas + score 1-10 de madurez digital]

### Ventas
[...]

### Marketing
[...]

### Operaciones
[...]

### Tecnología
[...]

### Equipo
[...]

### Finanzas
[...]

## MATRIZ ZENKAI
- Tier: [...]
- Nivel: [...]
- Celda: [...]
- Agentes prioritarios: [...]

## QUICK WINS (90 días)
1. [...] → impacto: [...] · esfuerzo: [bajo · medio · alto]
2. [...] → impacto: [...] · esfuerzo: [...]
3. [...] → impacto: [...] · esfuerzo: [...]

## TRANSFORMACIÓN PRINCIPAL (12 meses)
[Descripción de qué se logra · cómo · por qué importa]

## RUTAS PROPUESTAS

### Ruta A — ECO (mínimo viable)
- Stack: [...]
- Tiempo: [...]
- Inversión: $[X] setup + $[Y]/mes
- Lo que NO se incluye: [...]

### Ruta B — PRO (recomendada)
- Stack: [...]
- Tiempo: [...]
- Inversión: $[X] setup + $[Y]/mes
- Capacidades adicionales: [...]

## RECOMENDACIÓN ZENKAI
[1 párrafo · ruta sugerida · por qué]

## PRÓXIMO PASO
[1 acción · responsable · fecha]
```

## Reglas inquebrantables

- **Nunca** entregar el diagnóstico como respuesta inmediata. Mínimo 24h entre entrevista y entrega (señal de rigor).
- **Nunca** prometer en el diagnóstico lo que no sabemos resolver. Mejor decir "esto requiere especialista externo".
- **Nunca** sobrevender la transformación. Realismo > ilusión.
- **Siempre** dos rutas. Nunca una sola.
- **Siempre** un quick win en los próximos 30 días (genera momentum).
- **Siempre** documentar el diagnóstico en Notion del cliente (futuro fundamental).

## Output esperado

1. Documento de diagnóstico (Markdown · luego PDF con APOLLO)
2. Carpeta `clientes/<cliente>/diagnostico/` con respuestas brutas
3. Cotización preliminar (con `skill-calcular-precio`)
4. Plan de quick wins
5. Próximo paso accionable
