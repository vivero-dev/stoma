/**
 * Stoma - declarative API gateway as a TypeScript library.
 *
 * Built on Hono for Cloudflare Workers and edge runtimes. Define routes,
 * compose policies (auth, rate limiting, caching, transforms), and proxy
 * to upstream services - all from a single configuration object.
 *
 * @packageDocumentation
 *
 * @example
 * ```ts
 * import {
 *   createGateway,
 *   cors,
 *   jwtAuth,
 *   rateLimit,
 *   cache,
 *   requestLog,
 *   health,
 * } from "@homegrower-club/stoma";
 *
 * const gateway = createGateway({
 *   name: "my-api",
 *   basePath: "/api",
 *   debug: env.DEBUG,
 *   policies: [cors(), requestLog(), rateLimit({ max: 100 })],
 *   routes: [
 *     health(),
 *     {
 *       path: "/users/*",
 *       pipeline: {
 *         policies: [
 *           jwtAuth({ secret: env.JWT_SECRET }),
 *           cache({ ttlSeconds: 60 }),
 *         ],
 *         upstream: { type: "url", target: "https://users.internal" },
 *       },
 *     },
 *   ],
 * });
 *
 * export default gateway.app;
 * ```
 */

// ── Protocol - multi-runtime policy evaluation ──────────────────────────

export type {
  /** Set a cross-policy attribute in PolicyResult mutations. */
  AttributeMutation,
  /** Replace or clear the message body in PolicyResult mutations. */
  BodyMutation,
  /** Add, remove, or append a header in PolicyResult mutations. */
  HeaderMutation,
  /** A discrete modification (header, body, status, attribute) applied via PolicyResult. */
  Mutation,
  /** Allow processing to continue, optionally with mutations. */
  PolicyContinue,
  /** Runtime-facing evaluation context (no typed config - see PolicyEvalHandlerContext for typed version). */
  PolicyEvalContext,
  /** Protocol-agnostic policy evaluation entry point (onRequest, onResponse). */
  PolicyEvaluator,
  /** Short-circuit with a complete non-error response (cache hit, mock, redirect). */
  PolicyImmediateResponse,
  /** Protocol-agnostic view of what's being processed - constructed by each runtime. */
  PolicyInput,
  /** Reject the request with a structured error response. */
  PolicyReject,
  /** The outcome of a policy evaluation: continue, reject, or immediate-response. */
  PolicyResult,
  /** Lifecycle phase a policy participates in (request-headers, response-body, etc.). */
  ProcessingPhase,
  /** Identifies the protocol runtime (http, grpc, websocket). */
  ProtocolType,
  /** Modify the response status code in PolicyResult mutations. */
  StatusMutation,
} from "./core/protocol";

// ── Core ────────────────────────────────────────────────────────────────

/** Standard JSON error response shape returned by all gateway errors. */
export type { ErrorResponse } from "./core/errors";
/** Structured error with HTTP status, machine-readable code, and optional response headers. */
/** Build a JSON Response from a GatewayError, merging custom headers and request ID. */
/** Produce a generic 500 error response for unexpected (non-GatewayError) errors. */
export {
  defaultErrorResponse,
  errorToResponse,
  GatewayError,
} from "./core/errors";
/** Compile a declarative {@link GatewayConfig} into a Hono app with policy pipelines and upstream dispatch. */
export { createGateway } from "./core/gateway";
/** Retrieve the {@link PolicyContext} (request ID, trace ID, timing) from a Hono context. */
export { getGatewayContext } from "./core/pipeline";
export type {
  /** Configuration for a route scope: prefix, shared policies, child routes, and metadata. */
  ScopeConfig,
} from "./core/scope";
/** Group routes under a shared path prefix with shared policies and metadata. */
export { scope } from "./core/scope";
export type {
  /** Admin introspection API configuration (auth, prefix, metrics collector). */
  AdminConfig,
  /** Configuration for client-requested debug headers (request header name, allowlist). */
  DebugHeadersConfig,
  /** Top-level gateway configuration: routes, global policies, error handling, debug, and adapter. */
  GatewayConfig,
  /** The instantiated gateway: a configured Hono app, route count, name, and internal registry. */
  GatewayInstance,
  /** Internal registry of all routes and policies, used by the admin introspection API. */
  GatewayRegistry,
  /** Invoke a custom handler function directly (no upstream proxy). */
  HandlerUpstream,
  /** HTTP methods supported by gateway route registration. */
  HttpMethod,
  /** Pipeline definition: ordered policy chain leading to an upstream target. */
  PipelineConfig,
  /** Policy metadata (name + priority) recorded in the gateway registry. */
  RegisteredPolicy,
  /** Route metadata recorded in the gateway registry for admin introspection. */
  RegisteredRoute,
  /** Individual route definition: path, methods, and pipeline (policies + upstream). */
  RouteConfig,
  /** Forward to a Cloudflare Worker via a named Service Binding. */
  ServiceBindingUpstream,
  /** Discriminated union of upstream types: URL proxy, Service Binding, or custom handler. */
  UpstreamConfig,
  /** Proxy to a remote URL with optional path rewriting and header overrides. */
  UrlUpstream,
} from "./core/types";

