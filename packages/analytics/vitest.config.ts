import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@vivero/stoma/sdk": path.resolve(
        import.meta.dirname,
        "../gateway/src/policies/sdk/index.ts"
      ),
      "@vivero/stoma": path.resolve(
        import.meta.dirname,
        "../gateway/src/index.ts"
      ),
      "@vivero/stoma-core": path.resolve(
        import.meta.dirname,
        "../core/src/index.ts"
      ),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
