import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import type { Policy } from "../../policies/types";
import {
  buildPolicyChain,
  createContextInjector,
  getGatewayContext,
  policiesToMiddleware,
} from "../pipeline";

describe("buildPolicyChain", () => {
  it("should merge global and route policies", () => {
    const global: Policy[] = [
      { name: "auth", handler: async (_c, next) => next(), priority: 10 },
    ];
    const route: Policy[] = [
      { name: "rate-limit", handler: async (_c, next) => next(), priority: 20 },
    ];

    const result = buildPolicyChain(global, route);

    expect(result).toHaveLength(2);
    expect(result.map((p) => p.name)).toEqual(["auth", "rate-limit"]);
  });

  it("should deduplicate by name with route-level winning", () => {
    const globalHandler = async (_c: unknown, next: () => Promise<void>) =>
      next();
    const routeHandler = async (_c: unknown, next: () => Promise<void>) =>
      next();

    const global: Policy[] = [
      {
        name: "auth",
        handler: globalHandler as Policy["handler"],
        priority: 10,
      },
    ];
    const route: Policy[] = [
      { name: "auth", handler: routeHandler as Policy["handler"], priority: 5 },
    ];

    const result = buildPolicyChain(global, route);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("auth");
    expect(result[0].priority).toBe(5);
    expect(result[0].handler).toBe(routeHandler);
  });

  it("should sort by priority ascending", () => {
    const policies: Policy[] = [
      { name: "c", handler: async (_c, next) => next(), priority: 30 },
      { name: "a", handler: async (_c, next) => next(), priority: 10 },
      { name: "b", handler: async (_c, next) => next(), priority: 20 },
    ];

    const result = buildPolicyChain([], policies);

    expect(result.map((p) => p.name)).toEqual(["a", "b", "c"]);
  });

  it("should use default priority 100 when not specified", () => {
    const policies: Policy[] = [
      { name: "explicit", handler: async (_c, next) => next(), priority: 50 },
      { name: "default", handler: async (_c, next) => next() },
    ];

    const result = buildPolicyChain([], policies);

    expect(result.map((p) => p.name)).toEqual(["explicit", "default"]);
  });

  it("should handle empty global policies", () => {
    const route: Policy[] = [
      { name: "auth", handler: async (_c, next) => next(), priority: 10 },
    ];

    const result = buildPolicyChain([], route);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("auth");
  });

  it("should handle empty route policies", () => {
    const global: Policy[] = [
      { name: "cors", handler: async (_c, next) => next(), priority: 5 },
    ];

    const result = buildPolicyChain(global, []);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("cors");
  });

  it("should handle both empty", () => {
    const result = buildPolicyChain([], []);
    expect(result).toHaveLength(0);
  });
});

describe("policiesToMiddleware", () => {
  it("should convert policies to middleware handlers", () => {
    const policies: Policy[] = [
      { name: "a", handler: async (_c, next) => next() },
      { name: "b", handler: async (_c, next) => next() },
    ];

    const middleware = policiesToMiddleware(policies);

    expect(middleware).toHaveLength(2);
    expect(typeof middleware[0]).toBe("function");
    expect(typeof middleware[1]).toBe("function");
  });
});

describe("createContextInjector", () => {
  it("should set requestId on context", async () => {
    const app = new Hono();
    const injector = createContextInjector("test-gw", "/test");

    let capturedRequestId: string | undefined;

    app.use("/test", injector);
    app.get("/test", (c) => {
      const ctx = getGatewayContext(c);
      capturedRequestId = ctx?.requestId;
      return c.json({ ok: true });
    });

    await app.request("/test");

    expect(capturedRequestId).toBeDefined();
    expect(typeof capturedRequestId).toBe("string");
    expect(capturedRequestId!.length).toBeGreaterThan(0);
  });

  it("should set x-request-id response header", async () => {
    const app = new Hono();
    const injector = createContextInjector("test-gw", "/test");

    app.use("/test", injector);
    app.get("/test", (c) => c.json({ ok: true }));

    const res = await app.request("/test");

    expect(res.headers.get("x-request-id")).toBeDefined();
    expect(res.headers.get("x-request-id")!.length).toBeGreaterThan(0);
  });

  it("should set startTime", async () => {
    const app = new Hono();
    const injector = createContextInjector("test-gw", "/test");

    let capturedStartTime: number | undefined;

    app.use("/test", injector);
    app.get("/test", (c) => {
      const ctx = getGatewayContext(c);
      capturedStartTime = ctx?.startTime;
      return c.json({ ok: true });
    });

    const before = Date.now();
    await app.request("/test");
    const after = Date.now();

    expect(capturedStartTime).toBeDefined();
    expect(capturedStartTime).toBeGreaterThanOrEqual(before);
    expect(capturedStartTime).toBeLessThanOrEqual(after);
  });

  it("should set gatewayName and routePath", async () => {
    const app = new Hono();
    const injector = createContextInjector("my-gateway", "/api/users");

    let capturedGatewayName: string | undefined;
    let capturedRoutePath: string | undefined;

    app.use("/test", injector);
    app.get("/test", (c) => {
      const ctx = getGatewayContext(c);
      capturedGatewayName = ctx?.gatewayName;
      capturedRoutePath = ctx?.routePath;
      return c.json({ ok: true });
    });

    await app.request("/test");

    expect(capturedGatewayName).toBe("my-gateway");
    expect(capturedRoutePath).toBe("/api/users");
  });
});

describe("getGatewayContext", () => {
  it("should return undefined when no context set", async () => {
    const app = new Hono();

    let capturedCtx: unknown = "not-set";

    app.get("/test", (c) => {
      capturedCtx = getGatewayContext(c);
      return c.json({ ok: true });
    });

    await app.request("/test");

    expect(capturedCtx).toBeUndefined();
  });

  it("should return context after injector runs", async () => {
    const app = new Hono();
    const injector = createContextInjector("gw", "/path");

    let capturedCtx: unknown;

    app.use("/test", injector);
    app.get("/test", (c) => {
      capturedCtx = getGatewayContext(c);
      return c.json({ ok: true });
    });

    await app.request("/test");

    expect(capturedCtx).toBeDefined();
    expect(capturedCtx).toHaveProperty("requestId");
    expect(capturedCtx).toHaveProperty("startTime");
    expect(capturedCtx).toHaveProperty("gatewayName", "gw");
    expect(capturedCtx).toHaveProperty("routePath", "/path");
  });
});
