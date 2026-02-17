/**
 * Runtime adapters for stoma - plug in platform-specific stores and capabilities.
 *
 * Stoma runs on any runtime that supports Hono (Cloudflare Workers, Deno, Bun,
 * Node.js, and more). Adapters provide the bridge between the gateway's
 * pluggable store interfaces (rate limiting, circuit breaker, cache) and each
 * runtime's native APIs.
 *
 * | Adapter              | Rate Limit Store         | Circuit Breaker Store | Cache Store       | `waitUntil` | `dispatchBinding` |
 * |----------------------|--------------------------|-----------------------|-------------------|-------------|-------------------|
 * | `cloudflareAdapter`  | KV or Durable Objects    | In-memory             | Cache API         | Yes         | Yes               |
 * | `redisAdapter`       | Redis (Lua)              | Redis (JSON)          | Redis (JSON)      | Optional    | No                |
 * | `postgresAdapter`    | PostgreSQL (upsert)      | PostgreSQL (upsert)   | PostgreSQL        | Optional    | No                |
 * | `memoryAdapter`      | In-memory                | In-memory             | In-memory         | No          | No                |
 * | `denoAdapter`        | (use memoryAdapter)      | (use memoryAdapter)   | (use memoryAdapter)| No         | No                |
 * | `bunAdapter`         | (use memoryAdapter)      | (use memoryAdapter)   | (use memoryAdapter)| No         | No                |
 * | `nodeAdapter`        | (use memoryAdapter)      | (use memoryAdapter)   | (use memoryAdapter)| No         | No                |
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
 * // Redis (Node.js / Bun / Deno)
 * import { redisAdapter } from "@homegrower-club/stoma/adapters";
 * createGateway({ adapter: redisAdapter({ client: redis }), ... });
 *
 * // PostgreSQL (Node.js / Bun / Deno)
 * import { postgresAdapter } from "@homegrower-club/stoma/adapters";
 * createGateway({ adapter: postgresAdapter({ client: pool }), ... });
 *
 * // Development / testing
 * import { memoryAdapter } from "@homegrower-club/stoma/adapters";
 * createGateway({ adapter: memoryAdapter(), ... });
 * ```
 *
 * @module adapters
 */

/** Create an adapter for Bun - marker/extension point for Bun-specific capabilities. */
export { bunAdapter } from "./bun";
/** Bindings accepted by `cloudflareAdapter()` - KV, DO, Cache, ExecutionContext, and env. */
export type { CloudflareAdapterBindings } from "./cloudflare";
/** Create a Cloudflare-native adapter with KV/DO rate limiting, Cache API caching, waitUntil, and service bindings. */
export {
  /** Response cache backed by the Cloudflare Cache API. */
  CacheApiCacheStore,
  cloudflareAdapter,
  /** Rate limit store backed by Cloudflare Workers KV (eventually consistent). */
  KVRateLimitStore,
} from "./cloudflare";
/** Create an adapter for Deno Deploy - marker/extension point for Deno-specific capabilities. */
export { denoAdapter } from "./deno";
/** Durable Object class for atomic rate limit counters - export from your Worker entry and reference in wrangler.jsonc. */
export {
  /** Rate limit store backed by Cloudflare Durable Objects (strongly consistent). */
  DurableObjectRateLimitStore,
  RateLimiterDO,
} from "./durable-object";
/** Create an adapter using in-memory stores - suitable for development, demos, and testing. */
export { memoryAdapter } from "./memory";

/** Create an adapter for Node.js (via `@hono/node-server`) - marker/extension point for Node-specific capabilities. */
export { nodeAdapter } from "./node";
/** Config accepted by `postgresAdapter()` - client, table prefix, store toggles. */
export type { PostgresAdapterConfig, PostgresClient } from "./postgres";
/** Create a PostgreSQL-backed adapter with upsert-based rate limiting, circuit breaker, and cache stores. */
export {
  /** Exported SQL to create the required stoma tables. Run once against your database. */
  POSTGRES_SCHEMA_SQL,
  /** Response cache backed by PostgreSQL with base64-encoded body. */
  PostgresCacheStore,
  /** Circuit breaker state store backed by PostgreSQL. */
  PostgresCircuitBreakerStore,
  /** Rate limit store backed by PostgreSQL using atomic upsert. */
  PostgresRateLimitStore,
  postgresAdapter,
} from "./postgres";
/** Config accepted by `redisAdapter()` - client, prefix, setWithTTL override, store toggles. */
export type { RedisAdapterConfig, RedisClient } from "./redis";
/** Create a Redis-backed adapter with Lua-based rate limiting, JSON circuit breaker, and JSON cache stores. */
export {
  /** Response cache backed by Redis with base64-encoded body. */
  RedisCacheStore,
  /** Circuit breaker state store backed by Redis JSON strings. */
  RedisCircuitBreakerStore,
  /** Rate limit store backed by Redis with atomic Lua script. */
  RedisRateLimitStore,
  redisAdapter,
} from "./redis";
/** Test adapter that collects `waitUntil` promises for assertion in unit tests. */
export {
  /** Factory function to create a new TestAdapter instance. */
  createTestAdapter,
  TestAdapter,
} from "./testing";
/** Runtime adapter interface - bag of optional store implementations and platform capabilities. */
export type { GatewayAdapter } from "./types";
