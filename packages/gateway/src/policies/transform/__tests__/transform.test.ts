import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { requestTransform, responseTransform } from "../transform";

describe("requestTransform", () => {
  function createApp(config: Parameters<typeof requestTransform>[0]) {
    const app = new Hono();
    const policy = requestTransform(config);

    app.use("/*", policy.handler);

    app.get("/test", (c) => {
      // Echo back all request headers for inspection
      const headers: Record<string, string> = {};
      c.req.raw.headers.forEach((value, key) => {
        headers[key] = value;
      });
      return c.json({ headers });
    });

    return app;
  }

  // --- Set headers ---

  it("should add headers to the request", async () => {
    const app = createApp({
      setHeaders: { "x-custom": "value", "x-another": "test" },
    });

    const res = await app.request("/test");
    const body = (await res.json()) as { headers: Record<string, string> };
    expect(body.headers["x-custom"]).toBe("value");
    expect(body.headers["x-another"]).toBe("test");
  });

  it("should overwrite existing request headers", async () => {
    const app = createApp({
      setHeaders: { "x-existing": "new-value" },
    });

    const res = await app.request("/test", {
      headers: { "x-existing": "old-value" },
    });
    const body = (await res.json()) as { headers: Record<string, string> };
    expect(body.headers["x-existing"]).toBe("new-value");
  });

  // --- Remove headers ---

  it("should remove specified request headers", async () => {
    const app = createApp({
      removeHeaders: ["x-remove-me"],
    });

    const res = await app.request("/test", {
      headers: { "x-remove-me": "gone", "x-keep": "stay" },
    });
    const body = (await res.json()) as { headers: Record<string, string> };
    expect(body.headers["x-remove-me"]).toBeUndefined();
    expect(body.headers["x-keep"]).toBe("stay");
  });

  // --- Rename headers ---

  it("should rename request headers", async () => {
    const app = createApp({
      renameHeaders: { "x-old-name": "x-new-name" },
    });

    const res = await app.request("/test", {
      headers: { "x-old-name": "the-value" },
    });
    const body = (await res.json()) as { headers: Record<string, string> };
    expect(body.headers["x-old-name"]).toBeUndefined();
    expect(body.headers["x-new-name"]).toBe("the-value");
  });

  it("should skip rename when source header does not exist", async () => {
    const app = createApp({
      renameHeaders: { "x-nonexistent": "x-new" },
    });

    const res = await app.request("/test");
    const body = (await res.json()) as { headers: Record<string, string> };
    expect(body.headers["x-new"]).toBeUndefined();
  });

  // --- Metadata ---

  it("should have priority 50", async () => {
    const policy = requestTransform({ setHeaders: {} });
    expect(policy.priority).toBe(50);
    expect(policy.name).toBe("request-transform");
  });
});

describe("responseTransform", () => {
  function createApp(config: Parameters<typeof responseTransform>[0]) {
    const app = new Hono();
    const policy = responseTransform(config);

    app.use("/*", policy.handler);

    app.get("/test", (c) => {
      // Set some initial response headers for testing
      c.res.headers.set("x-original", "original-value");
      return c.json({ ok: true });
    });

    return app;
  }

  // --- Set headers ---

  it("should add headers to the response", async () => {
    const app = createApp({
      setHeaders: { "x-powered-by": "edge-gateway" },
    });

    const res = await app.request("/test");
    expect(res.headers.get("x-powered-by")).toBe("edge-gateway");
  });

  // --- Remove headers ---

  it("should remove specified response headers", async () => {
    const app = createApp({
      removeHeaders: ["x-original"],
    });

    const res = await app.request("/test");
    expect(res.headers.get("x-original")).toBeNull();
  });

  // --- Rename headers ---

  it("should rename response headers", async () => {
    const app = createApp({
      renameHeaders: { "x-original": "x-renamed" },
    });

    const res = await app.request("/test");
    expect(res.headers.get("x-original")).toBeNull();
    expect(res.headers.get("x-renamed")).toBe("original-value");
  });

  // --- Combined operations ---

  it("should apply rename, set, and remove in correct order", async () => {
    const app = createApp({
      renameHeaders: { "x-original": "x-renamed" },
      setHeaders: { "x-added": "new" },
      removeHeaders: ["x-renamed"],
    });

    const res = await app.request("/test");
    // Rename happens first, then set, then remove
    expect(res.headers.get("x-original")).toBeNull();
    expect(res.headers.get("x-renamed")).toBeNull(); // renamed then removed
    expect(res.headers.get("x-added")).toBe("new");
  });

  // --- Metadata ---

  it("should have priority 92", async () => {
    const policy = responseTransform({ setHeaders: {} });
    expect(policy.priority).toBe(92);
    expect(policy.name).toBe("response-transform");
  });
});
