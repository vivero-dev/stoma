/**
 * Response caching policy with pluggable storage backends.
 *
 * @module cache
 */
import type { Context } from "hono";
import {
  Priority,
  policyDebug,
  policyTrace,
  resolveConfig,
  safeCall,
  setDebugHeader,
  withSkip,
} from "../sdk";
import type { Policy, PolicyConfig } from "../types";

// Per HTTP spec, 204 and 304 responses must not carry a body.
// Node.js enforces this strictly; workerd is lenient. Guard all
// Response reconstruction so we don't silently break on Node/Bun/Deno.
const NULL_BODY_STATUSES = new Set([204, 304]);
function safeBody(
  body: BodyInit | null | undefined,
  status: number
): BodyInit | null {
  return NULL_BODY_STATUSES.has(status) ? null : (body ?? null);
}

// --- Store interface ---

/** Pluggable cache storage backend */
export interface CacheStore {
  /** Retrieve a cached response by key. Returns null on miss. */
  get(key: string): Promise<Response | null>;
  /** Store a response under key with a TTL in seconds. */
  put(key: string, response: Response, ttlSeconds: number): Promise<void>;
  /** Delete a cached entry. Returns true if something was removed. */
  delete(key: string): Promise<boolean>;
  /** Optional cleanup - clear expired entries, release resources. */
  destroy?(): void;
}

// --- In-memory default ---

interface CacheEntry {
  body: ArrayBuffer;
  status: number;
  headers: [string, string][];
  expiresAt: number;
}

/** Options for the in-memory cache store. */
export interface InMemoryCacheStoreOptions {
  /** Maximum number of cached entries. When exceeded, the oldest entry is evicted (LRU). */
  maxEntries?: number;
}

export class InMemoryCacheStore implements CacheStore {
  private entries = new Map<string, CacheEntry>();
  private maxEntries: number | undefined;

  constructor(options?: InMemoryCacheStoreOptions) {
    this.maxEntries = options?.maxEntries;
  }

