/**
 * Latency injection policy - simulate network delays for chaos testing.
 *
 * @module latency-injection
 */

import { definePolicy, Priority } from "../sdk";
import type { PolicyConfig } from "../types";

export interface LatencyInjectionConfig extends PolicyConfig {
  /** Base delay in milliseconds. Required. */
  delayMs: number;
  /** Jitter proportion (0 to 1). Actual delay varies by +/- jitter * delayMs. Default: 0. */
  jitter?: number;
  /** Probability of injecting latency (0 to 1). Default: 1 (always). */
  probability?: number;
}

/**
 * Inject artificial latency into the pipeline for chaos/resilience testing.
 *
 * When active, pauses execution for a configurable duration before calling
 * `next()`. Supports jitter to vary the delay and a probability setting to
 * inject latency only a fraction of the time.
 *
 * @param config - Delay duration, jitter, and injection probability.
 * @returns A {@link Policy} at priority 5 (early pipeline).
 *
 * @example
 * ```ts
 * // Fixed 100ms delay on every request
 * latencyInjection({ delayMs: 100 });
 *
 * // 200ms +/- 50% jitter, injected 30% of the time
 * latencyInjection({ delayMs: 200, jitter: 0.5, probability: 0.3 });
 * ```
 */
export const latencyInjection =
  /*#__PURE__*/ definePolicy<LatencyInjectionConfig>({
    name: "latency-injection",
    priority: Priority.EARLY,
    httpOnly: true,
    defaults: { jitter: 0, probability: 1 },
    handler: async (_c, next, { config, debug }) => {
      // Roll against probability
      if (Math.random() >= config.probability!) {
        debug("skipping injection (probability miss)");
        await next();
        return;
      }

      // Compute delay with optional jitter
      let delay = config.delayMs;
      if (config.jitter! > 0) {
        delay += (Math.random() * 2 - 1) * config.jitter! * config.delayMs;
      }
      // Clamp to minimum 0
      delay = Math.max(0, delay);

      debug(`injecting ${delay.toFixed(0)}ms latency`);
      await new Promise((resolve) => setTimeout(resolve, delay));

      await next();
    },
  });
