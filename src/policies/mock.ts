/**
 * Mock policy - return static responses for development and testing.
 *
 * @module mock
 */

import { definePolicy, Priority } from "./sdk";
import type { PolicyConfig } from "./types";

export interface MockConfig extends PolicyConfig {
  /** HTTP status code to return. Default: 200. */
  status?: number;
  /** Response body. Can be a string or object (will be JSON-serialized). */
  body?: string | Record<string, unknown>;
  /** Response headers. */
  headers?: Record<string, string>;
  /** Artificial delay in milliseconds. Default: 0. */
  delayMs?: number;
  /** When `true`, suppress the production usage warning. Default: `false`. */
  allowInProduction?: boolean;
}

/**
 * Return a static mock response, bypassing the upstream entirely.
 *
 * Useful for development stubs, testing, and placeholder routes. Runs at
 * priority 999 (always last) and short-circuits - `next()` is never called,
 * so no upstream request is made. Object bodies are automatically
 * JSON-serialized with `content-type: application/json`.
 *
 * @param config - Status code, response body, headers, and artificial delay. All fields optional.
 * @returns A {@link Policy} at priority 999 (replaces the upstream).
 *
 * @example
 * ```ts
 * import { createGateway } from "@homegrower-club/stoma";
 * import { mock } from "@homegrower-club/stoma/policies";
 *
 * createGateway({
 *   routes: [{
 *     path: "/api/stub",
 *     pipeline: {
 *       policies: [
 *         // Return a JSON stub with 200ms simulated latency
 *         mock({
 *           body: { message: "Hello from stub" },
 *           delayMs: 200,
 *         }),
 *       ],
 *       upstream: { type: "handler", handler: () => new Response() }, // never reached
 *     },
 *   }],
 * });
 *
 * // Simulate a 503 maintenance page
 * mock({
 *   status: 503,
 *   body: "Service temporarily unavailable",
 *   headers: { "retry-after": "300" },
 * });
 * ```
 */
export const mock = /*#__PURE__*/ definePolicy<MockConfig>({
  name: "mock",
  priority: Priority.MOCK,
  httpOnly: true,
  defaults: { status: 200, delayMs: 0 },
  validate: (config) => {
    if (!config.allowInProduction) {
      console.warn(
        "[stoma] mock policy active - intended for development/testing only"
      );
    }
  },
  handler: async (c, _next, { config }) => {
    if (config.delayMs! > 0) {
      await new Promise((resolve) => setTimeout(resolve, config.delayMs!));
    }

    const body =
      config.body === undefined
        ? null
        : typeof config.body === "string"
          ? config.body
          : JSON.stringify(config.body);

    const headers = new Headers(config.headers);
    if (typeof config.body === "object" && !headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    // Short-circuit: set the response directly, skipping upstream.
    // Middleware that ran before mock (context injector, auth, etc.)
    // already ran their pre-next() code. The context injector adds
    // x-request-id via c.res.headers after next(), which won't fire
    // for mock - but that's acceptable for mock/dev scenarios.
    c.res = new Response(body, { status: config.status!, headers });
  },
});
