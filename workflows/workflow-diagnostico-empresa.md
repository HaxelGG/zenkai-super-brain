---
name: "Diagnóstico de Empresa"
slug: workflow-diagnostico-empresa
tiempo_objetivo: "1-3 días"
agentes_principales: [ZEUS, ATLAS, ORACLE, NEXUS]
categoria: delivery
---

# WORKFLOW · Diagnóstico de Empresa
## De primera llamada a propuesta basada en diagnóstico

**Tiempo objetivo:** 5-10 días desde primera llamada
**Agentes principales:** HERMES → ZEUS → LEX → ORACLE
**Tipo de input que activa este workflow:** `[DIAGNÓSTICO]`

---

## DIAGRAMA DE FLUJO

```
[Cliente solicita diagnóstico o complejidad N3-N4 detectada]
    ↓
HERMES llamada inicial (validar fit)
    ↓
ZEUS-DECIDE: ¿vale la pena hacer diagnóstico?
    ↓
    ├─ NO: respuesta cordial · derivar
    └─ SÍ: CONTINUAR ↓
    ↓
Cobrar fee de diagnóstico (opcional · ver "modelo de cobro" abajo)
    ↓
Sesión de entrevista (90 min · 7 dimensiones)
    ↓
ZEUS + ATLAS analizan (24-48h · skill-diagnostico-empresa)
    ↓
Documento de diagnóstico (5 páginas)
    ↓
Llamada de devolución (60 min)
    ↓
Propuesta basada en diagnóstico (LEX-PROPOSAL)
    ↓
Activar workflow-nuevo-cliente.md desde PASO 8 (firma)
```

---

## PASOS DETALLADOS

### PASO 1 · Validar fit del diagnóstico
**Owner:** HERMES
**Tiempo:** llamada de 20 min

Preguntar:
- Tamaño de empresa (>10 empleados típicamente justifica diagnóstico)
- Etapa de complejidad percibida
- ¿Saben ya qué necesitan? Si SÍ → no es diagnóstico, es cotización directa
- ¿Aceptan pagar por el diagnóstico? (señal de seriedad)

### PASO 2 · Decisión de hacer diagnóstico
**Owner:** ZEUS-DECIDE

Criterios para decir SÍ:
- Empresa >10 empleados o >$50K USD/mes revenue
- Sector compatible (no super-regulado donde no jugamos)
- Cliente acepta pagar fee de diagnóstico
- Mercado prioritario (LATAM, España, USA)
- Fit con Capa 1 actual de ZENKAI

### PASO 3 · Modelo de cobro del diagnóstico

Tres opciones:

**A) Diagnóstico pagado (default para empresas medianas+):**
- $300-1,500 USD según tamaño de empresa
- Si firman propuesta a continuación, descontable del setup
- Filtra a clientes serios

**B) Diagnóstico gratis con compromiso (default para Eco/PRO):**
- Sin costo, pero el cliente firma carta de intención de revisar la propuesta
- Más bajo barrera de entrada

**C) Diagnóstico bundled (Premium / enterprise):**
- Incluido en proyecto grande
- Solo después de pre-firma de intención

### PASO 4 · Sesión de entrevista
**Owner:** Humano (Perfil 1 + Perfil 2 ideal) + ZEUS
**Tiempo:** 90 min

Estructura:
- 0-15 min · Contexto y rapport
- 15-75 min · 7 dimensiones (skill `skill-diagnostico-empresa`):
  - Negocio · Ventas · Marketing · Operaciones · Tecnología · Equipo · Finanzas
- 75-90 min · Preguntas del cliente · próximos pasos

Modalidad: presencial si cliente local · Google Meet sino · grabar para análisis

### PASO 5 · Análisis
**Owner:** ZEUS-DECIDE + ATLAS
**Tiempo:** 24-48h

- Aplicar matriz ZENKAI (tier · nivel · celda)
- Identificar 3 quick wins (alto impacto · bajo esfuerzo)
- Identificar 1 transformación principal (12 meses)
- Definir agentes prioritarios y stack
- ORACLE-PRICE prepara cotización

Si identificamos algo fuera de nuestro alcance (ej. consultoría estratégica de fusión, tema legal complejo), recomendar partner externo · honestidad > venta forzada.

### PASO 6 · Documento de diagnóstico
**Owner:** ZEUS + APOLLO-TEMPLATE
**Tiempo:** 1 día

5 páginas con:
1. Resumen ejecutivo (3 bullets)
2. Estado actual por dimensión (con score 1-10 cada una)
3. Matriz ZENKAI (tier · nivel · celda · agentes)
4. Quick wins (90 días)
5. Transformación principal (12 meses)
6. Rutas A y B
7. Recomendación
8. Próximo paso

PDF profesional con identidad visual ZENKAI.

### PASO 7 · Llamada de devolución
**Owner:** Humano (Perfil 1 + Perfil 2)
**Tiempo:** 60 min

Estructura:
- 0-15 min · Walk-through del documento
- 15-30 min · Q&A sobre el diagnóstico
- 30-50 min · Walk-through de las dos rutas
- 50-60 min · Recomendación + próximos pasos

NO insistir en cierre en esta llamada. Dar 5-7 días para que el cliente decida.

### PASO 8 · Propuesta basada en diagnóstico
**Owner:** LEX-PROPOSAL
**Tiempo:** <48h post-llamada de devolución

Diferencia con propuesta normal:
- Hace referencia al diagnóstico (datos del propio cliente)
- Más larga y detallada (10-15 páginas vs 5 estándar)
- Incluye plan de fases (no solo proyecto monolítico)

### PASO 9 · Seguimiento y cierre
**Owner:** HERMES-FOLLOW

- D+3 post-propuesta · "¿pudiste revisar?"
- D+7 · "agendamos llamada para resolver dudas?"
- D+14 · vence en 7 días · ofrecer extender
- D+21 · vencida

### PASO 10 · Si firma
- Continuar con `workflow-nuevo-cliente.md` desde PASO 10 (contrato)
- Diagnóstico cobrado (si aplica) descontado del setup

---

## KPIs DEL WORKFLOW

| KPI | Objetivo |
|-----|----------|
| Diagnóstico → propuesta enviada | 100% |
| Diagnóstico → cierre | >50% (alto porque pre-cualifica fuerte) |
| Tiempo total | <14 días desde primera llamada |
| Margen del diagnóstico (si pagado) | >70% |
| NPS post-diagnóstico | >8 incluso si no firma |

---

## REGLAS INQUEBRANTABLES

- **Nunca** hacer diagnóstico gratis en empresa >50 empleados (señal de poco valor).
- **Nunca** prometer en diagnóstico lo que no sabemos resolver.
- **Nunca** entregar el diagnóstico el mismo día de la entrevista (mínimo 24h, mejor 48h, señal de rigor).
- **Siempre** entregar diagnóstico aunque cliente no firme propuesta (es valor independiente).
- **Siempre** dejar puerta abierta si no firma.

---

## CASOS EDGE

- **Empresa que después del diagnóstico decide NO digitalizar:** archivar con respeto, posible referido futuro.
- **Empresa que pide "ajustes al diagnóstico":** una ronda gratis · cobrar siguientes.
- **Empresa que pide compartir el diagnóstico con su comité:** validar quién lo recibe · el diagnóstico es confidencial · NDA si necesario.
- **Diagnóstico revela que necesitan algo fuera de Capa 1 ZENKAI:** ser honestos · derivar · buena fe genera referidos.
