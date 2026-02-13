import type { CircuitBreakerStore } from "../policies/resilience/circuit-breaker";
import type { CacheStore } from "../policies/traffic/cache";
import type { RateLimitStore } from "../policies/traffic/rate-limit";

/** Bag of optional store implementations and runtime capabilities for a given runtime. */
export interface GatewayAdapter {
  rateLimitStore?: RateLimitStore;
  circuitBreakerStore?: CircuitBreakerStore;
  cacheStore?: CacheStore;

  /** Schedule background work that outlives the response (e.g. Cloudflare `executionCtx.waitUntil`). */
  waitUntil?: (promise: Promise<unknown>) => void;
  /** Dispatch a request to a named service binding or sidecar. */
  dispatchBinding?: (service: string, request: Request) => Promise<Response>;
}
