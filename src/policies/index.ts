/**
 * Policy barrel — re-exports all built-in policies, their config types, and the policy SDK.
 *
 * Import from `@homegrower-club/stoma/policies` for direct access to all policies
 * and their configuration types, or from `@homegrower-club/stoma` which re-exports
 * the most common symbols.
 *
 * @module policies
 */

// ── Root-level policies ─────────────────────────────────────────────────

/** Per-route header manipulation, timeout control, and Host header preservation (priority 95). */
export { proxy } from "./proxy";

/** Return a static mock response, bypassing the upstream entirely (priority 999). */
export { mock } from "./mock";

// ── Auth ────────────────────────────────────────────────────────────────

/** Validate JWT bearer tokens via HMAC secret or JWKS endpoint (priority 10). */
export { jwtAuth, clearJwksCache } from "./auth/jwt-auth";

/** Validate API keys from headers or query parameters (priority 10). */
export { apiKeyAuth } from "./auth/api-key-auth";

/** Validate HTTP Basic credentials with WWW-Authenticate challenge (priority 10). */
export { basicAuth } from "./auth/basic-auth";

/** Validate OAuth2 tokens via RFC 7662 introspection or local validation (priority 10). */
export { oauth2, clearOAuth2Cache } from "./auth/oauth2";

/** Role-based access control using claims forwarded as request headers (priority 10). */
export { rbac } from "./auth/rbac";

/** Mint JWTs (HMAC or RSA) and attach to outgoing requests (priority 50). */
export { generateJwt } from "./auth/generate-jwt";

/** Verify JWS compact serialization signatures — embedded or detached payloads (priority 10). */
export { jws, clearJwsJwksCache } from "./auth/jws";

/** Generate RFC 9421 HTTP Message Signatures on outbound requests (priority 95). */
export { generateHttpSignature } from "./auth/generate-http-signature";

/** Verify RFC 9421 HTTP Message Signatures on inbound requests (priority 10). */
export { verifyHttpSignature } from "./auth/verify-http-signature";

// ── Traffic ─────────────────────────────────────────────────────────────

/** Sliding-window rate limiting with pluggable counter storage (priority 20). */
export { rateLimit, InMemoryRateLimitStore } from "./traffic/rate-limit";

/** Block or allow requests by client IP address or CIDR range (priority 1). */
export { ipFilter } from "./traffic/ip-filter";

/** Block or allow requests by geographic country code (priority 1). */
export { geoIpFilter } from "./traffic/geo-ip-filter";

/** Response caching with pluggable storage and TTL (priority 40). */
export { cache, InMemoryCacheStore } from "./traffic/cache";

/** Enforce HTTPS with optional redirect (301) and HSTS header injection (priority 5). */
export { sslEnforce } from "./traffic/ssl-enforce";

/** Reject requests whose Content-Length exceeds a byte limit (priority 5). */
export { requestLimit } from "./traffic/request-limit";

/** Enforce structural limits on JSON bodies — depth, key count, string length, array size (priority 5). */
export { jsonThreatProtection } from "./traffic/json-threat-protection";

/** Block requests matching regex patterns in path, query, headers, or body (priority 5). */
export { regexThreatProtection } from "./traffic/regex-threat-protection";

/** Mirror traffic to a secondary upstream without affecting the primary response (priority 92). */
export { trafficShadow } from "./traffic/traffic-shadow";

/** Conditionally short-circuit the pipeline and return a static response (priority 100). */
export { interrupt } from "./traffic/interrupt";

/** Evaluate ordered routing rules and expose first match on context (priority 50). */
export { dynamicRouting } from "./traffic/dynamic-routing";

/** Make an external HTTP call mid-pipeline for authorization or enrichment (priority 50). */
export { httpCallout } from "./traffic/http-callout";

/** Strip or allow fields from JSON responses using dot-notation paths (priority 92). */
export { resourceFilter } from "./traffic/resource-filter";

// ── Resilience ──────────────────────────────────────────────────────────

/** Enforce a response time budget — races downstream against a timer (priority 85). */
export { timeout } from "./resilience/timeout";

