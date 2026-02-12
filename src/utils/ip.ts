/**
 * Shared client IP extraction utility.
 *
 * Centralises the IP header lookup logic used by rate limiting, IP filtering,
 * and request logging. The header priority order is configurable — the first
 * header that contains a value wins.
 *
 * @module ip
 */

/** Default ordered list of headers to inspect for the client IP. */
export const DEFAULT_IP_HEADERS = ["cf-connecting-ip", "x-forwarded-for"];

/**
 * Extract the client IP address from request headers.
 *
 * Iterates through `ipHeaders` in order. For comma-separated headers like
 * `X-Forwarded-For`, only the first (leftmost) value is returned.
 *
 * @security The `X-Forwarded-For` header is trivially spoofable by clients
 * outside of trusted proxy infrastructure. An attacker can set arbitrary IP
 * values to bypass IP-based allowlists, rate limits, or geo-restrictions.
 * When deploying behind a load balancer or CDN, configure `ipHeaders` to
 * match your proxy's trusted header (e.g. `cf-connecting-ip` for Cloudflare,
 * `x-real-ip` for nginx) and ensure the proxy strips or overwrites any
 * client-supplied forwarding headers.
 *
 * @param headers - An object with a `.get(name)` method (e.g. `Headers`, Hono `c.req`).
 * @param ipHeaders - Ordered list of headers to inspect. Default: {@link DEFAULT_IP_HEADERS}.
 * @returns The extracted IP address, or `"unknown"` if none found.
 */
export function extractClientIp(
  headers: { get(name: string): string | null | undefined },
  ipHeaders: readonly string[] = DEFAULT_IP_HEADERS,
): string {
  for (const header of ipHeaders) {
    const value = headers.get(header);
    if (value) return value.split(",")[0].trim();
  }
  return "unknown";
}
