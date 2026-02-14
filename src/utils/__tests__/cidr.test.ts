import { describe, expect, it } from "vitest";
import { isInRange, parseCIDR } from "../cidr";

describe("parseCIDR", () => {
  it("should parse valid CIDR notation", () => {
    const result = parseCIDR("10.0.0.0/8");
    expect(result).not.toBeNull();
    expect(result!.network).toBe(0x0a000000); // 10.0.0.0
    expect(result!.mask).toBe(0xff000000); // /8 mask
  });

  it("should parse /16 range", () => {
    const result = parseCIDR("192.168.0.0/16");
    expect(result).not.toBeNull();
    expect(result!.network).toBe(0xc0a80000); // 192.168.0.0
    expect(result!.mask).toBe(0xffff0000); // /16 mask
  });

  it("should parse /24 range", () => {
    const result = parseCIDR("172.16.1.0/24");
    expect(result).not.toBeNull();
    expect(result!.network).toBe(0xac100100); // 172.16.1.0
    expect(result!.mask).toBe(0xffffff00); // /24 mask
  });

  it("should treat bare IP as /32", () => {
    const result = parseCIDR("192.168.1.1");
    expect(result).not.toBeNull();
    expect(result!.network).toBe(0xc0a80101); // 192.168.1.1
    expect(result!.mask).toBe(0xffffffff); // /32 mask
  });

  it("should return null for non-IP string", () => {
    expect(parseCIDR("not-an-ip")).toBeNull();
  });

  it("should return null for out-of-range octets", () => {
    expect(parseCIDR("999.999.999.999/8")).toBeNull();
  });

  it("should return null for prefix length > 32", () => {
    expect(parseCIDR("10.0.0.0/33")).toBeNull();
  });

  it("should return null for negative prefix length", () => {
    expect(parseCIDR("10.0.0.0/-1")).toBeNull();
  });

  it("should handle /0 (matches everything)", () => {
    const result = parseCIDR("0.0.0.0/0");
    expect(result).not.toBeNull();
    expect(result!.network).toBe(0);
    expect(result!.mask).toBe(0);
  });

  it("should handle /32 (single IP)", () => {
    const result = parseCIDR("10.20.30.40/32");
    expect(result).not.toBeNull();
    expect(result!.network).toBe(0x0a141e28); // 10.20.30.40
    expect(result!.mask).toBe(0xffffffff);
  });

  it("should mask off host bits in network address", () => {
    // 10.0.0.5/8 should normalize network to 10.0.0.0
    const result = parseCIDR("10.0.0.5/8");
    expect(result).not.toBeNull();
    expect(result!.network).toBe(0x0a000000); // 10.0.0.0, not 10.0.0.5
  });
});

// ---------------------------------------------------------------------------
// IPv6 parsing
// ---------------------------------------------------------------------------

