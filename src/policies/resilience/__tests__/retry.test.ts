import { Hono } from "hono";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createGateway } from "../../../core/gateway";
import { retry } from "../retry";

describe("retry", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  /**
   * Creates a gateway with a URL upstream and retry policy.
   * The URL upstream stores `_proxyRequest` on the context, which the
   * retry policy uses to re-issue failed requests directly via fetch().
   */
  function createApp(config?: Parameters<typeof retry>[0]) {
    const gw = createGateway({
      routes: [
        {
          path: "/test",
          methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
          pipeline: {
            policies: [retry(config)],
            upstream: {
              type: "url",
              target: "https://upstream.example.com",
            },
          },
        },
      ],
    });
    return gw.app;
  }

  function mockFetchResponses(
    responses: Array<{ status: number; body?: Record<string, unknown> }>
  ) {
    let callCount = 0;
    const mock = vi.fn(async () => {
      const idx = Math.min(callCount, responses.length - 1);
      callCount++;
      const resp = responses[idx];
      return new Response(JSON.stringify(resp.body ?? {}), {
        status: resp.status,
      });
    }) as unknown as typeof fetch;

    globalThis.fetch = mock;
    return { mock, getCallCount: () => callCount };
  }

  // --- Pass-through for handler-based upstreams ---

  it("should pass through when upstream is a handler (no _proxyRequest)", async () => {
    const gw = createGateway({
      routes: [
        {
          path: "/test",
          methods: ["GET"],
          pipeline: {
            policies: [retry({ maxRetries: 3, baseDelayMs: 0 })],
            upstream: { type: "handler", handler: (c) => c.json({ ok: true }) },
          },
        },
      ],
    });

    const res = await gw.app.request("/test");
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toEqual({ ok: true });
    expect(res.headers.get("x-retry-count")).toBeNull();
  });

  // --- Retry on retryable status ---

  it("should retry on retryable status and eventually succeed", async () => {
    const app = createApp({ maxRetries: 3, baseDelayMs: 1 });
    const { mock } = mockFetchResponses([
      { status: 503 },
      { status: 503 },
      { status: 200, body: { ok: true } },
    ]);

    const res = await app.request("/test");
    expect(res.status).toBe(200);
    // 1 original call by the upstream + 2 retry calls by the retry policy = 3
    expect(mock).toHaveBeenCalledTimes(3);
    expect(res.headers.get("x-retry-count")).toBe("2");
  });

  // --- Exhaust all retries ---

  it("should return last response after exhausting retries", async () => {
    const app = createApp({ maxRetries: 2, baseDelayMs: 1 });
    const { mock } = mockFetchResponses([
      { status: 502 },
      { status: 503 },
      { status: 504 },
    ]);

    const res = await app.request("/test");
    expect(res.status).toBe(504);
    expect(mock).toHaveBeenCalledTimes(3); // 1 original + 2 retries
    expect(res.headers.get("x-retry-count")).toBe("2");
  });

  // --- Non-idempotent method skips retry ---

  it("should not retry non-idempotent methods by default", async () => {
    const app = createApp({ maxRetries: 3, baseDelayMs: 0 });
    const { mock } = mockFetchResponses([{ status: 503 }]);

    const res = await app.request("/test", { method: "POST" });
    expect(res.status).toBe(503);
    expect(mock).toHaveBeenCalledTimes(1);
    expect(res.headers.get("x-retry-count")).toBeNull();
  });

  // --- POST retry when explicitly included ---

  it("should retry POST when explicitly included in retryMethods", async () => {
    const app = createApp({
      maxRetries: 1,
      baseDelayMs: 1,
      retryMethods: ["POST"],
    });
    const { mock } = mockFetchResponses([
      { status: 503 },
      { status: 200, body: { ok: true } },
    ]);

    const res = await app.request("/test", { method: "POST" });
    expect(res.status).toBe(200);
    expect(mock).toHaveBeenCalledTimes(2);
  });

  // --- Custom retryOn status codes ---

  it("should retry on custom status codes", async () => {
    const app = createApp({
      maxRetries: 1,
      retryOn: [418],
      baseDelayMs: 1,
    });
    const { mock } = mockFetchResponses([
      { status: 418 },
      { status: 200, body: { ok: true } },
    ]);

    const res = await app.request("/test");
    expect(res.status).toBe(200);
    expect(mock).toHaveBeenCalledTimes(2);
  });

  it("should not retry on status codes not in retryOn list", async () => {
    const app = createApp({
      maxRetries: 3,
      retryOn: [502],
      baseDelayMs: 1,
    });
    const { mock } = mockFetchResponses([{ status: 500 }]);

    const res = await app.request("/test");
    expect(res.status).toBe(500);
    expect(mock).toHaveBeenCalledTimes(1);
    expect(res.headers.get("x-retry-count")).toBeNull();
  });

  // --- x-retry-count header ---

  it("should set x-retry-count header after retries", async () => {
    const app = createApp({ maxRetries: 3, baseDelayMs: 1 });
    mockFetchResponses([{ status: 503 }, { status: 200, body: { ok: true } }]);

    const res = await app.request("/test");
    expect(res.headers.get("x-retry-count")).toBe("1");
  });

  it("should not set x-retry-count header when no retries occurred", async () => {
    const app = createApp({ maxRetries: 3, baseDelayMs: 0 });
    mockFetchResponses([{ status: 200, body: { ok: true } }]);

    const res = await app.request("/test");
    expect(res.status).toBe(200);
    expect(res.headers.get("x-retry-count")).toBeNull();
  });

  // --- maxRetries: 0 disables retry ---

  it("should not retry when maxRetries is 0", async () => {
    const app = createApp({ maxRetries: 0, baseDelayMs: 0 });
    const { mock } = mockFetchResponses([{ status: 503 }]);

    const res = await app.request("/test");
    expect(res.status).toBe(503);
    expect(mock).toHaveBeenCalledTimes(1);
    expect(res.headers.get("x-retry-count")).toBeNull();
  });

  // --- Fetch error during retry ---

  it("should synthesize a 502 on fetch error and continue retrying", async () => {
    const app = createApp({ maxRetries: 3, baseDelayMs: 1, retryOn: [502] });
    let callCount = 0;
    globalThis.fetch = vi.fn(async () => {
      callCount++;
      if (callCount <= 2) {
        // First two calls (original + first retry) throw network errors
        throw new TypeError("fetch failed");
      }
      // Third call succeeds
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as unknown as typeof fetch;

    const res = await app.request("/test");
    // The upstream handler catches the first fetch error and returns 502.
    // The retry policy then retries: second fetch also throws (synthesized 502),
    // third fetch succeeds with 200.
    expect(res.status).toBe(200);
    expect(globalThis.fetch).toHaveBeenCalledTimes(3);
  });

  // --- Default config values ---

  it("should use default config values", () => {
    const policy = retry();
    expect(policy.name).toBe("retry");
    expect(policy.priority).toBe(90);
  });

  // --- Concurrency safety ---

  it("should not modify globalThis.fetch during retries", async () => {
    const app = createApp({ maxRetries: 1, baseDelayMs: 1 });
    const mock = mockFetchResponses([
      { status: 503 },
      { status: 200, body: { ok: true } },
    ]).mock;

    await app.request("/test");

    // globalThis.fetch should still be our test mock - the retry policy
    // never touches globalThis.fetch
    expect(globalThis.fetch).toBe(mock);
  });

  // --- No-op for handler upstreams (no _proxyRequest) ---

  it("should not retry when no _proxyRequest is on context even if status is retryable", async () => {
    const app = new Hono();
    const policy = retry({ maxRetries: 3, baseDelayMs: 0, retryOn: [503] });

    app.use("/*", policy.handler);
    app.get("/test", (c) => c.json({ error: "fail" }, 503));

    const res = await app.request("/test");
    // Without _proxyRequest, retry is a no-op for handler upstreams
    expect(res.status).toBe(503);
    expect(res.headers.get("x-retry-count")).toBeNull();
  });
});
