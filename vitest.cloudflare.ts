import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

// Tests that require the Cloudflare Workers runtime (workerd).
// Currently only the Durable Object adapter tests need this.
export default defineWorkersConfig({
  test: {
    include: ["src/adapters/__tests__/durable-object.test.ts"],
    poolOptions: {
      workers: {
        wrangler: { configPath: "./wrangler.jsonc" },
      },
    },
  },
});
