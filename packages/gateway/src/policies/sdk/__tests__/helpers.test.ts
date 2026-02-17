import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { createContextInjector } from "../../../core/pipeline";
import { noopDebugLogger } from "../../../utils/debug";
import { policyDebug, resolveConfig, withSkip } from "../helpers";

describe("resolveConfig", () => {
  interface TestConfig {
    timeout?: number;
    message?: string;
    required: string;
  }

  it("should return defaults when no user config provided", () => {
    const result = resolveConfig<TestConfig>({
      timeout: 5000,
      message: "default",
    });
    expect(result.timeout).toBe(5000);
    expect(result.message).toBe("default");
  });

  it("should merge user config with defaults", () => {
    const result = resolveConfig<TestConfig>(
      { timeout: 5000, message: "default" },
      { timeout: 1000, required: "yes" }
    );
    expect(result.timeout).toBe(1000);
    expect(result.message).toBe("default");
    expect(result.required).toBe("yes");
  });

  it("should allow user config to override all defaults", () => {
    const result = resolveConfig<TestConfig>(
      { timeout: 5000, message: "default" },
      { timeout: 1000, message: "custom", required: "yes" }
    );
    expect(result.timeout).toBe(1000);
    expect(result.message).toBe("custom");
  });

  it("should handle empty defaults", () => {
    const result = resolveConfig<TestConfig>(
      {},
      { required: "yes", timeout: 42 }
    );
    expect(result.required).toBe("yes");
    expect(result.timeout).toBe(42);
  });

  it("should handle empty user config", () => {
    const result = resolveConfig<TestConfig>({ timeout: 5000 }, {});
    expect(result.timeout).toBe(5000);
  });
});

describe("policyDebug", () => {
  it("should return noopDebugLogger when no gateway context exists", async () => {
    const app = new Hono();
    let debugFn: unknown;

    app.get("/test", (c) => {
      debugFn = policyDebug(c, "test-policy");
      return c.json({ ok: true });
    });

    await app.request("/test");
    expect(debugFn).toBe(noopDebugLogger);
  });

  it("should return a debug logger when gateway context exists", async () => {
    const app = new Hono();
    let debugFn: unknown;

    app.use(
      "/*",
      createContextInjector("test-gw", "/*", () => {
        // Return a real debug logger (not noop)
        return (_msg: string) => {
          /* captured */
        };
      })
    );

    app.get("/test", (c) => {
      debugFn = policyDebug(c, "test-policy");
      return c.json({ ok: true });
    });

    await app.request("/test");
    // Should be a function (not noopDebugLogger since debug is enabled)
    expect(typeof debugFn).toBe("function");
    expect(debugFn).not.toBe(noopDebugLogger);
  });

  it("should namespace the debug logger to stoma:policy:{name}", async () => {
    const app = new Hono();
    let requestedNamespace: string | undefined;

    app.use(
      "/*",
      createContextInjector("test-gw", "/*", (ns) => {
        requestedNamespace = ns;
        return (_msg: string) => {
          /* captured */
        };
      })
    );

    app.get("/test", (c) => {
      policyDebug(c, "my-cache");
      return c.json({ ok: true });
    });

    await app.request("/test");
    expect(requestedNamespace).toBe("stoma:policy:my-cache");
  });
});

describe("withSkip", () => {
  it("should return original handler when skipFn is undefined", () => {
    const handler = async () => {};
    const result = withSkip(undefined, handler);
    expect(result).toBe(handler);
  });

  it("should skip handler when skipFn returns true", async () => {
    const app = new Hono();
    let handlerCalled = false;
    let nextCalled = false;

    const handler = withSkip(
      () => true,
      async (_c, next) => {
        handlerCalled = true;
        await next();
      }
    );

    app.use("/*", async (c, next) => {
      await handler(c, next);
    });
    app.get("/test", (c) => {
      nextCalled = true;
      return c.json({ ok: true });
    });

    await app.request("/test");
    expect(handlerCalled).toBe(false);
    expect(nextCalled).toBe(true);
  });

  it("should run handler when skipFn returns false", async () => {
    const app = new Hono();
    let handlerCalled = false;

    const handler = withSkip(
      () => false,
      async (_c, next) => {
        handlerCalled = true;
        await next();
      }
    );

    app.use("/*", handler);
    app.get("/test", (c) => c.json({ ok: true }));

    await app.request("/test");
    expect(handlerCalled).toBe(true);
  });

  it("should handle async skipFn", async () => {
    const app = new Hono();
    let handlerCalled = false;

    const handler = withSkip(
      async () => {
        await new Promise((r) => setTimeout(r, 1));
        return true;
      },
      async (_c, next) => {
        handlerCalled = true;
        await next();
      }
    );

    app.use("/*", handler);
    app.get("/test", (c) => c.json({ ok: true }));

    await app.request("/test");
    expect(handlerCalled).toBe(false);
  });

  it("should pass Hono context to skipFn", async () => {
    const app = new Hono();
    let receivedCtx: unknown;

    const handler = withSkip(
      (ctx) => {
        receivedCtx = ctx;
        return false;
      },
      async (_c, next) => {
        await next();
      }
    );

    app.use("/*", handler);
    app.get("/test", (c) => c.json({ ok: true }));

    await app.request("/test");
    // receivedCtx should be a Hono Context object
    expect(receivedCtx).toBeDefined();
    expect(typeof (receivedCtx as { req: unknown }).req).toBe("object");
  });
});
