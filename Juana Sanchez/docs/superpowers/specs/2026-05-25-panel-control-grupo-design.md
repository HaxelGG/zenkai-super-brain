# Panel de Control — Grupo Juana Sánchez

**Fecha:** 2026-05-25
**Estado:** Diseño aprobado · pendiente de plan de implementación
**Alcance de este spec:** Cimientos + módulo Inventario (de punta a punta). El resto de
módulos quedan mapeados como roadmap, no se construyen aquí.

---

## 1. Contexto y objetivo

Grupo Juana Sánchez opera tres firmas: **Juana Sánchez** (moda/ceremonia), **Lolikas**
(bolsos, cinturones, monederos) y **Printellar**. Ya existe una landing pública
(Next.js 15 en Vercel, repo `HaxelGG/GrupoJuanaSanchez`) — esto NO la toca.

Este proyecto es una herramienta **interna de operaciones**: un panel de control
(mini-ERP) para administrar los departamentos del grupo. Es un proyecto nuevo y
separado de la landing.

**Objetivo de esta primera entrega:** dejar funcionando los cimientos de la plataforma
y un primer módulo completo (Inventario), validando el patrón que luego se replica en
todos los demás módulos.

## 2. Decisiones tomadas (brainstorming 2026-05-25)

| Decisión | Elección |
|---|---|
| Usuarios | Equipo con roles, pero **login simple ahora** y arquitectura preparada para añadir roles/equipo sin rehacer. |
| Plataforma | **Web responsive + PWA** (instalable en móvil). Un solo código, un solo deploy. App nativa descartada por ahora. |
| Primer módulo | **Inventario**. |
| Origen de datos de inventario | **Manual desde cero**. El panel es la única fuente de verdad. Diseñar pensando en enchufar Shopify u otra tienda más adelante. |

## 3. Stack

- **Next.js 15 (App Router)** — mismo stack que la landing existente.
- **Supabase** — Postgres + Auth + Row Level Security (RLS) + Storage de imágenes.
  RLS es la pieza clave para el requisito "roles + multi-empresa después": aísla los
  datos de cada firma a nivel de base de datos.
- **Vercel** — despliegue (deploy = git push, igual que la landing).
- **shadcn/ui** — componentes de panel administrativo (tablas, formularios, modales).

Alternativas descartadas: app nativa / backend a medida (más trabajo sin beneficio
claro), no-code tipo Airtable/Retool (no es una app propia de verdad).

## 4. Cimientos (compartidos por todos los módulos)

### 4.1 Autenticación
- Email + contraseña vía Supabase Auth.
- Hoy: un único usuario `owner` (el dueño). Sin flujo de invitación todavía.

### 4.2 Multi-empresa
- Toda fila de datos lleva `company_id`.
- Tres empresas sembradas: Juana Sánchez, Lolikas, Printellar.
- Selector de empresa en la cabecera: cambia el contexto activo o muestra "Todas".

### 4.3 Roles (preparados, no activos)
- Tabla `profiles` con campo `role` (`owner` | `admin` | `staff`).
- Tabla `user_companies` (qué empresas puede ver cada usuario) — para activar después.
- Políticas RLS escritas desde el inicio; hoy el `owner` ve todo.
- Activar el equipo en el futuro = invitar usuarios + asignar rol/empresas, sin
  reescribir el modelo de datos.

### 4.4 App shell
- Barra lateral: navegación de módulos, selector de empresa, perfil de usuario.
- Layout responsive; la estructura donde se enchufa cada módulo nuevo.

### 4.5 PWA
- `manifest.json` + service worker → instalable en pantalla de inicio del móvil.
- Diseño responsive real (no solo "se encoge").

## 5. Módulo Inventario

### 5.1 Modelo de datos
- **`products`**: `id`, `company_id`, `name`, `sku`, `category_id`, `description`,
  `cost`, `price`, `image_url`, `status` (activo/inactivo), `low_stock_threshold`,
  `created_at`, `updated_at`.
- **`stock_movements`**: `id`, `product_id`, `type` (`in` | `out` | `adjust`),
  `quantity`, `reason` (compra/venta/merma/ajuste…), `note`, `created_by`,
  `created_at`. El stock actual de un producto se deriva de la suma de sus
  movimientos (fuente de verdad auditable), cacheado/calculado para mostrar rápido.
- **`categories`**: `id`, `company_id`, `name`.

### 5.2 Pantallas
1. **Lista de productos** — tabla con buscador, filtros (empresa/categoría/estado),
   columna de stock con **alerta visual de stock bajo** (por debajo del umbral).
2. **Ficha de producto** — alta/edición + foto + historial de movimientos.
3. **Ajuste rápido de stock** — sumar/restar con motivo obligatorio; crea un
   `stock_movement`.
4. **Resumen de inventario** — nº de productos, valor total del stock (precio × stock),
   lista de productos bajo mínimo.

### 5.3 Reglas
- Cambios de stock SIEMPRE vía `stock_movements` (nunca editar un número suelto) →
  historial y auditoría completos.
- Filtros respetan la empresa activa del selector.

## 6. Roadmap (mapeado, NO en este spec)

Orden lógico por dependencias, cada uno su propio ciclo spec → plan → construir,
reutilizando los cimientos:

**CRM → Cotizaciones → Ventas → Finanzas/Revenue → Dashboards/Charts (BI) →
Tareas de equipo → Comunicación → Social media → Automatizaciones IA → 2º cerebro.**

## 7. Criterios de éxito (esta entrega)

- Puedo iniciar sesión y ver el panel en escritorio y móvil (instalable como PWA).
- Puedo cambiar entre las tres empresas y ver datos aislados por empresa.
- Puedo dar de alta productos, ajustar stock con motivo, y ver el historial.
- La lista resalta productos bajo mínimo y el resumen muestra valor total del stock.
- La base de datos tiene RLS y el modelo de roles listo para activar equipo después.

## 8. Fuera de alcance (explícito)

- Cualquier módulo distinto de Inventario.
- Invitación de usuarios / gestión de equipo activa.
- Integración con Shopify u otras tiendas.
- App nativa iOS/Android.
