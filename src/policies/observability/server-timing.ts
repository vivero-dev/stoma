/**
 * Server-Timing policy - surfaces per-policy timing as W3C Server-Timing headers.
 *
 * Reads the `_policyTimings` context key populated by the pipeline and
 * emits standard `Server-Timing` and `X-Response-Time` response headers.
 * Browser DevTools display `Server-Timing` entries natively.
 *
 * Visibility modes control when headers are emitted:
 * - `"always"` - every response (dev, internal APIs)
 * - `"debug-only"` - only when the client sent `x-stoma-debug` (safe for production)
 * - `"conditional"` - user-provided predicate function
 *
 * @module server-timing
 */
import type { Context } from "hono";
import { GatewayError } from "../../core/errors";
import { escapeHeaderValue } from "../../utils/headers";
import { toSelfTimes } from "../../utils/timing";
import { definePolicy, isDebugRequested, Priority } from "../sdk";
import type { PolicyConfig } from "../types";

/** Visibility mode controlling when timing headers are emitted. */
export type ServerTimingVisibility = "always" | "debug-only" | "conditional";

export interface ServerTimingConfig extends PolicyConfig {
  /** Emit the `Server-Timing` header with per-policy breakdown. Default: `true`. */
  serverTimingHeader?: boolean;
  /** Emit the `X-Response-Time` header with total gateway time. Default: `true`. */
  responseTimeHeader?: boolean;
  /** Number of decimal places for duration values. Default: `1`. */
  precision?: number;
  /** Add a `total` entry to `Server-Timing`. Default: `true`. */
  includeTotal?: boolean;
  /** Optional function to generate a description for each timing entry. */
  descriptionFn?: (name: string) => string;
  /** Controls when timing headers are emitted. Default: `"debug-only"`. */
  visibility?: ServerTimingVisibility;
  /** Required when `visibility` is `"conditional"`. Called per-request to decide. */
  visibilityFn?: (c: Context) => boolean | Promise<boolean>;
}

// -- helpers (file-private) ---------------------------------------------------

/** Strip characters outside the Server-Timing token charset. */
function sanitizeMetricName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, "_");
}

/** Build a single Server-Timing entry string. */
function formatEntry(
  name: string,
  durationMs: number,
  precision: number,
  descriptionFn?: (name: string) => string
): string {
  const sanitized = sanitizeMetricName(name);
  const dur = durationMs.toFixed(precision);
  const desc = descriptionFn?.(name);
  if (desc) {
    return `${sanitized};dur=${dur};desc="${escapeHeaderValue(desc)}"`;
  }
  return `${sanitized};dur=${dur}`;
}

// -- policy -------------------------------------------------------------------

/**
 * Emit W3C `Server-Timing` and `X-Response-Time` response headers.
 *
 * Reads per-policy timing data from the pipeline instrumentation and
 * formats it as standard headers visible in browser DevTools.
 *
 * @param config - Optional configuration for headers, precision, and visibility.
 * @returns A {@link Policy} at priority 1 (METRICS).
 */
export const serverTiming = /*#__PURE__*/ definePolicy<ServerTimingConfig>({
  name: "server-timing",
  priority: Priority.METRICS,
  httpOnly: true,
  defaults: {
    serverTimingHeader: true,
    responseTimeHeader: true,
    precision: 1,
    includeTotal: true,
    visibility: "debug-only",
  },
  validate: (config) => {
    if (
      config.visibility === "conditional" &&
      typeof config.visibilityFn !== "function"
    ) {
      throw new GatewayError(
        500,
        "config-error",
        'serverTiming: visibility "conditional" requires a visibilityFn'
      );
    }
  },
  handler: async (c, next, { config, debug }) => {
    const startTime = Date.now();

    await next();

    // Evaluate visibility
    let visible: boolean;
    switch (config.visibility) {
      case "always":
        visible = true;
        break;
      case "conditional":
        visible = await config.visibilityFn!(c);
        break;
      default:
        visible = isDebugRequested(c);
        break;
    }

    if (!visible) {
      debug("skipping - visibility check failed");
      return;
    }

    const totalMs = Date.now() - startTime;
    const precision = config.precision!;

    // Read per-policy timings accumulated by policiesToMiddleware().
    // These are inclusive (onion-model) - convert to self-time for the header.
    const rawTimings = c.get("_policyTimings") as
      | Array<{ name: string; durationMs: number }>
      | undefined;
    const selfTimings = rawTimings ? toSelfTimes(rawTimings) : undefined;

    // Server-Timing header
    if (config.serverTimingHeader) {
      const entries: string[] = [];

      if (config.includeTotal) {
        entries.push(
          formatEntry("total", totalMs, precision, config.descriptionFn)
        );
      }

      if (selfTimings) {
        for (const t of selfTimings) {
          entries.push(
            formatEntry(t.name, t.durationMs, precision, config.descriptionFn)
          );
        }
      }

      if (entries.length > 0) {
        c.res.headers.set("server-timing", entries.join(", "));
        debug("Server-Timing: %s", entries.join(", "));
      }
    }

    // X-Response-Time header
    if (config.responseTimeHeader) {
      const value = `${totalMs.toFixed(precision)}ms`;
      c.res.headers.set("x-response-time", value);
      debug("X-Response-Time: %s", value);
    }
  },
});
