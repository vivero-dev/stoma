---
"@vivero/stoma-cli": patch
---

Fix esbuild resolution of transitive dependencies when bundling gateway files

The CLI's TypeScript transpiler now includes the `node_modules` of `@vivero/stoma` itself in esbuild's resolve paths, so transitive dependencies like `@vivero/stoma-core` are found even when not hoisted to the top-level `node_modules`.
