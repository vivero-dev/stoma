# Developer Roadmap (Aspirational)

This document outlines the long-term vision for making Stoma the most ergonomic and powerful API gateway for TypeScript developers. These are aspirational goals designed to guide future development.

## Multi-Runtime Architecture

The core strategic direction: **Stoma's policy layer is protocol-agnostic; Hono is the HTTP adapter.**

The `Policy` interface supports two entry points: `handler` (Hono middleware for the HTTP runtime) and `evaluate` (protocol-agnostic evaluator for any runtime). This dual-entry design was introduced in Phase 4 via `src/core/protocol.ts` and is fully type-safe with zero runtime overhead for the HTTP path.

### 12. Protocol-Agnostic Policy Layer ✅
**Status:** Type foundations shipped. `PolicyInput`, `PolicyResult`, `PolicyEvaluator`, `ProcessingPhase`, and the mutation system are all in `src/core/protocol.ts`. `definePolicy()` supports both `handler` and `evaluate` in a single definition. The HTTP runtime (`createGateway`) continues to use `handler` only — `evaluate` is for non-HTTP runtimes.

### 17. Gateway of Gateways (Dynamic Upstream Resolution)

**Problem:** The `dynamic-routing` policy already sets `_dynamicTarget`, `_dynamicRewrite`, and `_dynamicHeaders` on the context, but the upstream handlers are built statically at route registration time and don't read these values. This prevents using stoma as a perimeter gateway that applies policies (auth, rate-limit, metrics) then forwards to protocol-specific inner handlers (MCP, gRPC, ext_proc).

**Solution:** Two phases:

**Phase A — Dynamic upstream resolution** (small change, ~10 lines):
- Modify `createUrlUpstream()` in `src/core/gateway.ts` to check for `_dynamicTarget` from context
- If present, override the static upstream target at request time
- The `dynamic-routing` policy already sets this — upstream just needs to consume it

```typescript
// In createUrlUpstream:
return async (c: Context) => {
  const dynamicTarget = c.get("_dynamicTarget");
  const targetBase = dynamicTarget 
    ? new URL(dynamicTarget)  // runtime-selected target
    : new URL(upstream.target); // static config target
  // ... rest of proxy logic
};
```

**Phase B — Protocol-specific upstream types** (new work):
- Add `"mcp"` upstream type that transforms HTTP→JSON-RPC and forwards to MCP servers
- Add `"grpc"` upstream type for HTTP/2 + protobuf forwarding  
- Both leverage existing policies at the perimeter, then forward to protocol-specific backends

**Use cases enabled:**
- **Perimeter auth + protocol handlers**: OAuth2 validates tokens at the edge, strips auth headers, forwards to MCP/gRPC servers
- **Traffic management**: Rate-limit, ip-filter, metrics at the gateway layer before protocol-specific backends
- **Zero-downtime migrations**: Use `dynamic-routing` to gradually shift traffic from old MCP server to new one
- **Multi-protocol gateway**: Single stoma instance routes to HTTP APIs, MCP servers, gRPC services based on path/method/headers

**Key insight:** Any perimeter policy (auth, rate-limit, redirect, metrics, transforms) applies before requests hit protocol-specific inner handlers. The inner handlers only need to handle their protocol — not auth or traffic management.

### 18. Envoy ext_proc Runtime
**Problem:** Envoy-based load balancers (GCP Global LB, AWS ALB via Envoy, Istio service mesh) support an External Processing filter that delegates policy decisions to a gRPC service. Today, users must write ext_proc services in Go/C++ or use proprietary solutions.

**Solution:** A `createExtProcServer()` entry point that takes the same policy array as `createGateway()` but serves them over a gRPC bidirectional stream using the Connect protocol (`@connectrpc/connect`, ~12KB).

```typescript
import { createExtProcServer } from "@homegrower-club/stoma/runtimes/ext-proc";
import { jwtAuth, rateLimit, cors } from "@homegrower-club/stoma";

const server = createExtProcServer({
  policies: [cors(), jwtAuth({ jwksUrl: "..." }), rateLimit({ max: 100 })],
});
// Deploy as a Cloudflare Worker, Docker container, or any edge runtime
```

