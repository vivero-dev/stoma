import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPolicyTestHarness } from "../../sdk";
import { trafficShadow } from "../traffic-shadow";

describe("trafficShadow", () => {
  const originalFetch = globalThis.fetch;
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi
      .fn()
      .mockResolvedValue(new Response("shadow ok", { status: 200 }));
    // We need to preserve the original fetch for the test harness while
    // intercepting shadow calls. The shadow URL starts with our target.
    globalThis.fetch = ((...args: Parameters<typeof fetch>) => {
      const url =
        typeof args[0] === "string" ? args[0] : (args[0] as Request).url;
      if (url.startsWith("https://shadow.internal")) {
        return fetchSpy(...args);
      }
      return originalFetch(...args);
    }) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("should mirror request to shadow target", async () => {
    const { request, adapter } = createPolicyTestHarness(
      trafficShadow({
        target: "https://shadow.internal",
        percentage: 100,
      })
    );

    const res = await request("/api/data?foo=bar");
    expect(res.status).toBe(200);

    // Wait for fire-and-forget
    await adapter.waitAll();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [shadowUrl] = fetchSpy.mock.calls[0] as [string];
    expect(shadowUrl).toBe("https://shadow.internal/api/data?foo=bar");
  });

  it("should not affect primary response", async () => {
    const { request, adapter } = createPolicyTestHarness(
      trafficShadow({
        target: "https://shadow.internal",
        percentage: 100,
      }),
      {
        upstream: async (c) => c.json({ primary: true }),
      }
    );

    const res = await request("/test");
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.primary).toBe(true);

    await adapter.waitAll();
  });

  it("should never mirror when percentage=0", async () => {
    const { request, adapter } = createPolicyTestHarness(
      trafficShadow({
        target: "https://shadow.internal",
        percentage: 0,
      })
    );

    // Make several requests - none should be mirrored
    for (let i = 0; i < 10; i++) {
      await request("/test");
    }
    await adapter.waitAll();

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("should always mirror when percentage=100", async () => {
    const { request, adapter } = createPolicyTestHarness(
      trafficShadow({
        target: "https://shadow.internal",
        percentage: 100,
      })
    );

    await request("/test");
    await adapter.waitAll();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("should filter by HTTP method", async () => {
    const { request, adapter } = createPolicyTestHarness(
      trafficShadow({
        target: "https://shadow.internal",
        percentage: 100,
        methods: ["POST"],
      })
    );

    // GET should not be mirrored
    await request("/test", { method: "GET" });
    await adapter.waitAll();
    expect(fetchSpy).not.toHaveBeenCalled();

    // POST should be mirrored
    await request("/test", { method: "POST" });
    await adapter.waitAll();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("should not affect primary response on shadow failure", async () => {
    fetchSpy.mockRejectedValueOnce(new Error("Shadow downstream error"));

    const { request, adapter } = createPolicyTestHarness(
      trafficShadow({
        target: "https://shadow.internal",
        percentage: 100,
      })
    );

    const res = await request("/test");
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.ok).toBe(true);

    await adapter.waitAll();
  });

  it("should preserve path and query string in shadow URL", async () => {
    const { request, adapter } = createPolicyTestHarness(
      trafficShadow({
        target: "https://shadow.internal",
        percentage: 100,
      })
    );

    await request("/api/v2/users?page=2&limit=10");
    await adapter.waitAll();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [shadowUrl] = fetchSpy.mock.calls[0] as [string];
    expect(shadowUrl).toBe(
      "https://shadow.internal/api/v2/users?page=2&limit=10"
    );
  });

  it("should use AbortSignal for timeout", async () => {
    const { request, adapter } = createPolicyTestHarness(
      trafficShadow({
        target: "https://shadow.internal",
        percentage: 100,
        timeout: 1000,
      })
    );

    await request("/test");
    await adapter.waitAll();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const callArgs = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(callArgs[1].signal).toBeInstanceOf(AbortSignal);
  });

  it("should call onError callback on shadow failure", async () => {
    const onError = vi.fn();
    const shadowError = new Error("connection refused");
    fetchSpy.mockRejectedValueOnce(shadowError);

    const { request, adapter } = createPolicyTestHarness(
      trafficShadow({
        target: "https://shadow.internal",
        percentage: 100,
        onError,
      })
    );

    await request("/test");
    await adapter.waitAll();

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(shadowError);
  });

  it("should support skip logic", async () => {
    const { request, adapter } = createPolicyTestHarness(
      trafficShadow({
        target: "https://shadow.internal",
        percentage: 100,
        skip: () => true,
      })
    );

    await request("/test");
    await adapter.waitAll();

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("should have priority RESPONSE_TRANSFORM (92)", () => {
    const policy = trafficShadow({
      target: "https://shadow.internal",
    });
    expect(policy.priority).toBe(92);
    expect(policy.name).toBe("traffic-shadow");
  });
});
