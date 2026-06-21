import { describe, it, expect } from "vitest";
import { classificationHtml, proposalHtml, confidencePct, execLineHtml } from "./stages";

const classification = {
  tipo: "CLIENTE",
  sector: "salud",
  departamentos: ["Operaciones", "IA"],
  agentes: ["ATLAS", "NEXUS"],
  confianza: 0.86,
  razonamiento: "R",
};

const proposal = {
  sector_detectado: "salud",
  tier_recomendado: "Growth",
  headline: "Agenda inteligente 24/7",
  dolor_identificado: "D",
  solucion: "S",
  agentes_activos: ["ATLAS", "NEXUS"],
  stack: ["WhatsApp API", "Cal.com"],
  timeline_dias: 21,
  inversion_mensual_usd: 900,
  proyeccion_90d: "−30% no-shows",
};

describe("confidencePct", () => {
  it("redondea a entero porcentual", () => {
    expect(confidencePct(0.86)).toBe(86);
  });
});

describe("classificationHtml", () => {
  it("muestra tipo, sector y agentes", () => {
    const html = classificationHtml(classification);
    expect(html).toContain("CLIENTE");
    expect(html).toContain("salud");
    expect(html).toContain("ATLAS");
    expect(html).toContain("86%");
  });
});

describe("proposalHtml", () => {
  it("muestra headline, tier, timeline e inversión", () => {
    const html = proposalHtml(proposal);
    expect(html).toContain("Agenda inteligente 24/7");
    expect(html).toContain("Growth");
    expect(html).toContain("21");
    expect(html).toContain("900");
    expect(html).toContain("Cal.com");
  });
});

describe("execLineHtml", () => {
  it("escapa contenido y marca done", () => {
    expect(execLineHtml("a<b", true)).toContain("a&lt;b");
    expect(execLineHtml("x", true)).toContain("is-done");
  });
});
