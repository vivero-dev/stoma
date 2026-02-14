/**
 * Composable helpers for policy authors.
 *
 * Utilities that eliminate the most common boilerplate:
 * - {@link resolveConfig} - merge defaults with user config
 * - {@link policyDebug} - get a pre-namespaced debug logger
 * - {@link withSkip} - wrap a handler with `PolicyConfig.skip` logic
 * - {@link safeCall} - graceful store failure degradation
 * - {@link setDebugHeader} - contribute debug data for client-requested debug headers
 *
 * @module helpers
 */
import type { Context, MiddlewareHandler, Next } from "hono";
import { getGatewayContext } from "../../core/pipeline";
import type { DebugLogger } from "../../utils/debug";
import { noopDebugLogger } from "../../utils/debug";
import { TRACE_REQUESTED_KEY } from "./trace";

/**
 * Merge default config values with user-provided config.
 *
 * Performs a shallow merge: `{ ...defaults, ...userConfig }`.
 * Explicit `undefined` values in userConfig override defaults.
 *
 * @param defaults - Default values for all optional config fields.
 * @param userConfig - User-provided config (may be undefined).
 * @returns Fully merged config typed as `TConfig`.
 */
export function resolveConfig<TConfig>(
  defaults: Partial<TConfig>,
  userConfig?: Partial<TConfig>
): TConfig {
  if (!userConfig) return { ...defaults } as TConfig;
  return { ...defaults, ...userConfig } as TConfig;
}

/**
 * Get a debug logger pre-namespaced to `stoma:policy:{name}`.
 *
 * Returns {@link noopDebugLogger} when there is no gateway context
 * (e.g. outside a gateway pipeline) or when debug is disabled.
 * This eliminates the repeated `getGatewayContext(c)?.debug(...)` pattern.
 *
 * @param c - Hono request context.
 * @param policyName - Policy name used in the namespace.
 * @returns A {@link DebugLogger} - always callable, never undefined.
 */
export function policyDebug(c: Context, policyName: string): DebugLogger {
  return (
    getGatewayContext(c)?.debug(`stoma:policy:${policyName}`) ?? noopDebugLogger
  );
}

/**
 * Wrap a middleware handler with skip logic.
 *
 * If `skipFn` is undefined, returns the original handler unchanged
 * (zero overhead). Otherwise wraps it: when `skipFn(c)` returns `true`,
 * calls `next()` without running the handler.
 *
 * This implements the `PolicyConfig.skip` feature that was defined in
 * types but never enforced at runtime.
 *
 * @param skipFn - Optional predicate from `PolicyConfig.skip`.
 * @param handler - The policy's middleware handler.
 * @returns The original handler or a skip-aware wrapper.
 */
export function withSkip(
  skipFn: ((c: unknown) => boolean | Promise<boolean>) | undefined,
  handler: MiddlewareHandler
): MiddlewareHandler {
  if (!skipFn) return handler;

  return async (c: Context, next: Next) => {
    const shouldSkip = await skipFn(c);
    if (shouldSkip) {
      await next();
      return;
    }
    await handler(c, next);
  };
}

/**
 * Execute an async operation with graceful error handling.
 *
 * Designed for store-backed policies (cache, rate-limit, circuit-breaker)
 * where a store failure should degrade gracefully - not crash the request.
 * Returns the `fallback` value if `fn` throws.
 *
 * @param fn - The async operation to attempt.
 * @param fallback - Value to return if `fn` throws.
 * @param debug - Optional debug logger for error reporting.
 * @param label - Optional label for the debug message (e.g. `"store.get()"`).
 * @returns The result of `fn`, or `fallback` on error.
 *
 * @example
 * ```ts
 * const cached = await safeCall(
 *   () => store.get(key),
 *   null,
 *   debug,
 *   "store.get()",
 * );
 * ```
 */
