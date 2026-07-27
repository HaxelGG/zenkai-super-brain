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

// CTA_ACTION se ha eliminado con la colección `tiers`: era su único uso.

// ────────────────────────────────────────────────────────────────────────────
// La colección `tiers` se ha eliminado.
//
// Describía cinco planes —Lite, Starter, Growth, Pro, Enterprise— con precios
// en un único campo `precio_USD`. Los planes reales son cuatro (Starter,
// Silver, Gold, Enterprise) y sus importes viven en data/pricing.ts fijados
// por moneda. La colección no la renderizaba ninguna ruta desde el rediseño,
// pero seguía siendo la fuente de la que se copiaban frases a mano: de ahí
// salían "plan Lite" en la comparativa y "desde $90 USD".
//
// Un dato obsoleto que nadie pinta no es inofensivo mientras alguien lo pueda
// leer y creer.
// ────────────────────────────────────────────────────────────────────────────

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
    /** Titular de la página · el resultado, no el sector. */
    titular: z.string(),
    dolor_principal: z.string(),
    /** Arquitectura interna · NO se muestra en público. */
    agentes_prioritarios: z.array(AGENTES_CANONICOS),
    /** false = no se publica la página ni aparece en listados ni en el sitemap. */
    modulo_disponible: z.boolean(),
    copy_corto: z.string(),
    copy_largo: z.string(),
    /** Cómo se ve el día a día · concreto, en palabras del cliente. */
    sintomas: z.array(z.string()).min(2).max(5),
    /** Slugs de la colección `modulos` · el orden importa. */
    modulos: z.array(z.string()).min(2),
    ctaWhatsapp: z.string(),
    seo: z.object({ title: z.string(), description: z.string() }),
  }),
});

// ────────────────────────────────────────────────────────────────────────────
// Collection · modulos · las 14 líneas de producto
//
// Fuente única de verdad del catálogo. De aquí se derivan: el megamenú, las
// páginas de pilar, las páginas de módulo, las tarjetas del selector de
// diagnóstico y el sitemap. Ningún componente hardcodea el nombre, el color ni
// el copy de un módulo: si algo aparece dos veces, es un bug.
//
// Añadir el módulo 15 = un .md nuevo y cero código.
// Retirar uno = `status: hidden` y desaparece de nav, grids y sitemap.
// ────────────────────────────────────────────────────────────────────────────
const PILAR = z.enum(["vender", "atender", "operar", "medida"]);
const DOMINIO = z.enum(["growth", "people", "ops", "data"]);

const modulos = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/modulos" }),
  schema: z.object({
    nombre: z.string(),
    pilar: PILAR,
    /** core = se vende solo, aparece en la home · extended = se descubre navegando */
    tier: z.enum(["core", "extended"]),
    status: z.enum(["live", "hidden"]).default("live"),
    orden: z.number().int(),
    /** Define el color heredado · ver tokens.css §11 */
    dominio: DOMINIO,
    titular: z.string(),
    promesa: z.string().max(200),
    /** El dolor en palabras del cliente, no en las nuestras. */
    problema: z.string(),
    capacidades: z
      .array(
        z.object({
          titulo: z.string(),
          descripcion: z.string(),
        }),
      )
      .min(3)
      .max(7),
    canales: z.array(z.string()).default([]),
    /** Se muestran SOLO en la página del módulo, en gris, bajo "Nos integramos con".
        Nunca como "Partners" ni como "Clientes": no lo son. */
    integraciones: z.array(z.string()).default([]),
    beneficios: z
      .array(z.object({ titulo: z.string(), descripcion: z.string() }))
      .max(6)
      .default([]),
    /** QUÉ se mide, nunca cuánto se promete. Sin porcentajes: no hay casos
        publicados que los respalden y una cifra sin fuente es una mentira. */
    kpis: z.array(z.string()).default([]),
    /** Mensaje prellenado del CTA de WhatsApp de esta página. */
    ctaWhatsapp: z.string(),
    seo: z.object({ title: z.string(), description: z.string() }),
  }),
});

export const collections = { sectores, modulos };
