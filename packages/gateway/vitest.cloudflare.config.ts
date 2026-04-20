import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

// Tests that require the Cloudflare Workers runtime (workerd).
// Currently only the Durable Object adapter tests need this.
export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc" },
    }),
  ],
  test: {
    name: "@vivero/stoma-cloudflare",
    include: ["src/adapters/__tests__/durable-object.test.ts"],
  },
});
