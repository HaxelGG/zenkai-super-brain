---
name: skill-generar-propuesta
description: Estructura de propuesta comercial profesional · listo para PDF · 8 secciones · variables marcadas
type: flexible
agentes_principales: [LEX, HERMES]
---

# Skill — Generar Propuesta Comercial

## Cuándo usar

Después de la llamada de descubrimiento con cliente con score ≥6. Antes, NUNCA (es regla inquebrantable de HERMES).

LEX-PROPOSAL es el dueño técnico, HERMES es quien la entrega y le da seguimiento.

## Cómo usar

### Paso 1 — Verificar prerequisitos

Antes de generar la propuesta:
- ✅ Cotización validada por ORACLE (`skill-calcular-precio`)
- ✅ Tier y nivel definidos
- ✅ Sector identificado y módulo activado (`sectores/<X>.md`)
- ✅ Brief del cliente claro (de la llamada)
- ✅ Datos del cliente: razón social · NIT/Tax ID · representante legal · email · dirección

### Paso 2 — Estructura de 8 secciones

```markdown
# PROPUESTA COMERCIAL
## ZENKAI Growth Systems → [Cliente]
Fecha: [YYYY-MM-DD] · Validez: [N días, default 21]

---

## 01 · RESUMEN EJECUTIVO
[3-5 bullets de lo que reciben + el resultado esperado a 90 días]
- [Capacidad 1]
- [Capacidad 2]
- [Capacidad 3]
- Inversión total: $[X] USD
- Plazo: [N semanas]

---

## 02 · DIAGNÓSTICO (DE LA LLAMADA)
**Su situación actual:**
[2-3 párrafos · captura del dolor en sus palabras]

**Lo que está costando hoy:**
- [Costo 1: tiempo · oportunidad · dinero]
- [Costo 2]
- [Costo 3]

---

## 03 · PROPUESTA DE SOLUCIÓN

### Componentes
[Lista de departamentos / agentes activos en este proyecto]

#### [Componente 1 - ej. "Captación con ARES"]
**Qué hace:** [1 párrafo]
**Qué incluye:**
- [✓ Item]
- [✓ Item]
- [✓ Item]

#### [Componente 2 - ej. "WhatsApp con HERMES"]
[mismo formato]

#### [Componente 3]
[mismo formato]

### Lo que NO incluye este alcance
[Sección clave para evitar disputas. Lista concreta:]
- [Item explícito que NO está incluido]
- [Item explícito que NO está incluido]

---

## 04 · CRONOGRAMA

| Semana | Hito | Entregable | Owner |
|--------|------|------------|-------|
| 1 | Kickoff + brief detallado | Doc de alcance final firmado | ATLAS |
| 2 | Diseño + setup técnico | Mockups · acceso a herramientas | APOLLO + NEXUS |
| 3-4 | Build | Sistema en staging | NEXUS · APOLLO · FORGE |
| 5 | QA + capacitación | Sistema en producción · Loom training | ATLAS |
| 6 | Lanzamiento | Sistema activo · primer reporte | TODOS |

---

## 05 · INVERSIÓN

### Modelo: [Setup + Retainer · Setup único · Solo retainer]

**Setup (one-time):**
$[X] USD = $[X × 4500] COP aproximado
- Pagable: [50/50 · 30/30/40 · 100% al inicio]

**Retainer mensual** (si aplica):
$[Y] USD/mes = $[Y × 4500] COP/mes
- Mes 1 pagable junto con primer pago de setup
- Meses subsiguientes: día 1 de cada mes

**Presupuesto adicional sugerido (no facturado por ZENKAI):**
- Ads en plataformas (Meta · Google): $[Z] USD/mes
- Suscripciones de herramientas a nombre del cliente: $[W] USD/mes

**INVERSIÓN TOTAL PRIMER MES:** $[X + Y] USD

---

## 06 · GARANTÍAS

[Específicas y honestas. NO prometer lo que no controlamos.]

### Garantía de entrega
Si en [N semanas] no hemos entregado el alcance pactado, devolvemos [X%] del setup.

### Garantía de soporte
[N días/semanas/meses] de soporte ilimitado post-lanzamiento sin costo adicional.

### Garantía de resultado (si aplica · solo cuando es realista)
Si en 90 días [métrica X] no mejora >[Y%] vs baseline, [reembolso parcial · mes adicional gratis · etc.].

[Para sectores donde NO se puede prometer resultado — ej. ads, abogados — NO incluir esta garantía. Mejor honestidad que una promesa que no se puede cumplir.]

---

## 07 · POR QUÉ ZENKAI

[Sección de credibilidad. 3 elementos:]

1. **Tecnología:** describimos brevemente la Capa 1 (los 12 agentes, la plataforma)
2. **Casos:** [2-3 casos relevantes del sector con métricas reales]
3. **Equipo:** breve presentación de Perfil 1 + Perfil 2 + agentes IA + freelancers especializados

---

## 08 · PRÓXIMOS PASOS

1. **Revisar esta propuesta** con su equipo (sugerimos máximo 5 días, hay vencimiento de oferta)
2. **Firma del contrato** (LEX-CONTRACT enviado vía Docuseal/PandaDoc)
3. **Primer pago** (setup o anticipo según modelo)
4. **Kickoff call** (agendamos en Cal.com — link al final)
5. **Primer entregable** en [fecha]

---

**Validez de esta propuesta:** [fecha límite]
**Contacto directo:** [persona · WhatsApp · email]
**Cal.com para kickoff:** [link]

ZENKAI Growth Systems · Pereira, Colombia
NIT [...] · contacto@zenkai.[dominio]
```