// ── Policies - root-level ───────────────────────────────────────────────

/** Return a static mock response, bypassing the upstream entirely (priority 999). */
export { mock } from "./policies/mock";
/** Per-route header manipulation, timeout control, and Host header preservation (priority 95). */
export { proxy } from "./policies/proxy";

// ── Policies - auth ─────────────────────────────────────────────────────

/** Validate API keys from headers or query parameters using a custom validator function (priority 10). */
export { apiKeyAuth } from "./policies/auth/api-key-auth";
/** Validate HTTP Basic credentials with a custom validator and WWW-Authenticate challenge (priority 10). */
export { basicAuth } from "./policies/auth/basic-auth";
/** Clear the shared JWKS cache used by jwt-auth and jws. Intended for testing. */
export { clearJwksCache } from "./policies/auth/crypto";
/** Generate RFC 9421 HTTP Message Signatures on outbound requests (priority 95). */
export { generateHttpSignature } from "./policies/auth/generate-http-signature";
/** Mint JWTs (HMAC or RSA) and attach them to outgoing requests for upstream consumption (priority 50). */
export { generateJwt } from "./policies/auth/generate-jwt";
/** Verify JWS compact serialization signatures - embedded or detached payloads, HMAC or JWKS (priority 10). */
export { jws } from "./policies/auth/jws";
/** Validate JWT bearer tokens via HMAC secret or JWKS endpoint, with optional claim forwarding (priority 10). */
export { jwtAuth } from "./policies/auth/jwt-auth";
/** Validate OAuth2 tokens via RFC 7662 introspection or a local validation function (priority 10). */
export { oauth2 } from "./policies/auth/oauth2";
/** Role-based access control using claims forwarded as request headers by auth policies (priority 10). */
export { rbac } from "./policies/auth/rbac";

/** Verify RFC 9421 HTTP Message Signatures on inbound requests with key ID lookup (priority 10). */
export { verifyHttpSignature } from "./policies/auth/verify-http-signature";

// ── Policies - traffic ──────────────────────────────────────────────────

/** Response caching with pluggable storage, TTL, and automatic cache-control headers (priority 40). */
export { cache, InMemoryCacheStore } from "./policies/traffic/cache";
/** Evaluate ordered routing rules and expose the first match on context for downstream consumption (priority 50). */
export { dynamicRouting } from "./policies/traffic/dynamic-routing";

/** Block or allow requests by geographic country code from a configurable header (priority 1). */
export { geoIpFilter } from "./policies/traffic/geo-ip-filter";
/** Make an external HTTP call mid-pipeline for authorization, enrichment, or webhook notification (priority 50). */
export { httpCallout } from "./policies/traffic/http-callout";
/** Conditionally short-circuit the pipeline and return a static response based on a predicate (priority 100). */
export { interrupt } from "./policies/traffic/interrupt";
/** Block or allow requests by client IP address or CIDR range in allowlist/denylist mode (priority 1). */
export { ipFilter } from "./policies/traffic/ip-filter";

/** Enforce structural limits on JSON request bodies - depth, key count, string length, array size (priority 5). */
export { jsonThreatProtection } from "./policies/traffic/json-threat-protection";
/** Sliding-window rate limiting with pluggable counter storage and configurable key extraction (priority 20). */
export { rateLimit } from "./policies/traffic/rate-limit";
/** Block requests matching regex patterns (SQL injection, XSS, etc.) in path, query, headers, or body (priority 5). */
export { regexThreatProtection } from "./policies/traffic/regex-threat-protection";
/** Reject requests whose Content-Length exceeds a byte limit (priority 5). */
export { requestLimit } from "./policies/traffic/request-limit";
/** Strip or allow fields from JSON responses using dot-notation paths in allow/deny mode (priority 92). */
export { resourceFilter } from "./policies/traffic/resource-filter";
/** Enforce HTTPS with optional redirect (301) and HSTS header injection (priority 5). */
export { sslEnforce } from "./policies/traffic/ssl-enforce";
/** Mirror a percentage of traffic to a secondary upstream without affecting the primary response (priority 92). */
export { trafficShadow } from "./policies/traffic/traffic-shadow";

