# @homegrower-club/stoma

## 0.1.0-rc.5
### Patch Changes



- [`363341d`](https://github.com/HomeGrower-club/stoma/commit/363341dbc92a9f58a4b7df1ca0c66db2407cfe43) Thanks [@JonathanBennett](https://github.com/JonathanBennett)! - Accept trailing slashes on route paths
  
  ### Fixes
  
  - **Trailing-slash route aliases**: The gateway now registers both `/path` and `/path/` for every non-wildcard route, so requests with a trailing slash no longer 404. This also covers CORS preflight — if a `cors` policy is present, the OPTIONS handler is registered on both variants.
  - **Scope path normalisation**: `scope()` and the internal `joinPaths` helper now strip trailing slashes from prefixes and handle root-path (`"/"`) children correctly, avoiding double-slash joins or unintended `/path/` suffixes.

## 0.1.0-rc.5
### Patch Changes



- [`277d1a2`](https://github.com/HomeGrower-club/stoma/commit/277d1a2d27d98b444f074e4ecf0ae8095ef6f133) Thanks [@JonathanBennett](https://github.com/JonathanBennett)! - Fix policy middleware swallowing handler return values, breaking context finalization
  
  ### Fixes
  
  - **Policy pipeline context finalization**: `policiesToMiddleware` now propagates the return value from policy handlers back to Hono's compose chain. Previously, policies that short-circuit by returning a `Response` (rather than setting `c.res` or calling `next()`) would have their return value discarded, leaving `context.finalized` as `false` and causing Hono to throw "Context is not finalized". Both the fast path (no tracing) and slow path (OTel/policy trace active) are fixed.
  - **Auto-inject OPTIONS for preflight**: When a route restricts its methods (e.g. `methods: ["GET"]`) and a policy that handles OPTIONS preflight is present, the gateway now automatically registers an OPTIONS handler for that path so preflight requests don't 404.

## 0.1.0-rc.4
### Patch Changes



- [`c4f3901`](https://github.com/HomeGrower-club/stoma/commit/c4f39017bf8187e5e750d4bae1acb4fe016b78a8) Thanks [@JonathanBennett](https://github.com/JonathanBennett)! - ### Fixes
  
  - Refactored JWT auth validation: Extracted duplicated validation logic from `handler` and `evaluate.onRequest` into a shared `validateJwt()` function. Returns a discriminated `JWTValidationResult`, so each runtime path maps to its own error model.
  
  ### Docs
  
  - Docs have been updated with new about and sustainability pages.

## 0.1.0-rc.3
### Patch Changes



- [`e7ecfb7`](https://github.com/HomeGrower-club/stoma/commit/e7ecfb763ef8b7a750984690436ce8bf7253f804) Thanks [@JonathanBennett](https://github.com/JonathanBennett)! - # Docs updates only:
  
  Add Open Graph meta tags and decouple docs deployment from package releases
  
  - Add `og:image` and related OG headers to Starlight config
  - Decouple `deploy-docs` CI job from npm publish — docs now deploy on any successful release job


- [`c1485eb`](https://github.com/HomeGrower-club/stoma/commit/c1485eb0e5933c1e45cb0ba05dff75d11569f46d) Thanks [@JonathanBennett](https://github.com/JonathanBennett)! - Tree-shakeable builds — 57% smaller bundles for consumers
  
  ### Build
  
  - **Unbundled dist output**: Switched tsup from bundled code-splitting (`splitting: true`) to per-file transpilation (`bundle: false`). The published `dist/` now mirrors the `src/` module structure, allowing consumer bundlers (esbuild, Rollup, webpack) to tree-shake at the module level instead of importing a monolithic chunk.
  - **`sideEffects: false`**: Added to `package.json` so bundlers can safely drop unused modules.
  - **`/*#__PURE__*/` annotations**: Added to all 33 `definePolicy()` call sites across policy files. These tell bundlers the factory calls can be dropped when their return values are unused.
  
  ### Impact
  
  A basic gateway with `requestLog` + `cors` drops from **89 KB / 28 KB gzip** to **38 KB / 15 KB gzip**. Consumers only pay for the policies they actually import.
  
  ### Docs
  
  - Fixed rate-limit error response in how-it-works guide: error code corrected from `rate_limit_exceeded` to `rate_limited`, `retryAfter` moved from JSON body to response header (matching actual implementation).
  - Fixed IP extraction order: `cf-connecting-ip` checked first, then `x-forwarded-for`.

## 0.1.0-rc.2
### Patch Changes



- [`75d0447`](https://github.com/HomeGrower-club/stoma/commit/75d04472e736fafe9528e258514a9fe3e352e511) Thanks [@JonathanBennett](https://github.com/JonathanBennett)! - Live demo API, interactive editor links across docs, release workflow fixes
  
  ### Features
  
  - **Demo API gateway** (`docs/src/demo-api/`): Real Stoma gateway deployed alongside the docs site at `/demo-api/*`, serving echo, users, products, status, and delay endpoints. Dogfoods Stoma with rate limiting (60 req/min) and CORS. Same-origin deployment eliminates CORS issues from the editor.
  - **EditorLink on all guide and recipe pages**: Added "Open in Editor" buttons to 8 docs pages — webhook firewall, cache resilience, shadow release, caching (basic + advanced), JWT auth (HMAC + JWKS), route scopes, and the basic gateway partial. Real-world example page converted from inline code to imported example with EditorLink.
  
  ### Fixes
  
  - **EditorLink Unicode encoding**: Replaced `btoa()` with `Buffer.from().toString("base64")` to handle non-Latin1 characters in example code.
  - **Release workflow: npm auth**: Added `NODE_AUTH_TOKEN` env var — `setup-node` with `registry-url` generates an `.npmrc` referencing `NODE_AUTH_TOKEN`, not `NPM_TOKEN`. Without this, `changeset publish` would fail with 401.
  - **Release workflow: docs deploy build**: Added `yarn build` (tsup) step before docs build — the demo API worker imports `@homegrower-club/stoma` which resolves to `dist/`, so stoma must be built first.
  - **Release workflow: docs build command**: Changed from `yarn docs:build` (`astro build` only) to `cd docs && yarn build` (`build:assets && astro build`) so the stoma bundle, editor worker, and service worker are built before Astro runs.
  - **Webhook firewall test**: Rewritten to test policy behavior (auth rejection for missing signature) instead of depending on upstream DNS resolution. Tests no longer make outbound network requests.
  
  ### Docs
  
  - All concept examples updated to use the live demo API (`https://stoma.opensource.homegrower.club/demo-api`) as upstream target, so editor demos produce real responses instead of 502 errors.
  - Docs Cloudflare Worker updated with `main` entry point and `ASSETS` binding to serve both the demo API and static assets.

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
