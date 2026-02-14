import { describe, expect, it } from "vitest";
import { setDebugHeader } from "../../policies/sdk";
import { cache } from "../../policies/traffic/cache";
import type { Policy } from "../../policies/types";
import { createGateway } from "../gateway";

/**
 * Helper: create a gateway with debugHeaders enabled and a policy that
 * contributes debug data via setDebugHeader().
 */
function createDebugApp(
  gatewayDebugHeaders:
    | boolean
    | { requestHeader?: string; allow?: string[] } = true,
  policyHeaders: Record<string, string | number | boolean> = {}
) {
  const testPolicy: Policy = {
    name: "test-policy",
    priority: 50,
    handler: async (c, next) => {
      for (const [name, value] of Object.entries(policyHeaders)) {
        setDebugHeader(c, name, value);
      }
      await next();
    },
  };

  const gw = createGateway({
    name: "debug-test",
    debugHeaders: gatewayDebugHeaders,
    routes: [
      {
        path: "/test",
        pipeline: {
          policies: [testPolicy],
          upstream: {
            type: "handler",
            handler: (c) => c.json({ ok: true }),
          },
        },
      },
    ],
  });

  return gw.app;
}

describe("debug headers", () => {
  // --- Basic pull model ---

  it("should return requested debug headers in the response", async () => {
    const app = createDebugApp(true, {
      "x-stoma-cache-key": "GET:http://example.com/test",
      "x-stoma-cache-ttl": 300,
    });

    const res = await app.request("/test", {
      headers: {
        "x-stoma-debug": "x-stoma-cache-key, x-stoma-cache-ttl",
      },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("x-stoma-cache-key")).toBe(
      "GET:http://example.com/test"
    );
    expect(res.headers.get("x-stoma-cache-ttl")).toBe("300");
  });

  it("should only return headers that were requested", async () => {
    const app = createDebugApp(true, {
      "x-stoma-cache-key": "key-value",
      "x-stoma-cache-ttl": 300,
      "x-stoma-cache-status": "MISS",
    });

    const res = await app.request("/test", {
      headers: {
        "x-stoma-debug": "x-stoma-cache-key",
      },
    });

    expect(res.headers.get("x-stoma-cache-key")).toBe("key-value");
    expect(res.headers.get("x-stoma-cache-ttl")).toBeNull();
    expect(res.headers.get("x-stoma-cache-status")).toBeNull();
  });

  it("should not emit debug headers when no x-stoma-debug request header", async () => {
    const app = createDebugApp(true, {
      "x-stoma-cache-key": "key-value",
    });

    const res = await app.request("/test");

    expect(res.headers.get("x-stoma-cache-key")).toBeNull();
  });

  it("should not emit debug headers when debugHeaders is disabled", async () => {
    // Create gateway WITHOUT debugHeaders
    const testPolicy: Policy = {
      name: "test-policy",
      priority: 50,
      handler: async (c, next) => {
        setDebugHeader(c, "x-stoma-cache-key", "key-value");
        await next();
      },
    };

    const gw = createGateway({
      name: "no-debug",
      routes: [
        {
          path: "/test",
          pipeline: {
            policies: [testPolicy],
            upstream: {
              type: "handler",
              handler: (c) => c.json({ ok: true }),
            },
          },
        },
      ],
    });

    const res = await gw.app.request("/test", {
      headers: { "x-stoma-debug": "x-stoma-cache-key" },
    });

    expect(res.headers.get("x-stoma-cache-key")).toBeNull();
  });

  // --- Value types ---

  it("should stringify numeric values", async () => {
    const app = createDebugApp(true, {
      "x-stoma-ratelimit-window": 60,
    });

    const res = await app.request("/test", {
      headers: { "x-stoma-debug": "x-stoma-ratelimit-window" },
    });

    expect(res.headers.get("x-stoma-ratelimit-window")).toBe("60");
  });

  it("should stringify boolean values", async () => {
    const app = createDebugApp(true, {
      "x-stoma-test-flag": true,
    });

    const res = await app.request("/test", {
      headers: { "x-stoma-debug": "x-stoma-test-flag" },
    });

    expect(res.headers.get("x-stoma-test-flag")).toBe("true");
  });

  // --- Case insensitivity ---

  it("should match header names case-insensitively", async () => {
    const app = createDebugApp(true, {
      "x-stoma-cache-key": "the-key",
    });

    const res = await app.request("/test", {
      headers: { "x-stoma-debug": "X-STOMA-CACHE-KEY" },
    });

    expect(res.headers.get("x-stoma-cache-key")).toBe("the-key");
  });

  // --- Multiple debug values ---

  it("should handle multiple comma-separated requested values", async () => {
    const app = createDebugApp(true, {
      "x-stoma-cache-key": "key1",
      "x-stoma-cache-ttl": 300,
      "x-stoma-circuit-state": "closed",
    });

    const res = await app.request("/test", {
      headers: {
        "x-stoma-debug": "x-stoma-cache-key, x-stoma-circuit-state",
      },
    });

    expect(res.headers.get("x-stoma-cache-key")).toBe("key1");
    expect(res.headers.get("x-stoma-circuit-state")).toBe("closed");
    expect(res.headers.get("x-stoma-cache-ttl")).toBeNull();
  });

  // --- Allowlist ---

  it("should respect the allow list", async () => {
    const app = createDebugApp(
      { allow: ["x-stoma-cache-key"] },
      {
        "x-stoma-cache-key": "allowed-value",
        "x-stoma-cache-ttl": 300,
      }
    );

    const res = await app.request("/test", {
      headers: {
        "x-stoma-debug": "x-stoma-cache-key, x-stoma-cache-ttl",
      },
    });

    expect(res.headers.get("x-stoma-cache-key")).toBe("allowed-value");
    // x-stoma-cache-ttl is not in the allowlist, so even though the client
    // requested it and the policy set it, it should not appear
    expect(res.headers.get("x-stoma-cache-ttl")).toBeNull();
  });

  // --- Custom request header name ---

  it("should use custom request header name", async () => {
    const app = createDebugApp(
      { requestHeader: "x-debug" },
      { "x-stoma-cache-key": "custom-header-test" }
    );

    // Using custom header name
    const res = await app.request("/test", {
      headers: { "x-debug": "x-stoma-cache-key" },
    });

    expect(res.headers.get("x-stoma-cache-key")).toBe("custom-header-test");
  });

  it("should not respond to default header name when custom is configured", async () => {
    const app = createDebugApp(
      { requestHeader: "x-debug" },
      { "x-stoma-cache-key": "custom-header-test" }
    );

    // Using default header name - should not work when custom is configured
    const res = await app.request("/test", {
      headers: { "x-stoma-debug": "x-stoma-cache-key" },
    });

    expect(res.headers.get("x-stoma-cache-key")).toBeNull();
  });

  // --- Wildcard ---

  it("should return all debug headers when * is requested (no allowlist)", async () => {
    const app = createDebugApp(true, {
      "x-stoma-cache-key": "key1",
      "x-stoma-cache-ttl": 300,
      "x-stoma-circuit-state": "closed",
    });

    const res = await app.request("/test", {
      headers: { "x-stoma-debug": "*" },
    });

    expect(res.headers.get("x-stoma-cache-key")).toBe("key1");
    expect(res.headers.get("x-stoma-cache-ttl")).toBe("300");
    expect(res.headers.get("x-stoma-circuit-state")).toBe("closed");
  });

  it("should expand * to the allowlist when allowlist is configured", async () => {
    const app = createDebugApp(
      { allow: ["x-stoma-cache-key", "x-stoma-cache-ttl"] },
      {
        "x-stoma-cache-key": "key1",
        "x-stoma-cache-ttl": 300,
        "x-stoma-circuit-state": "closed",
      }
    );

    const res = await app.request("/test", {
      headers: { "x-stoma-debug": "*" },
    });

    expect(res.headers.get("x-stoma-cache-key")).toBe("key1");
    expect(res.headers.get("x-stoma-cache-ttl")).toBe("300");
    // Not in allowlist - should not appear even with *
    expect(res.headers.get("x-stoma-circuit-state")).toBeNull();
  });

  it("should support * mixed with explicit names", async () => {
    const app = createDebugApp(true, {
      "x-stoma-cache-key": "key1",
      "x-stoma-ratelimit-key": "ip:1.2.3.4",
    });

    const res = await app.request("/test", {
      headers: { "x-stoma-debug": "*, x-stoma-cache-key" },
    });

    expect(res.headers.get("x-stoma-cache-key")).toBe("key1");
    expect(res.headers.get("x-stoma-ratelimit-key")).toBe("ip:1.2.3.4");
  });

  // --- Edge cases ---

  it("should handle empty x-stoma-debug header value", async () => {
    const app = createDebugApp(true, {
      "x-stoma-cache-key": "value",
    });

    const res = await app.request("/test", {
      headers: { "x-stoma-debug": "" },
    });

    expect(res.headers.get("x-stoma-cache-key")).toBeNull();
  });

  it("should handle whitespace-only debug header", async () => {
    const app = createDebugApp(true, {
      "x-stoma-cache-key": "value",
    });

    const res = await app.request("/test", {
      headers: { "x-stoma-debug": "   " },
    });

    expect(res.headers.get("x-stoma-cache-key")).toBeNull();
  });

  it("should handle requested headers that no policy sets", async () => {
    const app = createDebugApp(true, {});

    const res = await app.request("/test", {
      headers: { "x-stoma-debug": "x-stoma-nonexistent" },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("x-stoma-nonexistent")).toBeNull();
  });

  // --- Zero overhead ---

  it("should be zero-overhead when debugHeaders is not configured", async () => {
    // This tests that setDebugHeader is a no-op (single Map lookup → undefined → return)
    // when debugHeaders is not enabled on the gateway. The policy still calls setDebugHeader
    // but it silently does nothing.
    const testPolicy: Policy = {
      name: "test-policy",
      priority: 50,
      handler: async (c, next) => {
        // These calls should be harmless no-ops
        setDebugHeader(c, "x-stoma-cache-key", "value");
        setDebugHeader(c, "x-stoma-cache-ttl", 300);
        await next();
      },
    };

    const gw = createGateway({
      name: "no-debug",
      routes: [
        {
          path: "/test",
          pipeline: {
            policies: [testPolicy],
            upstream: {
              type: "handler",
              handler: (c) => c.json({ ok: true }),
            },
          },
        },
      ],
    });

    const res = await gw.app.request("/test");
    expect(res.status).toBe(200);
    // No debug headers should leak through
    expect(res.headers.get("x-stoma-cache-key")).toBeNull();
    expect(res.headers.get("x-stoma-cache-ttl")).toBeNull();
  });

  // --- Cache expires-in integration ---

  it("should return x-stoma-cache-expires-in on cache HIT", async () => {
    const gw = createGateway({
      name: "cache-debug-test",
      debugHeaders: true,
      routes: [
        {
          path: "/cached",
          pipeline: {
            policies: [cache({ ttlSeconds: 120 })],
            upstream: {
              type: "handler",
              handler: (c) => c.json({ data: "fresh" }),
            },
          },
        },
      ],
    });

    // First request: MISS - no expires-in
    const miss = await gw.app.request("/cached", {
      headers: { "x-stoma-debug": "*" },
    });
    expect(miss.headers.get("x-stoma-cache-status")).toBe("MISS");
    expect(miss.headers.get("x-stoma-cache-expires-in")).toBeNull();

    // Second request: HIT - should have expires-in
    const hit = await gw.app.request("/cached", {
      headers: { "x-stoma-debug": "*" },
    });
    expect(hit.headers.get("x-stoma-cache-status")).toBe("HIT");
    const expiresIn = Number(hit.headers.get("x-stoma-cache-expires-in"));
    expect(expiresIn).toBeGreaterThan(0);
    expect(expiresIn).toBeLessThanOrEqual(120);
  });

  it("should not leak internal expires header on cache HIT", async () => {
    const gw = createGateway({
      name: "cache-leak-test",
      routes: [
        {
          path: "/cached",
          pipeline: {
            policies: [cache({ ttlSeconds: 60 })],
            upstream: {
              type: "handler",
              handler: (c) => c.json({ ok: true }),
            },
          },
        },
      ],
    });

    // Prime the cache
    await gw.app.request("/cached");
    // Serve from cache
    const hit = await gw.app.request("/cached");
    expect(hit.headers.get("x-cache")).toBe("HIT");
    expect(hit.headers.get("x-stoma-internal-expires-at")).toBeNull();
  });
});
