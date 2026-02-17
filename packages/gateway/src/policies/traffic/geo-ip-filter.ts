/**
 * Geographic IP filtering policy.
 *
 * Allows or denies requests based on the country code derived from
 * a configurable header (defaults to Cloudflare's `cf-ipcountry`).
 *
 * @module geo-ip-filter
 */
import { GatewayError } from "../../core/errors";
import type { PolicyInput } from "../../core/protocol";
import { Priority, policyDebug, resolveConfig, withSkip } from "../sdk";
import type { Policy, PolicyConfig } from "../types";

export interface GeoIpFilterConfig extends PolicyConfig {
  /** Country codes to allow (e.g. `["US", "CA", "GB"]`). Used in "allow" mode. */
  allow?: string[];
  /** Country codes to deny. Used in "deny" mode. */
  deny?: string[];
  /** Filter mode. Default: `"deny"`. */
  mode?: "allow" | "deny";
  /** Header name to read the country code from. Default: `"cf-ipcountry"`. */
  countryHeader?: string;
}

/**
 * Block or allow requests based on geographic country code.
 *
 * Reads the country from the configured header (default `cf-ipcountry`,
 * set by Cloudflare). Supports allowlist and denylist modes. Country
 * sets are pre-computed once at construction time for efficiency.
 *
 * @param config - Country filter rules and mode selection.
 * @returns A policy at priority 1 (IP_FILTER).
 *
 * @example
 * ```ts
 * // Allow only US, Canada, and UK
 * geoIpFilter({ mode: "allow", allow: ["US", "CA", "GB"] });
 *
 * // Block specific countries
 * geoIpFilter({ deny: ["CN", "RU"] });
 * ```
 */
export function geoIpFilter(config?: GeoIpFilterConfig): Policy {
  const resolved = resolveConfig<GeoIpFilterConfig>(
    { mode: "deny", countryHeader: "cf-ipcountry" },
    config
  );

  // Pre-compute country sets once at construction time instead of per-request
  const allowSet = new Set(
    (resolved.allow ?? []).map((code) => code.toUpperCase())
  );
  const denySet = new Set(
    (resolved.deny ?? []).map((code) => code.toUpperCase())
  );

  const handler: import("hono").MiddlewareHandler = async (c, next) => {
    const debug = policyDebug(c, "geo-ip-filter");
    const country = c.req.header(resolved.countryHeader!)?.toUpperCase();
    const mode = resolved.mode!;

    debug(`country=${country ?? "unknown"} mode=${mode}`);

    if (mode === "allow") {
      // Unknown country (missing header) is denied in allow mode
      if (!country || !allowSet.has(country)) {
        throw new GatewayError(
          403,
          "geo_denied",
          "Access denied from this region"
        );
      }
    } else {
      // Unknown country (missing header) is allowed in deny mode
      if (country && denySet.has(country)) {
        throw new GatewayError(
          403,
          "geo_denied",
          "Access denied from this region"
        );
      }
    }

    await next();
  };

  return {
    name: "geo-ip-filter",
    priority: Priority.IP_FILTER,
    handler: withSkip(config?.skip, handler),
    phases: ["request-headers"],
    evaluate: {
      onRequest: async (input: PolicyInput) => {
        const country = input.headers
          .get(resolved.countryHeader!)
          ?.toUpperCase();
        const mode = resolved.mode!;

        if (mode === "allow") {
          if (!country || !allowSet.has(country)) {
            return {
              action: "reject",
              status: 403,
              code: "geo_denied",
              message: "Access denied from this region",
            };
          }
        } else {
          if (country && denySet.has(country)) {
            return {
              action: "reject",
              status: 403,
              code: "geo_denied",
              message: "Access denied from this region",
            };
          }
        }

        return { action: "continue" };
      },
    },
  };
}
