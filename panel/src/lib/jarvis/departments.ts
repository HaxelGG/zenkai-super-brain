/**
 * JARVIS · departamentos operativos del Command Center.
 * Agrupa rutas existentes bajo Sales, Marketing, Customer Service, AI, Creation, Research.
 */
import type { JarvisRouteKey } from "./config";

export type JarvisDepartmentId =
  | "sales"
  | "marketing"
  | "customer-service"
  | "ai"
  | "creation"
  | "research";

export type JarvisDepartmentNavItem = {
  key: JarvisRouteKey;
  /** Override label (default from JARVIS_NAV_LABELS) */
  label?: string;
};

export type JarvisDepartment = {
  id: JarvisDepartmentId;
  slug: string;
  label: string;
  tagline: string;
  leadAgent: string;
  accent: string;
  items: JarvisDepartmentNavItem[];
};

/** Labels canónicos por ruta (sidebar + palette) */
export const JARVIS_NAV_LABELS: Record<JarvisRouteKey, string> = {
  home: "Command Center",
  intel: "Intel Brief",
  agentes: "AI Agents",
  pipeline: "Pipeline",
  clientes: "Clients",
  finanzas: "Finance",
  social: "Social",
  tareas: "Tasks",
  jobs: "Jobs HITL",
  sistemas: "Systems",
  goals: "Goals & OKRs",
  sales: "Sales",
  marketing: "Marketing",
  "customer-service": "Customer Service",
  ai: "AI",
  creation: "Creation",
  research: "Research",
};

export const JARVIS_DEPARTMENTS: readonly JarvisDepartment[] = [
  {
    id: "sales",
    slug: "sales",
    label: "Sales",
    tagline: "Pipeline · clients · revenue · HERMES",
    leadAgent: "HERMES",
    accent: "#00D4FF",
    items: [
      { key: "pipeline" },
      { key: "clientes" },
      { key: "finanzas" },
    ],
  },
  {
    id: "marketing",
    slug: "marketing",
    label: "Marketing",
    tagline: "Social · campaigns · reach · ARES",
    leadAgent: "ARES",
    accent: "#1E6FFF",
    items: [{ key: "social" }],
  },
  {
    id: "customer-service",
    slug: "customer-service",
    label: "Customer Service",
    tagline: "Support · delivery · portfolio · ECHO",
    leadAgent: "ECHO",
    accent: "#00FFAA",
    items: [
      { key: "clientes", label: "Client Portfolio" },
      { key: "tareas" },
      { key: "jobs", label: "Approvals HITL" },
    ],
  },
  {
    id: "ai",
    slug: "ai",
    label: "AI",
    tagline: "Agents · systems · automation · NEXUS",
    leadAgent: "NEXUS",
    accent: "#7B61FF",
    items: [
      { key: "agentes" },
      { key: "sistemas" },
      { key: "jobs" },
    ],
  },
  {
    id: "creation",
    slug: "creation",
    label: "Creation",
    tagline: "Content · design · assets · APOLLO · MUSE",
    leadAgent: "APOLLO",
    accent: "#FFB800",
    items: [
      { key: "social", label: "Social & Content" },
      { key: "tareas", label: "Creative Tasks" },
    ],
  },
  {
    id: "research",
    slug: "research",
    label: "Research",
    tagline: "Intel · markets · strategy · ZEUS",
    leadAgent: "ZEUS",
    accent: "#E8F4FF",
    items: [
      { key: "intel" },
      { key: "goals" },
    ],
  },
] as const;

export function getDepartmentBySlug(slug: string): JarvisDepartment | undefined {
  return JARVIS_DEPARTMENTS.find((d) => d.slug === slug);
}

export function navLabel(key: JarvisRouteKey, override?: string): string {
  return override ?? JARVIS_NAV_LABELS[key] ?? key;
}

/** Lista plana para mobile pills y compat (sin hubs duplicados) */
export function flattenDepartmentNav(): ReadonlyArray<{
  key: JarvisRouteKey;
  label: string;
  department: JarvisDepartmentId;
}> {
  const seen = new Set<JarvisRouteKey>();
  const out: { key: JarvisRouteKey; label: string; department: JarvisDepartmentId }[] = [];
  for (const dept of JARVIS_DEPARTMENTS) {
    for (const item of dept.items) {
      if (seen.has(item.key)) continue;
      seen.add(item.key);
      out.push({
        key: item.key,
        label: navLabel(item.key, item.label),
        department: dept.id,
      });
    }
  }
  return out;
}
