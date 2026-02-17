/**
 * Standalone Vite config for building the playground service worker.
 *
 * Produces a single self-contained JS file at `public/playground-sw.js`.
 * Everything (Hono, Stoma policies, stores) is bundled inline because
 * service workers cannot use ES module imports at runtime.
 *
 * Usage:
 *   yarn build:sw          — one-shot build
 *   yarn dev:sw            — watch mode (rebuilds on save)
 *
 * This runs BEFORE `astro build` so the SW file is available as a
 * static asset in the docs site.
 */
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  // Disable publicDir copying — we're outputting INTO public/
  publicDir: false,

  build: {
    // Output to public/ so Astro serves it as a static asset
    outDir: "public",
    emptyOutDir: false, // Don't delete favicons and other existing assets

    lib: {
      entry: resolve(__dirname, "src/playground/sw.ts"),
      formats: ["es"],
      fileName: () => "playground-sw.js",
    },

    // Bundle everything — SWs can't do module imports
    rollupOptions: {
      output: {
        // Single flat file, no code splitting
        inlineDynamicImports: true,
      },
    },

    target: "es2022",
    minify: true,
    sourcemap: false,
  },

  resolve: {
    alias: {
      // Resolve Stoma imports to sibling package source (no build step needed)
      "@homegrower-club/stoma/adapters/cloudflare": resolve(
        __dirname,
        "../packages/gateway/src/adapters/cloudflare.ts",
      ),
      "@homegrower-club/stoma": resolve(__dirname, "../packages/gateway/src/index.ts"),
    },
  },
});
