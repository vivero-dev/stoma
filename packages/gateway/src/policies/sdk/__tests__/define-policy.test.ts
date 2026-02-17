import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { GatewayError } from "../../../core/errors";
import { createContextInjector } from "../../../core/pipeline";
import { noopDebugLogger } from "../../../utils/debug";
import type { PolicyConfig, PolicyContext } from "../../types";
import { definePolicy } from "../define-policy";
import { Priority } from "../priority";

interface TestPolicyConfig extends PolicyConfig {
  headerName?: string;
  maxItems?: number;
}

describe("definePolicy", () => {
  it("should create a factory that returns a valid Policy", () => {
    const factory = definePolicy<TestPolicyConfig>({
      name: "test-policy",
      priority: Priority.AUTH,
      handler: async (_c, next) => {
        await next();
      },
    });

    const policy = factory();
    expect(policy.name).toBe("test-policy");
    expect(policy.priority).toBe(Priority.AUTH);
    expect(typeof policy.handler).toBe("function");
  });

  it("should use Priority.DEFAULT when no priority specified", () => {
    const factory = definePolicy({
      name: "default-priority",
      handler: async (_c, next) => {
        await next();
      },
    });

    const policy = factory();
    expect(policy.priority).toBe(Priority.DEFAULT);
  });

  it("should merge defaults with user config", async () => {
    let receivedConfig: TestPolicyConfig | undefined;

    const factory = definePolicy<TestPolicyConfig>({
      name: "config-test",
      defaults: { headerName: "x-default", maxItems: 100 },
      handler: async (_c, next, { config }) => {
        receivedConfig = config;
        await next();
      },
    });

    const policy = factory({ maxItems: 50 });

    const app = new Hono();
    app.use("/*", policy.handler);
    app.get("/test", (c) => c.json({ ok: true }));
    await app.request("/test");

    expect(receivedConfig?.headerName).toBe("x-default");
    expect(receivedConfig?.maxItems).toBe(50);
  });

  it("should use defaults when no user config provided", async () => {
    let receivedConfig: TestPolicyConfig | undefined;

    const factory = definePolicy<TestPolicyConfig>({
      name: "defaults-only",
      defaults: { headerName: "x-default", maxItems: 100 },
      handler: async (_c, next, { config }) => {
        receivedConfig = config;
        await next();
      },
    });

    const policy = factory();

    const app = new Hono();
    app.use("/*", policy.handler);
    app.get("/test", (c) => c.json({ ok: true }));
    await app.request("/test");

    expect(receivedConfig?.headerName).toBe("x-default");
    expect(receivedConfig?.maxItems).toBe(100);
  });

  it("should inject debug logger into handler context", async () => {
    let receivedDebug: unknown;

    const factory = definePolicy({
      name: "debug-test",
      handler: async (_c, next, { debug }) => {
        receivedDebug = debug;
        await next();
      },
    });

    const policy = factory();

    // Without gateway context, debug should be noopDebugLogger
    const app = new Hono();
    app.use("/*", policy.handler);
    app.get("/test", (c) => c.json({ ok: true }));
    await app.request("/test");

    expect(typeof receivedDebug).toBe("function");
    expect(receivedDebug).toBe(noopDebugLogger);
  });

  it("should inject real debug logger when gateway context exists", async () => {
    let receivedDebug: unknown;

    const factory = definePolicy({
      name: "debug-ctx-test",
      handler: async (_c, next, { debug }) => {
        receivedDebug = debug;
        await next();
      },
    });

    const policy = factory();

    const app = new Hono();
    app.use(
      "/*",
      createContextInjector("test-gw", "/*", () => {
        return (_msg: string) => {};
      })
    );
    app.use("/*", policy.handler);
    app.get("/test", (c) => c.json({ ok: true }));
    await app.request("/test");

    expect(typeof receivedDebug).toBe("function");
    expect(receivedDebug).not.toBe(noopDebugLogger);
  });

  it("should inject gateway context into handler", async () => {
    let receivedGateway: PolicyContext | undefined;

    const factory = definePolicy({
      name: "gateway-test",
      handler: async (_c, next, { gateway }) => {
        receivedGateway = gateway;
        await next();
      },
    });

    const policy = factory();

    const app = new Hono();
    app.use("/*", createContextInjector("my-gateway", "/api/*"));
    app.use("/*", policy.handler);
    app.get("/test", (c) => c.json({ ok: true }));
    await app.request("/test");

    expect(receivedGateway).toBeDefined();
    expect(receivedGateway?.gatewayName).toBe("my-gateway");
    expect(receivedGateway?.requestId).toBeDefined();
    expect(receivedGateway?.traceId).toBeDefined();
    expect(receivedGateway?.spanId).toBeDefined();
  });

  it("should pass undefined gateway when no context injector", async () => {
    let receivedGateway: PolicyContext | undefined | null = null;

    const factory = definePolicy({
      name: "no-gateway",
      handler: async (_c, next, { gateway }) => {
        receivedGateway = gateway;
        await next();
      },
    });

    const policy = factory();

    const app = new Hono();
    app.use("/*", policy.handler);
    app.get("/test", (c) => c.json({ ok: true }));
    await app.request("/test");

    expect(receivedGateway).toBeUndefined();
  });

  describe("skip logic", () => {
    it("should skip handler when skip returns true", async () => {
      let handlerCalled = false;

      const factory = definePolicy<TestPolicyConfig>({
        name: "skip-test",
        handler: async (_c, next) => {
          handlerCalled = true;
          await next();
        },
      });

      const policy = factory({ skip: () => true });

      const app = new Hono();
      app.use("/*", policy.handler);
      app.get("/test", (c) => c.json({ ok: true }));

      const res = await app.request("/test");
      expect(res.status).toBe(200);
      expect(handlerCalled).toBe(false);
    });

    it("should run handler when skip returns false", async () => {
      let handlerCalled = false;

      const factory = definePolicy<TestPolicyConfig>({
        name: "no-skip-test",
        handler: async (_c, next) => {
          handlerCalled = true;
          await next();
        },
      });

      const policy = factory({ skip: () => false });

      const app = new Hono();
      app.use("/*", policy.handler);
      app.get("/test", (c) => c.json({ ok: true }));

      const res = await app.request("/test");
      expect(res.status).toBe(200);
      expect(handlerCalled).toBe(true);
    });

    it("should handle async skip function", async () => {
      let handlerCalled = false;

      const factory = definePolicy({
        name: "async-skip",
        handler: async (_c, next) => {
          handlerCalled = true;
          await next();
        },
      });

      const policy = factory({
        skip: async () => {
          await new Promise((r) => setTimeout(r, 1));
          return true;
        },
      });

      const app = new Hono();
      app.use("/*", policy.handler);
      app.get("/test", (c) => c.json({ ok: true }));

      await app.request("/test");
      expect(handlerCalled).toBe(false);
    });

    it("should not wrap handler when no skip provided", async () => {
      let handlerCalled = false;

      const factory = definePolicy({
        name: "no-skip-config",
        handler: async (_c, next) => {
          handlerCalled = true;
          await next();
        },
      });

      const policy = factory();

      const app = new Hono();
      app.use("/*", policy.handler);
      app.get("/test", (c) => c.json({ ok: true }));

      await app.request("/test");
      expect(handlerCalled).toBe(true);
    });
  });

  it("should allow handler to throw GatewayError for short-circuit", async () => {
    const factory = definePolicy({
      name: "short-circuit",
      priority: Priority.AUTH,
      handler: async () => {
        throw new GatewayError(403, "forbidden", "Blocked");
      },
    });

    const policy = factory();

    const app = new Hono();
    app.use("/*", async (c, next) => {
      try {
        await policy.handler(c, next);
      } catch (err) {
        if (err instanceof GatewayError) {
          return c.json(
            { error: err.code, message: err.message },
            err.statusCode as 403
          );
        }
        throw err;
      }
    });
    app.get("/test", (c) => c.json({ ok: true }));

    const res = await app.request("/test");
    expect(res.status).toBe(403);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("forbidden");
  });
});
