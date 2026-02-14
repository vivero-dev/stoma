/**
 * Admin introspection API - auto-registered `___gateway/*` routes.
 *
 * Exposes gateway internals for operational visibility: registered routes,
 * active policies, redacted config, Prometheus metrics, and health status.
 *
 * @module admin
 */
import type { Context, Hono } from "hono";
import type { AdminConfig, GatewayRegistry } from "../core/types";
import { toPrometheusText } from "./metrics";

/** Secret-like keys that should be redacted in config output. */
const SECRET_PATTERNS = ["secret", "key", "token", "password", "credential"];

/**
 * Register admin introspection routes on the Hono app.
 *
 * @param app - The Hono app to register routes on.
 * @param config - Admin configuration (auth, prefix, metrics).
 * @param registry - The gateway registry containing route and policy data.
 */
export function registerAdminRoutes(
  app: Hono,
  config: AdminConfig,
  registry: GatewayRegistry
): void {
  const prefix = `/${config.prefix ?? "___gateway"}`;

  // Auth middleware for all admin routes
  const authMiddleware = async (c: Context, next: () => Promise<void>) => {
    if (config.auth) {
      const allowed = await config.auth(c);
      if (!allowed) {
        return c.json(
          { error: "unauthorized", message: "Admin access denied" },
          403
        );
      }
    }
    await next();
  };

  // GET /___gateway/routes - list all registered routes
  app.get(`${prefix}/routes`, authMiddleware, (c) => {
    return c.json({
      gateway: registry.gatewayName,
      routes: registry.routes,
    });
  });

  // GET /___gateway/policies - list all unique policies with priority
  app.get(`${prefix}/policies`, authMiddleware, (c) => {
    return c.json({
      gateway: registry.gatewayName,
      policies: registry.policies,
    });
  });

  // GET /___gateway/config - serialized config with secrets redacted
  app.get(`${prefix}/config`, authMiddleware, (c) => {
    return c.json(
      redactConfig({
        gateway: registry.gatewayName,
        routes: registry.routes,
        policies: registry.policies,
      })
    );
  });

  // GET /___gateway/metrics - Prometheus text format
  app.get(`${prefix}/metrics`, authMiddleware, (c) => {
    if (!config.metrics) {
      return c.json(
        {
          error: "not_configured",
          message:
            "No metrics collector configured. Pass a MetricsCollector to admin.metrics.",
        },
        404
      );
    }

    const snapshot = config.metrics.snapshot();
    const text = toPrometheusText(snapshot);
    return c.text(text, 200, {
      "content-type": "text/plain; version=0.0.4; charset=utf-8",
    });
  });

  // GET /___gateway/health - basic health check
  app.get(`${prefix}/health`, authMiddleware, (c) => {
    return c.json({
      status: "healthy",
      gateway: registry.gatewayName,
      routeCount: registry.routes.length,
      policyCount: registry.policies.length,
      timestamp: new Date().toISOString(),
    });
  });
}

/**
 * Redact values of keys that look like secrets in a config object.
 * Used internally by the `/config` endpoint.
 */
export function redactConfig(obj: unknown): unknown {
  if (typeof obj !== "object" || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(redactConfig);

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (SECRET_PATTERNS.some((p) => key.toLowerCase().includes(p))) {
      result[key] = "[REDACTED]";
    } else if (typeof value === "function") {
      result[key] = "[Function]";
    } else if (typeof value === "object" && value !== null) {
      result[key] = redactConfig(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}
