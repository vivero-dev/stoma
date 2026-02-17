/**
 * Assign metric tags/dimensions to the request context.
 *
 * Resolved tags are stored at `c.get("_metricsTags")` for consumption by
 * {@link metricsReporter} or custom downstream observers.
 *
 * @module assign-metrics
 */
import type { Context } from "hono";
import { definePolicy, Priority, safeCall } from "../sdk";
import type { PolicyConfig } from "../types";

export interface AssignMetricsConfig extends PolicyConfig {
  /**
   * Metric tags to attach to the request.
   * Values can be static strings or functions that receive the context.
   */
  tags: Record<string, string | ((c: Context) => string | Promise<string>)>;
}

/**
 * Attach metric tags to the request context for downstream consumers.
 *
 * Tags are resolved (static or dynamic) and stored as a plain object at
 * `c.get("_metricsTags")`. The {@link metricsReporter} policy (or any custom
 * observer) can read these tags to enrich collected metrics.
 *
 * @param config - Must include `tags` - a record of tag names to values or resolver functions.
 * @returns A {@link Policy} at priority 0 (OBSERVABILITY).
 *
 * @example
 * ```ts
 * import { assignMetrics } from "@homegrower-club/stoma";
 *
 * assignMetrics({
 *   tags: {
 *     service: "users-api",
 *     region: (c) => c.req.header("cf-ipcountry") ?? "unknown",
 *   },
 * });
 * ```
 */
export const assignMetrics = /*#__PURE__*/ definePolicy<AssignMetricsConfig>({
  name: "assign-metrics",
  priority: Priority.OBSERVABILITY,
  httpOnly: true,
  handler: async (c, next, { config, debug }) => {
    const resolvedTags: Record<string, string> = {};

    for (const [key, value] of Object.entries(config.tags)) {
      if (typeof value === "function") {
        // Tag resolver failure must never prevent the request from proceeding
        resolvedTags[key] = await safeCall(
          () => Promise.resolve(value(c)),
          "unknown",
          debug,
          `tag resolver(${key})`
        );
        debug("tag %s = %s (dynamic)", key, resolvedTags[key]);
      } else {
        resolvedTags[key] = value;
        debug("tag %s = %s (static)", key, value);
      }
    }

    c.set("_metricsTags", resolvedTags);
    await next();
  },
});
