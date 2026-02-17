/**
 * Bun adapter for stoma.
 *
 * Bun doesn't provide `waitUntil` or service bindings natively.
 * Use `memoryAdapter()` for stores and this adapter as a marker/extension
 * point for Bun-specific capabilities.
 *
 * @example
 * ```ts
 * import { createGateway } from "@homegrower-club/stoma";
 * import { bunAdapter } from "@homegrower-club/stoma/adapters/bun";
 *
 * const gateway = createGateway({
 *   adapter: bunAdapter(),
 *   routes: [...]
 * });
 *
 * export default gateway.app;
 * ```
 *
 * @module bun-adapter
 */
import { memoryAdapter } from "./memory";
import type { GatewayAdapter } from "./types";

/** Create a GatewayAdapter for Bun. Delegates to memoryAdapter() for in-memory stores. */
export function bunAdapter(): GatewayAdapter {
  return memoryAdapter();
}
