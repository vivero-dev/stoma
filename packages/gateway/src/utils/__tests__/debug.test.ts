import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createDebugFactory,
  createDebugger,
  matchNamespace,
  noopDebugLogger,
} from "../debug";

describe("matchNamespace", () => {
  it("should match exact namespace", () => {
    expect(matchNamespace("stoma:gateway", "stoma:gateway")).toBe(true);
  });

  it("should reject non-matching namespace", () => {
    expect(matchNamespace("stoma:gateway", "stoma:upstream")).toBe(false);
  });

  it("should match wildcard *", () => {
    expect(matchNamespace("stoma:gateway", "*")).toBe(true);
    expect(matchNamespace("stoma:policy:cache", "*")).toBe(true);
  });

  it("should match trailing wildcard", () => {
    expect(matchNamespace("stoma:gateway", "stoma:*")).toBe(true);
    expect(matchNamespace("stoma:policy:cache", "stoma:*")).toBe(true);
    expect(matchNamespace("stoma:policy:cache", "stoma:policy:*")).toBe(true);
  });

  it("should reject wildcard that doesn't match prefix", () => {
    expect(matchNamespace("stoma:gateway", "other:*")).toBe(false);
    expect(matchNamespace("stoma:gateway", "stoma:policy:*")).toBe(false);
  });

  it("should match comma-separated patterns", () => {
    expect(
      matchNamespace("stoma:gateway", "stoma:gateway,stoma:upstream")
    ).toBe(true);
    expect(
      matchNamespace("stoma:upstream", "stoma:gateway,stoma:upstream")
    ).toBe(true);
    expect(
      matchNamespace("stoma:policy:cache", "stoma:gateway,stoma:upstream")
    ).toBe(false);
  });

  it("should handle whitespace in comma-separated patterns", () => {
    expect(
      matchNamespace("stoma:upstream", "stoma:gateway , stoma:upstream")
    ).toBe(true);
  });

  it("should match mixed exact and wildcard patterns", () => {
    expect(
      matchNamespace("stoma:policy:cache", "stoma:gateway,stoma:policy:*")
    ).toBe(true);
  });
});

describe("createDebugger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return noopDebugLogger when disabled", () => {
    expect(createDebugger("stoma:gateway", false)).toBe(noopDebugLogger);
    expect(createDebugger("stoma:gateway", undefined)).toBe(noopDebugLogger);
  });

  it("should return a logger when enabled with true", () => {
    const logger = createDebugger("stoma:gateway", true);
    expect(logger).not.toBe(noopDebugLogger);
    expect(typeof logger).toBe("function");
  });

  it("should return a logger when namespace matches string pattern", () => {
    const logger = createDebugger("stoma:gateway", "stoma:*");
    expect(logger).not.toBe(noopDebugLogger);
  });

  it("should return noopDebugLogger when namespace doesn't match pattern", () => {
    const logger = createDebugger("stoma:gateway", "stoma:upstream");
    expect(logger).toBe(noopDebugLogger);
  });

  it("should output to console.debug with namespace prefix", () => {
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    const logger = createDebugger("stoma:gateway", true);

    logger("route registered");

    expect(spy).toHaveBeenCalledWith("[stoma:gateway] route registered");
  });

  it("should format additional arguments", () => {
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    const logger = createDebugger("stoma:upstream", true);

    logger("proxying", "GET /api/users", "->", "https://internal/users");

    expect(spy).toHaveBeenCalledWith(
      "[stoma:upstream] proxying GET /api/users -> https://internal/users"
    );
  });

  it("should JSON-stringify object arguments", () => {
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    const logger = createDebugger("stoma:gateway", true);

    logger("route", { path: "/api", methods: ["GET"] });

    expect(spy).toHaveBeenCalledWith(
      '[stoma:gateway] route {"path":"/api","methods":["GET"]}'
    );
  });

  it("noopDebugLogger should not call console.debug", () => {
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    noopDebugLogger("this should not appear");
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("createDebugFactory", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return noop factory when disabled", () => {
    const factory = createDebugFactory(false);
    expect(factory("stoma:gateway")).toBe(noopDebugLogger);
    expect(factory("stoma:anything")).toBe(noopDebugLogger);
  });

  it("should return working loggers when enabled", () => {
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    const factory = createDebugFactory(true);

    const gwLogger = factory("stoma:gateway");
    const upLogger = factory("stoma:upstream");

    gwLogger("started");
    upLogger("proxying");

    expect(spy).toHaveBeenCalledWith("[stoma:gateway] started");
    expect(spy).toHaveBeenCalledWith("[stoma:upstream] proxying");
  });

  it("should cache loggers by namespace", () => {
    const factory = createDebugFactory(true);
    const logger1 = factory("stoma:gateway");
    const logger2 = factory("stoma:gateway");
    expect(logger1).toBe(logger2);
  });

  it("should return different loggers for different namespaces", () => {
    const factory = createDebugFactory(true);
    const gwLogger = factory("stoma:gateway");
    const upLogger = factory("stoma:upstream");
    expect(gwLogger).not.toBe(upLogger);
  });

  it("should respect pattern filtering", () => {
    const factory = createDebugFactory("stoma:gateway,stoma:upstream");
    const gwLogger = factory("stoma:gateway");
    const policyLogger = factory("stoma:policy:cache");

    expect(gwLogger).not.toBe(noopDebugLogger);
    expect(policyLogger).toBe(noopDebugLogger);
  });
});
