import { existsSync } from "node:fs";
import { mkdtemp, rm, unlink, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import type { GatewayInstance } from "./types.js";

export interface ResolveOptions {
  debug?: boolean;
  /** Allow fetching gateway files from remote URLs. */
  trustRemote?: boolean;
}

const TS_EXTENSIONS = [".ts", ".tsx", ".mts"];

/**
 * Dynamic-import a gateway file and resolve its export to a GatewayInstance.
 *
 * TypeScript files are automatically transpiled via esbuild before importing.
 * Remote URLs (http/https) are supported when `trustRemote` is set.
 */
export async function resolveGateway(
  filePathOrUrl: string,
  options: ResolveOptions = {}
): Promise<GatewayInstance> {
  if (isRemoteUrl(filePathOrUrl)) {
    if (!options.trustRemote) {
      throw new Error(
        "Remote URLs require the --trust-remote flag.\n" +
          "This will download and execute code from the URL. Only use with trusted sources."
      );
    }
    return resolveRemoteGateway(filePathOrUrl, options);
  }

  if (!existsSync(filePathOrUrl)) {
    throw new Error(`File not found: ${filePathOrUrl}`);
  }

  return resolveLocalFile(filePathOrUrl, options);
}

async function resolveLocalFile(
  filePath: string,
  options: ResolveOptions
): Promise<GatewayInstance> {
  const isTypeScript = TS_EXTENSIONS.some((ext) => filePath.endsWith(ext));

  let mod: Record<string, unknown>;

  if (isTypeScript) {
    mod = await importTypeScript(filePath);
  } else {
    try {
      mod = await import(pathToFileURL(filePath).href);
    } catch (err) {
      throw new Error(
        `Failed to import: ${filePath}\n${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return resolveFromModule(mod, options);
}

function isRemoteUrl(input: string): boolean {
  return input.startsWith("http://") || input.startsWith("https://");
}

/**
 * Fetch a remote gateway file to a temp directory, resolve it, then clean up.
 */
async function resolveRemoteGateway(
  url: string,
  options: ResolveOptions
): Promise<GatewayInstance> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch remote gateway: ${res.status} ${res.statusText}`
    );
  }

  const filename = filenameFromUrl(url, res.headers.get("content-type"));
  const tmpDir = await mkdtemp(path.join(tmpdir(), "stoma-remote-"));
  const tmpPath = path.join(tmpDir, filename);

  try {
    await writeFile(tmpPath, await res.text(), "utf-8");
    return await resolveLocalFile(tmpPath, options);
  } finally {
    await unlink(tmpPath).catch(() => {});
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

/**
 * Derive a filename (with extension) from a URL path and optional content-type.
 * Falls back to `.ts` so esbuild can transpile unknown sources.
 */
function filenameFromUrl(url: string, contentType: string | null): string {
  const pathname = new URL(url).pathname;
  const basename = path.basename(pathname);

  // If the URL has a recognisable extension, use it
  if (/\.(ts|tsx|mts|js|mjs|cjs)$/.test(basename)) {
    return basename;
  }

  // Infer from content-type
  if (contentType?.includes("javascript")) {
    return "gateway.mjs";
  }
  if (contentType?.includes("typescript")) {
    return "gateway.ts";
  }

  // Default to TypeScript — esbuild can handle both TS and JS
  return basename ? `${basename}.ts` : "gateway.ts";
}

/**
 * Get the node_modules search paths from the CLI's own install location.
 * Uses Node's own resolution algorithm via createRequire, so it works
 * correctly regardless of monorepo hoisting, Yarn PnP, or flat installs.
 */
function getCliNodePaths(): string[] {
  const require = createRequire(import.meta.url);
  const paths = (require.resolve.paths("@vivero/stoma") ?? []).filter(
    existsSync
  );

  // Also include the node_modules of @vivero/stoma itself, so transitive
  // deps like @vivero/stoma-core are resolvable even if not hoisted.
  try {
    const stomaEntry = require.resolve("@vivero/stoma");
    const stomaDir = path.dirname(stomaEntry);
    // Walk up to find the package root (contains package.json)
    let dir = stomaDir;
    while (dir !== path.dirname(dir)) {
      if (existsSync(path.join(dir, "package.json"))) {
        const nested = path.join(dir, "node_modules");
        if (existsSync(nested) && !paths.includes(nested)) {
          paths.unshift(nested);
        }
        break;
      }
      dir = path.dirname(dir);
    }
  } catch {
    // @vivero/stoma not resolvable — will error later during build
  }

  return paths;
}

/**
 * Transpile a TypeScript file with esbuild and import the result.
 *
 * Bundles all dependencies into a self-contained JS file so the output
 * runs without any npm install — matching how the docs editor compiles
 * gateway configs. The temp file is written next to the source and
 * cleaned up after import.
 *
 * Uses `nodePaths` from the CLI's own install so that `@vivero/stoma`
 * and `hono` are always available, even when the gateway file lives
 * outside any project (e.g. ~/Downloads/).
 */
async function importTypeScript(
  filePath: string
): Promise<Record<string, unknown>> {
  const tmpFile = filePath.replace(/\.tsx?$/, `.stoma-tmp-${Date.now()}.mjs`);

  try {
    const result = await build({
      entryPoints: [filePath],
      bundle: true,
      format: "esm",
      platform: "node",
      target: "node20",
      nodePaths: getCliNodePaths(),
      write: false,
      logLevel: "silent",
    });

    if (!result.outputFiles?.length) {
      throw new Error("TypeScript transpilation produced no output");
    }

    await writeFile(tmpFile, result.outputFiles[0].text, "utf-8");
    return await import(pathToFileURL(tmpFile).href);
  } catch (err) {
    if (
      err instanceof Error &&
      err.message.includes("TypeScript transpilation")
    ) {
      throw err;
    }
    throw new Error(
      `Failed to transpile TypeScript: ${filePath}\n${err instanceof Error ? err.message : String(err)}`
    );
  } finally {
    await unlink(tmpFile).catch(() => {});
  }
}

/**
 * Resolve a GatewayInstance from a module's exports.
 *
 * Resolution order:
 * 1. `mod.createPlaygroundGateway` (function) — backward compat with editor snippets
 * 2. `mod.default` (function) — call as async factory
 * 3. `mod.default` (object with `.app` + `._registry`) — GatewayInstance directly
 * 4. `mod.default` (object with `.fetch`) — bare Hono app, wrap in minimal instance
 * 5. Throw descriptive error
 */
export async function resolveFromModule(
  mod: Record<string, unknown>,
  _options: ResolveOptions = {}
): Promise<GatewayInstance> {
  // 1. Named export: createPlaygroundGateway()
  if (typeof mod.createPlaygroundGateway === "function") {
    const result = await mod.createPlaygroundGateway();
    return asGatewayInstance(result, "createPlaygroundGateway()");
  }

  // 2. Default export: factory function
  if (typeof mod.default === "function") {
    const result = await mod.default();
    return asGatewayInstance(result, "default()");
  }

  // 3. Default export: GatewayInstance directly
  if (isGatewayInstance(mod.default)) {
    return mod.default;
  }

  // 4. Default export: bare Hono app (has .fetch)
  if (isHonoApp(mod.default)) {
    return {
      app: mod.default,
      name: "unnamed-gateway",
      routeCount: 0,
      _registry: { routes: [], policies: [], gatewayName: "unnamed-gateway" },
    };
  }

  throw new Error(
    "Could not resolve a gateway from the module exports.\n\n" +
      "The file must export a gateway in one of these forms:\n" +
      "  export default createGateway({ ... })\n" +
      "  export default async function() { return createGateway({ ... }) }\n" +
      "  export function createPlaygroundGateway() { return createGateway({ ... }) }\n" +
      "  export default app  // a Hono app with a .fetch method"
  );
}

function isGatewayInstance(value: unknown): value is GatewayInstance {
  return (
    typeof value === "object" &&
    value !== null &&
    "app" in value &&
    "_registry" in value
  );
}

function isHonoApp(
  value: unknown
): value is { fetch: (req: Request) => Response | Promise<Response> } {
  return (
    typeof value === "object" &&
    value !== null &&
    "fetch" in value &&
    typeof (value as Record<string, unknown>).fetch === "function"
  );
}

function asGatewayInstance(value: unknown, source: string): GatewayInstance {
  if (isGatewayInstance(value)) {
    return value;
  }
  if (isHonoApp(value)) {
    return {
      app: value,
      name: "unnamed-gateway",
      routeCount: 0,
      _registry: { routes: [], policies: [], gatewayName: "unnamed-gateway" },
    };
  }
  throw new Error(
    `${source} did not return a valid gateway instance. ` +
      "Expected an object with .app and ._registry properties, or a Hono app with a .fetch method."
  );
}
