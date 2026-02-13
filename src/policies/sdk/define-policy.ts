/**
 * `definePolicy()` — full convenience wrapper for policy authors.
 *
 * Combines {@link resolveConfig}, {@link policyDebug}, and {@link withSkip}
 * into a single declarative API. Takes a {@link PolicyDefinition} and returns
 * a factory function `(config?) => Policy`.
 *
 * @module define-policy
 */
import type { Context, Next } from "hono";
import { getGatewayContext } from "../../core/pipeline";
import type { DebugLogger } from "../../utils/debug";
import type { Policy, PolicyConfig, PolicyContext } from "../types";
import { policyDebug, resolveConfig, withSkip } from "./helpers";
import { Priority } from "./priority";
import { policyTrace, type TraceReporter } from "./trace";

/**
 * Context injected into every `definePolicy` handler invocation.
 *
 * Provides the fully-merged config, a pre-namespaced debug logger,
 * and the gateway context (request ID, trace ID, etc.).
 */
export interface PolicyHandlerContext<TConfig> {
  /** Fully merged config (defaults + user overrides). */
  config: TConfig;
  /** Debug logger pre-namespaced to `stoma:policy:{name}`. Always callable. */
  debug: DebugLogger;
  /** Trace reporter — always callable, no-op when tracing is not active. */
  trace: TraceReporter;
  /** Gateway context, or `undefined` when running outside a gateway pipeline. */
  gateway: PolicyContext | undefined;
}

/**
 * Declarative policy definition passed to {@link definePolicy}.
 */
export interface PolicyDefinition<TConfig extends PolicyConfig = PolicyConfig> {
  /** Unique policy name (e.g. `"my-auth"`, `"custom-cache"`). */
  name: string;
  /** Execution priority. Use {@link Priority} constants. Default: `Priority.DEFAULT` (100). */
  priority?: number;
  /** Default values for optional config fields. */
  defaults?: Partial<TConfig>;
  /**
   * Optional construction-time config validation.
   *
   * Called once when the factory is invoked (before any requests).
   * Throw a {@link GatewayError} to reject invalid config eagerly
   * rather than failing on the first request.
   */
  validate?: (config: TConfig) => void;
  /**
   * The policy handler. Receives the Hono context, `next`, and a
   * {@link PolicyHandlerContext} with config, debug, and gateway context.
   */
  handler: (
    c: Context,
    next: Next,
    ctx: PolicyHandlerContext<TConfig>
  ) => Promise<void> | void;
}

/**
 * Create a policy factory from a declarative definition.
 *
 * The returned factory function accepts optional user config, merges it
 * with defaults, wires up skip logic, and injects a debug logger at
 * request time.
 *
 * @example
 * ```ts
 * import { definePolicy, Priority } from "@homegrower-club/stoma";
 *
 * const myPolicy = definePolicy<MyConfig>({
 *   name: "my-policy",
 *   priority: Priority.AUTH,
 *   defaults: { headerName: "x-custom" },
 *   handler: async (c, next, { config, debug }) => {
 *     debug("checking header");
 *     const value = c.req.header(config.headerName!);
 *     if (!value) throw new GatewayError(401, "unauthorized", "Missing header");
 *     await next();
 *   },
 * });
 *
 * // Usage: myPolicy({ headerName: "x-api-key" })
 * ```
 *
 * @param definition - Policy name, priority, defaults, and handler.
 * @returns A factory function: `(config?) => Policy`.
 */
export function definePolicy<TConfig extends PolicyConfig = PolicyConfig>(
  definition: PolicyDefinition<TConfig>
): (config?: TConfig) => Policy {
  return (userConfig?: TConfig): Policy => {
    const config = resolveConfig<TConfig>(
      (definition.defaults ?? {}) as Partial<TConfig>,
      userConfig as Partial<TConfig> | undefined
    );

    // Construction-time validation — fail fast on bad config
    if (definition.validate) {
      definition.validate(config);
    }

    const rawHandler = async (c: Context, next: Next): Promise<void> => {
      const debug = policyDebug(c, definition.name);
      const trace = policyTrace(c, definition.name);
      const gateway = getGatewayContext(c);
      await definition.handler(c, next, { config, debug, trace, gateway });
    };

    const handler = withSkip(config.skip, rawHandler);

    return {
      name: definition.name,
      priority: definition.priority ?? Priority.DEFAULT,
      handler,
    };
  };
}
