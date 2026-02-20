---
"@vivero/stoma-cli": minor
---

Initial release of `@vivero/stoma-cli`

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
