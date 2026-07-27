/**
 * EL CATÁLOGO REAL · los 14 módulos, como datos puros.
 *
 * Vive en su propio módulo sin dependencias por la misma razón que limits.ts:
 * lo consumen el prompt del modelo, el endpoint, el email y el componente de
 * la demo. Si estuviera dentro de proposal.ts, cualquier test que mockee
 * proposal.ts lo dejaría en undefined — y eso ya pasó: el envío de email
 * reventaba en silencio dentro de su try/catch y el test decía "spy llamado
 * 0 veces" sin explicar por qué.
 *
 * Antes el prompt sólo describía "12 agentes Master" (ARES, HERMES, ATLAS…),
 * que son arquitectura interna y no lo que se compra. El efecto medido en
 * producción: alguien pedía una TIENDA ONLINE y la propuesta le ofrecía un
 * agente de WhatsApp, porque el modelo no sabía que Commerce AI existe.
 *
 * proposal-catalogo.test.ts comprueba que esta lista no se desincronice de
 * src/content/modulos.
 */
export const MODULOS = [
  { slug: 'sales-ai',        nombre: 'Sales AI',        resuelve: 'captar, calificar y cerrar leads; agente SDR; CRM y pipeline' },
  { slug: 'marketing-ai',    nombre: 'Marketing AI',    resuelve: 'campañas de pago, SEO, embudos, email y atribución real' },
  { slug: 'commerce-ai',     nombre: 'Commerce AI',     resuelve: 'TIENDA ONLINE, carrito abandonado, catálogo, checkout, recompra' },
  { slug: 'creative-ai',     nombre: 'Creative AI',     resuelve: 'contenido, branding, foto y vídeo con IA, creatividades para ads' },
  { slug: 'customer-ai',     nombre: 'Customer AI',     resuelve: 'atención 24/7 por texto y voz, citas, reservas, soporte, postventa' },
  { slug: 'knowledge-ai',    nombre: 'Knowledge AI',    resuelve: 'base de conocimiento interna con respuestas citando su fuente' },
  { slug: 'operations-ai',   nombre: 'Operations AI',   resuelve: 'automatizar procesos, documentos, integrar CRM, ERP y APIs' },
  { slug: 'intelligence-ai', nombre: 'Intelligence AI', resuelve: 'dashboards, analítica, predicción, alertas y reportes' },
  { slug: 'finance-ai',      nombre: 'Finance AI',      resuelve: 'análisis financiero, forecasting, anomalías y riesgos' },
  { slug: 'hr-ai',           nombre: 'HR AI',           resuelve: 'reclutamiento, evaluación, onboarding y clima laboral' },
  { slug: 'legal-ai',        nombre: 'Legal AI',        resuelve: 'contratos, cláusulas, cumplimiento y gestión de casos' },
  { slug: 'security-ai',     nombre: 'Security AI',     resuelve: 'monitoreo, amenazas, protección de datos y respuesta' },
  { slug: 'specialized-ai',  nombre: 'Specialized AI Solutions', resuelve: 'IA por departamento sobre una plataforma común' },
  { slug: 'enterprise-ai',   nombre: 'Enterprise AI',   resuelve: 'desarrollo a medida, arquitecturas propias, integraciones legacy' },
] as const;

export const MODULO_SLUGS = MODULOS.map((m) => m.slug) as unknown as [string, ...string[]];

/** Slug → nombre visible. Devuelve el slug si no lo encuentra, nunca undefined. */
export const nombreDeModulo = (slug: string): string =>
  MODULOS.find((m) => m.slug === slug)?.nombre ?? slug;
