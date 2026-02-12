import { InMemoryCircuitBreakerStore } from "../policies/resilience/circuit-breaker";
import { InMemoryCacheStore } from "../policies/traffic/cache";
import { InMemoryRateLimitStore } from "../policies/traffic/rate-limit";
import type { GatewayAdapter } from "./types";

/** Create a GatewayAdapter using in-memory stores. Suitable for dev/demo/testing. */
export function memoryAdapter(): GatewayAdapter {
  return {
    rateLimitStore: new InMemoryRateLimitStore(),
    circuitBreakerStore: new InMemoryCircuitBreakerStore(),
    cacheStore: new InMemoryCacheStore(),
  };
}
