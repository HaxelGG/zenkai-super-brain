# CONEXIONES · FRAMER
## Tool primaria de landings en Tier Pro

**Owner:** APOLLO-LANDING + FORGE-FRONTEND
**Plan recomendado:**
- Pro: Mini ($15) o Basic ($25)
- Premium: Pro ($40) o Business ($65) · custom Next.js si requiere más

---

## CUÁNDO USAR FRAMER VS ALTERNATIVAS

### Usar Framer cuando:
✅ Tier Pro · landing 1-3 secciones de complejidad media
✅ Cliente quiere editarlo después (Framer tiene CMS visual)
✅ Animaciones simples necesarias
✅ Mobile-first crítico
✅ Plazo corto (3-7 días)

### NO usar Framer cuando:
❌ Componentes interactivos complejos (calculadoras · configuradores · juegos)
❌ Auth · cuentas de usuario · dashboards
❌ Performance crítico (<1.5s LCP)
❌ Cliente Eco (HTML estático más barato)
❌ Tier Premium con requisitos custom (usar Next.js + FORGE)

---

## CUENTA DE FRAMER (CONFIGURACIÓN INICIAL)

### Cuenta del cliente vs cuenta de ZENKAI

**Recomendación:** sitio se construye en cuenta del cliente · ZENKAI tiene acceso de editor.

Ventajas:
- Cliente es dueño legal del sitio
- Si terminamos relación, no hay disputa de "quién tiene la cuenta"
- Cliente paga la suscripción (no parte del retainer ZENKAI)

Excepción: si cliente Eco no quiere pagar, podemos hostearlo en cuenta ZENKAI por hasta 3 meses · luego transferir o migrar a HTML estático.

### Plan correcto

| Plan | Precio | Cuándo usarlo |
|------|--------|---------------|
| Free | $0 | Solo para mockup interno · NO para producción de cliente |
| Mini | $15/mes | Landing simple · 1 sitio · custom domain |
| Basic | $25/mes | Landing + blog básico · CMS pequeño |
| Pro | $40/mes | 3 sitios o blog completo · más features |
| Business | $65/mes | Sitios multi-team · permisos avanzados |

---

## TEMPLATES INTERNOS DE ZENKAI

ZENKAI mantiene una **biblioteca de templates de Framer** por sector que se duplican y personalizan.

### Templates disponibles (mantenidos por APOLLO-TEMPLATE)

| Template | Sector | Estructura |
|----------|--------|------------|
| `zk-ecommerce-fashion` | E-commerce moda | Hero · catálogo · testimonios · FAQ |
| `zk-ecommerce-product` | E-commerce producto único | Hero · features · proceso · garantía |
| `zk-clinica-dental` | Salud dental | Hero · servicios · profesionales · agendar |
| `zk-clinica-estetica` | Salud estética | Hero · tratamientos · galería · testimonios |
| `zk-restaurante-local` | Restaurantes | Hero · menú · ubicación · reservas |
| `zk-servicios-profesionales` | Servicios | Hero · expertise · casos · formulario |
| `zk-inmobiliaria` | Inmobiliaria | Hero · propiedades · proyectos · contacto |
| `zk-educacion-curso` | Educación | Hero · syllabus · profesores · inscripción |
| `zk-startup-saas` | Startup | Hero · features · pricing · signup |

Cada template:
- Sigue la estructura universal de 9 secciones (`templates/template-landing-universal.md`)
- Tiene componentes reutilizables marcados como "ZK-" (no editar · solo personalizar dentro)
- Variables de marca (color · fuente) configurables en un panel

---

## FLUJO DE TRABAJO FRAMER

### 1. Briefing (FASE 1 del skill `skill-crear-landing`)

### 2. Selección o creación del template
- Buscar template existente del sector
- Si no existe, crear uno nuevo y agregarlo a la biblioteca

### 3. Personalización
- Duplicar template a la cuenta del cliente
- Aplicar paleta y tipografía del cliente (`assets/brand/`)
- Reemplazar placeholders con copy real
- Reemplazar imágenes con assets reales del cliente

