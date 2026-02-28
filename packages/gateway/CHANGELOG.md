# @vivero/stoma

## 0.1.0-rc.11
### Patch Changes



- [`cd6bd3a`](https://github.com/vivero-dev/stoma/commit/cd6bd3a619bc30c3369cd9e5546c6ceed537ceaa) Thanks [@JonathanBennett](https://github.com/JonathanBennett)! - ### @vivero/stoma
  
  **Exports & TypeDoc**
  
  - Export missing config types from the barrel: `MockConfig`, `ProxyPolicyConfig`, `ApiKeyAuthConfig`, `BasicAuthConfig`, `CorsConfig`, `RegexPatternRule`, `ValidationResult`, `ExtractClientIpOptions`, and `RequiredKeys`
  - Export `ValidationResult` interface from the `request-validation` policy (was internal-only)
  - Export `RequiredKeys` utility type from the SDK (marked `@internal`)
  - Add `tsdoc.json` so TypeDoc recognises `@security` and `@module` block tags without warnings
  - Fix broken `{@link Response}` reference in `errorToResponse` JSDoc (changed to inline code)
  - Fix `{@link noopDebugLogger}` reference in `policyDebug` JSDoc (changed to prose)
  - Update `README.md` architecture link from local `ARCHITECTURE.md` to the docs site
  
  **Examples**
  
  - Fix all upstream targets to use the correct origin (`https://stoma.vivero.dev`) with explicit `rewritePath` functions — previously some examples pointed at a non-existent `/demo-api` path on the upstream
  - Rework `basic/gateway.ts` to use a catch-all `/*` route with better inline documentation and playground-friendly paths
  - Fix `route-scopes` example: rename `/projects/*` to `/products/*` to match the demo API
  - Fix `shadow-release` example: add `rewritePath` for the primary upstream
  - Fix `cache-resilience` and `webhook-firewall` examples with correct path rewrites
  - Add biome suppression comments for legitimate `any` usage in the `cloudflare-worker` browser rendering example (no DOM lib available in the Workers TS config)
  
  **Lint & Types**
  
  - Suppress `noBannedTypes` lint warning on the `RequiredKeys` utility type (`{}` is intentional for optional-key detection)
  - Suppress `noExplicitAny` in the merge config test (stub adapter in test)
  - Bump wrangler dev dependency from `^4.65.0` to `^4.68.0`
  
  ### @vivero/stoma-cli
  
  - Reformat test assertions in `resolve-security.test.ts` and `wrap.test.ts` for consistency
  
  ### Docs site
  
  - Add `llms.txt` support with four endpoints: `/llms.txt` (index with section links), `/llms-full.txt` (complete docs), `/llms-small.txt` (abridged, no API reference), and `/llms/{section}.txt` (10 per-section pages)
  - Add `robots.txt` with sitemap reference
  - Restore the Node.js deployment guide (`deploy/node/index.mdx`) that went missing
  - Fix OG image meta tags to use absolute URLs instead of relative paths
  - Add `og:image:type` meta tag
  - Fill in `site.webmanifest` name fields (`Stoma — Declarative API Gateway`)
  - Move Monaco editor TS compiler config to `beforeMount` so diagnostics are correct on first load
  - Suppress top-level await false-positive diagnostics (TS 1375 & 1378) in the playground editor
  - Register `@security` as a custom TypeDoc block tag in `astro.config.mjs`
- Updated dependencies [[`cd6bd3a`](https://github.com/vivero-dev/stoma/commit/cd6bd3a619bc30c3369cd9e5546c6ceed537ceaa)]:
  - @vivero/stoma-core@0.1.0-rc.4

## 0.1.0-rc.10
### Patch Changes



- [`c6f0576`](https://github.com/vivero-dev/stoma/commit/c6f05763d6f2ba3e8a3c6845258d57e6f8c1d693) Thanks [@JonathanBennett](https://github.com/JonathanBennett)! - fix: resolve `workspace:*` protocols in published packages
  
  Replaces `changeset publish` with a custom publish script (`scripts/publish.mjs`) that uses `yarn pack` to resolve `workspace:*` protocols and apply `publishConfig` overrides, then `npm publish <tarball>` for OIDC trusted publishing with provenance. The prepack/postpack workaround scripts have been removed.
- Updated dependencies [[`c6f0576`](https://github.com/vivero-dev/stoma/commit/c6f05763d6f2ba3e8a3c6845258d57e6f8c1d693)]:
  - @vivero/stoma-core@0.1.0-rc.3

## 0.1.0-rc.9
### Patch Changes



- [`c6f0576`](https://github.com/vivero-dev/stoma/commit/c6f05763d6f2ba3e8a3c6845258d57e6f8c1d693) Thanks [@JonathanBennett](https://github.com/JonathanBennett)! - fix: publish via `yarn npm publish` to correctly resolve `workspace:*` protocols
  
  Replaces `changeset publish` (which used `npm publish <dir>` and never resolved workspace protocols) with a custom publish script that runs `yarn npm publish` from each package directory. Yarn natively handles `workspace:*` resolution and `publishConfig` field overrides, so the prepack/postpack workaround scripts have been removed.
- Updated dependencies [[`c6f0576`](https://github.com/vivero-dev/stoma/commit/c6f05763d6f2ba3e8a3c6845258d57e6f8c1d693)]:
  - @vivero/stoma-core@0.1.0-rc.2

## 0.1.0-rc.8
### Patch Changes



- [`cfa0a04`](https://github.com/vivero-dev/stoma/commit/cfa0a040eda481782cc34131b2e4b99015e74cea) Thanks [@JonathanBennett](https://github.com/JonathanBennett)! - Add CLI test coverage and split monorepo/package READMEs
  
  ### CLI tests
  
  Add 26 tests across 3 files covering the playground wrapper, OAuth relay, gateway resolution security boundary, and TypeScript transpilation end-to-end:
  
  - **Playground routing invariants**: `/__playground` returns HTML, `/registry` returns exact JSON, non-playground paths always pass through to the gateway
  - **Send proxy contract**: response shape (`status`, `statusText`, `headers`, `body`, `elapsed`), header forwarding, error handling, body stripping for GET
  - **OAuth relay**: interception only fires for navigation requests to callback routes with query params; XSS prevention via `<` escaping
  - **Security boundary**: remote URLs without `--trust-remote` always reject with security warning
  - **TS transpilation e2e**: loads real `.ts` fixture through esbuild, verifies the gateway's fetch handler produces correct responses
  
  ### README
  
  - Root README is now a monorepo landing page with package table, quick start, and dev/release instructions
  - Gateway package (`packages/gateway`) retains the full library README for npm

## 0.1.0-rc.7
### Patch Changes



- [`a414008`](https://github.com/vivero-dev/stoma/commit/a41400882fbe51f9f5ac7f623dec52f0e2ca1dd6) Thanks [@JonathanBennett](https://github.com/JonathanBennett)! - Fix npm publish pipeline to correctly resolve workspace protocols and apply publishConfig overrides
  
  Adds prepack/postpack lifecycle scripts that prepare package.json for `npm publish` by resolving `workspace:*` to real versions and applying `publishConfig` field overrides (main, types, exports, bin). This replaces the previous `@changesets/cli` yarn patch approach and restores compatibility with GitHub Actions OIDC tokens for npm authentication and provenance.
- Updated dependencies [[`a414008`](https://github.com/vivero-dev/stoma/commit/a41400882fbe51f9f5ac7f623dec52f0e2ca1dd6)]:
  - @vivero/stoma-core@0.1.0-rc.1

## 0.1.0-rc.6
### Patch Changes



- [`c14161a`](https://github.com/vivero-dev/stoma/commit/c14161a0846ef1991bb0fa71337435e6366579a7) Thanks [@JonathanBennett](https://github.com/JonathanBennett)! - Fix Content-Encoding/Content-Length mismatch on proxied upstream responses; enrich request logs with upstream target and client IP from socket
  
  ### Fixes
  
  - **Stale encoding headers on URL and Service Binding upstreams**: The runtime's `fetch()` transparently decompresses gzip/deflate/br responses, but the gateway was forwarding the original `Content-Encoding` and `Content-Length` headers unchanged. Downstream clients (browsers, proxies) would then attempt to decompress an already-decoded body, resulting in `ERR_CONTENT_DECODING_FAILED` or `ERR_CONTENT_LENGTH_MISMATCH` errors. Both `createUrlUpstream` and `createServiceBindingUpstream` now strip `content-encoding` and `content-length` from upstream responses before returning them.
  - **`upstream` always "unknown" in request logs**: The `request-log` policy hardcoded `upstream: "unknown"` because no upstream handler was setting the value. All three upstream types (`createUrlUpstream`, `createServiceBindingUpstream`, `createHandlerUpstream`) now set `c.set("_upstreamTarget", identifier)` with the full resolved URL (including rewritten path and query string), `"service-binding:<name>"`, or `"handler"` respectively.
  - **`clientIp` always "unknown" when running locally**: `extractClientIp()` only checked HTTP headers (`cf-connecting-ip`, `x-forwarded-for`), which aren't present when running with `@hono/node-server` locally. Added a `fallbackAddress` option to `extractClientIp()` and a `getRemoteAddress()` helper in `request-log` that duck-types `c.env.incoming.socket.remoteAddress` from the Node.js adapter.

## 0.1.0-rc.5
### Patch Changes



- [`363341d`](https://github.com/vivero-dev/stoma/commit/363341dbc92a9f58a4b7df1ca0c66db2407cfe43) Thanks [@JonathanBennett](https://github.com/JonathanBennett)! - Accept trailing slashes on route paths
  
  ### Fixes
  
  - **Trailing-slash route aliases**: The gateway now registers both `/path` and `/path/` for every non-wildcard route, so requests with a trailing slash no longer 404. This also covers CORS preflight — if a `cors` policy is present, the OPTIONS handler is registered on both variants.
  - **Scope path normalisation**: `scope()` and the internal `joinPaths` helper now strip trailing slashes from prefixes and handle root-path (`"/"`) children correctly, avoiding double-slash joins or unintended `/path/` suffixes.

## 0.1.0-rc.5
### Patch Changes



- [`277d1a2`](https://github.com/vivero-dev/stoma/commit/277d1a2d27d98b444f074e4ecf0ae8095ef6f133) Thanks [@JonathanBennett](https://github.com/JonathanBennett)! - Fix policy middleware swallowing handler return values, breaking context finalization
  
  ### Fixes
  
  - **Policy pipeline context finalization**: `policiesToMiddleware` now propagates the return value from policy handlers back to Hono's compose chain. Previously, policies that short-circuit by returning a `Response` (rather than setting `c.res` or calling `next()`) would have their return value discarded, leaving `context.finalized` as `false` and causing Hono to throw "Context is not finalized". Both the fast path (no tracing) and slow path (OTel/policy trace active) are fixed.
  - **Auto-inject OPTIONS for preflight**: When a route restricts its methods (e.g. `methods: ["GET"]`) and a policy that handles OPTIONS preflight is present, the gateway now automatically registers an OPTIONS handler for that path so preflight requests don't 404.

## 0.1.0-rc.4
### Patch Changes



- [`c4f3901`](https://github.com/vivero-dev/stoma/commit/c4f39017bf8187e5e750d4bae1acb4fe016b78a8) Thanks [@JonathanBennett](https://github.com/JonathanBennett)! - ### Fixes
  
  - Refactored JWT auth validation: Extracted duplicated validation logic from `handler` and `evaluate.onRequest` into a shared `validateJwt()` function. Returns a discriminated `JWTValidationResult`, so each runtime path maps to its own error model.
  
  ### Docs
  
  - Docs have been updated with new about and sustainability pages.

## 0.1.0-rc.3
### Patch Changes



- [`e7ecfb7`](https://github.com/vivero-dev/stoma/commit/e7ecfb763ef8b7a750984690436ce8bf7253f804) Thanks [@JonathanBennett](https://github.com/JonathanBennett)! - # Docs updates only:
  
  Add Open Graph meta tags and decouple docs deployment from package releases
  
  - Add `og:image` and related OG headers to Starlight config
  - Decouple `deploy-docs` CI job from npm publish — docs now deploy on any successful release job


- [`c1485eb`](https://github.com/vivero-dev/stoma/commit/c1485eb0e5933c1e45cb0ba05dff75d11569f46d) Thanks [@JonathanBennett](https://github.com/JonathanBennett)! - Tree-shakeable builds — 57% smaller bundles for consumers
  
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



- [`75d0447`](https://github.com/vivero-dev/stoma/commit/75d04472e736fafe9528e258514a9fe3e352e511) Thanks [@JonathanBennett](https://github.com/JonathanBennett)! - Live demo API, interactive editor links across docs, release workflow fixes
  
  ### Features
  
  - **Demo API gateway** (`docs/src/demo-api/`): Real Stoma gateway deployed alongside the docs site at `/demo-api/*`, serving echo, users, products, status, and delay endpoints. Dogfoods Stoma with rate limiting (60 req/min) and CORS. Same-origin deployment eliminates CORS issues from the editor.
  - **EditorLink on all guide and recipe pages**: Added "Open in Editor" buttons to 8 docs pages — webhook firewall, cache resilience, shadow release, caching (basic + advanced), JWT auth (HMAC + JWKS), route scopes, and the basic gateway partial. Real-world example page converted from inline code to imported example with EditorLink.
  
  ### Fixes
  
  - **EditorLink Unicode encoding**: Replaced `btoa()` with `Buffer.from().toString("base64")` to handle non-Latin1 characters in example code.
  - **Release workflow: npm auth**: Added `NODE_AUTH_TOKEN` env var — `setup-node` with `registry-url` generates an `.npmrc` referencing `NODE_AUTH_TOKEN`, not `NPM_TOKEN`. Without this, `changeset publish` would fail with 401.
  - **Release workflow: docs deploy build**: Added `yarn build` (tsup) step before docs build — the demo API worker imports `@vivero/stoma` which resolves to `dist/`, so stoma must be built first.
  - **Release workflow: docs build command**: Changed from `yarn docs:build` (`astro build` only) to `cd docs && yarn build` (`build:assets && astro build`) so the stoma bundle, editor worker, and service worker are built before Astro runs.
  - **Webhook firewall test**: Rewritten to test policy behavior (auth rejection for missing signature) instead of depending on upstream DNS resolution. Tests no longer make outbound network requests.
  
  ### Docs
  
  - All concept examples updated to use the live demo API (`https://stoma.vivero.dev/demo-api`) as upstream target, so editor demos produce real responses instead of 502 errors.
  - Docs Cloudflare Worker updated with `main` entry point and `ASSETS` binding to serve both the demo API and static assets.

## 0.1.0-rc.1
### Patch Changes



- [`155433e`](https://github.com/vivero-dev/stoma/commit/155433e7eb9f0050cc7b81fdc582e1d9045a583e) Thanks [@JonathanBennett](https://github.com/JonathanBennett)! - Protocol-agnostic policy evaluation, docs editor improvements, lint fixes
  
  - Multi-protocol policy architecture: `PolicyInput`, `PolicyResult`, `PolicyEvaluator` types enabling policies to run outside HTTP (ext_proc, WebSocket)
  - `ipFilter` now exposes `evaluate.onRequest` alongside the existing Hono `handler`
  - Docs editor: Hono types inlined into the stoma type bundle via `--external-inlines hono` (removes hand-written stubs)
  - Docs editor: subpath registration for Monaco IntelliSense (`/sdk`, `/config`, `/adapters/*`)
  - Fixed broken `EditorLink` component (`_href` → `href`)
  - Lint error cleanup

## 0.1.0-rc.0
### Minor Changes



- [`bb4d04f`](https://github.com/vivero-dev/stoma/commit/bb4d04ff85c8c133b10c323d92695cf11b944552) Thanks [@JonathanBennett](https://github.com/JonathanBennett)! - Initial release candidate for v0.1.0
  
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
