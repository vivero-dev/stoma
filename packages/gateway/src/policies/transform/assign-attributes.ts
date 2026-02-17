/**
 * Assign arbitrary key-value attributes to the Hono context.
 *
 * Downstream middleware and handlers can read the attributes via `c.get(key)`.
 * Values can be static strings or dynamic functions that receive the Hono
 * context (sync or async).
 *
 * @module assign-attributes
 */
import type { Context } from "hono";
import { definePolicy, Priority } from "../sdk";
import type { PolicyConfig } from "../types";

export interface AssignAttributesConfig extends PolicyConfig {
  /**
   * Key-value pairs to set on the Hono context.
   * Values can be static strings or functions that receive the context.
   */
  attributes: Record<
    string,
    string | ((c: Context) => string | Promise<string>)
  >;
}

/**
 * Set key-value attributes on the Hono request context.
 *
 * @param config - Must include `attributes` - a record of keys to values or resolver functions.
 * @returns A {@link Policy} at priority 50 (REQUEST_TRANSFORM).
 *
 * @example
 * ```ts
 * import { assignAttributes } from "@homegrower-club/stoma";
 *
 * assignAttributes({
 *   attributes: {
 *     "x-tenant": "acme",
 *     "x-request-path": (c) => new URL(c.req.url).pathname,
 *   },
 * });
 * ```
 */
export const assignAttributes =
  /*#__PURE__*/ definePolicy<AssignAttributesConfig>({
    name: "assign-attributes",
    priority: Priority.REQUEST_TRANSFORM,
    phases: ["request-headers"],
    handler: async (c, next, { config, debug }) => {
      for (const [key, value] of Object.entries(config.attributes)) {
        if (typeof value === "function") {
          const resolved = await value(c);
          c.set(key, resolved);
          debug("set %s = %s (dynamic)", key, resolved);
        } else {
          c.set(key, value);
          debug("set %s = %s (static)", key, value);
        }
      }

      await next();
    },
    evaluate: {
      onRequest: async (_input, { config, debug }) => {
        const mutations = [];
        for (const [key, value] of Object.entries(config.attributes)) {
          const resolved =
            typeof value === "function" ? value({} as Context) : value;
          debug("set %s = %s", key, resolved);
          mutations.push({
            type: "attribute" as const,
            key,
            value: resolved,
          });
        }
        return { action: "continue", mutations };
      },
    },
  });
