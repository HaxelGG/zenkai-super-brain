---
name: "Contrato de Servicios"
slug: template-contrato-servicios
categoria: legal
agentes_dueños: [LEX]
variables_principales: [CLIENTE_NOMBRE, RAZON_SOCIAL, NIT, MONTO_TOTAL, ENTREGABLES]
---

# CONTRATO DE PRESTACIÓN DE SERVICIOS
## ZENKAI Growth Systems · [CLIENTE_NOMBRE]

**Fecha de suscripción:** [YYYY-MM-DD]
**Referencia:** [REF_CONTRATO]
**Tipo de contrato:** [SETUP_UNICO · RETAINER_MENSUAL · HIBRIDO_SETUP_RETAINER]

---

## CLÁUSULA 1 · PARTES

**EL PRESTADOR (en adelante "ZENKAI"):**
ZENKAI Growth Systems
NIT/RUT: [ZENKAI_NIT]
Domicilio: Pereira, Risaralda, Colombia
Representante legal: [ZENKAI_REPRESENTANTE]
Email: contacto@zenkai.[ZENKAI_DOMINIO]

**EL CLIENTE (en adelante "EL CLIENTE"):**
[CLIENTE_RAZON_SOCIAL]
NIT/Tax ID: [CLIENTE_TAX_ID]
Domicilio: [CLIENTE_DIRECCION]
Representante legal: [CLIENTE_REPRESENTANTE]
Email: [CLIENTE_EMAIL]

---

## CLÁUSULA 2 · OBJETO

ZENKAI prestará a EL CLIENTE los servicios de [DESCRIPCION_OBJETO_BREVE], conforme al alcance detallado en la Cláusula 3 y el Cronograma del Anexo A.

---

## CLÁUSULA 3 · ALCANCE

### 3.1 · Alcance positivo (lo que SÍ incluye)

ZENKAI se obliga a entregar:

**[COMPONENTE_1]**
- [SUBITEM_1_1]
- [SUBITEM_1_2]
- [SUBITEM_1_3]

**[COMPONENTE_2]**
- [SUBITEM_2_1]
- [SUBITEM_2_2]

**[COMPONENTE_3]**
- [SUBITEM_3_1]
- [SUBITEM_3_2]

### 3.2 · Alcance negativo (lo que NO incluye)

Quedan expresamente excluidos del alcance:
- [EXCLUSION_1]
- [EXCLUSION_2]
- [EXCLUSION_3]

Cualquier servicio fuera del alcance requerirá orden de cambio firmada por ambas partes.

---

## CLÁUSULA 4 · CRONOGRAMA E HITOS

(Ver Anexo A · Cronograma)

ZENKAI tendrá [N_SEMANAS] semanas calendario contadas desde el primer pago para entregar el alcance completo. Los hitos intermedios y los entregables están detallados en el Anexo A.

---

## CLÁUSULA 5 · PRECIO Y FORMA DE PAGO

### 5.1 · Valor del contrato

**Setup (pago inicial único):** USD [SETUP_USD] (≈ COP [SETUP_COP])
**Retainer mensual** (si aplica): USD [RETAINER_USD]/mes

### 5.2 · Forma de pago

**Setup:**
- [%_PRIMER_PAGO]% al inicio del proyecto
- [%_SEGUNDO_PAGO]% [TRIGGER_SEGUNDO_PAGO]
- [%_TERCER_PAGO]% [TRIGGER_TERCER_PAGO]

**Retainer mensual** (si aplica):
- Pagable el día 1 de cada mes calendario
- Renovación automática salvo notificación con 30 días de anticipación

### 5.3 · Métodos de pago aceptados

[STRIPE · MERCADOPAGO · WOMPI · TRANSFERENCIA_BANCARIA · OTRO]

### 5.4 · Mora

Pagos con más de [N_DIAS_MORA] días de mora generarán interés de [INTERES_MORATORIO]% mensual y suspensión del servicio hasta regularizar.

---

## CLÁUSULA 6 · PROPIEDAD INTELECTUAL

### 6.1 · Entregables al cliente
EL CLIENTE será propietario exclusivo de los entregables específicos producidos para él (landing page, copy, creatividades, configuraciones, datos generados).

### 6.2 · Plataforma ZENKAI (Capa 1)
ZENKAI conserva la propiedad exclusiva de su plataforma interna, agentes IA, prompts, frameworks, metodologías y herramientas internas. Estos NO son objeto de transferencia al CLIENTE.

### 6.3 · Portfolio
ZENKAI conserva el derecho de usar el trabajo realizado para EL CLIENTE en su portfolio comercial, salvo NDA específico que lo prohíba.

---

## CLÁUSULA 7 · CONFIDENCIALIDAD

Ambas partes se obligan a mantener confidencial toda información comercial, técnica, operativa o estratégica intercambiada durante la vigencia del contrato y por [N_AÑOS_CONFIDENCIALIDAD] años después de su terminación.

