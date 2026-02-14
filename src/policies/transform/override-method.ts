/**
 * HTTP method override policy.
 *
 * Allows clients to tunnel PUT/PATCH/DELETE through POST requests
 * using a configurable header (default `X-HTTP-Method-Override`).
 * This is useful when firewalls, proxies, or browser limitations
 * prevent the use of certain HTTP methods.
 *
 * @module override-method
 */
import { GatewayError } from "../../core/errors";
import { definePolicy, Priority } from "../sdk";
import type { PolicyConfig } from "../types";

export interface OverrideMethodConfig extends PolicyConfig {
  /** Header name to read the override method from. Default: `"X-HTTP-Method-Override"`. */
  header?: string;
  /** Methods allowed as overrides. Default: `["GET", "PUT", "PATCH", "DELETE"]`. */
  allowedMethods?: string[];
}

/**
 * Override the HTTP method of a POST request via a header.
 *
 * Only applies to POST requests - the industry-standard approach for
 * tunneling other methods through POST. Non-POST requests with the
 * override header are ignored.
 *
 * @param config - Header name and allowed override methods.
 * @returns A policy at priority 5 (EARLY).
 *
 * @example
 * ```ts
 * // Default: reads X-HTTP-Method-Override header
 * overrideMethod();
 *
 * // Custom header and restricted methods
 * overrideMethod({ header: "X-Method", allowedMethods: ["PUT", "PATCH"] });
 * ```
 */
export const overrideMethod = /*#__PURE__*/ definePolicy<OverrideMethodConfig>({
  name: "override-method",
  priority: Priority.EARLY,
  phases: ["request-headers"],
  defaults: {
    header: "X-HTTP-Method-Override",
    allowedMethods: ["GET", "PUT", "PATCH", "DELETE"],
  },
  handler: async (c, next, { config, debug }) => {
    const overrideValue = c.req.header(config.header!);

    if (!overrideValue) {
      await next();
      return;
    }

    // Only override POST requests
    if (c.req.method !== "POST") {
      debug(`ignoring override on ${c.req.method} request`);
      await next();
      return;
    }

    const method = overrideValue.toUpperCase();
    const allowed = new Set(
      (config.allowedMethods ?? []).map((m) => m.toUpperCase())
    );

    if (!allowed.has(method)) {
      throw new GatewayError(
        400,
        "invalid_method_override",
        `Method override not allowed: ${method}`
      );
    }

    debug(`overriding POST → ${method}`);

    // Override the method by replacing the raw Request object
    const newReq = new Request(c.req.url, {
      method,
      headers: c.req.raw.headers,
      body: c.req.raw.body,
      // @ts-expect-error -- duplex is required for streams but not in all type definitions
      duplex: "half",
    });
    Object.defineProperty(c.req, "raw", { value: newReq, configurable: true });

    await next();
  },
});
