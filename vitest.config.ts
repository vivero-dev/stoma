import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@homegrower-club/stoma/config": path.resolve(import.meta.dirname, "src/config/index.ts"),
      "@homegrower-club/stoma/adapters": path.resolve(import.meta.dirname, "src/adapters/index.ts"),
      "@homegrower-club/stoma": path.resolve(import.meta.dirname, "src/index.ts"),
    },
  },
  test: {
    include: [
      "src/**/*.test.ts",
      "examples/__tests__/**/*.test.ts",
    ],
    exclude: [
      "src/adapters/__tests__/**", // Requires Cloudflare Workers pool — see vitest.cloudflare.ts
    ],
    coverage: {
      provider: "istanbul",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/**/index.ts"],
    },
  },
});
