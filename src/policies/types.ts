/**
 * Policy type system — the building blocks of gateway pipelines.
 *
 * A {@link Policy} is a named Hono middleware with priority ordering.
 * Policies are composed into pipelines at the global and route level,
 * merged by name (route-level wins), and sorted by priority ascending.
 *
 * The {@link PolicyContext} provides request metadata (ID, timing, debug)
 * to policies at runtime via `getGatewayContext(c)`.
 *
 * @module policy-types
 */
import type { MiddlewareHandler } from "hono";
import type { GatewayAdapter } from "../adapters/types";
import type { DebugLogger } from "../utils/debug";

/**
 * A Policy is a named Hono middleware with metadata.
 * Policies are the building blocks of gateway pipelines.
 */
export interface Policy {
  /** Unique policy name (e.g. "jwt-auth", "rate-limit") */
  name: string;
  /** The Hono middleware handler */
  handler: MiddlewareHandler;
  /** Policy priority — lower numbers execute first. Default: 100. */
  priority?: number;
}

/** Base configuration shared by all policies */
export interface PolicyConfig {
  /** Skip this policy when condition returns true */
  skip?: (c: unknown) => boolean | Promise<boolean>;
}

/** Context available to policies during execution */
export interface PolicyContext {
  /** Unique request ID for tracing */
  requestId: string;
  /** Timestamp when the request entered the gateway */
  startTime: number;
  /** Gateway name */
  gatewayName: string;
  /** Matched route path pattern */
  routePath: string;
  /** W3C Trace Context — 32-hex trace ID (propagated or generated). */
  traceId: string;
  /** W3C Trace Context — 16-hex span ID for this gateway request. */
  spanId: string;
  /**
   * Get a debug logger for the given namespace.
   * Returns a no-op when debug is disabled (zero overhead).
   *
   * @example
   * ```ts
   * const ctx = getGatewayContext(c);
   * const debug = ctx?.debug("stoma:policy:cache");
   * debug?.("HIT", cacheKey);
   * ```
   */
  debug: (namespace: string) => DebugLogger;
  /** Runtime adapter providing store implementations and runtime-specific capabilities. */
  adapter?: GatewayAdapter;
}
