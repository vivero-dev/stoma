import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PostgresClient } from "../postgres";
import {
  POSTGRES_SCHEMA_SQL,
  PostgresCacheStore,
  PostgresCircuitBreakerStore,
  PostgresRateLimitStore,
  postgresAdapter,
} from "../postgres";

// ---------------------------------------------------------------------------
// Mock Postgres client
// ---------------------------------------------------------------------------

type Row = Record<string, unknown>;

/**
 * Minimal in-memory Postgres mock that simulates the SQL operations
 * used by the stoma Postgres stores. Parses query patterns and
 * maintains state in Maps.
 */
function createMockClient(): PostgresClient & {
  _rateLimits: Map<string, { count: number; reset_at: number }>;
  _circuitBreakers: Map<string, Row>;
  _cache: Map<string, Row>;
} {
  const rateLimits = new Map<string, { count: number; reset_at: number }>();
  const circuitBreakers = new Map<string, Row>();
  const cache = new Map<string, Row>();

  return {
    _rateLimits: rateLimits,
    _circuitBreakers: circuitBreakers,
    _cache: cache,

    async query(text: string, params?: unknown[]): Promise<{ rows: Row[] }> {
      const p = params ?? [];

      // --- Rate Limits ---
      if (text.includes("stoma_rate_limits") && text.includes("INSERT")) {
        const key = p[0] as string;
        const newResetAt = Number(p[1]);
        const now = Number(p[2]);

        const existing = rateLimits.get(key);
        if (existing) {
          if (existing.reset_at <= now) {
            // Window expired - reset
            const entry = { count: 1, reset_at: newResetAt };
            rateLimits.set(key, entry);
            return { rows: [entry] };
          }
          // Increment
          existing.count++;
          return {
            rows: [{ count: existing.count, reset_at: existing.reset_at }],
          };
        }
        // New entry
        const entry = { count: 1, reset_at: newResetAt };
        rateLimits.set(key, entry);
        return { rows: [entry] };
      }

      if (text.includes("stoma_rate_limits") && text.includes("DELETE")) {
        const now = Number(p[0]);
        for (const [k, v] of rateLimits) {
          if (v.reset_at <= now) rateLimits.delete(k);
        }
        return { rows: [] };
      }

      // --- Circuit Breakers ---
      if (text.includes("stoma_circuit_breakers") && text.includes("SELECT")) {
        const key = p[0] as string;
        const row = circuitBreakers.get(key);
        return { rows: row ? [row] : [] };
      }

      if (
        text.includes("stoma_circuit_breakers") &&
        text.includes("INSERT") &&
        text.includes("success_count + 1")
      ) {
        const key = p[0] as string;
        const now = Number(p[1]);
        const existing = circuitBreakers.get(key);
        if (existing) {
          existing.success_count = Number(existing.success_count) + 1;
          return { rows: [{ ...existing }] };
        }
        const row: Row = {
          state: "closed",
          failure_count: 0,
          success_count: 1,
          last_failure_time: 0,
          last_state_change: now,
        };
        circuitBreakers.set(key, row);
        return { rows: [{ ...row }] };
      }

      if (
        text.includes("stoma_circuit_breakers") &&
        text.includes("INSERT") &&
        text.includes("failure_count") &&
        text.includes("+ 1")
      ) {
        const key = p[0] as string;
        const now = Number(p[1]);
        const existing = circuitBreakers.get(key);
        if (existing) {
          existing.failure_count = Number(existing.failure_count) + 1;
          existing.last_failure_time = now;
          return { rows: [{ ...existing }] };
        }
        const row: Row = {
          state: "closed",
          failure_count: 1,
          success_count: 0,
          last_failure_time: now,
          last_state_change: now,
        };
        circuitBreakers.set(key, row);
        return { rows: [{ ...row }] };
      }

      if (
        text.includes("stoma_circuit_breakers") &&
        text.includes("INSERT") &&
        text.includes("state = $2")
      ) {
        // Transition
        const key = p[0] as string;
        const toState = p[1] as string;
        const now = Number(p[2]);
        const existing = circuitBreakers.get(key);

        let row: Row;
        if (existing) {
          existing.state = toState;
          existing.last_state_change = now;
          if (toState === "closed") {
            existing.failure_count = 0;
            existing.success_count = 0;
          }
          if (toState === "half-open") {
            existing.success_count = 0;
          }
          row = { ...existing };
        } else {
          row = {
            state: toState,
            failure_count: 0,
            success_count: 0,
            last_failure_time: 0,
            last_state_change: now,
          };
          circuitBreakers.set(key, { ...row });
        }
        return { rows: [row] };
      }

      if (text.includes("stoma_circuit_breakers") && text.includes("DELETE")) {
        const key = p[0] as string;
        circuitBreakers.delete(key);
        return { rows: [] };
      }

      // --- Cache ---
      if (text.includes("stoma_cache") && text.includes("SELECT")) {
        const key = p[0] as string;
        const now = Number(p[1]);
        const row = cache.get(key);
        if (!row || Number(row.expires_at) <= now) {
          return { rows: [] };
        }
        return { rows: [row] };
      }

      if (text.includes("stoma_cache") && text.includes("INSERT")) {
        const key = p[0] as string;
        const row: Row = {
          key,
          status: p[1],
          headers: p[2],
          body: p[3],
          expires_at: p[4],
        };
        cache.set(key, row);
        return { rows: [row] };
      }

      if (
        text.includes("stoma_cache") &&
        text.includes("DELETE") &&
        text.includes("key = $1")
      ) {
        const key = p[0] as string;
        const existed = cache.has(key);
        cache.delete(key);
        return { rows: existed ? [{ key }] : [] };
      }

      if (
        text.includes("stoma_cache") &&
        text.includes("DELETE") &&
        text.includes("expires_at")
      ) {
        const now = Number(p[0]);
        for (const [k, v] of cache) {
          if (Number(v.expires_at) <= now) cache.delete(k);
        }
        return { rows: [] };
      }

      return { rows: [] };
    },
  };
}

