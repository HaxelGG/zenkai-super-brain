// Tipos y schema del clasificador de inputs ZENKAI · §7 de CLAUDE.md

export const TIPOS_INPUT = [
  "CLIENTE",
  "INTERNO",
  "BUILD",
  "AGENTE",
  "ESTRATEGIA",
  "SECTOR",
  "DIAGNOSTICO",
  "CONSULTA",
  "ESCALADA",
] as const;

export type TipoInput = (typeof TIPOS_INPUT)[number];

export const SECTORES = [
  "ecommerce",
  "salud",
  "restaurantes",
  "servicios-profesionales",
  "educacion",
  "inmobiliaria",
  "manufactura",
  "retail",
  "startups",
  "gobierno",
  "ong",
  "ninguno",
] as const;

export type Sector = (typeof SECTORES)[number];

export const DEPARTAMENTOS = [
  "Marketing",
  "Ventas",
  "Operaciones",
  "IA",
  "Diseno",
  "Contenido",
  "Developer",
  "Finanzas",
  "RRHH",
  "AtencionCliente",
  "Legal",
  "Estrategia",
] as const;

export type Departamento = (typeof DEPARTAMENTOS)[number];

export const AGENTES = [
  "ARES",
  "HERMES",
  "ATLAS",
  "NEXUS",
  "APOLLO",
  "MUSE",
  "FORGE",
  "ORACLE",
  "HIVE",
  "ECHO",
  "LEX",
  "ZEUS",
] as const;

export type Agente = (typeof AGENTES)[number];

export interface ClasificacionResult {
  tipo: TipoInput;
  sector_detectado: Sector;
  departamentos_involucrados: Departamento[];
  agentes_a_activar: Agente[];
  confianza: number;
  razonamiento: string;
}

// JSON schema para output_config.format · cumple los límites de la API
// (additionalProperties:false en cada object · solo enum/array/string/number)
export const CLASIFICACION_SCHEMA = {
  type: "object",
  properties: {
    tipo: {
      type: "string",
      enum: [...TIPOS_INPUT],
      description:
        "Tipo de input según §7 de CLAUDE.md. CLIENTE=brief externo, INTERNO=tarea operativa ZENKAI, BUILD=construir componente, AGENTE=activar agente, ESTRATEGIA=decisión negocio, SECTOR=consulta vertical, DIAGNOSTICO=auditoría empresa, CONSULTA=pregunta puntual, ESCALADA=sin solución en tier actual.",
    },
    sector_detectado: {
      type: "string",
      enum: [...SECTORES],
      description:
        "Sector vertical detectado en el input. 'ninguno' si no aplica o es un input interno/genérico.",
    },
    departamentos_involucrados: {
      type: "array",
      items: {
        type: "string",
        enum: [...DEPARTAMENTOS],
      },
      description: "Departamentos ZENKAI que el input involucra.",
    },
    agentes_a_activar: {
      type: "array",
      items: {
        type: "string",
        enum: [...AGENTES],
      },
      description:
        "Agentes Master a activar para responder este input. ZEUS sólo para [ESTRATEGIA] o decisiones N3-N4.",
    },
    confianza: {
      type: "number",
      description:
        "Certeza de la clasificación de 0.0 a 1.0. Si <0.7, el Super Cerebro debe pedir aclaración antes de actuar.",
    },
    razonamiento: {
      type: "string",
      description:
        "Una frase explicando por qué se clasificó así. Para auditar decisiones del clasificador.",
    },
  },
  required: [
    "tipo",
    "sector_detectado",
    "departamentos_involucrados",
    "agentes_a_activar",
    "confianza",
    "razonamiento",
  ],
  additionalProperties: false,
} as const;
