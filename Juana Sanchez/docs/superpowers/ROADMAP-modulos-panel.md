# Roadmap de módulos — Panel de Control Grupo Juana Sánchez

**Qué es esto:** el catálogo de TODOS los módulos del panel, en orden de dependencias.
Cada módulo es su propio ciclo **brainstorm → spec → plan → construir**, reutilizando
los cimientos (auth, multi-empresa, app shell, RLS, patrón CRUD/tabla de Inventario).

**NO es un plan paso-a-paso.** Es el mapa. Cada módulo se convierte en un plan detallado
con el prompt de `docs/superpowers/PROMPT-nuevo-modulo.md` cuando le toque.

**Estado:**
- ✅ Cimientos + Inventario → plan en `docs/superpowers/plans/2026-05-25-panel-control-grupo.md`
- ⬜ Todo lo demás → este documento

**Regla de oro:** ningún módulo reconstruye los cimientos. Todos reutilizan
`company_id` + RLS, el app shell, el selector de empresa y el patrón
queries/actions/tabla de Inventario.

---

## Orden recomendado (por dependencias)

```
Inventario ✅
   └─> CRM ──> Cotizaciones ──> Ventas ──> Finanzas/Revenue
                                   │              │
                                   └──────────────┴──> Dashboards / BI / Proyecciones
Tareas de equipo ─┐
Comunicación  ────┼─> (transversales, se pueden meter en cualquier momento tras cimientos)
Social media  ────┘
Automatizaciones IA ──> 2º Cerebro   (van al final: se apoyan en los datos de todos)
```

---

## 1. CRM — Clientes y contactos

**Depende de:** cimientos.
**Propósito:** ficha única de cada cliente del grupo, con historial de interacciones,
compartido o segmentado por empresa.

**Datos:**
- `customers` — `company_id`, nombre, email, teléfono, tipo (particular/tienda/mayorista),
  notas, etiqueta(s), `created_at`.
- `contacts` — personas dentro de un cliente (para mayoristas/tiendas).
- `interactions` — `customer_id`, tipo (llamada/email/visita/whatsapp), resumen, fecha,
  `created_by`.

**Pantallas:** lista de clientes (buscador + filtros), ficha de cliente (datos +
timeline de interacciones), alta/edición, registrar interacción rápida.

**Decisiones a tomar (brainstorm):** ¿clientes compartidos entre las 3 empresas o
separados? ¿etapas/embudo simple (lead → cliente) ya aquí o eso vive en Ventas?
¿importar contactos existentes desde dónde?

---

## 2. Cotizaciones — Presupuestos

**Depende de:** Inventario (productos/precios) + CRM (cliente).
**Propósito:** crear, enviar y seguir presupuestos.

**Datos:**
- `quotes` — `company_id`, `customer_id`, número, estado (borrador/enviada/aceptada/
  rechazada/caducada), fecha, validez, totales, notas.
- `quote_items` — `quote_id`, `product_id` (o línea libre), descripción, cantidad,
  precio unitario, descuento, subtotal.

**Pantallas:** lista de cotizaciones (filtro por estado/cliente), editor de cotización
(añadir líneas desde inventario, calcular totales), vista imprimible/PDF, cambiar estado.

**Decisiones a tomar:** ¿generar PDF y enviar por email desde el panel? ¿IVA/impuestos?
¿numeración por empresa? ¿una cotización aceptada crea una venta automáticamente?

---

## 3. Ventas — Pedidos / facturación ligera

**Depende de:** Cotizaciones + Inventario + CRM.
**Propósito:** registrar ventas reales y que descuenten stock automáticamente.

**Datos:**
- `sales` — `company_id`, `customer_id`, `quote_id` (opcional), número, fecha, estado
  (pendiente/pagada/entregada), canal (tienda/online/feria), total.
- `sale_items` — líneas; al confirmar la venta, **crea `stock_movements` tipo `out`**
  en Inventario (cierra el bucle con el módulo 1).

**Pantallas:** lista de ventas, ficha de venta, "convertir cotización en venta",
resumen de ventas por periodo/empresa/canal.

**Decisiones a tomar:** ¿integración con TPV/Shopify aquí o manual? ¿métodos de pago?
¿devoluciones (movimiento `in`)?

---

## 4. Finanzas / Revenue — Ingresos, gastos, márgenes

**Depende de:** Ventas (ingresos) + Inventario (costes).
**Propósito:** visión de dinero del grupo y por empresa.

**Datos:**
- `expenses` — `company_id`, categoría, proveedor, importe, fecha, recurrente sí/no.
- `revenue` — derivado de Ventas (vista/materializado) + ingresos manuales.
- (Margen = ingresos − coste de producto − gastos.)

**Pantallas:** ingresos vs gastos por mes/empresa, lista de gastos, márgenes por
producto/empresa, flujo de caja simple.

**Decisiones a tomar:** ¿conciliación bancaria (subir extractos) o todo manual?
¿categorías de gasto fijas? ¿moneda única EUR?

---

## 5. Dashboards / BI / Proyecciones (incluye "Big data", "Business management", "Charts")

