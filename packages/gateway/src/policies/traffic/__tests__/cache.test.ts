import { Hono } from "hono";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CacheStore } from "../cache";
import { cache, InMemoryCacheStore } from "../cache";

describe("cache", () => {
  let store: InMemoryCacheStore;

  beforeEach(() => {
    store = new InMemoryCacheStore();
  });

  afterEach(() => {
    store.clear();
    vi.useRealTimers();
  });

  function createApp(
    config: Parameters<typeof cache>[0],
    handler?: (c: {
      req: { method: string; url: string; json: () => Promise<unknown> };
      json: (data: unknown, status?: number) => Response;
      res: Response & { headers: Headers };
    }) => Response
  ) {
    const app = new Hono();
    const policy = cache(config);
    let callCount = 0;

    app.use("/*", policy.handler);

    app.get("/test", (c) => {
      callCount++;
      if (handler) return handler(c as never);
      return c.json({ count: callCount });
    });

    app.post("/test", (c) => {
      callCount++;
      if (handler) return handler(c as never);
      return c.json({ count: callCount });
    });

    app.put("/test", (c) => {
      callCount++;
      return c.json({ count: callCount });
    });

    app.delete("/test", (c) => {
      callCount++;
      return c.json({ count: callCount });
    });

    app.get("/error", (c) => {
      callCount++;
      return c.json({ error: "server_error" }, 500);
    });

    app.get("/not-found", (c) => {
      callCount++;
      return c.json({ error: "not_found" }, 404);
    });

    app.get("/unavailable", (c) => {
      callCount++;
      return c.json({ error: "service_unavailable" }, 503);
    });

    app.get("/empty", () => {
      callCount++;
      return new Response(null, { status: 204 });
    });

    app.get("/not-modified", () => {
      callCount++;
      return new Response(null, {
        status: 304,
        headers: { etag: '"abc123"' },
      });
    });

    app.get("/binary", () => {
      callCount++;
      const bytes = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]);
      return new Response(bytes, {
        status: 200,
        headers: { "content-type": "image/png" },
      });
    });

    app.get("/text", () => {
      callCount++;
      return new Response("Hello, world!", {
        status: 200,
        headers: { "content-type": "text/plain" },
      });
    });

    app.get("/large", () => {
      callCount++;
      const body = "x".repeat(100_000);
      return new Response(body, {
        status: 200,
        headers: { "content-type": "text/plain" },
      });
    });

    return { app, getCallCount: () => callCount };
  }

  // =====================================================================
  // INVARIANT: X-Cache header MUST always be present
  // =====================================================================
  // The JSDoc says "Sets X-Cache: HIT|MISS|BYPASS headers on every response"
  // but the current implementation silently skips non-cacheable methods
  // without setting any header.

  describe("INVARIANT: x-cache header is always present", () => {
    it("should set x-cache on GET request (cacheable method)", async () => {
      const { app } = createApp({ store });

      const res = await app.request("/test");
      expect(res.headers.get("x-cache")).toBe("MISS");
    });

    it("should set x-cache on second GET request", async () => {
      const { app } = createApp({ store });

      await app.request("/test");
      const res = await app.request("/test");
      expect(res.headers.get("x-cache")).toBe("HIT");
    });

    it("should set x-cache SKIP for non-cacheable methods", async () => {
      const { app } = createApp({ store }); // default: methods: ["GET"]

      const res = await app.request("/test", { method: "POST" });
      expect(res.status).toBe(200);
      expect(res.headers.get("x-cache")).toBe("SKIP");
    });

    it("should set x-cache SKIP for PUT when only GET is cacheable", async () => {
      const { app } = createApp({ store });

      const res = await app.request("/test", { method: "PUT" });
      expect(res.status).toBe(200);
      expect(res.headers.get("x-cache")).toBe("SKIP");
    });

    it("should set x-cache SKIP for DELETE when only GET is cacheable", async () => {
      const { app } = createApp({ store });

      const res = await app.request("/test", { method: "DELETE" });
      expect(res.status).toBe(200);
      expect(res.headers.get("x-cache")).toBe("SKIP");
    });

    it("should use custom cacheStatusHeader name for all status values", async () => {
      const { app } = createApp({ store, cacheStatusHeader: "x-my-cache" });

      const miss = await app.request("/test");
      expect(miss.headers.get("x-my-cache")).toBe("MISS");
      expect(miss.headers.get("x-cache")).toBeNull();

      const hit = await app.request("/test");
      expect(hit.headers.get("x-my-cache")).toBe("HIT");
      expect(hit.headers.get("x-cache")).toBeNull();
    });

    it("should use custom cacheStatusHeader for non-cacheable methods too", async () => {
      const { app } = createApp({ store, cacheStatusHeader: "x-my-cache" });

      const res = await app.request("/test", { method: "POST" });
      expect(res.headers.get("x-my-cache")).toBe("SKIP");
      expect(res.headers.get("x-cache")).toBeNull();
    });

    it("should set x-cache on the first BYPASS response too", async () => {
      // The existing tests only check the second request for BYPASS.
      // The first request to a no-store endpoint should also be BYPASS.
      const { app } = createApp({ store }, (c) => {
        c.res.headers.set("cache-control", "no-store");
        return c.json({ data: "fresh" });
      });

      const res1 = await app.request("/test");
      expect(res1.headers.get("x-cache")).toBe("BYPASS");
    });
  });

  // =====================================================================
  // INVARIANT: cached response body integrity
  // =====================================================================

  describe("INVARIANT: response body integrity", () => {
    it("should serve identical JSON body from cache", async () => {
      const { app } = createApp({ store });

      const res1 = await app.request("/test");
      const body1 = await res1.json();

      const res2 = await app.request("/test");
      const body2 = await res2.json();

      expect(body2).toEqual(body1);
    });

    it("should serve identical text body from cache", async () => {
      const { app } = createApp({ store });

      const res1 = await app.request("/text");
      const text1 = await res1.text();

      const res2 = await app.request("/text");
      const text2 = await res2.text();

      expect(text2).toBe(text1);
      expect(text2).toBe("Hello, world!");
    });

    it("should serve identical binary body from cache", async () => {
      const { app } = createApp({ store });

      const res1 = await app.request("/binary");
      const buf1 = await res1.arrayBuffer();

      const res2 = await app.request("/binary");
      const buf2 = await res2.arrayBuffer();

      expect(new Uint8Array(buf2)).toEqual(new Uint8Array(buf1));
    });

    it("should handle large response bodies", async () => {
      const { app, getCallCount } = createApp({ store });

      const res1 = await app.request("/large");
      const text1 = await res1.text();
      expect(text1.length).toBe(100_000);

      const res2 = await app.request("/large");
      const text2 = await res2.text();
      expect(text2).toBe(text1);
      expect(getCallCount()).toBe(1); // served from cache
    });

    it("should handle empty body (204) responses", async () => {
      const { app, getCallCount } = createApp({ store });

      const res1 = await app.request("/empty");
      expect(res1.status).toBe(204);

      const res2 = await app.request("/empty");
      expect(res2.status).toBe(204);
      expect(getCallCount()).toBe(1);
    });

    it("should handle 304 Not Modified responses", async () => {
      const { app, getCallCount } = createApp({ store });

      const res1 = await app.request("/not-modified");
      expect(res1.status).toBe(304);
      expect(res1.headers.get("etag")).toBe('"abc123"');

      const res2 = await app.request("/not-modified");
      expect(res2.status).toBe(304);
      expect(res2.headers.get("etag")).toBe('"abc123"');
      expect(getCallCount()).toBe(1);
    });
  });

  // =====================================================================
  // INVARIANT: original response headers are preserved
  // =====================================================================

  describe("INVARIANT: response header preservation", () => {
    it("should preserve content-type from original response on HIT", async () => {
      const { app } = createApp({ store });

      await app.request("/text");
      const hit = await app.request("/text");
      expect(hit.headers.get("content-type")).toBe("text/plain");
    });

    it("should preserve custom headers from upstream on HIT", async () => {
      const { app } = createApp({ store }, () => {
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            "content-type": "application/json",
            "x-custom": "preserved",
          },
        });
      });

      await app.request("/test");
      const hit = await app.request("/test");
      expect(hit.headers.get("x-custom")).toBe("preserved");
    });

    it("should preserve status code from original response on HIT", async () => {
      const app = new Hono();
      const policy = cache({ store });
      let callCount = 0;

      app.use("/*", policy.handler);
      app.get("/created", (c) => {
        callCount++;
        return c.json({ id: "abc" }, 201);
      });

      const res1 = await app.request("/created");
      expect(res1.status).toBe(201);

      const res2 = await app.request("/created");
      expect(res2.status).toBe(201);
      expect(res2.headers.get("x-cache")).toBe("HIT");
      expect(callCount).toBe(1);
    });
  });

  // =====================================================================
  // VARIANT: error response caching behavior
  // =====================================================================
  // Currently the cache stores ANY status code. This means transient 500s
  // or 503s get cached and served for the full TTL - a real production
  // problem. 404s are debatable but server errors should not be cached.

  describe("VARIANT: error response caching", () => {
    it("should NOT cache 500 error responses", async () => {
      const { app, getCallCount } = createApp({ store });

      const res1 = await app.request("/error");
      expect(res1.status).toBe(500);
      expect(res1.headers.get("x-cache")).toBe("SKIP");

      const res2 = await app.request("/error");
      expect(res2.status).toBe(500);
      expect(res2.headers.get("x-cache")).toBe("SKIP");

      // The upstream should be called BOTH times - errors should not be cached
      expect(getCallCount()).toBe(2);
    });

    it("should NOT cache 503 error responses", async () => {
      const { app, getCallCount } = createApp({ store });

      const res1 = await app.request("/unavailable");
      expect(res1.headers.get("x-cache")).toBe("SKIP");

      await app.request("/unavailable");
      expect(getCallCount()).toBe(2);
    });

    it("should cache 404 responses (debatable but consistent)", async () => {
      // 404 is a valid cacheable status per HTTP semantics.
      // If you disagree, this test documents the current behavior.
      const { app, getCallCount } = createApp({ store });

      await app.request("/not-found");
      const res2 = await app.request("/not-found");

      expect(res2.status).toBe(404);
      // Current behavior: 404 IS cached. This test documents it.
      // Change this expectation if the policy should exclude 404.
      expect(getCallCount()).toBe(1);
      expect(res2.headers.get("x-cache")).toBe("HIT");
    });
  });

  // =====================================================================
  // VARIANT: method handling
  // =====================================================================

  describe("VARIANT: method handling", () => {
    it("should only cache GET requests by default", async () => {
      const { app, getCallCount } = createApp({ store });

      await app.request("/test", { method: "POST" });
      await app.request("/test", { method: "POST" });
      expect(getCallCount()).toBe(2);
    });

    it("should cache POST when explicitly configured", async () => {
      const app = new Hono();
      const policy = cache({ store, methods: ["POST"] });
      let callCount = 0;

      app.use("/*", policy.handler);
      app.post("/test", (c) => {
        callCount++;
        return c.json({ count: callCount });
      });

      await app.request("/test", { method: "POST" });
      const res = await app.request("/test", { method: "POST" });
      expect(res.headers.get("x-cache")).toBe("HIT");
      expect(callCount).toBe(1);
    });

    it("should handle multiple methods in config", async () => {
      const { app, getCallCount } = createApp({
        store,
        methods: ["GET", "POST"],
      });

      await app.request("/test"); // GET → MISS
      const getHit = await app.request("/test"); // GET → HIT
      expect(getHit.headers.get("x-cache")).toBe("HIT");

      await app.request("/test", { method: "POST" }); // POST → MISS
      const postHit = await app.request("/test", { method: "POST" }); // POST → HIT
      expect(postHit.headers.get("x-cache")).toBe("HIT");

      // GET and POST should have separate cache entries (different keys)
      expect(getCallCount()).toBe(2); // one GET + one POST upstream call
    });

    it("should be case-insensitive for method matching", async () => {
      // The implementation uses c.req.method.toUpperCase() on line 141
      // but if methods config has lowercase, it won't match.
      const { app } = createApp({
        store,
        methods: ["get"], // lowercase in config
      });

      const res = await app.request("/test"); // Hono sends "GET" uppercase
      // Should this match? The current implementation compares
      // "GET".toUpperCase() against ["get"] - this would NOT match!
      // This is either a bug or the config should document uppercase-only.
      expect(res.headers.get("x-cache")).toBe("MISS");
    });

    it("should separate cache entries by HTTP method", async () => {
      const { app, getCallCount } = createApp({
        store,
        methods: ["GET", "POST"],
      });

      // Prime GET cache
      await app.request("/test");
      expect(getCallCount()).toBe(1);

      // POST should NOT return GET's cached response
      const postRes = await app.request("/test", { method: "POST" });
      expect(postRes.headers.get("x-cache")).toBe("MISS");
      expect(getCallCount()).toBe(2);
    });
  });

  // =====================================================================
  // VARIANT: POST body cache key collision
  // =====================================================================

  describe("VARIANT: POST body cache key collision", () => {
    it("should produce different cache keys for POST requests with different bodies", async () => {
      // BUG: The default cache key is `POST:URL` - it ignores the body.
      // Two POST requests with different JSON bodies to the same URL
      // will get the same cached response. This is a data integrity issue.
      const app = new Hono();
      const policy = cache({ store, methods: ["POST"] });
      let lastBody: unknown = null;

      app.use("/*", policy.handler);
      app.post("/render", async (c) => {
        lastBody = await c.req.json();
        return c.json({ rendered: lastBody });
      });

      const res1 = await app.request("/render", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: "https://example.com/page-a" }),
      });
      const body1 = (await res1.json()) as Record<string, unknown>;

      const res2 = await app.request("/render", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: "https://example.com/page-b" }),
      });
      const body2 = (await res2.json()) as Record<string, unknown>;

      // These SHOULD be different because the POST bodies are different
      expect(body1.rendered).toEqual({ url: "https://example.com/page-a" });
      expect(body2.rendered).toEqual({ url: "https://example.com/page-b" });
      // If body2 equals body1, the cache served stale data for a different request
    });
  });

  // =====================================================================
  // VARIANT: TTL behavior
  // =====================================================================

  describe("VARIANT: TTL behavior", () => {
    it("should expire cached entries after TTL", async () => {
      vi.useFakeTimers();

      const { app, getCallCount } = createApp({ store, ttlSeconds: 5 });

      await app.request("/test");
      expect(getCallCount()).toBe(1);

      // Within TTL
      vi.advanceTimersByTime(4000);
      const res2 = await app.request("/test");
      expect(res2.headers.get("x-cache")).toBe("HIT");
      expect(getCallCount()).toBe(1);

      // Past TTL
      vi.advanceTimersByTime(2000);
      const res3 = await app.request("/test");
      expect(res3.headers.get("x-cache")).toBe("MISS");
      expect(getCallCount()).toBe(2);
    });

    it("should expire at exact TTL boundary", async () => {
      vi.useFakeTimers();

      const { app } = createApp({ store, ttlSeconds: 10 });

      await app.request("/test");

      // Exactly at TTL (10000ms) - should still be expired (> check)
      vi.advanceTimersByTime(10_001);
      const res = await app.request("/test");
      expect(res.headers.get("x-cache")).toBe("MISS");
    });

    it("should handle very short TTL (1 second)", async () => {
      vi.useFakeTimers();

      const { app, getCallCount } = createApp({ store, ttlSeconds: 1 });

      await app.request("/test");

      vi.advanceTimersByTime(500);
      const mid = await app.request("/test");
      expect(mid.headers.get("x-cache")).toBe("HIT");

      vi.advanceTimersByTime(600);
      const expired = await app.request("/test");
      expect(expired.headers.get("x-cache")).toBe("MISS");

      expect(getCallCount()).toBe(2);
    });

    it("should handle zero TTL", async () => {
      // TTL of 0 should effectively disable caching (immediate expiry)
      vi.useFakeTimers();

      const { app, getCallCount } = createApp({ store, ttlSeconds: 0 });

      await app.request("/test");

      // Even immediate next request should miss because TTL is 0
      vi.advanceTimersByTime(1);
      await app.request("/test");

      // With ttlSeconds=0, expiresAt = Date.now() + 0 = Date.now()
      // The get() check is Date.now() > entry.expiresAt
      // Since time advances by 1ms, this should be expired
      expect(getCallCount()).toBe(2);
    });

    it("should refresh TTL on cache replacement after expiry", async () => {
      vi.useFakeTimers();

      const { app } = createApp({ store, ttlSeconds: 5 });

      await app.request("/test"); // MISS, stored with TTL=5s

      vi.advanceTimersByTime(6000); // expired
      await app.request("/test"); // MISS, re-stored with fresh TTL=5s

      vi.advanceTimersByTime(3000); // only 3s into new TTL
      const res = await app.request("/test");
      expect(res.headers.get("x-cache")).toBe("HIT"); // still valid
    });

    it("should use default TTL of 300 seconds when not specified", async () => {
      vi.useFakeTimers();

      const { app } = createApp({ store }); // no ttlSeconds

      await app.request("/test");

      vi.advanceTimersByTime(299_000);
      const stillValid = await app.request("/test");
      expect(stillValid.headers.get("x-cache")).toBe("HIT");

      vi.advanceTimersByTime(2000); // total: 301s
      const expired = await app.request("/test");
      expect(expired.headers.get("x-cache")).toBe("MISS");
    });
  });

  // =====================================================================
  // VARIANT: Cache-Control respect
  // =====================================================================

  describe("VARIANT: Cache-Control respect", () => {
    it("should bypass on no-store", async () => {
      const { app, getCallCount } = createApp({ store }, (c) => {
        c.res.headers.set("cache-control", "no-store");
        return c.json({ data: "fresh" });
      });

      const res1 = await app.request("/test");
      expect(res1.headers.get("x-cache")).toBe("BYPASS");

      const res2 = await app.request("/test");
      expect(res2.headers.get("x-cache")).toBe("BYPASS");

      expect(getCallCount()).toBe(2); // never cached
    });

    it("should bypass on no-cache", async () => {
      const { app, getCallCount } = createApp({ store }, (c) => {
        c.res.headers.set("cache-control", "no-cache");
        return c.json({ data: "fresh" });
      });

      await app.request("/test");
      const res2 = await app.request("/test");
      expect(res2.headers.get("x-cache")).toBe("BYPASS");
      expect(getCallCount()).toBe(2);
    });

    it("should cache when Cache-Control has max-age only", async () => {
      const { app, getCallCount } = createApp({ store }, (c) => {
        c.res.headers.set("cache-control", "max-age=3600");
        return c.json({ data: "cacheable" });
      });

      await app.request("/test");
      const res2 = await app.request("/test");
      expect(res2.headers.get("x-cache")).toBe("HIT");
      expect(getCallCount()).toBe(1);
    });

    it("should cache when respectCacheControl is false despite no-store", async () => {
      const { app, getCallCount } = createApp(
        { store, respectCacheControl: false },
        (c) => {
          c.res.headers.set("cache-control", "no-store");
          return c.json({ data: "cached anyway" });
        }
      );

      await app.request("/test");
      const res2 = await app.request("/test");
      expect(res2.headers.get("x-cache")).toBe("HIT");
      expect(getCallCount()).toBe(1);
    });

    it("should NOT false-positive match substring of directive", async () => {
      // BUG: bypassDirectives uses `cc.includes(d)` which is a substring
      // match. A header like "x-no-store-custom" would incorrectly match
      // the "no-store" bypass directive.
      const { app, getCallCount } = createApp({ store }, (c) => {
        // This is a custom directive, NOT "no-store"
        c.res.headers.set("cache-control", "public, x-custom-no-store-flag");
        return c.json({ data: "should be cached" });
      });

      await app.request("/test");
      const res2 = await app.request("/test");

      // Should be HIT because "x-custom-no-store-flag" is not "no-store"
      expect(res2.headers.get("x-cache")).toBe("HIT");
      expect(getCallCount()).toBe(1);
    });

    it("should handle Cache-Control with multiple directives", async () => {
      const { app } = createApp({ store }, (c) => {
        c.res.headers.set(
          "cache-control",
          "public, max-age=3600, must-revalidate"
        );
        return c.json({ data: "ok" });
      });

      await app.request("/test");
      const res2 = await app.request("/test");
      // None of the directives match the default bypass list
      expect(res2.headers.get("x-cache")).toBe("HIT");
    });

    it("should handle custom bypassDirectives", async () => {
      const { app } = createApp(
        {
          store,
          bypassDirectives: ["private", "no-store"],
        },
        (c) => {
          c.res.headers.set("cache-control", "private");
          return c.json({ data: "private" });
        }
      );

      await app.request("/test");
      const res2 = await app.request("/test");
      expect(res2.headers.get("x-cache")).toBe("BYPASS");
    });

    it("should handle missing Cache-Control header gracefully", async () => {
      // Upstream returns no Cache-Control at all
      const { app } = createApp({ store });

      await app.request("/test"); // no cache-control in response
      const res2 = await app.request("/test");
      expect(res2.headers.get("x-cache")).toBe("HIT");
    });
  });

  // =====================================================================
  // VARIANT: cache key generation
  // =====================================================================

  describe("VARIANT: cache key generation", () => {
    it("should use method + URL as default cache key", async () => {
      const { app, getCallCount } = createApp({ store });

      await app.request("/test?a=1");
      await app.request("/test?a=2"); // different query string

      expect(getCallCount()).toBe(2); // separate cache entries
    });

    it("should vary cache key on specified headers", async () => {
      const { app, getCallCount } = createApp({
        store,
        varyHeaders: ["accept-language"],
      });

      await app.request("/test", { headers: { "accept-language": "en" } });
      await app.request("/test", { headers: { "accept-language": "de" } });

      expect(getCallCount()).toBe(2); // separate entries

      const res = await app.request("/test", {
        headers: { "accept-language": "en" },
      });
      expect(res.headers.get("x-cache")).toBe("HIT");
      expect(getCallCount()).toBe(2); // no additional upstream call
    });

    it("should handle vary header that is absent from request", async () => {
      const { app, getCallCount } = createApp({
        store,
        varyHeaders: ["x-custom"],
      });

      // Request without x-custom header
      await app.request("/test");

      // Request WITH x-custom header should be a different entry
      await app.request("/test", { headers: { "x-custom": "value" } });

      expect(getCallCount()).toBe(2);
    });

    it("should handle multiple vary headers", async () => {
      const { app, getCallCount } = createApp({
        store,
        varyHeaders: ["accept-language", "accept-encoding"],
      });

      await app.request("/test", {
        headers: { "accept-language": "en", "accept-encoding": "gzip" },
      });
      await app.request("/test", {
        headers: { "accept-language": "en", "accept-encoding": "br" },
      });

      expect(getCallCount()).toBe(2); // different vary combination
    });

    it("should use custom cache key function", async () => {
      const { app, getCallCount } = createApp({
        store,
        cacheKeyFn: (c) => {
          const ctx = c as { req: { url: string } };
          return new URL(ctx.req.url).pathname; // ignore query params
        },
      });

      await app.request("/test?a=1");
      const res = await app.request("/test?b=2");

      // Same key despite different query strings
      expect(res.headers.get("x-cache")).toBe("HIT");
      expect(getCallCount()).toBe(1);
    });

    it("should use custom key function that returns static key", async () => {
      const { app, getCallCount } = createApp({
        store,
        cacheKeyFn: () => "static-key",
      });

      await app.request("/test?a=1");
      const res = await app.request("/test?b=2");
      expect(res.headers.get("x-cache")).toBe("HIT");
      expect(getCallCount()).toBe(1);
    });
  });

  // =====================================================================
  // VARIANT: store failure resilience
  // =====================================================================

  describe("VARIANT: store failure resilience", () => {
    it("should degrade gracefully when store.get() throws", async () => {
      // BUG: If the cache store throws (e.g., network error to Redis/KV),
      // the error propagates and crashes the request with a 500.
      // Cache should be a best-effort optimization, not a SPOF.
      const failingStore: CacheStore = {
        get: async () => {
          throw new Error("Redis connection refused");
        },
        put: async () => {},
        delete: async () => false,
      };

      const app = new Hono();
      const policy = cache({ store: failingStore });
      app.use("/*", policy.handler);
      app.get("/test", (c) => c.json({ ok: true }));

      const res = await app.request("/test");
      // Should still return 200 from upstream, not a 500 crash
      expect(res.status).toBe(200);
    });

    it("should degrade gracefully when store.put() throws", async () => {
      // BUG: If put() throws after a successful upstream response,
      // the error propagates and the client gets a 500 instead of
      // the perfectly valid upstream response.
      const failingStore: CacheStore = {
        get: async () => null,
        put: async () => {
          throw new Error("KV write failed");
        },
        delete: async () => false,
      };

      const app = new Hono();
      const policy = cache({ store: failingStore });
      app.use("/*", policy.handler);
      app.get("/test", (c) => c.json({ ok: true }));

      const res = await app.request("/test");
      // Should return the upstream response even if caching failed
      expect(res.status).toBe(200);
    });
  });

  // =====================================================================
  // VARIANT: skip condition
  // =====================================================================

  describe("VARIANT: skip condition", () => {
    it("should skip caching when skip function returns true", async () => {
      const { app, getCallCount } = createApp({
        store,
        skip: (c) => {
          const ctx = c as { req: { url: string } };
          return ctx.req.url.includes("?nocache");
        },
      });

      // Skipped request
      const skipped = await app.request("/test?nocache=1");
      expect(skipped.status).toBe(200);
      // When skipped, the policy doesn't run at all (withSkip bypasses it)
      // So no x-cache header is expected - but is this correct behavior?
      // Arguably, a skipped policy should still indicate it was present.

      // Non-skipped request
      const normal = await app.request("/test");
      expect(normal.headers.get("x-cache")).toBe("MISS");

      expect(getCallCount()).toBe(2);
    });
  });

  // =====================================================================
  // VARIANT: concurrent request behavior
  // =====================================================================

  describe("VARIANT: concurrent requests", () => {
    it("should handle concurrent requests to the same key", async () => {
      const { app, getCallCount } = createApp({ store });

      // Fire two requests simultaneously
      const [res1, res2] = await Promise.all([
        app.request("/test"),
        app.request("/test"),
      ]);

      // Both should succeed
      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);

      // Without request coalescing, both will be MISS and both will hit upstream
      // This is acceptable behavior (no request coalescing) but documents it
      expect(getCallCount()).toBe(2);

      // But a subsequent request should definitely be HIT
      const res3 = await app.request("/test");
      expect(res3.headers.get("x-cache")).toBe("HIT");
      expect(getCallCount()).toBe(2);
    });
  });

  // =====================================================================
  // VARIANT: cache isolation between routes
  // =====================================================================

  describe("VARIANT: cache isolation", () => {
    it("should isolate cache entries by path", async () => {
      const { app, getCallCount } = createApp({ store });

      await app.request("/test");
      await app.request("/text"); // different path

      expect(getCallCount()).toBe(2);

      // Each has its own cache entry
      const testHit = await app.request("/test");
      expect(testHit.headers.get("x-cache")).toBe("HIT");

      const textHit = await app.request("/text");
      expect(textHit.headers.get("x-cache")).toBe("HIT");

      expect(getCallCount()).toBe(2); // no additional upstream calls
    });

    it("should share cache store across routes using the same store instance", async () => {
      // Two separate cache policy instances but same store
      const app = new Hono();
      const policy1 = cache({ store, ttlSeconds: 60 });
      const policy2 = cache({ store, ttlSeconds: 60 });
      let route1Count = 0;
      let route2Count = 0;

      app.use("/route1/*", policy1.handler);
      app.use("/route2/*", policy2.handler);
      app.get("/route1/data", (c) => {
        route1Count++;
        return c.json({ route: 1 });
      });
      app.get("/route2/data", (c) => {
        route2Count++;
        return c.json({ route: 2 });
      });

      await app.request("/route1/data");
      await app.request("/route2/data");

      // They use different keys (different URLs), so separate entries
      expect(route1Count).toBe(1);
      expect(route2Count).toBe(1);

      const hit1 = await app.request("/route1/data");
      const hit2 = await app.request("/route2/data");
      expect(hit1.headers.get("x-cache")).toBe("HIT");
      expect(hit2.headers.get("x-cache")).toBe("HIT");
    });
  });

  // =====================================================================
  // INVARIANT: policy metadata
  // =====================================================================

  describe("INVARIANT: policy metadata", () => {
    it("should have priority 40 (CACHE)", () => {
      const policy = cache({ store });
      expect(policy.priority).toBe(40);
    });

    it("should have name 'cache'", () => {
      const policy = cache({ store });
      expect(policy.name).toBe("cache");
    });

    it("should work with no config (all defaults)", () => {
      const policy = cache();
      expect(policy.name).toBe("cache");
      expect(policy.priority).toBe(40);
    });
  });

  // =====================================================================
  // InMemoryCacheStore unit tests
  // =====================================================================

  describe("InMemoryCacheStore", () => {
    it("should return null for unknown key", async () => {
      const result = await store.get("unknown");
      expect(result).toBeNull();
    });

    it("should store and retrieve a response", async () => {
      const original = new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });

      await store.put("test", original, 300);
      const cached = await store.get("test");

      expect(cached).not.toBeNull();
      expect(cached!.status).toBe(200);
      const body = await cached!.json();
      expect(body).toEqual({ ok: true });
    });

    it("should preserve all response headers", async () => {
      const original = new Response("data", {
        headers: {
          "content-type": "text/plain",
          "x-custom-a": "value-a",
          "x-custom-b": "value-b",
        },
      });

      await store.put("test", original, 300);
      const cached = await store.get("test");

      expect(cached!.headers.get("x-custom-a")).toBe("value-a");
      expect(cached!.headers.get("x-custom-b")).toBe("value-b");
    });

    it("should expire entries after TTL", async () => {
      vi.useFakeTimers();

      await store.put("test", new Response("data"), 5);

      vi.advanceTimersByTime(6000);

      const cached = await store.get("test");
      expect(cached).toBeNull();
    });

    it("should not expire entries before TTL", async () => {
      vi.useFakeTimers();

      await store.put("test", new Response("data"), 5);

      vi.advanceTimersByTime(4000);

      const cached = await store.get("test");
      expect(cached).not.toBeNull();
    });

    it("should delete entries", async () => {
      await store.put("test", new Response("data"), 300);

      const deleted = await store.delete("test");
      expect(deleted).toBe(true);

      const cached = await store.get("test");
      expect(cached).toBeNull();
    });

    it("should return false when deleting non-existent key", async () => {
      const deleted = await store.delete("nonexistent");
      expect(deleted).toBe(false);
    });

    it("should handle overwriting existing key", async () => {
      await store.put("test", new Response("first"), 300);
      await store.put("test", new Response("second"), 300);

      const cached = await store.get("test");
      const body = await cached!.text();
      expect(body).toBe("second");
    });

    it("should handle empty body response", async () => {
      await store.put("test", new Response(null, { status: 204 }), 300);

      const cached = await store.get("test");
      expect(cached).not.toBeNull();
      expect(cached!.status).toBe(204);

      const body = await cached!.text();
      expect(body).toBe("");
    });

    it("should clear all entries", async () => {
      await store.put("a", new Response("a"), 300);
      await store.put("b", new Response("b"), 300);

      store.clear();

      expect(await store.get("a")).toBeNull();
      expect(await store.get("b")).toBeNull();
    });

    it("should destroy all entries via destroy()", async () => {
      await store.put("x", new Response("x"), 300);
      await store.put("y", new Response("y"), 300);

      store.destroy();

      expect(await store.get("x")).toBeNull();
      expect(await store.get("y")).toBeNull();
      expect(store.size).toBe(0);
    });

    it("should store binary data correctly", async () => {
      const bytes = new Uint8Array([0x00, 0xff, 0x89, 0x50]);
      await store.put("bin", new Response(bytes), 300);

      const cached = await store.get("bin");
      const buf = await cached!.arrayBuffer();
      expect(new Uint8Array(buf)).toEqual(bytes);
    });

    // Null-body statuses (204, 304) must round-trip cleanly.
    // Node/Bun/Deno reject `new Response(body, { status: 204 })` when
    // body is non-null. These tests guard against that regression.
    it.each([
      { status: 204, label: "204 No Content" },
      { status: 304, label: "304 Not Modified" },
    ])("should round-trip $label response", async ({ status }) => {
      const original = new Response(null, {
        status,
        headers: { "x-custom": "value" },
      });

      await store.put("key", original, 300);
      const cached = await store.get("key");

      expect(cached).not.toBeNull();
      expect(cached!.status).toBe(status);
      expect(cached!.headers.get("x-custom")).toBe("value");
      expect(await cached!.text()).toBe("");
    });

    it.each([
      { body: "hello", type: "text", check: (r: Response) => r.text() },
      {
        body: JSON.stringify({ a: 1 }),
        type: "json",
        check: (r: Response) => r.json(),
      },
      {
        body: new Uint8Array([1, 2, 3]),
        type: "binary",
        check: async (r: Response) => new Uint8Array(await r.arrayBuffer()),
      },
    ])("should round-trip $type body with preserved status", async ({
      body,
      check,
    }) => {
      const original = new Response(body, {
        status: 200,
        headers: { "x-tag": "test" },
      });

      await store.put("rt", original, 300);
      const cached = await store.get("rt");

      expect(cached).not.toBeNull();
      expect(cached!.status).toBe(200);
      expect(cached!.headers.get("x-tag")).toBe("test");

      // Re-create originals for comparison (body is consumed)
      const expected = await check(new Response(body, { status: 200 }));
      const actual = await check(cached!);
      expect(actual).toEqual(expected);
    });
  });
});
