/**
 * Configuration types and optional Zod validation for stoma gateway configs.
 *
 * Import from `@homegrower-club/stoma/config` for gateway configuration types
 * and runtime validation utilities. The Zod schemas are **optional** — they
 * require the `zod` peer dependency. Consumers who only use the TypeScript
 * types never need to install Zod.
 *
 * @example
 * ```ts
 * import type { GatewayConfig } from "@homegrower-club/stoma/config";
 * import { validateConfig, safeValidateConfig } from "@homegrower-club/stoma/config";
 *
 * // Type-only usage (no zod required)
 * const config: GatewayConfig = { ... };
 *
 * // Runtime validation (requires zod peer dep)
 * const validated = validateConfig(untrustedConfig); // throws on invalid
 * const result = safeValidateConfig(untrustedConfig); // returns { success, data?, error? }
 * ```
 *
 * @module config
 */

export type {
  /** Top-level gateway configuration: routes, global policies, error handling, debug, and adapter. */
  GatewayConfig,
  /** Individual route definition: path, methods, and pipeline (policies + upstream). */
  RouteConfig,
  /** Pipeline definition: ordered policy chain leading to an upstream target. */
  PipelineConfig,
  /** Discriminated union of upstream types: URL proxy, Service Binding, or custom handler. */
  UpstreamConfig,
} from "../core/types";

export {
  /** Validate a gateway config object at runtime, throwing on invalid input (requires zod). */
  validateConfig,
  /** Validate a gateway config returning a Zod SafeParseResult instead of throwing (requires zod). */
  safeValidateConfig,
  /** Zod schema for the full GatewayConfig object. */
  GatewayConfigSchema,
  /** Zod schema for a single RouteConfig. */
  RouteSchema,
  /** Zod schema for a PipelineConfig. */
  PipelineSchema,
  /** Zod schema for the UpstreamConfig discriminated union. */
  UpstreamSchema,
  /** Zod schema for a single Policy object (name, handler, priority). */
  PolicySchema,
} from "./schema";
