---
name: "Calculadora de Precios"
slug: calculadora-precios
tipo: calculadora
---

# CALCULADORA DE PRECIOS · ZENKAI
## Fórmula sagrada · ningún proyecto se cotiza sin pasar por aquí

---

## LA FÓRMULA

```
Precio mínimo del servicio = Costo operativo trimestral × 2

Costo operativo trimestral = Σ(herramientas del proyecto × 3 meses)
```

**No se asumen precios. Se calculan con las herramientas reales del proyecto.**

---

## PASO 1 — Listar herramientas del proyecto

Hoja de cálculo (mantenerla viva):

| Herramienta | Plan | Costo USD/mes | Volumen estimado | Justificación |
|-------------|------|---------------|------------------|---------------|
| Make | [Free / Core / Team / Business] | $[X] | [N ops/mes] | [...] |
| Airtable | [Free / Plus / Team / Business] | $[X] | [N registros] | [...] |
| WhatsApp Cloud API + BSP | - | $[X] | [N msg/mes] | [...] |
| Anthropic Claude API | [Sonnet/Opus/Haiku] | $[X] | [N tokens] | [...] |
| Google Gemini API | - | $[X] | [N tokens] | [...] |
| Klaviyo | [Free / Pro] | $[X] | [N contactos] | [...] |
| Cal.com | [Free / Pro] | $[X] | - | [...] |
| Framer | [Free / Mini / Basic / Business] | $[X] | - | [...] |
| Shopify | [Basic / Shopify / Plus] | $[X] | - | [...] |
| Vercel / Netlify | [Free / Pro] | $[X] | - | [...] |
| Supabase | [Free / Pro] | $[X] | - | [...] |
| Sentry | [Free / Team] | $[X] | - | [...] |
| Otras... | | | | |

**Costo herramientas mensual:** $[A] USD

---

## PASO 2 — Calcular APIs y operaciones (volumen)

### Anthropic Claude
| Modelo | Precio input | Precio output |
|--------|--------------|---------------|
| Opus 4.7 | $15 / 1M tokens | $75 / 1M tokens |
| Sonnet 4.6 | $3 / 1M tokens | $15 / 1M tokens |
| Haiku 4.5 | $0.80 / 1M tokens | $4 / 1M tokens |

**Estimación por interacción típica:**
- Chatbot ECHO: ~2K input + 500 output = $0.0096 con Sonnet
- Cualificación HERMES: ~3K input + 800 output = $0.021 con Sonnet
- Generación landing copy: ~5K input + 3K output = $0.060 con Sonnet
- ZEUS-DECIDE: ~10K input + 5K output = $0.525 con Opus

**Calcular:** [N interacciones/mes] × [costo por interacción] = $[B] USD/mes

### Make / n8n operaciones
- Free: 1,000 ops/mes (advertir antes de llegar a 800)
- Core: 10,000 ops/mes ($10)
- Team: 40,000 ops/mes ($29)
- Business: 100,000+ ops/mes ($99+)

Calcular ops por escenario × ejecuciones × cantidad de escenarios = total ops/mes.

### WhatsApp Cloud API
- Conversaciones autenticadas: ~$0.038-0.108 USD según país (CO ~$0.038)
- Mensajes utility: ~$0.012-0.040
- Mensajes marketing: ~$0.0188-0.0792

**Calcular:** [N conversaciones × costo] = $[C] USD/mes

**Costo APIs mensual:** $[B + C + ...] USD

---

## PASO 3 — Total operativo mensual

```
TOTAL OPERATIVO MENSUAL = Costo herramientas + Costo APIs
                       = $A + $B + $C + ...
                       = $[TOTAL_MENSUAL]
```

---

## PASO 4 — Costo trimestral

```
COSTO TRIMESTRAL = TOTAL_MENSUAL × 3
                = $[TOTAL_MENSUAL × 3]
```

---

## PASO 5 — Precio mínimo base (LATAM)

```
PRECIO MÍNIMO BASE = COSTO TRIMESTRAL × 2
                  = $[TOTAL_MENSUAL × 6]
```

Este es el **piso absoluto** para mercado LATAM.

---

## PASO 6 — Ajuste por mercado

| Mercado | Multiplicador típico | Cuándo usar el extremo alto |
|---------|---------------------|------------------------------|
| Colombia / LATAM (CO, EC, PE, BO) | × 1.0 | - |
| México | × 1.2 - 1.5 | empresas grandes en Mexico City |
| España | × 1.8 - 2.5 | Madrid · Barcelona · empresas medianas+ |
| Resto Europa | × 2.0 - 3.0 | UK · Alemania · Países Bajos |
| USA / Canadá | × 3.0 - 5.0 | NYC · SF · LA · Seattle |
| Australia / NZ | × 2.5 - 4.0 | Sydney · Melbourne |

**Variables que justifican el extremo alto del rango:**
- Sector B2B alto-ticket (>$10K USD/proyecto del cliente)
- Marca conocida del cliente (paga premium por reputación)
- Urgencia del proyecto
- Diferencial fuerte de ZENKAI vs competencia local
- Cliente está acostumbrado a pagar tarifas USA/EU (corporativo)

---

## PASO 7 — Sumar componente humano (si >20h)