export async function safeCall<T>(
  fn: () => Promise<T>,
  fallback: T,
  debug?: DebugLogger,
  label?: string
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (debug && label) {
      debug(
        `${label} failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }
    return fallback;
  }
}

// --- Debug headers ---

const DEBUG_HEADERS_KEY = "_stomaDebugHeaders";
const DEBUG_REQUESTED_KEY = "_stomaDebugRequested";

/**
 * Set a debug header value for client-requested debug output.
 *
 * Policies call this to contribute debug data. The value is only stored
 * if the client requested it via the `x-stoma-debug` request header AND
 * the gateway has debug headers enabled. When neither condition is met,
 * this is a no-op (single Map lookup).
 *
 * @param c - Hono request context.
 * @param name - Header name (e.g. `"x-stoma-cache-key"`).
 * @param value - Header value. Numbers and booleans are stringified.
 *
 * @example
 * ```ts
 * setDebugHeader(c, "x-stoma-cache-key", key);
 * setDebugHeader(c, "x-stoma-cache-ttl", resolved.ttlSeconds);
 * ```
 */
export function setDebugHeader(
  c: Context,
  name: string,
  value: string | number | boolean
): void {
  const requested = c.get(DEBUG_REQUESTED_KEY) as Set<string> | undefined;
  if (!requested || !(requested.has(name) || requested.has("*"))) return;

  const headers = (c.get(DEBUG_HEADERS_KEY) ??
    new Map<string, string>()) as Map<string, string>;
  headers.set(name, String(value));
  c.set(DEBUG_HEADERS_KEY, headers);
}

/**
 * Parse the client's debug header request and store the requested set.
 *
 * Called by the pipeline's context injector when `debugHeaders` is enabled.
 * Parses the comma-separated request header and stores a Set of requested
 * header names on the Hono context.
 *
 * @param c - Hono request context.
 * @param requestHeaderName - The request header to read (default: `"x-stoma-debug"`).
 * @param allow - Optional allowlist. When set, only these header names are permitted.
 * @internal
 */
export function parseDebugRequest(
  c: Context,
  requestHeaderName: string,
  allow?: string[]
): void {
  const raw = c.req.header(requestHeaderName);
  if (!raw) return;

  const names = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (names.length === 0) return;

  const allowSet = allow ? new Set(allow.map((a) => a.toLowerCase())) : null;
  const requested = new Set<string>();

  // Wildcard: "*" means "all debug headers". When an allowlist is configured,
  // expand to all allowed names. Without an allowlist, store the "*" sentinel
  // which setDebugHeader() checks for.
  if (names.includes("*")) {
    if (allowSet) {
      for (const a of allowSet) requested.add(a);
    } else {
      requested.add("*");
    }
  }

  for (const name of names) {
    if (name === "*") continue;
    if (!allowSet || allowSet.has(name)) {
      requested.add(name);
    }
  }

  if (requested.size > 0) {
    c.set(DEBUG_REQUESTED_KEY, requested);
  }

  // Activate tracing when "trace" is explicitly requested or "*" wildcard is used.
  // Respects the allowlist - if an allowlist exists and "trace" isn't in it, tracing is blocked.
  if (requested.has("trace") || requested.has("*")) {
    c.set(TRACE_REQUESTED_KEY, true);
  }
}

/**
 * Read all collected debug headers for emission on the response.
 *
 * Called by the pipeline's context injector after all policies have run.
 *
 * @param c - Hono request context.
 * @returns Map of header name → value, or undefined if none collected.
 * @internal
 */
export function getCollectedDebugHeaders(
  c: Context
): Map<string, string> | undefined {
  return c.get(DEBUG_HEADERS_KEY) as Map<string, string> | undefined;
}

/**
 * Check whether the client requested debug output via the `x-stoma-debug` header.
 *
 * Returns `true` when any debug header names were requested (i.e. the
 * `_stomaDebugRequested` context key is a non-empty Set).
 *
 * @param c - Hono request context.
 * @returns `true` if the client sent a valid `x-stoma-debug` request header.
 */
export function isDebugRequested(c: Context): boolean {
  const requested = c.get(DEBUG_REQUESTED_KEY) as Set<string> | undefined;
  return requested !== undefined && requested.size > 0;
}
