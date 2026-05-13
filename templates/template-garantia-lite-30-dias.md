---
name: "Garantía Lite 30 días"
slug: template-garantia-lite-30-dias
categoria: legal
agentes_dueños: [LEX]
aplica_a: [Tier Lite]
referencia_copy: "docs/specs/2026-05-11-fase2-copy-validado.md · sección 4.1 · microcopy: 'Sin tarjeta. Sin contrato anual. Si en 30 días no te funciona, no nos debés nada.'"
version: 1.0
fecha_vigencia_desde: 2026-05-13
idioma: es
variables_principales: [CLIENTE_NOMBRE, CLIENTE_RAZON_SOCIAL, FECHA_ACTIVACION, REFERENCIA_CONTRATO]
---

# ANEXO C · GARANTÍA DE SATISFACCIÓN 30 DÍAS · TIER LITE
## ZENKAI Growth Systems · [CLIENTE_NOMBRE]

**Contrato de referencia:** [REFERENCIA_CONTRATO]
**Fecha de activación del servicio:** [FECHA_ACTIVACION]
**Vigencia de la garantía:** 30 días corridos desde la fecha de activación

> Este anexo forma parte integral del Contrato de Prestación de Servicios y prevalece sobre la Cláusula 9.1 ("Garantía de entrega") únicamente para clientes del Tier Lite. Para tiers Starter, Growth, Pro y Enterprise rige la Cláusula 9.1 estándar.

---

## 1 · ALCANCE DE LA GARANTÍA

Si dentro de los **30 días corridos** posteriores a la fecha de activación del servicio EL CLIENTE manifiesta por escrito que el servicio entregado **no cumple con su finalidad declarada**, ZENKAI procederá al reembolso conforme a la sección 3 de este anexo.

### 1.1 · Qué se considera "no cumple con su finalidad"

Cualquiera de las siguientes situaciones, verificable objetivamente:

1. **Sitio web inaccesible** — el sitio entregado devuelve errores HTTP 5xx persistentes por más de 24h sin causa atribuible al hosting/dominio del CLIENTE.
2. **WhatsApp Business no operativo** — los templates pre-cargados no funcionan, o el número configurado no recibe mensajes pese a estar correctamente conectado por EL CLIENTE.
3. **Formulario no entrega leads** — los envíos del formulario no llegan al inbox de EL CLIENTE ni al registro de Airtable acordado, durante un período de prueba mínimo de 72h consecutivas.
4. **Cal.com no agenda** — si el setup de Cal.com fue parte del alcance (opcional en Lite), no permite reservar citas reales.
5. **Cualquier entregable explícito del Anexo A del Contrato no fue entregado dentro del cronograma comprometido** (5 días hábiles para Tier Lite).

### 1.2 · Qué NO se considera causal de reembolso

1. Cambio de prioridades comercial de EL CLIENTE.
2. Falta de tráfico, leads o ventas atribuibles a factores externos (marketing del CLIENTE, estacionalidad, precios, oferta).
3. Solicitudes de cambios de alcance no firmadas como adenda al contrato.
4. Indisponibilidad de servicios de terceros bajo control de EL CLIENTE (hosting que el cliente proveyó, dominio mal configurado por el cliente, número de WhatsApp suspendido por Meta por causa del cliente, etc.).
5. Demora del CLIENTE en entregar contenido base (textos, imágenes, accesos) más allá de los **14 días corridos** desde la firma del contrato. En este caso, la garantía queda suspendida hasta que el contenido sea entregado, sin extender el plazo total de 30 días desde activación.
6. Causa fuerza mayor (caída prolongada de Vercel, Anthropic, Airtable, Make, WhatsApp Cloud API) debidamente documentada.

---

## 2 · PROCEDIMIENTO DE SOLICITUD

Para invocar esta garantía, EL CLIENTE debe:

1. **Enviar un correo** a `hola@zenkai.systems` con el **asunto exacto**: `GARANTÍA 30D — [CLIENTE_RAZON_SOCIAL]`.
2. **Cuerpo del correo** debe incluir:
   - Referencia del contrato: [REFERENCIA_CONTRATO]
   - Descripción específica del incumplimiento (no genérica)
   - Capturas de pantalla, URLs o evidencias verificables del problema
   - Fecha y hora en que se detectó la situación
3. **Plazo de envío**: dentro de los 30 días corridos desde la fecha de activación. Solicitudes recibidas el día 31 o posterior no aplican a esta garantía.

ZENKAI acusará recibo de la solicitud dentro de las **4 horas hábiles** (horario laboral Colombia, lunes a viernes 8:00-18:00 COT).

---

## 3 · RESOLUCIÓN Y REEMBOLSO

Una vez recibida la solicitud, ZENKAI tendrá **5 días hábiles** para:

