# CONEXIONES · WHATSAPP
## Cloud API + BSP + plantillas HSM aprobadas

**Owner:** NEXUS-API + HERMES-WA
**Canal primario** en mercados hispanohablantes (convierte 2-3× más que email)

---

## ESTADIOS DE WHATSAPP POR TIER

| Tier | Stack |
|------|-------|
| **ECO** | WhatsApp Business App (móvil) — manual, sin API |
| **PRO** | WhatsApp Cloud API + BSP partner (360dialog · Twilio · Yalo) |
| **PREMIUM** | Stack PRO + BSP certificado · WABA verificado · plataforma de mensajería empresarial |

---

## CONFIGURACIÓN INICIAL (PRO+)

### Paso 1 · Cuenta de WhatsApp Business (WABA)
- Crear cuenta en [Meta Business Manager](https://business.facebook.com)
- Configurar pago (tarjeta validada)
- Verificar empresa (puede tomar 1-30 días según país)
- Solicitar tilde verde (opcional · solo cuentas con presencia mediática)

### Paso 2 · Número de WhatsApp Business
- Número distinto al personal (siempre)
- Puede ser fijo (línea local) o móvil (sin SIM activa en App)
- Verificación por SMS o llamada
- **Importante:** una vez se asocia a Cloud API, NO puede usarse en WhatsApp Business App

### Paso 3 · BSP (Business Solution Provider)
**Recomendado:** 360dialog (más simple) o Twilio (más enterprise)

| BSP | Costo setup | Costo/mes mínimo | Comisión por mensaje | Notas |
|-----|-------------|-------------------|----------------------|-------|
| 360dialog | $0 | $50 | + costo Meta | simple · API directa |
| Twilio | $0 | $0 | + costo Meta | más complejo · más features |
| Yalo | $0 | $300+ | + costo Meta | plataforma low-code |
| Zenvia (LATAM) | $0 | $200+ | + costo Meta | enfoque LATAM |

### Paso 4 · Webhook configurado
- URL del webhook: `https://[hostname]/webhook/whatsapp/[token-secreto]`
- Verificar dominio + SSL
- Capturar eventos: `messages` · `statuses`

### Paso 5 · Templates HSM (Highly Structured Messages)
Templates **pre-aprobados** por Meta para iniciar conversaciones (fuera de la ventana de 24h).

**Ejemplo de templates ZENKAI estándar:**

```
TEMPLATE: bienvenida_lead_zenkai
Categoría: UTILITY
Idiomas: es_CO · es_ES · es_MX

Cuerpo:
"Hola {{1}}, gracias por escribirnos a ZENKAI 👋

Vi tu mensaje sobre {{2}}.

Te responderé con detalle en menos de 10 minutos en horario laboral.

Si es urgente, déjame nota acá."

Variables:
- {{1}} = nombre del lead
- {{2}} = tema detectado
```

```
TEMPLATE: recordatorio_cita_d_1
Categoría: UTILITY

Cuerpo:
"Hola {{1}}, te recuerdo tu cita mañana {{2}} a las {{3}}.

Si necesitas reagendar: {{4}}

Te esperamos!"

Variables:
- {{1}} = nombre paciente
- {{2}} = fecha
- {{3}} = hora
- {{4}} = link reagendamiento
```

```
TEMPLATE: propuesta_enviada
Categoría: MARKETING (requiere opt-in)

Cuerpo:
"Hola {{1}}, te envié la propuesta para {{2}} a tu correo {{3}}.

Puedes verla aquí también: {{4}}

Cualquier duda me cuentas por aquí."

Variables:
- {{1}} = nombre
- {{2}} = proyecto
- {{3}} = email donde se envió
- {{4}} = link al PDF
```

**Aprobación de templates:** 24-72h por Meta. Pueden rechazarlos si:
- Lenguaje promocional excesivo en categoría utility
- Variables sin contexto claro
- Idioma no coincide con el seleccionado

---

## VENTANAS DE MENSAJERÍA (CRÍTICO ENTENDER)

### Ventana de 24 horas (free messaging window)
Después de que el cliente envía un mensaje, ZENKAI tiene **24 horas** para responder con cualquier mensaje gratis (free-form).

### Fuera de la ventana
Solo se pueden enviar **templates HSM aprobados**, con costo:

| Tipo template | Costo aprox por conversación |
|---------------|------------------------------|
| Marketing | ~$0.0188 - 0.0792 USD según país |
| Utility | ~$0.012 - 0.040 USD |
| Authentication | ~$0.038 - 0.108 USD |

**Nota:** "Conversación" en WhatsApp = ventana de 24h donde puede haber múltiples mensajes.

### Costos típicos por país (referencia 2026)
- Colombia: $0.038 marketing · $0.012 utility
- México: $0.043 · $0.014
- España: $0.054 · $0.030
- USA: $0.0188 · $0.040

---

## INTEGRACIÓN CON MAKE

### Conexión típica

```
Make conecta a WhatsApp Cloud API mediante:
- HTTP module (custom)
  o 
- 360dialog module (si usas 360dialog · más simple)
```

### Flow patrón "lead nuevo → bienvenida"

```
1. Webhook desde Airtable `leads` (registro nuevo)
2. Decide si está en ventana 24h:
   - Si SÍ: enviar mensaje free-form
   - Si NO: enviar template `bienvenida_lead_zenkai`
3. Capturar `message_id` del response
4. Actualizar Airtable con `wa_message_id` + timestamp
5. Loguear en `whatsapp_logs`
```

### Flow patrón "cliente responde → procesar"

```
1. Webhook desde WhatsApp Cloud API (mensaje entrante)
2. Buscar lead en Airtable por número
   - Si no existe: crear nuevo
   - Si existe: actualizar `fecha_ultima_interaccion`
3. Llamar Claude API con contexto:
   - Mensaje recibido
   - Histórico de conversación (de Airtable)
   - Sector del lead
4. Recibir respuesta sugerida
5. Si confianza >0.85: enviar automáticamente
6. Si confianza <0.85: alerta a humano para validar antes
```

---

## REGLAS Y BUENAS PRÁCTICAS

### NUNCA hacer
❌ **Spam de marketing sin opt-in.** Meta banea cuentas.
❌ **Usar el mismo número en App y Cloud API.** Imposible.
❌ **Templates con variables sin valor.** Mensaje no envía.
❌ **Mensajes fuera de horario sin razón** (queja del cliente).
❌ **Pedir datos sensibles por WA** (datos médicos · financieros · contraseñas).
❌ **Compartir números de cliente entre clientes** (LGPD/GDPR violation).

### SIEMPRE hacer
✅ **Opt-in explícito** para mensajes de marketing.
✅ **Identificar a ZENKAI / al cliente final** en el primer mensaje.
✅ **Botón de "STOP" o "no quiero más mensajes"** en marketing templates.
✅ **Loguear cada conversación** en Airtable + s3/drive (compliance).
✅ **Backup mensual** de logs (compliance Habeas Data CO).
✅ **Capacitar al cliente** sobre buenas prácticas WA antes del lanzamiento.

---

## CALIDAD DEL NÚMERO (MUY IMPORTANTE)

WhatsApp asigna **calidad** al número (Green · Yellow · Red).

### Green
- Tasa de respuesta alta
- Usuarios reportan poco
- Permite enviar templates marketing sin restricciones

### Yellow
- Algunos reportes
- Restricciones aumentadas

### Red
- Muchos reportes / bloqueos
- Cuenta puede ser suspendida

**Cómo mantener Green:**
- Mensajes relevantes (no spam)
- Opt-in real
- Personalización
- Volumen progresivo (no de 0 a 1000 mensajes/día de un golpe)
- Respeto de horarios

NEXUS-MONITOR revisa calidad cada lunes.

---

## CASOS DE USO POR SECTOR

| Sector | Templates típicos | Volumen estimado |
|--------|-------------------|------------------|
| E-commerce | bienvenida · carrito abandonado · post-compra · reseña | 200-2000/día |
| Salud | recordatorio cita · post-consulta · NPS · recall | 50-500/día |
| Restaurantes | bienvenida · pedido confirmado · reseña | 30-300/día |
| Servicios | bienvenida · seguimiento · propuesta | 10-100/día |
| Inmobiliaria | nueva propiedad · cita visita · followup | 20-200/día |
| Educación | bienvenida curso · recordatorio clase · certificación | 50-1000/día |

---

## TROUBLESHOOTING COMÚN

| Problema | Causa típica | Solución |
|----------|--------------|----------|
| Template rechazado | Lenguaje promocional en utility | Reescribir · cambiar categoría |
| Mensaje no llega | Fuera de ventana 24h sin template | Usar template HSM |
| Calidad baja | Reportes de spam | Pausar campaña · mejorar opt-in |
| Webhook no recibe | URL no SSL · token incorrecto | Validar config Meta |
| Latencia alta | Throughput superado | Upgrade BSP plan · throttle |

---

## DOCUMENTACIÓN POR CLIENTE

Cada cliente activo con WA Cloud API tiene en `clientes/[slug]/automatizaciones/whatsapp.md`:

- Número WABA
- BSP usado
- Lista de templates aprobados (con copy completo)
- Volumen actual y proyectado
- Calidad actual del número
- Webhooks configurados
- Plan de mantenimiento mensual
