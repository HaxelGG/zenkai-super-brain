/** Canonical public URL for JARVIS ops center */
export const JARVIS_URL = "https://jarvis.zenkai.systems";

/** Panel interno (Super Cerebro) — distinto de JARVIS */
export const PANEL_URL = "https://panel.zenkai.systems";

/** Base path de rutas JARVIS dentro del build del panel */
export const JARVIS_BASE = "/jarvis";

export const JARVIS_HOST = "jarvis.zenkai.systems";

/** Segmentos de ruta JARVIS (sin base) */
export const JARVIS_SEGMENTS = {
  home: "",
  intel: "intel",
  agentes: "agentes",
  pipeline: "pipeline",
  clientes: "clientes",
  finanzas: "finanzas",
  social: "social",
  tareas: "tareas",
  jobs: "jobs",
  sistemas: "sistemas",
  goals: "goals",
  sales: "dept/sales",
  marketing: "dept/marketing",
  "customer-service": "dept/customer-service",
  ai: "dept/ai",
  creation: "dept/creation",
  research: "dept/research",
} as const;

export type JarvisRouteKey = keyof typeof JARVIS_SEGMENTS;

export type JarvisRoutes = Record<JarvisRouteKey, string>;

/** Rutas con prefijo /jarvis (panel.zenkai.systems y dev local) */
export const JARVIS_ROUTES: JarvisRoutes = {
  home: JARVIS_BASE,
  intel: `${JARVIS_BASE}/intel`,
  agentes: `${JARVIS_BASE}/agentes`,
  pipeline: `${JARVIS_BASE}/pipeline`,
  clientes: `${JARVIS_BASE}/clientes`,
  finanzas: `${JARVIS_BASE}/finanzas`,
  social: `${JARVIS_BASE}/social`,
  tareas: `${JARVIS_BASE}/tareas`,
  jobs: `${JARVIS_BASE}/jobs`,
  sistemas: `${JARVIS_BASE}/sistemas`,
  goals: `${JARVIS_BASE}/goals`,
  sales: `${JARVIS_BASE}/dept/sales`,
  marketing: `${JARVIS_BASE}/dept/marketing`,
  "customer-service": `${JARVIS_BASE}/dept/customer-service`,
  ai: `${JARVIS_BASE}/dept/ai`,
  creation: `${JARVIS_BASE}/dept/creation`,
  research: `${JARVIS_BASE}/dept/research`,
};

export function isJarvisHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === JARVIS_HOST || host.endsWith(`.${JARVIS_HOST}`);
}

/** Base de navegación según host: "" en jarvis.zenkai.systems, "/jarvis" en panel */
export function getJarvisBase(hostname: string): string {
  return isJarvisHost(hostname) ? "" : JARVIS_BASE;
}

function joinJarvisPath(base: string, segment: string): string {
  if (!segment) return base || "/";
  return `${base}/${segment}`;
}

/** Rutas resueltas para el host actual (URLs limpias en subdominio JARVIS) */
export function resolveJarvisRoutes(hostname: string): JarvisRoutes {
  const base = getJarvisBase(hostname);
  return {
    home: joinJarvisPath(base, JARVIS_SEGMENTS.home),
    intel: joinJarvisPath(base, JARVIS_SEGMENTS.intel),
    agentes: joinJarvisPath(base, JARVIS_SEGMENTS.agentes),
    pipeline: joinJarvisPath(base, JARVIS_SEGMENTS.pipeline),
    clientes: joinJarvisPath(base, JARVIS_SEGMENTS.clientes),
    finanzas: joinJarvisPath(base, JARVIS_SEGMENTS.finanzas),
    social: joinJarvisPath(base, JARVIS_SEGMENTS.social),
    tareas: joinJarvisPath(base, JARVIS_SEGMENTS.tareas),
    jobs: joinJarvisPath(base, JARVIS_SEGMENTS.jobs),
    sistemas: joinJarvisPath(base, JARVIS_SEGMENTS.sistemas),
    goals: joinJarvisPath(base, JARVIS_SEGMENTS.goals),
    sales: joinJarvisPath(base, JARVIS_SEGMENTS.sales),
    marketing: joinJarvisPath(base, JARVIS_SEGMENTS.marketing),
    "customer-service": joinJarvisPath(base, JARVIS_SEGMENTS["customer-service"]),
    ai: joinJarvisPath(base, JARVIS_SEGMENTS.ai),
    creation: joinJarvisPath(base, JARVIS_SEGMENTS.creation),
    research: joinJarvisPath(base, JARVIS_SEGMENTS.research),
  };
}

/** Path público canónico en jarvis.zenkai.systems (sin /jarvis) */
export function toJarvisCanonicalPath(pathname: string): string {
  if (pathname.startsWith(JARVIS_BASE)) {
    const rest = pathname.slice(JARVIS_BASE.length) || "/";
    return rest.startsWith("/") ? rest : `/${rest}`;
  }
  return pathname || "/";
}

/** Activo en sidebar — soporta /finanzas y /jarvis/finanzas (misma ruta canónica) */
export function isJarvisNavActive(pathname: string, href: string): boolean {
  const path = toJarvisCanonicalPath(pathname.replace(/\/$/, "") || "/");
  const target = toJarvisCanonicalPath(href.replace(/\/$/, "") || "/");

  if (target === "/") {
    return path === "/";
  }

  return path === target || path.startsWith(`${target}/`);
}

/** Nav plano legacy · preferir JARVIS_DEPARTMENTS en sidebar */
export const JARVIS_NAV: ReadonlyArray<{
  key: JarvisRouteKey;
  label: string;
  icon: string;
}> = [
  { key: "home", label: "Command Center", icon: "home" },
  { key: "sales", label: "Sales", icon: "pipeline" },
  { key: "marketing", label: "Marketing", icon: "social" },
  { key: "customer-service", label: "Customer Service", icon: "clients" },
  { key: "ai", label: "AI", icon: "agents" },
  { key: "creation", label: "Creation", icon: "social" },
  { key: "research", label: "Research", icon: "intel" },
  { key: "pipeline", label: "Pipeline", icon: "pipeline" },
  { key: "clientes", label: "Clients", icon: "clients" },
  { key: "finanzas", label: "Finance", icon: "finance" },
  { key: "social", label: "Social", icon: "social" },
  { key: "intel", label: "Intel Brief", icon: "intel" },
  { key: "agentes", label: "AI Agents", icon: "agents" },
  { key: "jobs", label: "Jobs HITL", icon: "tasks" },
  { key: "tareas", label: "Tasks", icon: "tasks" },
  { key: "sistemas", label: "Systems", icon: "systems" },
  { key: "goals", label: "Goals", icon: "goals" },
];
