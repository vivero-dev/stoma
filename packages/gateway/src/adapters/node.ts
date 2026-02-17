/**
 * Node.js adapter for stoma.
 *
 * Node.js (via `@hono/node-server`) doesn't provide `waitUntil` or
 * service bindings natively. Use `memoryAdapter()` for stores and this
 * adapter as a marker/extension point for Node-specific capabilities.
 *
 * @example
 * ```ts
 * import { createGateway } from "@homegrower-club/stoma";
 * import { nodeAdapter } from "@homegrower-club/stoma/adapters/node";
 * import { serve } from "@hono/node-server";
 *
 * const gateway = createGateway({
 *   adapter: nodeAdapter(),
 *   routes: [...]
 * });
 *
 * serve(gateway.app);
 * ```
 *
 * @module node-adapter
 */
import { memoryAdapter } from "./memory";
import type { GatewayAdapter } from "./types";

/** Create a GatewayAdapter for Node.js. Delegates to memoryAdapter() for in-memory stores. */
export function nodeAdapter(): GatewayAdapter {
  return memoryAdapter();
}
