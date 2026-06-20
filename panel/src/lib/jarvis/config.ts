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
} as const;