/** Retry failed upstream calls with exponential or fixed backoff and jitter (priority 90). */
export { retry } from "./resilience/retry";

/** Three-state circuit breaker (closed/open/half-open) with pluggable state storage (priority 30). */
export { circuitBreaker, InMemoryCircuitBreakerStore } from "./resilience/circuit-breaker";

/** Inject artificial latency for chaos/resilience testing (priority 5). */
export { latencyInjection } from "./resilience/latency-injection";

// ── Transform ───────────────────────────────────────────────────────────

/** Add CORS headers to responses via Hono's built-in CORS middleware (priority 5). */
export { cors } from "./transform/cors";

/** Override the HTTP method of POST requests via a header (priority 5). */
export { overrideMethod } from "./transform/override-method";

/** Set key-value attributes on the Hono request context (priority 50). */
export { assignAttributes } from "./transform/assign-attributes";

/** Inject or override fields in JSON request/response bodies (priority 50). */
export { assignContent } from "./transform/assign-content";

/** Modify request headers (set/remove/rename, priority 50) and response headers (priority 92). */
export { requestTransform, responseTransform } from "./transform/transform";

/** Pluggable request body validation via user-provided sync/async function (priority 10). */
export { requestValidation } from "./transform/request-validation";

/** Pluggable JSON body validation — wrap Zod, AJV, or any validator (priority 10). */
export { jsonValidation } from "./transform/json-validation";

// ── Observability ───────────────────────────────────────────────────────

/** Structured JSON request logging with trace context, body capture, and redaction (priority 0). */
export { requestLog } from "./observability/request-log";

/** Record request counts, latencies, and errors to a pluggable MetricsCollector (priority 1). */
export { metricsReporter } from "./observability/metrics-reporter";

/** Attach metric tags/dimensions to request context for metricsReporter consumption (priority 0). */
export { assignMetrics } from "./observability/assign-metrics";

/** Create a health check route with optional upstream probing (returns a RouteConfig). */
export { health } from "../core/health";

// ── SDK — shared primitives for built-in and custom policies ────────────

export {
  /** Named priority constants for policy ordering. */
  Priority,
  /** Shallow-merge default config values with user-provided config. */
  resolveConfig,
  /** Get a debug logger pre-namespaced to `stoma:policy:{name}`. */
  policyDebug,
  /** Wrap a handler with `PolicyConfig.skip` conditional bypass logic. */
  withSkip,
  /** Create a policy factory from a declarative definition. */
  definePolicy,
  /** Create a minimal test harness for a policy. */
  createPolicyTestHarness,
} from "./sdk";

export type {
  /** Union of all named priority level values. */
  PriorityLevel,
  /** Declarative policy definition passed to definePolicy. */
  PolicyDefinition,
  /** Context injected into definePolicy handlers. */
  PolicyHandlerContext,
  /** Options for createPolicyTestHarness. */
  PolicyTestHarnessOptions,
} from "./sdk";

// ── Types ───────────────────────────────────────────────────────────────

/** A composable policy: name, priority, and Hono middleware handler. */
export type { Policy,
/** Base configuration for all policies, including the `skip` bypass predicate. */
  PolicyConfig,
/** Per-request gateway context: request ID, trace ID, span ID, timing, and debug factory. */
  PolicyContext } from "./types";

/** Pluggable storage backend for rate limit counters. */
export type { RateLimitStore,
/** Options for the in-memory rate limit store. */
  InMemoryRateLimitStoreOptions } from "./traffic/rate-limit";

/** Structured log entry emitted by the requestLog policy. */
export type { LogEntry } from "./observability/request-log";

/** Configuration for the timeout policy. */
export type { TimeoutConfig } from "./resilience/timeout";

/** Configuration for the retry policy. */
export type { RetryConfig } from "./resilience/retry";

/** Configuration for the ipFilter policy. */
export type { IpFilterConfig } from "./traffic/ip-filter";

/** Configuration for the geoIpFilter policy. */
export type { GeoIpFilterConfig } from "./traffic/geo-ip-filter";

/** Configuration for the rateLimit policy. */
export type { RateLimitConfig } from "./traffic/rate-limit";

