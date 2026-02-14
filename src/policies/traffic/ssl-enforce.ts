/**
 * SSL enforcement policy - redirect or reject non-HTTPS requests.
 *
 * @module ssl-enforce
 */

import { GatewayError } from "../../core/errors";
import { definePolicy, Priority } from "../sdk";
import type { PolicyConfig } from "../types";

export interface SslEnforceConfig extends PolicyConfig {
  /** Redirect HTTP to HTTPS (301). If false, block with 403. Default: true. */
  redirect?: boolean;
  /** HSTS max-age in seconds. Default: 31536000 (1 year). */
  hstsMaxAge?: number;
  /** Add includeSubDomains to HSTS header. Default: false. */
  includeSubDomains?: boolean;
  /** Add preload to HSTS header. Default: false. */
  preload?: boolean;
}

/**
 * Enforce HTTPS and append HSTS headers on secure responses.
 *
 * Detects protocol from `x-forwarded-proto` (or request URL protocol).
 * For non-HTTPS requests, either redirects to HTTPS (301) or throws 403.
 *
 * @param config - Redirect behavior and HSTS settings.
 * @returns A {@link Policy} at priority 5 (EARLY).
 */
export const sslEnforce = /*#__PURE__*/ definePolicy<SslEnforceConfig>({
  name: "ssl-enforce",
  priority: Priority.EARLY,
  httpOnly: true,
  defaults: {
    redirect: true,
    hstsMaxAge: 31536000,
    includeSubDomains: false,
    preload: false,
  },
  handler: async (c, next, { config }) => {
    const proto =
      c.req.header("x-forwarded-proto") ??
      new URL(c.req.url).protocol.replace(":", "");
    const isHttps = proto === "https";

    if (!isHttps) {
      if (config.redirect) {
        const url = new URL(c.req.url);
        url.protocol = "https:";
        c.res = new Response(null, {
          status: 301,
          headers: { Location: url.toString() },
        });
        return;
      }
      throw new GatewayError(403, "ssl_required", "HTTPS is required");
    }

    await next();

    let hsts = `max-age=${config.hstsMaxAge}`;
    if (config.includeSubDomains) hsts += "; includeSubDomains";
    if (config.preload) hsts += "; preload";
    c.res.headers.set("Strict-Transport-Security", hsts);
  },
});
