import { afterEach, describe, expect, it, vi } from "vitest";

describe("getVersion", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("returns a version string from package.json", async () => {
    const { getVersion } = await import("../version.js");
    const version = getVersion();
    // Should match semver pattern (may include pre-release like -rc.6)
    expect(version).toMatch(/^\d+\.\d+\.\d+/);
  });

  it("returns a non-empty string", async () => {
    const { getVersion } = await import("../version.js");
    expect(getVersion().length).toBeGreaterThan(0);
  });

  it("caches the result on subsequent calls", async () => {
    const { getVersion } = await import("../version.js");
    const first = getVersion();
    const second = getVersion();
    expect(first).toBe(second);
  });

  it("falls back to 0.0.0 when fs throws", async () => {
    vi.mock("node:fs", () => ({
      existsSync: () => {
        throw new Error("boom");
      },
      readFileSync: () => {
        throw new Error("boom");
      },
    }));

    const { getVersion } = await import("../version.js");
    expect(getVersion()).toBe("0.0.0");
  });

  it("falls back to 0.0.0 when package.json has wrong name", async () => {
    vi.mock("node:fs", () => ({
      existsSync: () => true,
      readFileSync: () =>
        JSON.stringify({ name: "wrong-package", version: "9.9.9" }),
    }));

    const { getVersion } = await import("../version.js");
    expect(getVersion()).toBe("0.0.0");
  });

  it("falls back to 0.0.0 when package.json is invalid JSON", async () => {
    vi.mock("node:fs", () => ({
      existsSync: () => true,
      readFileSync: () => "not-json{{{",
    }));

    const { getVersion } = await import("../version.js");
    expect(getVersion()).toBe("0.0.0");
  });

  it("falls back to 0.0.0 when package.json has no version field", async () => {
    vi.mock("node:fs", () => ({
      existsSync: () => true,
      readFileSync: () => JSON.stringify({ name: "@vivero/stoma-cli" }),
    }));

    const { getVersion } = await import("../version.js");
    // version is undefined → nullish coalescing → "0.0.0"
    expect(getVersion()).toBe("0.0.0");
  });

  it("falls back to 0.0.0 when no file exists", async () => {
    vi.mock("node:fs", () => ({
      existsSync: () => false,
      readFileSync: () => {
        throw new Error("should not be called");
      },
    }));

    const { getVersion } = await import("../version.js");
    expect(getVersion()).toBe("0.0.0");
  });
});
