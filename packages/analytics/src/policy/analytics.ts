/**
 * Analytics logging policy — structured metric entries for aggregation.
 *
 * ## Data boundary: analytics vs request logs
 *
 * Analytics entries are designed for **aggregation** — every field should be
 * something you'd `GROUP BY`, `SUM`, `AVG`, or `COUNT` in a DuckDB query.
 * High-cardinality debug data belongs in request logs (`requestLog` policy).
 *
 * | Field        | Analytics | Request Log | Why                                          |
 * |--------------|-----------|-------------|----------------------------------------------|
 * | timestamp    | ✓         | ✓           | Time series bucketing / grep by time          |
 * | gatewayName  | ✓         | ✓           | GROUP BY gateway in multi-gateway setups      |
 * | routePath    | ✓         | ✓           | GROUP BY route pattern (low cardinality)      |
 * | method       | ✓         | ✓           | GROUP BY HTTP method                          |
 * | statusCode   | ✓         | ✓           | GROUP BY status, error rate dashboards        |
 * | durationMs   | ✓         | ✓           | AVG/P99 latency, SLA monitoring               |
 * | responseSize | ✓         |             | SUM bandwidth, detect payload bloat           |
 * | traceId      | ✓         | ✓           | Drill-down from dashboard anomaly → logs      |
 * | dimensions   | ✓         |             | Extensible low-cardinality facets             |
 * | requestId    |           | ✓           | Unique per request — grep, not GROUP BY       |
 * | path         |           | ✓           | Actual URL (high cardinality, e.g. /users/42) |
 * | clientIp     |           | ✓           | PII, high cardinality — debug/abuse only      |
 * | userAgent    |           | ✓           | High cardinality — debug specific clients     |
 * | spanId       |           | ✓           | Distributed tracing span correlation          |
 * | requestBody  |           | ✓           | Deep debugging (opt-in, redactable)           |
 * | responseBody |           | ✓           | Deep debugging (opt-in, redactable)           |
 *
 * @module analytics-log
 */
import { definePolicy, Priority } from "@homegrower-club/stoma/sdk";
import type { PolicyConfig } from "@homegrower-club/stoma";
import { ANALYTICS_TYPE, type AnalyticsEntry } from "../types.js";

export interface AnalyticsLogConfig extends PolicyConfig {
  /** Static dimensions added to every entry. */
  dimensions?: Record<string, string | number | boolean>;
  /**
   * Dynamic dimension extractor. Called per-request after the response.
   * Return additional dimensions to merge with static ones.
   *
   * `c.get(key)` reads values set by earlier policies on the Hono context —
   * JWT claims, RBAC roles, custom attributes, etc. Use this to derive
   * low-cardinality dimensions from upstream policy state.
   *
   * @example
   * ```ts
   * analyticsLog({
   *   extractDimensions: (c) => ({
   *     // Read a value set by jwtAuth or assignAttributes
   *     plan: String(c.get("plan") ?? "free"),
   *     region: c.req.header("cf-ipcountry") ?? "unknown",
   *   }),
   * })
   * ```
   */
  extractDimensions?: (c: {
    req: { method: string; url: string; header: (name: string) => string | undefined };
    res: { status: number; headers: Headers };
    /** Read a value from the Hono context (set by prior policies). */
    get: (key: string) => unknown;
  }) => Record<string, string | number | boolean>;
  /**
   * Custom sink function. Defaults to `console.log(JSON.stringify(entry))`.
   * Override for testing or custom log transports.
   */
  sink?: (entry: AnalyticsEntry) => void;
}

const defaultSink = (entry: AnalyticsEntry): void => {
  console.log(JSON.stringify(entry));
};

export const analyticsLog = definePolicy<AnalyticsLogConfig>({
  name: "analytics-log",
  priority: Priority.OBSERVABILITY,
  defaults: {},
  handler: async (c, next, { config, gateway }) => {
    const startTime = Date.now();

    // Let the rest of the pipeline execute
    await next();

    // Collect metrics after the response is ready
    try {
      const responseHeaders = c.res?.headers;
      const contentLength = responseHeaders?.get("content-length");

      const staticDims = config.dimensions ?? {};
      const dynamicDims = config.extractDimensions
        ? config.extractDimensions({
            req: {
              method: c.req.method,
              url: c.req.url,
              header: (name: string) => c.req.header(name),
            },
            res: {
              status: c.res?.status ?? 0,
              headers: responseHeaders ?? new Headers(),
            },
            get: (key: string) => c.get(key as never),
          })
        : {};

      const entry: AnalyticsEntry = {
        _type: ANALYTICS_TYPE,
        timestamp: new Date().toISOString(),
        gatewayName: gateway?.gatewayName ?? "unknown",
        routePath: gateway?.routePath ?? "unknown",
        method: c.req.method,
        statusCode: c.res?.status ?? 0,
        durationMs: Date.now() - startTime,
        responseSize: contentLength ? parseInt(contentLength, 10) : 0,
        traceId: gateway?.traceId,
        dimensions:
          Object.keys(staticDims).length > 0 ||
          Object.keys(dynamicDims).length > 0
            ? { ...staticDims, ...dynamicDims }
            : undefined,
      };

      const sink = config.sink ?? defaultSink;
      sink(entry);
    } catch {
      // Analytics must never break the request pipeline
    }
  },
});