  async get(key: string): Promise<Response | null> {
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.entries.delete(key);
      return null;
    }
    // Move to end for LRU ordering (most recently accessed = last)
    this.entries.delete(key);
    this.entries.set(key, entry);
    return new Response(safeBody(entry.body, entry.status), {
      status: entry.status,
      headers: entry.headers,
    });
  }

  async put(
    key: string,
    response: Response,
    ttlSeconds: number
  ): Promise<void> {
    const body = await response.arrayBuffer();
    const headers: [string, string][] = [];
    response.headers.forEach((value, name) => {
      headers.push([name, value]);
    });

    // Evict oldest entry (first key in Map iteration order) when at capacity
    if (
      this.maxEntries &&
      !this.entries.has(key) &&
      this.entries.size >= this.maxEntries
    ) {
      const oldestKey = this.entries.keys().next().value;
      if (oldestKey !== undefined) {
        this.entries.delete(oldestKey);
      }
    }

    this.entries.set(key, {
      body,
      status: response.status,
      headers,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async delete(key: string): Promise<boolean> {
    return this.entries.delete(key);
  }

  /** Remove all entries (for testing) */
  clear(): void {
    this.entries.clear();
  }

  /** Current number of entries (for testing/inspection) */
  get size(): number {
    return this.entries.size;
  }

  /** Release all cached entries. */
  destroy(): void {
    this.entries.clear();
  }
}

// --- Helpers ---

/** Internal header embedded in cached responses to track expiry time. Stripped before serving. */
const INTERNAL_EXPIRES_HEADER = "x-stoma-internal-expires-at";

/** Methods that typically carry a request body. */
const BODY_METHODS = new Set(["POST", "PUT", "PATCH"]);

/**
 * Parse Cache-Control into individual directive names (lowercase, no values).
 *
 * `"public, max-age=3600, no-store"` → `["public", "max-age", "no-store"]`
 */
function parseCacheControlDirectives(header: string): string[] {
  if (!header) return [];
  return header
    .split(",")
    .map((part) => part.trim().split("=")[0].trim().toLowerCase());
}

// --- Policy ---

export interface CacheConfig extends PolicyConfig {
  /** Cache TTL in seconds. Default: 300. */
  ttlSeconds?: number;
  /** HTTP methods to cache. Default: ["GET"]. Case-insensitive. */
  methods?: string[];
  /** Custom cache key builder. Supports async for body-based keys. Default: method + url (+ body hash for POST/PUT/PATCH). */
  cacheKeyFn?: (c: Context) => string | Promise<string>;
  /** Only cache responses with these status codes. When set, responses with other statuses are not cached (5xx is always excluded regardless). */
  cacheableStatuses?: number[];
  /** Vary cache key on these request headers. */
  varyHeaders?: string[];
  /** Storage backend. Default: InMemoryCacheStore. */
  store?: CacheStore;
  /** Respect upstream Cache-Control directives. Default: true. */
  respectCacheControl?: boolean;
  /** Response header name for cache status (HIT/MISS/BYPASS/SKIP). Default: `"x-cache"`. */
  cacheStatusHeader?: string;
  /** Cache-Control directives that trigger a bypass. Matched at the directive level, not substring. Default: `["no-store", "no-cache"]`. */
  bypassDirectives?: string[];
}

/**
 * Cache upstream responses to reduce latency and load.
 *
 * Sets a cache status header on **every** response:
 * - `HIT` - served from cache
 * - `MISS` - fetched from upstream, now cached
 * - `BYPASS` - upstream Cache-Control directive prevented caching
 * - `SKIP` - not eligible for caching (wrong method or server error status)
 *
 * Server error responses (5xx) are never cached. Store failures degrade
 * gracefully via {@link safeCall} - a broken cache store never crashes the
 * request.
 *
 * For methods with a request body (POST, PUT, PATCH), the default cache key
 * includes a SHA-256 hash of the body to prevent key collisions across
 * different payloads.
 *
 * @param config - Cache TTL, storage backend, and key strategy. All fields optional.
 * @returns A {@link Policy} at priority 40.
 *
 * @example
 * ```ts
 * // Simple 5-minute in-memory cache for GET requests
 * cache({ ttlSeconds: 300 });
 *
 * // Cache with Vary on Accept-Language and custom store
 * cache({
 *   ttlSeconds: 600,
 *   varyHeaders: ["accept-language"],
 *   store: new CacheApiCacheStore(caches.default),
 * });
 * ```
 */
export function cache(config?: CacheConfig): Policy {
  const resolved = resolveConfig<CacheConfig>(
    {
      ttlSeconds: 300,
      methods: ["GET"],
      respectCacheControl: true,
      cacheStatusHeader: "x-cache",
      bypassDirectives: ["no-store", "no-cache"],
    },
    config
  );

  // Normalize methods to uppercase for case-insensitive matching
  const normalizedMethods = resolved.methods!.map((m) => m.toUpperCase());

  let store = config?.store;
  if (!store) {
    store = new InMemoryCacheStore();
  }
  const resolvedStore = store;

  const statusHeader = resolved.cacheStatusHeader!;

  async function buildKey(c: Context): Promise<string> {
    if (config?.cacheKeyFn) return await config.cacheKeyFn(c);

    let key = `${c.req.method}:${c.req.url}`;

    // Include body hash for methods that carry a body
    if (BODY_METHODS.has(c.req.method.toUpperCase())) {
      try {
        const bodyText = await c.req.raw.clone().text();
        if (bodyText) {
          const hashBuffer = await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(bodyText)
          );
          const hashArray = new Uint8Array(hashBuffer);
          let hashHex = "";
          for (const b of hashArray) {
            hashHex += b.toString(16).padStart(2, "0");
          }
          key += `|body:${hashHex}`;
        }
      } catch {
        // Body already consumed or unreadable - use URL-only key
      }
    }

    if (config?.varyHeaders) {
      const vary = config.varyHeaders
        .map((h) => c.req.header(h) ?? "")
        .join("|");
      key += `|vary:${vary}`;
    }
    return key;
  }

  const handler: import("hono").MiddlewareHandler = async (c, next) => {
    const debug = policyDebug(c, "cache");
    const trace = policyTrace(c, "cache");

    // Non-cacheable method - pass through with SKIP status
    if (!normalizedMethods.includes(c.req.method.toUpperCase())) {
      trace("SKIP", { method: c.req.method });
      await next();
      c.res.headers.set(statusHeader, "SKIP");
      return;
    }

    const key = await buildKey(c);
    setDebugHeader(c, "x-stoma-cache-key", key);
    setDebugHeader(c, "x-stoma-cache-ttl", resolved.ttlSeconds!);

    // Check cache (resilient to store failures)
    const cached = await safeCall(
      () => resolvedStore.get(key),
      null,
      debug,
      "store.get()"
    );
    if (cached) {
      debug(`HIT ${key}`);
      setDebugHeader(c, "x-stoma-cache-status", "HIT");
      trace("HIT", { key });
      // Compute remaining TTL from the internal expiry header (if present)
      const expiresAtStr = cached.headers.get(INTERNAL_EXPIRES_HEADER);
      if (expiresAtStr) {
        const remaining = Math.max(
          0,
          Math.ceil((Number(expiresAtStr) - Date.now()) / 1000)
        );
        setDebugHeader(c, "x-stoma-cache-expires-in", remaining);
      }
      // Return cached response, re-creating so headers can be modified
      const body = await cached.arrayBuffer();
      const res = new Response(safeBody(body, cached.status), {
        status: cached.status,
        headers: cached.headers,
      });
      res.headers.delete(INTERNAL_EXPIRES_HEADER);
      res.headers.set(statusHeader, "HIT");
      c.res = res;
      return;
    }

    await next();

    // Never cache server error responses (5xx)
    if (c.res.status >= 500) {
      debug(`SKIP ${key} (status=${c.res.status})`);
      setDebugHeader(c, "x-stoma-cache-status", "SKIP");
      c.res.headers.set(statusHeader, "SKIP");
      return;
    }

    // Only cache responses matching cacheableStatuses (when configured)
    if (
      resolved.cacheableStatuses &&
      !resolved.cacheableStatuses.includes(c.res.status)
    ) {
      debug(`SKIP ${key} (status=${c.res.status} not in cacheableStatuses)`);
      setDebugHeader(c, "x-stoma-cache-status", "SKIP");
      c.res.headers.set(statusHeader, "SKIP");
      return;
    }

    // Check upstream Cache-Control (directive-level matching, not substring)
    if (resolved.respectCacheControl) {
      const cc = c.res.headers.get("cache-control") ?? "";
      const directives = parseCacheControlDirectives(cc);
      if (
        resolved.bypassDirectives!.some((d) =>
          directives.includes(d.toLowerCase())
        )
      ) {
        debug(`BYPASS ${key} (cache-control: ${cc})`);
        setDebugHeader(c, "x-stoma-cache-status", "BYPASS");
        trace("BYPASS", { key, directive: cc });
        c.res.headers.set(statusHeader, "BYPASS");
        return;
      }
    }

    // Store a clone (with internal expiry header) and mark as MISS
    debug(`MISS ${key} (ttl=${resolved.ttlSeconds}s)`);
    setDebugHeader(c, "x-stoma-cache-status", "MISS");
    trace("MISS", { key, ttl: resolved.ttlSeconds! });
    const storeClone = c.res.clone();
    const storeBody = safeBody(
      await storeClone.arrayBuffer(),
      storeClone.status
    );
    const storeHeaders = new Headers(storeClone.headers);
    storeHeaders.set(
      INTERNAL_EXPIRES_HEADER,
      String(Date.now() + resolved.ttlSeconds! * 1000)
    );
    await safeCall(
      () =>
        resolvedStore.put(
          key,
          new Response(storeBody, {
            status: storeClone.status,
            headers: storeHeaders,
          }),
          resolved.ttlSeconds!
        ),
      undefined,
      debug,
      "store.put()"
    );
    c.res.headers.set(statusHeader, "MISS");
  };

  return {
    name: "cache",
    priority: Priority.CACHE,
    handler: withSkip(config?.skip, handler),
  };
}
