/**
 * Core type definitions for the stoma gateway.
 *
 * All gateway configuration is expressed through these types. The main entry
 * point is {@link GatewayConfig}, which composes {@link RouteConfig},
 * {@link PipelineConfig}, and {@link UpstreamConfig} into a fully declarative
 * gateway specification.
 *
 * @module types
 */
import type { Context, Hono } from "hono";
import type { GatewayAdapter } from "../adapters/types";
import type { MetricsCollector } from "../observability/metrics";
import type { TracingConfig } from "../observability/tracing";
import type { Policy } from "../policies/types";

/**
 * Top-level gateway configuration.
 *
 * @typeParam TBindings - Worker bindings type (e.g. your `Env` interface).
 *   Defaults to `Record<string, unknown>` so `service` on
 *   {@link ServiceBindingUpstream} accepts any string. When you pass your
 *   own Env type, `service` autocompletes to valid binding names.
 */
export interface GatewayConfig<TBindings = Record<string, unknown>> {
  /** Gateway name, used in logs and metrics */
  name?: string;
  /** Base path prefix for all routes (e.g. "/api") */
  basePath?: string;
  /** Route definitions */
  routes: RouteConfig<TBindings>[];
  /** Global policies applied to all routes */
  policies?: Policy[];
  /** Global error handler */
  onError?: (error: Error, c: Context) => Response | Promise<Response>;
  /**
   * Enable internal debug logging for gateway operators.
   *
   * - `true` - log all namespaces
   * - `false` / `undefined` - disabled (default, zero overhead)
   * - `string` - comma-separated glob patterns to filter namespaces
   *
   * Namespaces: `stoma:gateway`, `stoma:pipeline`, `stoma:upstream`,
   * `stoma:policy:*` (e.g. `stoma:policy:cache`, `stoma:policy:jwt-auth`)
   *
   * Output goes to `console.debug()` which is captured by `wrangler tail`
   * and Cloudflare Workers Logs.
   *
   * @example
   * ```ts
   * createGateway({ debug: true, ... })                         // everything
   * createGateway({ debug: "stoma:gateway,stoma:upstream", ... }) // core only
   * createGateway({ debug: "stoma:policy:*", ... })              // policies only
   * ```
   */
  debug?: boolean | string;
  /** Response header name for the request ID. Default: `"x-request-id"`. */
  requestIdHeader?: string;
  /**
   * Default HTTP methods for routes that don't specify `methods`.
   * Default: `["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]`.
   */
  defaultMethods?: HttpMethod[];
  /** Default error message for unexpected (non-GatewayError) errors. Default: `"An unexpected error occurred"`. */
  defaultErrorMessage?: string;
  /** Default priority for policies that don't specify one. Default: `100`. */
  defaultPolicyPriority?: number;
  /**
   * Runtime adapter providing store implementations and runtime-specific capabilities
   * (e.g. `waitUntil`, `dispatchBinding`). Created via adapter factories like
   * `cloudflareAdapter()`, `memoryAdapter()`, etc.
   */
  adapter?: GatewayAdapter;
  /**
   * Admin introspection API. Exposes `___gateway/*` routes for operational visibility.
   *
   * - `true` - enable with defaults (no auth)
   * - `AdminConfig` object - full customization
   * - `false` / `undefined` - disabled (default)
   */
  admin?: boolean | AdminConfig;
  /**
   * Enable client-requested debug headers.
   *
   * When enabled, clients can send an `x-stoma-debug` request header listing
   * the debug values they want returned as response headers. Policies contribute
   * debug data via {@link setDebugHeader} from the SDK - only requested values
   * are included in the response.
   *
   * - `true` - enable with defaults
   * - `DebugHeadersConfig` - full customization (request header name, allowlist)
   * - `false` / `undefined` - disabled (default, zero overhead)
   *
   * @example
   * ```
   * // Client request:
   * GET /api/users
   * x-stoma-debug: x-stoma-cache-key, x-stoma-cache-ttl
   *
   * // Response includes:
   * x-stoma-cache-key: GET:http://example.com/api/users
   * x-stoma-cache-ttl: 300
   * ```
   */
  debugHeaders?: boolean | DebugHeadersConfig;
  /**
   * OpenTelemetry-compatible distributed tracing.
   *
   * When configured, the gateway creates a root SERVER span per request,
   * INTERNAL child spans per policy, and CLIENT child spans for upstream
   * calls. Spans are exported asynchronously via `adapter.waitUntil()`.
   *
   * Zero overhead when not configured - no span objects are allocated.
   *
   * @example
   * ```ts
   * import { createGateway, OTLPSpanExporter } from "@homegrower-club/stoma";
   *
   * createGateway({
   *   tracing: {
   *     exporter: new OTLPSpanExporter({ endpoint: "https://otel-collector/v1/traces" }),
   *     serviceName: "my-api",
   *     sampleRate: 0.1,
   *   },
   *   // ...routes
   * });
   * ```
   */
  tracing?: TracingConfig;
}

