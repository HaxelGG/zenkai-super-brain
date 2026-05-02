# WORKFLOW · Recuperar Lead Frío
## Reactivación sistemática de leads perdidos o inactivos

**Cuándo se ejecuta:** mensual · sobre leads archivados como "perdidos" hace 60+ días
**Agentes:** HERMES-FOLLOW · ZEUS-DECIDE · ARES (insights de ángulos)

---

## DIAGRAMA DE FLUJO

```
[Mensual · primer lunes]
    ↓
Filtrar Airtable `leads` archivados:
- Estado: "perdido" o "no respondió"
- Fecha de última interacción: hace 60-365 días
- Score original: ≥4 (no recuperar score bajo)
    ↓
Agrupar por razón de pérdida:
    ├─ Precio
    ├─ Timing
    ├─ Ya tomó otro proveedor
    ├─ Cambio interno (CEO nuevo, pivot)
    └─ Sin razón clara
    ↓
Diseñar 1 ángulo de reactivación por grupo (con ARES)
    ↓
Enviar mensaje personalizado (HERMES-FOLLOW)
    ↓
    ├─ Responde positivo → reabrir como lead activo (workflow-nuevo-cliente.md)
    ├─ Responde negativo educado → archivar definitivo
    └─ No responde en 14 días → segundo intento con ángulo distinto
    ↓
Si segundo intento no funciona → archivar definitivo
```

---

## PASOS DETALLADOS

### PASO 1 · Filtrar leads candidatos
**Owner:** HERMES-FOLLOW
**Cadencia:** primer lunes de cada mes

Criterios de inclusión:
- Score original era ≥4 (sí, era cualificable, pero no cerró)
- Última interacción hace 60-365 días (no más de 1 año)
- No archivado por motivo "no era buen fit" (esos no recuperar)

Salida: lista de N leads candidatos

### PASO 2 · Agrupar por razón
**Owner:** HERMES-FOLLOW

Razones típicas:
- **Precio** (~30% de las pérdidas)
- **Timing** (~25%)
- **Tomó otro proveedor** (~20%)
- **Cambio interno** (~10%)
- **Sin razón clara / desapareció** (~15%)

### PASO 3 · Diseñar ángulo por grupo
**Owner:** HERMES-FOLLOW + ARES (insights)

#### Ángulo "Precio"
```
"Hola [nombre], hace [N meses] hablamos sobre [servicio].
En aquel momento el precio fue una barrera. 
Hemos optimizado el stack y ahora podemos ofrecer la 
versión Eco a un precio que antes no podíamos sostener.
¿Sigues con el mismo dolor de [dolor X]?"
```

#### Ángulo "Timing"
```
"Hola [nombre], hace [N meses] me dijiste 'no es el momento'.
¿Sigue siendo así o ya hay espacio para conversar?
Tengo un caso reciente de [empresa similar del sector] 
que te puede dar contexto."
```

#### Ángulo "Tomó otro proveedor"
```
"Hola [nombre], hace [N meses] estabas evaluando con otra agencia.
Sin presionar — ¿cómo va? Si te ha funcionado, genial.
Si no se materializó como esperabas, podemos 
mostrarte cómo lo hacemos diferente."
```

#### Ángulo "Cambio interno"
```
"Hola [nombre], asumo que ha habido cambios desde nuestra
última conversación hace [N meses]. Si en algún momento
quieren retomar la digitalización con [enfoque],
tenemos un caso fresco que muestra el camino."
```

#### Ángulo "Desapareciste"
```
"Hola [nombre], hace tiempo no sé de ti. Espero que estés bien.
Si la conversación de [proyecto] sigue en mente, aquí estoy.
Si no, perfecto también."
```

### PASO 4 · Personalización por lead
**Owner:** HERMES-FOLLOW

Cada mensaje se personaliza con:
- Nombre · empresa · sector
- Lo último que se conversó (de Airtable `leads`)
- Caso de éxito reciente del sector (si lo hay · ARES o ATLAS)

### PASO 5 · Envío
**Owner:** HERMES-FOLLOW
**Canal:** WhatsApp (mejor) o email
**Timing:** martes 11:00 AM (mejor tasa de respuesta histórica)

### PASO 6 · Tracking de respuestas

```
Si responde POSITIVO (interés en reabrir):
  → reactivar como lead activo
  → agendar llamada en <72h
  → entrar a workflow-nuevo-cliente.md desde PASO 4 (llamada de descubrimiento)
  → Score actualizado en Airtable

Si responde NEGATIVO con cordialidad:
  → archivar definitivo · razón actualizada
  → no contactar más

Si NO responde en 14 días:
  → segundo intento con ángulo distinto

Si tampoco responde al segundo intento:
  → archivar definitivo
```

### PASO 7 · Análisis trimestral
**Owner:** ZEUS

Cada 3 meses, ZEUS revisa:
- Tasa de reactivación por ángulo (cuál funciona mejor)
- Patrones en razones de pérdida (¿hay algo que podemos arreglar upstream?)
- Insights para ARES (mejorar ads para no perder estos leads en primer lugar)
- Insights para LEX (mejorar términos de propuesta)

---

## KPIs DEL WORKFLOW

| KPI | Objetivo |
|-----|----------|
| Tasa de respuesta a primer intento | >15% |
| Tasa de reactivación a lead activo | >5% |
| Conversión de reactivación a cierre | >25% |
| Costo del workflow (tiempo + tokens) | <$20 USD por reactivación cerrada |

---

## REGLAS INQUEBRANTABLES

- **Nunca** mensaje genérico copy-paste. Personalizar siempre.
- **Nunca** segundo intento al mismo lead con el mismo ángulo.
- **Nunca** intentar reactivar más de 2 veces (después es spam).
- **Nunca** mentir sobre nuevos features/precios para reactivar (es engaño, daña marca).
- **Siempre** registrar el resultado en Airtable (insumo para el análisis trimestral de ZEUS).
- **Siempre** mantener tono cordial y sin presión.

---

## CASOS EDGE

- **Lead que responde "ya cerré con otra agencia y estoy feliz":** felicitar genuinamente, archivar, posible referido futuro.
- **Lead que responde "ahora sí, urgente":** priorizar en el pipeline · agendar llamada en <24h.
- **Lead que pidió no ser contactado más:** respetar absoluto · no incluir en futuras campañas.
- **Lead que se convirtió en cliente competidor (ej. abrió agencia):** archivar como "no recuperar" · es competencia ahora.