1. **Verificar la causal**: revisar la evidencia presentada e intentar reproducir el problema.
2. **Proponer subsanación**: si el problema es subsanable en menos de 72h, ZENKAI puede ofrecer corregirlo antes de proceder al reembolso. EL CLIENTE conserva el derecho de aceptar la corrección o exigir reembolso directo.
3. **Procesar el reembolso** según la tabla siguiente:

### 3.1 · Tabla de reembolso

| Situación al momento de la solicitud | Reembolso del setup ($300 USD) | Reembolso del fee mensual ($90 USD) |
|---|---|---|
| Sitio NO entregado · entregable principal pendiente | 100% | 100% |
| Sitio entregado pero causal 1.1 verificada | 50% | 100% del/los mes(es) facturados |
| Solo causal sobre módulos secundarios (WA / form / Cal.com) | 25% | 100% del/los mes(es) facturados |
| Solicitud presentada fuera del plazo de 30 días | 0% | 0% (rige Cláusula 10 del contrato para cancelación regular) |

### 3.2 · Forma de pago del reembolso

- **Mismo medio que el pago original** (transferencia bancaria, Wompi, Stripe, PayU).
- **Plazo de transferencia**: 10 días hábiles desde la confirmación del reembolso.
- **Moneda**: la moneda en la que se facturó originalmente (USD, COP, EUR, MXN).
- **Comisiones bancarias**: a cargo de cada parte (cada banco cobra su lado).

### 3.3 · Efectos sobre el contrato

Una vez ejecutado el reembolso conforme a este anexo:

- El Contrato queda **terminado de pleno derecho** sin necesidad de preaviso adicional.
- ZENKAI mantiene los entregables ya producidos (código, copy, configuraciones) bajo licencia revocada — EL CLIENTE no podrá seguir usándolos comercialmente. El sitio web entregado quedará offline al cumplirse el reembolso.
- EL CLIENTE conserva la propiedad de su dominio, contenido propio aportado, y datos personales (que serán eliminados según Cláusula 8.3 del contrato dentro de 30 días).

---

## 4 · LIMITACIONES Y EXCLUSIONES

### 4.1 · Esta garantía NO aplica a:

- Servicios adicionales contratados fuera del alcance del Tier Lite (campañas de ads, contenido extra, integraciones custom solicitadas post-firma).
- Cualquier costo de terceros (dominio, hosting externo si fue requisito del CLIENTE, licencias de software adicional).
- Daños indirectos, lucro cesante, oportunidades perdidas o cualquier consecuencia derivada del uso o no-uso del servicio. Rige la Cláusula 9.2 del contrato.

### 4.2 · Garantía única e intransferible

- Esta garantía aplica **una sola vez por CLIENTE**. Un CLIENTE que invocó esta garantía y recibió reembolso no podrá contratar nuevamente el Tier Lite con ZENKAI durante 12 meses.
- La garantía es intransferible a terceros (no aplica a empresas vinculadas, filiales, o cesionarios del contrato).

### 4.3 · Buena fe

Esta garantía está concebida bajo el principio de buena fe contractual. ZENKAI se reserva el derecho de rechazar solicitudes que evidencien abuso manifiesto (ej. solicitud el día 29 sin haber utilizado el servicio en absoluto, o sin reporte alguno previo durante los 30 días). En caso de desacuerdo, se aplicará el mecanismo de resolución de la Cláusula 11 del contrato.

---

## 5 · ACEPTACIÓN

Al firmar este anexo, las partes aceptan que constituye un complemento al Contrato de Prestación de Servicios y rige en lo relativo a la Garantía de Satisfacción del Tier Lite. Cualquier conflicto entre este anexo y el contrato principal se resuelve conforme a la Cláusula 11 del contrato.

**Por ZENKAI:**

Nombre: ____________________________
Cargo: ____________________________
Fecha: ____________________________
Firma: ____________________________

**Por [CLIENTE_NOMBRE]:**

Nombre: ____________________________
Cargo: ____________________________
Fecha: ____________________________
Firma: ____________________________

---

> **Notas internas (no incluir en versión firmada):**
>
> - Este anexo está pensado para protegerse contra abuso (4.3 + 4.2) sin perder la transparencia comercial publicada en zenkai.systems.
> - Mantener el registro de toda solicitud de garantía en `LEGAL · templates_legales` (Airtable) con el record correspondiente al template `template-garantia-lite-30-dias` versión [VERSION].
> - El umbral del 50% del setup en causal 1.1 está calibrado para casos donde el sitio se entregó pero algún módulo crítico falla: ZENKAI absorbe parte del costo (el sitio existe) pero reconoce que la finalidad declarada no se cumplió.
> - Si en 3+ casos consecutivos el CLIENTE invoca causal "WhatsApp no operativo" o "form no entrega leads", revisar el SOP interno de QA de delivery — puede haber un bug sistémico en la plantilla de Tier Lite, no un caso aislado.
> - **Actualización de este template requiere bump de `version:` en el frontmatter + nuevo record en `LEGAL · templates_legales`.** Contratos firmados con versiones anteriores siguen rigiéndose por la versión vigente al momento de la firma.