**Depende de:** datos de Inventario + Ventas + Finanzas + CRM.
**Propósito:** el panel-resumen ejecutivo con gráficos y proyecciones.

**Datos:** sobre todo **lectura** (vistas/agregados de los otros módulos). Posible
tabla `kpi_snapshots` para guardar fotos diarias y ver tendencias.

**Pantallas:** dashboard principal (KPIs: ventas del mes, valor de stock, top productos,
clientes nuevos, margen), gráficos (líneas/barras/donut), comparativa entre las 3
empresas, **proyección** simple (tendencia/objetivo vs real).

**Decisiones a tomar:** ¿qué KPIs son los importantes para ti? ¿proyección = media móvil
simple o algo más? ¿librería de gráficos (Recharts recomendado con shadcn)?

---

## 6. Tareas de equipo — (transversal)

**Depende de:** cimientos. (Mejor con roles activados, pero funciona sin ellos.)
**Propósito:** to-dos asignables por empresa/departamento.

**Datos:**
- `tasks` — `company_id`, título, descripción, estado (pendiente/en curso/hecha),
  prioridad, `assignee_id`, `due_date`, etiqueta de módulo (ej. "inventario").
- (Opcional) `task_comments`.

**Pantallas:** lista/tablero kanban, ficha de tarea, "mis tareas".

**Decisiones a tomar:** ¿kanban o lista? ¿vincular tareas a clientes/productos/ventas?
¿recordatorios?

---

## 7. Comunicación de equipo — (transversal)

**Depende de:** cimientos + roles (tiene más sentido con varios usuarios).
**Propósito:** notas/mensajes internos por empresa o por tema.

**Datos:** `channels`, `messages` (`channel_id`, `author_id`, contenido, `created_at`).

**Pantallas:** lista de canales, hilo de mensajes (tipo chat ligero).

**Decisiones a tomar:** ¿chat en tiempo real (Supabase Realtime) o notas asíncronas?
¿menciones? ¿esto debería ser Slack/WhatsApp en vez de construirlo? (evaluar
build-vs-integrar).

---

## 8. Social media — Planificación y métricas

**Depende de:** cimientos.
**Propósito:** calendario de contenidos y, opcionalmente, métricas de las redes.

**Datos:**
- `social_posts` — `company_id`, plataforma (IG/TikTok/FB), estado (idea/programado/
  publicado), fecha, copy, asset (imagen/vídeo), enlace.
- (Opcional) `social_metrics` si se integran APIs.

**Pantallas:** calendario de contenidos, lista por estado, ficha de post.

**Decisiones a tomar:** ¿solo planificación interna o integración con APIs de Meta/TikTok
(complejo, requiere permisos)? ¿qué plataformas? ¿una cuenta por empresa?

---

## 9. Automatizaciones con IA

**Depende de:** datos de los módulos anteriores (cuantos más, mejor).
**Propósito:** asistentes/flujos que ahorran trabajo sobre los datos del panel.

**Ideas concretas (elegir 1-2 para empezar):**
- Redactar la descripción de un producto a partir de su nombre/categoría.
- Resumir el historial de un cliente / sugerir el siguiente paso (CRM).
- Generar el borrador de una cotización desde una frase ("presupuesto de 3 bolsos para X").
- Alertas inteligentes (stock bajo + predicción de quiebre, clientes inactivos).
- Generar copys de social media por marca.

**Datos:** `ai_runs` (log de qué se pidió, qué se generó, coste), claves de API.

**Decisiones a tomar:** ¿qué automatización resuelve más dolor primero? ¿Claude API
directo o una capa tipo n8n/Make (vi Make conectado)? ¿coste/límites?

---

## 10. 2º Cerebro — Base de conocimiento del grupo

**Depende de:** cimientos; se potencia con Automatizaciones IA.
**Propósito:** repositorio central de notas, documentos, decisiones y SOPs del grupo,
con búsqueda (y búsqueda semántica con IA).

**Datos:**
- `notes` / `documents` — `company_id` (o "grupo"), título, contenido (markdown),
  etiquetas, adjuntos.
- (IA) embeddings para búsqueda semántica (`pgvector` en Supabase).

**Pantallas:** explorador de notas/carpetas, editor markdown, búsqueda (texto + semántica),
"pregúntale a tu cerebro" (chat sobre tus documentos).

**Decisiones a tomar:** ¿búsqueda semántica desde el día 1 o texto primero? ¿qué se
guarda aquí vs en Comunicación? ¿adjuntos en Supabase Storage?

---

## Notas transversales

- **Reutilización:** cada módulo nuevo copia el patrón de Inventario:
  `lib/<modulo>/queries.ts`, `lib/<modulo>/actions.ts`, ruta en `(app)/<modulo>/`,
  entrada en el `Sidebar`, RLS por `company_id`.
- **Build vs integrar:** Comunicación y Social media podrían ser integraciones
  (Slack, Meta) en lugar de construirse. Decidir en cada brainstorm.
- **Roles:** Tareas, Comunicación y el equipo en general piden activar el sistema de
  roles (ya preparado en los cimientos). Buen momento para activarlo: antes del módulo 6.
