import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { cors } from "../cors";

describe("cors", () => {
  function createApp(config?: Parameters<typeof cors>[0]) {
    const app = new Hono();
    const policy = cors(config);

    app.use("/*", policy.handler);
    app.get("/test", (c) => c.json({ ok: true }));

    return app;
  }

  // --- Valid scenarios ---

  it("should set Access-Control-Allow-Origin header", async () => {
    const app = createApp({ origins: "https://example.com" });

    const res = await app.request("/test", {
      headers: { origin: "https://example.com" },
    });

    expect(res.headers.get("access-control-allow-origin")).toBe(
      "https://example.com"
    );
  });

  it("should handle preflight OPTIONS request with correct headers", async () => {
    const app = createApp({
      origins: "https://example.com",
      methods: ["GET", "POST"],
      allowHeaders: ["Content-Type", "Authorization"],
    });

    const res = await app.request("/test", {
      method: "OPTIONS",
      headers: {
        origin: "https://example.com",
        "access-control-request-method": "POST",
        "access-control-request-headers": "Content-Type",
      },
    });

    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe(
      "https://example.com"
    );
    expect(res.headers.get("access-control-allow-methods")).toContain("GET");
    expect(res.headers.get("access-control-allow-methods")).toContain("POST");
  });

  it("should allow configured methods", async () => {
    const app = createApp({
      origins: "*",
      methods: ["GET", "POST", "PUT"],
    });

    const res = await app.request("/test", {
      method: "OPTIONS",
      headers: {
        origin: "https://example.com",
        "access-control-request-method": "PUT",
      },
    });

    const allowedMethods = res.headers.get("access-control-allow-methods");
    expect(allowedMethods).toContain("GET");
    expect(allowedMethods).toContain("POST");
    expect(allowedMethods).toContain("PUT");
  });

  // --- Boundary conditions ---

  it('should use "*" origin by default when no config provided', async () => {
    const app = createApp();

    const res = await app.request("/test", {
      headers: { origin: "https://anything.com" },
    });

    expect(res.headers.get("access-control-allow-origin")).toBe("*");
  });

  it("should handle array of origins", async () => {
    const app = createApp({
      origins: ["https://a.com", "https://b.com"],
    });

    const res1 = await app.request("/test", {
      headers: { origin: "https://a.com" },
    });
    expect(res1.headers.get("access-control-allow-origin")).toBe(
      "https://a.com"
    );

    const res2 = await app.request("/test", {
      headers: { origin: "https://b.com" },
    });
    expect(res2.headers.get("access-control-allow-origin")).toBe(
      "https://b.com"
    );
  });

  // --- Error handling ---

  it("should reject disallowed origins when origin function returns false", async () => {
    const app = createApp({
      origins: (origin) => origin === "https://allowed.com",
    });

    const resAllowed = await app.request("/test", {
      headers: { origin: "https://allowed.com" },
    });
    expect(resAllowed.headers.get("access-control-allow-origin")).toBe(
      "https://allowed.com"
    );

    const resDisallowed = await app.request("/test", {
      headers: { origin: "https://disallowed.com" },
    });
    // When origin function returns false, Hono's cors omits the header entirely
    const disallowedOrigin = resDisallowed.headers.get(
      "access-control-allow-origin"
    );
    expect(disallowedOrigin).toBeNull();
  });

  // --- Security tests ---

  it("should not reflect 'null' origin when using an origin function", async () => {
    // The 'null' origin is sent by sandboxed iframes, data: URIs, etc.
    // A misconfigured origin function might accidentally allow it.
    const app = createApp({
      origins: (origin) => origin.endsWith(".example.com"),
    });

    const res = await app.request("/test", {
      headers: { origin: "null" },
    });

    // "null" does not end with ".example.com", so it should be rejected
    const allowedOrigin = res.headers.get("access-control-allow-origin");
    expect(allowedOrigin).toBeNull();
  });

  it("should not reflect attacker origin via substring match vulnerability", async () => {
    // Test that origin validation doesn't use naive substring matching
    // "https://evil-example.com" contains "example.com" but is a different domain
    const app = createApp({
      origins: (origin) => origin === "https://example.com",
    });

    const res = await app.request("/test", {
      headers: { origin: "https://evil-example.com" },
    });

    const allowedOrigin = res.headers.get("access-control-allow-origin");
    expect(allowedOrigin).toBeNull();
  });

  it("should not reflect origin when using array of allowed origins and attacker origin is a prefix", async () => {
    const app = createApp({
      origins: ["https://app.example.com", "https://admin.example.com"],
    });

    const res = await app.request("/test", {
      headers: { origin: "https://evil.app.example.com" },
    });

    // Hono's cors should do exact matching for array origins
    const allowedOrigin = res.headers.get("access-control-allow-origin");
    expect(allowedOrigin).toBeNull();
  });

  it("should handle missing Origin header gracefully", async () => {
    const app = createApp({
      origins: "https://example.com",
    });

    // Request without Origin header (e.g., same-origin request)
    const res = await app.request("/test");

    expect(res.status).toBe(200);
    // No CORS headers should be set without an Origin header
    const allowedOrigin = res.headers.get("access-control-allow-origin");
    expect(allowedOrigin).toBeNull();
  });
});
