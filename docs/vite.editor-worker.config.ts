/**
 * Standalone Vite config for building the editor Web Worker.
 *
 * Produces a single self-contained JS file at `public/editor-worker.js`.
 * The worker receives compiled gateway code via postMessage, imports it
 * from a Blob URL, and processes requests through the gateway.
 *
 * Usage:
 *   yarn build:editor-worker   — one-shot build
 */
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  publicDir: false,

  build: {
    outDir: "public",
    emptyOutDir: false,

    lib: {
      entry: resolve(__dirname, "src/editor/worker.ts"),
      formats: ["es"],
      fileName: () => "editor-worker.js",
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
});
