import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Nombres canónicos de los 12 agentes Master · CLAUDE.md §2
const AGENTES_CANONICOS = z.enum([
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
]);

// Slugs de los 8 sectores objetivo de la landing pública · spec §2
const SECTOR_SLUGS = z.enum([
  "ecommerce",
  "servicios-profesionales",
  "hogar",
  "salud",
  "restaurantes",
  "inmobiliaria",
  "educacion",
  "manufactura",
]);

const CTA_ACTION = z.enum(["form", "calcom", "whatsapp"]);

// ────────────────────────────────────────────────────────────────────────────
// Collection · tiers
// Source: web/src/content/tiers/*.md (frontmatter completo · body opcional)
// Datos extraídos literalmente del spec §3.1-3.5
// ────────────────────────────────────────────────────────────────────────────
const tiers = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/tiers" }),
  schema: z.object({
    nombre: z.string(),
    precio_USD: z.number().int().nonnegative(),
    precio_USD_recurrente: z.number().int().nonnegative().optional(),
    descripcion: z.string(),
    destacado: z.boolean().default(false),
    features: z.array(z.string()).min(3),
    cta_label: z.string(),
    cta_action: CTA_ACTION,
    limitaciones: z.array(z.string()).default([]),
    tiempo_implementacion: z.string(),
    // Camino B (decidido al inicio de Tarea 1.2):
    // modulos_por_sector es contenido público de la landing — la tabla
    // "Variantes por sector" del spec está pensada para mostrarse en cada
    // página de sector. costos/margen son datos internos · fuera de scope.
    modulos_por_sector: z.record(SECTOR_SLUGS, z.string()),
  }),
});

// ────────────────────────────────────────────────────────────────────────────
// Collection · sectores
// Source: web/src/content/sectores/*.md (frontmatter + body markdown opcional)
// NO importa de sectores/<slug>.md de la raíz · esta collection es independiente
// y solo contiene copy de marketing público (los archivos raíz son docs operativos)
// ────────────────────────────────────────────────────────────────────────────
const sectores = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/sectores" }),
  schema: z.object({
    slug: SECTOR_SLUGS,
    nombre: z.string(),
    icon: z.string(),
    prioridad: z.number().int().min(1).max(8),
    dolor_principal: z.string(),
    agentes_prioritarios: z.array(AGENTES_CANONICOS),
    modulo_disponible: z.boolean(),
    copy_corto: z.string(),
    copy_largo: z.string(),
  }),
});

export const collections = { tiers, sectores };
