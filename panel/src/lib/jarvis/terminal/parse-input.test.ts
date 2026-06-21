import { describe, it, expect } from "vitest";
import { parseInput } from "./parse-input";

describe("parseInput", () => {
  it("blanco → empty", () => {
    expect(parseInput("   ")).toEqual({ kind: "empty" });
  });
  it("texto → nl (trim)", () => {
    expect(parseInput("  resumen del día ")).toEqual({ kind: "nl", text: "resumen del día" });
  });
  it("slash sin args", () => {
    expect(parseInput("/finanzas")).toEqual({ kind: "slash", name: "finanzas", args: [], raw: "/finanzas" });
  });
  it("slash con args", () => {
    expect(parseInput("/run HERMES cualificá el lead")).toEqual({
      kind: "slash",
      name: "run",
      args: ["HERMES", "cualificá", "el", "lead"],
      raw: "/run HERMES cualificá el lead",
    });
  });
  it("nombre del comando en minúsculas", () => {
    expect(parseInput("/HELP")).toMatchObject({ kind: "slash", name: "help" });
  });
});
