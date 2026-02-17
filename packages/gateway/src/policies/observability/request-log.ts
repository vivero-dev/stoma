/**
 * Request logging policy - structured JSON logs for every request.
 *
 * @module request-log
 */
import { extractClientIp } from "../../utils/ip";
import { redactFields } from "../../utils/redact";
import { definePolicy, Priority, safeCall } from "../sdk";
import type { PolicyConfig } from "../types";

export interface RequestLogConfig extends PolicyConfig {
  /** Additional fields to extract from the request */
  extractFields?: (c: unknown) => Record<string, unknown>;
  /** Custom log sink - defaults to console.log with structured JSON */
  sink?: (entry: LogEntry) => void | Promise<void>;
  /** Ordered list of headers to inspect for the client IP. Default: `["cf-connecting-ip", "x-forwarded-for"]`. */
  ipHeaders?: string[];
  /** Log request body (opt-in). Default: `false`. */
  logRequestBody?: boolean;
  /** Log response body (opt-in). Default: `false`. */
  logResponseBody?: boolean;
  /** Maximum body size in bytes to capture. Default: `8192`. */
  maxBodyLength?: number;
  /** JSON field paths to redact from logged bodies (e.g., `["password", "*.secret"]`). */
  redactPaths?: string[];
}

/** Structured log entry emitted for each request/response pair. */
export interface LogEntry {
  /** ISO 8601 timestamp when the log was emitted. */
  timestamp: string;
  /** Unique request ID for distributed tracing. */
  requestId: string;
  /** HTTP method (e.g. `"GET"`, `"POST"`). */
  method: string;
  /** URL pathname (without query string). */
  path: string;
  /** HTTP response status code. */
  statusCode: number;
  /** End-to-end request duration in milliseconds. */
  durationMs: number;
  /** Client IP from `CF-Connecting-IP` or `X-Forwarded-For`. */
  clientIp: string;
  /** Client User-Agent header value. */
  userAgent: string;
  /** Gateway name from config. */
  gatewayName: string;
  /** Matched route path pattern. */
  routePath: string;
  /** Upstream identifier (reserved for future enrichment). */
  upstream: string;
  /** W3C Trace Context - 32-hex trace ID. */
  traceId?: string;
  /** W3C Trace Context - 16-hex span ID for this gateway request. */
  spanId?: string;
  /** Captured request body (when `logRequestBody` is enabled). */
  requestBody?: unknown;
  /** Captured response body (when `logResponseBody` is enabled). */
  responseBody?: unknown;
  /** Custom fields from `extractFields` callback. */
  extra?: Record<string, unknown>;
}

const DEFAULT_MAX_BODY_LENGTH = 8192;

/**
 * Emit structured JSON logs for every request/response pair.
 *
 * Captures method, path, status, duration, client IP, user agent, and
 * gateway context (request ID, gateway name, route path). Runs at priority 0
 * so it wraps the entire pipeline and measures end-to-end latency.
 *
 * By default, logs are written to `console.log` as JSON lines. Provide a
 * custom `sink` to route logs to an external service (e.g., Logflare,
 * Datadog, or a Durable Object buffer).
 *
 * ## Data boundary: request logs vs analytics
 *
 * Request logs and analytics (`@homegrower-club/stoma-analytics`) serve
 * different purposes and deliberately carry different fields.
 *
 * **Request logs** (this policy) are for **debugging and operational triage**.
 * Fields are high-cardinality — grep-friendly, not GROUP BY-friendly:
 *
 * | Field        | Why it's here                                          |
 * |--------------|--------------------------------------------------------|
 * | requestId    | Unique per request — grep to find a single transaction |
 * | path         | Actual URL e.g. /users/42 (high cardinality)           |
 * | clientIp     | PII, high cardinality — abuse investigation only       |
 * | userAgent    | High cardinality — debug specific client issues         |
 * | spanId       | Distributed tracing span correlation                   |
 * | requestBody  | Deep debugging (opt-in, redactable)                    |
 * | responseBody | Deep debugging (opt-in, redactable)                    |
 *
 * **Overlapping fields** (appear in both logs and analytics):
 *
 * | Field       | Why both need it                                       |
 * |-------------|--------------------------------------------------------|
 * | timestamp   | Time-series bucketing (analytics) / grep by time (logs)|
 * | gatewayName | GROUP BY gateway (analytics) / filter logs by gateway  |
 * | routePath   | GROUP BY route pattern (analytics) / filter by route   |
 * | method      | GROUP BY method (analytics) / filter logs by method    |
 * | statusCode  | Error rate dashboards (analytics) / grep errors (logs) |
 * | durationMs  | AVG/P99 latency (analytics) / slow request triage      |
 * | traceId     | Dashboard anomaly drill-down → find matching log lines |
 *
 * **Analytics-only fields** (NOT in request logs):
 *
 * | Field        | Why only analytics                                    |
 * |--------------|-------------------------------------------------------|
 * | responseSize | SUM bandwidth, detect payload bloat — aggregate only   |
 * | dimensions   | Extensible low-cardinality facets for GROUP BY         |
 *
 * @param config - Custom field extraction, body logging, and sink. All fields optional.
 * @returns A {@link Policy} at priority 0 (runs first, wraps everything).
 *
 * @example
 * ```ts
 * import { createGateway } from "@homegrower-club/stoma";
 * import { requestLog } from "@homegrower-club/stoma/policies";
 *
 * // Default structured JSON logging to console
 * createGateway({
 *   policies: [requestLog()],
 *   routes: [...],
 * });
 *
 * // With body logging and redaction
 * requestLog({
 *   logRequestBody: true,
 *   logResponseBody: true,
 *   redactPaths: ["password", "*.secret", "auth.token"],
 *   sink: async (entry) => {
 *     await fetch("https://logs.example.com/ingest", {
 *       method: "POST",
 *       body: JSON.stringify(entry),
 *     });
 *   },
 * });
 * ```
 */
