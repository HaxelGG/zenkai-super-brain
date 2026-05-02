---
name: skill-calcular-precio
description: Aplicar la fórmula ZENKAI de precio (costo trimestral × 2) con ajuste por mercado · output COP+USD
type: flexible
agentes_principales: [ORACLE]
---

# Skill — Calcular Precio

## Cuándo usar

**Siempre** que se vaya a cotizar un proyecto, antes de presentar precio al cliente. Cualquier agente puede invocar este skill, pero ORACLE es el dueño.

## Cómo usar

### Paso 1 — Listar herramientas del proyecto (TODAS)

Tabla obligatoria:

| Herramienta | Plan | Costo USD/mes | Justificación |
|-------------|------|---------------|---------------|
| Make | [Free / Core / Team / Business] | $[X] | [por qué este plan] |
| Airtable | [Free / Plus / Team / Business] | $[X] | [...] |
| WhatsApp Cloud API | [-] | $[X] estimado | [N mensajes/mes] |
| Anthropic API | [Sonnet / Opus / Haiku] | $[X] estimado | [N tokens/mes] |
| ... | ... | ... | ... |

**Suma:** Total mensual = $[Y] USD

### Paso 2 — Costo trimestral

```
Costo trimestral = Total mensual × 3
```

### Paso 3 — Precio mínimo base

```
Precio mínimo base = Costo trimestral × 2
```

Este es el **piso absoluto** para mercado LATAM.

### Paso 4 — Ajuste por mercado

| Mercado | Multiplicador |
|---------|---------------|
| Colombia / LATAM | × 1.0 |
| México | × 1.2 |
| España | × 1.8 a 2.5 |
| Resto Europa | × 2.0 a 3.0 |
| USA / Canadá | × 3.0 a 5.0 |

Aplicar el multiplicador al precio mínimo base. El **rango** del multiplicador depende de:
- Sector (B2B alto-ticket → extremo superior; B2C masivo → extremo inferior)
- Reputación del cliente (marca conocida paga más)
- Urgencia del proyecto (urgente paga más)
- Diferencial de ZENKAI vs competencia local del cliente

### Paso 5 — Sumar componente humano (si aplica)

Si el proyecto requiere >20h de trabajo humano:

```
Costo humano = horas × tarifa humana
Tarifa humana (LATAM): $20-80/h según rol (ver agentes/HIVE.md tabla)
```

Margen sobre el costo humano: ×2 mínimo.

### Paso 6 — Validar margen

```
Margen = (Precio final - Costo herramientas - Costo humano costo) / Precio final
```

**Mínimo aceptable: 60%**.
Si <60%, escalar a ZEUS antes de presentar.

### Paso 7 — Definir modelo de cobro

Tres modelos canónicos:

**A) Setup fee único**
- Apropiado para: proyectos N1-N2 que no requieren mantenimiento continuo
- Ejemplo: landing page + integración WA + email setup

**B) Setup + retainer mensual**
- Apropiado para: proyectos con sistemas en producción que requieren mantenimiento
- Setup ≈ 1-3× retainer mensual
- Retainer mensual ≈ costo herramientas × 1.5-2.0

**C) Solo retainer mensual (sin setup)**
- Apropiado para: clientes recurrentes establecidos
- Permite cliente entrar sin barrera y nosotros asegurar revenue recurrente

### Paso 8 — Términos de pago sugeridos

| Tipo de proyecto | Términos default |
|------------------|------------------|
| Setup <$2K USD | 100% al inicio |
| Setup $2K-10K USD | 50% al inicio · 50% a entrega |
| Setup >$10K USD | 30% al inicio · 30% a hito 1 · 40% a entrega |
| Retainer mensual | Anticipado mes a mes (día 1 del mes) |
| Enterprise | Negociable, default neto 15-30 días |

## Output esperado

```markdown
COTIZACIÓN · [PROYECTO]
Cliente: [...] · Sector: [...] · Tier: [...] · Mercado: [...]

HERRAMIENTAS:
[tabla completa]
Total herramientas: $[X] USD/mes

OPERACIONES Y APIs:
[tabla con tokens · ops · llamadas]
Total APIs: $[Y] USD/mes

COSTO MENSUAL TOTAL: $[X+Y] USD
COSTO TRIMESTRAL: $[(X+Y)×3]
PRECIO BASE LATAM: $[(X+Y)×6]

AJUSTE POR MERCADO ([mercado] × [factor]):
PRECIO SETUP SUGERIDO: $[Z] USD = $[Z×4500] COP

HORAS HUMANAS (si aplica):
[N horas] × $[tarifa] × 2 = $[H]

PRECIO FINAL SUGERIDO:
- Setup: $[Z + H] USD = $[..] COP
- Retainer mensual sugerido: $[(X+Y) × 1.7] USD/mes

MARGEN ESTIMADO: [%]
SEMÁFORO: 🟢 (>60%) · 🟡 (50-60%) · 🔴 (<50%)

TÉRMINOS DE PAGO: [...]

VALIDEZ DE LA COTIZACIÓN: [N días]
```

## Reglas inquebrantables

- **Nunca** dar precio sin haber listado todas las herramientas.
- **Nunca** aceptar margen <60% sin aprobación de ZEUS.
- **Nunca** ofrecer descuento >20% sin compensación (volumen · exclusividad · caso de estudio).
- **Siempre** presentar precio en COP **y** USD.
- **Siempre** dar dos rutas (ECO + PRO) salvo que el cliente haya pre-definido tier.
- **Siempre** indicar validez de la cotización (15-30 días default).

## Casos edge

- **Cliente paga en otra moneda (EUR, MXN, ARS):** convertir desde USD a tasa del día + 5% de buffer.
- **Costos de API impredecibles:** usar 90 percentil del rango estimado, no el promedio.
- **Cliente quiere descuento por volumen (>3 proyectos):** aceptar hasta 15% de descuento sobre setup, 0% en herramientas (mantener margen).
- **Cliente quiere "todo incluido" sin separar setup/retainer:** calcular igual con la fórmula y luego presentar como precio único, mantener margen.
