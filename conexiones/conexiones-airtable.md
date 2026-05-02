# CONEXIONES · AIRTABLE
## Estructura de bases · fuente única de verdad

**Owner:** ATLAS · NEXUS · cada agente que maneja datos
**Plan recomendado:** Team ($20/usuario/mes · 50k registros · views avanzadas)

---

## BASES DE ZENKAI INTERNO

### BASE: VENTAS
**Propósito:** pipeline · leads · propuestas · contratos

**Tablas:**

#### `leads`
| Campo | Tipo | Notas |
|-------|------|-------|
| ID | autonumber | primary |
| nombre | single line | |
| empresa | single line | |
| email | email | |
| whatsapp | phone | |
| sector | single select | (lista de los 11 sectores) |
| mercado | single select | LATAM · España · USA · etc. |
| source | single select | Meta · Google · referido · orgánico · web |
| mensaje_original | long text | |
| score | rating 1-10 | |
| razon_score | long text | |
| etapa | single select | nuevo · cualificado · llamada · propuesta · negociación · cerrado · perdido |
| owner | linked to `equipo` | |
| fecha_creacion | created time | |
| fecha_primera_respuesta | datetime | mide SLA |
| fecha_ultima_interaccion | datetime | |
| razon_perdida | single select (si aplica) | precio · timing · otra agencia · cambio interno · sin razón |
| caso_estudio_potencial | checkbox | |
| valor_estimado_USD | currency | |
| notas | long text | |

**Views:**
- 🟢 Activos esta semana
- 🔴 Sin respuesta >24h
- 📅 Pipeline esta semana
- 🎯 Score ≥6 (a humano)
- 💔 Perdidos · análisis (para ZEUS-DECIDE)
- 📈 Reporte semanal (agregaciones)

#### `propuestas`
| Campo | Tipo | Notas |
|-------|------|-------|
| ID | autonumber | |
| lead_id | linked to `leads` | |
| fecha_envio | datetime | |
| fecha_validez | datetime | typically +21 días |
| tier | single select | Eco · Pro · Premium |
| nivel | single select | N1 · N2 · N3 · N4 |
| celda_matriz | single select | A-L |
| setup_USD | currency | |
| retainer_USD | currency | |
| pdf_url | URL | link Drive |
| estado | single select | enviada · revisada · aceptada · rechazada · vencida |
| razon_rechazo | long text | si rechazada |

#### `contratos`
| Campo | Tipo | Notas |
|-------|------|-------|
| ID | autonumber | |
| propuesta_id | linked to `propuestas` | |
| cliente | linked to `clientes_activos` | |
| tipo | single select | setup_unico · retainer · hibrido |
| fecha_firma | datetime | |
| pdf_firmado_url | URL | |
| vigencia_hasta | date | |
| status | single select | activo · pausado · terminado |

#### `objeciones`
Insumo para ARES (creatividades) y ZEUS (posicionamiento).

| Campo | Tipo | Notas |
|-------|------|-------|
| objecion | long text | |
| frecuencia | count | cuántos leads la mencionaron |
| respuesta_efectiva | long text | qué funcionó cuando respondimos |
| sector | linked to sectors |

---

### BASE: OPERACIONES

**Tablas:**

#### `clientes_activos`
| Campo | Tipo | Notas |
|-------|------|-------|
| ID | autonumber | |
| nombre | single line | |
| razon_social | single line | |
| sector | single select | |
| tier | single select | |
| nivel | single select | |
| fecha_inicio | date | |
| owner_zenkai | linked to `equipo` | |
| status | single select | activo · pausado · terminado |
| revenue_total | rollup | suma de facturas |
| nps_actual | number | |
| ultimo_reporte | date | |
| folder_path | URL | clientes/[slug]/ |

#### `proyectos`
| Campo | Tipo |
|-------|------|
| nombre | single line |
| cliente | linked to `clientes_activos` |
| fase | single select | (onboarding · build · launch · maintenance) |
| % avance | number |
| inicio | date |
| deadline | date |
| status | single select | (verde · amarillo · rojo) |

