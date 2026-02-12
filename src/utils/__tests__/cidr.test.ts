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
