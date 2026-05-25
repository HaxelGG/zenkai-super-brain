---
tipo: hormozi-stage-assessment
skill: skill-hormozi-roadmap
fase_ejecutada: "Fase 1 · Diagnóstico de etapa (baseline)"
semana_iso: 2026-W21
fecha: 2026-05-20
agente_dueño: ZEUS
stage_diagnosticado: 1
es_linea_base: true
---

# HORMOZI · STAGE ASSESSMENT (BASELINE) · SEMANA 21

> **Primer auto-diagnóstico formal del roadmap a $100K.** Esta es la línea base contra la
> cual se miden las próximas 7 semanas (W21 → ~W28), hasta llegar a España con el primer
> cliente **cerrado y cobrado**. Ejecutado por ZEUS bajo `skill-hormozi-roadmap` · Fase 1.

| Campo | Valor |
|-------|-------|
| Fecha | 2026-05-20 (miércoles) |
| Semana ISO | 2026-W21 |
| Stage actual | **1 · Monetize** (con distorsión severa de etapa) |
| Días hasta mudanza España (2026-06-02) | **13** |
| Días hasta cierre 2026-12-31 | **225** |
| Revenue YTD | **$0 / $100,000 USD** (falta $100K) |
| Clientes pagando | **0** |
| Overhead operativo | $118.33/mes · trimestral ~$355 · piso §4 (×2) ~$710 |

---

## PARTE 1 · DIAGNÓSTICO DE ETAPA (FASE 1)

### Auto-test (respondido con evidencia real, no supuestos)

**Test A — ¿Stage 0 (Improvise)?** → **NO.**
- El producto existe y es demostrable end-to-end: landing comercial live (`zenkai-web-rho.vercel.app`), demo `/api/lead-demo` con persistencia Airtable, smoke test producción verde 2026-05-13. No estamos en Stage 0.

**Test B — ¿Stage 1 (Monetize)?** → **SÍ (las tres señales).**
- ✅ Producto demostrable pero **$0 facturados consistentemente** (`ESTADO-ACTUAL.md`: "Facturado 2026: $0", "Clientes activos: 0").
- ✅ La primera venta **aún no ocurre**. El único proyecto real (Grupo Juana Sánchez) se entregó ~85% **sin propuesta, sin contrato y sin inversión acordada** (`clientes/2026-05-grupo-juana-sanchez/propuesta.md` y `contrato.md`: ambos "N/A").
- ✅ Somos **2 founders sin freelancers regulares**.

**Test C — ¿Stage 2 (Advertise)?** → **NO.**
- ❌ 0 clientes que hayan pagado precio completo (se requieren ≥3).
- ❌ 0 freelancers fijos.
- ❌ El problema dominante NO es "flujo inconsistente de clientes" — es que **aún no hemos cobrado a nadie**.

### Veredicto

> **STAGE 1 · MONETIZE — con distorsión severa de etapa.**

La distorsión tiene dos caras, ambas documentadas:

1. **Infraestructura sobre-construida (comportamiento Stage 3-4):** panel desplegado (37 páginas), Claude API en producción (clasificador + protocolo), 9 bases Airtable, demo end-to-end con rate-limit + captcha + email, contrato master + template de garantía 30 días, Cal.com, CVE mitigada. Esto es maquinaria de una agencia que ya factura — construida antes de la primera venta.

2. **Entrega regalada (comportamiento Stage 0):** a un cliente real en España (Grupo Juana Sánchez, Madrid) se le entregó una landing editorial premium en Next.js 15 (~85%, desplegada) **sin precio, sin propuesta, sin contrato y sin cobro**. En lenguaje de Hormozi: trabajo unscalable de altísima calidad — pero sin monetizar, que es justo lo único que define el Stage 1.

**Regla inquebrantable #5 aplicada:** *"Sin pagos cobrados, no es venta."* Por tanto, pese a tener un proyecto real desplegado en el mercado meta (España), el contador de ventas sigue en **0**. El delivery existe; la monetización no.

