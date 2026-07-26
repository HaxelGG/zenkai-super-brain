/**
 * Monedas soportadas y formato de precio.
 *
 * REGLA DURA: acá no hay tipos de cambio. Cada precio se fija a mano en cada
 * moneda (ver data/pricing.ts) y el conmutador sólo elige cuál mostrar.
 *
 * Antes el conmutador multiplicaba el precio USD por unas tasas escritas a mano
 * en el JS del NavBar ({COP: 4000, EUR: 0.92, MXN: 17}). Eso tenía tres problemas
 * y ninguno era teórico: las tasas envejecían en silencio, un cliente europeo veía
 * un precio que no era el que iba a pagar, y aparecían cifras como "1.104 EUR" que
 * ningún humano habría puesto en una lista de precios.
 *
 * Las tres monedas son las tres regiones comerciales reales (USA/Canadá, Europa,
 * LATAM), cada una con su propia lista de precios y su propia política de
 * implantación. MXN salió: no hay lista de precios fijada para México.
 */

export type CurrencyCode = 'USD' | 'EUR' | 'COP';

export interface CurrencyConfig {
  /** Etiqueta del botón del conmutador. */
  label: string;
  /** Región comercial que representa · se muestra como ayuda bajo el conmutador. */
  region: string;
  symbol: string;
  /** Locale de agrupación de miles: 1,900 (en-US) vs 1.900 (es-ES). */
  locale: string;
  /** Dónde va el símbolo respecto al número. */
  position: 'before' | 'after';
  /** Aviso fiscal bajo los precios, si aplica. */
  note: string | null;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: {
    label: 'USD',
    region: 'EE. UU. y Canadá',
    symbol: '$',
    locale: 'en-US',
    position: 'before',
    note: null,
  },
  EUR: {
    label: 'EUR',
    region: 'Europa',
    symbol: '€',
    locale: 'es-ES',
    position: 'after',
    note: 'IVA no incluido',
  },
  COP: {
    label: 'COP',
    region: 'Colombia y LATAM',
    symbol: '$',
    locale: 'es-CO',
    position: 'before',
    note: 'IVA no incluido',
  },
};

export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];
export const DEFAULT_CURRENCY: CurrencyCode = 'EUR';

export const isCurrencyCode = (value: unknown): value is CurrencyCode =>
  typeof value === 'string' && (CURRENCY_CODES as string[]).includes(value);

/** "$2,000" · "1.900 €" · "$805.000" */
export const formatPrice = (amount: number, code: CurrencyCode): string => {
  const { symbol, locale, position } = CURRENCIES[code];
  const n = amount.toLocaleString(locale);
  return position === 'before' ? `${symbol}${n}` : `${n} ${symbol}`;
};
