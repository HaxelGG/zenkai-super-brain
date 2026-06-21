import { describe, it, expect } from "vitest";
import { apiBase, authHeaders, isJarvisHost } from "./api";

describe("apiBase", () => {
  it("usa panel.zenkai.systems desde el subdominio jarvis", () => {
    expect(apiBase("jarvis.zenkai.systems")).toBe("https://panel.zenkai.systems");
  });
  it("usa panel.zenkai.systems en localhost", () => {
    expect(apiBase("localhost")).toBe("https://panel.zenkai.systems");
  });
  it("usa same-origin ('') en panel.zenkai.systems", () => {
    expect(apiBase("panel.zenkai.systems")).toBe("");
  });
});

describe("isJarvisHost", () => {
  it("detecta el subdominio y sus sub-subdominios", () => {
    expect(isJarvisHost("jarvis.zenkai.systems")).toBe(true);
    expect(isJarvisHost("app.jarvis.zenkai.systems")).toBe(true);
    expect(isJarvisHost("panel.zenkai.systems")).toBe(false);
  });
});

describe("authHeaders", () => {
  it("incluye Bearer cuando hay key", () => {
    expect(authHeaders("k1").Authorization).toBe("Bearer k1");
  });
  it("omite Authorization sin key", () => {
    expect(authHeaders("").Authorization).toBeUndefined();
  });
});
