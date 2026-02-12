/**
 * Assign (inject/override) fields in JSON request and/or response bodies.
 *
 * Supports static values and dynamic functions that receive the Hono context.
 * Only modifies bodies with matching content types (default: application/json).
 *
 * @module assign-content
 */
import type { Context } from "hono";
import { definePolicy, Priority } from "../sdk";
import type { PolicyConfig } from "../types";

/** A field value — either a static value or a function resolving to one. */
type FieldValue = unknown | ((c: Context) => unknown | Promise<unknown>);

export interface AssignContentConfig extends PolicyConfig {
  /** Fields to set/override in the JSON request body. */
  request?: Record<string, FieldValue>;
  /** Fields to set/override in the JSON response body. */
  response?: Record<string, FieldValue>;
  /** Only modify bodies with these content types. Default: `["application/json"]`. */
  contentTypes?: string[];
}

/**
 * Resolve a field map — evaluates dynamic functions, keeps static values.
 */
async function resolveFields(
  c: Context,
  fields: Record<string, FieldValue>,
): Promise<Record<string, unknown>> {
  const resolved: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (typeof value === "function") {
      resolved[key] = await (value as (c: Context) => unknown | Promise<unknown>)(c);
    } else {
      resolved[key] = value;
    }
  }
  return resolved;
}

/**
 * Check if a content-type header matches any of the allowed types.
 */
function contentTypeMatches(
  contentType: string | undefined,
  allowedTypes: string[],
): boolean {
  if (!contentType) return false;
  return allowedTypes.some((ct) => contentType.includes(ct));
}

/**
 * Assign content policy.
 *
 * Injects or overrides fields in JSON request and/or response bodies.
 * Useful for injecting tenant IDs, timestamps, metadata, or other
 * fields that should be transparently added by the gateway.
 *
 * @example
 * ```ts
 * import { assignContent } from "@homegrower-club/stoma";
 *
 * assignContent({
 *   request: {
 *     tenantId: "acme",
 *     timestamp: (c) => new Date().toISOString(),
 *   },
 *   response: {
 *     gateway: "stoma",
 *   },
 * });
 * ```
 */
export const assignContent = definePolicy<AssignContentConfig>({
  name: "assign-content",
  priority: Priority.REQUEST_TRANSFORM,
  defaults: {
    contentTypes: ["application/json"],
  },
  handler: async (c, next, { config, debug }) => {
    // Request phase — modify request body before upstream
    if (config.request) {
      const reqContentType = c.req.header("content-type");
      if (contentTypeMatches(reqContentType, config.contentTypes!)) {
        let body: Record<string, unknown> = {};

        // Try to parse existing body
        try {
          const cloned = c.req.raw.clone();
          const text = await cloned.text();
          if (text) {
            body = JSON.parse(text) as Record<string, unknown>;
          }
        } catch {
          // No body or invalid JSON — start with empty object
        }

        // Resolve and merge fields
        const resolved = await resolveFields(c, config.request);
        Object.assign(body, resolved);

        debug("assigned %d fields to request body", Object.keys(resolved).length);

        // Replace the request with modified body
        const newReq = new Request(c.req.url, {
          method: c.req.method,
          headers: c.req.raw.headers,
          body: JSON.stringify(body),
          // @ts-expect-error -- duplex required for streams in some runtimes
          duplex: "half",
        });
        Object.defineProperty(c.req, "raw", {
          value: newReq,
          configurable: true,
        });
      } else {
        debug("request content-type %s not in allowed types — skipping request modification", reqContentType);
      }
    }

    await next();

    // Response phase — modify response body after upstream
    if (config.response) {
      const resContentType = c.res.headers.get("content-type");
      if (contentTypeMatches(resContentType ?? undefined, config.contentTypes!)) {
        let body: Record<string, unknown> = {};

        try {
          const text = await c.res.text();
          if (text) {
            body = JSON.parse(text) as Record<string, unknown>;
          }
        } catch {
          // Invalid JSON — start with empty object
        }

        // Resolve and merge fields
        const resolved = await resolveFields(c, config.response);
        Object.assign(body, resolved);

        debug("assigned %d fields to response body", Object.keys(resolved).length);

        // Create new response with modified body, preserving status and headers
        const newRes = new Response(JSON.stringify(body), {
          status: c.res.status,
          headers: c.res.headers,
        });
        c.res = newRes;
      } else {
        debug("response content-type %s not in allowed types — skipping response modification", resContentType);
      }
    }
  },
});
