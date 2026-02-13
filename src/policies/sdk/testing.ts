/**
 * Test harness for policy authors.
 *
 * Eliminates the repeated 15-line `makeApp()` boilerplate from policy
 * test files. Creates a minimal Hono app with the policy under test,
 * a GatewayError handler, gateway context injection, and a configurable
 * upstream.
 *
 * @module testing
 */

import type { MiddlewareHandler } from "hono";
import { Hono } from "hono";
import { TestAdapter } from "../../adapters/testing";
import { errorToResponse, GatewayError } from "../../core/errors";
import { createContextInjector } from "../../core/pipeline";
import type { Policy } from "../types";

export interface PolicyTestHarnessOptions {
  /**
   * Custom upstream handler. Receives the Hono context after the policy
   * runs. Default: returns `{ ok: true }` with status 200.
   */
  upstream?: MiddlewareHandler;
  /** Route path pattern for the test app. Default: `"/*"`. */
  path?: string;
  /** Gateway name injected into context. Default: `"test-gateway"`. */
  gatewayName?: string;
  /** Custom adapter to use. If not provided, a {@link TestAdapter} is created. */
  adapter?: TestAdapter;
}

/**
 * Create a minimal test app with a single policy, error handling,
 * gateway context injection, and a configurable upstream.
 *
 * @example
 * ```ts
 * import { createPolicyTestHarness } from "@homegrower-club/stoma/policies";
 * import { myPolicy } from "./my-policy";
 *
 * const { request, adapter } = createPolicyTestHarness(myPolicy({ max: 10 }));
 *
 * it("should allow valid requests", async () => {
 *   const res = await request("/test");
 *   expect(res.status).toBe(200);
 *   // Await any background work (e.g. waitUntil)
 *   await adapter.waitAll();
 * });
 * ```
 *
 * @param policy - The policy instance to test.
 * @param options - Optional upstream, path, and gateway name.
 * @returns An object with `request()`, `app`, and the `adapter` used.
 */
export function createPolicyTestHarness(
  policy: Policy,
  options?: PolicyTestHarnessOptions
) {
  const path = options?.path ?? "/*";
  const gatewayName = options?.gatewayName ?? "test-gateway";
  const adapter = options?.adapter ?? new TestAdapter();

  const app = new Hono();

  // 1. Inject gateway context (requestId, debug factory, etc.)
  app.use(
    path,
    createContextInjector(gatewayName, path, undefined, undefined, adapter)
  );

  // 2. Run the policy with GatewayError → structured JSON handling
  app.use(path, async (c, next) => {
    try {
      await policy.handler(c, next);
    } catch (err) {
      if (err instanceof GatewayError) {
        return errorToResponse(err);
      }
      throw err;
    }
  });

  // 3. Upstream handler
  if (options?.upstream) {
    app.all(path, options.upstream);
  } else {
    app.all(path, (c) => c.json({ ok: true }));
  }

  return {
    /** The underlying Hono app for advanced test scenarios. */
    app,
    /** The adapter used by the harness. Call `adapter.waitAll()` to await background tasks. */
    adapter,
    /** Make a test request through the policy pipeline. */
    request: (reqPath: string, init?: RequestInit) =>
      app.request(reqPath, init),
  };
}
