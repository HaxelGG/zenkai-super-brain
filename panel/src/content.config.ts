import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const MODELO_ENUM = z.enum([
  "claude-opus-4-7",
  "claude-sonnet-4-6",
  "claude-haiku-4-5-20251001",
]);

const ESTADO_AGENTE = z.enum(["documentado", "en_revision", "activo"]);

const agentes = defineCollection({
  loader: glob({ pattern: ["*.md", "!README.md"], base: "../agentes" }),
  schema: z.object({
    name: z.string(),
    numero: z.number().int().min(1).max(12),
    departamento: z.string(),
    modelo: MODELO_ENUM,
    modelo_label: z.string(),
    sectores_lidera: z.array(z.string()).default([]),
    subagentes: z.array(z.string()).default([]),
    skills_default: z.array(z.string()).default([]),
    estado: ESTADO_AGENTE.default("documentado"),
    color_acento: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  }),
});

const FASE_SECTOR = z.union([z.literal(1), z.literal(2), z.literal("futuro")]);

const sectores = defineCollection({
  loader: glob({ pattern: ["*.md", "!README.md"], base: "../sectores" }),
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    fase: FASE_SECTOR,
    prioridad: z.enum(["alta", "media", "baja"]),
    agentes_prioritarios: z.array(z.string()),
    mercados_objetivo: z.array(z.enum(["colombia", "españa", "usa", "latam", "europa"])).default(["colombia"]),
  }),
});

const CATEGORIA_WORKFLOW = z.enum([
  "ventas",
  "onboarding",
  "delivery",
  "reporting",
  "recuperacion",
]);

const workflows = defineCollection({
  loader: glob({ pattern: ["*.md", "!README.md"], base: "../workflows" }),
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    tiempo_objetivo: z.string(),
    agentes_principales: z.array(z.string()),
    categoria: CATEGORIA_WORKFLOW,
  }),
});

const sops = defineCollection({
  loader: glob({ pattern: ["*.md", "!README.md"], base: "../sops" }),
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    sla: z.string(),
    agentes_responsables: z.array(z.string()),
    frecuencia: z.enum(["por_evento", "diaria", "semanal", "mensual"]),
    criticidad: z.enum(["alta", "media", "baja"]),
  }),
});

const conexiones = defineCollection({
  loader: glob({ pattern: "conexiones-*.md", base: "../conexiones" }),
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    servicios_dependientes: z.array(z.string()).default([]),
    criticidad: z.enum(["alta", "media", "baja"]),
    estado_conexion: z.enum(["pendiente", "en_proceso", "activo", "bloqueado"]).default("pendiente"),
    fase_conexion: z.number().int().min(1).max(7),
  }),
});

const finanzas = defineCollection({
  loader: glob({ pattern: ["*.md", "!README.md"], base: "../finanzas" }),
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    tipo: z.enum(["calculadora", "stack", "proyeccion"]),
    tier: z.enum(["eco", "pro", "premium"]).optional(),
    costo_mensual_usd: z.number().nonnegative().optional(),
  }),
});

const templates = defineCollection({
  loader: glob({ pattern: ["*.md", "!README.md"], base: "../templates" }),
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    categoria: z.enum(["ventas", "legal", "landing", "reporting", "brief", "diagnostico"]),
    agentes_dueños: z.array(z.string()),
    variables_principales: z.array(z.string()).default([]),
  }),
});

const skills_zenkai = defineCollection({
  loader: glob({ pattern: "skill-*.md", base: "../skills" }),
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    agentes_que_usan: z.array(z.string()),
    tipo: z.enum(["rigid", "flexible"]),
  }),
});

export const collections = {
  agentes,
  sectores,
  workflows,
  sops,
  conexiones,
  finanzas,
  templates,
  skills_zenkai,
};
