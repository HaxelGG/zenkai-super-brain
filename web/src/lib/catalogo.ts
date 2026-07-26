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

/**
 * Selector de diagnóstico · la capa 1 de la home.
 *
 * En la home NUNCA se muestran las 14 opciones. El visitante no llega buscando
 * "Knowledge AI": llega con un problema y no sabe cómo se llama la solución.
 * Así que la primera pregunta no es "¿qué módulo quieres?" sino "¿qué te está
 * costando dinero?", en su idioma, y cada respuesta abre 2-3 módulos y un
 * WhatsApp con ese contexto ya escrito.
 *
 * Un módulo puede aparecer en dos diagnósticos: los problemas del cliente no
 * respetan nuestras categorías internas.
 */
export interface Diagnostico {
  id: string;
  /** El dolor en primera persona, como lo diría el cliente. */
  etiqueta: string;
  /** Qué está pasando de verdad detrás de ese síntoma. */
  lectura: string;
  /** Slugs de módulos · el orden importa, el primero es el que se propone. */
  modulos: string[];
  whatsapp: string;
}

export const DIAGNOSTICOS: Diagnostico[] = [
  {
    id: 'perdemos-leads',
    etiqueta: 'Perdemos clientes antes de hablar con ellos',
    lectura:
      'El interés existe y llega, pero nadie lo atiende a tiempo. Entre que entra la consulta y alguien responde, el cliente ya compró en otro sitio.',
    modulos: ['sales-ai', 'marketing-ai', 'commerce-ai'],
    whatsapp: 'Hola ZENKAI. Perdemos clientes antes de llegar a hablar con ellos. Os cuento el caso.',
  },
  {
    id: 'no-damos-abasto',
    etiqueta: 'No damos abasto atendiendo',
    lectura:
      'El equipo responde las mismas preguntas todo el día y aun así quedan conversaciones sin contestar. Crecer significa contratar, y contratar no siempre sale a cuenta.',
    modulos: ['customer-ai', 'knowledge-ai'],
    whatsapp: 'Hola ZENKAI. No damos abasto atendiendo a los clientes. Os cuento el caso.',
  },
  {
    id: 'operacion-margen',
    etiqueta: 'La operación nos come el margen',
    lectura:
      'Se factura, pero el trabajo manual entre herramientas se lleva las horas y el margen. Cada proceso depende de que alguien se acuerde del siguiente paso.',
    modulos: ['operations-ai', 'finance-ai'],
    whatsapp: 'Hola ZENKAI. La operación se nos come el margen. Os cuento el caso.',
  },
  {
    id: 'sin-visibilidad',
    etiqueta: 'No sé qué está funcionando',
    lectura:
      'Hay datos en seis herramientas que no se hablan. Se decide por intuición porque sacar el número real cuesta un día de trabajo.',
    modulos: ['intelligence-ai', 'marketing-ai'],
    whatsapp: 'Hola ZENKAI. No tengo visibilidad de qué está funcionando en mi negocio. Os cuento el caso.',
  },
];

/** Resuelve los slugs de un diagnóstico a módulos publicados, en orden. */
export const getModulosDeDiagnostico = async (dx: Diagnostico): Promise<Modulo[]> => {
  const modulos = await getModulos();
  return dx.modulos
    .map((slug) => modulos.find((m) => m.id === slug))
    .filter((m): m is Modulo => Boolean(m));
};

/** Agrupa los módulos por pilar en un solo paso · lo usa el megamenú. */
export const getMenu = async (): Promise<Array<Pilar & { modulos: Modulo[] }>> => {
  const modulos = await getModulos();
  return PILARES.map((p) => ({
    ...p,
    modulos: modulos.filter((m) => m.data.pilar === p.id),
  }));
};