### 4. CMS (si aplica)
- Configurar collections para blog · productos · casos
- Definir campos editables
- Capacitar al cliente sobre cómo editar

### 5. Conexiones
- Formulario → webhook a Make → Airtable
- Pixel Meta + GA4 instalados
- Open Graph tags

### 6. Custom Domain
- Configurar DNS del cliente
- Apuntar a Framer
- Esperar propagación + SSL automático

### 7. QA (ATLAS-QA)
Checklist universal del skill `skill-crear-landing`.

### 8. Lanzamiento + Loom de capacitación

---

## INTEGRACIONES CRÍTICAS EN FRAMER

### Formularios → Make
Framer tiene su propio módulo de formulario. Configurar webhook a Make:
1. Crear formulario en Framer
2. Settings · Form Submission · Webhook URL
3. Pegar URL del Make webhook
4. Test con datos reales

### Pixel Meta + CAPI
- Pixel: insertar el script en Settings → Site Settings → Custom Code
- CAPI: server-side vía Make (después de capturar conversión)

### Google Analytics 4
- Insertar script GA4 en Custom Code
- Configurar eventos personalizados via GTM (más limpio)

### Custom Code para componentes especiales
Framer permite insertar HTML/JS custom en componentes específicos · usar para:
- Widgets de chat (Tidio · Tawk.to)
- Calendarios embebidos (Cal.com)
- WhatsApp button flotante (componente reutilizable ZENKAI)

---

## PERFORMANCE EN FRAMER

### Core Web Vitals típicas
- LCP: 1.5-2.5s (depende imágenes)
- CLS: <0.1 si configurado bien
- FID: <100ms casi siempre

### Optimizaciones
1. **Imágenes:** comprimir antes de subir (Tinify · Squoosh) · usar WebP
2. **Animaciones:** preferir CSS sobre JS · evitar parallax pesado
3. **Custom code:** minificar · cargar lazy
4. **Tipografía:** preferir fuentes del sistema o solo 1-2 webfonts

### Cuando Framer no alcanza
Síntomas:
- LCP >3s con imágenes optimizadas
- Cliente reporta lentitud en mobile en zonas con mala conexión
- Necesidad de SSR/ISR

Solución: migrar a Next.js custom (FORGE-FRONTEND) · re-cotizar como upgrade Premium.

---

## SEO EN FRAMER

### On-page que Framer maneja bien
- Title · meta description editable por página
- URLs limpias (slug-amigable)
- Sitemap.xml automático
- Robots.txt configurable
- Schema markup parcial (no perfecto)

### Limitaciones
- Sin control fino sobre headers HTTP
- robots.txt limitado
- Difícil insertar JSON-LD complejo

Para sectores con SEO crítico (servicios profesionales · inmobiliaria competida) considerar Next.js + FORGE.

---

## DOCUMENTACIÓN POR CLIENTE

Cada cliente con sitio Framer activo tiene en `clientes/[slug]/`:

```
[slug]/
├── automatizaciones/
│   └── framer.md         ← config + accesos + decisiones
└── assets/
    └── brand/            ← lo que Framer usa
```

`framer.md` incluye:
- Cuenta donde vive el sitio (cliente o ZENKAI temporal)
- Plan actual + costo
- Custom domain
- Custom code instalado
- Templates ZENKAI utilizados como base
- CMS collections configuradas
- Cómo editar (instrucciones para el cliente)
- Decisiones de diseño que se debaten cuando el cliente quiere cambiar

---

## REGLAS

1. **Sitio en cuenta del cliente** salvo excepción acordada
2. **Templates ZENKAI** como base (no construir desde cero salvo Premium)
3. **Pixel + CAPI antes de publicar** (no negociable)
4. **QA universal** antes de DNS apuntar
5. **Loom de capacitación** entregado siempre
6. **Backup del Framer project** mensual (export código si Framer permite)
7. **NO editar templates ZK-** · personalizar valores dentro
8. **Cuando se publique un sitio nuevo,** revisar si vale la pena agregar como template a la biblioteca
