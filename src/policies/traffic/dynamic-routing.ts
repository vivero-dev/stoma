/**
 * Dynamic routing policy - evaluate routing rules and expose match data on context.
 *
 * Evaluates an ordered list of routing rules against the request context.
 * The first matching rule sets context variables that downstream handlers
 * can consume (`_dynamicTarget`, `_dynamicRewrite`, `_dynamicHeaders`).
 *
 * @module dynamic-routing
 */
import type { Context } from "hono";
import { GatewayError } from "../../core/errors";
import { definePolicy, Priority } from "../sdk";
import type { PolicyConfig } from "../types";

export interface RoutingRule {
  /** Human-readable rule name for debugging. */
  name?: string;
  /** Condition that determines if this rule applies. */
  condition: (c: Context) => boolean | Promise<boolean>;
  /** Target upstream URL to route to. */
  target: string;
  /** Optional path rewrite function. */
  rewritePath?: (path: string) => string;
  /** Optional headers to add to the upstream request. */
  headers?: Record<string, string>;
}

export interface DynamicRoutingConfig extends PolicyConfig {
  /** Ordered list of routing rules. First match wins. Required. */
  rules: Array<RoutingRule>;
  /** If true and no rule matches, call next() normally. If false, throw 404. Default: true. */
  fallthrough?: boolean;
}

/**
 * Evaluate routing rules and expose the first match on request context.
 *
 * Evaluates rules in order. The first matching rule's target, rewritePath,
 * and headers are set as context variables for downstream consumption.
 *
 * @param config - Routing rules and fallthrough behavior.
 * @returns A {@link Policy} at priority 50 (REQUEST_TRANSFORM).
 *
 * @example
 * ```ts
 * dynamicRouting({
 *   rules: [
 *     {
 *       name: "v2-api",
 *       condition: (c) => c.req.header("x-api-version") === "2",
 *       target: "https://api-v2.internal",
 *       rewritePath: (path) => path.replace("/api/", "/v2/"),
 *     },
 *     {
 *       name: "default",
 *       condition: () => true,
 *       target: "https://api-v1.internal",
 *     },
 *   ],
 * });
 * ```
 */
export const dynamicRouting = /*#__PURE__*/ definePolicy<DynamicRoutingConfig>({
  name: "dynamic-routing",
  priority: Priority.REQUEST_TRANSFORM,
  httpOnly: true,
  defaults: { fallthrough: true },
  handler: async (c, next, { config, debug }) => {
    for (const rule of config.rules) {
      const matched = await rule.condition(c);
      if (matched) {
        debug(
          `matched rule ${rule.name ? `"${rule.name}"` : "(unnamed)"}` +
            ` → target=${rule.target}`
        );
        c.set("_dynamicTarget", rule.target);
        if (rule.rewritePath) {
          c.set("_dynamicRewrite", rule.rewritePath);
        }
        if (rule.headers) {
          c.set("_dynamicHeaders", rule.headers);
        }
        await next();
        return;
      }
    }

    // No rule matched
    if (!config.fallthrough) {
      throw new GatewayError(404, "no_route", "No routing rule matched");
    }

    debug("no rule matched, falling through");
    await next();
  },
});
