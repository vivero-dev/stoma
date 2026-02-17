/**
 * Redis-backed adapter for stoma - production-ready stores for Node.js, Bun, and Deno.
 *
 * Zero dependencies: define a minimal {@link RedisClient} interface that any Redis
 * library (ioredis, node-redis, etc.) satisfies, then pass it to {@link redisAdapter}.
 *
 * @module adapters/redis
 */
import type {
  CircuitBreakerSnapshot,
  CircuitBreakerStore,
  CircuitState,
} from "../policies/resilience/circuit-breaker";
import type { CacheStore } from "../policies/traffic/cache";
import type { RateLimitStore } from "../policies/traffic/rate-limit";
import type { GatewayAdapter } from "./types";

// ---------------------------------------------------------------------------
// Client interface
// ---------------------------------------------------------------------------

/**
 * Minimal Redis client interface - satisfied by ioredis, node-redis v4, and most
 * Redis libraries. Only the methods stoma actually calls are required.
 */
export interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ...args: unknown[]): Promise<unknown>;
  del(...keys: string[]): Promise<number>;
  eval(
    script: string,
    numkeys: number,
    ...args: (string | number)[]
  ): Promise<unknown>;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface RedisAdapterConfig {
  /** Redis client instance (ioredis, node-redis, etc.). */
  client: RedisClient;
  /** Key prefix for all Redis keys. Default: `"stoma:"`. */
  prefix?: string;
  /**
   * Override for SET-with-TTL. Default uses ioredis-style `client.set(key, value, "EX", ttl)`.
   *
   * For node-redis v4:
   * ```ts
   * (c, k, v, ttl) => c.set(k, v, { EX: ttl } as any)
   * ```
   */
  setWithTTL?: (
    client: RedisClient,
    key: string,
    value: string,
    ttlSeconds: number
  ) => Promise<unknown>;
  /** Selectively enable/disable individual stores. All enabled by default. */
  stores?: {
    rateLimit?: boolean;
    circuitBreaker?: boolean;
    cache?: boolean;
  };
  /** Schedule background work that outlives the response. */
  waitUntil?: (promise: Promise<unknown>) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Default SET-with-TTL using ioredis-style positional args. */
function defaultSetWithTTL(
  client: RedisClient,
  key: string,
  value: string,
  ttlSeconds: number
): Promise<unknown> {
  return client.set(key, value, "EX", ttlSeconds);
}

// Per HTTP spec, 204 and 304 responses must not carry a body.
const NULL_BODY_STATUSES = new Set([204, 304]);
function safeBody(
  body: BodyInit | null | undefined,
  status: number
): BodyInit | null {
  return NULL_BODY_STATUSES.has(status) ? null : (body ?? null);
}

/** Encode a Uint8Array to base64 string (no Node Buffer dependency). */
function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** Decode a base64 string to Uint8Array (no Node Buffer dependency). */
function base64ToUint8(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ---------------------------------------------------------------------------
// Rate Limit Store
// ---------------------------------------------------------------------------

/**
 * Atomic rate limit counter using a Lua script.
 *
 * The script does `INCR` + conditional `EXPIRE` in a single round trip,
 * eliminating race conditions between reads and writes.
 */
const RATE_LIMIT_LUA = `
local key = KEYS[1]
local window = tonumber(ARGV[1])
local now = tonumber(ARGV[2])

local count = redis.call("INCR", key)
if count == 1 then
  redis.call("EXPIRE", key, window)
end

local ttl = redis.call("TTL", key)
local resetAt = now + (ttl * 1000)

return {count, resetAt}
`;

/** Rate limit store backed by Redis with atomic Lua script. */
export class RedisRateLimitStore implements RateLimitStore {
  constructor(
    private client: RedisClient,
    private prefix: string
  ) {}

  async increment(
    key: string,
    windowSeconds: number
  ): Promise<{ count: number; resetAt: number }> {
    const redisKey = `${this.prefix}rl:${key}`;
    const now = Date.now();

    const result = (await this.client.eval(
      RATE_LIMIT_LUA,
      1,
      redisKey,
      windowSeconds,
      now
    )) as [number, number];

    return { count: result[0], resetAt: result[1] };
  }
}

// ---------------------------------------------------------------------------
// Circuit Breaker Store
// ---------------------------------------------------------------------------

interface CircuitBreakerEntry {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime: number;
  lastStateChange: number;
}

function defaultEntry(): CircuitBreakerEntry {
  return {
    state: "closed",
    failureCount: 0,
    successCount: 0,
    lastFailureTime: 0,
    lastStateChange: Date.now(),
  };
}

/** Circuit breaker state store backed by Redis JSON strings. */
export class RedisCircuitBreakerStore implements CircuitBreakerStore {
  constructor(
    private client: RedisClient,
    private prefix: string,
    private setWithTTL: RedisAdapterConfig["setWithTTL"]
  ) {}

  private key(k: string): string {
    return `${this.prefix}cb:${k}`;
  }

  /** Circuit breaker entries don't expire, but we set a generous TTL to avoid
   *  zombie keys if a circuit is never referenced again. 24 hours. */
  private static readonly TTL = 86400;

  private async load(key: string): Promise<CircuitBreakerEntry> {
    const raw = await this.client.get(this.key(key));
    if (!raw) return defaultEntry();
    try {
      return JSON.parse(raw) as CircuitBreakerEntry;
    } catch {
      return defaultEntry();
    }
  }

  private async save(key: string, entry: CircuitBreakerEntry): Promise<void> {
    const setter = this.setWithTTL ?? defaultSetWithTTL;
    await setter(
      this.client,
      this.key(key),
      JSON.stringify(entry),
      RedisCircuitBreakerStore.TTL
    );
  }

  async getState(key: string): Promise<CircuitBreakerSnapshot> {
    return { ...(await this.load(key)) };
  }

  async recordSuccess(key: string): Promise<CircuitBreakerSnapshot> {
    const entry = await this.load(key);
    entry.successCount++;
    await this.save(key, entry);
    return { ...entry };
  }

  async recordFailure(key: string): Promise<CircuitBreakerSnapshot> {
    const entry = await this.load(key);
    entry.failureCount++;
    entry.lastFailureTime = Date.now();
    await this.save(key, entry);
    return { ...entry };
  }

  async transition(
    key: string,
    to: CircuitState
  ): Promise<CircuitBreakerSnapshot> {
    const entry = await this.load(key);
    entry.state = to;
    entry.lastStateChange = Date.now();
    if (to === "closed") {
      entry.failureCount = 0;
      entry.successCount = 0;
    }
    if (to === "half-open") {
      entry.successCount = 0;
    }
    await this.save(key, entry);
    return { ...entry };
  }

  async reset(key: string): Promise<void> {
    await this.client.del(this.key(key));
  }
}

// ---------------------------------------------------------------------------
// Cache Store
// ---------------------------------------------------------------------------

interface CacheEnvelope {
  status: number;
  headers: [string, string][];
  body: string; // base64-encoded
}

/** Response cache backed by Redis with base64-encoded body and TTL-based expiry. */
export class RedisCacheStore implements CacheStore {
  constructor(
    private client: RedisClient,
    private prefix: string,
    private setWithTTL: RedisAdapterConfig["setWithTTL"]
  ) {}

  private key(k: string): string {
    return `${this.prefix}cache:${k}`;
  }

  async get(key: string): Promise<Response | null> {
    const raw = await this.client.get(this.key(key));
    if (!raw) return null;

    let envelope: CacheEnvelope;
    try {
      envelope = JSON.parse(raw) as CacheEnvelope;
    } catch {
      return null;
    }

    const body = base64ToUint8(envelope.body);
    return new Response(safeBody(body, envelope.status), {
      status: envelope.status,
      headers: envelope.headers,
    });
  }

  async put(
    key: string,
    response: Response,
    ttlSeconds: number
  ): Promise<void> {
    const body = new Uint8Array(await response.arrayBuffer());
    const headers: [string, string][] = [];
    response.headers.forEach((value, name) => {
      headers.push([name, value]);
    });

    const envelope: CacheEnvelope = {
      status: response.status,
      headers,
      body: uint8ToBase64(body),
    };

    const setter = this.setWithTTL ?? defaultSetWithTTL;
    await setter(
      this.client,
      this.key(key),
      JSON.stringify(envelope),
      ttlSeconds
    );
  }

  async delete(key: string): Promise<boolean> {
    const count = await this.client.del(this.key(key));
    return count > 0;
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a {@link GatewayAdapter} using Redis-backed stores.
 *
 * @example
 * ```ts
 * import Redis from "ioredis";
 * import { redisAdapter } from "@homegrower-club/stoma/adapters/redis";
 *
 * const redis = new Redis();
 * const adapter = redisAdapter({ client: redis });
 *
 * createGateway({ adapter, ... });
 * ```
 *
 * @example
 * ```ts
 * // node-redis v4 (different SET signature)
 * import { createClient } from "redis";
 * import { redisAdapter } from "@homegrower-club/stoma/adapters/redis";
 *
 * const client = await createClient().connect();
 * const adapter = redisAdapter({
 *   client: client as any,
 *   setWithTTL: (c, k, v, ttl) => c.set(k, v, "EX", ttl),
 * });
 * ```
 */
export function redisAdapter(config: RedisAdapterConfig): GatewayAdapter {
  const prefix = config.prefix ?? "stoma:";
  const stores = config.stores ?? {};
  const setWithTTL = config.setWithTTL;

  return {
    rateLimitStore:
      stores.rateLimit !== false
        ? new RedisRateLimitStore(config.client, prefix)
        : undefined,
    circuitBreakerStore:
      stores.circuitBreaker !== false
        ? new RedisCircuitBreakerStore(config.client, prefix, setWithTTL)
        : undefined,
    cacheStore:
      stores.cache !== false
        ? new RedisCacheStore(config.client, prefix, setWithTTL)
        : undefined,
    waitUntil: config.waitUntil,
  };
}
