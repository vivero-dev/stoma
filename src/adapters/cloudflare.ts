import { InMemoryCircuitBreakerStore } from "../policies/resilience/circuit-breaker";
import type { CacheStore } from "../policies/traffic/cache";
import type { RateLimitStore } from "../policies/traffic/rate-limit";
import { DurableObjectRateLimitStore } from "./durable-object";
import type { GatewayAdapter } from "./types";

// ---------------------------------------------------------------------------
// KV-backed rate limit store
// ---------------------------------------------------------------------------

/** Rate limit store backed by Cloudflare Workers KV. */
export class KVRateLimitStore implements RateLimitStore {
  constructor(private kv: KVNamespace) {}

  async increment(
    key: string,
    windowSeconds: number
  ): Promise<{ count: number; resetAt: number }> {
    const now = Date.now();
    const raw = (await this.kv.get(key, "json")) as {
      count: number;
      resetAt: number;
    } | null;

    if (raw && raw.resetAt > now) {
      const updated = { count: raw.count + 1, resetAt: raw.resetAt };
      const ttl = Math.max(1, Math.ceil((raw.resetAt - now) / 1000));
      await this.kv.put(key, JSON.stringify(updated), { expirationTtl: ttl });
      return updated;
    }

    const resetAt = now + windowSeconds * 1000;
    const entry = { count: 1, resetAt };
    await this.kv.put(key, JSON.stringify(entry), {
      expirationTtl: windowSeconds,
    });
    return entry;
  }
}

// ---------------------------------------------------------------------------
// Cache API-backed cache store
// ---------------------------------------------------------------------------

const DEFAULT_CACHE_ORIGIN = "https://stoma.internal";

/** Response cache backed by the Cloudflare Cache API. */
export class CacheApiCacheStore implements CacheStore {
  private cache: Cache;
  private origin: string;

  /**
   * @param cache - A `Cache` instance (e.g. `caches.default`). Falls back to `caches.default` when omitted.
   * @param origin - Synthetic origin used to construct cache keys. Default: `"https://edge-gateway.internal"`.
   */
  constructor(cache?: Cache, origin?: string) {
    // Default to caches.default when available, otherwise accept injected cache
    this.cache = cache ?? (caches as unknown as { default: Cache }).default;
    this.origin = origin ?? DEFAULT_CACHE_ORIGIN;
  }

  async get(key: string): Promise<Response | null> {
    const cacheKey = new Request(`${this.origin}/${encodeURIComponent(key)}`);
    const match = await this.cache.match(cacheKey);
    return match ?? null;
  }

  async put(
    key: string,
    response: Response,
    ttlSeconds: number
  ): Promise<void> {
    const cacheKey = new Request(`${this.origin}/${encodeURIComponent(key)}`);
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", `s-maxage=${ttlSeconds}`);
    const body = await response.arrayBuffer();
    const cached = new Response(body, {
      status: response.status,
      headers,
    });
    await this.cache.put(cacheKey, cached);
  }

  async delete(key: string): Promise<boolean> {
    const cacheKey = new Request(`${this.origin}/${encodeURIComponent(key)}`);
    return this.cache.delete(cacheKey);
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export interface CloudflareAdapterBindings {
  rateLimitKv?: KVNamespace;
  rateLimitDo?: DurableObjectNamespace;
  cache?: Cache;
  /** Synthetic origin used for Cache API cache keys. Default: `"https://edge-gateway.internal"`. */
  cacheOrigin?: string;
  /** Workers `ExecutionContext` - enables `waitUntil` for background work (e.g. traffic shadow). */
  executionCtx?: ExecutionContext;
  /** Workers `env` object - enables `dispatchBinding` for service binding dispatch via the adapter. */
  env?: Record<string, unknown>;
}

/**
 * Create a GatewayAdapter using Cloudflare-native stores.
 *
 * Rate limiting priority: Durable Objects (strongly consistent) > KV (eventually consistent) > none.
 *
 * Pass `executionCtx` to enable `waitUntil` (for traffic shadow and other background work).
 * Pass `env` to enable `dispatchBinding` (for service binding dispatch via the adapter).
 */
export function cloudflareAdapter(
  bindings: CloudflareAdapterBindings
): GatewayAdapter {
  let rateLimitStore: RateLimitStore | undefined;
  if (bindings.rateLimitDo) {
    rateLimitStore = new DurableObjectRateLimitStore(bindings.rateLimitDo);
  } else if (bindings.rateLimitKv) {
    rateLimitStore = new KVRateLimitStore(bindings.rateLimitKv);
  }

  return {
    rateLimitStore,
    circuitBreakerStore: new InMemoryCircuitBreakerStore(),
    cacheStore: bindings.cache
      ? new CacheApiCacheStore(bindings.cache, bindings.cacheOrigin)
      : new CacheApiCacheStore(undefined, bindings.cacheOrigin),
    waitUntil: bindings.executionCtx
      ? (p) => bindings.executionCtx!.waitUntil(p)
      : undefined,
    dispatchBinding: bindings.env
      ? async (service, request) => {
          const binding = bindings.env![service] as
            | { fetch: typeof fetch }
            | undefined;
          if (!binding || typeof binding.fetch !== "function") {
            throw new Error(
              `Service binding "${service}" is not available in the Worker environment`
            );
          }
          return binding.fetch(request);
        }
      : undefined,
  };
}
