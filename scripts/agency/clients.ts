/**
 * Clientes Capa 2 · contexto para jobs de contenido
 */
export type ClientProfile = {
  slug: string;
  name: string;
  sector: string;
  market: string;
  instagram?: string;
  tone: string;
  briefPath?: string;
  notes?: string;
};

export const CLIENT_REGISTRY: ClientProfile[] = [
  {
    slug: "juana-sanchez",
    name: "Grupo Juana Sánchez",
    sector: "retail",
    market: "España",
    instagram: "grupojuanasanchez",
    tone: "editorial, poético, artesanal, ceremonia, primera comunión, sofisticado",
    briefPath: "clientes/2026-05-grupo-juana-sanchez/briefing.md",
    notes: "Tres firmas: Juana Sánchez (comunión/novia), Lolikas, Printellar. Español peninsular.",
  },
  {
    slug: "zenkai",
    name: "ZENKAI Growth Systems",
    sector: "startups",
    market: "LATAM",
    instagram: "zenkai.systems",
    tone: "directo, estratégico, IA aplicada a negocios",
  },
];

const ALIASES: Record<string, string> = {
  "juana sanchez": "juana-sanchez",
  "juana sánchez": "juana-sanchez",
  "grupo juana": "juana-sanchez",
  "grupojuanasanchez": "juana-sanchez",
  zenkai: "zenkai",
};

export function resolveClientSlug(instruction: string): string {
  const lower = instruction.toLowerCase();
  for (const [alias, slug] of Object.entries(ALIASES)) {
    if (lower.includes(alias)) return slug;
  }
  return "zenkai";
}

export function getClient(slug: string): ClientProfile {
  return CLIENT_REGISTRY.find((c) => c.slug === slug) ?? CLIENT_REGISTRY[1]!;
}
