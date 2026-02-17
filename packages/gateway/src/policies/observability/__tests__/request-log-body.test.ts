import { Hono } from "hono";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createContextInjector } from "../../../core/pipeline";
import { type LogEntry, requestLog } from "../request-log";

describe("requestLog - body logging", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function createApp(config?: Parameters<typeof requestLog>[0]) {
    const app = new Hono();
    const injector = createContextInjector("test-gw", "/test");
    const policy = requestLog(config);

    app.use("/*", injector);
    app.use("/*", policy.handler);
    app.get("/test", (c) => c.json({ ok: true, data: "hello" }));
    app.post("/echo", async (c) => {
      const body = await c.req.json();
      return c.json({ received: body });
    });
    app.post("/text", async (c) => {
      const body = await c.req.text();
      return c.text(`echo: ${body}`);
    });

    return app;
  }

  // --- Request body logging ---

  it("should not log request body by default", async () => {
    const sink = vi.fn();
    const app = createApp({ sink });

    await app.request("/echo", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: "alice" }),
    });

    const entry: LogEntry = sink.mock.calls[0][0];
    expect(entry.requestBody).toBeUndefined();
  });

  it("should log JSON request body when logRequestBody is true", async () => {
    const sink = vi.fn();
    const app = createApp({ sink, logRequestBody: true });

    await app.request("/echo", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: "alice" }),
    });

    const entry: LogEntry = sink.mock.calls[0][0];
    expect(entry.requestBody).toEqual({ username: "alice" });
  });

  it("should log non-JSON request body as text", async () => {
    const sink = vi.fn();
    const app = createApp({ sink, logRequestBody: true });

    await app.request("/text", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: "hello world",
    });

    const entry: LogEntry = sink.mock.calls[0][0];
    expect(entry.requestBody).toBe("hello world");
  });

  it("should redact fields in request body", async () => {
    const sink = vi.fn();
    const app = createApp({
      sink,
      logRequestBody: true,
      redactPaths: ["password"],
    });

    await app.request("/echo", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: "alice", password: "secret123" }),
    });

    const entry: LogEntry = sink.mock.calls[0][0];
    expect(entry.requestBody).toEqual({
      username: "alice",
      password: "[REDACTED]",
    });
  });

  // --- Response body logging ---

  it("should not log response body by default", async () => {
    const sink = vi.fn();
    const app = createApp({ sink });

    await app.request("/test");

    const entry: LogEntry = sink.mock.calls[0][0];
    expect(entry.responseBody).toBeUndefined();
  });

  it("should log JSON response body when logResponseBody is true", async () => {
    const sink = vi.fn();
    const app = createApp({ sink, logResponseBody: true });

    await app.request("/test");

    const entry: LogEntry = sink.mock.calls[0][0];
    expect(entry.responseBody).toEqual({ ok: true, data: "hello" });
  });

  it("should redact fields in response body", async () => {
    const sink = vi.fn();
    const app = new Hono();
    const injector = createContextInjector("test-gw", "/test");
    const policy = requestLog({
      sink,
      logResponseBody: true,
      redactPaths: ["token"],
    });

    app.use("/*", injector);
    app.use("/*", policy.handler);
    app.get("/test", (c) => c.json({ user: "alice", token: "secret-jwt" }));

    await app.request("/test");

    const entry: LogEntry = sink.mock.calls[0][0];
    expect(entry.responseBody).toEqual({
      user: "alice",
      token: "[REDACTED]",
    });
  });

  // --- Truncation ---

  it("should truncate request body exceeding maxBodyLength", async () => {
    const sink = vi.fn();
    const app = createApp({
      sink,
      logRequestBody: true,
      maxBodyLength: 20,
    });

    await app.request("/text", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: "a".repeat(100),
    });

    const entry: LogEntry = sink.mock.calls[0][0];
    expect(typeof entry.requestBody).toBe("string");
    expect((entry.requestBody as string).length).toBeLessThan(100);
    expect(entry.requestBody as string).toContain("...[truncated]");
  });

  // --- Both request and response ---

  it("should log both request and response bodies simultaneously", async () => {
    const sink = vi.fn();
    const app = createApp({
      sink,
      logRequestBody: true,
      logResponseBody: true,
    });

    await app.request("/echo", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ input: "data" }),
    });

    const entry: LogEntry = sink.mock.calls[0][0];
    expect(entry.requestBody).toEqual({ input: "data" });
    expect(entry.responseBody).toBeDefined();
  });

  // --- Safety: never breaks pipeline ---

  it("should not break the request pipeline if body capture fails", async () => {
    const sink = vi.fn();
    const app = new Hono();
    const injector = createContextInjector("test-gw", "/test");
    const policy = requestLog({
      sink,
      logRequestBody: true,
      logResponseBody: true,
    });

    app.use("/*", injector);
    app.use("/*", policy.handler);
    app.get("/test", (c) => c.json({ ok: true }));

    // GET requests typically have no body - should handle gracefully
    const res = await app.request("/test");

    expect(res.status).toBe(200);
    expect(sink).toHaveBeenCalledOnce();
  });
});
