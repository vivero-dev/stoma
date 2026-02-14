/**
 * Shared client IP extraction utility.
 *
 * Centralises the IP header lookup logic used by rate limiting, IP filtering,
 * and request logging. The header priority order is configurable - the first
 * header that contains a value wins.
 *
 * @module ip
 */

import { isInRange, type ParsedCIDR, parseCIDR } from "./cidr";

/** Default ordered list of headers to inspect for the client IP. */
export const DEFAULT_IP_HEADERS = ["cf-connecting-ip", "x-forwarded-for"];

export interface ExtractClientIpOptions {
  /** Ordered list of headers to inspect. Default: ["cf-connecting-ip", "x-forwarded-for"]. */
  ipHeaders?: readonly string[];
  /**
   * List of trusted proxy IP ranges (CIDR notation).
   * When specified, X-Forwarded-For will only be trusted if the client IP
   * (leftmost) is within one of these ranges.
   *
   * @example
   * // Only trust X-Forwarded-For from Cloudflare IPs
   * { ipHeaders: ["cf-connecting-ip", "x-forwarded-for"], trustedProxies: ["173.245.48.0/20"] }
   */
  trustedProxies?: readonly string[];
  /**
   * When true, use the rightmost IP from X-Forwarded-For instead of leftmost.
   * The rightmost IP is the one added by the most recent trusted proxy.
   * Default: false.
   */
  useRightmostForwardedIp?: boolean;
}

/**
 * Extract the client IP address from request headers.
 *
 * Iterates through `ipHeaders` in order. For comma-separated headers like
 * `X-Forwarded-For`, the behavior depends on options:
 * - By default, returns the first (leftmost) value
 * - With `useRightmostForwardedIp: true`, returns the last (rightmost) value
 * - With `trustedProxies`, validates the leftmost IP against trusted ranges
 *
 * @security The `X-Forwarded-For` header is trivially spoofable by clients
 * outside of trusted proxy infrastructure. An attacker can set arbitrary IP
 * values to bypass IP-based allowlists, rate limits, or geo-restrictions.
 *
 * To mitigate:
 * 1. Use `cf-connecting-ip` when behind Cloudflare (not spoofable by clients)
 * 2. Configure `trustedProxies` to validate X-Forwarded-For IPs
 * 3. Use `useRightmostForwardedIp: true` when behind a trusted proxy
 *
 * @param headers - An object with a `.get(name)` method (e.g. `Headers`, Hono `c.req`).
 * @param options - Configuration options for IP extraction.
 * @returns The extracted IP address, or `"unknown"` if none found.
 */
export function extractClientIp(
  headers: { get(name: string): string | null | undefined },
  options: ExtractClientIpOptions = {}
): string {
  const {
    ipHeaders = DEFAULT_IP_HEADERS,
    trustedProxies,
    useRightmostForwardedIp = false,
  } = options;

  const parsedTrustedProxies: ParsedCIDR[] | null = trustedProxies
    ? trustedProxies
        .map((cidr) => parseCIDR(cidr))
        .filter((r): r is ParsedCIDR => r !== null)
    : null;

  for (const header of ipHeaders) {
    const value = headers.get(header);
    if (!value) continue;

    const ips = value.split(",").map((ip) => ip.trim());
    const clientIp = useRightmostForwardedIp ? ips[ips.length - 1] : ips[0];

    // If trustedProxies is configured, validate against it
    if (parsedTrustedProxies && header.toLowerCase() === "x-forwarded-for") {
      if (!isInRange(clientIp, parsedTrustedProxies)) {
        // Client IP is not from trusted proxy - don't trust this header
        continue;
      }
    }

    return clientIp;
  }
  return "unknown";
}
