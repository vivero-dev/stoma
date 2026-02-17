import { describe, expect, it } from "vitest";
import { bunAdapter } from "../bun";
import { denoAdapter } from "../deno";
import { nodeAdapter } from "../node";

describe("runtime adapters", () => {
  describe("nodeAdapter", () => {
    it("should provide rateLimitStore, circuitBreakerStore, and cacheStore", () => {
      const adapter = nodeAdapter();
      expect(adapter.rateLimitStore).toBeDefined();
      expect(adapter.circuitBreakerStore).toBeDefined();
      expect(adapter.cacheStore).toBeDefined();
    });
  });

  describe("bunAdapter", () => {
    it("should provide rateLimitStore, circuitBreakerStore, and cacheStore", () => {
      const adapter = bunAdapter();
      expect(adapter.rateLimitStore).toBeDefined();
      expect(adapter.circuitBreakerStore).toBeDefined();
      expect(adapter.cacheStore).toBeDefined();
    });
  });

  describe("denoAdapter", () => {
    it("should provide rateLimitStore, circuitBreakerStore, and cacheStore", () => {
      const adapter = denoAdapter();
      expect(adapter.rateLimitStore).toBeDefined();
      expect(adapter.circuitBreakerStore).toBeDefined();
      expect(adapter.cacheStore).toBeDefined();
    });
  });

  it("should return distinct store instances per adapter call", () => {
    const a = nodeAdapter();
    const b = nodeAdapter();
    expect(a.rateLimitStore).not.toBe(b.rateLimitStore);
    expect(a.circuitBreakerStore).not.toBe(b.circuitBreakerStore);
    expect(a.cacheStore).not.toBe(b.cacheStore);
  });
});
