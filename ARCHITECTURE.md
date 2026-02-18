# Architecture

## Overview

`@vivero/stoma` is a declarative API gateway implemented as a TypeScript library on top of [Hono](https://hono.dev). A consumer provides a `GatewayConfig` object describing routes, policies, and upstreams; the library compiles that config into a composable Hono middleware pipeline where each policy is a named, prioritized middleware handler and every pipeline terminates at an upstream target. The result is a standard Hono `app` that runs on any runtime Hono supports: Cloudflare Workers, Node.js (via `@hono/node-server`), Deno, Bun, Fastly, Lambda@Edge, and Vercel Edge Functions.

The core gateway depends only on Hono and the Web `Request`/`Response` API. Runtime-specific capabilities (distributed stores, background tasks, service bindings) are injected through a pluggable adapter system.

## Core Concepts

### Gateway

The top-level container. `createGateway(config)` accepts a `GatewayConfig` and returns a `GatewayInstance` wrapping a fully-configured Hono app. The gateway owns global concerns: a name (used in logs and tracing), an optional `basePath` prefix applied to all routes, global policies that execute on every request, an optional adapter for runtime-specific capabilities, and a global error handler.

```typescript
interface GatewayInstance {
  app: Hono;           // The Hono app, ready to export or serve
  routeCount: number;  // Number of registered routes
  name: string;        // Gateway name for observability
  _registry: GatewayRegistry; // Internal registry for admin introspection
}
```

### Route

A route binds a path pattern and optional HTTP method filter to a pipeline. Path patterns use Hono syntax (`/users/:id`, `/v1/*`). When `methods` is omitted, the route accepts all HTTP methods. Routes can carry arbitrary `metadata` for logging and observability.

```typescript
interface RouteConfig {
  path: string;
  methods?: HttpMethod[];
  pipeline: PipelineConfig;
  metadata?: Record<string, unknown>;
}
```

### Pipeline

An ordered chain of policies terminating at an upstream target. The pipeline is the core execution unit: policies run in priority order (lowest number first), and the final step dispatches the request to the configured upstream. A pipeline belongs to exactly one route.

```typescript
interface PipelineConfig {
  policies?: Policy[];
  upstream: UpstreamConfig;
}
```

### Policy

A named Hono middleware with metadata. Policies are the unit of reusable gateway logic -- authentication, rate limiting, logging, header manipulation, request transformation. Each policy has a `name` for identification, a `priority` for ordering, and a `handler` that is a standard Hono `MiddlewareHandler`.

```typescript
interface Policy {
  name: string;
  handler: MiddlewareHandler;
  priority?: number;  // Default: 100. Lower = earlier execution.
}
```

### Upstream

The terminal destination for a request after all policies have executed. Represented as a discriminated union with three variants:

| Variant            | `type`              | Mechanism                                      | Runtime support |
|--------------------|---------------------|-------------------------------------------------|-----------------|
| `UrlUpstream`      | `"url"`             | HTTP proxy to an external URL via `fetch()`     | All runtimes    |
| `ServiceBindingUpstream` | `"service-binding"` | Cloudflare Service Binding (zero network hops) | Cloudflare Workers only |
| `HandlerUpstream`  | `"handler"`         | Inline function for custom response logic       | All runtimes    |

### Adapter

A bag of optional store implementations and runtime-specific capabilities. The gateway core never imports platform-specific code directly; it accesses capabilities through the `GatewayAdapter` interface.

```typescript
interface GatewayAdapter {
  rateLimitStore?: RateLimitStore;
  circuitBreakerStore?: CircuitBreakerStore;
  cacheStore?: CacheStore;
  waitUntil?: (promise: Promise<unknown>) => void;
  dispatchBinding?: (service: string, request: Request) => Promise<Response>;
}
```

Adapter factories ship for each supported runtime:

| Factory | What it provides |
|---------|-----------------|
| `cloudflareAdapter()` | KV/Durable Object rate limiting, Cache API caching, `waitUntil`, service binding dispatch |
| `nodeAdapter()` | Marker/extension point for Node.js-specific capabilities |
| `denoAdapter()` | Marker/extension point for Deno-specific capabilities |
| `bunAdapter()` | Marker/extension point for Bun-specific capabilities |
| `memoryAdapter()` | In-memory stores for all interfaces (development, testing, single-instance) |

When no adapter is provided, policies that need stores fall back to in-memory defaults.

## Request Lifecycle

Every request follows this path through the gateway:

```
Client Request
    |
    v
+----------------------------+
|  Context Injection         |  requestId, startTime, traceId, spanId
+----------------------------+
    |
    v
+----------------------------+
|  Merged Policy Chain       |  Global + route policies, sorted by priority:
|    request-log (p:0)       |    - each calls next() to continue
|    cors (p:5)              |    - or returns early to short-circuit
|    jwt-auth (p:10)         |
|    rate-limit (p:20)       |
|    circuit-breaker (p:30)  |
|    cache (p:40)            |
|    timeout (p:85)          |
|    proxy (p:95)            |
+----------------------------+
    |
    v
+----------------------------+
|  Upstream Resolution       |  Dispatch to URL, Service Binding, or handler
+----------------------------+
    |
    v
+----------------------------+
|  Response Pipeline         |  Policies unwind in reverse order
|  (reverse priority order)  |    - response headers, logging, timing
+----------------------------+
    |
    v
Client Response
```

**Step-by-step:**

1. **Request ingress.** The Hono app receives the raw `Request` from the runtime (Cloudflare Worker `fetch` handler, `@hono/node-server`, `Deno.serve`, Bun, etc.).

2. **Context injection.** A context injector middleware generates a unique request ID (`crypto.randomUUID()`), records the start time, and extracts or generates W3C trace context (`traceId`, `spanId`). These values are stored in `PolicyContext`, accessible by all policies via `c.get("gateway")`.

3. **Policy chain execution.** The merged and priority-sorted policy chain executes. For each policy:
   - If the policy's config includes a `skip` function that returns `true`, the policy is bypassed.
   - The policy handler runs. It can short-circuit by returning a `Response` without calling `next()`, or call `next()` to continue the chain.
   - Per-policy timing is recorded for observability.

4. **Upstream dispatch.** If all policies call `next()`, the request reaches the upstream handler. The upstream type determines the dispatch mechanism (see Upstream Resolution below).

5. **Response unwind.** After the upstream responds, control flows back through the middleware stack in reverse order. Policies that ran `await next()` resume execution after their `next()` call -- this is where response logging, header injection, and timing calculations happen.

6. **Response egress.** The final `Response` is returned to the client.

## Policy System

### Priority-Based Ordering

Policies are sorted by their `priority` field before being registered as Hono middleware. Lower numbers execute earlier. Default priority is 100.

```
Priority 0    request-log       Always first: starts timer, captures metadata
Priority 1    ip-filter         Network-level filtering (before auth)
Priority 1    metrics-reporter  Metrics collection
Priority 5    cors, ssl-enforce Early transforms and request limits
Priority 10   jwt-auth          Authentication before authorization
Priority 10   api-key-auth      Alternative auth (same tier as JWT)
Priority 20   rate-limit        Rate limiting after auth (limits apply per-identity)
Priority 30   circuit-breaker   Fail-fast before expensive upstream calls
Priority 40   cache             Response caching
Priority 50   request-transform Mid-pipeline transforms and enrichment
Priority 85   timeout           Deadline enforcement around upstream call
Priority 90   retry             Retry failed upstream calls
Priority 92   response-transform Response transforms, traffic shadow, resource filter
Priority 95   proxy             Header manipulation before forwarding
Priority 100  (default)         Custom policies
Priority 999  mock              Terminal (never calls next)
```

When two policies share a priority, insertion order within the config array determines execution order.

### Global + Route Policy Merging

At gateway construction time, for each route the gateway builds a merged policy list:

1. Collect global policies and route-level policies
2. Deduplicate by name (route-level wins over global)
3. Sort by priority ascending

This means a global `requestLog` at priority 0 always runs before a route-level `jwtAuth` at priority 10, regardless of where each was declared.

### Skip Conditions

Every policy config extends `PolicyConfig`, which includes an optional `skip` function:

```typescript
interface PolicyConfig {
  skip?: (c: unknown) => boolean | Promise<boolean>;
}
```

This enables conditional policy application without requiring separate route definitions.

### PolicyContext Injection

The gateway injects a `PolicyContext` object into Hono's context variables, accessible by all policies:

```typescript
interface PolicyContext {
  requestId: string;   // crypto.randomUUID()
  startTime: number;   // performance.now() at request ingress
  gatewayName: string; // From GatewayConfig.name
  routePath: string;   // Matched route pattern (e.g., "/users/:id")
  traceId: string;     // W3C trace context trace ID
  spanId: string;      // W3C trace context span ID
}
```

Policies read this via `c.get("gateway")`.

### Writing a Custom Policy

A policy is a factory function that returns a `Policy` object. The `handler` is a standard Hono `MiddlewareHandler`:

```typescript
import type { Policy, PolicyConfig } from "@vivero/stoma";

interface CorsConfig extends PolicyConfig {
  origins: string[];
  maxAge?: number;
}

function cors(config: CorsConfig): Policy {
  return {
    name: "cors",
    priority: 5,
    handler: async (c, next) => {
      if (config.skip?.(c)) {
        return next();
      }
      const origin = c.req.header("Origin") ?? "";
      if (config.origins.includes(origin)) {
        c.header("Access-Control-Allow-Origin", origin);
        c.header("Access-Control-Max-Age", String(config.maxAge ?? 86400));
      }
      await next();
    },
  };
}
```

There is no policy registration step. Policies are plain objects -- instantiate them and add them to a pipeline's `policies` array.

For a structured approach with built-in skip handling and debug logging, use `definePolicy()` from the SDK:

```typescript
import { definePolicy, Priority } from "@vivero/stoma";

const cors = definePolicy({
  name: "cors",
  priority: Priority.EARLY_TRANSFORM,
  handler: async ({ c, next, config }) => {
    const origin = c.req.header("Origin") ?? "";
    if (config.origins.includes(origin)) {
      c.header("Access-Control-Allow-Origin", origin);
    }
    await next();
  },
});
```

## Upstream Resolution

### URL Upstream

Forwards the request to an external HTTP URL via `fetch()`. Works on all runtimes.

```typescript
{
  type: "url",
  target: "https://api.internal.example.com",
  rewritePath: (path) => path.replace("/api/v1", ""),
  headers: { "X-Forwarded-For": "gateway" },
}
```

**Resolution steps:**
1. Build the target URL by appending the (optionally rewritten) request path to `target`.
2. Validate the rewritten URL stays on the same origin as `target` (SSRF protection).
3. Strip hop-by-hop headers from the outbound request.
4. Merge `headers` into the outbound request, preserving original headers unless overridden.
5. Forward via `fetch()` with `redirect: "manual"` (prevents redirect-based SSRF).
6. Return the upstream response.

### Service Binding Upstream

Uses Cloudflare Service Bindings for zero-network-hop Worker-to-Worker communication. This upstream type requires a Cloudflare adapter with `dispatchBinding` configured.

```typescript
{
  type: "service-binding",
  service: "users-service",
  rewritePath: (path) => path.replace("/api/users", ""),
}
```

**Resolution steps:**
1. Call `adapter.dispatchBinding(service, request)` which resolves the service binding from the Worker's `env` object.
2. Construct a `Request` with the (optionally rewritten) path.
3. The bound Worker executes in the same Cloudflare colo with no network round-trip.
4. Return the response directly.

### Handler Upstream

An escape hatch for responses that don't require proxying. The handler receives the Hono context and returns a `Response`. Works on all runtimes.

```typescript
{
  type: "handler",
  handler: (c) => c.json({ status: "healthy", timestamp: Date.now() }),
}
```

## Adapter System

The adapter system decouples the gateway core from runtime-specific capabilities. The `GatewayAdapter` interface defines optional slots for stores and platform primitives:

```
GatewayAdapter
  ├── rateLimitStore?      ← RateLimitStore interface
  ├── circuitBreakerStore? ← CircuitBreakerStore interface
  ├── cacheStore?          ← CacheStore interface
  ├── waitUntil?           ← Schedule background work
  └── dispatchBinding?     ← Route to named service bindings
```

### How Policies Use Adapters

Policies that need stores resolve them from the adapter at request time via the gateway context. For example, the `rateLimit` policy checks for:
1. An explicit `store` option in its own config
2. The adapter's `rateLimitStore`
3. Falls back to an in-memory store

This layering lets consumers override stores per-policy or rely on the adapter's defaults.

### Cloudflare Adapter

The richest adapter. Provides:

- **KV-backed rate limiting** (`KVRateLimitStore`): Distributed, eventually consistent counters with TTL-based expiry.
- **Durable Object rate limiting** (`DurableObjectRateLimitStore`): Strongly consistent counters. Each unique key maps to a Durable Object instance.
- **Cache API caching** (`CacheApiCacheStore`): Uses Cloudflare's global Cache API for response caching.
- **`waitUntil`**: Delegates to `ExecutionContext.waitUntil()` for background work (e.g., traffic shadow, async logging).
- **`dispatchBinding`**: Resolves and invokes Cloudflare Service Bindings from the Worker `env` object.

### Adding a New Adapter

Implement the `GatewayAdapter` interface and return it from a factory function. Only implement the slots relevant to your runtime:

```typescript
import type { GatewayAdapter } from "@vivero/stoma";

export function myRuntimeAdapter(): GatewayAdapter {
  return {
    rateLimitStore: new MyDistributedRateLimitStore(),
    waitUntil: (promise) => myRuntime.scheduleBackground(promise),
  };
}
```

## Type System Design

### GatewayConfig to Hono App

The type flow from config to running app:

```
GatewayConfig (user-provided)
    |
    v
Validation (runtime checks on required fields, upstream type narrowing)
    |
    v
Policy sorting (merge global + route policies, deduplicate, sort by priority)
    |
    v
Hono app construction (register middleware + routes)
    |
    v
GatewayInstance { app, routeCount, name, _registry }
```

`GatewayConfig` is the sole input type. The gateway validates it at construction time (not at type level) to provide clear error messages for missing fields.

### Policy Generics

Policy factory functions define their own config interfaces extending `PolicyConfig`:

```
PolicyConfig (base: skip)
    |
    +-- JwtAuthConfig (secret, jwksUrl, issuer, audience, ...)
    +-- RateLimitConfig (max, windowSeconds, keyBy, store, ...)
    +-- CacheConfig (ttlSeconds, keyBy, store, ...)
    +-- CircuitBreakerConfig (threshold, resetTimeout, store, ...)
    +-- ... (35+ more config types)
```

Every factory function returns the same `Policy` type. This uniformity means the gateway does not need to know anything about policy internals -- it only sees `{ name, handler, priority }`.

### Upstream Discriminated Union

`UpstreamConfig` uses TypeScript's discriminated union pattern with a `type` literal field:

```typescript
type UpstreamConfig =
  | { type: "url"; target: string; rewritePath?: ...; headers?: ... }
  | { type: "service-binding"; service: string; rewritePath?: ... }
  | { type: "handler"; handler: (c: Context) => Response | Promise<Response> }
```

The gateway's upstream resolver uses a `switch` on `config.type` to narrow the type and access variant-specific fields. This provides exhaustiveness checking -- the TypeScript compiler errors if a new upstream type is added to the union but not handled in the resolver.

## Error Handling

### Policy Errors

Policies that reject a request throw `GatewayError`, which produces structured JSON error responses:

```json
{
  "error": "UNAUTHORIZED",
  "message": "Missing or invalid JWT token",
  "statusCode": 401,
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

Each built-in policy uses appropriate HTTP status codes:
- `jwt-auth`, `api-key-auth`, `basic-auth`: 401 Unauthorized
- `rbac`: 403 Forbidden
- `rate-limit`: 429 Too Many Requests
- `request-limit`: 413 Content Too Large

### Upstream Errors

When the upstream returns a 5xx or the request times out:
- The `timeout` policy enforces a configurable deadline (default: 30 seconds).
- Timeout errors are caught and returned as 504 Gateway Timeout.
- 5xx responses from the upstream are passed through to the client with the `requestId` header injected for correlation.

### Gateway-Level Errors

Configuration errors (missing required fields, invalid upstream type) throw `GatewayError` at construction time in `createGateway()`. These are developer errors caught during startup.

Runtime errors (unhandled exceptions in policy handlers) are caught by Hono's error handling middleware and routed to `GatewayConfig.onError` if provided. If no handler is provided, the gateway returns a generic 500 with no internal details leaked.

### Error Response Format

All gateway-generated error responses follow a consistent structure:

```typescript
{
  error: string;        // Machine-readable error code (e.g., "RATE_LIMITED")
  message: string;      // Human-readable description
  statusCode: number;   // HTTP status code
  requestId?: string;   // Present when PolicyContext is available
}
```

## Observability Architecture

### Request ID and Trace Context

Every request receives a unique ID via `crypto.randomUUID()`. W3C trace context (`traceId`, `spanId`) is extracted from the incoming `traceparent` header or generated fresh. These values are:
1. Stored in `PolicyContext` for access by all policies.
2. Added to the outbound request as `X-Request-Id` and `traceparent` headers.
3. Added to the response as `X-Request-Id`.
4. Included in every log entry.

### Structured JSON Logging

The `requestLog` policy emits `LogEntry` objects with request metadata, response status, duration, matched route, upstream target, and optional custom fields. Body logging with automatic redaction of sensitive fields is supported.

### Pluggable Log Sinks

The `requestLog` policy accepts a `sink` function. When no sink is provided, entries are written to `console.log` as single-line JSON.

### Metrics

The `metricsReporter` policy records per-route latency histograms, request counters, status code distributions, and error rates. Metrics are collected via the `MetricsCollector` interface. An `InMemoryMetricsCollector` ships for development; Prometheus-format export is available via `toPrometheusText()`.

### Admin Introspection API

When `config.admin` is enabled, the gateway registers `___gateway/*` routes exposing:
- Registered routes and their policy chains
- Policy inventory with priorities
- Metrics snapshots
- Health status

## Directory Structure

```
src/
├── index.ts                   Public API surface
├── core/
│   ├── gateway.ts             createGateway() factory
│   ├── pipeline.ts            Policy chain building, context injection, timing
│   ├── types.ts               GatewayConfig, RouteConfig, PipelineConfig, UpstreamConfig
│   ├── errors.ts              GatewayError class, error response builders
│   └── health.ts              health() route factory
├── policies/
│   ├── types.ts               Policy, PolicyConfig, PolicyContext interfaces
│   ├── proxy.ts               Request forwarding with SSRF protection
│   ├── mock.ts                Static mock responses
│   ├── sdk/                   definePolicy() factory, Priority enum, test harness
│   ├── auth/                  jwt-auth, api-key-auth, basic-auth, oauth2, rbac, jws, http-signatures
│   ├── traffic/               rate-limit, ip-filter, cache, ssl-enforce, threat protection, etc.
│   ├── resilience/            timeout, retry, circuit-breaker, latency-injection
│   ├── transform/             cors, request/response transforms, validation
│   └── observability/         request-log, metrics-reporter, assign-metrics
├── observability/
│   ├── metrics.ts             MetricsCollector, InMemoryMetricsCollector, Prometheus export
│   └── admin.ts               ___gateway/* admin routes
├── adapters/
│   ├── types.ts               GatewayAdapter interface
│   ├── cloudflare.ts          KV + Cache API stores, waitUntil, dispatchBinding
│   ├── durable-object.ts      Durable Object rate limit store
│   ├── node.ts                Node.js adapter (extension point)
│   ├── deno.ts                Deno adapter (extension point)
│   ├── bun.ts                 Bun adapter (extension point)
│   ├── memory.ts              In-memory stores for all interfaces
│   └── testing.ts             Test adapter with assertion helpers
├── config/
│   ├── index.ts               Config type re-exports + validation
│   └── schema.ts              Zod schemas for runtime config validation
└── utils/
    ├── request-id.ts          Request ID generation
    ├── trace-context.ts       W3C traceparent parsing/generation
    ├── ip.ts                  Client IP extraction
    ├── cidr.ts                CIDR range parsing
    ├── redact.ts              Sensitive field redaction
    └── debug.ts               Internal debug logging
```

### Module Boundaries

- **core/** owns the gateway lifecycle: construction, route registration, policy merging, upstream resolution. It imports from `policies/types.ts` for the `Policy` interface and `adapters/types.ts` for the `GatewayAdapter` interface, but never from specific policy or adapter implementations.
- **policies/** owns individual policy logic. Each policy file is self-contained: it defines its own config interface, exports a factory function, and has no cross-policy dependencies. The `sdk/` subdirectory provides shared primitives (`definePolicy()`, `Priority`, skip handling, debug logging, test harness).
- **adapters/** owns runtime-specific implementations. Each adapter file is independent. The `types.ts` file defines the `GatewayAdapter` interface that the core depends on.
- **observability/** owns metrics collection and the admin introspection API.
- **config/** handles configuration validation (Zod schemas for optional runtime validation).
- **utils/** contains pure utility functions with no domain knowledge.

## Design Decisions

### Why Hono

**Decision:** Use Hono as the foundation rather than the raw Workers API or itty-router.

**Rationale:**
- Hono is the dominant framework across edge and serverless runtimes, with first-class adapters for Cloudflare Workers, Node.js, Deno, Bun, Fastly, and more.
- Its middleware system (`c, next`) is exactly the abstraction policies need.
- Built-in helpers (`c.json()`, `c.header()`, `c.status()`) reduce boilerplate in policy implementations.
- Hono is runtime-agnostic -- the same app object works everywhere, making stoma portable by default.
- itty-router is lighter but lacks middleware composition depth. Express-style frameworks carry Node baggage.

### Why Policies Are Hono Middleware

**Decision:** Policies are thin wrappers around Hono `MiddlewareHandler`, not a custom abstraction.

**Rationale:**
- Hono middleware is already a proven composition model. Wrapping it in another abstraction adds complexity without benefit.
- Any existing Hono middleware can be used as a policy with minimal wrapping.
- The `await next()` pattern naturally supports both request and response phases.
- Developers familiar with Hono (or Express/Koa) immediately understand the execution model.
- The `Policy` type adds only `name` and `priority` metadata on top of the handler -- minimal overhead.

### Why a Pluggable Adapter System

**Decision:** Runtime-specific capabilities are injected through a `GatewayAdapter` interface, not imported directly.

**Rationale:**
- The gateway core has zero platform-specific imports. It depends only on Hono and the Web `Request`/`Response` API.
- Consumers choose their adapter at composition time, not at import time. No dead code from unused runtimes.
- Store interfaces (`RateLimitStore`, `CircuitBreakerStore`, `CacheStore`) allow consumers to bring their own implementations (Redis, DynamoDB, etc.) without modifying the gateway.
- The adapter pattern makes testing straightforward -- inject `memoryAdapter()` or `createTestAdapter()` in tests.

### Why TypeScript-First Configuration

**Decision:** Gateway configuration is a TypeScript object, not YAML or JSON.

**Rationale:**
- TypeScript config provides full type checking at authorship time.
- Policy factory functions (`jwtAuth({...})`, `rateLimit({...})`) return typed `Policy` objects -- impossible to express in YAML.
- Functions in config (`rewritePath`, `skip`, `keyBy`, `validate`) are natural in TypeScript but awkward in YAML.
- Config-as-code means config lives in version control with full diff, review, and rollback support.
- Dynamic config loading from KV/JSON is still possible via the `config/` module as a complementary feature.

### Why Priority-Based Ordering

**Decision:** Policies execute based on a numeric `priority` field, not pure insertion order.

**Rationale:**
- Priority-based ordering decouples policy definition from execution order. A `requestLog` policy at priority 0 always runs first regardless of where it appears in the config array.
- Global policies and route-level policies are merged into a single sorted list. Without priority, there is no principled way to interleave them.
- Well-known priority tiers (0 = observability, 10 = auth, 20 = rate limiting, 100 = default) establish conventions that are self-documenting.
- Insertion order is preserved as a tiebreaker when two policies share a priority, so consumers still have fine-grained control.

### Why Discriminated Unions for Upstreams

**Decision:** `UpstreamConfig` is a discriminated union with a `type` field, not a class hierarchy.

**Rationale:**
- Discriminated unions are the idiomatic TypeScript pattern for "one of N variants with different shapes."
- A `switch` on `upstream.type` gives exhaustiveness checking -- the compiler forces handling of new variants.
- No runtime class instantiation -- upstream configs are plain objects.
- Adding a new upstream type is a single addition to the union -- the compiler guides all necessary code changes.
