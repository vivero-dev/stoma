/**
 * Playground gateway configuration.
 *
 * Creates a real Stoma gateway that runs inside the browser's service worker.
 * Demonstrates rate limiting, caching, API key auth, and timeout policies.
 *
 * This file lives in docs/ only. It is NOT part of the Stoma library.
 */

import type { GatewayAdapter, GatewayInstance } from "@vivero/stoma";
import {
  apiKeyAuth,
  cache,
  cors,
  createGateway,
  health,
  InMemoryCircuitBreakerStore,
  rateLimit,
  requestLog,
  serverTiming,
  timeout,
} from "@vivero/stoma";
import { CacheApiCacheStore } from "@vivero/stoma/adapters/cloudflare";

import { IDBRateLimitStore } from "./stores/idb-rate-limit-store";

// ---------------------------------------------------------------------------
// Cache name used for both the CacheAPI store and the reset function
// ---------------------------------------------------------------------------
export const PLAYGROUND_CACHE_NAME = "stoma-playground";

// ---------------------------------------------------------------------------
// Factory - async because `caches.open()` returns a promise
// ---------------------------------------------------------------------------

/**
 * Build the playground gateway with browser-compatible stores.
 *
 * Adapter wiring:
 * - Rate limiting  → IndexedDB (persists across SW restarts)
 * - Caching        → Cache API (standard web API, not CF-specific)
 * - Circuit breaker → In-memory (ephemeral - fine for a demo)
 */
export async function createPlaygroundGateway(): Promise<GatewayInstance> {
  // Open a named cache (standard Web API - works in any browser)
  const cacheInstance = await caches.open(PLAYGROUND_CACHE_NAME);

  const adapter: GatewayAdapter = {
    rateLimitStore: new IDBRateLimitStore(),
    cacheStore: new CacheApiCacheStore(cacheInstance),
    circuitBreakerStore: new InMemoryCircuitBreakerStore(),
  };

  return createGateway({
    name: "playground",
    basePath: "/playground/api",
    adapter,

    // Debug mode ON - so users can see policy internals in response headers
    debug: true,
    debugHeaders: true,

    // Global policies applied to every route
    policies: [requestLog(), cors(), serverTiming({ visibility: "always" })],

    routes: [
      // -----------------------------------------------------------------
      // Health check - simple liveness endpoint
      // -----------------------------------------------------------------
      health(),

      // -----------------------------------------------------------------
      // Echo - demonstrates rate limiting + response caching
      //
      // - 5 requests per 30s window, then 429
      // - Responses cached for 10s (GET only by default)
      // -----------------------------------------------------------------
      {
        path: "/echo",
        methods: ["GET", "POST"],
        pipeline: {
          policies: [
            rateLimit({ max: 5, windowSeconds: 30 }),
            cache({ ttlSeconds: 10 }),
          ],
          upstream: {
            type: "handler",
            handler: async (c) => {
              const body = ["POST", "PUT", "PATCH"].includes(c.req.method)
                ? await c.req.text().catch(() => null)
                : null;

              return c.json({
                method: c.req.method,
                path: c.req.path,
                headers: Object.fromEntries(c.req.raw.headers.entries()),
                body,
                timestamp: new Date().toISOString(),
              });
            },
          },
        },
      },

      // -----------------------------------------------------------------
      // Protected - demonstrates API key authentication
      //
      // Send header `x-api-key: demo-key` to get access
      // -----------------------------------------------------------------
      {
        path: "/protected",
        methods: ["GET"],
        pipeline: {
          policies: [
            apiKeyAuth({
              validate: (key) => key === "demo-key",
            }),
          ],
          upstream: {
            type: "handler",
            handler: (c) =>
              c.json({
                message: "Access granted",
                user: "demo",
                timestamp: new Date().toISOString(),
              }),
          },
        },
      },

      // -----------------------------------------------------------------
      // Slow - demonstrates timeout policy
      //
      // Handler sleeps 2s, but timeout is 1s → always times out
      // -----------------------------------------------------------------
      {
        path: "/slow",
        methods: ["GET"],
        pipeline: {
          policies: [timeout({ timeoutMs: 1000 })],
          upstream: {
            type: "handler",
            handler: async (c) => {
              await new Promise((resolve) => setTimeout(resolve, 2000));
              return c.json({ message: "This should never be seen" });
            },
          },
        },
      },
    ],
  });
}
