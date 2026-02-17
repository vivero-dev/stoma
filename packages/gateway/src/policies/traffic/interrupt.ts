/**
 * Interrupt policy - conditionally short-circuit the pipeline with a static response.
 *
 * @module interrupt
 */
import type { Context } from "hono";
import { definePolicy, Priority } from "../sdk";
import type { PolicyConfig } from "../types";

export interface InterruptConfig extends PolicyConfig {
  /** Predicate that determines whether to short-circuit. Required. */
  condition: (c: Context) => boolean | Promise<boolean>;
  /** HTTP status code for the interrupt response. Default: 200. */
  statusCode?: number;
  /** Response body. String → text/plain, object → application/json, undefined → empty. */
  body?: unknown;
  /** Additional response headers. */
  headers?: Record<string, string>;
}

/**
 * Conditionally short-circuit the pipeline and return a static response.
 *
 * Evaluates a predicate against the incoming request context. When the
 * condition returns `true`, the pipeline is interrupted - a response is
 * returned immediately and `next()` is never called (upstream is skipped).
 * When the condition returns `false`, the pipeline continues normally.
 *
 * @param config - Condition predicate, status code, body, and headers.
 * @returns A {@link Policy} at priority 100 (default - users typically set a custom priority).
 *
 * @example
 * ```ts
 * // Maintenance mode
 * interrupt({
 *   condition: (c) => c.req.header("x-maintenance") === "true",
 *   statusCode: 503,
 *   body: { maintenance: true, message: "Back soon" },
 *   headers: { "retry-after": "300" },
 * });
 *
 * // Health check short-circuit
 * interrupt({
 *   condition: (c) => c.req.path === "/healthz",
 *   body: "ok",
 * });
 * ```
 */
export const interrupt = /*#__PURE__*/ definePolicy<InterruptConfig>({
  name: "interrupt",
  priority: Priority.DEFAULT,
  httpOnly: true,
  defaults: { statusCode: 200, headers: {} },
  handler: async (c, next, { config, debug }) => {
    const shouldInterrupt = await config.condition(c);

    if (!shouldInterrupt) {
      debug("condition false, continuing pipeline");
      await next();
      return;
    }

    debug("condition true, short-circuiting");

    const responseHeaders = new Headers(config.headers);

    let body: string | null = null;
    if (config.body === undefined || config.body === null) {
      // empty body
    } else if (typeof config.body === "string") {
      body = config.body;
      if (!responseHeaders.has("content-type")) {
        responseHeaders.set("content-type", "text/plain");
      }
    } else {
      body = JSON.stringify(config.body);
      if (!responseHeaders.has("content-type")) {
        responseHeaders.set("content-type", "application/json");
      }
    }

    c.res = new Response(body, {
      status: config.statusCode!,
      headers: responseHeaders,
    });
  },
});
