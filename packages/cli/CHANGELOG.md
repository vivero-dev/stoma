# @vivero/stoma-cli

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
