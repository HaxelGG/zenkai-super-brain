# SOP · Entrega de Proyecto
## Cómo cerrar un proyecto sin dejar dudas y dejando al cliente queriendo más

**Owner:** ATLAS-PROJECT + ATLAS-QA
**Última revisión:** 2026-05-01

---

## OBJETIVO

La entrega final no es "subir a producción". Es asegurar que (a) todo funciona, (b) el cliente entiende qué tiene y cómo usarlo, (c) hay un plan claro para los próximos 30 días, (d) ZENKAI tiene la documentación para mantener el sistema sin depender de la memoria.

---

## CHECKLIST DE PRE-ENTREGA (1 SEMANA ANTES)

### Producto/sistema
- [ ] Todos los entregables del contrato completados
- [ ] QA universal pasado (ATLAS-QA)
- [ ] QA específico del tipo de entregable pasado
- [ ] Sistema testeado en producción con datos reales (no mock)
- [ ] Pixel · CAPI · GA4 · webhooks verificados
- [ ] Performance: LCP <2.5s · sin errores en consola
- [ ] Mobile + Desktop probados
- [ ] Backup de configuración inicial guardado

### Documentación
- [ ] Notion del cliente actualizado con TODO lo construido
- [ ] Diagrama de arquitectura (Mermaid) del sistema
- [ ] Lista de credenciales · accesos · permisos (en password manager)
- [ ] Loom de capacitación grabado (10-15 min)
- [ ] Manual escrito en Notion (paso a paso de tareas comunes)
- [ ] Documentación técnica para mantenimiento (cómo modificar)

### Operativo
- [ ] Equipo del cliente capacitado (mínimo 1 sesión 90 min)
- [ ] Canales de soporte activos (WhatsApp · Notion · Cal.com)
- [ ] Reportes automáticos configurados (ARES-REPORT)
- [ ] Alertas configuradas (NEXUS-MONITOR)
- [ ] Plan de mantenimiento mensual definido

### Legal & Financiero
- [ ] Contrato cumplido al 100% según alcance positivo
- [ ] Última factura emitida y pagada (si aplica)
- [ ] Datos del cliente devueltos o eliminados según contrato (cláusula 8)
- [ ] NPS · CSAT solicitado al cliente

---

## REUNIÓN DE ENTREGA (D-DAY)

**Duración:** 60-90 min
**Asistentes:** Owner ZENKAI + decision-maker cliente + project owner cliente
**Modalidad:** preferible presencial si cliente local · sino Google Meet con grabación

### Agenda

```
0-10 min · Recap del proyecto (qué pedían · qué entregamos)
10-30 min · Walk-through del sistema en vivo
30-45 min · Capacitación de tareas críticas
45-55 min · Plan de los próximos 30 días
55-65 min · Q&A
65-75 min · NPS + CSAT del proyecto
75-90 min · Conversación de continuidad (retainer · upsell · referidos)
```

### Walk-through en vivo

Mostrar (sin diapositivas · directamente en el sistema):
1. Cómo se ve el flujo end-to-end (lead entra · sistema responde · datos llegan a CRM · cliente recibe notificación · etc.)
2. Cómo el cliente accede a sus datos
3. Cómo modificar lo que es modificable por el cliente
4. Qué NO debe modificar (y por qué) — escalada si necesita
5. Dónde están las alertas y monitoreo
6. Reportes automáticos · cómo leerlos

### Capacitación de tareas críticas

Mostrar haciendo (no solo explicando):
- Recibir un lead nuevo · interpretar datos
- Ajustar configuraciones simples (textos · imágenes · horarios)
- Bloquear un usuario / dar de baja un cliente
- Generar un reporte ad-hoc
- Cuándo escalar a ZENKAI

### Plan de los próximos 30 días

Doc compartido con:
- Qué está garantizado (soporte primer mes ilimitado · si aplica)
- Qué requiere retainer
- Qué requiere proyecto nuevo (si quieren agregar features)
- Calendario de check-ins (semana 1 · semana 2 · mes 1)

---

## SOPORTE POST-ENTREGA

### Primer mes (default · ilimitado · si aplica al tier)
- Slack / WhatsApp directo con owner ZENKAI
- Tiempos de respuesta:
  - Crítico: <2h
  - Alto: <24h
  - Normal: <48h
- Cualquier ajuste menor sin costo
- Cambios de alcance → orden de cambio (LEX)

### Después del primer mes
- Si tiene retainer: continuidad según contrato
- Si no tiene retainer: tickets puntuales con tarifa

---

## DOCUMENTACIÓN INTERNA QUE QUEDA EN ZENKAI

Después de la entrega, el equipo ZENKAI tiene en `clientes/[slug]/`:

```
clientes/[slug]/
├── briefing.md               ← brief completo
├── propuesta.md              ← propuesta firmada
├── contrato.md               ← contrato firmado
├── proyecto.md               ← plan completo · histórico
├── reportes/                 ← todos los reportes generados
├── assets/                   ← assets del cliente
├── automatizaciones/         ← documentación de cada flow/agente
└── postmortem.md             ← lecciones aprendidas (interno)
```

**`postmortem.md`** se llena al cierre con:
- Qué salió bien (replicar)
- Qué salió mal (evitar)
- Qué nos sorprendió
- ¿Es candidato a caso de estudio? (con permiso del cliente)
- ¿Generó referidos potenciales?

---

## CASOS DE ESTUDIO

Si el cliente acepta:

1. Pedirle por escrito (email · WhatsApp · contrato anexo)
2. Recolectar métricas reales antes/después
3. Capturar quote del cliente
4. APOLLO-TEMPLATE diseña el caso (PDF · página web · post LinkedIn)
5. Aprobación final del cliente antes de publicar
6. Si rebrand/anonimato requerido, aceptar (caso anonimizado vale igual)

---

## REGLAS INQUEBRANTABLES

1. **Nunca** declarar entrega completada sin checklist 100% pasado.
2. **Nunca** entregar sin Loom de capacitación.
3. **Nunca** dejar al cliente sin documentación escrita (Loom no sustituye texto).
4. **Nunca** entregar sin reunión sincrónica (asíncrona insuficiente).
5. **Siempre** solicitar NPS · CSAT al cierre.
6. **Siempre** plan claro de los próximos 30 días al cierre.
7. **Siempre** llenar `postmortem.md` interno (futuro fundamental).
8. **Siempre** pedir referidos en la reunión de entrega (si NPS >8).
