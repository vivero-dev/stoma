import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { proxy } from "../proxy";

describe("proxy", () => {
  function createApp(
    config?: Parameters<typeof proxy>[0],
    downstreamHandler?: (c: {
      req: { raw: Request };
      json: (data: unknown) => Response;
    }) => Response
  ) {
    const app = new Hono();
    const policy = proxy(config);

    app.use("/*", policy.handler);
    app.get("/test", (c) => {
      if (downstreamHandler) {
        return downstreamHandler(c as never);
      }
      return c.json({ ok: true });
    });

    return app;
  }

  // --- Valid scenarios ---

  it("should strip configured headers from request", async () => {
    let capturedHeaders: Headers | undefined;

    const app = new Hono();
    const policy = proxy({ stripHeaders: ["x-secret", "x-internal"] });

    app.use("/*", policy.handler);
    app.get("/test", (c) => {
      capturedHeaders = c.req.raw.headers;
      return c.json({ ok: true });
    });

    await app.request("/test", {
      headers: {
        "x-secret": "secret-value",
        "x-internal": "internal-value",
        "x-keep": "keep-value",
      },
    });

    expect(capturedHeaders!.get("x-secret")).toBeNull();
    expect(capturedHeaders!.get("x-internal")).toBeNull();
    expect(capturedHeaders!.get("x-keep")).toBe("keep-value");
  });

  it("should add configured headers to request", async () => {
    let capturedHeaders: Headers | undefined;

    const app = new Hono();
    const policy = proxy({
      headers: {
        "x-api-key": "my-key",
        "x-custom": "custom-value",
      },
    });

    app.use("/*", policy.handler);
    app.get("/test", (c) => {
      capturedHeaders = c.req.raw.headers;
      return c.json({ ok: true });
    });

    await app.request("/test");

    expect(capturedHeaders!.get("x-api-key")).toBe("my-key");
    expect(capturedHeaders!.get("x-custom")).toBe("custom-value");
  });

  it("should pass through to downstream handler", async () => {
    const app = createApp();

    const res = await app.request("/test");

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });

  // --- Boundary conditions ---

  it("should work with no config (default behavior)", async () => {
    const app = createApp();

    const res = await app.request("/test");

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });

  it("should handle empty stripHeaders array", async () => {
    let capturedHeaders: Headers | undefined;

    const app = new Hono();
    const policy = proxy({ stripHeaders: [] });

    app.use("/*", policy.handler);
    app.get("/test", (c) => {
      capturedHeaders = c.req.raw.headers;
      return c.json({ ok: true });
    });

    await app.request("/test", {
      headers: { "x-keep": "value" },
    });

    expect(capturedHeaders!.get("x-keep")).toBe("value");
  });

  it("should handle empty headers object", async () => {
    const app = createApp({ headers: {} });

    const res = await app.request("/test");

    expect(res.status).toBe(200);
  });

  // --- Error handling ---

  it("should handle missing headers gracefully", async () => {
    let capturedHeaders: Headers | undefined;

    const app = new Hono();
    const policy = proxy({
      stripHeaders: ["x-nonexistent"],
      headers: { "x-added": "value" },
    });

    app.use("/*", policy.handler);
    app.get("/test", (c) => {
      capturedHeaders = c.req.raw.headers;
      return c.json({ ok: true });
    });

    const res = await app.request("/test");

    expect(res.status).toBe(200);
    expect(capturedHeaders!.get("x-nonexistent")).toBeNull();
    expect(capturedHeaders!.get("x-added")).toBe("value");
  });

  // --- Security tests ---

  it("should strip sensitive headers when configured", async () => {
    let capturedHeaders: Headers | undefined;

    const app = new Hono();
    const policy = proxy({
      stripHeaders: ["authorization", "cookie", "x-internal-token"],
    });

    app.use("/*", policy.handler);
    app.get("/test", (c) => {
      capturedHeaders = c.req.raw.headers;
      return c.json({ ok: true });
    });

    await app.request("/test", {
      headers: {
        authorization: "Bearer secret-token",
        cookie: "session=abc123",
        "x-internal-token": "internal-only",
        "x-safe-header": "keep-me",
      },
    });

    // Sensitive headers should be stripped
    expect(capturedHeaders!.get("authorization")).toBeNull();
    expect(capturedHeaders!.get("cookie")).toBeNull();
    expect(capturedHeaders!.get("x-internal-token")).toBeNull();
    // Non-sensitive headers should be preserved
    expect(capturedHeaders!.get("x-safe-header")).toBe("keep-me");
  });

  it("should apply header additions AFTER stripping (order matters for security)", async () => {
    let capturedHeaders: Headers | undefined;

    const app = new Hono();
    const policy = proxy({
      stripHeaders: ["authorization"],
      headers: { authorization: "Bearer gateway-service-token" },
    });

    app.use("/*", policy.handler);
    app.get("/test", (c) => {
      capturedHeaders = c.req.raw.headers;
      return c.json({ ok: true });
    });

    await app.request("/test", {
      headers: { authorization: "Bearer user-spoofed-token" },
    });

    // The user's token should be stripped AND replaced with the gateway token
    expect(capturedHeaders!.get("authorization")).toBe(
      "Bearer gateway-service-token"
    );
  });
});
