import type { CurrencyCode } from '../lib/currency';

/**
 * PRECIOS · fuente de verdad única de todo el sitio.
 *
 * ── De dónde salen ──────────────────────────────────────────────────────────
 * Del modelo interno v5 (price/zenkai-pricing-v5-fee-descuentos.html, 3 jun 2026):
 *
 *     precio mensual = coste de mantenimiento USD × multiplicador de región
 *     multiplicadores: LATAM ×3 · Europa ×6 · USA ×8
 *
 * Los importes de abajo son ese cálculo REDONDEADO a precios de lista y luego
 * FIJADO en cada moneda. No se convierten en cliente. v5 derivaba EUR y COP de
 * un tipo de cambio del 3 jun 2026 (USD/COP 3.570, EUR/USD 1,16); ese número
 * envejece solo y el propio documento avisa de que el peso pasó de 4.460 a 3.570
 * en un año. Un precio de lista no puede depender de eso.
 *
 * ── Dos correcciones sobre v5, con motivo ───────────────────────────────────
 * 1. USA Starter sube de $400 a $500. El suelo del retainer gestionado para PYME
 *    en EE. UU. es $500/mes; por debajo se cae en la banda del software no-code
 *    ($100-500) y el comprador lo lee como herramienta de autoservicio, no como
 *    servicio gestionado. $500 sigue estando por debajo de la competencia.
 * 2. La implantación pasa de "coste × 1,5" (daba €65 en Starter) a "una
 *    mensualidad". Motivo en IMPLANTACION más abajo.
 *
 * ── Cómo se revisa ──────────────────────────────────────────────────────────
 * Trimestral. Se cambian los números de este archivo y nada más.
 * Último repaso: 26 jul 2026.
 */

export type Money = Record<CurrencyCode, number>;

export interface Tier {
  id: string;
  nombre: string;
  /** Coste real de mantenimiento en USD · la referencia de la que sale el precio. */
  costeUsd: number;
  mensual: Money;
  /** Implantación · pago único, se perdona en compromiso semestral o anual. */
  implantacion: Money;
  promesa: string;
  incluye: string[];
  destacado?: boolean;
}

/**
 * IMPLANTACIÓN = una mensualidad. Perdonada en semestral y anual.
 *
 * v5 la calculaba como coste × 1,5, que daba €65 en Starter. Eso es un problema
 * en Europa por dos razones opuestas y las dos ciertas: no cubre los días de
 * puesta en marcha, y un onboarding de €65 no señala calidad — señala que no hay
 * gran cosa que poner en marcha. El propio doc interno de mayo concluyó que el
 * cliente español espera y valora un onboarding de pago, y el mercado cobra
 * 800-2.500 € sólo por un bot con integraciones.
 *
 * Pero tampoco puede ser un fee de implantación a medida de varios miles: la
 * entrega de ZENKAI es clonar plantillas sobre infra propia amortizada entre
 * todos los clientes (n8n + Chatwoot + Supabase self-hosted), con onboarding
 * objetivo de 5 días. Cobrar como un proyecto a medida algo que se entrega
 * clonando contradice el modelo de entrega y mata la escala.
 *
 * "Una mensualidad" es la convención del SaaS B2B gestionado: cubre la puesta en
 * marcha, filtra al curioso, es trivial de explicar y escala sola con el plan.
 *
 * LATAM va a CERO a propósito. Es un mercado sensible al precio donde la barrera
 * de entrada pesa más que el margen del primer mes, y la conversión sin setup es
 * varias veces mayor. La palanca de caja allí es el compromiso, no la barrera.
 */
export const TIERS: Tier[] = [
  {
    id: 'starter',
    nombre: 'Starter',
    costeUsd: 50,
    mensual: { USD: 500, EUR: 269, COP: 535_000 },
    implantacion: { USD: 500, EUR: 269, COP: 0 },
    promesa: 'Que nadie se quede sin respuesta.',
    incluye: [
      'Asistente IA de texto 24/7',
      'WhatsApp y canales alternativos',
      'Panel personalizado',
      'Recordatorios automáticos',
      'Agendamiento de citas',
    ],
  },
  {
    id: 'silver',
    nombre: 'Silver',
    costeUsd: 75,
    mensual: { USD: 600, EUR: 399, COP: 805_000 },
    implantacion: { USD: 600, EUR: 399, COP: 0 },
    promesa: 'La operación deja de depender de que alguien se acuerde.',
    incluye: [
      'Todo lo de Starter',
      'Página web',
      'Automatizaciones n8n',
      'CRM a medida',
      'Dashboard de KPIs',
      'Identidad visual corporativa',
    ],
    destacado: true,
  },
  {
    id: 'gold',
    nombre: 'Gold',
    costeUsd: 205,
    mensual: { USD: 1_650, EUR: 1_099, COP: 2_200_000 },
    implantacion: { USD: 1_650, EUR: 1_099, COP: 0 },
    promesa: 'Adquisición y contenido funcionando sin ampliar el equipo.',
    incluye: [
      'Todo lo de Silver',
      'Tienda online',
      'Campañas de voz, email y WhatsApp',
      'Campañas de Meta Ads',
      'Simulaciones de predicción',
      'Producción de vídeo con IA',
    ],
  },
  {
    id: 'enterprise',
    nombre: 'Enterprise',
    costeUsd: 360,
    mensual: { USD: 2_900, EUR: 1_899, COP: 3_870_000 },
    implantacion: { USD: 2_900, EUR: 1_899, COP: 0 },
    promesa: 'Para empresas que ya no caben en un SaaS.',
    incluye: [
      'Todo lo de Gold',
      'Asistente interno a medida',
      'Campañas de adquisición gestionadas',
      'Volumen alto de producción',
      'Integraciones con sistemas propios',
      'Account manager y revisión semanal',
    ],
  },
];

/**
 * Descuento por compromiso · idéntico en las tres regiones (viene de v5).
 *
 * El compromiso es OPCIONAL. El cliente puede quedarse mes a mes y marcharse
 * cuando quiera; comprometerse es una elección que se premia, no un candado.
 * Para una agencia de dos personas el pago anual por adelantado es la mejor
 * palanca de caja que existe, y por eso es el tramo con más descuento.
 */
export interface Compromiso {
  id: string;
  etiqueta: string;
  /** Descuento sobre la mensualidad, en tanto por uno. */
  descuento: number;
  /** Parte de la implantación que se cobra, en tanto por uno. */
  implantacion: number;
  nota: string;
  destacado?: boolean;
}

export const COMPROMISOS: Compromiso[] = [
  { id: 'mensual', etiqueta: 'Mes a mes', descuento: 0, implantacion: 1, nota: 'Máxima flexibilidad. Cancelas cuando quieras.' },
  { id: 'trimestral', etiqueta: 'Trimestral', descuento: 0.15, implantacion: 0.1, nota: 'Implantación al 10%.' },
  { id: 'semestral', etiqueta: 'Semestral', descuento: 0.25, implantacion: 0, nota: 'Sin implantación.', destacado: true },
  { id: 'anual', etiqueta: 'Anual', descuento: 0.27, implantacion: 0, nota: 'Sin implantación. El precio más bajo.' },
];

/** data-price-usd="269" data-price-eur="269" … · lo que lee el conmutador. */
export const priceAttrs = (money: Money): Record<string, string> =>
  Object.fromEntries(
    Object.entries(money).map(([code, amount]) => [`data-price-${code.toLowerCase()}`, String(amount)]),
  );
