import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      "packages/gateway/vitest.config.ts",
      "packages/gateway/vitest.cloudflare.config.ts",
      "packages/analytics/vitest.config.ts",
      "packages/cli/vitest.config.ts",
    ],
  },
});
