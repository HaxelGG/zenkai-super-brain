# Visión "Atelier Operativo" — Sistema operativo editorial · Grupo Juana Sánchez

**Fecha:** 2026-05-25
**Naturaleza:** Visión-programa (multi-fase). NO es un solo encargo. Fuente de verdad del rediseño
y de la expansión de módulos del panel.
**Hilo conductor:** un ERP con alma editorial — cada módulo con nombre de oficio, estética de
casa de alta costura, "La Memoria" (archivo de 50 años) como corazón.

Base ya construida: cimientos + Inventario + CRM + Cotizaciones (en producción). Sistema de
marca "Atelier" (tokens crema/tinta, Fraunces+Geist, acento por empresa) en rama `frontend-atelier`
(preview). Este doc define lo que viene ENCIMA.

---

## Dos pistas de trabajo (mapean a los dos terminales)

- **PISTA A — Sistema de diseño & UX (frontend).** La sección I del brief. La trabajo yo en
  `frontend-atelier`. No crea tablas/BD nuevas; eleva toda la app.
- **PISTA B — Módulos / departamentos nuevos (vertical completo).** La sección II. Los construye
  la terminal-builder, uno a uno (spec→plan→build), reutilizando cimientos + el sistema de diseño.

Regla de oro vigente: **un agente por archivo a la vez**; integrar por `main`; yo despliego.

---

## PISTA A · Sistema de diseño (backlog priorizado)

### A0 — Hecho (rama frontend-atelier)
Tokens Atelier→shadcn, Fraunces display, esquinas rectas, shell/sidebar/login, acento por empresa, títulos serif globales.

### A1 — Núcleo de experiencia (prioridad alta, alto ROI, poco riesgo)
- **Modo oscuro "edición nocturna"** — negro tabaco #0F0D0B, ink invertido, malva/mint/dorado más saturados, papel cálido. Toggle + persistencia.
- **Densidad ajustable** (compact / comfortable / spacious) — afecta padding de filas, alturas KPI, espaciado de paneles. En ajustes + persistida.
- **Toasts editoriales** (sonner, Fraunces, abajo-derecha: "Pedido confirmado · Carmen Vidal") → sustituyen los `alert()`.
- **Estados vacíos con voz de la casa** ("El taller de Printellar está en silencio esta semana").
- **Skeleton loaders** con shimmer crema/marfil que respetan jerarquía (`loading.tsx` por ruta).
- **Modal de confirmación editorial** para acciones destructivas (no alert genérico).
- **Hover de cards** translateY(-2px) + sombra suave; **transición líquida de marca** (400ms easing al cambiar firma).
- **Number count-up** en KPIs + **sparklines dibujadas** (stroke-dashoffset).

### A2 — Biblioteca de componentes (prioridad media)
- **Drawer lateral derecho** (ficha de clienta/pieza/pedido sin perder la lista).
- **Command palette ⌘K** — modal grande, fondo desenfocado, resultados agrupados (Vistas, Clientas, Pedidos, Piezas).
- **Filter chips** removibles sobre tablas + **bulk actions bar** al seleccionar filas.
- **Tooltip system** editorial con delay suave.
- **Avatar system** (iniciales / foto / anillo por rol). **Tags/chips** ricos (icono, avatar, removible).
- **Progress bars/meters**, **date/range/color pickers** editoriales (los nativos rompen el conjunto).

### A3 — Identidad fina (prioridad media-baja)
- **Set de iconos propio del oficio** (tijera=cortar, hilo+aguja=producción, carrete=taller, pluma=editorial). Trazos 1.4–1.6, esquinas vivas. Variantes outline/filled/duotone.
- **Escala tipográfica nombrada** (display/title/heading/body/label/micro) documentada; dosificar la cursiva Fraunces (solo H1 + 1 palabra clave por panel); eje `opsz` real; numerales old-style en textos narrativos.
- **Modo presentación / executive** (cifras grandes, menos cromo, para reuniones de dirección).
- **2 surfaces más**: paper-warm (zonas premium) y paper-cool (zonas técnicas como inventario).

### A4 — Móvil real (prioridad alta para uso en tienda)
- Brand switcher como **dropdown** (no oculto). **Tablas → tarjetas verticales** (no scroll horizontal).
- **Sidebar → bottom navigation** (5 iconos) en pantallas muy pequeñas. **Kanban → carrusel** scroll-snap.

### A5 — Detalles editoriales & media (deleite)
- Footer rotativo con citas del archivo ("La belleza está en la trama" — Juana, 1982).
- **Print stylesheet** tipo página de catálogo. Cursor editorial en hero. Easter egg en el logo.
- **Fotografía real de producto** (thumb 48×48 en tablas, galería en drawer), vista grid de fotos, lookbook por temporada, mood boards en dashboard.

