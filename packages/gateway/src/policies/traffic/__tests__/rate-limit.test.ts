import { Hono } from "hono";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GatewayError } from "../../../core/errors";
import { InMemoryRateLimitStore, rateLimit } from "../rate-limit";

describe("rateLimit", () => {
  const activeStores: InMemoryRateLimitStore[] = [];

  function createStore(
    options?: number | { maxKeys?: number; cleanupIntervalMs?: number }
  ) {
    const store = new InMemoryRateLimitStore(options);
    activeStores.push(store);
    return store;
  }

  afterEach(() => {
    for (const store of activeStores) {
      store.destroy();
    }
    activeStores.length = 0;
    vi.useRealTimers();
  });

  function createApp(config: Parameters<typeof rateLimit>[0]) {
    const app = new Hono();
    const policy = rateLimit(config);

    app.use("/*", async (c, next) => {
      try {
        await policy.handler(c, next);
      } catch (err) {
        if (err instanceof GatewayError) {
          const res = c.json(
            { error: err.code, message: err.message },
            err.statusCode as 429
          );
          // Apply error-attached headers (e.g. rate-limit headers)
          if (err.headers) {
            for (const [key, value] of Object.entries(err.headers)) {
              c.res.headers.set(key, value);
            }
          }
          return res;
        }
        throw err;
      }
    });
    app.get("/test", (c) => c.json({ ok: true }));

    return app;
  }

  // --- Valid scenarios ---

  it("should allow requests under the rate limit", async () => {
    const store = createStore();
    const app = createApp({ max: 5, store });

    const res = await app.request("/test");

    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toEqual({ ok: true });
  });

  it("should set rate limit headers on every response", async () => {
    const store = createStore();
    const app = createApp({ max: 10, windowSeconds: 60, store });

    const res = await app.request("/test");

    expect(res.headers.get("x-ratelimit-limit")).toBe("10");
    expect(res.headers.get("x-ratelimit-remaining")).toBe("9");
    expect(res.headers.get("x-ratelimit-reset")).toBeDefined();
    expect(Number(res.headers.get("x-ratelimit-reset"))).toBeGreaterThan(0);
  });

  it("should use custom key extractor", async () => {
    const store = createStore();
    const app = createApp({
      max: 1,
      store,
      keyBy: () => "custom-key",
    });

    const res1 = await app.request("/test");
    expect(res1.status).toBe(200);

    const res2 = await app.request("/test");
    expect(res2.status).toBe(429);
  });

  it("should use custom status code when rate limited", async () => {
    const store = createStore();
    const app = createApp({ max: 1, store, statusCode: 503 });

    await app.request("/test");
    const res = await app.request("/test");

    expect(res.status).toBe(503);
  });

  it("should use custom message when rate limited", async () => {
    const store = createStore();
    const app = createApp({
      max: 1,
      store,
      message: "Slow down!",
    });

    await app.request("/test");
    const res = await app.request("/test");

    expect(res.status).toBe(429);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.message).toBe("Slow down!");
  });

  // --- Boundary conditions ---

  it("should allow exactly max requests", async () => {
    const store = createStore();
    const app = createApp({ max: 3, store });

    const res1 = await app.request("/test");
    const res2 = await app.request("/test");
    const res3 = await app.request("/test");

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res3.status).toBe(200);

    const res4 = await app.request("/test");
    expect(res4.status).toBe(429);
  });

  it("should reset counter after window expires", async () => {
    vi.useFakeTimers();

    const timedStore = createStore();
    const app = createApp({ max: 1, windowSeconds: 2, store: timedStore });

    const res1 = await app.request("/test");
    expect(res1.status).toBe(200);

    const res2 = await app.request("/test");
    expect(res2.status).toBe(429);

    // Advance past the window
    vi.advanceTimersByTime(2100);

    const res3 = await app.request("/test");
    expect(res3.status).toBe(200);
  });

  it("should handle zero remaining correctly in headers", async () => {
    const store = createStore();
    const app = createApp({ max: 1, store });

    const res = await app.request("/test");

    expect(res.headers.get("x-ratelimit-remaining")).toBe("0");
  });

  // --- Error handling ---

  it("should reject request when rate limit exceeded", async () => {
    const store = createStore();
    const app = createApp({ max: 1, store });

    await app.request("/test");
    const res = await app.request("/test");

    expect(res.status).toBe(429);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("rate_limited");
    expect(body.message).toBe("Rate limit exceeded");
  });

  it("should set retry-after header when rate limited", async () => {
    const store = createStore();
    const app = createApp({ max: 1, windowSeconds: 60, store });

    await app.request("/test");
    const res = await app.request("/test");

    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBeDefined();
    expect(Number(res.headers.get("retry-after"))).toBeGreaterThan(0);
  });

  // --- Edge cases ---

  it("should rate limit independently per key", async () => {
    const store = createStore();
    const app = createApp({
      max: 1,
      store,
      keyBy: (c: unknown) => {
        const ctx = c as {
          req: { header: (name: string) => string | undefined };
        };
        return ctx.req.header("x-user-id") ?? "anonymous";
      },
    });

    const res1 = await app.request("/test", {
      headers: { "x-user-id": "user-a" },
    });
    const res2 = await app.request("/test", {
      headers: { "x-user-id": "user-b" },
    });

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);

    const res3 = await app.request("/test", {
      headers: { "x-user-id": "user-a" },
    });
    expect(res3.status).toBe(429);
  });

  it("should handle concurrent requests to the same key", async () => {
    const store = createStore();
    const app = createApp({ max: 2, store });

    const [res1, res2, res3] = await Promise.all([
      app.request("/test"),
      app.request("/test"),
      app.request("/test"),
    ]);

    const statuses = [res1.status, res2.status, res3.status].sort();
    // At least one should be 429, and at most 2 should be 200
    expect(statuses.filter((s) => s === 200).length).toBeLessThanOrEqual(2);
    expect(statuses.filter((s) => s === 429).length).toBeGreaterThanOrEqual(1);
  });

  it("should use default key (IP) when no keyBy configured", async () => {
    const store = createStore();
    const app = createApp({ max: 1, store });

    const res1 = await app.request("/test", {
      headers: { "x-forwarded-for": "1.2.3.4" },
    });
    expect(res1.status).toBe(200);

    // Same IP should be rate limited
    const res2 = await app.request("/test", {
      headers: { "x-forwarded-for": "1.2.3.4" },
    });
    expect(res2.status).toBe(429);

    // Different IP should pass
    const res3 = await app.request("/test", {
      headers: { "x-forwarded-for": "5.6.7.8" },
    });
    expect(res3.status).toBe(200);
  });

  // --- Security tests ---

  it("should rate limit by X-Forwarded-For when CF-Connecting-IP is absent (spoofable scenario)", async () => {
    const store = createStore();
    const app = createApp({ max: 1, store });

    // First request with one spoofed IP
    const res1 = await app.request("/test", {
      headers: { "x-forwarded-for": "spoofed-1.2.3.4" },
    });
    expect(res1.status).toBe(200);

    // Same spoofed IP should be rate limited
    const res2 = await app.request("/test", {
      headers: { "x-forwarded-for": "spoofed-1.2.3.4" },
    });
    expect(res2.status).toBe(429);

    // DIFFERENT spoofed IP bypasses rate limit - this is expected behavior
    // for the default key extractor.
    const res3 = await app.request("/test", {
      headers: { "x-forwarded-for": "spoofed-5.6.7.8" },
    });
    expect(res3.status).toBe(200);
  });

  it("should prefer CF-Connecting-IP over X-Forwarded-For for key extraction", async () => {
    const store = createStore();
    const app = createApp({ max: 1, store });

    // Send with both headers - CF-Connecting-IP should win
    const res1 = await app.request("/test", {
      headers: {
        "cf-connecting-ip": "real-ip",
        "x-forwarded-for": "spoofed-ip",
      },
    });
    expect(res1.status).toBe(200);

    // Same CF-Connecting-IP should be rate limited regardless of X-Forwarded-For
    const res2 = await app.request("/test", {
      headers: {
        "cf-connecting-ip": "real-ip",
        "x-forwarded-for": "different-spoofed-ip",
      },
    });
    expect(res2.status).toBe(429);
  });

  it("should handle memory exhaustion protection in InMemoryRateLimitStore", async () => {
    // Create a store with a very small max
    const tinyStore = createStore(5);

    // Fill up the store with unique keys
    for (let i = 0; i < 5; i++) {
      await tinyStore.increment(`key-${i}`, 60);
    }

    // Next unique key should trigger protection and return very high count
    const result = await tinyStore.increment("overflow-key", 60);
    expect(result.count).toBe(Number.MAX_SAFE_INTEGER);
  });

  it("should fall back to 'unknown' key when no IP headers present", async () => {
    const store = createStore();
    const app = createApp({ max: 1, store });

    // No IP headers - all requests share the "unknown" bucket
    const res1 = await app.request("/test");
    expect(res1.status).toBe(200);

    const res2 = await app.request("/test");
    expect(res2.status).toBe(429);
  });

  // --- Store failure resilience ---

  it("should fail-open when store.increment() throws", async () => {
    const crashingStore: import("../rate-limit").RateLimitStore = {
      increment: () => {
        throw new Error("store unavailable");
      },
    };
    const app = createApp({ max: 1, store: crashingStore });

    const res = await app.request("/test");

    // Request should succeed (fail-open)
    expect(res.status).toBe(200);
    // No rate-limit headers since we have no counter data
    expect(res.headers.get("x-ratelimit-limit")).toBeNull();
    expect(res.headers.get("x-ratelimit-remaining")).toBeNull();
    expect(res.headers.get("x-ratelimit-reset")).toBeNull();
  });

  it("should fail-open when store.increment() rejects", async () => {
    const crashingStore: import("../rate-limit").RateLimitStore = {
      increment: () => Promise.reject(new Error("connection timeout")),
    };
    const app = createApp({ max: 1, store: crashingStore });

    const res = await app.request("/test");

    expect(res.status).toBe(200);
    expect(res.headers.get("x-ratelimit-limit")).toBeNull();
  });

  it("should still return response body when store crashes", async () => {
    const crashingStore: import("../rate-limit").RateLimitStore = {
      increment: () => {
        throw new Error("boom");
      },
    };
    const app = createApp({ max: 1, store: crashingStore });

    const res = await app.request("/test");

    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toEqual({ ok: true });
  });
});
