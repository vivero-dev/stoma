/**
 * Policy SDK — shared primitives for building built-in and custom policies.
 *
 * Four layers of increasing convenience:
 *
 * 1. **Priority** — Named constants for policy ordering (lower = earlier).
 * 2. **Composable helpers** — `resolveConfig`, `policyDebug`, `withSkip` for eliminating boilerplate.
 * 3. **definePolicy** — Full convenience wrapper combining all helpers into a declarative API.
 * 4. **Testing** — `createPolicyTestHarness` for zero-boilerplate policy unit tests.
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

// Layer 1 — Priority constants

/** Named priority constants (OBSERVABILITY, AUTH, RATE_LIMIT, etc.) for policy ordering. */
export { Priority } from "./priority";

/** Union of all named priority level values. */
export type { PriorityLevel } from "./priority";

// Layer 2 — Composable helpers

/** Shallow-merge default config values with user-provided config. */
export { resolveConfig,
/** Get a debug logger pre-namespaced to `stoma:policy:{name}` from the gateway context. */
  policyDebug,
/** Wrap a middleware handler with `PolicyConfig.skip` conditional bypass logic. */
  withSkip,
/** Execute an async operation with graceful error handling — returns a fallback value on failure. */
  safeCall,
/** Set a debug header value for client-requested debug output. */
  setDebugHeader,
/** Parse the client's debug header request (internal — used by the pipeline). */
  parseDebugRequest,
/** Read all collected debug headers (internal — used by the pipeline). */
  getCollectedDebugHeaders } from "./helpers";

// Layer 3 — Full convenience wrapper

/** Create a policy factory from a declarative definition — combines resolveConfig, policyDebug, and withSkip. */
export { definePolicy } from "./define-policy";

/** Declarative policy definition passed to {@link definePolicy}. */
export type { PolicyDefinition,
/** Context injected into `definePolicy` handlers: merged config, debug logger, and gateway context. */
  PolicyHandlerContext } from "./define-policy";

// Layer 4 — Testing utility

/** Create a minimal test harness for a policy with error handling, context injection, and configurable upstream. */
export { createPolicyTestHarness } from "./testing";

/** Options for {@link createPolicyTestHarness}: custom upstream, path, gateway name, adapter. */
export type { PolicyTestHarnessOptions } from "./testing";
