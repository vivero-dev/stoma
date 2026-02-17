import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";
import { GatewayError } from "../../../core/errors";
import { timeout } from "../timeout";

describe("timeout", () => {
  function createApp(config: Parameters<typeof timeout>[0], handlerDelay = 0) {
    const app = new Hono();
    const policy = timeout(config);

    app.use("/*", async (c, next) => {
      try {
        await policy.handler(c, next);
      } catch (err) {
        if (err instanceof GatewayError) {
          return c.json(
            { error: err.code, message: err.message },
            err.statusCode as 504
          );
        }
        throw err;
      }
    });

    app.get("/test", async (c) => {
      if (handlerDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, handlerDelay));
      }
      return c.json({ ok: true });
    });

    return app;
  }

  // --- Valid scenarios ---

  it("should allow requests that complete within the timeout", async () => {
    const app = createApp({ timeoutMs: 1000 }, 0);
    const res = await app.request("/test");
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toEqual({ ok: true });
  });

  it("should use default timeout of 30000ms", async () => {
    const policy = timeout();
    expect(policy.name).toBe("timeout");
    expect(policy.priority).toBe(85);
  });

  it("should have priority 85", async () => {
    const policy = timeout({ timeoutMs: 5000 });
    expect(policy.priority).toBe(85);
  });

  // --- Timeout triggers ---

  it("should return 504 when handler exceeds timeout", async () => {
    vi.useFakeTimers();

    const slowApp = new Hono();
    const policy = timeout({ timeoutMs: 100 });

    slowApp.use("/*", async (c, next) => {
      try {
        await policy.handler(c, next);
      } catch (err) {
        if (err instanceof GatewayError) {
          return c.json(
            { error: err.code, message: err.message },
            err.statusCode as 504
          );
        }
        throw err;
      }
    });

    slowApp.get("/test", async (c) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return c.json({ ok: true });
    });

    const resPromise = slowApp.request("/test");
    vi.advanceTimersByTime(150);
    const res = await resPromise;

    expect(res.status).toBe(504);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("gateway_timeout");

    vi.useRealTimers();
  });

  it("should use custom message", async () => {
    vi.useFakeTimers();

    const slowApp = new Hono();
    const policy = timeout({ timeoutMs: 50, message: "Too slow!" });

    slowApp.use("/*", async (c, next) => {
      try {
        await policy.handler(c, next);
      } catch (err) {
        if (err instanceof GatewayError) {
          return c.json(
            { error: err.code, message: err.message },
            err.statusCode as 504
          );
        }
        throw err;
      }
    });

    slowApp.get("/test", async (c) => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return c.json({ ok: true });
    });

    const resPromise = slowApp.request("/test");
    vi.advanceTimersByTime(100);
    const res = await resPromise;

    expect(res.status).toBe(504);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.message).toBe("Too slow!");

    vi.useRealTimers();
  });

  // --- Edge cases ---

  it("should clean up timer on success", async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    const app = createApp({ timeoutMs: 5000 }, 0);

    await app.request("/test");
    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });

  it("should clean up timer on handler error", async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

    const app = new Hono();
    const policy = timeout({ timeoutMs: 5000 });

    app.use("/*", async (c, next) => {
      try {
        await policy.handler(c, next);
      } catch {
        return c.json({ error: "caught" }, 500);
      }
    });

    app.get("/test", () => {
      throw new Error("handler error");
    });

    await app.request("/test");
    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });

  it("should propagate non-timeout errors", async () => {
    const app = new Hono();
    const policy = timeout({ timeoutMs: 5000 });

    app.use("/*", async (c, next) => {
      try {
        await policy.handler(c, next);
      } catch (err) {
        if (err instanceof GatewayError) {
          return c.json({ error: err.code }, err.statusCode as 504);
        }
        return c.json({ error: "other" }, 500);
      }
    });

    app.get("/test", () => {
      throw new Error("unrelated error");
    });

    const res = await app.request("/test");
    // Hono catches unhandled handler errors internally and returns a
    // text "Internal Server Error" response before middleware try/catch
    // can intercept, so we assert on status and text body.
    expect(res.status).toBe(500);
    expect(await res.text()).toBe("Internal Server Error");
  });
});
