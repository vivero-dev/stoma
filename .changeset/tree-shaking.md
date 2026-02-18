---
"@vivero/stoma": patch
---

Tree-shakeable builds — 57% smaller bundles for consumers

### Build

- **Unbundled dist output**: Switched tsup from bundled code-splitting (`splitting: true`) to per-file transpilation (`bundle: false`). The published `dist/` now mirrors the `src/` module structure, allowing consumer bundlers (esbuild, Rollup, webpack) to tree-shake at the module level instead of importing a monolithic chunk.
- **`sideEffects: false`**: Added to `package.json` so bundlers can safely drop unused modules.
- **`/*#__PURE__*/` annotations**: Added to all 33 `definePolicy()` call sites across policy files. These tell bundlers the factory calls can be dropped when their return values are unused.

### Impact

A basic gateway with `requestLog` + `cors` drops from **89 KB / 28 KB gzip** to **38 KB / 15 KB gzip**. Consumers only pay for the policies they actually import.

### Docs

- Fixed rate-limit error response in how-it-works guide: error code corrected from `rate_limit_exceeded` to `rate_limited`, `retryAfter` moved from JSON body to response header (matching actual implementation).
- Fixed IP extraction order: `cf-connecting-ip` checked first, then `x-forwarded-for`.