---

## CLÁUSULA 8 · TRATAMIENTO DE DATOS PERSONALES

### 8.1 · Marco legal aplicable
[HABEAS_DATA_COLOMBIA_LEY_1581_2012 · GDPR · CCPA · OTRO]

### 8.2 · Responsabilidades
EL CLIENTE es **Responsable del Tratamiento** de los datos personales de sus usuarios/clientes finales. ZENKAI actúa como **Encargado del Tratamiento**.

### 8.3 · Compromisos de ZENKAI como Encargado
- Tratar los datos solo para los fines del contrato.
- No transferir datos a terceros sin autorización del CLIENTE.
- Implementar medidas de seguridad razonables.
- Notificar incidentes de seguridad en <72h.
- Devolver o eliminar los datos al término del contrato.

### 8.4 · Anexo de Tratamiento de Datos (DPA)
Se anexa al presente contrato como Anexo B.

---

## CLÁUSULA 9 · GARANTÍAS Y LIMITACIÓN DE RESPONSABILIDAD

### 9.1 · Garantía de entrega
Si ZENKAI no entrega el alcance pactado en [N_SEMANAS] semanas (salvo causa atribuible al CLIENTE), reembolsará el [%_REEMBOLSO_NO_ENTREGA]% del setup.

### 9.2 · Limitación de responsabilidad
La responsabilidad total de ZENKAI bajo este contrato no excederá el valor total pagado por EL CLIENTE en los [N_MESES_LIMITE] meses anteriores al evento que origina la responsabilidad.

ZENKAI no responderá por daños indirectos, lucro cesante, pérdida de oportunidades de negocio o daños consecuenciales.

### 9.3 · Excepciones
La limitación anterior no aplica en casos de dolo, culpa grave o violación de la confidencialidad.

---

## CLÁUSULA 10 · TERMINACIÓN

### 10.1 · Terminación por mutuo acuerdo
En cualquier momento, mediante acuerdo escrito entre las partes.

### 10.2 · Terminación unilateral con preaviso
Cualquiera de las partes podrá terminar el contrato con [N_DIAS_PREAVISO] días de preaviso por escrito, pagando los servicios prestados hasta la fecha.

### 10.3 · Terminación por incumplimiento
En caso de incumplimiento sustancial, la parte cumplida podrá terminar el contrato dando 15 días para subsanar. Si no se subsana, terminación inmediata sin compensaciones adicionales.

### 10.4 · Efectos de la terminación
- ZENKAI entregará todo el material producido hasta la fecha
- EL CLIENTE pagará los servicios prestados
- Se devolverán/eliminarán los datos según Cláusula 8

---

## CLÁUSULA 11 · RESOLUCIÓN DE CONFLICTOS

### 11.1 · Mediación previa
Las partes intentarán resolver cualquier disputa mediante negociación directa por al menos 30 días.

### 11.2 · Jurisdicción y ley aplicable
Si la mediación falla, el contrato se rige por las leyes de [JURISDICCION_LEY_APLICABLE] y la jurisdicción competente serán los jueces de [CIUDAD_JURISDICCION].

---

## CLÁUSULA 12 · VIGENCIA

Este contrato entra en vigencia con el primer pago de EL CLIENTE y termina con la entrega final del alcance (proyecto único) o continúa vigente con renovación automática mensual hasta cancelación (retainer).

---

## CLÁUSULA 13 · ANEXOS

- **Anexo A** · Cronograma e hitos detallados
- **Anexo B** · Acuerdo de Tratamiento de Datos (DPA)
- **Anexo C** · [OTROS_ANEXOS_SI_APLICAN]

---

## FIRMAS

**Por ZENKAI:**

___________________________
[ZENKAI_REPRESENTANTE]
Representante Legal · ZENKAI Growth Systems
Fecha: [FECHA_FIRMA_ZENKAI]

**Por EL CLIENTE:**

___________________________
[CLIENTE_REPRESENTANTE]
Representante Legal · [CLIENTE_RAZON_SOCIAL]
Fecha: [FECHA_FIRMA_CLIENTE]

---

> **CHECKLIST PRE-ENVÍO** (LEX-CONTRACT · borrar antes de enviar)
> - [ ] Todas las variables [CORCHETES] reemplazadas
> - [ ] Validar NIT/Tax ID del cliente con cámara de comercio
> - [ ] Anexo A cronograma detallado adjunto
> - [ ] Anexo B DPA si maneja datos sensibles
> - [ ] Si sector regulado, REVISADO POR ABOGADO HUMANO
> - [ ] Términos de pago coinciden con propuesta firmada
> - [ ] Plataforma de firma configurada (Docuseal/PandaDoc/DocuSign)
> - [ ] Orden de firma definido (ZENKAI primero típicamente)
