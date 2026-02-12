/**
 * Rate limiting policy with pluggable counter storage.
 *
 * @module rate-limit
 */
import type { Context } from "hono";
import { GatewayError } from "../../core/errors";
import { extractClientIp } from "../../utils/ip";
import type { Policy, PolicyConfig } from "../types";
import { Priority, policyDebug, resolveConfig, safeCall, setDebugHeader, withSkip } from "../sdk";

export interface RateLimitConfig extends PolicyConfig {
  /** Maximum requests per window */
  max: number;
  /** Time window in seconds. Default: 60. */
  windowSeconds?: number;
  /** Key extractor — determines the rate limit bucket. Default: client IP. */
  keyBy?: (c: Context) => string | Promise<string>;
  /** Storage backend for counters */
  store?: RateLimitStore;
  /** Response status code when limited. Default: 429. */
  statusCode?: number;
  /** Custom response body when limited */
  message?: string;
  /** Ordered list of headers to inspect for the client IP (when `keyBy` is not set). Default: `["cf-connecting-ip", "x-forwarded-for"]`. */
  ipHeaders?: string[];
}

/** Pluggable storage backend for rate limit counters */
export interface RateLimitStore {
  /** Increment the counter for a key, returning the new count and TTL */
  increment(key: string, windowSeconds: number): Promise<{ count: number; resetAt: number }>;
  /** Optional: cleanup resources (like intervals) used by the store */
  destroy?(): void;
}

/** Default in-memory rate limit store */
export interface InMemoryRateLimitStoreOptions {
  /** Maximum number of unique keys to prevent memory exhaustion. Default: 100000. */
  maxKeys?: number;
  /** Cleanup interval in ms for expired entries. Default: 60000. */
  cleanupIntervalMs?: number;
}

export class InMemoryRateLimitStore implements RateLimitStore {
  private counters = new Map<string, { count: number; resetAt: number }>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  /** Maximum number of unique keys to prevent memory exhaustion */
  private maxKeys: number;
  private cleanupIntervalMs: number;

  constructor(options?: InMemoryRateLimitStoreOptions | number) {
    // Back-compat: accept a plain number as maxKeys
    if (typeof options === "number") {
      this.maxKeys = options;
      this.cleanupIntervalMs = 60_000;
    } else {
      this.maxKeys = options?.maxKeys ?? 100_000;
      this.cleanupIntervalMs = options?.cleanupIntervalMs ?? 60_000;
    }
  }

  /** Start the periodic cleanup interval on first use (Workers-safe). */
  private ensureCleanupInterval(): void {
    if (this.cleanupInterval) return;
    this.cleanupInterval = setInterval(() => this.cleanup(), this.cleanupIntervalMs);
  }

  async increment(key: string, windowSeconds: number): Promise<{ count: number; resetAt: number }> {
    this.ensureCleanupInterval();
    const now = Date.now();
    const existing = this.counters.get(key);

    if (existing && existing.resetAt > now) {
      existing.count++;
      return { count: existing.count, resetAt: existing.resetAt };
    }

    // Protect against memory exhaustion: if we're at capacity, evict expired
    // entries first. If still at capacity, reject with a high count to
    // trigger rate limiting rather than allowing unbounded memory growth.
    if (this.counters.size >= this.maxKeys && !existing) {
      this.cleanup();
      if (this.counters.size >= this.maxKeys) {
        const resetAt = now + windowSeconds * 1000;
        return { count: Number.MAX_SAFE_INTEGER, resetAt };
      }
    }

    const resetAt = now + windowSeconds * 1000;
    const entry = { count: 1, resetAt };
    this.counters.set(key, entry);
    return { count: 1, resetAt };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.counters) {
      if (entry.resetAt <= now) {
        this.counters.delete(key);
      }
    }
  }

  /** Stop the cleanup interval (for testing) */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /** Reset all counters (for testing) */
  reset(): void {
    this.counters.clear();
  }
}

/**
 * Rate limit requests with pluggable storage backends.
 *
 * Defaults to client IP extraction via `CF-Connecting-IP` or `X-Forwarded-For`.
 * Sets standard `X-RateLimit-*` response headers on every request and
 * throws a 429 when the limit is exceeded.
 *
 * @param config - Rate limit settings. `max` is required; other fields have sensible defaults.
 * @returns A {@link Policy} at priority 20 (runs after auth).
 *
 * @example
 * ```ts
 * // 100 requests per minute per IP (in-memory)
 * rateLimit({ max: 100 });
 *
 * // Custom key + Cloudflare KV store
 * rateLimit({
 *   max: 50,
 *   windowSeconds: 300,
 *   keyBy: (c) => c.req.header("x-user-id") ?? "anonymous",
 *   store: new KVRateLimitStore(env.RATE_LIMIT_KV),
 * });
 * ```
 */
export function rateLimit(config: RateLimitConfig): Policy {
  const resolved = resolveConfig<RateLimitConfig>(
    { windowSeconds: 60, statusCode: 429, message: "Rate limit exceeded" },
    config,
  );

  // Default store used ONLY if none provided.
  // We don't create it here at module-level to avoid starting timers
  // immediately upon import in testing environments.
  let defaultStore: InMemoryRateLimitStore | undefined;

  const handler: import("hono").MiddlewareHandler = async (c, next) => {
    const debug = policyDebug(c, "rate-limit");

    const resolvedStore = config.store ?? (defaultStore ??= new InMemoryRateLimitStore());

    // Extract the rate limit key
    let key: string;
    if (config.keyBy) {
      key = await config.keyBy(c);
    } else {
      key = extractClientIp(c.req.raw.headers, config.ipHeaders);
    }

    // Resilient to store failures — fail-open (allow the request) if the
    // store is unreachable, but skip rate-limit headers since we have no data.
    const result = await safeCall(
      () => resolvedStore.increment(key, resolved.windowSeconds!),
      null,
      debug,
      "store.increment()",
    );

    if (!result) {
      debug(`store unavailable, failing open (key=${key})`);
      await next();
      return;
    }

    const { count, resetAt } = result;
    const remaining = Math.max(0, config.max - count);
    const resetSeconds = Math.ceil((resetAt - Date.now()) / 1000);
    setDebugHeader(c, "x-stoma-ratelimit-key", key);
    setDebugHeader(c, "x-stoma-ratelimit-window", resolved.windowSeconds!);

    if (count > config.max) {
      debug(`limited (key=${key}, count=${count}, max=${config.max})`);
      const resetHeader = String(resetSeconds);
      throw new GatewayError(resolved.statusCode!, "rate_limited", resolved.message!, {
        "x-ratelimit-limit": String(config.max),
        "x-ratelimit-remaining": "0",
        "x-ratelimit-reset": resetHeader,
        "retry-after": resetHeader,
      });
    }

    await next();

    // Set rate limit headers on the response AFTER downstream runs,
    // so they're applied even when handlers return raw Response objects
    c.res.headers.set("x-ratelimit-limit", String(config.max));
    c.res.headers.set("x-ratelimit-remaining", String(remaining));
    c.res.headers.set("x-ratelimit-reset", String(resetSeconds));
  };

  return {
    name: "rate-limit",
    priority: Priority.RATE_LIMIT,
    handler: withSkip(config.skip, handler),
  };
}
