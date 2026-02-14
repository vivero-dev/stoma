import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RedisClient } from "../redis";
import {
  RedisCacheStore,
  RedisCircuitBreakerStore,
  RedisRateLimitStore,
  redisAdapter,
} from "../redis";

// ---------------------------------------------------------------------------
// Mock Redis client
// ---------------------------------------------------------------------------

function createMockClient(): RedisClient & {
  _store: Map<string, { value: string; ttl?: number }>;
} {
  const store = new Map<string, { value: string; ttl?: number }>();

  return {
    _store: store,

    async get(key: string) {
      const entry = store.get(key);
      return entry?.value ?? null;
    },

    async set(key: string, value: string, ...args: unknown[]) {
      let ttl: number | undefined;
      // Parse ioredis-style positional args: "EX", seconds
      for (let i = 0; i < args.length; i++) {
        if (
          typeof args[i] === "string" &&
          (args[i] as string).toUpperCase() === "EX"
        ) {
          ttl = args[i + 1] as number;
          break;
        }
      }
      store.set(key, { value, ttl });
      return "OK";
    },

    async del(...keys: string[]) {
      let count = 0;
      for (const k of keys) {
        if (store.delete(k)) count++;
      }
      return count;
    },

    async eval(
      _script: string,
      _numkeys: number,
      ...args: (string | number)[]
    ) {
      // Simulate the rate limit Lua script behavior
      const redisKey = String(args[0]);
      const windowSeconds = Number(args[1]);
      const now = Number(args[2]);

      const existing = store.get(redisKey);
      let count: number;
      let resetAt: number;

      if (existing) {
        const parsed = JSON.parse(existing.value);
        count = parsed.count + 1;
        resetAt = parsed.resetAt;
        store.set(redisKey, {
          value: JSON.stringify({ count, resetAt }),
          ttl: windowSeconds,
        });
      } else {
        count = 1;
        resetAt = now + windowSeconds * 1000;
        store.set(redisKey, {
          value: JSON.stringify({ count, resetAt }),
          ttl: windowSeconds,
        });
      }

      return [count, resetAt];
    },
  };
}

// ---------------------------------------------------------------------------
// Rate Limit Store
// ---------------------------------------------------------------------------

