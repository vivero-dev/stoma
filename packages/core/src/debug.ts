/**
 * Zero-dependency debug logging for edge runtimes.
 *
 * Provides `debug`-style namespace-based logging without the `debug` npm
 * package (which relies on `process.env` / `localStorage` and doesn't work
 * reliably in edge runtimes). Output goes to `console.debug()`.
 *
 * Shared between `@homegrower-club/stoma` (gateway) and
 * `@homegrower-club/stoma-analytics` (analytics pipeline).
 *
 * @module debug
 *
 * @example
 * ```ts
 * // Gateway usage
 * createGateway({ debug: "stoma:policy:*", ... });
 *
 * // Analytics usage
 * createProcessor({ debug: "stoma-analytics:processor", ... });
 *
 * // Direct usage
 * const debug = createDebugger("stoma:gateway", true);
 * debug("route registered", { path: "/api/users", methods: ["GET"] });
 * // Output: [stoma:gateway] route registered {"path":"/api/users","methods":["GET"]}
 * ```
 */

/** A debug logging function - call with a message and optional structured data. */
export type DebugLogger = (message: string, ...args: unknown[]) => void;

/** No-op logger used when debug is disabled */
export const noopDebugLogger: DebugLogger = () => {};

/**
 * Create a debug logger for the given namespace.
 *
 * @param namespace - e.g. "stoma:gateway", "stoma-analytics:processor"
 * @param enabled - true = all namespaces, false/undefined = none, string = comma-separated glob patterns
 *
 * @example
 * ```ts
 * const debug = createDebugger("stoma:gateway", true);
 * debug("route registered", { path: "/api/users", methods: ["GET"] });
 *
 * const debug2 = createDebugger("stoma:policy:cache", "stoma:policy:*");
 * debug2("HIT", "GET:/api/users");
 * ```
 */
export function createDebugger(
  namespace: string,
  enabled: boolean | string | undefined
): DebugLogger {
  if (!enabled) return noopDebugLogger;

  if (typeof enabled === "string" && !matchNamespace(namespace, enabled)) {
    return noopDebugLogger;
  }

  return (message: string, ...args: unknown[]) => {
    const parts = [`[${namespace}]`, message];
    for (const arg of args) {
      parts.push(
        typeof arg === "object" && arg !== null
          ? JSON.stringify(arg)
          : String(arg)
      );
    }
    console.debug(parts.join(" "));
  };
}

/**
 * Check if a namespace matches a comma-separated list of glob patterns.
 *
 * Supports `*` as a wildcard for any sequence of characters.
 *
 * @example
 * ```ts
 * matchNamespace("stoma:gateway", "stoma:*")                    // true
 * matchNamespace("stoma:policy:cache", "stoma:policy:*")        // true
 * matchNamespace("stoma:gateway", "stoma:upstream")             // false
 * matchNamespace("stoma:gateway", "stoma:gateway,stoma:upstream") // true
 * matchNamespace("stoma:gateway", "*")                          // true
 * ```
 */
export function matchNamespace(namespace: string, pattern: string): boolean {
  const patterns = pattern.split(",").map((p) => p.trim());
  return patterns.some((p) => {
    if (p === "*") return true;
    // Escape regex special chars, then convert * to .*
    const regexStr = p
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, ".*");
    return new RegExp(`^${regexStr}$`).test(namespace);
  });
}

/**
 * Create a debug factory that produces namespaced loggers.
 * Caches loggers by namespace so repeated calls return the same function.
 *
 * @param enabled - The gateway/processor debug setting
 * @returns A factory function: `(namespace) => DebugLogger`
 */
export function createDebugFactory(
  enabled: boolean | string | undefined
): (namespace: string) => DebugLogger {
  if (!enabled) return () => noopDebugLogger;

  const cache = new Map<string, DebugLogger>();

  return (namespace: string) => {
    const cached = cache.get(namespace);
    if (cached) return cached;

    const logger = createDebugger(namespace, enabled);
    cache.set(namespace, logger);
    return logger;
  };
}
