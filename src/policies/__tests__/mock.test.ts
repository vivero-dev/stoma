import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";
import { mock } from "../mock";

describe("mock", () => {
  function createApp(config?: Parameters<typeof mock>[0]) {
    const app = new Hono();
    const policy = mock(config);

    // The mock policy returns a Response directly (doesn't call next)
    app.get("/test", policy.handler);

    return app;
  }

  // --- Valid scenarios ---

  it("should return 200 with no body by default", async () => {
    const app = createApp();

    const res = await app.request("/test");

    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toBe("");
  });

  it("should return configured status code", async () => {
    const app = createApp({ status: 201 });

    const res = await app.request("/test");

    expect(res.status).toBe(201);
  });

  it("should return string body", async () => {
    const app = createApp({ body: "Hello, world!" });

    const res = await app.request("/test");

    expect(res.status).toBe(200);
    expect(await res.text()).toBe("Hello, world!");
  });

  it("should return JSON-serialized object body with content-type header", async () => {
    const app = createApp({
      body: { message: "test", data: [1, 2, 3] },
    });

    const res = await app.request("/test");

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/json");
    expect(await res.json()).toEqual({ message: "test", data: [1, 2, 3] });
  });

  it("should include custom headers", async () => {
    const app = createApp({
      headers: {
        "x-custom-header": "custom-value",
        "x-another": "another-value",
      },
    });

    const res = await app.request("/test");

    expect(res.headers.get("x-custom-header")).toBe("custom-value");
    expect(res.headers.get("x-another")).toBe("another-value");
  });

  // --- Boundary conditions ---

  it("should return empty body when body is undefined", async () => {
    const app = createApp({ status: 200 });

    const res = await app.request("/test");

    const text = await res.text();
    expect(text).toBe("");
  });

  it("should handle status code 204 (no content)", async () => {
    const app = createApp({ status: 204 });

    const res = await app.request("/test");

    expect(res.status).toBe(204);
  });

  // --- Edge cases ---

  it("should add artificial delay when delayMs configured", async () => {
    const app = createApp({ delayMs: 50, body: "delayed" });

    const start = Date.now();
    const res = await app.request("/test");
    const elapsed = Date.now() - start;

    expect(res.status).toBe(200);
    expect(await res.text()).toBe("delayed");
    expect(elapsed).toBeGreaterThanOrEqual(40); // Small tolerance
  });

  it("should not call next() (mock replaces upstream)", async () => {
    const app = new Hono();
    const policy = mock({ body: "mocked" });
    const downstreamHandler = vi.fn();

    // Mount mock as middleware, then a downstream handler
    app.use("/test", policy.handler);
    app.get("/test", (c) => {
      downstreamHandler();
      return c.json({ downstream: true });
    });

    const res = await app.request("/test");

    expect(await res.text()).toBe("mocked");
    expect(downstreamHandler).not.toHaveBeenCalled();
  });
});
