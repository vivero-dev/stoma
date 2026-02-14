/**
 * Route scoping - group routes under a shared path prefix with shared policies.
 *
 * `scope()` transforms an array of {@link RouteConfig} by prepending a path
 * prefix, prepending shared policies, and merging metadata. The output is a
 * flat `RouteConfig[]` that can be spread directly into `GatewayConfig.routes`.
 *
 * Nesting works naturally - pass the output of an inner `scope()` as the
 * `routes` of an outer `scope()`.
 *
 * @module scope
 *
 * @example
 * ```ts
 * import { createGateway, scope, jwtAuth, rateLimit } from "@homegrower-club/stoma";
 *
 * const gateway = createGateway({
 *   routes: [
 *     ...scope({
 *       prefix: "/api/v1",
 *       policies: [jwtAuth({ secret: "..." })],
 *       routes: [
 *         { path: "/users", pipeline: { upstream: { type: "url", target: "https://users.internal" } } },
 *         { path: "/orders", pipeline: { upstream: { type: "url", target: "https://orders.internal" } } },
 *       ],
 *     }),
 *   ],
 * });
 * ```
 */
import type { Policy } from "../policies/types";
import type { RouteConfig } from "./types";

/**
 * Configuration for a route scope (group).
 *
 * @typeParam TBindings - Worker bindings type, propagated to child routes.
 */
export interface ScopeConfig<TBindings = Record<string, unknown>> {
  /** Path prefix prepended to all child routes (e.g. "/api/v1") */
  prefix: string;
  /** Policies prepended to every child route's pipeline policies */
  policies?: Policy[];
  /** Child routes to scope */
  routes: RouteConfig<TBindings>[];
  /** Metadata merged into every child route (child wins on conflict) */
  metadata?: Record<string, unknown>;
}

/**
 * Normalize a path prefix: ensure leading `/`, strip trailing `/`.
 *
 * @internal
 */
function normalizePrefix(prefix: string): string {
  let normalized = prefix;

  // Ensure leading slash
  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  // Strip trailing slash (unless the prefix is just "/")
  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

/**
 * Join a normalized prefix and a route path, avoiding double slashes.
 *
 * @internal
 */
function joinPaths(prefix: string, path: string): string {
  // Ensure path has leading slash
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  // Avoid double slashes at the join point
  if (prefix.endsWith("/") && normalizedPath.startsWith("/")) {
    return `${prefix}${normalizedPath.slice(1)}`;
  }

  return `${prefix}${normalizedPath}`;
}

/**
 * Group routes under a shared path prefix with shared policies and metadata.
 *
 * Returns a flat array of transformed {@link RouteConfig} objects ready to be
 * spread into `GatewayConfig.routes`.
 *
 * @typeParam TBindings - Worker bindings type, propagated to child routes.
 * @param config - Scope configuration.
 * @returns Array of route configs with prefix, policies, and metadata applied.
 */
export function scope<TBindings = Record<string, unknown>>(
  config: ScopeConfig<TBindings>
): RouteConfig<TBindings>[] {
  const prefix = normalizePrefix(config.prefix);
  const scopePolicies = config.policies ?? [];
  const scopeMetadata = config.metadata ?? {};

  return config.routes.map((route) => {
    const fullPath = joinPaths(prefix, route.path);

    // Prepend scope policies before route policies (scope runs first)
    const routePolicies = route.pipeline.policies ?? [];
    const mergedPolicies =
      scopePolicies.length > 0 || routePolicies.length > 0
        ? [...scopePolicies, ...routePolicies]
        : undefined;

    // Merge metadata: scope metadata as base, child wins on conflict
    const mergedMetadata =
      Object.keys(scopeMetadata).length > 0 || route.metadata
        ? { ...scopeMetadata, ...route.metadata }
        : undefined;

    return {
      ...route,
      path: fullPath,
      pipeline: {
        ...route.pipeline,
        ...(mergedPolicies !== undefined ? { policies: mergedPolicies } : {}),
      },
      ...(mergedMetadata !== undefined ? { metadata: mergedMetadata } : {}),
    };
  });
}
