/**
 * In-browser TypeScript compiler using esbuild-wasm.
 *
 * Compiles user-written gateway TypeScript into a self-contained JS bundle
 * by resolving `@homegrower-club/stoma` imports against the pre-bundled
 * `/stoma-bundle.esm.js` file.
 */
import * as esbuild from "esbuild-wasm";

let initialized = false;
let stomaBundleText: string | null = null;

/** Initialize esbuild WASM runtime. Call once before compiling. */
async function ensureInitialized(): Promise<void> {
  if (initialized) return;

  await esbuild.initialize({
    wasmURL: "https://unpkg.com/esbuild-wasm@0.24.2/esbuild.wasm",
  });
  initialized = true;
}

/** Fetch and cache the pre-built Stoma ESM bundle text. */
async function getStomaBundleText(): Promise<string> {
  if (stomaBundleText) return stomaBundleText;

  const res = await fetch("/stoma-bundle.esm.js");
  if (!res.ok) {
    throw new Error(
      `Failed to fetch stoma bundle: ${res.status} ${res.statusText}`
    );
  }
  stomaBundleText = await res.text();
  return stomaBundleText;
}

/**
 * esbuild plugin that intercepts `@homegrower-club/stoma` and `hono` imports,
 * resolving them against the pre-bundled ESM file so the compiled output is
 * entirely self-contained with zero external imports.
 */
function stomaResolverPlugin(): esbuild.Plugin {
  return {
    name: "stoma-resolver",
    setup(build) {
      // Intercept all stoma and hono imports
      build.onResolve({ filter: /^@homegrower-club\/stoma|^hono/ }, (args) => ({
        path: args.path,
        namespace: "stoma-bundle",
      }));

      // Return the full bundle contents for any stoma/hono import
      build.onLoad({ filter: /.*/, namespace: "stoma-bundle" }, async () => {
        const contents = await getStomaBundleText();
        return { contents, loader: "js" };
      });
    },
  };
}

/**
 * Compile user TypeScript code into a self-contained JavaScript bundle.
 *
 * The compiled output inlines all Stoma and Hono dependencies so it can be
 * loaded via a Blob URL in the editor Web Worker.
 *
 * @throws Error with line/column info on compilation failure
 */
export async function compileGatewayCode(userCode: string): Promise<string> {
  await ensureInitialized();

  const result = await esbuild.build({
    stdin: {
      contents: userCode,
      loader: "ts",
      resolveDir: "/",
      sourcefile: "gateway-config.ts",
    },
    bundle: true,
    format: "esm",
    target: "es2022",
    platform: "browser",
    plugins: [stomaResolverPlugin()],
    write: false,
  });

  if (result.errors.length > 0) {
    const err = result.errors[0];
    const location = err.location
      ? ` (line ${err.location.line}, col ${err.location.column})`
      : "";
    throw new Error(`${err.text}${location}`);
  }

  if (!result.outputFiles || result.outputFiles.length === 0) {
    throw new Error("Compilation produced no output");
  }

  return result.outputFiles[0].text;
}
