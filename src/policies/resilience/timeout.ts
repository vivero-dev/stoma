/**
 * Timeout policy - enforce a response time budget for downstream handlers.
 *
 * @module timeout
 */
import { GatewayError } from "../../core/errors";
import { definePolicy, Priority } from "../sdk";
import type { PolicyConfig } from "../types";

export interface TimeoutConfig extends PolicyConfig {
  /** Timeout in milliseconds. Default: 30000. */
  timeoutMs?: number;
  /** Error message when timeout fires. */
  message?: string;
  /** HTTP status code when timeout fires. Default: 504. */
  statusCode?: number;
}

/**
 * Enforce a time budget for downstream execution.
 *
 * Races `next()` against a timer. If the timer fires first, throws a
 * GatewayError (default 504). The timer is always cleaned up, even on
 * downstream errors.
 *
 * @param config - Timeout duration and custom error message. Defaults to 30 seconds.
 * @returns A {@link Policy} at priority 85 (runs late, close to upstream).
 *
 * @example
 * ```ts
 * // 5-second timeout with custom message
 * timeout({ timeoutMs: 5000, message: "Upstream did not respond in time" });
 * ```
 */
export const timeout = /*#__PURE__*/ definePolicy<TimeoutConfig>({
  name: "timeout",
  priority: Priority.TIMEOUT,
  httpOnly: true,
  defaults: { timeoutMs: 30_000, message: "Gateway timeout", statusCode: 504 },
  handler: async (c, next, { config, trace }) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.timeoutMs!);

    // Store the abort signal on context so the URL upstream handler can
    // pass it to fetch(), enabling true cancellation of in-flight requests.
    c.set("_timeoutSignal", controller.signal);

    try {
      const start = Date.now();
      await Promise.race([
        next(),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener("abort", () =>
            reject(
              new GatewayError(
                config.statusCode!,
                "gateway_timeout",
                config.message!
              )
            )
          );
        }),
      ]);
      trace("passed", {
        budgetMs: config.timeoutMs!,
        elapsed: Date.now() - start,
      });
    } catch (err) {
      if (err instanceof GatewayError && err.code === "gateway_timeout") {
        trace("fired", { budgetMs: config.timeoutMs! });
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  },
});