**Processing phases** (all 6 from the Envoy ext_proc spec):
- `request-headers`, `request-body`, `request-trailers`
- `response-headers`, `response-body`, `response-trailers`

Each policy declares which phases it participates in via `phases`. The ext_proc runtime skips policies that don't apply to the current phase.

**Key design decisions:**
- Connect protocol (not raw gRPC) — works over HTTP/2 and HTTP/1.1, compiles small for edge
- Policies use `evaluate.onRequest` / `evaluate.onResponse` — the runtime maps phases to the appropriate evaluator
- `PolicyResult` mutations map directly to ext_proc `HeaderMutation`, `BodyMutation`, and `ImmediateResponse`
- Same policy instance works in both `createGateway()` (HTTP) and `createExtProcServer()` (gRPC)

### 19. WebSocket Runtime
**Problem:** WebSocket connections need policy evaluation at connection upgrade time and optionally on individual frames, but the HTTP middleware model doesn't fit.

**Solution:** A `createWebSocketGateway()` that evaluates policies on the upgrade request using `evaluate.onRequest`, then optionally applies frame-level policies using `evaluate.onResponse` for server→client frames.

### 20. HTTP Bridge (evaluate → middleware)
**Problem:** Policy authors who implement both `handler` and `evaluate` duplicate logic.

**Solution:** An `evaluateToMiddleware()` adapter that wraps a policy's `evaluate` functions into a Hono middleware handler. This allows policy authors to write `evaluate` once and have it work on both the HTTP and non-HTTP runtimes.

```typescript
import { evaluateToMiddleware } from "@homegrower-club/stoma/sdk";

// If a policy only has `evaluate`, the HTTP runtime can auto-bridge it
const httpHandler = evaluateToMiddleware(myPolicy.evaluate);
```

### 21. Built-in Policy Migration ✅
**Status:** Complete. Added `evaluate` implementations to 18 policies across auth, traffic, and transform categories. Also added `httpOnly: true` flag to 15 HTTP-specific policies.

**Policies with `evaluate` (18 total):**
- **Auth (6):** api-key-auth, basic-auth, oauth2, jwt-auth, jws, rbac
- **Traffic (4):** ip-filter, geo-ip-filter, request-limit, json-threat-protection
- **Transform (8):** requestTransform, responseTransform, assignAttributes, assignContent, requestValidation, jsonValidation, resourceFilter

**Policies marked `httpOnly: true` (15 total):**
- **Core (2):** proxy, mock
- **Traffic (5):** ssl-enforce, dynamic-routing, interrupt, http-callout, traffic-shadow
- **Resilience (4):** latency-injection, timeout, retry, circuit-breaker
- **Transform (1):** cors
- **Observability (4):** request-log, metrics-reporter, server-timing, assign-metrics

**Key design decisions:**
- Policies that only implement `handler` (no `evaluate`) are HTTP-only by default
- New `httpOnly?: true` flag on Policy type explicitly marks HTTP-specific policies
- `definePolicy()` passes through `httpOnly` from definition to returned Policy
- Tooling can use this flag to warn when HTTP-only policies are used in non-HTTP gateway configs

## Policies

### 33. mTLS Policy (Inbound + Outbound)

**Problem:** Users need mutual TLS support — both verifying client certificates from incoming requests (inbound mTLS) and presenting client certificates to upstream services (outbound mTLS).

**Solution:** Two-part implementation:

#### Part A — Inbound mTLS Policy

Create `src/policies/auth/mtls.ts` using the `definePolicy` pattern:

```typescript
interface MtlsConfig extends PolicyConfig {
  /** Reject requests without a valid client certificate */
  require?: boolean;
  /** Allowed SHA256 certificate fingerprints (hex, no colons) */
  allowedFingerprints?: string[];
  /** Allowed certificate issuers (CN or O) */
  allowedIssuers?: string[];
  /** Forward certificate info to upstream as headers */
  forwardCertInfo?: {
    fingerprint?: string;
    issuer?: string;
    subject?: string;
    verified?: string;
  };
}
```

- Priority: `Priority.AUTH` (10)
- Reads `cf.tlsClientAuth` from Cloudflare Workers request
- Falls back to checking custom headers for non-CF runtimes (allows load balancers to pass cert info)
- Throws `GatewayError(403)` on validation failure

#### Part B — Outbound mTLS Support