/** Configuration for the jwtAuth policy. */
export type { JwtAuthConfig } from "./auth/jwt-auth";

/** Configuration for the oauth2 policy. */
export type { OAuth2Config } from "./auth/oauth2";

/** Configuration for the rbac policy. */
export type { RbacConfig } from "./auth/rbac";

/** Configuration for the requestLog policy. */
export type { RequestLogConfig } from "./observability/request-log";

/** Configuration for the metricsReporter policy. */
export type { MetricsReporterConfig } from "./observability/metrics-reporter";

/** Configuration for the overrideMethod policy. */
export type { OverrideMethodConfig } from "./transform/override-method";

/** Configuration for the assignAttributes policy. */
export type { AssignAttributesConfig } from "./transform/assign-attributes";

/** Configuration for requestTransform and responseTransform policies. */
export type { RequestTransformConfig, ResponseTransformConfig } from "./transform/transform";

/** Configuration for the assignMetrics policy. */
export type { AssignMetricsConfig } from "./observability/assign-metrics";

export type {
  /** Configuration for the circuitBreaker policy. */
  CircuitBreakerConfig,
  /** Pluggable storage backend for circuit breaker state. */
  CircuitBreakerStore,
  /** Point-in-time snapshot of a circuit's state and counters. */
  CircuitBreakerSnapshot,
  /** The three circuit breaker states: `"closed"`, `"open"`, `"half-open"`. */
  CircuitState,
} from "./resilience/circuit-breaker";

/** Configuration for the cache policy. */
export type { CacheConfig,
/** Pluggable cache storage backend. */
  CacheStore,
/** Options for the in-memory cache store. */
  InMemoryCacheStoreOptions } from "./traffic/cache";

/** Configuration for the sslEnforce policy. */
export type { SslEnforceConfig } from "./traffic/ssl-enforce";

/** Configuration for the requestLimit policy. */
export type { RequestLimitConfig } from "./traffic/request-limit";

/** Configuration for the interrupt policy. */
export type { InterruptConfig } from "./traffic/interrupt";

/** Configuration for the dynamicRouting policy. */
export type { DynamicRoutingConfig,
/** A single routing rule evaluated by the dynamicRouting policy. */
  RoutingRule } from "./traffic/dynamic-routing";

/** Configuration for the httpCallout policy. */
export type { HttpCalloutConfig } from "./traffic/http-callout";

/** Configuration for the latencyInjection policy. */
export type { LatencyInjectionConfig } from "./resilience/latency-injection";

/** Configuration for the requestValidation policy. */
export type { RequestValidationConfig } from "./transform/request-validation";

/** Configuration for the jsonThreatProtection policy. */
export type { JsonThreatProtectionConfig } from "./traffic/json-threat-protection";

/** Configuration for the regexThreatProtection policy. */
export type { RegexThreatProtectionConfig } from "./traffic/regex-threat-protection";

/** Configuration for the trafficShadow policy. */
export type { TrafficShadowConfig } from "./traffic/traffic-shadow";

/** Configuration for the assignContent policy. */
export type { AssignContentConfig } from "./transform/assign-content";

/** Configuration for the jsonValidation policy. */
export type { JsonValidationConfig,
/** Result shape returned by jsonValidation's user-provided validator. */
  JsonValidationResult } from "./transform/json-validation";

/** Configuration for the resourceFilter policy. */
export type { ResourceFilterConfig } from "./traffic/resource-filter";

/** Configuration for the generateJwt policy. */
export type { GenerateJwtConfig } from "./auth/generate-jwt";

/** Configuration for the jws policy. */
export type { JwsConfig } from "./auth/jws";

/** Configuration for the generateHttpSignature policy. */
export type { GenerateHttpSignatureConfig } from "./auth/generate-http-signature";

/** Configuration for the verifyHttpSignature policy. */
export type { VerifyHttpSignatureConfig,
/** Key material (HMAC secret or RSA public key) for HTTP signature verification. */
  HttpSignatureKey } from "./auth/verify-http-signature";

/** Configuration for the health route factory. */
export type { HealthConfig } from "../core/health";
