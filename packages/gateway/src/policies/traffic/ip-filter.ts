/**
 * IP allowlist/denylist filtering policy.
 *
 * Supports both HTTP (`handler`) and protocol-agnostic (`evaluate`) entry
 * points. The evaluate path uses {@link PolicyInput.clientIp} when available
 * (set by the runtime), falling back to header extraction.
 *
 * @module ip-filter
 */

import { GatewayError } from "../../core/errors";
import type { PolicyInput, PolicyResult } from "../../core/protocol";
import { isInRange, type ParsedCIDR, parseCIDR } from "../../utils/cidr";
import { type ExtractClientIpOptions, extractClientIp } from "../../utils/ip";
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
  const ipHeaderOptions: ExtractClientIpOptions = config.ipHeaders
    ? { ipHeaders: config.ipHeaders }
    : {};
  const allowRanges: ParsedCIDR[] = (config.allow ?? [])
    .map(parseCIDR)
    .filter((r): r is ParsedCIDR => r !== null);
  const denyRanges: ParsedCIDR[] = (config.deny ?? [])
    .map(parseCIDR)
    .filter((r): r is ParsedCIDR => r !== null);

  // ── Shared logic - used by both handler and evaluate ────────────
  function checkIp(ip: string): PolicyResult {
    if (mode === "allow") {
      if (!isInRange(ip, allowRanges)) {
        return {
          action: "reject",
          status: 403,
          code: "ip_denied",
          message: "Access denied",
        };
      }
    } else {
      if (isInRange(ip, denyRanges)) {
        return {
          action: "reject",
          status: 403,
          code: "ip_denied",
          message: "Access denied",
        };
      }
    }
    return { action: "continue" };
  }

  // ── HTTP handler (Hono middleware) ──────────────────────────────
  const handler: import("hono").MiddlewareHandler = async (c, next) => {
    const ip = extractClientIp(c.req.raw.headers, ipHeaderOptions);
    const result = checkIp(ip);
    if (result.action === "reject") {
      throw new GatewayError(result.status, result.code, result.message);
    }
    await next();
  };

  return {
    name: "ip-filter",
    priority: Priority.IP_FILTER,
    handler: withSkip(config.skip, handler),
    phases: ["request-headers"],
    // ── Protocol-agnostic evaluator ────────────────────────────────
    evaluate: {
      onRequest: async (input: PolicyInput) => {
        const ip =
          input.clientIp ?? extractClientIp(input.headers, ipHeaderOptions);
        return checkIp(ip);
      },
    },
  };
}
