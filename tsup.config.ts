import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "policies/index": "src/policies/index.ts",
    "config/index": "src/config/index.ts",
    "sdk/index": "src/policies/sdk/index.ts",
    "adapters/index": "src/adapters/index.ts",
    "adapters/cloudflare": "src/adapters/cloudflare.ts",
    "adapters/deno": "src/adapters/deno.ts",
    "adapters/bun": "src/adapters/bun.ts",
    "adapters/node": "src/adapters/node.ts",
    "adapters/memory": "src/adapters/memory.ts",
  },
  format: ["esm"],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  external: ["hono", "zod"],
  outDir: "dist",
  tsconfig: "tsconfig.build.json",
});
