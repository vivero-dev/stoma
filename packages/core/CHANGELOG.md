# @vivero/stoma-core

## 0.1.0-rc.4
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

## 0.1.0-rc.3
### Patch Changes



- [`c6f0576`](https://github.com/vivero-dev/stoma/commit/c6f05763d6f2ba3e8a3c6845258d57e6f8c1d693) Thanks [@JonathanBennett](https://github.com/JonathanBennett)! - fix: resolve `workspace:*` protocols in published packages
  
  Replaces `changeset publish` with a custom publish script (`scripts/publish.mjs`) that uses `yarn pack` to resolve `workspace:*` protocols and apply `publishConfig` overrides, then `npm publish <tarball>` for OIDC trusted publishing with provenance. The prepack/postpack workaround scripts have been removed.

## 0.1.0-rc.2
### Patch Changes



- [`c6f0576`](https://github.com/vivero-dev/stoma/commit/c6f05763d6f2ba3e8a3c6845258d57e6f8c1d693) Thanks [@JonathanBennett](https://github.com/JonathanBennett)! - fix: publish via `yarn npm publish` to correctly resolve `workspace:*` protocols
  
  Replaces `changeset publish` (which used `npm publish <dir>` and never resolved workspace protocols) with a custom publish script that runs `yarn npm publish` from each package directory. Yarn natively handles `workspace:*` resolution and `publishConfig` field overrides, so the prepack/postpack workaround scripts have been removed.

## 0.1.0-rc.1
### Patch Changes



- [`a414008`](https://github.com/vivero-dev/stoma/commit/a41400882fbe51f9f5ac7f623dec52f0e2ca1dd6) Thanks [@JonathanBennett](https://github.com/JonathanBennett)! - Fix npm publish pipeline to correctly resolve workspace protocols and apply publishConfig overrides
  
  Adds prepack/postpack lifecycle scripts that prepare package.json for `npm publish` by resolving `workspace:*` to real versions and applying `publishConfig` field overrides (main, types, exports, bin). This replaces the previous `@changesets/cli` yarn patch approach and restores compatibility with GitHub Actions OIDC tokens for npm authentication and provenance.
