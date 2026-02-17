import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/**/*.ts", "!src/**/__tests__/**"],
  format: ["esm"],
  bundle: false,
  dts: true,
  sourcemap: true,
  clean: true,
  external: ["hono", "zod"],
  outDir: "dist",
  tsconfig: "tsconfig.build.json",
});