describe("parseCIDR - IPv6", () => {
  it("should parse full IPv6 address as /128", () => {
    const result = parseCIDR("2001:0db8:85a3:0000:0000:8a2e:0370:7334");
    expect(result).not.toBeNull();
    expect(result!.version).toBe(6);
    if (result!.version === 6) {
      expect(result!.network).toBe(0x20010db885a3000000008a2e03707334n);
      expect(result!.mask).toBe(0xffffffffffffffffffffffffffffffffn);
    }
  });

  it("should parse IPv6 CIDR with /64", () => {
    const result = parseCIDR("2001:db8::/64");
    expect(result).not.toBeNull();
    expect(result!.version).toBe(6);
    if (result!.version === 6) {
      expect(result!.network).toBe(0x20010db8000000000000000000000000n);
      expect(result!.mask).toBe(0xffffffffffffffff0000000000000000n);
    }
  });

  it("should parse IPv6 CIDR with /48", () => {
    const result = parseCIDR("2001:db8:abcd::/48");
    expect(result).not.toBeNull();
    expect(result!.version).toBe(6);
    if (result!.version === 6) {
      expect(result!.network).toBe(0x20010db8abcd00000000000000000000n);
      expect(result!.mask).toBe(0xffffffffffff00000000000000000000n);
    }
  });

  it("should handle :: zero compression (loopback)", () => {
    const result = parseCIDR("::1");
    expect(result).not.toBeNull();
    expect(result!.version).toBe(6);
    if (result!.version === 6) {
      expect(result!.network).toBe(1n);
      expect(result!.mask).toBe(0xffffffffffffffffffffffffffffffffn);
    }
  });

  it("should handle :: at end", () => {
    const result = parseCIDR("fe80::");
    expect(result).not.toBeNull();
    expect(result!.version).toBe(6);
    if (result!.version === 6) {
      expect(result!.network).toBe(0xfe800000000000000000000000000000n);
    }
  });

  it("should handle :: in middle", () => {
    const result = parseCIDR("2001:db8::1");
    expect(result).not.toBeNull();
    expect(result!.version).toBe(6);
    if (result!.version === 6) {
      expect(result!.network).toBe(0x20010db8000000000000000000000001n);
    }
  });

  it("should parse ::/0 (matches all IPv6)", () => {
    const result = parseCIDR("::/0");
    expect(result).not.toBeNull();
    expect(result!.version).toBe(6);
    if (result!.version === 6) {
      expect(result!.network).toBe(0n);
      expect(result!.mask).toBe(0n);
    }
  });

  it("should parse /128 (single address)", () => {
    const result = parseCIDR("::1/128");
    expect(result).not.toBeNull();
    expect(result!.version).toBe(6);
    if (result!.version === 6) {
      expect(result!.network).toBe(1n);
      expect(result!.mask).toBe(0xffffffffffffffffffffffffffffffffn);
    }
  });

  it("should strip zone ID", () => {
    const result = parseCIDR("fe80::1%eth0");
    expect(result).not.toBeNull();
    expect(result!.version).toBe(6);
    if (result!.version === 6) {
      expect(result!.network).toBe(0xfe800000000000000000000000000001n);
    }
  });

  it("should mask off host bits in IPv6 network address", () => {
    // 2001:db8::1/32 should normalize network to 2001:db8::
    const result = parseCIDR("2001:db8::1/32");
    expect(result).not.toBeNull();
    expect(result!.version).toBe(6);
    if (result!.version === 6) {
      expect(result!.network).toBe(0x20010db8000000000000000000000000n);
    }
  });

  it("should return null for prefix length > 128", () => {
    expect(parseCIDR("::1/129")).toBeNull();
  });

  it("should return null for negative IPv6 prefix", () => {
    expect(parseCIDR("::1/-1")).toBeNull();
  });

  it("should return null for too many groups", () => {
    expect(parseCIDR("2001:db8:1:2:3:4:5:6:7")).toBeNull();
  });

  it("should return null for invalid hex group", () => {
    expect(parseCIDR("2001:db8::gggg")).toBeNull();
  });

  it("should return null for multiple :: in address", () => {
    expect(parseCIDR("2001::db8::1")).toBeNull();
  });

  it("should add version 4 to IPv4 results", () => {
    const result = parseCIDR("10.0.0.0/8");
    expect(result).not.toBeNull();
    expect(result!.version).toBe(4);
  });

  it("should handle uppercase hex", () => {
    const result = parseCIDR("2001:0DB8::ABCD");
    expect(result).not.toBeNull();
    expect(result!.version).toBe(6);
    if (result!.version === 6) {
      expect(result!.network).toBe(0x20010db800000000000000000000abcdn);
    }
  });
});

// ---------------------------------------------------------------------------
// IPv6 range matching
// ---------------------------------------------------------------------------

