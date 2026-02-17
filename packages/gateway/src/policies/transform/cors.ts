/**
 * CORS policy wrapping Hono's built-in CORS middleware.
 *
 * @module cors
 */
import { cors as honoCors } from "hono/cors";
import { Priority, withSkip } from "../sdk";
import type { Policy, PolicyConfig } from "../types";

export interface CorsConfig extends PolicyConfig {
  /** Allowed origins. Default: "*" */
  origins?: string | string[] | ((origin: string) => boolean);
  /** Allowed HTTP methods. Default: all. */
  methods?: string[];
  /** Headers the client is allowed to send. */
  allowHeaders?: string[];
  /** Headers exposed to the client. */
  exposeHeaders?: string[];
  /** Max age for preflight cache in seconds. Default: 86400. */
  maxAge?: number;
  /** Allow credentials. Default: false. */
  credentials?: boolean;
}

/**
 * Add Cross-Origin Resource Sharing headers to gateway responses.
 *
 * Wraps Hono's built-in CORS middleware as a composable policy. Handles both
 * simple and preflight (OPTIONS) requests. Runs at priority 5 so CORS headers
 * are applied before auth or other policies reject the request.
 *
 * @param config - Origin rules, allowed methods/headers, and credentials. All fields optional.
 * @returns A {@link Policy} at priority 5 (runs very early).
 *
 * @example
 * ```ts
 * import { createGateway } from "@homegrower-club/stoma";
 * import { cors } from "@homegrower-club/stoma/policies";
 *
 * // Allow any origin (default)
 * createGateway({
 *   policies: [cors()],
 *   routes: [{ path: "/api/*", pipeline: { upstream: { type: "url", target: "https://api.example.com" } } }],
 * });
 *
 * // Restrict to specific origins with credentials
 * cors({
 *   origins: ["https://app.example.com", "https://staging.example.com"],
 *   methods: ["GET", "POST", "PUT", "DELETE"],
 *   credentials: true,
 *   maxAge: 3600,
 * });
 *
 * // Dynamic origin validation
 * cors({
 *   origins: (origin) => origin.endsWith(".example.com"),
 * });
 * ```
 */
export function cors(config?: CorsConfig): Policy {
  const origin = config?.origins ?? "*";
  const honoMiddleware = honoCors({
    origin: typeof origin === "function" ? (o) => (origin(o) ? o : "") : origin,
    allowMethods: config?.methods,
    allowHeaders: config?.allowHeaders,
    exposeHeaders: config?.exposeHeaders,
    maxAge: config?.maxAge,
    credentials: config?.credentials,
  });

  return {
    name: "cors",
    priority: Priority.EARLY,
    handler: withSkip(config?.skip, honoMiddleware),
    httpOnly: true,
  };
}
