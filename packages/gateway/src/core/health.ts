/**
 * Health check route factory with optional upstream probing.
 *
 * @module health
 */
import type { RouteConfig } from "./types";

export interface HealthConfig {
  /** Health endpoint path. Default: "/health". */
  path?: string;
  /** URLs to probe for upstream health. */
  upstreamProbes?: string[];
  /** Include individual upstream statuses in response. Default: false. */
  includeUpstreamStatus?: boolean;
  /** Timeout in ms for each upstream probe. Default: 5000. */
  probeTimeoutMs?: number;
  /** HTTP method for upstream probes. Default: `"HEAD"`. */
  probeMethod?: string;
  /** Status code returned when all probes are unhealthy. Default: 503. */
  unhealthyStatusCode?: number;
}

interface UpstreamStatus {
  url: string;
  status: "healthy" | "unhealthy";
  latencyMs: number;
}

/**
 * Create a health check route for liveness and upstream probing.
 *
 * Returns a {@link RouteConfig} (not a Policy) - add it directly to the
 * gateway's `routes` array. Without upstream probes, returns a simple
 * `{ status: "healthy" }` response. With probes, performs concurrent HEAD
 * requests (5s timeout each) and reports aggregate status:
 * - `"healthy"` - all probes passed
 * - `"degraded"` - some probes failed
 * - `"unhealthy"` - all probes failed (returns 503)
 *
 * @security Enabling `includeUpstreamStatus: true` causes the response to
 * include the URLs and availability status of internal upstream services.
 * On public-facing endpoints this leaks internal service topology, which
 * can aid attackers in reconnaissance (identifying internal hostnames,
 * ports, and service availability patterns). Restrict health routes that
 * expose upstream status to internal or admin-only paths, or protect them
 * with an authentication policy.
 *
 * @param config - Endpoint path, upstream probe URLs, and status detail toggle. All fields optional.
 * @returns A {@link RouteConfig} for a GET health endpoint.
 *
 * @example
 * ```ts
 * import { createGateway } from "@homegrower-club/stoma";
 * import { health } from "@homegrower-club/stoma/policies";
 *
 * createGateway({
 *   routes: [
 *     // Simple liveness check at /health
 *     health(),
 *
 *     // Probe upstreams with detailed status at /healthz
 *     health({
 *       path: "/healthz",
 *       upstreamProbes: [
 *         "https://api.example.com/health",
 *         "https://auth.example.com/health",
 *       ],
 *       includeUpstreamStatus: true,
 *     }),
 *
 *     // ...other routes
 *   ],
 * });
 * ```
 */
export function health<TBindings = Record<string, unknown>>(
  config?: HealthConfig
): RouteConfig<TBindings> {
  const path = config?.path ?? "/health";
  const probes = config?.upstreamProbes ?? [];
  const includeStatus = config?.includeUpstreamStatus ?? false;
  const probeTimeoutMs = config?.probeTimeoutMs ?? 5000;
  const probeMethod = config?.probeMethod ?? "HEAD";
  const unhealthyStatusCode = config?.unhealthyStatusCode ?? 503;

  return {
    path,
    methods: ["GET"],
    pipeline: {
      upstream: {
        type: "handler",
        handler: async (c) => {
          if (probes.length === 0) {
            return c.json({
              status: "healthy",
              timestamp: new Date().toISOString(),
            });
          }

          const results = await Promise.all(
            probes.map(async (url): Promise<UpstreamStatus> => {
              const start = Date.now();
              try {
                const res = await fetch(url, {
                  method: probeMethod,
                  signal: AbortSignal.timeout(probeTimeoutMs),
                });
                return {
                  url,
                  status: res.ok ? "healthy" : "unhealthy",
                  latencyMs: Date.now() - start,
                };
              } catch {
                return {
                  url,
                  status: "unhealthy",
                  latencyMs: Date.now() - start,
                };
              }
            })
          );

          const allHealthy = results.every((r) => r.status === "healthy");
          const allUnhealthy = results.every((r) => r.status === "unhealthy");

          const status = allHealthy
            ? "healthy"
            : allUnhealthy
              ? "unhealthy"
              : "degraded";

          const body: Record<string, unknown> = {
            status,
            timestamp: new Date().toISOString(),
          };

          if (includeStatus) {
            body.upstreams = results;
          }

          return c.json(
            body,
            status === "unhealthy" ? (unhealthyStatusCode as 503) : 200
          );
        },
      },
    },
  };
}