#### `tareas`
| Campo | Tipo |
|-------|------|
| descripcion | long text |
| proyecto | linked to `proyectos` |
| owner | linked to `equipo` |
| deadline | datetime |
| estado | single select | (pending · in_progress · done · blocked) |
| dependencias | linked to `tareas` |

#### `incidencias`
Para postmortems · aprendizaje continuo.

#### `entregables`
Para QA tracking.

---

### BASE: FINANZAS

**Tablas:**

#### `facturas`
| Campo | Tipo |
|-------|------|
| numero | autonumber |
| cliente | linked |
| concepto | single line |
| fecha_emision | date |
| fecha_vencimiento | date |
| valor_USD | currency |
| valor_COP | formula |
| status | single select | (pendiente · pagada · vencida · disputada) |
| metodo_pago | single select | (Stripe · Wompi · transferencia) |

#### `gastos`
Costos de ZENKAI · clasificados por proyecto si atribuibles.

#### `herramientas`
Catálogo de herramientas con costos · planes · usados por qué clientes.

#### `proyectos_costos`
Costo real por proyecto vs presupuesto.

---

### BASE: MARKETING

**Tablas:**

#### `campañas`
Cada campaña ARES con KPIs.

#### `creatividades`
Banco de creatividades · performance · estado.

#### `audiencias`
Audiencias definidas por sector · lookalikes.

---

### BASE: SOPORTE

**Tablas:**

#### `tickets`
Sistema de tickets ECHO.

#### `kb_articles`
Base de conocimiento.

#### `nps`
Encuestas NPS · CSAT.

---

### BASE: EQUIPO

**Tablas:**

#### `equipo`
Personas core ZENKAI + freelancers.

#### `freelancers`
Catálogo · scoring · disponibilidad.

#### `evaluaciones`
Performance reviews mensuales.

#### `tareas_asignadas`
Asignación + tracking de horas.

---

### BASE: LEGAL

**Tablas:**

#### `propuestas` (link a base VENTAS)
#### `contratos` (link a base VENTAS)
#### `firmas_pendientes`
#### `vencimientos` (alerta 30 días antes)
#### `disputas` (raras pero documentadas)

---

## BASE POR CLIENTE (CAPA 2)

Cada cliente Pro+ tiene una base Airtable propia con su estructura específica.
Para clientes Eco se usa una base compartida con vistas separadas (multi-tenant).

Estructura típica de base de cliente e-commerce:
- `productos`
- `clientes_finales`
- `pedidos`
- `mensajes_whatsapp`
- `email_campanas`

Estructura típica de base de cliente clínica salud:
- `pacientes`
- `citas`
- `recordatorios`
- `tratamientos`
- `comunicaciones`

Cada base se documenta en `clientes/[slug]/automatizaciones/airtable-schema.md`.

---

## REGLAS DE GOBIERNO

1. **Una sola fuente de verdad por dato.** No duplicar.
2. **Nunca borrar registros · marcarlos como archivados** (analytics se rompe si se borran).
3. **Backup CSV diario** automatizado vía Make + Drive.
4. **Permisos por rol:**
   - Editor: agentes y owners ZENKAI
   - Comment-only: clientes ven sus propias bases (Pro+)
   - Read: cliente ve agregaciones (Eco)
5. **Naming conventions:**
   - Nombres de campo en snake_case
   - Nombres de tabla en snake_case plural
   - Nombres de view con emoji prefix para escaneo rápido
6. **Linked records:** preferir links en lugar de duplicar IDs.
7. **Formulas y rollups** en lugar de scripts cuando se puede.
8. **API keys de Airtable** rotadas trimestralmente.

---

## INTEGRACIONES SALIENTES

- Make: 30+ flows que leen/escriben Airtable
- Looker Studio: dashboards públicos a clientes
- Notion: sincronizaciones específicas vía Make
- WhatsApp Cloud API: lectura de `leads` para personalizar mensajes

---

## INTEGRACIONES ENTRANTES

- Webhooks desde formularios (landing → Airtable `leads`)
- Webhooks desde Stripe/Wompi (pago → Airtable `facturas`)
- Webhooks desde Docuseal (firma → Airtable `contratos`)
- Manual: equipo ZENKAI + clientes Pro+
