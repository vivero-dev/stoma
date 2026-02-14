/**
 * Zod schemas for gateway configuration validation.
 *
 * These schemas mirror the TypeScript types in `core/types.ts` and can be used
 * to validate untrusted configuration objects at runtime (e.g. config loaded
 * from KV, environment variables, or external sources).
 *
 * **Scope**: Validates the structural shape of `GatewayConfig` (routes, upstream
 * types, methods, admin config). Individual policy configs are **not** validated -
 * each policy validates its own config internally via `resolveConfig()`. This
 * means `validateConfig()` catches structural misconfigurations (missing routes,
 * invalid upstream type) but won't catch typos in policy-specific options.
 *
 * Zod is an **optional** peer dependency. Consumers who only use the static
 * TypeScript types never pay for it.
 *
 * @module config/schema
 */
import { z } from "zod";
import type { GatewayConfig } from "../core/types";

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------

/**
 * Validates the Policy shape (name + handler + priority).
 *
 * This only checks that a policy _looks_ like a Policy - it does not validate
 * the policy's own config options. Policy-specific validation happens inside
 * each policy factory via `resolveConfig()` at construction time.
 */
const PolicySchema = z.object({
  name: z.string().min(1, "Policy name is required"),
  handler: z.function(),
  priority: z.number().int().optional(),
});

const UrlUpstreamSchema = z.object({
  type: z.literal("url"),
  target: z.string().url("Upstream target must be a valid URL"),
  rewritePath: z.function().optional(),
  headers: z.record(z.string(), z.string()).optional(),
});

const ServiceBindingUpstreamSchema = z.object({
  type: z.literal("service-binding"),
  service: z.string().min(1, "Service binding name is required"),
  rewritePath: z.function().optional(),
});

const HandlerUpstreamSchema = z.object({
  type: z.literal("handler"),
  handler: z.function(),
});

const UpstreamSchema = z.discriminatedUnion("type", [
  UrlUpstreamSchema,
  ServiceBindingUpstreamSchema,
  HandlerUpstreamSchema,
]);

const PipelineSchema = z.object({
  policies: z.array(PolicySchema).optional(),
  upstream: UpstreamSchema,
});

const HttpMethodSchema = z.enum([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
]);

const RouteSchema = z.object({
  path: z.string().startsWith("/", "Route path must start with /"),
  methods: z.array(HttpMethodSchema).optional(),
  pipeline: PipelineSchema,
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const TracingConfigSchema = z
  .object({
    exporter: z.any(),
    serviceName: z.string().optional(),
    serviceVersion: z.string().optional(),
    sampleRate: z.number().min(0).max(1).optional(),
  })
  .optional();

const ScopeConfigSchema = z.object({
  prefix: z.string().min(1, "Scope prefix is required"),
  policies: z.array(PolicySchema).optional(),
  routes: z
    .array(z.lazy(() => RouteSchema))
    .min(1, "Scope requires at least one route"),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const GatewayConfigSchema = z.object({
  name: z.string().optional(),
  basePath: z.string().optional(),
  routes: z.array(RouteSchema).min(1, "At least one route is required"),
  policies: z.array(PolicySchema).optional(),
  onError: z.function().optional(),
  debug: z.union([z.boolean(), z.string()]).optional(),
  requestIdHeader: z.string().optional(),
  defaultMethods: z.array(HttpMethodSchema).optional(),
  defaultErrorMessage: z.string().optional(),
  defaultPolicyPriority: z.number().int().optional(),
  admin: z
    .union([
      z.boolean(),
      z.object({
        enabled: z.boolean(),
        prefix: z.string().optional(),
        auth: z.function().optional(),
        metrics: z.any().optional(),
      }),
    ])
    .optional(),
  debugHeaders: z
    .union([
      z.boolean(),
      z.object({
        requestHeader: z.string().optional(),
        allow: z.array(z.string()).optional(),
      }),
    ])
    .optional(),
  tracing: TracingConfigSchema,
});

// ---------------------------------------------------------------------------
// Exports - schemas
// ---------------------------------------------------------------------------

export {
  GatewayConfigSchema,
  RouteSchema,
  PipelineSchema,
  UpstreamSchema,
  PolicySchema,
  HttpMethodSchema,
  TracingConfigSchema,
  ScopeConfigSchema,
};

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/**
 * Validate a gateway config object, throwing on failure.
 *
 * @throws {z.ZodError} with readable error messages
 */
export function validateConfig(config: unknown): GatewayConfig {
  return GatewayConfigSchema.parse(config) as GatewayConfig;
}

/**
 * Safely validate a gateway config, returning success/error without throwing.
 */
export function safeValidateConfig(
  config: unknown
):
  | { success: true; data: GatewayConfig }
  | { success: false; error: z.ZodError } {
  const result = GatewayConfigSchema.safeParse(config);
  if (result.success) {
    return { success: true, data: result.data as GatewayConfig };
  }
  return { success: false, error: result.error };
}