### Tarifas humanas internas + freelancer (USD/h)

| Rol | LATAM | Europa | USA |
|-----|-------|--------|-----|
| Diseñador UI senior | $20-40 | $40-80 | $60-120 |
| Dev frontend senior | $25-50 | $50-100 | $80-150 |
| Dev backend senior | $30-60 | $60-120 | $100-180 |
| Copywriter ES | $15-35 | $30-70 | $50-100 |
| Editor video | $15-30 | $30-60 | $40-80 |
| Community manager | $10-25 | $20-40 | $25-50 |
| Especialista ads | $25-50 | $50-100 | $80-150 |
| Especialista WA / chatbot | $20-45 | $40-90 | $60-120 |

**Margen sobre costo humano:** **× 2 mínimo** (el costo es lo que pagamos al freelancer; el precio al cliente es 2× ese costo).

```
Costo humano cliente = (horas × tarifa freelancer) × 2
```

---

## PASO 8 — Validar margen

```
PRECIO FINAL = PRECIO BASE × MULTIPLICADOR_MERCADO + COSTO_HUMANO_CLIENTE
COSTO TOTAL  = (HERRAMIENTAS + APIS) × duración + (horas × tarifa freelancer)
MARGEN       = (PRECIO_FINAL - COSTO_TOTAL) / PRECIO_FINAL
```

**Mínimo aceptable:** **60%**
**Si margen <60%:** escalar a ZEUS antes de presentar al cliente.

ZEUS puede aprobar margen menor solo si:
- Cliente es caso de estudio estratégico
- Foot in the door de un sector nuevo
- Volumen de proyectos del mismo cliente compensa
- Recompensa estratégica clara (referidos, posicionamiento)

---

## PASO 9 — Modelo de cobro

| Modelo | Cuándo usar |
|--------|-------------|
| **Setup único** | Proyectos N1-N2 sin mantenimiento continuo |
| **Setup + retainer** | Proyectos con sistemas en producción · default ZENKAI |
| **Solo retainer** | Cliente recurrente establecido · permite entrar sin barrera |

**Ratio sugerido setup vs retainer:**
- Setup ≈ 1× a 3× del retainer mensual
- Retainer mensual ≈ costo herramientas × 1.5 a 2.0

---

## PASO 10 — Términos de pago

| Tipo de proyecto | Términos default |
|------------------|------------------|
| Setup <$2K USD | 100% al inicio |
| Setup $2K-10K USD | 50% al inicio · 50% a entrega |
| Setup >$10K USD | 30% al inicio · 30% a hito 1 · 40% a entrega |
| Retainer mensual | Día 1 de cada mes calendario · anticipado |
| Enterprise | Negociable · default neto 15-30 días |

---

## PLANTILLA DE CÁLCULO RÁPIDO

```
Cliente:                    [...]
Sector:                     [...]
Tier:                       [Eco / Pro / Premium]
Mercado:                    [LATAM / España / USA]

HERRAMIENTAS:
- Tool 1:                   $[X]/mes
- Tool 2:                   $[X]/mes
- ...
SUBTOTAL HERRAMIENTAS:      $[A]/mes

APIs:
- Claude tokens:            $[X]/mes
- WhatsApp:                 $[X]/mes
- ...
SUBTOTAL APIs:              $[B]/mes

TOTAL OPERATIVO:            $[A+B]/mes
TOTAL TRIMESTRAL:           $[(A+B)*3]
PRECIO BASE LATAM (×2):     $[(A+B)*6]

MULTIPLICADOR MERCADO:      × [F]
PRECIO AJUSTADO:            $[(A+B)*6*F]

HORAS HUMANAS:              [N] horas × $[T]/h × 2 = $[H]

PRECIO FINAL SETUP:         $[(A+B)*6*F + H] USD
                            ≈ $[× 4500] COP

RETAINER MENSUAL SUGERIDO:  $[(A+B)*1.7] USD/mes
                            ≈ $[× 4500] COP/mes

MARGEN ESTIMADO:            [%]
SEMÁFORO:                   [🟢 / 🟡 / 🔴]
```

---

## REGLAS INQUEBRANTABLES

1. **Nunca** dar precio sin haber listado todas las herramientas.
2. **Nunca** aceptar margen <60% sin aprobación de ZEUS.
3. **Nunca** ofrecer descuento >20% sin compensación (volumen · exclusividad · caso de estudio).
4. **Nunca** prometer precio que no incluya buffer del 15-20% para imprevistos.
5. **Siempre** presentar precio en COP **y** USD.
6. **Siempre** dar dos rutas (Eco + Pro) salvo cliente pre-elegido.
7. **Siempre** indicar validez de cotización (15-30 días default).

---

## TIPO DE CAMBIO REFERENCIA (ajustar mensual con ORACLE)

| Moneda | Tasa USD (referencia mayo 2026) |
|--------|----------------------------------|
| COP | $4,500 (rango operativo $4,200-4,800) |
| EUR | $0.92 |
| MXN | $18.5 |
| GBP | $0.78 |

Buffer ZENKAI: si cliente paga en moneda distinta a USD, agregar **5% sobre tasa del día** para cubrir volatilidad.
