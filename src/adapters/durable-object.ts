import type { RateLimitStore } from "../policies/traffic/rate-limit";

// ---------------------------------------------------------------------------
// Durable Object class - exported for the consumer's wrangler.jsonc
// ---------------------------------------------------------------------------

/**
 * Durable Object that maintains an atomic rate limit counter.
 *
 * Each unique rate limit key maps to one DO instance via `idFromName(key)`.
 * The counter auto-expires using the DO alarm API.
 *
 * **Consumer setup**: Export this class from your Worker entry point and
 * reference it in `wrangler.jsonc`:
 *
 * ```jsonc
 * {
 *   "durable_objects": {
 *     "bindings": [
 *       {
 *         "name": "RATE_LIMITER",
 *         "class_name": "RateLimiterDO"
 *       }
 *     ]
 *   }
 * }
 * ```
 *
 * ```ts
 * // worker entry
 * export { RateLimiterDO } from "@homegrower-club/stoma/adapters";
 * ```
 */
export class RateLimiterDO implements DurableObject {
  private state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const windowSeconds = Number(url.searchParams.get("window") ?? "60");

    // Use blockConcurrencyWhile to ensure atomic increments.
    // This serializes all concurrent requests to this DO instance,
    // preventing the race condition where two requests read the same count
    // and both write count+1, losing one increment.
    return this.state.blockConcurrencyWhile(async () => {
      const now = Date.now();
      const stored = (await this.state.storage.get("counter")) as {
        count: number;
        resetAt: number;
      } | null;

      if (stored && stored.resetAt > now) {
        // Window still active - increment atomically
        const updated = { count: stored.count + 1, resetAt: stored.resetAt };
        await this.state.storage.put("counter", updated);
        return Response.json(updated);
      }

      // Start a new window
      const resetAt = now + windowSeconds * 1000;
      const entry = { count: 1, resetAt };
      await this.state.storage.put("counter", entry);
      // Schedule alarm to clean up expired counter
      await this.state.storage.setAlarm(resetAt);
      return Response.json(entry);
    });
  }

  async alarm(): Promise<void> {
    // Clean up expired counter to free storage
    await this.state.storage.delete("counter");
  }
}

// ---------------------------------------------------------------------------
// Client store - wraps the DO namespace for use with the rateLimit policy
// ---------------------------------------------------------------------------

const DO_ORIGIN = "https://rate-limiter.internal";

/**
 * Rate limit store backed by a Durable Object.
 *
 * Each rate limit key maps to a unique DO instance, providing strongly
 * consistent atomic counters that survive Worker eviction and work
 * across isolates.
 *
 * @example
 * ```ts
 * import { DurableObjectRateLimitStore } from "@homegrower-club/stoma/adapters";
 *
 * const store = new DurableObjectRateLimitStore(env.RATE_LIMITER);
 * rateLimit({ max: 100, store });
 * ```
 */
export class DurableObjectRateLimitStore implements RateLimitStore {
  constructor(private namespace: DurableObjectNamespace) {}

  async increment(
    key: string,
    windowSeconds: number
  ): Promise<{ count: number; resetAt: number }> {
    const id = this.namespace.idFromName(key);
    const stub = this.namespace.get(id);
    const response = await stub.fetch(
      new Request(`${DO_ORIGIN}/increment?window=${windowSeconds}`)
    );
    return response.json() as Promise<{ count: number; resetAt: number }>;
  }
}
