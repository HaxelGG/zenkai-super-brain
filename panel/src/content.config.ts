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

export const collections = { agentes, sectores };
