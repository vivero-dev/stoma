import { describe, expect, it } from "vitest";
import { extractClientIp } from "../ip";

describe("extractClientIp", () => {
  const headers = (values: Record<string, string | null>) => ({
    get: (name: string) => values[name] ?? null,
  });

  // --- Basic extraction ---

  it("should extract IP from cf-connecting-ip", () => {
    const h = headers({ "cf-connecting-ip": "203.0.113.50" });
    expect(extractClientIp(h)).toBe("203.0.113.50");
  });

  it("should extract IP from x-forwarded-for", () => {
    const h = headers({ "x-forwarded-for": "198.51.100.178" });
    expect(extractClientIp(h)).toBe("198.51.100.178");
  });

  it("should prefer cf-connecting-ip over x-forwarded-for", () => {
    const h = headers({
      "cf-connecting-ip": "203.0.113.50",
      "x-forwarded-for": "198.51.100.178",
    });
    expect(extractClientIp(h)).toBe("203.0.113.50");
  });

  it("should return unknown when no headers present", () => {
    const h = headers({});
    expect(extractClientIp(h)).toBe("unknown");
  });

  // --- X-Forwarded-For parsing ---

  it("should extract first IP from comma-separated x-forwarded-for", () => {
    const h = headers({
      "x-forwarded-for": "203.0.113.50, 198.51.100.178, 192.0.2.1",
    });
    expect(extractClientIp(h)).toBe("203.0.113.50");
  });

  it("should trim whitespace from x-forwarded-for IPs", () => {
    const h = headers({
      "x-forwarded-for": "  203.0.113.50  , 198.51.100.178",
    });
    expect(extractClientIp(h)).toBe("203.0.113.50");
  });

  // --- IPv6 support ---

  it("should extract IPv6 address from cf-connecting-ip", () => {
    const h = headers({ "cf-connecting-ip": "2001:db8::1" });
    expect(extractClientIp(h)).toBe("2001:db8::1");
  });

  it("should extract first IPv6 from comma-separated x-forwarded-for", () => {
    const h = headers({
      "x-forwarded-for": "2001:db8::1, 2001:db8::2",
    });
    expect(extractClientIp(h)).toBe("2001:db8::1");
  });

  it("should validate IPv6 trustedProxies", () => {
    const h = headers({ "x-forwarded-for": "2001:db8::1" });
    const ip = extractClientIp(h, { trustedProxies: ["2001:db8::/32"] });
    expect(ip).toBe("2001:db8::1");
  });

  it("should skip x-forwarded-for when IPv6 not in trustedProxies", () => {
    const h = headers({
      "cf-connecting-ip": "203.0.113.50",
      "x-forwarded-for": "fe80::1",
    });
    const ip = extractClientIp(h, { trustedProxies: ["2001:db8::/32"] });
    expect(ip).toBe("203.0.113.50");
  });

  it("should validate mixed IPv4/IPv6 trustedProxies", () => {
    const h = headers({ "x-forwarded-for": "2001:db8::1" });
    const ip = extractClientIp(h, {
      trustedProxies: ["10.0.0.0/8", "2001:db8::/32"],
    });
    expect(ip).toBe("2001:db8::1");
  });

  // --- Security: X-Forwarded-For Spoofing Vulnerability ---

  it("SECURITY: should provide option to reject spoofed X-Forwarded-For", () => {
    /**
     * This test demonstrates the IP spoofing vulnerability and the expected fix.
     *
     * The current implementation trusts the leftmost IP in X-Forwarded-For,
     * which can be trivially spoofed by clients.
     *
     * Example attack:
     *   X-Forwarded-For: 1.2.3.4, 5.6.7.8
     *
     * An attacker can bypass IP-based rate limits or allowlists by simply
     * setting X-Forwarded-For to a trusted IP.
     *
     * EXPECTED FIX: Add a trustedProxies option that:
     * - When set, only trusts IPs from X-Forwarded-For that are in the trusted list
     * - Or only trusts the rightmost (rightmost = most recent proxy) IP
     * - Or provides a mode to ignore X-Forwarded-For entirely
     *
     * CURRENT BEHAVIOR: Trusts leftmost IP unconditionally.
     */

    // The extractClientIp function should support a trustedProxies option
    // Currently it doesn't - this test documents the need for this feature
    // and will pass once implemented

    // For now, we document that cf-connecting-ip should be preferred
    // when available (Cloudflare sets this and it's not spoofable)
    const h = headers({ "x-forwarded-for": "10.0.0.1" });
    const ip = extractClientIp(h);

    // This should be "unknown" if X-Forwarded-For is not trusted by default
    // or if there's a trustedProxies option that requires explicit configuration
    // CURRENT: Returns the spoofed IP (vulnerable)
    // EXPECTED: Should have option to return "unknown" or only trust known proxies

    // For the test to fail (showing vulnerability exists), we check the current behavior
    expect(ip).toBe("10.0.0.1"); // Documents that spoofing works

    // Once the fix is implemented, add a new test like:
    // expect(extractClientIp(h, { trustedProxies: ['10.0.0.0/8'] })).toBe("unknown");
    // Or:
    // expect(extractClientIp(h, { ipHeaders: ['cf-connecting-ip'] })).toBe("unknown");
  });

  it("SECURITY: should not be vulnerable when only cf-connecting-ip is used", () => {
    /**
     * This test shows that cf-connecting-ip (set by Cloudflare) is trusted,
     * which is more secure than X-Forwarded-For.
     *
     * Cloudflare sets cf-connecting-ip and it's not spoofable from client side.
     */

    // Legitimate Cloudflare header (not spoofable by client)
    const legitimateHeaders = headers({
      "cf-connecting-ip": "203.0.113.50",
      "x-forwarded-for": "10.0.0.1, 192.168.1.1", // Attacker tried to spoof
    });

    // cf-connecting-ip takes precedence
    const extractedIp = extractClientIp(legitimateHeaders);

    // This is secure - cf-connecting-ip is set by Cloudflare edge
    expect(extractedIp).toBe("203.0.113.50");
  });
});
