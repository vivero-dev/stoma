# Stoma 🌱

**Declarative API gateway as a TypeScript library. Runs on Cloudflare Workers, Node.js, Deno, Bun, and more.**

![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![Hono](https://img.shields.io/badge/Hono-4.7-orange)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Why

API gateways in the JavaScript ecosystem are stuck between two bad options:

1. **Infrastructure you deploy** -- Kong, KrakenD, AWS API Gateway. Powerful, but they are separate services you provision, configure with YAML, and operate independently from your application code. You lose type safety, your gateway config drifts from your codebase, and you pay for another piece of infrastructure.

2. **Dead or abandoned libraries** -- Express Gateway was the closest thing to a TS-native gateway. It is unmaintained, locked to Express 4, and has no story for modern runtimes.

There is a third option: **a declarative gateway library that lives in your codebase and deploys with your standard workflow.**

`@vivero/stoma` fills this gap. It is a TypeScript library you import -- not a Go binary or YAML config you deploy. Define your routes, policies, and upstreams as typed objects. The library compiles them into an HTTP application you can export directly.

- Configured with **TypeScript**, not YAML
- Lives in **your codebase** -- deploy as part of your app or as a standalone service
- Runs on Cloudflare Workers, Node.js, Deno, Bun, Fastly, Lambda@Edge, Vercel Edge Functions
- Optionally leverages **platform-specific features** (Cloudflare Service Bindings, KV, Durable Objects) through a pluggable adapter system

Think KrakenD's declarative route-to-pipeline model, but as a TypeScript library.

## Features

- **TypeScript-first with full type safety** -- Every config object, policy, and upstream is typed. No YAML. No JSON Schema. Your editor catches mistakes before your users do.
- **Powered by Hono** -- lightweight, zero dependencies, Web Standards API. One of the fastest routers in the JavaScript ecosystem.
- **Declarative route / pipeline / policy chain model** -- Define routes, attach ordered policy chains, and point at an upstream. The gateway wires it all together.
- **Dozens of built-in policies** -- Auth (JWT, API key, OAuth2, RBAC, HTTP signatures), traffic control (rate limiting, IP filtering, caching, threat protection), resilience (circuit breaker, retry, timeout), transforms (CORS, request/response rewriting, validation), and observability (structured logging, metrics, health checks).
- **Multi-runtime** -- Core depends only on Hono and the Web `Request`/`Response` API. No Node.js built-ins, no platform lock-in.
- **Pluggable adapter system** -- Runtime-specific capabilities (distributed stores, background tasks, service bindings) are injected through adapters, not hard-coded. Adapters ship for Cloudflare Workers, Node.js, Deno, Bun, and in-memory development.
- **Pluggable policy system** -- Policies are middleware functions with metadata. Write a custom policy in a few lines, or use `definePolicy()` from the SDK for a structured approach.

## Installation

```sh
npm install @vivero/stoma hono
```

## Quick Start

### Basic gateway (runs on any runtime)

```typescript
import { createGateway, jwtAuth, rateLimit, requestLog, cors } from "@vivero/stoma";

const gateway = createGateway({
  name: "my-api-gateway",
  basePath: "/api",
  policies: [requestLog(), cors()],
  routes: [
    {
      path: "/users/*",
      methods: ["GET", "POST", "PUT", "DELETE"],
      pipeline: {
        policies: [
          jwtAuth({ secret: "your-secret" }),
          rateLimit({ max: 100, windowSeconds: 60 }),
        ],
        upstream: {
          type: "url",
          target: "https://users-api.internal.example.com",
          rewritePath: (path) => path.replace("/api/users", ""),
        },
      },
    },
    {
      path: "/health",
      pipeline: {
        upstream: {
          type: "handler",
          handler: () =>
            new Response(JSON.stringify({ status: "ok" }), {
              headers: { "Content-Type": "application/json" },
            }),
        },
      },
    },
  ],
});

export default gateway.app;
```

This gateway works out of the box on Cloudflare Workers (`export default gateway.app`), Bun (`export default gateway.app`), Deno (`Deno.serve(gateway.app.fetch)`), or Node.js (via `@hono/node-server`).

### With Cloudflare-specific features

When deploying to Cloudflare Workers, use the Cloudflare adapter to unlock Service Bindings, KV-backed rate limiting, and Durable Objects:

```typescript
import { createGateway, jwtAuth, rateLimit, requestLog } from "@vivero/stoma";
import { cloudflareAdapter } from "@vivero/stoma/adapters/cloudflare";

type Env = {
  JWT_SECRET: string;
  USERS_SERVICE: Fetcher;
  RATE_LIMIT_KV: KVNamespace;
};

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const gateway = createGateway({
      name: "my-api-gateway",
      basePath: "/api",
      adapter: cloudflareAdapter({
        rateLimitKv: env.RATE_LIMIT_KV,
        executionCtx: ctx,
        env,
      }),
      policies: [requestLog()],
      routes: [
        {
          path: "/users/*",
          pipeline: {
            policies: [
              jwtAuth({ secret: env.JWT_SECRET }),
              rateLimit({ max: 100, windowSeconds: 60 }),
            ],
            upstream: {
              type: "service-binding",
              service: "USERS_SERVICE",
            },
          },
        },
      ],
    });

    return gateway.app.fetch(request, env, ctx);
  },
};
```

## Configuration

The gateway is configured entirely through TypeScript. The top-level `GatewayConfig` type drives everything:

```typescript
interface GatewayConfig {
  name?: string;            // Gateway name, used in logs and metrics
  basePath?: string;        // Base path prefix for all routes (e.g. "/api")
  routes: RouteConfig[];    // Route definitions
  policies?: Policy[];      // Global policies applied to every route
  adapter?: GatewayAdapter; // Runtime adapter for stores and platform capabilities
  onError?: (error: Error, c: unknown) => Response | Promise<Response>;
}
```

Each route defines a **path**, optional **methods**, and a **pipeline**:

```typescript
interface RouteConfig {
  path: string;                   // Hono path syntax: "/users/:id", "/files/*"
  methods?: HttpMethod[];         // ["GET", "POST", ...] -- defaults to all
  pipeline: PipelineConfig;       // Policy chain + upstream target
  metadata?: Record<string, unknown>;
}
```

A pipeline is an ordered chain of policies leading to an upstream:

```typescript
interface PipelineConfig {
  policies?: Policy[];     // Executed in order before the upstream
  upstream: UpstreamConfig; // Where the request goes
}
```

### Upstream Types

Three upstream types cover the common deployment patterns:

```typescript
// URL proxy -- forward to any HTTP endpoint (works on all runtimes)
{ type: "url", target: "https://api.example.com", headers: { "X-Forwarded-By": "gateway" } }

// Service Binding -- zero-latency Worker-to-Worker routing (Cloudflare only)
{ type: "service-binding", service: "AUTH_SERVICE" }

// Inline handler -- respond directly without proxying (works on all runtimes)
{ type: "handler", handler: (c) => new Response("ok") }
```

### Adapters

Adapters provide runtime-specific store implementations and platform capabilities. The gateway core is runtime-agnostic; adapters plug in distributed rate limiting, caching, background tasks, and service binding dispatch.

```typescript
import { cloudflareAdapter } from "@vivero/stoma/adapters/cloudflare";
import { nodeAdapter } from "@vivero/stoma/adapters/node";
import { denoAdapter } from "@vivero/stoma/adapters/deno";
import { bunAdapter } from "@vivero/stoma/adapters/bun";
import { memoryAdapter } from "@vivero/stoma/adapters/memory";
```

| Adapter | Stores | `waitUntil` | Service Bindings | Use case |
|---------|--------|-------------|------------------|----------|
| `cloudflareAdapter` | KV, Durable Objects, Cache API | Yes | Yes | Production on Cloudflare Workers |
| `nodeAdapter` | In-memory defaults | No | No | Node.js servers via `@hono/node-server` |
| `denoAdapter` | In-memory defaults | No | No | Deno / Deno Deploy |
| `bunAdapter` | In-memory defaults | No | No | Bun servers |
| `memoryAdapter` | In-memory (all stores) | No | No | Development, testing, single-instance |

No adapter is required. Without one, policies that need stores (rate limiting, caching, circuit breaking) fall back to in-memory defaults automatically.

## Policies

Policies are the building blocks of gateway pipelines. They are middleware handlers with a name and a priority (lower numbers execute first).

### Built-in Policies

| Category | Policies |
|----------|----------|
| **Auth** | `jwtAuth`, `apiKeyAuth`, `basicAuth`, `oauth2`, `rbac`, `generateJwt`, `jws`, `generateHttpSignature`, `verifyHttpSignature` |
| **Traffic** | `rateLimit`, `ipFilter`, `geoIpFilter`, `cache`, `sslEnforce`, `requestLimit`, `jsonThreatProtection`, `regexThreatProtection`, `trafficShadow`, `interrupt`, `dynamicRouting`, `httpCallout`, `resourceFilter` |
| **Resilience** | `timeout`, `retry`, `circuitBreaker`, `latencyInjection` |
| **Transform** | `cors`, `overrideMethod`, `assignAttributes`, `assignContent`, `requestTransform`, `responseTransform`, `requestValidation`, `jsonValidation` |
| **Observability** | `requestLog`, `metricsReporter`, `assignMetrics`, `health` |
| **Utility** | `proxy`, `mock` |

Every policy accepts a `skip` function for conditional execution:

```typescript
rateLimit({
  max: 100,
  skip: (c) => c.req.header("X-Internal") === "true",
})
```

### Writing a Custom Policy

A policy is any object conforming to the `Policy` interface:

```typescript
import type { Policy } from "@vivero/stoma";

function requestTimer(): Policy {
  return {
    name: "request-timer",
    priority: 5,
    handler: async (c, next) => {
      const start = performance.now();
      await next();
      c.header("X-Response-Time", `${(performance.now() - start).toFixed(1)}ms`);
    },
  };
}
```

For a more structured approach, use the SDK:

```typescript
import { definePolicy, Priority } from "@vivero/stoma";

const requestTimer = definePolicy({
  name: "request-timer",
  priority: Priority.EARLY_TRANSFORM,
  handler: async ({ c, next }) => {
    const start = performance.now();
    await next();
    c.header("X-Response-Time", `${(performance.now() - start).toFixed(1)}ms`);
  },
});
```

### Policy Execution Order

Policies execute in **priority order** (lowest number first), then in **declaration order** for policies sharing a priority. Global policies and route-level policies are merged and sorted together.

| Priority | Phase | Examples |
|----------|-------|---------|
| 0 | Observability | `requestLog`, `assignMetrics` |
| 1 | Network filter | `ipFilter`, `geoIpFilter`, `metricsReporter` |
| 5 | Early transform | `cors`, `sslEnforce`, `requestLimit`, `latencyInjection` |
| 10 | Authentication | `jwtAuth`, `apiKeyAuth`, `basicAuth`, `oauth2`, `rbac` |
| 20 | Rate limiting | `rateLimit` |
| 30 | Circuit breaker | `circuitBreaker` |
| 40 | Caching | `cache` |
| 50 | Mid-pipeline | `requestTransform`, `assignAttributes`, `generateJwt`, `dynamicRouting` |
| 85 | Timeout | `timeout` |
| 90 | Retry | `retry` |
| 92 | Response | `responseTransform`, `trafficShadow`, `resourceFilter` |
| 95 | Proxy | `proxy`, `generateHttpSignature` |
| 100 | Default | Custom policies |
| 999 | Terminal | `mock` |

## Documentation & Resources

- [Architecture Design](ARCHITECTURE.md) - Deep dive into the gateway's internal design and decisions.
- [Full Documentation](https://stoma.vivero.dev) - Comprehensive guides, recipes, and API reference.

## Package Exports

| Import path | Contents |
|-------------|----------|
| `@vivero/stoma` | `createGateway`, all policies, metrics, core types |
| `@vivero/stoma/policies` | Policies only |
| `@vivero/stoma/sdk` | `definePolicy`, `Priority`, test harness |
| `@vivero/stoma/config` | Config types + optional Zod validation (requires `zod` peer dep) |
| `@vivero/stoma/adapters` | All adapter factories |
| `@vivero/stoma/adapters/cloudflare` | Cloudflare adapter only |
| `@vivero/stoma/adapters/node` | Node.js adapter only |
| `@vivero/stoma/adapters/deno` | Deno adapter only |
| `@vivero/stoma/adapters/bun` | Bun adapter only |
| `@vivero/stoma/adapters/memory` | In-memory adapter (dev/test) |

## Contributing

Contributions are welcome. Please open an issue to discuss proposed changes before submitting a pull request.

```sh
yarn install
yarn test
yarn typecheck
```

## License

MIT
