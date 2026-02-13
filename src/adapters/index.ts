/**
 * Runtime adapters for stoma — plug in platform-specific stores and capabilities.
 *
 * Stoma runs on any runtime that supports Hono (Cloudflare Workers, Deno, Bun,
 * Node.js, and more). Adapters provide the bridge between the gateway's
 * pluggable store interfaces (rate limiting, circuit breaker, cache) and each
 * runtime's native APIs.
 *
 * | Adapter              | Rate Limit Store         | Cache Store       | `waitUntil` | `dispatchBinding` |
 * |----------------------|--------------------------|-------------------|-------------|-------------------|
 * | `cloudflareAdapter`  | KV or Durable Objects    | Cache API         | Yes         | Yes               |
 * | `memoryAdapter`      | In-memory                | In-memory         | No          | No                |
 * | `denoAdapter`        | (use memoryAdapter)      | (use memoryAdapter)| No         | No                |
 * | `bunAdapter`         | (use memoryAdapter)      | (use memoryAdapter)| No         | No                |
 * | `nodeAdapter`        | (use memoryAdapter)      | (use memoryAdapter)| No         | No                |
 *
 * For testing, use `createTestAdapter()` which collects `waitUntil` promises
 * so tests can `await adapter.waitAll()` before asserting.
 *
 * @example
 * ```ts
 * // Cloudflare Workers
 * import { cloudflareAdapter } from "@homegrower-club/stoma/adapters";
 * createGateway({ adapter: cloudflareAdapter({ rateLimitKv: env.RATE_LIMIT, executionCtx: ctx }), ... });
 *
 * // Development / testing
 * import { memoryAdapter } from "@homegrower-club/stoma/adapters";
 * createGateway({ adapter: memoryAdapter(), ... });
 *
 * // Deno
 * import { denoAdapter } from "@homegrower-club/stoma/adapters";
 * createGateway({ adapter: denoAdapter(), ... });
 * ```
 *
 * @module adapters
 */

/** Create an adapter for Bun — marker/extension point for Bun-specific capabilities. */
export { bunAdapter } from "./bun";
/** Bindings accepted by `cloudflareAdapter()` — KV, DO, Cache, ExecutionContext, and env. */
export type { CloudflareAdapterBindings } from "./cloudflare";
/** Create a Cloudflare-native adapter with KV/DO rate limiting, Cache API caching, waitUntil, and service bindings. */
export {
  /** Response cache backed by the Cloudflare Cache API. */
  CacheApiCacheStore,
  cloudflareAdapter,
  /** Rate limit store backed by Cloudflare Workers KV (eventually consistent). */
  KVRateLimitStore,
} from "./cloudflare";
/** Create an adapter for Deno Deploy — marker/extension point for Deno-specific capabilities. */
export { denoAdapter } from "./deno";
/** Durable Object class for atomic rate limit counters — export from your Worker entry and reference in wrangler.toml. */
export {
  /** Rate limit store backed by Cloudflare Durable Objects (strongly consistent). */
  DurableObjectRateLimitStore,
  RateLimiterDO,
} from "./durable-object";
/** Create an adapter using in-memory stores — suitable for development, demos, and testing. */
export { memoryAdapter } from "./memory";

/** Create an adapter for Node.js (via `@hono/node-server`) — marker/extension point for Node-specific capabilities. */
export { nodeAdapter } from "./node";
/** Test adapter that collects `waitUntil` promises for assertion in unit tests. */
export {
  /** Factory function to create a new TestAdapter instance. */
  createTestAdapter,
  TestAdapter,
} from "./testing";
/** Runtime adapter interface — bag of optional store implementations and platform capabilities. */
export type { GatewayAdapter } from "./types";
