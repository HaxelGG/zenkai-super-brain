import { getCollection, type CollectionEntry } from "astro:content";

/** Valida que cada referencia entre colecciones apunte a un slug existente. Lanza error en build si falla. */
export async function validateCrossRefs(): Promise<void> {
  const agentes = await getCollection("agentes");
  const sectores = await getCollection("sectores");
  const workflows = await getCollection("workflows");
  const sops = await getCollection("sops");

  const agenteNames = new Set(agentes.map((a) => a.data.name));
  const sectorSlugs = new Set(sectores.map((s) => s.data.slug));

  const errors: string[] = [];

  for (const agente of agentes) {
    for (const slug of agente.data.sectores_lidera) {
      if (!sectorSlugs.has(slug)) {
        errors.push(`agentes/${agente.id}: sectores_lidera incluye "${slug}" que no existe en sectores/`);
      }
    }
  }

  for (const sector of sectores) {
    for (const name of sector.data.agentes_prioritarios) {
      if (!agenteNames.has(name)) {
        errors.push(`sectores/${sector.id}: agentes_prioritarios incluye "${name}" que no existe en agentes/`);
      }
    }
  }

  for (const workflow of workflows) {
    for (const name of workflow.data.agentes_principales) {
      if (!agenteNames.has(name)) {
        errors.push(`workflows/${workflow.id}: agentes_principales incluye "${name}" que no existe en agentes/`);
      }
    }
  }

  for (const sop of sops) {
    for (const name of sop.data.agentes_responsables) {
      if (!agenteNames.has(name)) {
        errors.push(`sops/${sop.id}: agentes_responsables incluye "${name}" que no existe en agentes/`);
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Cross-reference validation failed:\n${errors.join("\n")}`);
  }
}

/** Para un agente dado, devuelve los workflows donde participa como agente principal. */
export async function workflowsDeAgente(
  agenteName: string,
): Promise<CollectionEntry<"workflows">[]> {
  const workflows = await getCollection("workflows");
  return workflows.filter((w) => w.data.agentes_principales.includes(agenteName));
}

/** Para un agente dado, devuelve los sectores donde aparece como prioritario (no solo donde lidera). */
export async function sectoresDeAgente(
  agenteName: string,
): Promise<CollectionEntry<"sectores">[]> {
  const sectores = await getCollection("sectores");
  return sectores.filter((s) => s.data.agentes_prioritarios.includes(agenteName));
}

/** Para un sector dado, devuelve los agentes prioritarios completos (con su data). */
export async function agentesDeSector(
  sectorSlug: string,
): Promise<CollectionEntry<"agentes">[]> {
  const sectores = await getCollection("sectores");
  const sector = sectores.find((s) => s.data.slug === sectorSlug);
  if (!sector) return [];
  const agentes = await getCollection("agentes");
  return sector.data.agentes_prioritarios
    .map((name) => agentes.find((a) => a.data.name === name))
    .filter((a): a is CollectionEntry<"agentes"> => a !== undefined);
}
