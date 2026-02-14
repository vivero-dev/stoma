/**
 * HTTP Basic authentication policy.
 *
 * @module basic-auth
 */

import type { Context } from "hono";
import { GatewayError } from "../../core/errors";
import { escapeHeaderValue, sanitizeHeaderValue } from "../../utils/headers";
import { definePolicy, Priority } from "../sdk";
import type { PolicyConfig } from "../types";

export interface BasicAuthConfig extends PolicyConfig {
  /** Validate username/password. Return true if valid. */
  validate: (
    username: string,
    password: string,
    c: Context
  ) => boolean | Promise<boolean>;
  /** Realm for the WWW-Authenticate header. Default: "Restricted" */
  realm?: string;
}

/**
 * Basic Authentication policy - validate base64-encoded credentials.
 *
 * Sends a `WWW-Authenticate` header on failure to prompt browser credential dialogs.
 * The realm is sanitized to prevent header injection.
 *
 * @param config - Validation function and optional realm name.
 * @returns A {@link Policy} at priority 10.
 *
 * @example
 * ```ts
 * basicAuth({
 *   realm: "Admin Area",
 *   validate: async (username, password) => {
 *     return username === "admin" && password === env.ADMIN_PASSWORD;
 *   },
 * });
 * ```
 */
export const basicAuth = /*#__PURE__*/ definePolicy<BasicAuthConfig>({
  name: "basic-auth",
  priority: Priority.AUTH,
  defaults: { realm: "Restricted" },
  phases: ["request-headers"],
  handler: async (c, next, { config }) => {
    // Sanitize realm to prevent header injection (escape quotes, strip control chars)
    const realm = escapeHeaderValue(
      sanitizeHeaderValue(config.realm ?? "Restricted")
    );

    const authHeader = c.req.header("authorization");

    if (!authHeader || !authHeader.startsWith("Basic ")) {
      c.header("www-authenticate", `Basic realm="${realm}"`);
      throw new GatewayError(
        401,
        "unauthorized",
        "Basic authentication required"
      );
    }

    let username: string;
    let password: string;
    try {
      const decoded = atob(authHeader.slice(6));
      const colonIndex = decoded.indexOf(":");
      if (colonIndex === -1) {
        throw new Error("Invalid format");
      }
      username = decoded.slice(0, colonIndex);
      password = decoded.slice(colonIndex + 1);
    } catch {
      throw new GatewayError(
        401,
        "unauthorized",
        "Malformed Basic authentication header"
      );
    }

    const isValid = await config.validate(username, password, c);
    if (!isValid) {
      c.header("www-authenticate", `Basic realm="${realm}"`);
      throw new GatewayError(403, "forbidden", "Invalid credentials");
    }

    await next();
  },
  evaluate: {
    onRequest: async (input, { config }) => {
      // Sanitize realm to prevent header injection
      const realm = escapeHeaderValue(
        sanitizeHeaderValue(config.realm ?? "Restricted")
      );

      const authHeader = input.headers.get("authorization");

      if (!authHeader || !authHeader.startsWith("Basic ")) {
        return {
          action: "reject",
          status: 401,
          code: "unauthorized",
          message: "Basic authentication required",
          headers: { "www-authenticate": `Basic realm="${realm}"` },
        };
      }

      let username: string;
      let password: string;
      try {
        const decoded = atob(authHeader.slice(6));
        const colonIndex = decoded.indexOf(":");
        if (colonIndex === -1) {
          throw new Error("Invalid format");
        }
        username = decoded.slice(0, colonIndex);
        password = decoded.slice(colonIndex + 1);
      } catch {
        return {
          action: "reject",
          status: 401,
          code: "unauthorized",
          message: "Malformed Basic authentication header",
        };
      }

      // validate function requires Hono Context - use a no-op for evaluate
      // Users needing evaluate should use a different auth policy
      const isValid = await config.validate(username, password, {} as Context);
      if (!isValid) {
        return {
          action: "reject",
          status: 403,
          code: "forbidden",
          message: "Invalid credentials",
          headers: { "www-authenticate": `Basic realm="${realm}"` },
        };
      }

      return { action: "continue" };
    },
  },
});