Extend `UrlUpstreamConfig` in `src/core/types.ts`:

```typescript
interface UrlUpstreamConfig {
  type: "url";
  target: string;
  // ... existing options
  /** Outbound mTLS configuration */
  mtls?: {
    /** Client certificate in PEM format */
    cert: string;
    /** Private key in PEM format */
    key: string;
    /** CA certificate for verifying upstream (optional) */
    ca?: string;
  };
}
```

**Runtime handling:**
- **Node.js:** Use `https.request()` with `{ cert, key, ca }` options
- **Bun:** Use fetch with TLS options or custom implementation
- **Cloudflare Workers:** Throw at config validation time with clear error message recommending Cloudflare Access

**Files:**

| File | Action |
|------|--------|
| `src/policies/auth/mtls.ts` | Create |
| `src/policies/auth/index.ts` | Modify — export `mtls` |
| `src/policies/auth/__tests__/mtls.test.ts` | Create |
| `src/core/types.ts` | Modify — add `mtls` to `UrlUpstreamConfig` |
| `src/core/gateway.ts` | Modify — handle outbound mTLS in upstream dispatch |
| `docs/src/content/docs/policies/mtls.mdx` | Create |

**Estimated effort:** ~8-12 hours total

---

## Core Ergonomics & Composition

### 22. Route Groups & Scopes
**Problem:** Applying policies to a subset of routes (e.g., all `/admin/*` routes need RBAC) currently requires repeating the policy in every route's pipeline or using a global policy with a complex `skip` condition.
**Solution:** Introduce a `Scope` or `Group` concept in the configuration.
```typescript
const adminRoutes = scope({
  prefix: "/admin",
  policies: [jwtAuth(), rbac({ role: "admin" })],
  routes: [
    { path: "/users", ... },
    { path: "/settings", ... }
  ]
});
```

### 23. Configuration Splitting
**Problem:** A single `gateway.ts` file can get huge.
**Solution:** First-class support for loading route definitions from multiple files/modules, potentially with auto-discovery or a simple `mergeConfigs` utility.

### 24. Type-Safe Upstream Bindings ✅
**Status:** Done. The type system already supports this via generics:

```typescript
interface Env {
  AUTH_SERVICE: Fetcher;
  API_SERVICE: Fetcher;
}

// Pass your Env type to createGateway
createGateway<Env>({
  routes: [{
    path: "/api",
    upstream: {
      type: "service-binding",
      service: "AUTH_SERVICE"  // TypeScript autocompletes valid binding names!
    }
  }]
})
```

The generic `TBindings` flows from `createGateway<TBindings>` through `GatewayConfig`, `RouteConfig`, `UpstreamConfig`, to `ServiceBindingUpstream.service` which uses `Extract<keyof TBindings, string>`.

**What's needed:**
- More service-binding examples (in progress)
- Documentation improvements (in progress)

## Developer Experience (DX)

### 25. CLI Scaffolding
**Problem:** Creating a new policy or setting up a fresh gateway requires boilerplate.
**Solution:** A `stoma` CLI.
- `npx stoma create my-gateway`
- `npx stoma add policy my-custom-policy`
- `npx stoma dev` (wrapper around wrangler/node with hot reload)

### 26. Simulator / Playground
**Problem:** Testing complex policy chains requires running the full stack.
**Solution:** A web-based (or CLI-based) simulator where you can input a request (path, headers) and see exactly which policies run, why a request was rejected, and what the upstream request looks like. "Trace my request".

### 27. Testing Harness
**Problem:** Users need to write tests for their gateway configuration to ensure policies are applied correctly.
**Solution:** Export a `createTestClient(config)` helper that mocks upstreams and allows asserting on:
- Response status/headers
- Upstream request payloads (was the path rewritten correctly?)
- Policy execution (did the rate limiter trigger?)

## Observability & Operations

### 28. OpenTelemetry Integration
**Problem:** Current tracing is W3C-compatible but custom.
**Solution:** Native integration with OpenTelemetry for comprehensive spans, trace propagation, and metrics export to generic OTLP collectors.

### 29. Live Configuration Reload (Runtime)
**Problem:** Changing config requires a deploy (or restart).
**Solution:** (Aspirational) Load config from a Durable Object or KV at runtime, allowing updates without redeploying the Worker. *Note: This trades some type safety for flexibility.*

