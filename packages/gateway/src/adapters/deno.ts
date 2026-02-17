/**
 * Deno adapter for stoma.
 *
 * Deno Deploy doesn't provide `waitUntil` or service bindings natively.
 * Use `memoryAdapter()` for stores and this adapter as a marker/extension
 * point for Deno-specific capabilities.
 *
 * @example
 * ```ts
 * import { createGateway } from "@homegrower-club/stoma";
 * import { denoAdapter } from "@homegrower-club/stoma/adapters/deno";
 *
 * const gateway = createGateway({
 *   adapter: denoAdapter(),
 *   routes: [...]
 * });
 *
 * Deno.serve(gateway.app.fetch);
 * ```
 *
 * @module deno-adapter
 */
import { memoryAdapter } from "./memory";
import type { GatewayAdapter } from "./types";

/** Create a GatewayAdapter for Deno. Delegates to memoryAdapter() for in-memory stores. */
export function denoAdapter(): GatewayAdapter {
  return memoryAdapter();
}
