export interface PlanClassification {
  tipo: string;
  sector: string;
  departamentos: string[];
  agentes: string[];
  confianza: number;
  razonamiento: string;
}

export interface PlanProposal {
  sector_detectado: string;
  tier_recomendado: string;
  headline: string;
  dolor_identificado: string;
  solucion: string;
  agentes_activos: string[];
  stack: string[];
  timeline_dias: number;
  inversion_mensual_usd: number;
  proyeccion_90d: string;
}

export interface PlanResponse {
  ok: true;
  classification: PlanClassification;
  proposal: PlanProposal;
  job: { id: string; status: string; intent: string };
}

const esc = (s: string): string =>
  s.replace(/[&<>"]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;",
  );

const chip = (label: string): string => `<span class="jvc-chip">${esc(label)}</span>`;

export function confidencePct(confianza: number): number {
  return Math.round(Math.max(0, Math.min(1, confianza)) * 100);
}

export function classificationHtml(c: PlanClassification): string {
  const pct = confidencePct(c.confianza);
  return `
    <div class="jvc-badges">
      <span class="jvc-chip jvc-chip-accent">tipo · ${esc(c.tipo)}</span>
      <span class="jvc-chip jvc-chip-accent">sector · ${esc(c.sector)}</span>
    </div>
    <div class="jvc-row">depto: ${c.departamentos.map(chip).join("")}</div>
    <div class="jvc-row">agentes: ${c.agentes.map(chip).join("")}</div>
    <div class="jvc-conf">
      <div class="jvc-conf-track"><div class="jvc-conf-fill" style="width:${pct}%"></div></div>
      <span class="jvc-conf-label">${pct}%</span>
    </div>`;
}

export function proposalHtml(p: PlanProposal): string {
  return `
    <div class="jvc-headline">${esc(p.headline)}</div>
    <div class="jvc-grid">
      <div class="jvc-metric"><span class="jvc-metric-k">tier</span><span class="jvc-metric-v">${esc(p.tier_recomendado)}</span></div>
      <div class="jvc-metric"><span class="jvc-metric-k">timeline</span><span class="jvc-metric-v">${p.timeline_dias} días</span></div>
      <div class="jvc-metric"><span class="jvc-metric-k">inversión</span><span class="jvc-metric-v">$${p.inversion_mensual_usd}/mes</span></div>
    </div>
    <div class="jvc-row">stack: ${p.stack.map(chip).join("")}</div>
    <div class="jvc-proj">${esc(p.proyeccion_90d)}</div>`;
}

export function execLineHtml(text: string, done: boolean): string {
  const icon = done ? "✓" : "▸";
  return `<div class="jvc-log-line${done ? " is-done" : ""}"><span class="jvc-log-ic">${icon}</span>${esc(text)}</div>`;
}
