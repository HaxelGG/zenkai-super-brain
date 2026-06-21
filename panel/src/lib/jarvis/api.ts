const PANEL_API = "https://panel.zenkai.systems";

export function isJarvisHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === "jarvis.zenkai.systems" || h.endsWith(".jarvis.zenkai.systems");
}

export function apiBase(hostname: string): string {
  const h = hostname.toLowerCase();
  return isJarvisHost(h) || h === "localhost" || h === "127.0.0.1" ? PANEL_API : "";
}

export function readApiKey(): string {
  try {
    return (
      localStorage.getItem("zenkai_jarvis_api_key") ||
      localStorage.getItem("zenkai_api_key") ||
      ""
    );
  } catch {
    return "";
  }
}

export function authHeaders(key: string): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (key) h.Authorization = `Bearer ${key}`;
  return h;
}

export async function fetchWithTimeout(
  url: string,
  opts: RequestInit,
  ms: number,
): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, credentials: "same-origin", signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}
