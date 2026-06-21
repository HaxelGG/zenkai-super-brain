import type { JarvisRouteKey } from "../config";

export type SlashCommand = {
  name: string;
  aliases?: string[];
  description: string;
  usage?: string;
  kind: "nav" | "run" | "local";
  navKey?: JarvisRouteKey;
};

export const SLASH_COMMANDS: SlashCommand[] = [
  { name: "help", description: "Lista los comandos disponibles", kind: "local" },
  { name: "clear", description: "Limpia la terminal", kind: "local" },
  { name: "status", description: "Estado de la agencia", kind: "local" },
  { name: "finanzas", description: "Ir a Finanzas", kind: "nav", navKey: "finanzas" },
  { name: "pipeline", description: "Ir a Pipeline / CRM", kind: "nav", navKey: "pipeline" },
  { name: "clientes", description: "Ir a Clientes", kind: "nav", navKey: "clientes" },
  { name: "agentes", description: "Ir a Agentes", kind: "nav", navKey: "agentes" },
  { name: "tareas", description: "Ir a Tareas", kind: "nav", navKey: "tareas" },
  { name: "social", description: "Ir a Social", kind: "nav", navKey: "social" },
  { name: "sistemas", description: "Ir a Sistemas", kind: "nav", navKey: "sistemas" },
  { name: "intel", description: "Ir a Intel Brief", kind: "nav", navKey: "intel" },
  { name: "goals", description: "Ir a Goals", kind: "nav", navKey: "goals" },
  { name: "run", aliases: ["agente"], description: "Ejecutar un agente", usage: "/run <AGENTE> <instrucción>", kind: "run" },
];

export function resolveCommand(name: string): SlashCommand | null {
  const n = name.toLowerCase();
  return SLASH_COMMANDS.find((c) => c.name === n || c.aliases?.includes(n)) ?? null;
}

export function filterCommands(prefix: string): SlashCommand[] {
  const p = prefix.toLowerCase();
  return SLASH_COMMANDS.filter((c) => c.name.startsWith(p) || c.aliases?.some((a) => a.startsWith(p)));
}
