/**
 * `definePolicy()` - full convenience wrapper for policy authors.
 *
 * Combines {@link resolveConfig}, {@link policyDebug}, and {@link withSkip}
 * into a single declarative API. Takes a {@link PolicyDefinition} and returns
 * a factory function `(config?) => Policy`.
 *
 * Supports both HTTP-specific handlers (Hono middleware) and protocol-agnostic
 * evaluators for multi-runtime policies (ext_proc, WebSocket).
 *
 * @module define-policy
 */
import type { Context, Next } from "hono";
import { getGatewayContext } from "../../core/pipeline";
import type {
  PolicyEvalContext,
  PolicyEvaluator,
  PolicyInput,
  PolicyResult,
  ProcessingPhase,
} from "../../core/protocol";
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
  /** Trace reporter - always callable, no-op when tracing is not active. */
  trace: TraceReporter;
  /** Gateway context, or `undefined` when running outside a gateway pipeline. */
  gateway: PolicyContext | undefined;
}

/**
 * Context injected into `definePolicy` evaluate handlers.
 *
 * Parallel to {@link PolicyHandlerContext} but protocol-agnostic -
 * no Hono types. Extends the runtime-facing {@link PolicyEvalContext}
 * with the fully-merged, typed config.
 */
export interface PolicyEvalHandlerContext<TConfig> extends PolicyEvalContext {
  /** Fully merged config (defaults + user overrides). */
  config: TConfig;
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
   * The HTTP policy handler. Receives the Hono context, `next`, and a
   * {@link PolicyHandlerContext} with config, debug, and gateway context.
   *
   * Used by the HTTP runtime ({@link createGateway}).
   */
  handler: (
    c: Context,
    next: Next,
    ctx: PolicyHandlerContext<TConfig>
  ) => Promise<void> | void;

  /**
   * Protocol-agnostic evaluator for multi-runtime policies.
   *
   * Used by non-HTTP runtimes (ext_proc, WebSocket). The HTTP runtime
   * uses {@link handler} and ignores this field.
   *
   * Implement this alongside `handler` to make a policy work across
   * all runtimes. The `config` is pre-merged and injected into
   * {@link PolicyEvalHandlerContext}.
   *
   * @example
   * ```ts
   * const myPolicy = definePolicy<MyConfig>({
   *   name: "my-policy",
   *   priority: Priority.AUTH,
   *   phases: ["request-headers"],
   *   handler: async (c, next, { config }) => { ... },
   *   evaluate: {
   *     onRequest: async (input, { config }) => {
   *       const token = input.headers.get("authorization");
   *       if (!token) return { action: "reject", status: 401, code: "unauthorized", message: "Missing" };
   *       return { action: "continue" };
   *     },
   *   },
   * });
   * ```
   */
  evaluate?: {
    onRequest?: (
      input: PolicyInput,
      ctx: PolicyEvalHandlerContext<TConfig>
    ) => Promise<PolicyResult>;
    onResponse?: (
      input: PolicyInput,
      ctx: PolicyEvalHandlerContext<TConfig>
    ) => Promise<PolicyResult>;
  };

  /**
   * Processing phases this policy participates in.
   *
   * Used by phase-based runtimes (ext_proc) to skip policies that
   * don't apply to the current phase. Passed through to the
   * returned {@link Policy.phases}.
   *
   * Default: `["request-headers"]`.
   */
  phases?: ProcessingPhase[];

  /**
   * Set to `true` for policies that only work with the HTTP protocol.
   *
   * These policies rely on HTTP-specific concepts (Request/Response objects,
   * specific headers, HTTP status codes, etc.) and cannot be meaningfully
   * evaluated in other protocols like ext_proc or WebSocket.
   *
   * When set, this is passed through to the returned Policy's `httpOnly` property.
   */
  httpOnly?: true;
}

/**
 * Extract the keys of T that are required (not optional).
 * Evaluates to `never` when all keys are optional.
 */
type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

/**
 * Conditional policy factory type.
 *
 * When `TConfig` has at least one required key, the factory requires
 * a config argument. When all keys are optional (or TConfig is the
 * base `PolicyConfig`), config is optional.
 *
 * This closes the gap between "type-safe config" and the runtime
 * `validate` callback - the editor catches missing required fields
 * at compile time.
 */
export type PolicyFactory<TConfig extends PolicyConfig> =
  RequiredKeys<TConfig> extends never
    ? (config?: TConfig) => Policy
    : (config: TConfig) => Policy;

/**
 * Create a policy factory from a declarative definition.
 *
 * The returned factory function accepts user config, merges it with
 * defaults, wires up skip logic, and injects a debug logger at
 * request time.
 *
 * When `TConfig` has required keys, the factory requires a config
 * argument. When all keys are optional, config is optional.
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
 * @returns A factory function whose config parameter is required or optional based on TConfig.
 */
export function definePolicy<TConfig extends PolicyConfig = PolicyConfig>(
  definition: PolicyDefinition<TConfig>
): PolicyFactory<TConfig> {
  return ((userConfig?: TConfig): Policy => {
    const config = resolveConfig<TConfig>(
      (definition.defaults ?? {}) as Partial<TConfig>,
      userConfig as Partial<TConfig> | undefined
    );

    // Construction-time validation - fail fast on bad config
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

    // Build the protocol-agnostic evaluator by injecting the merged
    // config into the runtime-provided PolicyEvalContext.
    let evaluate: PolicyEvaluator | undefined;
    if (definition.evaluate) {
      const defEval = definition.evaluate;
      evaluate = {
        onRequest: defEval.onRequest
          ? (input: PolicyInput, ctx: PolicyEvalContext) =>
              defEval.onRequest!(input, { ...ctx, config })
          : undefined,
        onResponse: defEval.onResponse
          ? (input: PolicyInput, ctx: PolicyEvalContext) =>
              defEval.onResponse!(input, { ...ctx, config })
          : undefined,
      };
    }

    return {
      name: definition.name,
      priority: definition.priority ?? Priority.DEFAULT,
      handler,
      evaluate,
      phases: definition.phases,
      httpOnly: definition.httpOnly,
    };
  }) as PolicyFactory<TConfig>;
}
