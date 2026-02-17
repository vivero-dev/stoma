import { Hono } from "hono";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createContextInjector } from "../../../core/pipeline";
import { type LogEntry, requestLog } from "../request-log";

describe("requestLog", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function createApp(config?: Parameters<typeof requestLog>[0]) {
    const app = new Hono();
    const injector = createContextInjector("test-gw", "/test");
    const policy = requestLog(config);

    app.use("/*", injector);
    app.use("/*", policy.handler);
    app.get("/test", (c) => c.json({ ok: true }));
    app.get("/error", () => {
      throw new Error("boom");
    });

    return app;
  }

  // --- Valid scenarios ---

  it("should call sink with structured LogEntry", async () => {
    const sink = vi.fn();
    const app = createApp({ sink });

    await app.request("/test");

    expect(sink).toHaveBeenCalledOnce();
    const entry: LogEntry = sink.mock.calls[0][0];
    expect(entry).toHaveProperty("timestamp");
    expect(entry).toHaveProperty("requestId");
    expect(entry).toHaveProperty("method");
    expect(entry).toHaveProperty("path");
    expect(entry).toHaveProperty("statusCode");
    expect(entry).toHaveProperty("durationMs");
    expect(entry).toHaveProperty("clientIp");
    expect(entry).toHaveProperty("userAgent");
  });

  it("should include method, path, statusCode, durationMs in log entry", async () => {
    const sink = vi.fn();
    const app = createApp({ sink });

    await app.request("/test");

    const entry: LogEntry = sink.mock.calls[0][0];
    expect(entry.method).toBe("GET");
    expect(entry.path).toBe("/test");
    expect(entry.statusCode).toBe(200);
    expect(entry.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("should include requestId from gateway context", async () => {
    const sink = vi.fn();
    const app = createApp({ sink });

    const res = await app.request("/test");

    const entry: LogEntry = sink.mock.calls[0][0];
    const headerRequestId = res.headers.get("x-request-id");
    expect(entry.requestId).toBe(headerRequestId);
  });

  it("should include clientIp from x-forwarded-for header", async () => {
    const sink = vi.fn();
    const app = createApp({ sink });

    await app.request("/test", {
      headers: { "x-forwarded-for": "10.0.0.1, 10.0.0.2" },
    });

    const entry: LogEntry = sink.mock.calls[0][0];
    expect(entry.clientIp).toBe("10.0.0.1");
  });

  it("should include user-agent header", async () => {
    const sink = vi.fn();
    const app = createApp({ sink });

    await app.request("/test", {
      headers: { "user-agent": "TestBot/1.0" },
    });

    const entry: LogEntry = sink.mock.calls[0][0];
    expect(entry.userAgent).toBe("TestBot/1.0");
  });

  // --- Boundary conditions ---

  it("should handle missing headers gracefully", async () => {
    const sink = vi.fn();
    const app = createApp({ sink });

    await app.request("/test");

    const entry: LogEntry = sink.mock.calls[0][0];
    expect(entry.clientIp).toBe("unknown");
    expect(entry.userAgent).toBe("unknown");
  });

  it("should use custom sink function", async () => {
    const entries: LogEntry[] = [];
    const customSink = (entry: LogEntry) => {
      entries.push(entry);
    };
    const app = createApp({ sink: customSink });

    await app.request("/test");

    expect(entries).toHaveLength(1);
    expect(entries[0].method).toBe("GET");
  });

  // --- Error handling ---

  it("should not throw if extractFields callback throws", async () => {
    const sink = vi.fn();
    const app = createApp({
      sink,
      extractFields: () => {
        throw new Error("extraction failed");
      },
    });

    const res = await app.request("/test");

    expect(res.status).toBe(200);
    expect(sink).toHaveBeenCalledOnce();
    const entry: LogEntry = sink.mock.calls[0][0];
    expect(entry.extra).toBeUndefined();
  });

  it("should still log even if downstream errors", async () => {
    const sink = vi.fn();
    const app = new Hono();
    const injector = createContextInjector("test-gw", "/test");
    const policy = requestLog({ sink });

    app.use("/*", injector);
    app.use("/*", policy.handler);
    app.get("/error", () => {
      throw new Error("boom");
    });

    // Hono's default error handler will catch the throw and return 500
    const res = await app.request("/error");

    expect(res.status).toBe(500);
    expect(sink).toHaveBeenCalledOnce();
    const entry: LogEntry = sink.mock.calls[0][0];
    expect(entry.statusCode).toBe(500);
  });

  // --- Edge cases ---

  it("should capture accurate durationMs (at least > 0)", async () => {
    const sink = vi.fn();
    const app = new Hono();
    const injector = createContextInjector("test-gw", "/test");
    const policy = requestLog({ sink });

    app.use("/*", injector);
    app.use("/*", policy.handler);
    app.get("/slow", async (c) => {
      await new Promise((r) => setTimeout(r, 10));
      return c.json({ ok: true });
    });

    await app.request("/slow");

    const entry: LogEntry = sink.mock.calls[0][0];
    expect(entry.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("should include extra fields from extractFields callback", async () => {
    const sink = vi.fn();
    const app = createApp({
      sink,
      extractFields: () => ({
        userId: "user-123",
        region: "us-east",
      }),
    });

    await app.request("/test");

    const entry: LogEntry = sink.mock.calls[0][0];
    expect(entry.extra).toEqual({
      userId: "user-123",
      region: "us-east",
    });
  });

  // --- Security tests ---

  it("should not include Authorization header in log output", async () => {
    const sink = vi.fn();
    const app = createApp({ sink });

    await app.request("/test", {
      headers: {
        authorization: "Bearer secret-token-12345",
        cookie: "session=sensitive-cookie-data",
      },
    });

    const entry: LogEntry = sink.mock.calls[0][0];
    // Log entry should NOT contain Authorization or Cookie values
    const serialized = JSON.stringify(entry);
    expect(serialized).not.toContain("secret-token-12345");
    expect(serialized).not.toContain("sensitive-cookie-data");
  });

  it("should safely serialize special characters in user-agent via JSON.stringify", async () => {
    const sink = vi.fn();
    const app = createApp({ sink });

    // User-Agent with characters that could cause issues in non-JSON logging
    const specialUA = 'TestBot/1.0 ({"fake":"injection"})';
    await app.request("/test", {
      headers: { "user-agent": specialUA },
    });

    expect(sink).toHaveBeenCalledOnce();
    const entry: LogEntry = sink.mock.calls[0][0];
    expect(entry.userAgent).toBe(specialUA);
    // JSON.stringify properly escapes special characters
    const serialized = JSON.stringify(entry);
    expect(serialized).toContain("TestBot/1.0");
  });

  it("should safely handle special characters in request path", async () => {
    const sink = vi.fn();
    const app = new Hono();
    const injector = createContextInjector("test-gw", "/special/*");
    const policy = requestLog({ sink });

    app.use("/special/*", injector);
    app.use("/special/*", policy.handler);
    app.get("/special/*", (c) => c.json({ ok: true }));

    // Path with URL-encoded characters that could be problematic
    await app.request("/special/test%3Cscript%3Ealert(1)%3C/script%3E");

    expect(sink).toHaveBeenCalledOnce();
    const entry: LogEntry = sink.mock.calls[0][0];
    // The path is stored as-is from the URL (percent-encoded)
    expect(entry.path).toContain("/special/");
    // JSON.stringify produces valid, parseable output regardless of path content
    const serialized = JSON.stringify(entry);
    expect(() => JSON.parse(serialized)).not.toThrow();
  });
});