## Ecosystem

### 30. Policy Marketplace / Presets
**Problem:** Everyone re-implements "Stripe Webhook Verification" or "Auth0 Validation".
**Solution:** A community repository of pre-configured policy presets.

### 31. Framework & Runtime Integrations
**Problem:** Stoma's policy engine is powerful but users need clear integration paths for their specific runtime.
**Solution:** Drop-in integrations at multiple levels:
- **Framework middleware**: Next.js, Remix, Nuxt — run `createGateway()` as server middleware
- **Runtime adapters**: Node.js (`node:http`), Deno (`Deno.serve`), Bun (`Bun.serve`) — Hono already provides these; Stoma inherits them
- **Infrastructure integration**: Envoy ext_proc, Istio WASM, AWS API Gateway custom authorizers — use `evaluate` for protocol-agnostic policy execution
- **Edge platforms**: Cloudflare Workers (primary), Fastly Compute, Vercel Edge Functions, AWS Lambda@Edge

## Documentation

### 32. Versioned Documentation via R2

**Problem:** Every docs deploy overwrites the previous version. Users on older releases can't reference docs matching their version.

**Solution:** Archive each release's docs build in Cloudflare R2, served by a thin routing worker alongside the latest docs via Workers Assets.

**Architecture:**
- **Hybrid Assets + R2**: Latest docs served via Workers Assets (fastest path), versioned archives from R2
- **HTMLRewriter** rewrites absolute paths in versioned HTML to stay within the version prefix (e.g., `/getting-started/` → `/v/0.1.0/getting-started/`). Zero-copy streaming rewriter built into Workers runtime
- **Version banner** injected on non-latest pages via HTMLRewriter `body` handler, using Starlight CSS custom properties for theme consistency

**Routing:**
```
/                    → env.ASSETS.fetch() (latest)
/v/0.1.0-rc.0/*     → R2 v/0.1.0-rc.0/* (with HTMLRewriter)
/api/versions        → R2 versions.json manifest
```

**R2 layout:**
```
stoma-docs/
  versions.json                    # {"latest":"0.1.0","versions":[...]}
  v/0.1.0-rc.0/index.html
  v/0.1.0-rc.0/_astro/...
  v/0.1.0/index.html
  ...
```

**Release flow** (automated via CI):
1. Build docs → `docs/dist/`
2. If changesets published: upload `dist/` to R2 at `v/{version}/`, update `versions.json` (pre-releases don't move the `latest` pointer)
3. `wrangler deploy` pushes worker + static assets (latest)

**Changes required:**

| File | Action |
|------|--------|
| `docs/src/worker.ts` | Create — routing worker (~150 lines) with R2 serving, HTMLRewriter, `/api/versions` endpoint |
| `docs/wrangler.jsonc` | Edit — add `main: "src/worker.ts"`, `assets.binding: "ASSETS"`, `r2_buckets` binding |
| `docs/scripts/upload-versioned-docs.sh` | Create — iterates `dist/`, uploads to R2 with content-type, updates `versions.json` via `jq` |
| `.github/workflows/release.yml` | Edit — add version extraction + R2 archive step before wrangler deploy |

**Worker `Env` interface:**
```typescript
interface Env {
  ASSETS: Fetcher;
  DOCS_BUCKET: R2Bucket;
}
```

**HTMLRewriter selectors** (for versioned pages):
- `a[href]`, `link[href^="/"]`, `script[src^="/"]`, `img[src^="/"]`, `source[src^"/"]`, `source[srcset]`, `form[action^="/"]`
- `astro-island[component-url]`, `astro-island[renderer-url]` (Astro hydration islands)

**One-time setup:** `cd docs && npx wrangler r2 bucket create stoma-docs`

**Verification:**
1. `cd docs && npx wrangler dev` — confirm `/` serves latest through custom worker
2. Upload test version: `bash docs/scripts/upload-versioned-docs.sh 0.0.1-test`
3. Hit `/v/0.0.1-test/` — verify links stay in version prefix, banner appears
4. Hit `/api/versions` — verify manifest JSON
5. DevTools Network tab — all `_astro/` assets load from `/v/.../_astro/`
