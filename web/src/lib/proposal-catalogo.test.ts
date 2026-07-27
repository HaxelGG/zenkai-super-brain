import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { MODULOS, TIERS } from './proposal';
import { TIERS as TIERS_PRECIOS } from '../data/pricing';

/**
 * El prompt del modelo lleva su propia copia del catálogo (no puede leer una
 * content collection de Astro en tiempo de ejecución del LLM). Esa copia se
 * desincroniza sola en cuanto alguien añade un módulo, y cuando se desincroniza
 * el fallo es silencioso y caro: el modelo recomienda algo que no existe, o
 * ignora un producto que sí vendemos.
 *
 * Fue exactamente lo que pasó: el prompt describía "12 agentes Master" y cinco
 * planes que ya no existían, así que a quien pedía una tienda online le
 * proponía un agente de WhatsApp y le citaba un plan retirado.
 *
 * Estas comprobaciones convierten esa desincronización en un test rojo.
 */
describe('el catálogo del prompt no se desincroniza del real', () => {
  it('tiene exactamente los mismos módulos que src/content/modulos', () => {
    const dir = resolve(process.cwd(), 'src/content/modulos');
    const enDisco = readdirSync(dir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, ''))
      .sort();
    const enPrompt = MODULOS.map((m) => m.slug).sort();
    expect(enPrompt).toEqual(enDisco);
  });

  it('los planes del prompt son los mismos que los de la tabla de precios', () => {
    expect([...TIERS].sort()).toEqual(TIERS_PRECIOS.map((t) => t.nombre).sort());
  });

  it('cada módulo describe qué resuelve · sin eso el modelo no puede elegir', () => {
    for (const m of MODULOS) {
      expect(m.resuelve.length, `${m.slug} sin descripción`).toBeGreaterThan(20);
    }
  });
});
