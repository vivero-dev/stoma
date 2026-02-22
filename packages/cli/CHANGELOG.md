# @vivero/stoma-cli

## 0.1.0-rc.6
### Patch Changes



- [`c6f0576`](https://github.com/vivero-dev/stoma/commit/c6f05763d6f2ba3e8a3c6845258d57e6f8c1d693) Thanks [@JonathanBennett](https://github.com/JonathanBennett)! - fix: resolve `workspace:*` protocols in published packages
  
  Replaces `changeset publish` with a custom publish script (`scripts/publish.mjs`) that uses `yarn pack` to resolve `workspace:*` protocols and apply `publishConfig` overrides, then `npm publish <tarball>` for OIDC trusted publishing with provenance. The prepack/postpack workaround scripts have been removed.
- Updated dependencies [[`c6f0576`](https://github.com/vivero-dev/stoma/commit/c6f05763d6f2ba3e8a3c6845258d57e6f8c1d693)]:
  - @vivero/stoma@0.1.0-rc.10

## 0.1.0-rc.5
### Patch Changes



- [`c6f0576`](https://github.com/vivero-dev/stoma/commit/c6f05763d6f2ba3e8a3c6845258d57e6f8c1d693) Thanks [@JonathanBennett](https://github.com/JonathanBennett)! - fix: publish via `yarn npm publish` to correctly resolve `workspace:*` protocols
  
  Replaces `changeset publish` (which used `npm publish <dir>` and never resolved workspace protocols) with a custom publish script that runs `yarn npm publish` from each package directory. Yarn natively handles `workspace:*` resolution and `publishConfig` field overrides, so the prepack/postpack workaround scripts have been removed.
- Updated dependencies [[`c6f0576`](https://github.com/vivero-dev/stoma/commit/c6f05763d6f2ba3e8a3c6845258d57e6f8c1d693)]:
  - @vivero/stoma@0.1.0-rc.9

## 0.1.0-rc.4
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
- Updated dependencies [[`cfa0a04`](https://github.com/vivero-dev/stoma/commit/cfa0a040eda481782cc34131b2e4b99015e74cea)]:
  - @vivero/stoma@0.1.0-rc.8

## 0.1.0-rc.3
### Patch Changes



- [`a414008`](https://github.com/vivero-dev/stoma/commit/a41400882fbe51f9f5ac7f623dec52f0e2ca1dd6) Thanks [@JonathanBennett](https://github.com/JonathanBennett)! - Fix npm publish pipeline to correctly resolve workspace protocols and apply publishConfig overrides
  
  Adds prepack/postpack lifecycle scripts that prepare package.json for `npm publish` by resolving `workspace:*` to real versions and applying `publishConfig` field overrides (main, types, exports, bin). This replaces the previous `@changesets/cli` yarn patch approach and restores compatibility with GitHub Actions OIDC tokens for npm authentication and provenance.
- Updated dependencies [[`a414008`](https://github.com/vivero-dev/stoma/commit/a41400882fbe51f9f5ac7f623dec52f0e2ca1dd6)]:
  - @vivero/stoma@0.1.0-rc.7

## 0.1.0-rc.2
### Patch Changes



- [`ca21e7a`](https://github.com/vivero-dev/stoma/commit/ca21e7ad128b83c6f3398d30098644761e0e3501) Thanks [@JonathanBennett](https://github.com/JonathanBennett)! - Fix esbuild resolution of transitive dependencies when bundling gateway files
  
  The CLI's TypeScript transpiler now includes the `node_modules` of `@vivero/stoma` itself in esbuild's resolve paths, so transitive dependencies like `@vivero/stoma-core` are found even when not hoisted to the top-level `node_modules`.

## 0.1.0-rc.1
### Minor Changes



- [`44f78e4`](https://github.com/vivero-dev/stoma/commit/44f78e462b92d6f719c6622e3e1126a6d343920f) Thanks [@JonathanBennett](https://github.com/JonathanBennett)! - Initial release of `@vivero/stoma-cli`
  
  Local development server and interactive playground for Stoma API gateways.
  
  ### Features
  
  - **`stoma run <file>`**: Load a gateway file (TypeScript or JS) and serve it on a local Node.js HTTP server via `@hono/node-server`. TypeScript files are automatically bundled with esbuild — no build step or `tsconfig` required.
  - **Remote gateway files**: `stoma run https://... --trust-remote` fetches, transpiles, and serves a gateway from a URL.
  - **Flexible export resolution**: Supports `export default createGateway(...)`, async factory functions, `createPlaygroundGateway` named exports, and bare Hono apps.
  - **Interactive playground** (`--playground`): Serves a browser UI at `/__playground` with a two-pane layout — request builder on the left, response viewer on the right. Includes:
    - Route chips for quick path selection (wildcard paths like `/api/*` display as `/api/` to avoid 404s)
    - Structured header key-value table with add/remove per row
    - Response tabs: Pretty (syntax-highlighted JSON), Raw, and Headers (with count badge)
    - Token store: OAuth tokens persisted in localStorage, auto-detected from response bodies, and auto-applied as `Authorization: Bearer` headers
    - OAuth popup flow: redirect detection, authorization popup, callback relay via `postMessage`, and a banner prompting the user to complete the exchange
  - **CLI options**: `--port`, `--host`, `--debug` (gateway debug logging), `--verbose` (CLI output), graceful shutdown on SIGINT/SIGTERM.

### Patch Changes

- Updated dependencies [[`c14161a`](https://github.com/vivero-dev/stoma/commit/c14161a0846ef1991bb0fa71337435e6366579a7)]:
  - @vivero/stoma@0.1.0-rc.6
