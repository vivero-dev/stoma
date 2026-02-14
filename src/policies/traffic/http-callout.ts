/**
 * HTTP callout policy - make an external HTTP call mid-pipeline.
 *
 * Use cases include external authorization, token exchange, data enrichment,
 * and webhook notification before proxying to the upstream service.
 *
 * @module http-callout
 */
import type { Context } from "hono";
import { GatewayError } from "../../core/errors";
import { definePolicy, Priority } from "../sdk";
import type { PolicyConfig } from "../types";

export interface HttpCalloutConfig extends PolicyConfig {
  /** Target URL - static string or dynamic function. Required. */
  url: string | ((c: Context) => string | Promise<string>);
  /** HTTP method. Default: "GET". */
  method?: string;
  /** Request headers - static values or dynamic functions. */
  headers?: Record<string, string | ((c: Context) => string | Promise<string>)>;
  /** Request body - static or dynamic. JSON-serialized if object. */
  body?: unknown | ((c: Context) => unknown | Promise<unknown>);
  /** Timeout in ms. Default: 5000. */
  timeout?: number;
  /** Callback to process the callout response. Required. */
  onResponse: (response: Response, c: Context) => void | Promise<void>;
  /** Error handler. Default: throw GatewayError 502. */
  onError?: (error: unknown, c: Context) => void | Promise<void>;
  /** If true, throw on non-2xx response. Default: true. */
  abortOnFailure?: boolean;
}

/**
 * Make an external HTTP call mid-pipeline.
 *
 * Resolves URL, headers, and body (static or dynamic), makes the fetch,
 * and calls the `onResponse` callback to process the result. Errors are
 * handled via `onError` or default to a 502 GatewayError.
 *
 * @security When the `url` parameter is a dynamic function that derives
 * the callout target from request data (headers, path, query, or body),
 * this policy is vulnerable to Server-Side Request Forgery (SSRF). An
 * attacker could manipulate request data to make the worker issue requests
 * to internal services, metadata endpoints (e.g. cloud provider instance
 * metadata), or other unintended targets. Hardcode callout URLs whenever
 * possible. If dynamic URLs are required, validate them against an
 * explicit allowlist of permitted hosts and schemes.
 *
 * @param config - Callout target, method, headers, body, and response handler.
 * @returns A {@link Policy} at priority 50 (REQUEST_TRANSFORM).
 *
 * @example
 * ```ts
 * httpCallout({
 *   url: "https://auth.example.com/validate",
 *   method: "POST",
 *   headers: { authorization: (c) => c.req.header("authorization") ?? "" },
 *   body: (c) => ({ path: c.req.path }),
 *   onResponse: async (res, c) => {
 *     const data = await res.json();
 *     c.set("userId", data.userId);
 *   },
 * });
 * ```
 */
export const httpCallout = /*#__PURE__*/ definePolicy<HttpCalloutConfig>({
  name: "http-callout",
  priority: Priority.REQUEST_TRANSFORM,
  httpOnly: true,
  defaults: { method: "GET", timeout: 5000, abortOnFailure: true },
  handler: async (c, next, { config, debug }) => {
    // Resolve URL
    const url =
      typeof config.url === "function" ? await config.url(c) : config.url;

    // Resolve headers
    const resolvedHeaders: Record<string, string> = {};
    if (config.headers) {
      for (const [key, value] of Object.entries(config.headers)) {
        resolvedHeaders[key] =
          typeof value === "function" ? await value(c) : value;
      }
    }

    // Resolve body
    let resolvedBody: string | undefined;
    if (config.body !== undefined) {
      const raw =
        typeof config.body === "function"
          ? await (config.body as (c: Context) => unknown | Promise<unknown>)(c)
          : config.body;
      if (raw !== undefined && raw !== null) {
        resolvedBody = typeof raw === "string" ? raw : JSON.stringify(raw);
        if (typeof raw !== "string" && !resolvedHeaders["content-type"]) {
          resolvedHeaders["content-type"] = "application/json";
        }
      }
    }

    debug(`${config.method} ${url}`);

    let response: Response;
    try {
      response = await fetch(url, {
        method: config.method,
        headers: resolvedHeaders,
        body: resolvedBody,
        signal: AbortSignal.timeout(config.timeout!),
      });
    } catch (error) {
      if (config.onError) {
        await config.onError(error, c);
        await next();
        return;
      }
      throw new GatewayError(
        502,
        "callout_failed",
        `External callout failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // Check for non-2xx
    if (!response.ok && config.abortOnFailure) {
      if (config.onError) {
        await config.onError(
          new Error(`External callout returned ${response.status}`),
          c
        );
        await next();
        return;
      }
      throw new GatewayError(
        502,
        "callout_failed",
        `External callout returned ${response.status}`
      );
    }

    await config.onResponse(response, c);
    await next();
  },
});
