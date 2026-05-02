# ZENKAI Growth Systems · Plataforma Interna (Capa 1)
## Super Cerebro v2.0 · Mayo 2026

> **Esta carpeta es la plataforma interna de ZENKAI.** Es la fábrica que produce soluciones para clientes — no es lo que se vende. Lo que se vende es la Capa 2 (servicios construidos sobre esta plataforma), es el entendiemiento, ejecucion, sistematizacion y mejora constante del negocio de nuestros clientes empresariales.

---

## QUÉ HAY EN ESTE PROYECTO

```
Kenzai Super Brain/
├── README.md                    ← este archivo · punto de entrada
├── CLAUDE.md                    ← cerebro central · auto-load en Claude Code
├── ZENKAI_SUPERBRAIN_v2.md      ← prompt fuente original (Mayo 2026)
│
├── agentes/                     ← 12 agentes Master · uno por archivo
│   ├── ARES.md      · Marketing Digital
│   ├── HERMES.md    · Ventas & CRM
│   ├── ATLAS.md     · Operaciones & Delivery
│   ├── NEXUS.md     · IA & Automatización
│   ├── APOLLO.md    · Diseño & Branding
│   ├── MUSE.md      · Contenido & Social Media
│   ├── FORGE.md     · Developer & Infraestructura
│   ├── ORACLE.md    · Finanzas & Métricas
│   ├── HIVE.md      · RRHH & Equipo
│   ├── ECHO.md      · Atención al Cliente
│   ├── LEX.md       · Legal & Contratos
│   └── ZEUS.md      · Estrategia & Decisiones (único con Opus 4.7 default)
│
├── sectores/                    ← 11 módulos de vertical
│   ├── ecommerce.md             (Fase 1 · prioritario)
│   ├── salud.md                 (Fase 2 · desde mes 4)
│   ├── restaurantes.md
│   ├── servicios-profesionales.md
│   ├── educacion.md
│   ├── inmobiliaria.md
│   ├── manufactura.md
│   ├── retail.md
│   ├── startups.md
│   ├── gobierno.md
│   └── ong.md
│
├── skills/                      ← 6 skills nativos + integración
│   ├── README.md                · mapa de integración con superpowers/frontend-design/code-review/security-review
│   ├── skill-diagnostico-empresa.md
│   ├── skill-calcular-precio.md
│   ├── skill-crear-landing.md
│   ├── skill-cualificar-lead.md
│   ├── skill-generar-propuesta.md
│   └── skill-onboarding-cliente.md
│
├── workflows/                   ← 6 flujos ejecutables end-to-end
│   ├── workflow-nuevo-cliente.md
│   ├── workflow-crear-landing.md
│   ├── workflow-diagnostico-empresa.md
│   ├── workflow-onboarding.md
│   ├── workflow-reporte-semanal.md
│   └── workflow-recuperar-lead-frio.md
│
├── templates/                   ← 6 plantillas con variables [VARIABLE]
│   ├── template-propuesta-comercial.md
│   ├── template-contrato-servicios.md
│   ├── template-landing-universal.md       (9 secciones)
│   ├── template-diagnostico-empresa.md
│   ├── template-reporte-cliente.md
│   └── template-brief-proyecto.md
│
├── clientes/                    ← estructura por cliente
│   ├── README.md                · convención de nombres + cómo usar
│   └── _template-cliente/       ← copiar a clientes/YYYY-MM-slug/
│       ├── briefing.md
│       ├── propuesta.md
│       ├── contrato.md
│       ├── proyecto.md
│       ├── reportes/README.md
│       ├── assets/README.md
│       └── automatizaciones/README.md
│
├── finanzas/                    ← sistema de precios · proyección
│   ├── calculadora-precios.md   · fórmula sagrada: costo trimestral × 2
│   ├── stack-eco.md             · costos reales free/básico
│   ├── stack-pro.md             · costos reales profesional
│   ├── stack-premium.md         · costos reales enterprise
│   └── proyeccion-facturacion.md · modelo a $100K USD 2026
│
├── sops/                        ← procedimientos operativos
│   ├── sop-respuesta-lead.md            (SLA <10 min)
│   ├── sop-cualificacion-whatsapp.md
│   ├── sop-entrega-proyecto.md
│   ├── sop-mantenimiento-sistemas.md
│   └── sop-escalada-problemas.md
│
└── conexiones/                  ← mapa de integraciones
    ├── mapa-sistema.md          · diagrama completo Capa 1
    ├── conexiones-airtable.md   · bases · tablas · views
    ├── conexiones-make.md       · flows documentados
    ├── conexiones-whatsapp.md   · Cloud API · BSP · templates HSM
    └── conexiones-framer.md     · sites · templates · CMS
```

---

## CÓMO USAR ESTA PLATAFORMA

### En Claude Code
Abre cualquier sesión en `C:\Users\jordy\Desktop\Kenzai Super Brain\`. El `CLAUDE.md` se carga automáticamente. Escribe con clasificación:

```
[CLIENTE]    Tengo una clínica dental en Medellín, quieren agendar citas por WhatsApp...
[BUILD]      Crear una landing para restaurante en Madrid de comida colombiana
[AGENTE]     Activar APOLLO-LANDING para e-commerce de ropa
[DIAGNÓSTICO] Empresa construcción Bogotá, 30 empleados, todo en papel
[INTERNO]    Calcular costo operativo del proyecto X
[ESTRATEGIA] ¿Expandir a manufactura antes del mes 6?
```

### En claude.ai (web)
Pegar `ZENKAI_SUPERBRAIN_v2.md` al inicio de la conversación.

---

## PRINCIPIOS QUE GOBIERNAN TODO

1. **Dos rutas siempre.** Eco + Pro (o Pro + Premium). Nunca una sola.
2. **Precio mínimo = costo trimestral × 2.** El mercado ajusta venta, no costo.
3. **Opus 4.7 por complejidad, no por tier.** Solo ZEUS lo usa por defecto.
4. **Haiku → volumen · Sonnet → ejecución · Opus → razonamiento.**
5. **Airtable = fuente única de verdad.**
6. **Humano cierra · IA cualifica.**
7. **Capa 1 antes que Capa 2.** No vendemos lo que no construimos.
8. **Documentar todo en Notion.** SOP + caso de estudio.
9. **Flujos bidireccionales** entre agentes. Nadie es solo emisor.
10. **El sector define vocabulario, no estructura.**

---

## OBJETIVO 2026

**$100,000 USD facturados antes de diciembre 2026.**

Ver `finanzas/proyeccion-facturacion.md` para escenarios y plan de aceleración.
