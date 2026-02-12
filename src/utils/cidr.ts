/**
 * IPv4 CIDR parsing and range matching utilities.
 *
 * Used by the {@link ipFilter} policy to check client IPs against
 * allowlists and denylists. Supports both individual IPs (`192.168.1.1`)
 * and CIDR notation (`10.0.0.0/8`).
 *
 * @module cidr
 */

/**
 * Parsed CIDR range represented as a 32-bit network address and mask
 * for fast bitwise matching.
 */
export interface ParsedCIDR {
  /** Network address as a 32-bit unsigned integer. */
  network: number;
  /** Subnet mask as a 32-bit unsigned integer. */
  mask: number;
}

/**
 * Parse an IPv4 address to a 32-bit integer.
 *
 * **IPv4-only.** IPv6 addresses (or any non-dotted-quad string) return `-1`.
 * This means IPv6 addresses will never match any CIDR range in
 * {@link isInRange}, causing them to **fail open in deny mode** — an IPv6
 * client will not be matched by any denylist entry. This is a known
 * limitation; IPv6 CIDR support is not yet implemented.
 */
function ipToInt(ip: string): number {
  const parts = ip.split(".");
  if (parts.length !== 4) return -1;
  let result = 0;
  for (const part of parts) {
    const n = Number(part);
    if (Number.isNaN(n) || n < 0 || n > 255) return -1;
    result = (result << 8) | n;
  }
  return result >>> 0; // unsigned
}

/**
 * Parse a CIDR string (e.g. `"10.0.0.0/8"`) into a network address and mask.
 * Bare IPs without a prefix length are treated as `/32`.
 *
 * @param cidr - IPv4 address or CIDR notation string.
 * @returns Parsed range, or `null` if the input is invalid.
 */
export function parseCIDR(cidr: string): ParsedCIDR | null {
  const slash = cidr.indexOf("/");
  if (slash === -1) {
    // Treat bare IPs as /32
    const ip = ipToInt(cidr);
    if (ip === -1) return null;
    return { network: ip, mask: 0xffffffff >>> 0 };
  }

  const ip = ipToInt(cidr.slice(0, slash));
  const bits = Number(cidr.slice(slash + 1));
  if (ip === -1 || Number.isNaN(bits) || bits < 0 || bits > 32) return null;

  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return { network: (ip & mask) >>> 0, mask };
}

/**
 * Check if an IPv4 address falls within any of the parsed CIDR ranges.
 *
 * @param ip - IPv4 address string (e.g. `"192.168.1.5"`).
 * @param ranges - Pre-parsed CIDR ranges from {@link parseCIDR}.
 * @returns `true` if the IP matches any range.
 */
export function isInRange(ip: string, ranges: ParsedCIDR[]): boolean {
  const addr = ipToInt(ip);
  if (addr === -1) return false;
  for (const range of ranges) {
    if ((addr & range.mask) >>> 0 === range.network) return true;
  }
  return false;
}
