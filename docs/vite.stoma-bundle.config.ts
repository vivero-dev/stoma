/**
 * Standalone Vite config for building the Stoma ESM bundle.
 *
 * Produces a single self-contained ESM file at `public/stoma-bundle.esm.js`
 * containing Stoma + Hono + all policies + adapter stores. This bundle is
 * consumed by the editor's in-browser esbuild compiler via a custom resolver
 * plugin that inlines it for user code that imports from `@homegrower-club/stoma`.
 *
 * Usage:
 *   yarn build:stoma-bundle   — one-shot build
 */
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  publicDir: false,

  build: {
    outDir: "public",
    emptyOutDir: false,

    lib: {
      entry: resolve(__dirname, "src/editor/stoma-entry.ts"),
      formats: ["es"],
      fileName: () => "stoma-bundle.esm.js",
    },

    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },

    target: "es2022",
    minify: true,
    sourcemap: false,
  },

  resolve: {
    alias: {
      "@homegrower-club/stoma/adapters/cloudflare": resolve(
        __dirname,
        "../packages/gateway/src/adapters/cloudflare.ts",
      ),
      "@homegrower-club/stoma/adapters/memory": resolve(
        __dirname,
        "../packages/gateway/src/adapters/memory.ts",
      ),
      "@homegrower-club/stoma/sdk": resolve(
        __dirname,
        "../packages/gateway/src/policies/sdk/index.ts",
      ),
      "@homegrower-club/stoma": resolve(__dirname, "../packages/gateway/src/index.ts"),
    },
  },
});
