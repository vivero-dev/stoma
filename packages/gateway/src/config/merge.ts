/**
 * Configuration merging utilities for splitting gateway configs across files.
 *
 * {@link mergeConfigs} accepts any number of partial gateway configs and
 * merges them left-to-right into a single complete {@link GatewayConfig}.
 * This enables patterns like per-domain route files, shared policy sets,
 * and environment-specific overrides.
 *
 * @example
 * ```ts
 * import { mergeConfigs, createGateway } from "@homegrower-club/stoma";
 *
 * const base = { name: "my-gw", policies: [cors(), rateLimit({ max: 100 })] };
 * const authRoutes = { routes: [{ path: "/auth/*", ... }] };
 * const apiRoutes  = { routes: [{ path: "/api/*", ... }] };
 *
 * const gw = createGateway(mergeConfigs(base, authRoutes, apiRoutes));
 * ```
 *
 * @module config/merge
 */

import { GatewayError } from "../core/errors";
import type {
  AdminConfig,
  DebugHeadersConfig,
  GatewayConfig,
} from "../core/types";
import type { Policy } from "../policies/types";

/**
 * Merge multiple partial gateway configs into a single complete config.
 *
 * Merge semantics by field:
 * - **routes** - concatenated (all routes from all configs, in order)
 * - **policies** - deduplicated by `name` (later config wins on conflict)
 * - **admin**, **debugHeaders** - shallow-merged when both are objects;
 *   last-defined wins when types differ (boolean vs object)
 * - All other scalar fields - last-defined wins (undefined values are skipped)
 *
 * @typeParam TBindings - Worker bindings type, propagated to routes.
 * @param configs - Partial configs to merge (left to right, later wins).
 * @returns A merged GatewayConfig.
 * @throws {GatewayError} If the merged result has zero routes.
 */
export function mergeConfigs<TBindings = Record<string, unknown>>(
  ...configs: Array<Partial<GatewayConfig<TBindings>>>
): GatewayConfig<TBindings> {
  const mergedRoutes: GatewayConfig<TBindings>["routes"] = [];
  const policyMap = new Map<string, Policy>();

  // Scalar fields - last-defined wins
  let name: GatewayConfig<TBindings>["name"];
  let basePath: GatewayConfig<TBindings>["basePath"];
  let debug: GatewayConfig<TBindings>["debug"];
  let requestIdHeader: GatewayConfig<TBindings>["requestIdHeader"];
  let defaultErrorMessage: GatewayConfig<TBindings>["defaultErrorMessage"];
  let defaultPolicyPriority: GatewayConfig<TBindings>["defaultPolicyPriority"];
  let defaultMethods: GatewayConfig<TBindings>["defaultMethods"];
  let onError: GatewayConfig<TBindings>["onError"];
  let adapter: GatewayConfig<TBindings>["adapter"];

  // Object/boolean union fields - shallow-merge when both objects
  let admin: GatewayConfig<TBindings>["admin"];
  let debugHeaders: GatewayConfig<TBindings>["debugHeaders"];

  for (const cfg of configs) {
    // Routes: concatenate
    if (cfg.routes) {
      mergedRoutes.push(...cfg.routes);
    }

    // Policies: deduplicate by name (later wins)
    if (cfg.policies) {
      for (const policy of cfg.policies) {
        policyMap.set(policy.name, policy);
      }
    }

    // Scalar fields: last-defined wins (skip undefined)
    if (cfg.name !== undefined) name = cfg.name;
    if (cfg.basePath !== undefined) basePath = cfg.basePath;
    if (cfg.debug !== undefined) debug = cfg.debug;
    if (cfg.requestIdHeader !== undefined)
      requestIdHeader = cfg.requestIdHeader;
    if (cfg.defaultErrorMessage !== undefined)
      defaultErrorMessage = cfg.defaultErrorMessage;
    if (cfg.defaultPolicyPriority !== undefined)
      defaultPolicyPriority = cfg.defaultPolicyPriority;
    if (cfg.defaultMethods !== undefined) defaultMethods = cfg.defaultMethods;
    if (cfg.onError !== undefined) onError = cfg.onError;
    if (cfg.adapter !== undefined) adapter = cfg.adapter;

    // Admin: shallow-merge objects, last-defined wins for boolean/object mismatch
    if (cfg.admin !== undefined) {
      admin = shallowMergeUnion<AdminConfig>(admin, cfg.admin);
    }

    // DebugHeaders: same strategy as admin
    if (cfg.debugHeaders !== undefined) {
      debugHeaders = shallowMergeUnion<DebugHeadersConfig>(
        debugHeaders,
        cfg.debugHeaders
      );
    }
  }

  if (mergedRoutes.length === 0) {
    throw new GatewayError(
      500,
      "config_error",
      "mergeConfigs: merged config has zero routes"
    );
  }

  const result: GatewayConfig<TBindings> = {
    routes: mergedRoutes,
  };

  // Only set fields that were defined
  const mergedPolicies = Array.from(policyMap.values());
  if (mergedPolicies.length > 0) result.policies = mergedPolicies;
  if (name !== undefined) result.name = name;
  if (basePath !== undefined) result.basePath = basePath;
  if (debug !== undefined) result.debug = debug;
  if (requestIdHeader !== undefined) result.requestIdHeader = requestIdHeader;
  if (defaultErrorMessage !== undefined)
    result.defaultErrorMessage = defaultErrorMessage;
  if (defaultPolicyPriority !== undefined)
    result.defaultPolicyPriority = defaultPolicyPriority;
  if (defaultMethods !== undefined) result.defaultMethods = defaultMethods;
  if (onError !== undefined) result.onError = onError;
  if (adapter !== undefined) result.adapter = adapter;
  if (admin !== undefined) result.admin = admin;
  if (debugHeaders !== undefined) result.debugHeaders = debugHeaders;

  return result;
}

/**
 * Shallow-merge two values that may be boolean or object.
 *
 * - Both objects → shallow-merge (later wins on key conflicts)
 * - Either is boolean or types differ → last value wins entirely
 */
function shallowMergeUnion<T extends object>(
  existing: boolean | T | undefined,
  incoming: boolean | T
): boolean | T {
  if (
    existing !== undefined &&
    typeof existing === "object" &&
    typeof incoming === "object"
  ) {
    return { ...existing, ...incoming };
  }
  return incoming;
}
