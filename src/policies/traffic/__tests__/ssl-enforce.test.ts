import { describe, expect, it } from "vitest";
import { createPolicyTestHarness } from "../../sdk";
import { sslEnforce } from "../ssl-enforce";

describe("sslEnforce", () => {
  it("should redirect HTTP to HTTPS with 301", async () => {
    const { request } = createPolicyTestHarness(sslEnforce());
    const res = await request("http://example.com/test");
    expect(res.status).toBe(301);
    const location = res.headers.get("location");
    expect(location).toBe("https://example.com/test");
  });

  it("should preserve path and query on redirect", async () => {
    const { request } = createPolicyTestHarness(sslEnforce());
    const res = await request("http://example.com/api/users?page=2");
    expect(res.status).toBe(301);
    expect(res.headers.get("location")).toBe(
      "https://example.com/api/users?page=2"
    );
  });

  it("should block HTTP with 403 when redirect=false", async () => {
    const { request } = createPolicyTestHarness(
      sslEnforce({ redirect: false })
    );
    const res = await request("http://example.com/test");
    expect(res.status).toBe(403);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("ssl_required");
  });

  it("should pass HTTPS requests through", async () => {
    const { request } = createPolicyTestHarness(sslEnforce());
    const res = await request("https://example.com/test");
    expect(res.status).toBe(200);
  });

  it("should set HSTS header on HTTPS responses", async () => {
    const { request } = createPolicyTestHarness(sslEnforce());
    const res = await request("https://example.com/test");
    expect(res.headers.get("strict-transport-security")).toBe(
      "max-age=31536000"
    );
  });

  it("should include includeSubDomains in HSTS when configured", async () => {
    const { request } = createPolicyTestHarness(
      sslEnforce({ includeSubDomains: true })
    );
    const res = await request("https://example.com/test");
    expect(res.headers.get("strict-transport-security")).toBe(
      "max-age=31536000; includeSubDomains"
    );
  });

  it("should include preload in HSTS when configured", async () => {
    const { request } = createPolicyTestHarness(sslEnforce({ preload: true }));
    const res = await request("https://example.com/test");
    expect(res.headers.get("strict-transport-security")).toBe(
      "max-age=31536000; preload"
    );
  });

  it("should include both includeSubDomains and preload", async () => {
    const { request } = createPolicyTestHarness(
      sslEnforce({ includeSubDomains: true, preload: true })
    );
    const res = await request("https://example.com/test");
    expect(res.headers.get("strict-transport-security")).toBe(
      "max-age=31536000; includeSubDomains; preload"
    );
  });

  it("should respect x-forwarded-proto header", async () => {
    const { request } = createPolicyTestHarness(sslEnforce());
    // URL is http but x-forwarded-proto says https (common behind a load balancer)
    const res = await request("http://example.com/test", {
      headers: { "x-forwarded-proto": "https" },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("strict-transport-security")).toBe(
      "max-age=31536000"
    );
  });

  it("should use custom hstsMaxAge", async () => {
    const { request } = createPolicyTestHarness(
      sslEnforce({ hstsMaxAge: 86400 })
    );
    const res = await request("https://example.com/test");
    expect(res.headers.get("strict-transport-security")).toBe("max-age=86400");
  });

  it("should support skip logic", async () => {
    const { request } = createPolicyTestHarness(
      sslEnforce({ skip: () => true })
    );
    const res = await request("http://example.com/test");
    // Should pass through without redirect because skip is true
    expect(res.status).toBe(200);
  });

  it("should have priority EARLY (5)", () => {
    const policy = sslEnforce();
    expect(policy.priority).toBe(5);
    expect(policy.name).toBe("ssl-enforce");
  });
});