**Regla #1 (la trampa #1 de muerte de agencias jóvenes):** querer hacer Stage 3 (sistemas + procesos) antes de graduarse de Stage 1 (primera venta cobrada). Estamos exactamente ahí. Todo lo construido en Capa 1 es excelente, pero a partir de hoy es **procrastinación productiva** hasta que entre el primer dinero al banco.

---

## PARTE 2 · ESTADO DE LAS 9 DIMENSIONES (snapshot baseline)

| # | Dimensión | Semáforo | Estado (1 línea) |
|---|-----------|----------|------------------|
| 01 | Producto | 🟢 | V1 técnico sobra; falta empaquetar UN entregable vendible con precio cerrado (no toda la Capa 1). |
| 02 | Marketing | 🔴 | 0 outreach 1:1 documentado · 0 cadencia de contenido · cero pipeline activo de nuevos leads. |
| 03 | Ventas | 🔴 | 0 propuestas formales enviadas · 0 llamadas CLOSER · script CLOSER aún no documentado en HERMES.md. |
| 04 | Customer Service | 🟡 | 1 cliente real atendido (J. Sánchez) con servicio unscalable correcto, pero sin marco comercial (NPS/extras sin medir). |
| 05 | Tecnología | 🟢 | Stack ECO $118/mes, por debajo del límite. Disciplina correcta salvo por sobre-construcción de features. |
| 06 | Getting Help | 🔴 | 0 freelancers pre-cualificados · sin brief-template · sin lista lista para cuando llegue la demanda. |
| 07 | Managing Money | 🔴 | **CRÍTICO.** Sin procesador de pagos probado con cobro real · sin cuenta empresarial confirmada · sin tracker de cobros operando (FINANZAS·ingresos sembrada pero $0 cobrado). |
| 08 | Protecting Yourself | 🟡 | Contrato master + garantía 30d redactados (LEX), pero **ningún contrato firmado** y estructura legal CO/ES sin cerrar a 13 días de la mudanza. GDPR pendiente en la landing de J. Sánchez. |
| 09 | Human Side | ⚪ | Sin datos — requiere input honesto del founder en el ritual del lunes. [confirmar founder] |

**Resumen:** 4 🔴 (Marketing, Ventas, Getting Help, Managing Money) → según la regla de escalada del skill, **≥3 dimensiones en 🔴 dispara escalada a ZEUS**. Esta sesión ES esa escalada. El patrón es inequívoco: **todo lo construido es entrega/tecnología; nada es captación ni cobro.**

---

## PARTE 3 · LÍNEA BASE NUMÉRICA (punto de partida W21)

| Métrica | Valor hoy (baseline) | Meta de referencia |
|---------|----------------------|--------------------|
| Revenue YTD | $0 | $100,000 USD a 2026-12-31 |
| Clientes pagando | 0 | ≥3 para graduar a Stage 2 |
| Proyectos entregados sin cobrar | 1 (J. Sánchez) | 0 — monetizar o cerrar |
| Propuestas formales enviadas | 0 | — |
| Llamadas de venta (CLOSER) | 0 | 10 para test de salida de Ventas |
| Procesador de pagos probado ($1 real) | ❌ No | ✅ antes de 2026-06-15 |
| Contratos firmados | 0 | ≥1 con la primera venta |
| Días a España (mudanza) | 13 | — |
| Días a "España con 1er cliente cerrado" | ~49 (≈W28) | objetivo del founder |

---

## LA UNA COSA DE LA SEMANA

> **Convertir Grupo Juana Sánchez en la PRIMERA VENTA COBRADA.**
> Ya está ~85% entregado en el mercado meta correcto (España). No hay palanca mayor: el
> producto ya está en sus manos. Falta poner precio, formalizar y **cobrar**. Pasar de
> "$0 con un regalo desplegado" a "$X en el banco con contrato firmado".

**Responsable:** Jordy (founder) + HERMES (cierre) + LEX (contrato) + ORACLE (precio).
**Deadline propuesto:** propuesta + precio enviados antes de la mudanza (**2026-06-02**); cobro del setup antes de **2026-06-15** (alineado con el hito de pagos del skill).

### Dos rutas (Regla #10)