export const requestLog = /*#__PURE__*/ definePolicy<RequestLogConfig>({
  name: "request-log",
  priority: Priority.OBSERVABILITY,
  httpOnly: true,
  handler: async (c, next, { config, debug, gateway }) => {
    const sink = config.sink ?? defaultSink;
    const maxBodyLength = config.maxBodyLength ?? DEFAULT_MAX_BODY_LENGTH;
    const startTime = Date.now();

    // Capture request body before downstream consumes it
    let requestBody: unknown;
    if (config.logRequestBody) {
      requestBody = await captureRequestBody(
        c.req.raw,
        maxBodyLength,
        config.redactPaths
      );
    }

    // Let downstream run
    await next();

    // Build log entry from gateway context and response
    const url = new URL(c.req.url);

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      requestId:
        gateway?.requestId ?? c.res.headers.get("x-request-id") ?? "unknown",
      method: c.req.method,
      path: url.pathname,
      statusCode: c.res.status,
      durationMs: Date.now() - startTime,
      clientIp: extractClientIp(c.req.raw.headers, {
        ipHeaders: config.ipHeaders,
      }),
      userAgent: c.req.header("user-agent") ?? "unknown",
      gatewayName: gateway?.gatewayName ?? "unknown",
      routePath: gateway?.routePath ?? url.pathname,
      upstream: "unknown", // Enriched by proxy policy in future
      traceId: gateway?.traceId,
      spanId: gateway?.spanId,
    };

    if (requestBody !== undefined) {
      entry.requestBody = requestBody;
    }

    // Capture response body after downstream
    if (config.logResponseBody) {
      const responseBody = await captureResponseBody(
        c,
        maxBodyLength,
        config.redactPaths
      );
      if (responseBody !== undefined) {
        entry.responseBody = responseBody;
      }
    }

    // Extract custom fields
    if (config.extractFields) {
      try {
        entry.extra = config.extractFields(c);
      } catch {
        // Don't let field extraction break the request
      }
    }

    // Sink failure must never crash the request pipeline
    await safeCall(
      () => Promise.resolve(sink(entry)),
      undefined,
      debug,
      "sink()"
    );
  },
});

/**
 * Capture and optionally redact the request body.
 * Clones the request to avoid consuming the body stream.
 */
async function captureRequestBody(
  req: Request,
  maxLength: number,
  redactPaths?: string[]
): Promise<unknown> {
  try {
    // Clone so the original body stream stays available for downstream
    const cloned = req.clone();
    const text = await cloned.text();
    if (!text) return undefined;

    const truncated =
      text.length > maxLength
        ? `${text.slice(0, maxLength)}...[truncated]`
        : text;

    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      try {
        let parsed: unknown = JSON.parse(
          truncated.endsWith("...[truncated]") ? text.slice(0, maxLength) : text
        );
        if (redactPaths?.length) {
          parsed = redactFields(parsed, { paths: redactPaths });
        }
        return parsed;
      } catch {
        // Invalid JSON - return as string
        return truncated;
      }
    }

    return truncated;
  } catch {
    // Never break the request pipeline
    return undefined;
  }
}

/**
 * Capture and optionally redact the response body.
 * Clones the response to avoid consuming the body.
 */
async function captureResponseBody(
  c: { res: Response },
  maxLength: number,
  redactPaths?: string[]
): Promise<unknown> {
  try {
    // Clone the response so the original body remains consumable
    const cloned = c.res.clone();
    const text = await cloned.text();
    if (!text) return undefined;

    const truncated =
      text.length > maxLength
        ? `${text.slice(0, maxLength)}...[truncated]`
        : text;

    const contentType = c.res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      try {
        let parsed: unknown = JSON.parse(
          truncated.endsWith("...[truncated]") ? text.slice(0, maxLength) : text
        );
        if (redactPaths?.length) {
          parsed = redactFields(parsed, { paths: redactPaths });
        }
        return parsed;
      } catch {
        return truncated;
      }
    }

    return truncated;
  } catch {
    return undefined;
  }
}

function defaultSink(entry: LogEntry): void {
  console.log(JSON.stringify(entry));
}