### Paso 3 — Convertir a PDF profesional

- Usar APOLLO-TEMPLATE para la versión visual (no entregar Markdown plano al cliente)
- PDF con portada de marca, logos, tipografía consistente
- Generación: PandaDoc en Pro / Docuseal Pro / Generación custom con FORGE en Premium

### Paso 4 — Envío

Canal preferido: **email + WhatsApp con link al PDF**.
- Email: redacción profesional con resumen ejecutivo en el cuerpo
- WhatsApp: mensaje corto avisando "te envié la propuesta a tu correo, cualquier duda me dices por aquí"

### Paso 5 — Tracking

- Marcar en Airtable: propuesta enviada · fecha · validez
- Configurar alerta: si no responde en 5 días, mensaje de seguimiento por HERMES
- Si no responde en 14 días, segunda alerta con HERMES-FOLLOW
- Si no responde en 21 días (vencimiento), archivar como "perdida" + razón hipotética

## Output esperado

1. PDF profesional generado (no Markdown plano)
2. Email de envío preparado
3. Mensaje WhatsApp de aviso
4. Entrada en Airtable `propuestas` con tracking
5. Calendario de seguimiento programado

## Reglas inquebrantables

- **Nunca** propuesta antes de llamada de descubrimiento.
- **Nunca** prometer en garantía lo que no controlamos.
- **Nunca** dejar la sección "Lo que NO incluye" vacía (genera disputas futuras).
- **Nunca** propuesta sin fecha de validez.
- **Siempre** dos opciones de inversión (Eco + Pro) salvo que en la llamada el cliente haya pre-elegido tier.
- **Siempre** revisada por humano antes de enviar (no solo IA).
- **Siempre** seguimiento programado en HERMES.

## Variables marcadas para personalización

Todas las variables van entre `[CORCHETES]` para que sean fáciles de detectar en QA antes de enviar:
- `[Cliente]` · `[YYYY-MM-DD]` · `[Componente 1]` · `[X]` · `[Y%]` · etc.

Antes de enviar, hacer **find/replace** y verificar que NO queda ningún `[corchete]` en el documento final.
