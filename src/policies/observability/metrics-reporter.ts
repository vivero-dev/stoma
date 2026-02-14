/**
 * Metrics reporter policy - records request counts, latencies, and errors.
 *
 * Plugs into any {@link MetricsCollector} implementation and records
 * standard gateway metrics per request. Runs at priority 1 (just after
 * request-log at 0). Merges any custom tags from `assignMetrics`.
 *
 * @module metrics-reporter
 */
import type { MetricsCollector } from "../../observability/metrics";
import { definePolicy, Priority, safeCall } from "../sdk";
import type { PolicyConfig } from "../types";

export interface MetricsReporterConfig extends PolicyConfig {
  /** The metrics collector to record to. */
  collector: MetricsCollector;
}

/**
 * Record standard gateway metrics for every request.
 *
 * Metrics recorded:
 * - `gateway_requests_total` (counter) - total requests, tagged by method/path/status/gateway
 * - `gateway_request_duration_ms` (histogram) - end-to-end request duration
 * - `gateway_request_errors_total` (counter) - requests with status >= 400
 * - `gateway_policy_duration_ms` (histogram) - per-policy timing when available
 *
 * @param config - Must include a {@link MetricsCollector} instance.
 * @returns A {@link Policy} at priority 1.
 */
export const metricsReporter =
  /*#__PURE__*/ definePolicy<MetricsReporterConfig>({
    name: "metrics-reporter",
    priority: Priority.METRICS,
    httpOnly: true,
    handler: async (c, next, { config, debug, gateway }) => {
      const startTime = Date.now();

      await next();

      // Collector failures must never crash the request pipeline
      await safeCall(
        async () => {
          const dynamicTagsRaw = c.get("_metricsTags") as
            | Record<string, unknown>
            | undefined;
          const dynamicTags: Record<string, string> = {};
          if (dynamicTagsRaw) {
            for (const [key, value] of Object.entries(dynamicTagsRaw)) {
              if (typeof value === "string") {
                dynamicTags[key] = value;
              }
            }
          }

          const url = new URL(c.req.url);
          const tags: Record<string, string> = {
            ...dynamicTags,
            method: c.req.method,
            path: gateway?.routePath ?? url.pathname,
            status: String(c.res.status),
            gateway: gateway?.gatewayName ?? "unknown",
          };

          // Total requests counter
          config.collector.increment("gateway_requests_total", 1, tags);

          // Request duration histogram
          const duration = Date.now() - startTime;
          config.collector.histogram(
            "gateway_request_duration_ms",
            duration,
            tags
          );

          // Error counter (4xx and 5xx)
          if (c.res.status >= 400) {
            config.collector.increment("gateway_request_errors_total", 1, tags);
          }

          // Per-policy timing (if available from pipeline instrumentation)
          const timings = c.get("_policyTimings") as
            | Array<{ name: string; durationMs: number }>
            | undefined;
          if (timings) {
            for (const t of timings) {
              config.collector.histogram(
                "gateway_policy_duration_ms",
                t.durationMs,
                {
                  ...dynamicTags,
                  policy: t.name,
                  gateway: gateway?.gatewayName ?? "unknown",
                }
              );
            }
          }
        },
        undefined,
        debug,
        "collector"
      );
    },
  });
