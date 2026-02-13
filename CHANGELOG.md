# @homegrower-club/stoma

## 0.1.0-rc.1
### Patch Changes



- [`155433e`](https://github.com/HomeGrower-club/stoma/commit/155433e7eb9f0050cc7b81fdc582e1d9045a583e) Thanks [@JonathanBennett](https://github.com/JonathanBennett)! - Protocol-agnostic policy evaluation, docs editor improvements, lint fixes
  
  - Multi-protocol policy architecture: `PolicyInput`, `PolicyResult`, `PolicyEvaluator` types enabling policies to run outside HTTP (ext_proc, WebSocket)
  - `ipFilter` now exposes `evaluate.onRequest` alongside the existing Hono `handler`
  - Docs editor: Hono types inlined into the stoma type bundle via `--external-inlines hono` (removes hand-written stubs)
  - Docs editor: subpath registration for Monaco IntelliSense (`/sdk`, `/config`, `/adapters/*`)
  - Fixed broken `EditorLink` component (`_href` → `href`)
  - Lint error cleanup

## 0.1.0-rc.0
### Minor Changes



- [`bb4d04f`](https://github.com/HomeGrower-club/stoma/commit/bb4d04ff85c8c133b10c323d92695cf11b944552) Thanks [@JonathanBennett](https://github.com/JonathanBennett)! - Initial release candidate for v0.1.0
  
  Declarative API gateway library built on Hono for Cloudflare Workers and edge runtimes. Features:
  
  - Gateway construction from declarative TypeScript config
  - 43 policies across auth, traffic, resilience, transform, and observability domains
  - 4-layer policy SDK with `definePolicy()`, priority constants, composable helpers, and test harness
  - Three upstream types: URL proxy, Cloudflare Service Binding, and custom handler
  - Runtime adapters for Cloudflare Workers, Node.js, Deno, and Bun
  - Cloudflare-specific stores (KV, Durable Objects, Cache API)
  - Admin introspection API with Prometheus metrics export
  - W3C trace context propagation
  - Zod-based config validation (optional peer dependency)
  - Zero-dependency debug system with namespace filtering
  - SSRF protection on URL upstreams
