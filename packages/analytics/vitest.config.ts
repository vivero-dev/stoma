import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@homegrower-club/stoma/sdk": path.resolve(
        import.meta.dirname,
        "../gateway/src/policies/sdk/index.ts"
      ),
      "@homegrower-club/stoma": path.resolve(
        import.meta.dirname,
        "../gateway/src/index.ts"
      ),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
