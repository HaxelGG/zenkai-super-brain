/** Canonical public URL for JARVIS ops center */
export const JARVIS_URL = "https://jarvis.zenkai.systems";

/** Panel interno (Super Cerebro) — distinto de JARVIS */
export const PANEL_URL = "https://panel.zenkai.systems";

/** Base path de rutas JARVIS dentro del build del panel */
export const JARVIS_BASE = "/jarvis";

export const JARVIS_ROUTES = {
  home: `${JARVIS_BASE}`,
  finanzas: `${JARVIS_BASE}/finanzas`,
  social: `${JARVIS_BASE}/social`,
  tareas: `${JARVIS_BASE}/tareas`,
  goals: `${JARVIS_BASE}/goals`,
  agentes: `${JARVIS_BASE}/agentes`,
  pipeline: `${JARVIS_BASE}/pipeline`,
  clientes: `${JARVIS_BASE}/clientes`,
  sistemas: `${JARVIS_BASE}/sistemas`,
} as const;

/** Nav items for sidebar / mobile */
export const JARVIS_NAV = [
  { href: JARVIS_ROUTES.home, label: "Command Center", icon: "home" },
  { href: JARVIS_ROUTES.agentes, label: "Agentes IA", icon: "agents" },
  { href: JARVIS_ROUTES.pipeline, label: "Pipeline", icon: "pipeline" },
  { href: JARVIS_ROUTES.clientes, label: "Clientes", icon: "clients" },
  { href: JARVIS_ROUTES.finanzas, label: "Finanzas", icon: "finance" },
  { href: JARVIS_ROUTES.social, label: "Social", icon: "social" },
  { href: JARVIS_ROUTES.tareas, label: "Tareas", icon: "tasks" },
  { href: JARVIS_ROUTES.sistemas, label: "Sistemas", icon: "systems" },
  { href: JARVIS_ROUTES.goals, label: "Goals", icon: "goals" },
] as const;
