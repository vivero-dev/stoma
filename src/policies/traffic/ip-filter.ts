/**
 * IP allowlist/denylist filtering policy.
 *
 * @module ip-filter
 */

import { GatewayError } from "../../core/errors";
import { isInRange, type ParsedCIDR, parseCIDR } from "../../utils/cidr";
import { extractClientIp } from "../../utils/ip";
import { Priority, withSkip } from "../sdk";
import type { Policy, PolicyConfig } from "../types";

export interface IpFilterConfig extends PolicyConfig {
  /** IPs or CIDR ranges to allow (allowlist mode). */
  allow?: string[];
  /** IPs or CIDR ranges to deny (denylist mode). */
  deny?: string[];
  /** Filter mode. Default: "deny". */
  mode?: "allow" | "deny";
  /** Ordered list of headers to inspect for the client IP. Default: `["cf-connecting-ip", "x-forwarded-for"]`. */
  ipHeaders?: string[];
}

/**
 * Block or allow requests based on client IP address or CIDR range.
 *
 * Supports both allowlist and denylist modes. Client IP is extracted from
 * `CF-Connecting-IP` (Cloudflare) or `X-Forwarded-For`. Accepts individual
 * IPs (`192.168.1.1`) and CIDR notation (`10.0.0.0/8`).
 *
 * @param config - IP filter rules and mode selection.
 * @returns A {@link Policy} at priority 1 (runs before everything else).
 *
 * @example
 * ```ts
 * // Allow only internal IPs
 * ipFilter({ mode: "allow", allow: ["10.0.0.0/8", "172.16.0.0/12"] });
 *
 * // Block known bad actors
 * ipFilter({ deny: ["203.0.113.0/24", "198.51.100.42"] });
 * ```
 */
export function ipFilter(config: IpFilterConfig): Policy {
  const mode = config.mode ?? "deny";
  const ipHeaders = config.ipHeaders;
  const allowRanges: ParsedCIDR[] = (config.allow ?? [])
    .map(parseCIDR)
    .filter((r): r is ParsedCIDR => r !== null);
  const denyRanges: ParsedCIDR[] = (config.deny ?? [])
    .map(parseCIDR)
    .filter((r): r is ParsedCIDR => r !== null);

  const handler: import("hono").MiddlewareHandler = async (c, next) => {
    const ip = extractClientIp(c.req.raw.headers, ipHeaders);

    if (mode === "allow") {
      // Allowlist mode: deny unless IP matches
      if (!isInRange(ip, allowRanges)) {
        throw new GatewayError(403, "ip_denied", "Access denied");
      }
    } else {
      // Denylist mode: allow unless IP matches
      if (isInRange(ip, denyRanges)) {
        throw new GatewayError(403, "ip_denied", "Access denied");
      }
    }

    await next();
  };

  return {
    name: "ip-filter",
    priority: Priority.IP_FILTER,
    handler: withSkip(config.skip, handler),
  };
}
