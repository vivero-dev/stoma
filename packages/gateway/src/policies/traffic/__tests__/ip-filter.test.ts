import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { GatewayError } from "../../../core/errors";
import type { PolicyInput } from "../../../core/protocol";
import { ipFilter } from "../ip-filter";

describe("ipFilter", () => {
  function createApp(config: Parameters<typeof ipFilter>[0]) {
    const app = new Hono();
    const policy = ipFilter(config);

    app.use("/*", async (c, next) => {
      try {
        await policy.handler(c, next);
      } catch (err) {
        if (err instanceof GatewayError) {
          return c.json(
            { error: err.code, message: err.message },
            err.statusCode as 403
          );
        }
        throw err;
      }
    });
    app.get("/test", (c) => c.json({ ok: true }));

    return app;
  }

  // --- Deny mode ---

  it("should allow requests not in deny list", async () => {
    const app = createApp({
      deny: ["10.0.0.1"],
      mode: "deny",
    });

    const res = await app.request("/test", {
      headers: { "cf-connecting-ip": "192.168.1.1" },
    });
    expect(res.status).toBe(200);
  });

  it("should block requests in deny list", async () => {
    const app = createApp({
      deny: ["10.0.0.1"],
      mode: "deny",
    });

    const res = await app.request("/test", {
      headers: { "cf-connecting-ip": "10.0.0.1" },
    });
    expect(res.status).toBe(403);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("ip_denied");
  });

  it("should block IPs matching CIDR range in deny list", async () => {
    const app = createApp({
      deny: ["10.0.0.0/8"],
      mode: "deny",
    });

    const res = await app.request("/test", {
      headers: { "cf-connecting-ip": "10.255.255.255" },
    });
    expect(res.status).toBe(403);
  });

  it("should allow IPs outside CIDR range in deny list", async () => {
    const app = createApp({
      deny: ["10.0.0.0/8"],
      mode: "deny",
    });

    const res = await app.request("/test", {
      headers: { "cf-connecting-ip": "11.0.0.1" },
    });
    expect(res.status).toBe(200);
  });

  // --- Allow mode ---

  it("should allow requests in allow list", async () => {
    const app = createApp({
      allow: ["192.168.1.0/24"],
      mode: "allow",
    });

    const res = await app.request("/test", {
      headers: { "cf-connecting-ip": "192.168.1.100" },
    });
    expect(res.status).toBe(200);
  });

  it("should block requests not in allow list", async () => {
    const app = createApp({
      allow: ["192.168.1.0/24"],
      mode: "allow",
    });

    const res = await app.request("/test", {
      headers: { "cf-connecting-ip": "10.0.0.1" },
    });
    expect(res.status).toBe(403);
  });

  // --- IP extraction ---

  it("should prefer cf-connecting-ip over x-forwarded-for", async () => {
    const app = createApp({
      deny: ["1.2.3.4"],
      mode: "deny",
    });

    const res = await app.request("/test", {
      headers: {
        "cf-connecting-ip": "1.2.3.4",
        "x-forwarded-for": "5.6.7.8",
      },
    });
    expect(res.status).toBe(403);
  });

  it("should fall back to x-forwarded-for first entry", async () => {
    const app = createApp({
      deny: ["1.2.3.4"],
      mode: "deny",
    });

    const res = await app.request("/test", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(res.status).toBe(403);
  });

  it("should use 'unknown' when no IP headers present", async () => {
    // "unknown" should not match any valid CIDR range
    const app = createApp({
      deny: ["10.0.0.0/8"],
      mode: "deny",
    });

    const res = await app.request("/test");
    expect(res.status).toBe(200);
  });

  // --- Multiple ranges ---

  it("should check against multiple CIDR ranges", async () => {
    const app = createApp({
      deny: ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"],
      mode: "deny",
    });

    // Should block 172.16.x.x
    const res1 = await app.request("/test", {
      headers: { "cf-connecting-ip": "172.20.1.1" },
    });
    expect(res1.status).toBe(403);

    // Should allow public IPs
    const res2 = await app.request("/test", {
      headers: { "cf-connecting-ip": "8.8.8.8" },
    });
    expect(res2.status).toBe(200);
  });

  // --- Edge cases ---

  it("should handle bare IP in deny list (treated as /32)", async () => {
    const app = createApp({
      deny: ["1.2.3.4"],
      mode: "deny",
    });

    const res1 = await app.request("/test", {
      headers: { "cf-connecting-ip": "1.2.3.4" },
    });
    expect(res1.status).toBe(403);

    const res2 = await app.request("/test", {
      headers: { "cf-connecting-ip": "1.2.3.5" },
    });
    expect(res2.status).toBe(200);
  });

  it("should default to deny mode", async () => {
    const app = createApp({
      deny: ["10.0.0.1"],
    });

    const res = await app.request("/test", {
      headers: { "cf-connecting-ip": "10.0.0.1" },
    });
    expect(res.status).toBe(403);
  });

  it("should have priority 1", async () => {
    const policy = ipFilter({ deny: ["10.0.0.1"] });
    expect(policy.priority).toBe(1);
  });

  it("should ignore invalid CIDR entries", async () => {
    const app = createApp({
      deny: ["not-a-cidr", "10.0.0.1"],
      mode: "deny",
    });

    // Invalid entry ignored, valid entry still works
    const res = await app.request("/test", {
      headers: { "cf-connecting-ip": "10.0.0.1" },
    });
    expect(res.status).toBe(403);
  });

  // --- IPv6 support ---

  it("should block IPv6 address in deny list", async () => {
    const app = createApp({
      deny: ["2001:db8::/32"],
      mode: "deny",
    });

    const res = await app.request("/test", {
      headers: { "cf-connecting-ip": "2001:db8::1" },
    });
    expect(res.status).toBe(403);
  });

  it("should allow IPv6 address not in deny list", async () => {
    const app = createApp({
      deny: ["2001:db8::/32"],
      mode: "deny",
    });

    const res = await app.request("/test", {
      headers: { "cf-connecting-ip": "fe80::1" },
    });
    expect(res.status).toBe(200);
  });

  it("should allow IPv6 address in allow list", async () => {
    const app = createApp({
      allow: ["2001:db8::/32"],
      mode: "allow",
    });

    const res = await app.request("/test", {
      headers: { "cf-connecting-ip": "2001:db8::1" },
    });
    expect(res.status).toBe(200);
  });

  it("should block IPv6 address not in allow list", async () => {
    const app = createApp({
      allow: ["2001:db8::/32"],
      mode: "allow",
    });

    const res = await app.request("/test", {
      headers: { "cf-connecting-ip": "fe80::1" },
    });
    expect(res.status).toBe(403);
  });

  it("should handle mixed IPv4 and IPv6 in deny list", async () => {
    const app = createApp({
      deny: ["10.0.0.0/8", "2001:db8::/32"],
      mode: "deny",
    });

    const res1 = await app.request("/test", {
      headers: { "cf-connecting-ip": "10.0.0.1" },
    });
    expect(res1.status).toBe(403);

    const res2 = await app.request("/test", {
      headers: { "cf-connecting-ip": "2001:db8::1" },
    });
    expect(res2.status).toBe(403);

    const res3 = await app.request("/test", {
      headers: { "cf-connecting-ip": "8.8.8.8" },
    });
    expect(res3.status).toBe(200);
  });

  it("should handle mixed IPv4 and IPv6 in allow list", async () => {
    const app = createApp({
      allow: ["192.168.1.0/24", "2001:db8::/32"],
      mode: "allow",
    });

    const res1 = await app.request("/test", {
      headers: { "cf-connecting-ip": "192.168.1.100" },
    });
    expect(res1.status).toBe(200);

    const res2 = await app.request("/test", {
      headers: { "cf-connecting-ip": "2001:db8::1" },
    });
    expect(res2.status).toBe(200);

    const res3 = await app.request("/test", {
      headers: { "cf-connecting-ip": "fe80::1" },
    });
    expect(res3.status).toBe(403);
  });

  // --- Policy metadata ---

  it("should declare request-headers phase", () => {
    const policy = ipFilter({ deny: ["10.0.0.1"] });
    expect(policy.phases).toEqual(["request-headers"]);
  });

  it("should expose an evaluate.onRequest function", () => {
    const policy = ipFilter({ deny: ["10.0.0.1"] });
    expect(policy.evaluate).toBeDefined();
    expect(policy.evaluate!.onRequest).toBeTypeOf("function");
    expect(policy.evaluate!.onResponse).toBeUndefined();
  });
});

// ─── Protocol-agnostic evaluate tests ─────────────────────────────────
describe("ipFilter.evaluate", () => {
  /** Build a minimal PolicyInput with the given clientIp and headers. */
  function makeInput(opts: {
    clientIp?: string;
    headers?: Record<string, string>;
  }): PolicyInput {
    return {
      phase: "request-headers",
      method: "GET",
      path: "/test",
      headers: new Headers(opts.headers ?? {}),
      clientIp: opts.clientIp,
      attributes: new Map(),
      protocol: "http",
    };
  }

  const noopCtx = {
    debug: (() => {}) as never,
    trace: (() => {}) as never,
    requestId: "test-req",
    traceId: "0".repeat(32),
    adapter: undefined,
  };

  // --- Deny mode ---

  it("should continue for IPs not in deny list", async () => {
    const policy = ipFilter({ deny: ["10.0.0.1"], mode: "deny" });
    const result = await policy.evaluate!.onRequest!(
      makeInput({ clientIp: "192.168.1.1" }),
      noopCtx
    );
    expect(result.action).toBe("continue");
  });

  it("should reject IPs in deny list", async () => {
    const policy = ipFilter({ deny: ["10.0.0.1"], mode: "deny" });
    const result = await policy.evaluate!.onRequest!(
      makeInput({ clientIp: "10.0.0.1" }),
      noopCtx
    );
    expect(result).toEqual({
      action: "reject",
      status: 403,
      code: "ip_denied",
      message: "Access denied",
    });
  });

  it("should reject IPs matching CIDR range", async () => {
    const policy = ipFilter({ deny: ["10.0.0.0/8"], mode: "deny" });
    const result = await policy.evaluate!.onRequest!(
      makeInput({ clientIp: "10.255.255.255" }),
      noopCtx
    );
    expect(result.action).toBe("reject");
  });

  // --- Allow mode ---

  it("should continue for IPs in allow list", async () => {
    const policy = ipFilter({ allow: ["192.168.1.0/24"], mode: "allow" });
    const result = await policy.evaluate!.onRequest!(
      makeInput({ clientIp: "192.168.1.100" }),
      noopCtx
    );
    expect(result.action).toBe("continue");
  });

  it("should reject IPs not in allow list", async () => {
    const policy = ipFilter({ allow: ["192.168.1.0/24"], mode: "allow" });
    const result = await policy.evaluate!.onRequest!(
      makeInput({ clientIp: "10.0.0.1" }),
      noopCtx
    );
    expect(result.action).toBe("reject");
  });

  // --- clientIp vs header fallback ---

  it("should prefer clientIp over header extraction", async () => {
    const policy = ipFilter({ deny: ["1.2.3.4"], mode: "deny" });
    // clientIp is the denied IP, but headers have a different one
    const result = await policy.evaluate!.onRequest!(
      makeInput({
        clientIp: "1.2.3.4",
        headers: { "cf-connecting-ip": "5.6.7.8" },
      }),
      noopCtx
    );
    expect(result.action).toBe("reject");
  });

  it("should fall back to header extraction when clientIp is absent", async () => {
    const policy = ipFilter({ deny: ["1.2.3.4"], mode: "deny" });
    const result = await policy.evaluate!.onRequest!(
      makeInput({ headers: { "cf-connecting-ip": "1.2.3.4" } }),
      noopCtx
    );
    expect(result.action).toBe("reject");
  });

  it("should use 'unknown' when neither clientIp nor headers are present", async () => {
    const policy = ipFilter({ deny: ["10.0.0.0/8"], mode: "deny" });
    const result = await policy.evaluate!.onRequest!(makeInput({}), noopCtx);
    expect(result.action).toBe("continue");
  });

  // --- IPv6 via evaluate ---

  it("should reject IPv6 in deny list via evaluate", async () => {
    const policy = ipFilter({ deny: ["2001:db8::/32"], mode: "deny" });
    const result = await policy.evaluate!.onRequest!(
      makeInput({ clientIp: "2001:db8::1" }),
      noopCtx
    );
    expect(result.action).toBe("reject");
  });

  it("should continue for IPv6 not in deny list via evaluate", async () => {
    const policy = ipFilter({ deny: ["2001:db8::/32"], mode: "deny" });
    const result = await policy.evaluate!.onRequest!(
      makeInput({ clientIp: "fe80::1" }),
      noopCtx
    );
    expect(result.action).toBe("continue");
  });

  it("should handle mixed ranges via evaluate", async () => {
    const policy = ipFilter({
      deny: ["10.0.0.0/8", "2001:db8::/32"],
      mode: "deny",
    });

    const r1 = await policy.evaluate!.onRequest!(
      makeInput({ clientIp: "10.0.0.1" }),
      noopCtx
    );
    expect(r1.action).toBe("reject");

    const r2 = await policy.evaluate!.onRequest!(
      makeInput({ clientIp: "2001:db8::1" }),
      noopCtx
    );
    expect(r2.action).toBe("reject");

    const r3 = await policy.evaluate!.onRequest!(
      makeInput({ clientIp: "8.8.8.8" }),
      noopCtx
    );
    expect(r3.action).toBe("continue");
  });

  // --- Parity with handler ---

  it("should produce the same decision as handler for identical inputs", async () => {
    const config = {
      deny: ["10.0.0.0/8", "172.16.0.0/12"],
      mode: "deny" as const,
    };
    const policy = ipFilter(config);

    const testIps = ["10.0.0.1", "172.20.1.1", "8.8.8.8", "192.168.1.1"];
    for (const ip of testIps) {
      // evaluate path
      const evalResult = await policy.evaluate!.onRequest!(
        makeInput({ clientIp: ip }),
        noopCtx
      );

      // handler path (via Hono app)
      const app = new Hono();
      app.use("/*", async (c, next) => {
        try {
          await policy.handler(c, next);
        } catch (err) {
          if (err instanceof GatewayError) {
            return c.json({ blocked: true }, 403);
          }
          throw err;
        }
      });
      app.get("/test", (c) => c.json({ blocked: false }));
      const res = await app.request("/test", {
        headers: { "cf-connecting-ip": ip },
      });
      const handlerBlocked = res.status === 403;

      expect(evalResult.action === "reject").toBe(handlerBlocked);
    }
  });
});
