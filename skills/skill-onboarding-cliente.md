---
name: skill-onboarding-cliente
description: Protocolo de 48h post-firma · kit de bienvenida · kickoff · brief detallado · primer entregable a vista
type: flexible
agentes_principales: [ATLAS]
---

# Skill — Onboarding de Cliente

## Cuándo usar

Inmediatamente después de:
1. Contrato firmado (LEX-CONTRACT verificado)
2. Primer pago recibido (ORACLE confirmó)

NO empezar onboarding sin estos dos prerequisitos. Es una regla del proyecto.

## Cómo usar

### H+0 a H+4 (PRIMERAS 4 HORAS)

**ATLAS-ONBOARD ejecuta automáticamente:**

1. **Mensaje WhatsApp de bienvenida** (script personalizado, no genérico)
```
Hola [nombre], 🎉

Bienvenido oficialmente al equipo ZENKAI.

Acabamos de recibir el contrato firmado y el primer pago. ¡Empezamos!

En las próximas horas vas a recibir:
- Acceso a tu Notion privado (donde vas a vivir el proyecto)
- Link para agendar nuestra kickoff call (esta semana)
- Formulario de brief detallado para que me cuentes todo lo que necesito saber

Cualquier cosa por aquí mismo.

Equipo ZENKAI
```

2. **Crear estructura de cliente:**
   - Copiar `clientes/_template-cliente/` → `clientes/[cliente-slug]/`
   - Llenar `briefing.md` con datos del contrato
   - Llenar `propuesta.md` con copy de la propuesta enviada
   - Llenar `contrato.md` con link al PDF firmado en Drive
   - Crear `proyecto.md` (vacío, se llena post-kickoff)

3. **Crear Notion del cliente:**
   - Workspace privado (un workspace por cliente activo)
   - Páginas: Brief · Plan · Cronograma · Reportes · Capacitación · Soporte
   - Compartir con el cliente (lectura · permite comentar)

4. **Asignar equipo interno:**
   - Owner del cliente: [Perfil 1 o Perfil 2]
   - Agentes activos: [lista basada en propuesta]
   - Freelancers asignados: [via HIVE-TASKS]

### H+4 a H+24 (SIGUIENTES 20 HORAS)

5. **Agendar kickoff call:**
   - Link Cal.com con disponibilidad de los próximos 5 días laborales
   - Duración: 60 min (no más, no menos)
   - Modalidad: Google Meet (default) · presencial si cliente local importante

6. **Enviar formulario de brief detallado:**
   - Typeform / JotForm Pro (Pro+) · Google Form (Eco)
   - 15-25 preguntas según complejidad del proyecto
   - Plazo de devolución: antes del kickoff
   - Incluye preguntas de:
     - Acceso a herramientas existentes (logins · permisos · integraciones)
     - Stakeholders del lado del cliente
     - Restricciones operativas (horarios · días no disponibles · regulación)
     - Casos de éxito que admiran
     - Casos que NO quieren ser
     - Métricas internas que ya miden
     - Referencias visuales y de tono (si APOLLO está activo)

### H+24 a H+48 (SIGUIENTES 24 HORAS)

7. **Procesar respuestas del brief:**
   - ATLAS-COORD distribuye las respuestas a los agentes correspondientes
   - APOLLO ya empieza a explorar moodboards
   - NEXUS ya empieza a mapear integraciones técnicas
   - LEX revisa si hay particularidades legales del sector

8. **Preparar plan de proyecto v1:**
   - Gantt en Airtable (basado en cronograma de la propuesta)
   - Tareas concretas por semana
   - Owners asignados (interno + freelancer si aplica)
   - Dependencias mapeadas
   - Hitos de cliente (validaciones · feedback · approvals)

### H+48 (KICKOFF CALL)

9. **Kickoff call (60 min · estructura):**

```
0-5 min · Bienvenida y presentaciones (si hay equipo nuevo)
5-15 min · Resumen de la propuesta y validar entendimiento mutuo
15-30 min · Walk-through del plan v1 + ajustes
30-45 min · Definir canales de comunicación + frecuencia
45-55 min · Q&A
55-60 min · Próximos pasos y compromiso bilateral
```

10. **Post-kickoff:**
    - Enviar minuta en <24h
    - Plan v1 actualizado con cambios de la call
    - Agendar status semanal recurrente (default lunes 10 AM, 30 min)
    - Compartir Loom de 5 min explicando "qué va a pasar las próximas 2 semanas"

## Checklist de cierre del onboarding

H+72 (3 DÍAS POST-KICKOFF):

- ✅ Cliente tiene acceso a Notion · Drive · Cal.com (calendario compartido)
- ✅ Brief detallado completado y procesado
- ✅ Plan v1 aprobado por cliente
- ✅ Status semanal en calendarios de ambos lados
- ✅ Canales de comunicación definidos:
  - WhatsApp grupo (con bot ECHO de soporte) → consultas rápidas
  - Email → comunicación formal
  - Notion → documentación del proyecto
  - Status semanal → review estructurado
- ✅ Primer hito visible (algo que el cliente "vea" en <7 días post-kickoff)
- ✅ NPS del onboarding al cliente (CSAT 1-10)

**Si NPS de onboarding <8:** llamar al cliente al D+5 para entender qué falló.

## Output esperado

1. Carpeta `clientes/[slug]/` poblada
2. Notion del cliente operativo
3. Plan v1 aprobado
4. Status semanal recurrente agendado
5. Canales de comunicación definidos
6. Primer entregable visible programado para <D+7 post-kickoff
7. NPS de onboarding capturado al D+5

## Reglas inquebrantables

- **Nunca** empezar onboarding sin contrato firmado + primer pago.
- **Nunca** dejar al cliente sin contacto >24h durante la primera semana.
- **Nunca** kickoff call sin brief recibido y procesado antes.
- **Nunca** prometer en kickoff lo que no está en la propuesta firmada (el alcance se modifica con orden de cambio LEX).
- **Siempre** primer hito visible en <7 días post-kickoff (genera momentum y confianza).
- **Siempre** Loom de bienvenida personalizado (más cercano que email).
- **Siempre** documentar todo en Notion del cliente desde el día 1.

## Casos edge

- **Cliente no responde el brief en 5 días:** llamada directa del owner (no email) para destrabar.
- **Cliente no puede agendar kickoff en primera semana:** agendar mes a mes igual + congelar inicio del cronograma hasta que haya kickoff.
- **Cliente cambia de mind post-firma:** activar LEX para orden de cambio · NO empezar build hasta clarificar.
- **Múltiples stakeholders del cliente con visiones distintas:** insistir en un único punto de contacto del lado cliente · si no, escalada a ZEUS.
