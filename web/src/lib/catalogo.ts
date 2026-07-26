import { getCollection, type CollectionEntry } from 'astro:content';

export type Modulo = CollectionEntry<'modulos'>;
export type PilarId = 'vender' | 'atender' | 'operar' | 'medida';

/**
 * Los tres pilares por RESULTADO DE NEGOCIO, no por tecnología.
 *
 * El catálogo tiene 14 líneas de producto. Poner catorce tarjetas en la home
 * destruye la conversión: nadie elige entre catorce cosas que no entiende.
 * La jerarquía es de tres capas — diagnóstico en la home, tres pilares, y
 * después la página de cada módulo — y estos son la capa intermedia.
 *
 * "medida" (Enterprise AI) no es un pilar: es el nivel al que se llega cuando
 * el catálogo se queda corto, y por eso aparece al final de cada pilar en vez
 * de competir con ellos en la navegación.
 */
export interface Pilar {
  id: Exclude<PilarId, 'medida'>;
  nombre: string;
  titular: string;
  promesa: string;
  /** Dominio de color que representa al pilar en el megamenú y las tarjetas. */
  dominio: 'growth' | 'people' | 'ops' | 'data';
}

export const PILARES: Pilar[] = [
  {
    id: 'vender',
    nombre: 'Vender',
    titular: 'Consigue más clientes sin contratar más comerciales',
    promesa: 'Captar, calificar y cerrar deja de depender de que alguien tenga tiempo.',
    dominio: 'growth',
  },
  {
    id: 'atender',
    nombre: 'Atender',
    titular: 'Atiende a todos, siempre, sin ampliar el equipo',
    promesa: 'La atención escala con la demanda en vez de con la nómina.',
    dominio: 'data',
  },
  {
    id: 'operar',
    nombre: 'Operar',
    titular: 'Haz más con la misma gente',
    promesa: 'Los procesos dejan de depender de que alguien se acuerde del siguiente paso.',
    dominio: 'ops',
  },
];

export const getPilar = (id: string): Pilar | undefined =>
  PILARES.find((p) => p.id === id);

/**
 * Módulos publicados, ordenados. `status: hidden` en un .md lo saca de aquí y,
 * con ello, del megamenú, de las páginas de pilar, de las grids y del sitemap.
 * Es el único interruptor: no hay una segunda lista que mantener sincronizada.
 */
export const getModulos = async (): Promise<Modulo[]> => {
  const todos = await getCollection('modulos');
  return todos
    .filter((m) => m.data.status === 'live')
    .sort((a, b) => a.data.orden - b.data.orden);
};

export const getModulosPorPilar = async (pilar: PilarId): Promise<Modulo[]> =>
  (await getModulos()).filter((m) => m.data.pilar === pilar);

export const getModulosCore = async (): Promise<Modulo[]> =>
  (await getModulos()).filter((m) => m.data.tier === 'core');

/** Enterprise AI · el nivel "a medida" que cierra cada pilar. */
export const getModuloMedida = async (): Promise<Modulo | undefined> =>
  (await getModulos()).find((m) => m.data.pilar === 'medida');

/** Agrupa los módulos por pilar en un solo paso · lo usa el megamenú. */
export const getMenu = async (): Promise<Array<Pilar & { modulos: Modulo[] }>> => {
  const modulos = await getModulos();
  return PILARES.map((p) => ({
    ...p,
    modulos: modulos.filter((m) => m.data.pilar === p.id),
  }));
};