describe("isInRange - IPv6", () => {
  it("should match IPv6 address within range", () => {
    const ranges = [parseCIDR("2001:db8::/32")!];
    expect(isInRange("2001:db8::1", ranges)).toBe(true);
  });

  it("should not match IPv6 address outside range", () => {
    const ranges = [parseCIDR("2001:db8::/32")!];
    expect(isInRange("2001:db9::1", ranges)).toBe(false);
  });

  it("should match exact IPv6 with /128", () => {
    const ranges = [parseCIDR("::1/128")!];
    expect(isInRange("::1", ranges)).toBe(true);
    expect(isInRange("::2", ranges)).toBe(false);
  });

  it("should match all IPv6 with /0", () => {
    const ranges = [parseCIDR("::/0")!];
    expect(isInRange("2001:db8::1", ranges)).toBe(true);
    expect(isInRange("fe80::1", ranges)).toBe(true);
  });

  it("should not match IPv4 address against IPv6 range", () => {
    const ranges = [parseCIDR("2001:db8::/32")!];
    expect(isInRange("10.0.0.1", ranges)).toBe(false);
  });

  it("should not match IPv6 address against IPv4 range", () => {
    const ranges = [parseCIDR("10.0.0.0/8")!];
    expect(isInRange("2001:db8::1", ranges)).toBe(false);
  });

  it("should handle mixed IPv4 and IPv6 ranges", () => {
    const ranges = [parseCIDR("10.0.0.0/8")!, parseCIDR("2001:db8::/32")!];
    expect(isInRange("10.0.0.1", ranges)).toBe(true);
    expect(isInRange("2001:db8::1", ranges)).toBe(true);
    expect(isInRange("192.168.1.1", ranges)).toBe(false);
    expect(isInRange("fe80::1", ranges)).toBe(false);
  });

  it("should handle /64 boundary", () => {
    const ranges = [parseCIDR("2001:db8:abcd:0012::/64")!];
    expect(isInRange("2001:db8:abcd:0012::1", ranges)).toBe(true);
    expect(isInRange("2001:db8:abcd:0012:ffff:ffff:ffff:ffff", ranges)).toBe(
      true
    );
    expect(isInRange("2001:db8:abcd:0013::1", ranges)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// IPv4 range matching (existing)
// ---------------------------------------------------------------------------

describe("isInRange", () => {
  it("should return true for IP within CIDR range", () => {
    const ranges = [parseCIDR("10.0.0.0/8")!];
    expect(isInRange("10.1.2.3", ranges)).toBe(true);
  });

  it("should return false for IP outside CIDR range", () => {
    const ranges = [parseCIDR("10.0.0.0/8")!];
    expect(isInRange("192.168.1.1", ranges)).toBe(false);
  });

  it("should check multiple ranges", () => {
    const ranges = [parseCIDR("10.0.0.0/8")!, parseCIDR("172.16.0.0/12")!];
    expect(isInRange("10.5.5.5", ranges)).toBe(true);
    expect(isInRange("172.20.1.1", ranges)).toBe(true);
    expect(isInRange("192.168.1.1", ranges)).toBe(false);
  });

  it("should return false for invalid IP", () => {
    const ranges = [parseCIDR("10.0.0.0/8")!];
    expect(isInRange("not-an-ip", ranges)).toBe(false);
  });

  it("should return false for empty ranges array", () => {
    expect(isInRange("10.0.0.1", [])).toBe(false);
  });

  it("should match 0.0.0.0 within /0 range", () => {
    const ranges = [parseCIDR("0.0.0.0/0")!];
    expect(isInRange("0.0.0.0", ranges)).toBe(true);
  });

  it("should match 255.255.255.255 within /0 range", () => {
    const ranges = [parseCIDR("0.0.0.0/0")!];
    expect(isInRange("255.255.255.255", ranges)).toBe(true);
  });

  it("should match exact IP with /32 range", () => {
    const ranges = [parseCIDR("192.168.1.100/32")!];
    expect(isInRange("192.168.1.100", ranges)).toBe(true);
    expect(isInRange("192.168.1.101", ranges)).toBe(false);
  });

  it("should handle boundary IPs of a range", () => {
    const ranges = [parseCIDR("192.168.1.0/24")!];
    // First IP in range
    expect(isInRange("192.168.1.0", ranges)).toBe(true);
    // Last IP in range
    expect(isInRange("192.168.1.255", ranges)).toBe(true);
    // Just outside
    expect(isInRange("192.168.2.0", ranges)).toBe(false);
  });
});