---

## PISTA B · Módulos nuevos (con nombre editorial + prioridad + dependencias)

Prioridad: **P0** alma/operación crítica · **P1** alto valor · **P2** después.

### Producto y catálogo
- **Colecciones — "Temporadas"** · P1 · dep: Inventario. Cada colección (spring 26, cápsula novia): brief, líneas, piezas, fechas sample→producción→lanzamiento→liquidación.
- **Patrones / IP — "El cuaderno cerrado"** · P2 · patronaje, bordados, signos registrados, control de versiones y acceso.
- **Atelier reparaciones — "Segunda vida"** · P2 · dep: CRM. Reparación/restauración de piezas devueltas.

### Operaciones del oficio
- **Taller / Producción — "El bastidor"** · P0 · dep: Inventario/Colecciones. Órdenes de fabricación, qué se cose ahora, lead times, QC, defectos, muestras, patronaje; vista taller en tiempo real.
- **Materiales / Almacén — "El telar"** · P1 · dep: Proveedores. Telas/hilos/botones/forros: stock por metro, proveedor, coste, certificados.
- **Boutiques — "Las casas"** · P1 · dep: Inventario/Ventas. Cada tienda (Serrano, Salamanca, Barcelona): ventas, personal, stock, citas VIP, eventos.
- **Logística — "En camino"** · P2 · envíos, devoluciones, transportistas, aduanas, almacenes.

### Personas
- **RRHH / Equipo — "Las manos de la casa"** · P1 · plantilla con foto, rol, antigüedad; organigrama; vacaciones, fichajes, nóminas, reseñas; pestañas Taller/Comercial/Digital.
- **Proveedores — "Los aliados"** · P1 (habilita El telar) · telares/curtidurías/hilaturas; histórico, fiabilidad, coste, certificados (origen, fair trade).
- **Prensa & PR — "La voz fuera"** · P2 · medios, apariciones, press kits, embargos, embajadoras.
- **El Círculo / Loyalty — "Las íntimas"** · P2 · dep: CRM. VIP: niveles, puntos, beneficios, personal shopper, eventos.

### Dinero
- **Financiero — "El libro mayor"** · P0 · dep: Ventas/Cotizaciones. P&L por firma, cash flow, facturas emitidas/recibidas, conciliación, presupuestos.
- **Costing — "El verdadero precio"** · P1 · dep: Inventario/Taller. Coste por pieza (materia + mano de obra + overheads) → margen unitario por firma/categoría.
- **Contabilidad / Fiscal — "Las cuentas claras"** · P2 · IVA/IRPF/Sociedades, modelos AEAT, cierres.

### Estrategia y comunicación
- **Archivo digital — "La Memoria"** · **P0 — ALMA DEL PANEL** · 50 años de la casa: piezas históricas, fotos vintage, documentos del fundador, prensa antigua, hitos. Hemeroteca elegante.
- **Eventos / Pasarelas — "Las citas"** · P2 · calendario MBFW, fashion weeks, press days, cocktails; producción por evento.
- **Marketing & Campañas — "Las temporadas"** · P2 · brief creativo, calendario, shootings, influencers, ROI.

### Servicio
- **Atención al cliente — "Conversaciones abiertas"** · P1 · dep: CRM. Tickets, IG/email/WhatsApp Business, SLA, tiempos de respuesta.
- (Reparaciones → ver "Segunda vida".)

### Sostenibilidad / compliance / datos
- **Trazabilidad — "De dónde viene"** · P2 · dep: Taller/Proveedores. Línea de cada pieza, huella de carbono, GOTS/OEKO-TEX.
- **Reportes ESG** · P2 · para inversores/prensa, generados automáticos.
- **Legal** · P2 · contratos, marcas, GDPR, litigios.
- **Data Lab — "El observatorio"** · P2 · cohortes, atribución multicanal, forecast, A/B, reportes ejecutivos.

---

## Fase de arranque propuesta (lo que ejecuto YA)

**PISTA A, lote A1** sobre `frontend-atelier` (visible en preview, sin tocar producción):
modo oscuro editorial · densidad ajustable · toasts · estados vacíos con voz · skeletons ·
modal de confirmación · transición líquida de marca + count-up + hover cards.
→ Eleva las 3 vistas existentes de golpe y es 100% demostrable.

**PISTA B, primer módulo P0:** sugiero **"La Memoria" (Archivo)** — es el alma y es muy
visual/editorial (galería, hitos), o bien **"El bastidor" (Taller)** si prefieres impacto
operativo inmediato. Lo construye la terminal-builder con su ciclo spec→plan→build.

El resto se programa por prioridad (P0→P1→P2), cada módulo su ciclo, yo integro y despliego.