**RUTA A — Mínimo viable de la semana (~5 h)**
1. ORACLE aplica `skill-calcular-precio` al alcance ya entregado de J. Sánchez → rango de precio defendible (setup retroactivo + opción de retainer/mantenimiento). *(~1.5 h)*
2. HERMES redacta propuesta de regularización usando `skill-generar-propuesta` (encuadre: "lo entregado vale X; formalizamos para protegerte a ti y a nosotros — GDPR incluido"). *(~2 h)*
3. Activar UN procesador de pagos (Wise o Stripe según jurisdicción) y correr el cobro de prueba de $1 real. *(~1.5 h)*

**RUTA B — Semana completa (~25 h)**
- Todo lo de Ruta A, **más:**
4. LEX cierra el contrato de servicios v1 firmable + DPA GDPR para J. Sánchez (cliente español). *(~4 h)*
5. HERMES documenta el script **CLOSER** en `agentes/HERMES.md` y hace 3 role-plays antes de la llamada de cierre. *(~4 h)*
6. ORACLE deja operativo el tracker de cobros en Airtable FINANZAS·ingresos (cliente · factura · vence · estado · USD/EUR). *(~3 h)*
7. ARES arma lista de 30 contactos calientes e-commerce/retail en España para outreach 1:1 post-mudanza (siembra el pipeline que hoy está en 🔴). *(~9 h)*

**Recomendación ZEUS:** Ruta A esta semana (quedan 13 días a la mudanza; el ancho de banda está comprometido por la logística del traslado). Empujar 4–6 de Ruta B a W22 ya instalado en España. Lo no-negociable de W21: **precio enviado + pago de prueba pasado.**

---

## LO QUE NO HACEMOS ESTA SEMANA (disciplina de etapa)

- ❌ Activar Turnstile, helper de env tipado, páginas `/sectores/<slug>`, domain-swap apex, y demás features de Capa 1. Todo eso es Stage 3-4 disfrazado de progreso. **Stack y features congelados hasta cliente #3** (excepto pagos y firma electrónica — Regla #6).
- ❌ Construir más automatizaciones internas, nuevas bases o nuevos endpoints.
- ❌ Buscar el "segundo nicho" (Clínicas) ni diversificar oferta. Regla #2: doblar sobre lo que funciona; aún no tenemos un V1 *vendido*.

---

## DECISIONES PENDIENTES (con dueño)

1. **Precio retroactivo de J. Sánchez** — ¿setup puntual, o setup + retainer de mantenimiento? → ORACLE propone, ZEUS decide.
2. **Jurisdicción de cobro** — ¿se cobra desde Colombia (SAS/persona natural) o se espera a estar en España? Afecta procesador y fiscalidad. → LEX + founder, urgente por los 13 días.
3. **Estructura legal CO/ES** — definir antes de facturar en euros. → LEX + contador.

---

## ALERTAS DEL FOUNDER (Human Side)

⚪ **Sin registrar.** El skill pide 3 líneas honestas el viernes (qué ganamos · qué nos saturó · qué decisión necesitamos el lunes). A 13 días de un cambio de país, la dimensión 09 es la más probable de entrar en 🔴 sin avisar.
**Acción:** Jordy completa estas 3 líneas y ZEUS las revisa en el ritual del lunes (2026-05-25, W22). Regla #8: si hay saturación, esa semana no se toman decisiones grandes — solo se ejecuta lo ya planeado.

---

## ESCALADAS DISPARADAS POR ESTE DIAGNÓSTICO

- **→ ZEUS:** ≥3 dimensiones en 🔴 (son 4). Esta sesión es la escalada; la respuesta es "LA UNA COSA" de arriba.
- **→ ORACLE:** revenue vs objetivo desviado >25% (estamos en $0 a 5 meses del cierre). Acción: precio de J. Sánchez + tracker de cobros.
- **→ HERMES:** >30 días sin propuesta formal enviada (de hecho: 0 históricas). Acción: propuesta de regularización + script CLOSER.

---

ZENKAI Growth Systems · Hormozi Stage Assessment · Baseline 2026-W21
"El delivery ya existe. Falta el dinero en el banco. Esa es toda la distancia entre Stage 0 y Stage 1 ganador."
