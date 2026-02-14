/**
 * IPv4/IPv6 CIDR parsing and range matching utilities.
 *
 * Used by the {@link ipFilter} policy to check client IPs against
 * allowlists and denylists. Supports both individual IPs and CIDR notation
 * for IPv4 (`10.0.0.0/8`) and IPv6 (`2001:db8::/32`).
 *
 * IPv4 uses 32-bit unsigned integers for fast bitwise matching.
 * IPv6 uses BigInt for 128-bit address arithmetic.
 *
 * @module cidr
 */

// ── Discriminated union types ────────────────────────────────────────

/**
 * Parsed IPv4 CIDR range represented as 32-bit network address and mask.
 */
export interface ParsedCIDRv4 {
  readonly version: 4;
  /** Network address as a 32-bit unsigned integer. */
  readonly network: number;
  /** Subnet mask as a 32-bit unsigned integer. */
  readonly mask: number;
}

/**
 * Parsed IPv6 CIDR range represented as 128-bit BigInt network address and mask.
 */
export interface ParsedCIDRv6 {
  readonly version: 6;
  /** Network address as a 128-bit unsigned BigInt. */
  readonly network: bigint;
  /** Subnet mask as a 128-bit unsigned BigInt. */
  readonly mask: bigint;
}

/**
 * Discriminated union of parsed IPv4 and IPv6 CIDR ranges.
 * Use the `version` field to narrow the type.
 */
export type ParsedCIDR = ParsedCIDRv4 | ParsedCIDRv6;

// ── IPv4 internals ───────────────────────────────────────────────────

/**
 * Parse an IPv4 address to a 32-bit unsigned integer.
 * Returns `-1` for anything that isn't a valid dotted-quad.
 */
function ipv4ToInt(ip: string): number {
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
 * Parse an IPv4 CIDR string into a `ParsedCIDRv4`.
 * Bare IPs without a prefix length are treated as `/32`.
 */
function parseIPv4CIDR(ip: string, prefix: number): ParsedCIDRv4 | null {
  const addr = ipv4ToInt(ip);
  if (addr === -1) return null;
  if (prefix < 0 || prefix > 32) return null;

  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  return { version: 4, network: (addr & mask) >>> 0, mask };
}

// ── IPv6 internals ───────────────────────────────────────────────────

/** Full 128-bit mask for IPv6. */
const IPV6_FULL_MASK = (1n << 128n) - 1n;

/**
 * Parse an IPv6 address string into a 128-bit BigInt.
 * Handles `::` zero compression, zone IDs (`%eth0`), and uppercase hex.
 * Returns `null` for invalid addresses.
 */
function ipv6ToBigInt(raw: string): bigint | null {
  // Strip zone ID (e.g. "fe80::1%eth0" → "fe80::1")
  let addr = raw;
  const zoneIdx = addr.indexOf("%");
  if (zoneIdx !== -1) {
    addr = addr.slice(0, zoneIdx);
  }

  addr = addr.toLowerCase();

  // Handle :: compression
  const doubleColonIdx = addr.indexOf("::");
  let left: string[];
  let right: string[];

  if (doubleColonIdx !== -1) {
    // Reject multiple ::
    if (addr.indexOf("::", doubleColonIdx + 2) !== -1) return null;

    const leftPart = addr.slice(0, doubleColonIdx);
    const rightPart = addr.slice(doubleColonIdx + 2);

    left = leftPart === "" ? [] : leftPart.split(":");
    right = rightPart === "" ? [] : rightPart.split(":");

    const totalGroups = left.length + right.length;
    if (totalGroups > 8) return null;

    // Fill middle with zeros
    const fillCount = 8 - totalGroups;
    const groups = [...left, ...Array(fillCount).fill("0"), ...right];
    return groupsToBI(groups);
  }

  // No :: - must have exactly 8 groups
  const groups = addr.split(":");
  if (groups.length !== 8) return null;
  return groupsToBI(groups);
}

/**
 * Convert an array of exactly 8 hex group strings into a 128-bit BigInt.
 */
function groupsToBI(groups: string[]): bigint | null {
  if (groups.length !== 8) return null;
  let result = 0n;
  for (const group of groups) {
    if (group.length === 0 || group.length > 4) return null;
    const val = Number.parseInt(group, 16);
    if (Number.isNaN(val) || val < 0 || val > 0xffff) return null;
    result = (result << 16n) | BigInt(val);
  }
  return result;
}

/**
 * Parse an IPv6 CIDR string into a `ParsedCIDRv6`.
 * Bare addresses without a prefix length are treated as `/128`.
 */
function parseIPv6CIDR(ip: string, prefix: number): ParsedCIDRv6 | null {
  const addr = ipv6ToBigInt(ip);
  if (addr === null) return null;
  if (prefix < 0 || prefix > 128) return null;

  const mask =
    prefix === 0
      ? 0n
      : (IPV6_FULL_MASK << BigInt(128 - prefix)) & IPV6_FULL_MASK;
  return { version: 6, network: addr & mask, mask };
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Detect whether a CIDR or IP string is IPv6.
 * Presence of `:` indicates IPv6 (IPv4 dotted-quad never contains colons).
 */
function isIPv6(input: string): boolean {
  return input.includes(":");
}

/**
 * Parse a CIDR string (IPv4 or IPv6) into a network address and mask.
 * Bare IPs without a prefix length are treated as `/32` (IPv4) or `/128` (IPv6).
 *
 * @param cidr - IP address or CIDR notation string (IPv4 or IPv6).
 * @returns Parsed range, or `null` if the input is invalid.
 */
export function parseCIDR(cidr: string): ParsedCIDR | null {
  const slash = cidr.indexOf("/");

  if (slash === -1) {
    // Bare IP - no prefix length
    if (isIPv6(cidr)) {
      return parseIPv6CIDR(cidr, 128);
    }
    const addr = ipv4ToInt(cidr);
    if (addr === -1) return null;
    return { version: 4, network: addr, mask: 0xffffffff >>> 0 };
  }

  const ipPart = cidr.slice(0, slash);
  const bits = Number(cidr.slice(slash + 1));
  if (Number.isNaN(bits)) return null;

  if (isIPv6(ipPart)) {
    return parseIPv6CIDR(ipPart, bits);
  }
  return parseIPv4CIDR(ipPart, bits);
}

/**
 * Check if an IP address (IPv4 or IPv6) falls within any of the parsed CIDR ranges.
 *
 * IPv4 addresses only match IPv4 ranges and vice versa - there is no
 * cross-family matching.
 *
 * @param ip - IP address string.
 * @param ranges - Pre-parsed CIDR ranges from {@link parseCIDR}.
 * @returns `true` if the IP matches any range.
 */
export function isInRange(ip: string, ranges: ParsedCIDR[]): boolean {
  if (isIPv6(ip)) {
    const addr = ipv6ToBigInt(ip);
    if (addr === null) return false;
    for (const range of ranges) {
      if (range.version !== 6) continue;
      if ((addr & range.mask) === range.network) return true;
    }
    return false;
  }

  // IPv4 path
  const addr = ipv4ToInt(ip);
  if (addr === -1) return false;
  for (const range of ranges) {
    if (range.version !== 4) continue;
    if ((addr & range.mask) >>> 0 === range.network) return true;
  }
  return false;
}
