/**
 * Policy SDK - shared primitives for building built-in and custom policies.
 *
 * Four layers of increasing convenience:
 *
 * 1. **Priority** - Named constants for policy ordering (lower = earlier).
 * 2. **Composable helpers** - `resolveConfig`, `policyDebug`, `withSkip` for eliminating boilerplate.
 * 3. **definePolicy** - Full convenience wrapper combining all helpers into a declarative API.
 * 4. **Testing** - `createPolicyTestHarness` for zero-boilerplate policy unit tests.
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
 *     // ... policy logic ...
 *     await next();
 *   },
 * });
 * ```
 *
 * @module sdk
 */

// Layer 1 - Priority constants

/** Union of all named priority level values. */
export type { PriorityLevel } from "./priority";
/** Named priority constants (OBSERVABILITY, AUTH, RATE_LIMIT, etc.) for policy ordering. */
export { Priority } from "./priority";

// Layer 2 - Composable helpers

/** Shallow-merge default config values with user-provided config. */
export {
  /** Read all collected debug headers (internal - used by the pipeline). */
  getCollectedDebugHeaders,
  /** Check whether the client requested debug output via the `x-stoma-debug` header. */
  isDebugRequested,
  /** Parse the client's debug header request (internal - used by the pipeline). */
  parseDebugRequest,
  /** Get a debug logger pre-namespaced to `stoma:policy:{name}` from the gateway context. */
  policyDebug,
  resolveConfig,
  /** Execute an async operation with graceful error handling - returns a fallback value on failure. */
  safeCall,
  /** Set a debug header value for client-requested debug output. */
  setDebugHeader,
  /** Wrap a middleware handler with `PolicyConfig.skip` conditional bypass logic. */
  withSkip,
} from "./helpers";

// Layer 3 - Full convenience wrapper

/** Declarative policy definition passed to {@link definePolicy}. */
export type {
  PolicyDefinition,
  /** Context injected into `definePolicy` evaluate handlers (protocol-agnostic, with typed config). */
  PolicyEvalHandlerContext,
  /** Conditional factory type - config required when TConfig has required keys. */
  PolicyFactory,
  /** Context injected into `definePolicy` handlers: merged config, debug logger, and gateway context. */
  PolicyHandlerContext,
} from "./define-policy";
/** Create a policy factory from a declarative definition - combines resolveConfig, policyDebug, and withSkip. */
export { definePolicy } from "./define-policy";

// Layer 4 - Testing utility

/** Options for {@link createPolicyTestHarness}: custom upstream, path, gateway name, adapter. */
export type { PolicyTestHarnessOptions } from "./testing";
/** Create a minimal test harness for a policy with error handling, context injection, and configurable upstream. */
export { createPolicyTestHarness } from "./testing";

// Layer 5 - Trace (deep policy debugging)

export type {
  /** Full trace payload emitted as `x-stoma-trace`. */
  PolicyTrace,
  /** Policy-reported detail (cooperative opt-in). */
  PolicyTraceDetail,
  /** Combined baseline + detail for a single policy trace entry. */
  PolicyTraceEntry,
  /** A trace reporter function: `(action, data?) => void`. */
  TraceReporter,
} from "./trace";
/** Get a trace reporter for a specific policy - always callable, no-op when not tracing. */
export {
  /** Fast-path check: is tracing requested for this request? */
  isTraceRequested,
  /** Shared no-op trace reporter instance. */
  noopTraceReporter,
  policyTrace,
} from "./trace";
