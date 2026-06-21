// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { renderBlock } from "./render";

describe("renderBlock", () => {
  it("user muestra el texto y la clase", () => {
    const e = renderBlock({ type: "user", text: "hola" });
    expect(e.textContent).toContain("hola");
    expect(e.className).toContain("jvt-line-user");
  });
  it("reply incluye badges de source/model", () => {
    const e = renderBlock({ type: "reply", text: "ok", source: "deepseek", model: "sonnet" });
    expect(e.textContent).toContain("deepseek");
    expect(e.textContent).toContain("sonnet");
  });
  it("card-kpis renderiza cada item", () => {
    const e = renderBlock({ type: "card-kpis", title: "Agencia", items: [{ label: "agentes", value: "12" }] });
    expect(e.textContent).toContain("agentes");
    expect(e.textContent).toContain("12");
  });
  it("nav-link crea un <a> con href", () => {
    const e = renderBlock({ type: "nav-link", label: "ir a finanzas", href: "/jarvis/finanzas" });
    expect(e.querySelector("a")?.getAttribute("href")).toBe("/jarvis/finanzas");
  });
});