// ---------------------------------------------------------------------------
// Rate Limit Store
// ---------------------------------------------------------------------------

describe("PostgresRateLimitStore", () => {
  let client: ReturnType<typeof createMockClient>;
  let store: PostgresRateLimitStore;

  beforeEach(() => {
    client = createMockClient();
    store = new PostgresRateLimitStore(client, "stoma_rate_limits");
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

  it("resets counter when window expires", async () => {
    // Set an entry with an expired reset_at
    client._rateLimits.set("expired", {
      count: 10,
      reset_at: Date.now() - 1000,
    });
    const result = await store.increment("expired", 60);
    expect(result.count).toBe(1);
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

  it("cleanup removes expired entries", async () => {
    client._rateLimits.set("old", { count: 5, reset_at: Date.now() - 1000 });
    client._rateLimits.set("fresh", { count: 1, reset_at: Date.now() + 60000 });

    await store.cleanup();

    expect(client._rateLimits.has("old")).toBe(false);
    expect(client._rateLimits.has("fresh")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Circuit Breaker Store
// ---------------------------------------------------------------------------

describe("PostgresCircuitBreakerStore", () => {
  let client: ReturnType<typeof createMockClient>;
  let store: PostgresCircuitBreakerStore;

  beforeEach(() => {
    client = createMockClient();
    store = new PostgresCircuitBreakerStore(client, "stoma_circuit_breakers");
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
});

// ---------------------------------------------------------------------------
// Cache Store
// ---------------------------------------------------------------------------

describe("PostgresCacheStore", () => {
  let client: ReturnType<typeof createMockClient>;
  let store: PostgresCacheStore;

  beforeEach(() => {
    client = createMockClient();
    store = new PostgresCacheStore(client, "stoma_cache");
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

  it("returns null for expired entries", async () => {
    const original = new Response("old");
    await store.put("expired", original, 300);

    // Manually expire the entry
    const entry = client._cache.get("expired")!;
    entry.expires_at = Date.now() - 1000;

    const result = await store.get("expired");
    expect(result).toBeNull();
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

  it("overwrites existing cache entry", async () => {
    await store.put("overwrite", new Response("v1"), 300);
    await store.put("overwrite", new Response("v2"), 300);

    const cached = await store.get("overwrite");
    const text = await cached!.text();
    expect(text).toBe("v2");
  });

  it("cleanup removes expired entries", async () => {
    await store.put("fresh", new Response("ok"), 300);
    await store.put("stale", new Response("old"), 300);

    // Manually expire one entry
    const entry = client._cache.get("stale")!;
    entry.expires_at = Date.now() - 1000;

    await store.cleanup();

    expect(client._cache.has("fresh")).toBe(true);
    expect(client._cache.has("stale")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Schema SQL
// ---------------------------------------------------------------------------

describe("POSTGRES_SCHEMA_SQL", () => {
  it("is a non-empty string", () => {
    expect(typeof POSTGRES_SCHEMA_SQL).toBe("string");
    expect(POSTGRES_SCHEMA_SQL.length).toBeGreaterThan(0);
  });

  it("contains CREATE TABLE for all three tables", () => {
    expect(POSTGRES_SCHEMA_SQL).toContain("stoma_rate_limits");
    expect(POSTGRES_SCHEMA_SQL).toContain("stoma_circuit_breakers");
    expect(POSTGRES_SCHEMA_SQL).toContain("stoma_cache");
  });

  it("uses IF NOT EXISTS", () => {
    expect(POSTGRES_SCHEMA_SQL).toContain("IF NOT EXISTS");
  });
});

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

describe("postgresAdapter", () => {
  it("creates adapter with all stores enabled by default", () => {
    const client = createMockClient();
    const adapter = postgresAdapter({ client });

    expect(adapter.rateLimitStore).toBeDefined();
    expect(adapter.circuitBreakerStore).toBeDefined();
    expect(adapter.cacheStore).toBeDefined();
  });

  it("disables individual stores", () => {
    const client = createMockClient();
    const adapter = postgresAdapter({
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
    const adapter = postgresAdapter({ client, waitUntil });

    expect(adapter.waitUntil).toBe(waitUntil);
  });

  it("uses custom table prefix", () => {
    const client = createMockClient();
    const adapter = postgresAdapter({ client, tablePrefix: "myapp_" });

    // Store instances are created - we can verify they exist
    expect(adapter.rateLimitStore).toBeDefined();
    expect(adapter.circuitBreakerStore).toBeDefined();
    expect(adapter.cacheStore).toBeDefined();
  });

  it("no waitUntil when not provided", () => {
    const client = createMockClient();
    const adapter = postgresAdapter({ client });
    expect(adapter.waitUntil).toBeUndefined();
  });
});