describe("RedisRateLimitStore", () => {
  let client: ReturnType<typeof createMockClient>;
  let store: RedisRateLimitStore;

  beforeEach(() => {
    client = createMockClient();
    store = new RedisRateLimitStore(client, "stoma:");
  });

  it("increments counter for new key", async () => {
    const result = await store.increment("test-key", 60);
    expect(result.count).toBe(1);
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });

  it("increments counter for existing key", async () => {
    await store.increment("test-key", 60);
    const result = await store.increment("test-key", 60);
    expect(result.count).toBe(2);
  });

  it("uses prefixed redis key", async () => {
    await store.increment("my-ip", 60);
    expect(client._store.has("stoma:rl:my-ip")).toBe(true);
  });

  it("tracks multiple keys independently", async () => {
    await store.increment("key-a", 60);
    await store.increment("key-a", 60);
    await store.increment("key-b", 60);

    const a = await store.increment("key-a", 60);
    const b = await store.increment("key-b", 60);

    expect(a.count).toBe(3);
    expect(b.count).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Circuit Breaker Store
// ---------------------------------------------------------------------------

describe("RedisCircuitBreakerStore", () => {
  let client: ReturnType<typeof createMockClient>;
  let store: RedisCircuitBreakerStore;

  beforeEach(() => {
    client = createMockClient();
    store = new RedisCircuitBreakerStore(client, "stoma:", undefined);
  });

  it("returns default closed state for new key", async () => {
    const snap = await store.getState("svc");
    expect(snap.state).toBe("closed");
    expect(snap.failureCount).toBe(0);
    expect(snap.successCount).toBe(0);
  });

  it("records success", async () => {
    const snap = await store.recordSuccess("svc");
    expect(snap.successCount).toBe(1);
  });

  it("records failure", async () => {
    const snap = await store.recordFailure("svc");
    expect(snap.failureCount).toBe(1);
    expect(snap.lastFailureTime).toBeGreaterThan(0);
  });

  it("accumulates failures", async () => {
    await store.recordFailure("svc");
    await store.recordFailure("svc");
    const snap = await store.recordFailure("svc");
    expect(snap.failureCount).toBe(3);
  });

  it("transitions to open", async () => {
    const snap = await store.transition("svc", "open");
    expect(snap.state).toBe("open");
    expect(snap.lastStateChange).toBeGreaterThan(0);
  });

  it("resets counters when transitioning to closed", async () => {
    await store.recordFailure("svc");
    await store.recordFailure("svc");
    const snap = await store.transition("svc", "closed");
    expect(snap.state).toBe("closed");
    expect(snap.failureCount).toBe(0);
    expect(snap.successCount).toBe(0);
  });

  it("resets success count when transitioning to half-open", async () => {
    await store.recordSuccess("svc");
    await store.recordSuccess("svc");
    const snap = await store.transition("svc", "half-open");
    expect(snap.state).toBe("half-open");
    expect(snap.successCount).toBe(0);
  });

  it("fully resets a circuit", async () => {
    await store.recordFailure("svc");
    await store.transition("svc", "open");
    await store.reset("svc");
    const snap = await store.getState("svc");
    expect(snap.state).toBe("closed");
    expect(snap.failureCount).toBe(0);
  });

  it("uses custom setWithTTL", async () => {
    const setWithTTL = vi.fn(async (c, k, v, ttl) => {
      await c.set(k, v, "EX", ttl);
    });
    store = new RedisCircuitBreakerStore(client, "stoma:", setWithTTL);
    await store.recordSuccess("svc");
    expect(setWithTTL).toHaveBeenCalledOnce();
  });

  it("uses prefixed redis key", async () => {
    await store.recordSuccess("my-circuit");
    expect(client._store.has("stoma:cb:my-circuit")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Cache Store
// ---------------------------------------------------------------------------

describe("RedisCacheStore", () => {
  let client: ReturnType<typeof createMockClient>;
  let store: RedisCacheStore;

  beforeEach(() => {
    client = createMockClient();
    store = new RedisCacheStore(client, "stoma:", undefined);
  });

  it("returns null for cache miss", async () => {
    const result = await store.get("missing");
    expect(result).toBeNull();
  });

  it("stores and retrieves a response", async () => {
    const original = new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

    await store.put("test", original, 300);
    const cached = await store.get("test");

    expect(cached).not.toBeNull();
    expect(cached!.status).toBe(200);
    expect(cached!.headers.get("content-type")).toBe("application/json");

    const body = await cached!.json();
    expect(body).toEqual({ ok: true });
  });

  it("stores a response with TTL", async () => {
    const original = new Response("hello", { status: 200 });
    await store.put("ttl-test", original, 60);

    const entry = client._store.get("stoma:cache:ttl-test");
    expect(entry).toBeDefined();
    expect(entry!.ttl).toBe(60);
  });

  it("deletes a cached entry", async () => {
    await store.put("del-test", new Response("x"), 300);
    const deleted = await store.delete("del-test");
    expect(deleted).toBe(true);

    const result = await store.get("del-test");
    expect(result).toBeNull();
  });

  it("returns false when deleting non-existent key", async () => {
    const deleted = await store.delete("nope");
    expect(deleted).toBe(false);
  });

  it("handles 204 no-content responses", async () => {
    const original = new Response(null, { status: 204 });
    await store.put("no-content", original, 300);
    const cached = await store.get("no-content");

    expect(cached).not.toBeNull();
    expect(cached!.status).toBe(204);
    expect(cached!.body).toBeNull();
  });

  it("handles 304 not-modified responses", async () => {
    const original = new Response(null, { status: 304 });
    await store.put("not-modified", original, 300);
    const cached = await store.get("not-modified");

    expect(cached).not.toBeNull();
    expect(cached!.status).toBe(304);
    expect(cached!.body).toBeNull();
  });

  it("preserves multiple headers", async () => {
    const original = new Response("body", {
      status: 200,
      headers: {
        "content-type": "text/plain",
        "x-custom": "value",
        "cache-control": "public",
      },
    });
    await store.put("headers", original, 300);
    const cached = await store.get("headers");

    expect(cached!.headers.get("content-type")).toBe("text/plain");
    expect(cached!.headers.get("x-custom")).toBe("value");
    expect(cached!.headers.get("cache-control")).toBe("public");
  });

  it("returns null for invalid JSON in cache", async () => {
    client._store.set("stoma:cache:bad", { value: "not-json{{{" });
    const result = await store.get("bad");
    expect(result).toBeNull();
  });

  it("uses prefixed redis key", async () => {
    await store.put("my-key", new Response("x"), 300);
    expect(client._store.has("stoma:cache:my-key")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

describe("redisAdapter", () => {
  it("creates adapter with all stores enabled by default", () => {
    const client = createMockClient();
    const adapter = redisAdapter({ client });

    expect(adapter.rateLimitStore).toBeDefined();
    expect(adapter.circuitBreakerStore).toBeDefined();
    expect(adapter.cacheStore).toBeDefined();
  });

  it("disables individual stores", () => {
    const client = createMockClient();
    const adapter = redisAdapter({
      client,
      stores: { rateLimit: false, cache: false },
    });

    expect(adapter.rateLimitStore).toBeUndefined();
    expect(adapter.circuitBreakerStore).toBeDefined();
    expect(adapter.cacheStore).toBeUndefined();
  });

  it("passes waitUntil through", () => {
    const client = createMockClient();
    const waitUntil = vi.fn();
    const adapter = redisAdapter({ client, waitUntil });

    expect(adapter.waitUntil).toBe(waitUntil);
  });

  it("uses custom prefix", async () => {
    const client = createMockClient();
    const adapter = redisAdapter({ client, prefix: "myapp:" });

    await (adapter.rateLimitStore as RedisRateLimitStore).increment("k", 60);
    expect(client._store.has("myapp:rl:k")).toBe(true);
  });

  it("no waitUntil when not provided", () => {
    const client = createMockClient();
    const adapter = redisAdapter({ client });
    expect(adapter.waitUntil).toBeUndefined();
  });
});
