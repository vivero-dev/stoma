/**
 * HTTP Basic authentication policy.
 *
 * @module basic-auth
 */
import { GatewayError } from "../../core/errors";
import type { PolicyConfig } from "../types";
import type { Context } from "hono";
import { definePolicy, Priority } from "../sdk";

export interface BasicAuthConfig extends PolicyConfig {
  /** Validate username/password. Return true if valid. */
  validate: (username: string, password: string, c: Context) => boolean | Promise<boolean>;
  /** Realm for the WWW-Authenticate header. Default: "Restricted" */
  realm?: string;
}

/**
 * Basic Authentication policy — validate base64-encoded credentials.
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
export const basicAuth = definePolicy<BasicAuthConfig>({
  name: "basic-auth",
  priority: Priority.AUTH,
  defaults: { realm: "Restricted" },
  handler: async (c, next, { config }) => {
    // Sanitize realm to prevent header injection (escape quotes, strip control chars)
    const realm = (config.realm ?? "Restricted")
      .replace(/[\r\n\0]/g, "")
      .replace(/"/g, '\\"');

    const authHeader = c.req.header("authorization");

    if (!authHeader || !authHeader.startsWith("Basic ")) {
      c.header("www-authenticate", `Basic realm="${realm}"`);
      throw new GatewayError(401, "unauthorized", "Basic authentication required");
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
      throw new GatewayError(401, "unauthorized", "Malformed Basic authentication header");
    }

    const isValid = await config.validate(username, password, c);
    if (!isValid) {
      c.header("www-authenticate", `Basic realm="${realm}"`);
      throw new GatewayError(403, "forbidden", "Invalid credentials");
    }

    await next();
  },
});