// ── Policies - resilience ───────────────────────────────────────────────

/** Three-state circuit breaker (closed/open/half-open) with pluggable state storage (priority 30). */
export {
  circuitBreaker,
  InMemoryCircuitBreakerStore,
} from "./policies/resilience/circuit-breaker";
/** Inject artificial latency for chaos/resilience testing with jitter and probability controls (priority 5). */
export { latencyInjection } from "./policies/resilience/latency-injection";
/** Retry failed upstream calls with exponential or fixed backoff, jitter, and method filtering (priority 90). */
export { retry } from "./policies/resilience/retry";
/** Enforce a response time budget - races downstream execution against a configurable timer (priority 85). */
export { timeout } from "./policies/resilience/timeout";

// ── Policies - transform ────────────────────────────────────────────────

/** Set key-value attributes on the Hono request context for downstream middleware consumption (priority 50). */
export { assignAttributes } from "./policies/transform/assign-attributes";
/** Inject or override fields in JSON request and/or response bodies with static or dynamic values (priority 50). */
export { assignContent } from "./policies/transform/assign-content";
/** Add CORS headers to responses, wrapping Hono's built-in CORS middleware as a composable policy (priority 5). */
export { cors } from "./policies/transform/cors";
/** Pluggable JSON body validation - wrap Zod, AJV, or any validator; falls back to JSON parse check (priority 10). */
export { jsonValidation } from "./policies/transform/json-validation";
/** Override the HTTP method of POST requests via a configurable header (priority 5). */
export { overrideMethod } from "./policies/transform/override-method";

/** Pluggable request body validation using a user-provided sync or async function (priority 10). */
export { requestValidation } from "./policies/transform/request-validation";
/** Modify request headers (set/remove/rename) before the upstream call (priority 50). */
export {
  requestTransform,
  /** Modify response headers (set/remove/rename) after the upstream responds (priority 92). */
  responseTransform,
} from "./policies/transform/transform";

// ── Policies - observability ────────────────────────────────────────────

/** Create a health check route with optional upstream probing (returns a RouteConfig, not a Policy). */
export { health } from "./core/health";
/** Attach metric tags/dimensions to the request context for consumption by metricsReporter (priority 0). */
export { assignMetrics } from "./policies/observability/assign-metrics";
/** Record request counts, latencies, and errors to a pluggable {@link MetricsCollector} (priority 1). */
export { metricsReporter } from "./policies/observability/metrics-reporter";
/** Structured JSON request logging with W3C trace context, body capture, and field redaction (priority 0). */
export { requestLog } from "./policies/observability/request-log";
/** Emit W3C Server-Timing and X-Response-Time response headers with per-policy breakdown (priority 1). */
export { serverTiming } from "./policies/observability/server-timing";

// ── Observability ───────────────────────────────────────────────────────

/** In-memory metrics collector for testing and development. */
export {
  InMemoryMetricsCollector,
  /** Serialize a {@link MetricsSnapshot} to Prometheus text exposition format. */
  toPrometheusText,
} from "./observability/metrics";
export type {
  /** An immutable representation of a completed span. */
  ReadableSpan,
  /** A timestamped event recorded during a span's lifetime. */
  SpanEvent,
  /** Pluggable span exporter interface. */
  SpanExporter,
  /** Span kind: SERVER, CLIENT, or INTERNAL. */
  SpanKind,
  /** Span status code: UNSET, OK, or ERROR. */
  SpanStatusCode,
  /** Configuration for gateway-level tracing. */
  TracingConfig,
} from "./observability/tracing";
/** Console span exporter for development and debugging. */
export {
  ConsoleSpanExporter,
  /** OTLP/HTTP JSON span exporter for OpenTelemetry Collectors. */
  OTLPSpanExporter,
  /** OTel semantic convention attribute keys (HTTP subset). */
  SemConv,
  /** Mutable span builder - accumulates attributes, events, and status during a request lifecycle. */
  SpanBuilder,
} from "./observability/tracing";

// ── Policy SDK - shared primitives for built-in and custom policies ─────

