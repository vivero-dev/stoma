---
"@homegrower-club/stoma": patch
---

Live demo API, interactive editor links across docs, release workflow fixes

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
