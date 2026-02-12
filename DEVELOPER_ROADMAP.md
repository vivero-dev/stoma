# Developer Roadmap (Aspirational)

This document outlines the long-term vision for making Stoma the most ergonomic and powerful API gateway for TypeScript developers. These are aspirational goals designed to guide future development.

## Core Ergonomics & Composition

### 1. Route Groups & Scopes
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

### 2. Configuration Splitting
**Problem:** A single `gateway.ts` file can get huge.
**Solution:** First-class support for loading route definitions from multiple files/modules, potentially with auto-discovery or a simple `mergeConfigs` utility.

### 3. Type-Safe Upstream Bindings
**Problem:** `ServiceBindingUpstream` relies on stringly-typed service names (`service: "AUTH_SERVICE"`).
**Solution:** Use TypeScript generics to validate service names against the user's `Env` interface.

## Developer Experience (DX)

### 4. CLI Scaffolding
**Problem:** Creating a new policy or setting up a fresh gateway requires boilerplate.
**Solution:** A `stoma` CLI.
- `npx stoma create my-gateway`
- `npx stoma add policy my-custom-policy`
- `npx stoma dev` (wrapper around wrangler/node with hot reload)

### 5. Simulator / Playground
**Problem:** Testing complex policy chains requires running the full stack.
**Solution:** A web-based (or CLI-based) simulator where you can input a request (path, headers) and see exactly which policies run, why a request was rejected, and what the upstream request looks like. "Trace my request".

### 6. Testing Harness
**Problem:** Users need to write tests for their gateway configuration to ensure policies are applied correctly.
**Solution:** Export a `createTestClient(config)` helper that mocks upstreams and allows asserting on:
- Response status/headers
- Upstream request payloads (was the path rewritten correctly?)
- Policy execution (did the rate limiter trigger?)

## Observability & Operations

### 7. OpenTelemetry Integration
**Problem:** Current tracing is W3C-compatible but custom.
**Solution:** Native integration with OpenTelemetry for comprehensive spans, trace propagation, and metrics export to generic OTLP collectors.

### 8. Live Configuration Reload (Runtime)
**Problem:** Changing config requires a deploy (or restart).
**Solution:** (Aspirational) Load config from a Durable Object or KV at runtime, allowing updates without redeploying the Worker. *Note: This trades some type safety for flexibility.*

## Ecosystem

### 9. Policy Marketplace / Presets
**Problem:** Everyone re-implements "Stripe Webhook Verification" or "Auth0 Validation".
**Solution:** A community repository of pre-configured policy presets.

### 10. Framework Integrations
**Problem:** Stoma is generic.
**Solution:** Drop-in integrations for Next.js, Remix, or Nuxt to run Stoma as middleware within those frameworks.