export type {
  /** Declarative policy definition passed to {@link definePolicy}. */
  PolicyDefinition,
  /** Context injected into `definePolicy` evaluate handlers (protocol-agnostic, with typed config). */
  PolicyEvalHandlerContext,
  /** Conditional factory type - config required when TConfig has required keys. */
  PolicyFactory,
  /** Context injected into `definePolicy` handlers: merged config, debug logger, and gateway context. */
  PolicyHandlerContext,
  /** Options for {@link createPolicyTestHarness}: custom upstream, path, gateway name, adapter. */
  PolicyTestHarnessOptions,
  /** Full trace payload emitted as `x-stoma-trace`. */
  PolicyTrace,
  /** Policy-reported trace detail. */
  PolicyTraceDetail,
  /** Combined trace entry (baseline + detail). */
  PolicyTraceEntry,
  /** Union of all named priority level values. */
  PriorityLevel,
  /** Trace reporter function type. */
  TraceReporter,
} from "./policies/sdk";
export {
  /** Create a minimal test harness for a policy with error handling, context injection, and configurable upstream. */
  createPolicyTestHarness,
  /** Create a policy factory from a declarative definition - combines resolveConfig, policyDebug, and withSkip. */
  definePolicy,
  /** Check whether the client requested debug output via the `x-stoma-debug` header. */
  isDebugRequested,
  /** Fast-path check: is tracing requested for this request? */
  isTraceRequested,
  /** Shared no-op trace reporter instance. */
  noopTraceReporter,
  /** Named priority constants (OBSERVABILITY, AUTH, RATE_LIMIT, etc.) for policy ordering. */
  Priority,
  /** Get a debug logger pre-namespaced to `stoma:policy:{name}` from the gateway context. */
  policyDebug,
  /** Get a trace reporter for a specific policy - always callable, no-op when not tracing. */
  policyTrace,
  /** Shallow-merge default config values with user-provided config. */
  resolveConfig,
  /** Execute an async operation with graceful error handling - returns a fallback value on failure. */
  safeCall,
  /** Set a debug header value for client-requested debug output. */
  setDebugHeader,
  /** Wrap a middleware handler with `PolicyConfig.skip` conditional bypass logic. */
  withSkip,
} from "./policies/sdk";

// ── Debug ───────────────────────────────────────────────────────────────

/** A debug logging function - call with a message and optional structured data. */
export type { DebugLogger } from "./utils/debug";

// ── Utilities ───────────────────────────────────────────────────────────

/** Extract the client IP from request headers using a configurable header priority list. */
export {
  /** Default ordered list of headers inspected for client IP (`cf-connecting-ip`, `x-forwarded-for`). */
  DEFAULT_IP_HEADERS,
  extractClientIp,
} from "./utils/ip";

/** Constant-time string comparison for secrets and API keys - prevents timing side-channel attacks. */
export { timingSafeEqual } from "./utils/timing-safe";

// ── Types ───────────────────────────────────────────────────────────────

/** Runtime adapter providing store implementations and platform-specific capabilities. */
export type { GatewayAdapter } from "./adapters/types";

export type {
  /** A histogram data point with accumulated numeric values. */
  HistogramEntry,
  /** Pluggable metrics collector interface - increment counters, record histograms, set gauges. */
  MetricsCollector,
  /** Point-in-time snapshot of all collected metrics (counters, histograms, gauges). */
  MetricsSnapshot,
  /** A single tagged metric data point with a numeric value. */
  TaggedValue,
} from "./observability/metrics";

/** Configuration for the {@link metricsReporter} policy. */
export type { MetricsReporterConfig } from "./policies/observability/metrics-reporter";

/** Configuration for the {@link serverTiming} policy. */
export type {
  ServerTimingConfig,
  /** Visibility mode for the serverTiming policy. */
  ServerTimingVisibility,
} from "./policies/observability/server-timing";
export type {
  /** Point-in-time snapshot of a circuit's state, failure/success counts, and timestamps. */
  CircuitBreakerSnapshot,
  /** Pluggable storage backend for circuit breaker state. */
  CircuitBreakerStore,
  /** The three circuit breaker states: `"closed"`, `"open"`, `"half-open"`. */
  CircuitState,
} from "./policies/resilience/circuit-breaker";
/** Pluggable cache storage backend - get, put, and delete cached responses. */
export type {
  CacheStore,
  InMemoryCacheStoreOptions,
} from "./policies/traffic/cache";
/** Pluggable storage backend for rate limit counters. */
export type {
  /** Options for the built-in in-memory rate limit store (max keys, cleanup interval). */
  InMemoryRateLimitStoreOptions,
  RateLimitStore,
} from "./policies/traffic/rate-limit";
export type {
  /** A composable policy: name, priority, and Hono middleware handler. */
  Policy,
  /** Base configuration interface for all policies - includes the `skip` conditional bypass. */
  PolicyConfig,
  /** Per-request gateway context: request ID, trace ID, span ID, timing, debug factory, and adapter. */
  PolicyContext,
} from "./policies/types";