/** Configuration for client-requested debug headers. */
export interface DebugHeadersConfig {
  /** Request header name clients use to request debug values. Default: `"x-stoma-debug"`. */
  requestHeader?: string;
  /** Allowlist of debug header names clients can request. When set, only these headers are emitted. Default: all. */
  allow?: string[];
}

/**
 * Individual route configuration.
 *
 * @typeParam TBindings - Worker bindings type, propagated from {@link GatewayConfig}.
 */
export interface RouteConfig<TBindings = Record<string, unknown>> {
  /** Route path pattern (Hono syntax, e.g. "/users/:id") */
  path: string;
  /** Allowed HTTP methods. Defaults to all. */
  methods?: HttpMethod[];
  /** Pipeline to process this route */
  pipeline: PipelineConfig<TBindings>;
  /** Route-level metadata for logging/observability */
  metadata?: Record<string, unknown>;
}

/**
 * Pipeline: ordered chain of policies leading to an upstream.
 *
 * @typeParam TBindings - Worker bindings type, propagated from {@link RouteConfig}.
 */
export interface PipelineConfig<TBindings = Record<string, unknown>> {
  /** Policies executed in order before the upstream */
  policies?: Policy[];
  /** Upstream target configuration */
  upstream: UpstreamConfig<TBindings>;
}

/**
 * Upstream target - where the request is forwarded.
 *
 * @typeParam TBindings - Worker bindings type, constrains {@link ServiceBindingUpstream.service}.
 */
export type UpstreamConfig<TBindings = Record<string, unknown>> =
  | UrlUpstream
  | ServiceBindingUpstream<TBindings>
  | HandlerUpstream;

/**
 * Proxy to a remote URL. The gateway clones the request, rewrites headers,
 * and forwards it via `fetch()`. SSRF protection ensures the rewritten URL
 * stays on the same origin as the target.
 */
export interface UrlUpstream {
  type: "url";
  /** Target URL (e.g. `"https://api.example.com"`). Validated at config time. */
  target: string;
  /** Rewrite the path before forwarding. Must not change the origin. */
  rewritePath?: (path: string) => string;
  /** Headers to add/override on the forwarded request. */
  headers?: Record<string, string>;
}

/**
 * Forward to another Cloudflare Worker via a Service Binding.
 * The binding must be configured in the consumer's `wrangler.jsonc`.
 *
 * @typeParam TBindings - Worker bindings type. When provided, `service`
 *   autocompletes to valid binding names from your Env interface.
 */
export interface ServiceBindingUpstream<TBindings = Record<string, unknown>> {
  type: "service-binding";
  /** Name of the Service Binding in `wrangler.jsonc` (e.g. `"AUTH_SERVICE"`). */
  service: Extract<keyof TBindings, string>;
  /** Rewrite the path before forwarding to the bound service. */
  rewritePath?: (path: string) => string;
}

/**
 * Invoke a custom handler function directly. Useful for health checks,
 * mock responses, or routes that don't proxy to an upstream.
 */
export interface HandlerUpstream {
  type: "handler";
  /** Handler function receiving the Hono context and returning a Response. */
  handler: (c: Context) => Response | Promise<Response>;
}

/** HTTP methods supported by gateway route registration. */
export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

/** Configuration for the admin introspection API. */
export interface AdminConfig {
  /** Enable admin routes. Default: `false`. */
  enabled: boolean;
  /** Path prefix for admin routes. Default: `"___gateway"`. */
  prefix?: string;
  /** Optional auth check - return `false` to deny access. */
  auth?: (c: Context) => boolean | Promise<boolean>;
  /** MetricsCollector instance for the `/metrics` endpoint. */
  metrics?: MetricsCollector;
}

/** Registered route information for admin introspection. */
export interface RegisteredRoute {
  path: string;
  methods: string[];
  policyNames: string[];
  upstreamType: string;
}

/** Registered policy information for admin introspection. */
export interface RegisteredPolicy {
  name: string;
  priority: number;
}

/** Internal registry for admin introspection. */
export interface GatewayRegistry {
  routes: RegisteredRoute[];
  policies: RegisteredPolicy[];
  gatewayName: string;
}

/** The instantiated gateway - a configured Hono app */
export interface GatewayInstance {
  /** The underlying Hono app, ready to be exported as a Worker */
  app: Hono;
  /** Registered route count */
  routeCount: number;
  /** Gateway name */
  name: string;
  /** Internal registry for admin introspection */
  _registry: GatewayRegistry;
}
