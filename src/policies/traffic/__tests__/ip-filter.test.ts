import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { GatewayError } from "../../../core/errors";
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
});
