# SOP · Mantenimiento de Sistemas en Producción
## Cómo mantener vivo lo que entregamos sin sorpresas

**Owner:** NEXUS-MONITOR + FORGE
**Aplica a:** clientes con retainer activo
**Última revisión:** 2026-05-01

---

## OBJETIVO

Sistemas en producción que (a) no se caen, (b) cuando se caen lo sabemos antes que el cliente, (c) cuando se caen tenemos rollback en minutos, (d) costos no se disparan, (e) el cliente confía cada día más en nosotros.

---

## CHECKS AUTOMATIZADOS (CONTINUOS)

### Uptime y disponibilidad
- BetterStack o UptimeRobot pingando cada 1-3 min
- Endpoints críticos por proyecto:
  - Landing page activa
  - Webhook de formulario respondiendo
  - WhatsApp Cloud API respondiendo
  - Airtable API accesible

### Performance
- Core Web Vitals semanal (Lighthouse vía cron · Vercel Speed Insights · etc.)
- Latencia de webhooks <2s p95
- Tiempo de respuesta de chatbots <3s p95

### Errores
- Sentry · LogSnag · BetterStack Logs
- Alertas si error rate >2% en cualquier flow
- Alertas si flow específico falla 3+ veces consecutivas

### Costos
- Anthropic API: alerta si daily spend >120% del baseline
- Make: alerta si ops/mes >80% del límite
- WhatsApp Cloud API: alerta si >120% del baseline
- Otras APIs según proyecto

### Seguridad
- Snyk · Dependabot para dependencias con vulnerabilidades
- Logs de acceso anómalos (intentos de login fallidos · país inusual)
- Rotación trimestral de API keys

---

## CHECKS MANUALES (CADENCIA)

### Diario (5-10 min · NEXUS-MONITOR)
- Revisar dashboard de alertas activas
- Confirmar que reportes automáticos generaron
- Revisar tickets de ECHO

### Semanal (30 min · NEXUS + FORGE · martes 10 AM)
- Lighthouse + performance trends
- Costos vs presupuesto cliente
- Errores recurrentes (patrones)
- Pendientes de mantenimiento (bumps · refactors)

### Mensual (90 min · primer martes del mes)
- Revisión de salud completa cliente por cliente
- Update de dependencias críticas (security patches)
- Análisis de capacity planning (¿se acerca a límites?)
- Postmortem de incidentes del mes
- Discutir recomendaciones de mejora con cliente

### Trimestral
- Auditoría de seguridad
- Revisión de costos vs valor (¿stack óptimo?)
- Plan de roadmap del cliente para siguiente trimestre

---

## INCIDENTES EN PRODUCCIÓN

### Clasificación

🔴 **P0 · Crítico**
- Sistema caído (cliente no puede operar)
- Pérdida de datos
- Brecha de seguridad
**Tiempo de respuesta:** <15 min · 24/7

🟠 **P1 · Alto**
- Funcionalidad importante rota
- Performance degradado significativamente
- Bug que afecta a >10% de usuarios
**Tiempo de respuesta:** <4h en horario laboral

🟡 **P2 · Medio**
- Bug menor
- UX issue
- Performance degradado en algún flow específico
**Tiempo de respuesta:** <24h en horario laboral

🟢 **P3 · Bajo**
- Cosmético
- Feature request
**Tiempo de respuesta:** próximo sprint de mantenimiento

### Protocolo P0 / P1

```
PASO 1 — ACUSAR RECIBO (<5 min)
  - Confirmar al cliente que vimos el reporte
  - Asignar owner técnico

PASO 2 — ESTABILIZAR (<15 min P0 · <2h P1)
  - Rollback si cambio reciente lo causó
  - Pausar flow problemático si aislable
  - NO buscar causa raíz primero · estabilizar primero

PASO 3 — DIAGNOSTICAR (después de estabilizar)
  - Activar skill `systematic-debugging`
  - Logs · errores · cambios recientes
  - Hipótesis con evidencia

PASO 4 — FIX
  - Test que reproduce el bug
  - Fix mínimo que pasa el test
  - Code review (skill `requesting-code-review`)
  - Deploy con feature flag si arriesgado

PASO 5 — POSTMORTEM (D+1 a D+3)
  - Doc en Notion del cliente
  - Causa raíz documentada
  - Acciones para que no repita
  - Métricas de monitoreo agregadas
  - Compartir con cliente (transparencia gana confianza)
```

---

## ACTUALIZACIONES Y CAMBIOS

### Cambios solicitados por cliente

**Si está dentro de retainer:**
- Validar alcance de retainer (típicamente: ajustes menores · ediciones de copy/imágenes · pequeñas reglas de negocio · troubleshooting)
- Implementar · QA · deploy
- Documentar en Notion del cliente

**Si está fuera de retainer:**
- Cotizar como cambio puntual o proyecto nuevo
- LEX genera orden de cambio
- ORACLE cotiza
- Cliente firma · pago · ejecución

### Updates de dependencias

- **Security patches:** dentro de 7 días en Pro · 24h en Premium
- **Minor updates:** mensual planificado
- **Major updates:** trimestral planificado · con plan de testing

### Migraciones de stack

- Nunca sin aprobación del cliente
- Con plan de rollback siempre
- Test extenso en staging
- Rollout gradual si afecta a usuarios finales

---

## DOCUMENTACIÓN VIVA

`clientes/[slug]/automatizaciones/` debe estar 100% al día. NEXUS-MONITOR alerta si:
- Un flow se modificó hace >7 días sin update en docs
- Un agente IA cambió de prompt sin actualizar docs
- Una integración se agregó sin documentar

---

## COSTOS · MONITOREO

Cada cliente tiene presupuesto mensual de operativo (definido por ORACLE · típicamente: costo herramientas + APIs).

Si un cliente excede su presupuesto:
- Alerta a 80%
- Alerta crítica a 100%
- Si pasa 120%, ZEUS-DECIDE: ¿se ajusta el contrato? ¿se reduce uso? ¿se absorbe?
- NUNCA cortar el servicio sin avisar al cliente

---

## REGLAS INQUEBRANTABLES

1. **Estabilizar primero, diagnosticar después.** En P0 nunca al revés.
2. **Postmortem obligatorio** después de cada P0 y P1.
3. **Sin fix sin causa raíz documentada.** No band-aids permanentes.
4. **Sin push directo a main** en proyectos cliente. Siempre PR + review.
5. **Alertas de costos siempre activas.** Sorpresa en factura = pérdida de cliente.
6. **Documentación al día.** Si hace 30 días no se actualiza · revisar.
7. **Backups testeados.** Tener backup no testeado = no tener backup.
8. **Transparencia con el cliente.** Cuando algo sale mal, contar antes de que pregunten.
