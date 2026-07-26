import type { CurrencyCode } from '../lib/currency';

/**
 * Precios de los 5 tiers. Fuente de verdad única de la home.
 *
 * Cada importe está FIJADO en cada moneda, no convertido. Son precios de lista,
 * así que se eligen para leerse como precios (1.900 €), no como el resultado de
 * multiplicar por una tasa (1.840 €). Cambiar un precio se hace acá y en ningún
 * otro sitio.
 *
 * Facturación: USD. El importe en EUR es el que se cobra a clientes que pagan en
 * euros, y va sin IVA (ZENKAI está registrada fuera de la UE; el tratamiento
 * fiscal del cliente europeo depende de su propio régimen).
 */
export type Money = Record<CurrencyCode, number>;

export interface TierPricing {
  setup: Money;
  monthly: Money;
}

export const PRICING: Record<string, TierPricing> = {
  Lite: {
    setup: { USD: 300, EUR: 290 },
    monthly: { USD: 90, EUR: 89 },
  },
  Starter: {
    setup: { USD: 2000, EUR: 1900 },
    monthly: { USD: 700, EUR: 690 },
  },
  Growth: {
    setup: { USD: 4000, EUR: 3800 },
    monthly: { USD: 1200, EUR: 1150 },
  },
  Pro: {
    setup: { USD: 9500, EUR: 8900 },
    monthly: { USD: 3000, EUR: 2900 },
  },
  Enterprise: {
    setup: { USD: 30000, EUR: 28000 },
    monthly: { USD: 5500, EUR: 5200 },
  },
};

/** data-price-usd="300" data-price-eur="290" · lo que lee el conmutador. */
export const priceAttrs = (money: Money): Record<string, string> =>
  Object.fromEntries(
    Object.entries(money).map(([code, amount]) => [`data-price-${code.toLowerCase()}`, String(amount)]),
  );
