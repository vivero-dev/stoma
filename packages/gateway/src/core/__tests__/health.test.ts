import { Hono } from "hono";
import { afterEach, describe, expect, it, vi } from "vitest";
import { health } from "../health";

describe("health", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function createApp(config?: Parameters<typeof health>[0]) {
    const app = new Hono();
    const route = health(config);

    // Mount the health route manually since it returns a RouteConfig
    const methods = route.methods ?? ["GET"];
    for (const method of methods) {
      const m = method.toLowerCase() as "get";
      if (route.pipeline.upstream.type === "handler") {
        app[m](route.path, route.pipeline.upstream.handler);
      }
    }

    return app;
  }

  // --- Basic health ---

  it("should return healthy status with no probes", async () => {
    const app = createApp();

    const res = await app.request("/health");
    expect(res.status).toBe(200);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body.status).toBe("healthy");
    expect(body.timestamp).toBeDefined();
  });

  it("should use custom path", async () => {
    const app = createApp({ path: "/status" });

    const res = await app.request("/status");
    expect(res.status).toBe(200);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body.status).toBe("healthy");
  });

  // --- Upstream probes ---

  it("should report healthy when all probes succeed", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("", { status: 200 })
    );

    const app = createApp({
      upstreamProbes: ["https://api1.example.com/health"],
      includeUpstreamStatus: true,
    });

    const res = await app.request("/health");
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.status).toBe("healthy");
    expect(body.upstreams).toBeDefined();

    const upstreams = body.upstreams as Array<Record<string, unknown>>;
    expect(upstreams).toHaveLength(1);
    expect(upstreams[0].status).toBe("healthy");
  });

  it("should report unhealthy when all probes fail", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new Error("connection refused")
    );

    const app = createApp({
      upstreamProbes: ["https://api1.example.com/health"],
      includeUpstreamStatus: true,
    });

    const res = await app.request("/health");
    expect(res.status).toBe(503);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body.status).toBe("unhealthy");
  });

  it("should report degraded when some probes fail", async () => {
    let callCount = 0;
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      callCount++;
      if (callCount === 1) return new Response("", { status: 200 });
      throw new Error("connection refused");
    });

    const app = createApp({
      upstreamProbes: [
        "https://api1.example.com/health",
        "https://api2.example.com/health",
      ],
      includeUpstreamStatus: true,
    });

    const res = await app.request("/health");
    expect(res.status).toBe(200);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body.status).toBe("degraded");
  });

  it("should report unhealthy for non-2xx responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("", { status: 503 })
    );

    const app = createApp({
      upstreamProbes: ["https://api1.example.com/health"],
      includeUpstreamStatus: true,
    });

    const res = await app.request("/health");
    expect(res.status).toBe(503);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body.status).toBe("unhealthy");
  });

  // --- Upstream status visibility ---

  it("should not include upstream details when includeUpstreamStatus is false", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("", { status: 200 })
    );

    const app = createApp({
      upstreamProbes: ["https://api1.example.com/health"],
      includeUpstreamStatus: false,
    });

    const res = await app.request("/health");
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.upstreams).toBeUndefined();
  });

  // --- Route config shape ---

  it("should return a valid RouteConfig", async () => {
    const route = health();
    expect(route.path).toBe("/health");
    expect(route.methods).toEqual(["GET"]);
    expect(route.pipeline.upstream.type).toBe("handler");
  });

  it("should include latency in upstream status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("", { status: 200 })
    );

    const app = createApp({
      upstreamProbes: ["https://api1.example.com/health"],
      includeUpstreamStatus: true,
    });

    const res = await app.request("/health");
    const body = (await res.json()) as Record<string, unknown>;

    const upstreams = body.upstreams as Array<Record<string, unknown>>;
    expect(upstreams[0].latencyMs).toBeGreaterThanOrEqual(0);
  });
});
