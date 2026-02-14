/**
 * Policy type system - the building blocks of gateway pipelines.
 *
 * A {@link Policy} is a named middleware with priority ordering and
 * optional protocol-agnostic evaluation. Policies are composed into
 * pipelines at the global and route level, merged by name (route-level
 * wins), and sorted by priority ascending.
 *
 * The HTTP runtime uses {@link Policy.handler} (Hono middleware).
 * Non-HTTP runtimes (ext_proc, WebSocket) use {@link Policy.evaluate}.
 *
 * The {@link PolicyContext} provides request metadata (ID, timing, debug)
 * to policies at runtime via `getGatewayContext(c)`.
 *
 * @module policy-types
 */
import type { MiddlewareHandler } from "hono";
import type { GatewayAdapter } from "../adapters/types";
import type { PolicyEvaluator, ProcessingPhase } from "../core/protocol";
import type { DebugLogger } from "../utils/debug";

/**
 * A Policy is a named middleware with priority ordering and optional
 * protocol-agnostic evaluation.
 *
 * - {@link handler} - HTTP runtime entry point (Hono middleware).
 *   Used by {@link createGateway}.
 * - {@link evaluate} - Protocol-agnostic entry point. Used by non-HTTP
 *   runtimes (ext_proc, WebSocket) to invoke the policy without Hono.
 * - {@link phases} - Which processing phases this policy participates in.
 *   Used by phase-based runtimes to skip irrelevant policies.
 * - {@link httpOnly} - Set to `true` for policies that can ONLY work with
 *   the HTTP protocol and don't make sense for ext_proc or WebSocket.
 */
export interface Policy {
  /** Unique policy name (e.g. "jwt-auth", "rate-limit") */
  name: string;
  /** The Hono middleware handler - HTTP runtime entry point. */
  handler: MiddlewareHandler;
  /** Policy priority - lower numbers execute first. Default: 100. */
  priority?: number;

  /**
   * Protocol-agnostic evaluation entry point.
   *
   * Used by non-HTTP runtimes (ext_proc, WebSocket) to invoke this
   * policy without Hono. The HTTP runtime ({@link createGateway}) uses
   * {@link handler} directly and ignores this field.
   *
   * Policies that implement `evaluate` work across all runtimes.
   * Policies that only implement `handler` are HTTP-only.
   */
  evaluate?: PolicyEvaluator;

  /**
   * Processing phases this policy participates in.
   *
   * Used by phase-based runtimes (ext_proc) to skip policies that don't
   * apply to the current processing phase. For example, a JWT auth policy
   * only needs `"request-headers"`, while a response transform policy
   * needs `"response-headers"` and `"response-body"`.
   *
   * Default: `["request-headers"]` (most policies only inspect request headers).
   */
  phases?: ProcessingPhase[];

  /**
   * Set to `true` for policies that only work with the HTTP protocol.
   *
   * These policies rely on HTTP-specific concepts (Request/Response objects,
   * specific headers, HTTP status codes, etc.) and cannot be meaningfully
   * evaluated in other protocols like ext_proc or WebSocket.
   *
   * Examples:
   * - `cors` - uses HTTP-specific `Access-Control-*` headers
   * - `ssl-enforce` - HTTP-only protocol concept
   * - `proxy` - HTTP-to-HTTP forwarding
   * - `mock` - returns HTTP Response objects
   *
   * Tooling can use this flag to:
   * - Skip these policies when generating docs for non-HTTP runtimes
   * - Warn if an HTTP-only policy is used in a non-HTTP gateway config
   */
  httpOnly?: true;
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
  /** W3C Trace Context - 32-hex trace ID (propagated or generated). */
  traceId: string;
  /** W3C Trace Context - 16-hex span ID for this gateway request. */
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
