import { describe, it, expect } from "vitest";
import { SLASH_COMMANDS, resolveCommand, filterCommands } from "./slash-commands";

describe("slash-commands", () => {
  it("resuelve por nombre", () => {
    expect(resolveCommand("finanzas")?.kind).toBe("nav");
  });
  it("resuelve por alias (agente → run)", () => {
    expect(resolveCommand("agente")?.name).toBe("run");
  });
  it("desconocido → null", () => {
    expect(resolveCommand("nope")).toBeNull();
  });
  it("filtra por prefijo", () => {
    const names = filterCommands("fin").map((c) => c.name);
    expect(names).toContain("finanzas");
    expect(names).not.toContain("pipeline");
  });
  it("todo comando nav tiene navKey", () => {
    for (const c of SLASH_COMMANDS) {
      if (c.kind === "nav") expect(c.navKey).toBeTruthy();
    }
  });
});
