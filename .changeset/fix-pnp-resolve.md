---
"@vivero/stoma-cli": patch
---

### @vivero/stoma-cli

**Bug Fix**

- Fix `yarn dlx` / Yarn PnP resolution failure: `--trust-remote` (and local TS files outside a project) failed with `Could not resolve "@vivero/stoma"` because esbuild's `nodePaths` only works with `node_modules` directories. Added an esbuild resolve plugin that uses `createRequire(import.meta.url)` — PnP patches this, so resolution works in all package manager environments (npm, yarn, pnpm, bun)
