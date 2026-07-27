/**
 * Campo de intención · fuente ÚNICA de dirección de luz y de geometría del fold.
 *
 * ── El problema que resuelve ──────────────────────────────────────────────
 * El hero tenía cuatro sistemas que no se hablaban: el shader, la constelación,
 * el titular y el CTA. Cada uno con su física, su listener y su paleta. El ojo
 * lee "capas apiladas" aunque no sepa nombrarlo — si la luz del titular y la
 * cámara de la escena no apuntan al mismo sitio, el cerebro detecta la mentira.
 *
 * Aquí hay UN vector de puntero y lo consumen los cuatro.
 *
 * ── Y un bug real ─────────────────────────────────────────────────────────
 * Había dos listeners de pointermove, y el de la constelación llamaba a
 * getBoundingClientRect() DENTRO del evento: un flush síncrono de estilo y
 * layout por cada movimiento del ratón. Aquí no se mide nada en el evento.
 *
 * ── La parte que nadie hace ───────────────────────────────────────────────
 * Además del vector, este módulo publica las CAJAS del titular y del botón.
 * El shader baja su techo de luminancia dentro de ellas y la constelación
 * atenúa sus nodos: el fondo sabe dónde está el texto y se aparta. Eso es
 * oclusión — la señal de profundidad más fuerte que existe — y de paso
 * convierte el contraste AA en una propiedad garantizada en vez de un ajuste
 * a ojo.
 */

export interface Zona {
  /** Píxeles CSS relativos a la caja del hero. */
  x0: number; y0: number; x1: number; y1: number;
  /** Anchura del degradado de la máscara, en px. */
  halo: number;
  tipo: 'texto' | 'cta';
}

/** Única constante de inercia del sitio. La usan las cuatro capas. */
export const LERP = 0.075;

const fino = matchMedia('(hover: hover) and (pointer: fine)');
const quieto = matchMedia('(prefers-reduced-motion: reduce)');

let hero: HTMLElement | null = null;
let ox = 0, oy = 0, sx = 0, sy = 0, raf = 0, ultimoQ = 99;

const zonasArr: Zona[] = [];
const oyentes = new Set<() => void>();

const paso = () => {
  sx += (ox - sx) * LERP;
  sy += (oy - sy) * LERP;
  hero!.style.setProperty('--px', sx.toFixed(4));
  hero!.style.setProperty('--py', sy.toFixed(4));

  // El degradado del titular SÍ repinta: es background-clip:text sobre 76px.
  // Cuantizado a pasos de 0,1 repinta unas 20 veces en un barrido completo de
  // pantalla en vez de 60 por segundo. A ojo es idéntico.
  const q = Math.round(sx * 10) / 10;
  if (q !== ultimoQ) {
    ultimoQ = q;
    hero!.style.setProperty('--pxq', q.toFixed(1));
  }

  // El bucle se para solo cuando ya no queda movimiento apreciable.
  raf = Math.abs(ox - sx) + Math.abs(oy - sy) > 0.0015
    ? requestAnimationFrame(paso)
    : 0;
};

/** Se llama en resize, carga de fuentes y fin de la entrada. NUNCA por puntero. */
const medir = () => {
  if (!hero) return;
  const base = hero.getBoundingClientRect();
  zonasArr.length = 0;
  hero.querySelectorAll<HTMLElement>('[data-zona]').forEach((el) => {
    const r = el.getBoundingClientRect();
    const esCta = el.dataset.zona === 'cta';
    zonasArr.push({
      x0: r.left - base.left,
      y0: r.top - base.top,
      x1: r.right - base.left,
      y1: r.bottom - base.top,
      // El halo absorbe el translateY de la animación de entrada y cualquier
      // desajuste de métricas mientras Geist todavía no ha cargado.
      halo: esCta ? 72 : 110,
      tipo: esCta ? 'cta' : 'texto',
    });
  });
  oyentes.forEach((f) => f());
};

export const zonas = (): Zona[] => zonasArr;

/** Objetivo BRUTO · cada consumidor amortigua a su propia cadencia. */
export const objetivo = () => ({ x: ox, y: oy });

export const alMedir = (f: () => void) => {
  oyentes.add(f);
  return () => oyentes.delete(f);
};

export const iniciarCampo = (el: HTMLElement) => {
  if (hero) return;
  hero = el;
  medir();
  addEventListener('resize', medir, { passive: true });
  // El titular termina su desplazamiento de entrada pasado casi un segundo:
  // hay que volver a medir o las zonas quedan donde el texto ya no está.
  hero.addEventListener('animationend', medir);
  if ('fonts' in document) document.fonts.ready.then(medir).catch(() => {});

  // En táctil o con movimiento reducido no se engancha nada: coste cero.
  // Las zonas SÍ se miden — la máscara de legibilidad tiene que seguir viva
  // aunque el campo esté congelado.
  if (!fino.matches || quieto.matches) return;

  addEventListener('pointermove', (e) => {
    ox = (e.clientX / innerWidth - 0.5) * 2;
    oy = (e.clientY / innerHeight - 0.5) * 2;
    if (!raf) raf = requestAnimationFrame(paso);
  }, { passive: true });
};
