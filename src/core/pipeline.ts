/**
 * Policy pipeline — merges, sorts, and wraps policies as Hono middleware.
 *
 * The pipeline is the core execution model: global policies are merged with
 * route-level policies (route wins on name collision), sorted by priority
 * (ascending), and converted to Hono middleware handlers. A context injector
 * runs first on every request to set the request ID, timing, and debug factory.
 *
 * @module pipeline
 */
import type { Context, MiddlewareHandler } from "hono";
import type { GatewayAdapter } from "../adapters/types";
import type { Policy, PolicyContext } from "../policies/types";
import type { DebugLogger } from "../utils/debug";
import { noopDebugLogger } from "../utils/debug";
import {
  formatTraceparent,
  generateSpanId,
  generateTraceContext,
  parseTraceparent,
} from "../utils/trace-context";
import type { DebugHeadersConfig } from "./types";
import { getCollectedDebugHeaders, parseDebugRequest } from "../policies/sdk/helpers";

const noopDebugFactory = () => noopDebugLogger;

const GATEWAY_CONTEXT_KEY = "gateway";

/**
 * Merge global and route-level policies, deduplicate by name
 * (route-level wins), and sort by priority ascending.
 *
 * @param globalPolicies - Policies from `GatewayConfig.policies`.
 * @param routePolicies - Policies from `RouteConfig.pipeline.policies`.
 * @param debug - Optional debug logger for tracing overrides and chain order.
 * @returns Sorted array of merged policies.
 */
export function buildPolicyChain(
  globalPolicies: Policy[],
  routePolicies: Policy[],
  debug?: DebugLogger,
  defaultPriority = 100,
): Policy[] {
  const policyMap = new Map<string, Policy>();

  // Global policies first
  for (const p of globalPolicies) {
    policyMap.set(p.name, p);
  }

  // Route-level policies override global by name
  for (const p of routePolicies) {
    if (policyMap.has(p.name)) {
      debug?.(`policy "${p.name}" overridden by route-level policy`);
    }
    policyMap.set(p.name, p);
  }

  // Sort by priority ascending (lower = earlier)
  const sorted = Array.from(policyMap.values()).sort(
    (a, b) => (a.priority ?? defaultPriority) - (b.priority ?? defaultPriority),
  );

  if (sorted.length > 0) {
    debug?.(
      `chain: ${sorted.map((p) => `${p.name}:${p.priority ?? defaultPriority}`).join(" -> ")}`,
    );
  }

  return sorted;
}

/**
 * Convert a sorted Policy array into an array of Hono MiddlewareHandlers.
 *
 * @param policies - Sorted policy array from {@link buildPolicyChain}.
 * @returns Hono middleware handlers in execution order.
 */
export function policiesToMiddleware(policies: Policy[]): MiddlewareHandler[] {
  return policies.map((policy) => {
    const originalHandler = policy.handler;
    // Wrap with skip logic and per-policy timing
    const wrappedHandler: MiddlewareHandler = async (c, next) => {
      const start = Date.now();
      await originalHandler(c, next);
      const durationMs = Date.now() - start;

      // Accumulate per-policy timing data for metricsReporter
      const timings = (c.get("_policyTimings") ?? []) as Array<{
        name: string;
        durationMs: number;
      }>;
      timings.push({ name: policy.name, durationMs });
      c.set("_policyTimings", timings);
    };
    return wrappedHandler;
  });
}

/**
 * Create the context-injection middleware that runs at the start of every
 * pipeline. Sets requestId, startTime, gateway metadata, and debug factory
 * on Hono's context variables. Also adds `x-request-id` to the response.
 *
 * @param gatewayName - Gateway name from config.
 * @param routePath - The matched route path pattern.
 * @param debugFactory - Factory for creating namespaced debug loggers.
 * @param requestIdHeader - Response header name for the request ID.
 * @param adapter - Optional runtime adapter for runtime-specific capabilities.
 * @param debugHeaders - Client-requested debug headers configuration.
 * @returns Hono middleware that injects {@link PolicyContext}.
 */
export function createContextInjector(
  gatewayName: string,
  routePath: string,
  debugFactory: (namespace: string) => DebugLogger = noopDebugFactory,
  requestIdHeader = "x-request-id",
  adapter?: GatewayAdapter,
  debugHeaders?: boolean | DebugHeadersConfig,
): MiddlewareHandler {
  // Pre-compute debug header config once at construction time
  const debugHeadersConfig = debugHeaders === true
    ? ({} as DebugHeadersConfig)
    : debugHeaders || undefined;
  const debugRequestHeader = debugHeadersConfig?.requestHeader ?? "x-stoma-debug";
  const debugAllow = debugHeadersConfig?.allow;

  return async (c, next) => {
    // Parse incoming traceparent or generate a new trace context
    const incomingTraceparent = c.req.header("traceparent") ?? null;
    const parsed = parseTraceparent(incomingTraceparent);
    const traceId = parsed?.traceId ?? generateTraceContext().traceId;
    const spanId = generateSpanId();

    const ctx: PolicyContext = {
      requestId: crypto.randomUUID(),
      startTime: Date.now(),
      gatewayName,
      routePath,
      traceId,
      spanId,
      debug: debugFactory,
      adapter,
    };
    c.set(GATEWAY_CONTEXT_KEY, ctx);

    // Parse client debug header request before policies run
    if (debugHeadersConfig) {
      parseDebugRequest(c, debugRequestHeader, debugAllow);
    }

    await next();

    // Set request ID header on the final response (after downstream runs)
    // so it's present even when handlers return raw Response objects
    c.res.headers.set(requestIdHeader, ctx.requestId);
    // Propagate W3C traceparent on the response
    c.res.headers.set(
      "traceparent",
      formatTraceparent({
        version: "00",
        traceId: ctx.traceId,
        parentId: ctx.spanId,
        flags: parsed?.flags ?? "01",
      }),
    );

    // Emit collected debug headers on the response
    if (debugHeadersConfig) {
      const collected = getCollectedDebugHeaders(c);
      if (collected) {
        for (const [name, value] of collected) {
          c.res.headers.set(name, value);
        }
      }
    }
  };
}

/**
 * Retrieve the {@link PolicyContext} from a Hono context.
 *
 * Returns `undefined` if called outside the gateway pipeline (e.g. in
 * a standalone Hono app without context injection).
 *
 * @param c - The Hono request context.
 * @returns The gateway context, or `undefined` if not in a gateway pipeline.
 */
export function getGatewayContext(c: Context): PolicyContext | undefined {
  return c.get(GATEWAY_CONTEXT_KEY) as PolicyContext | undefined;
}
