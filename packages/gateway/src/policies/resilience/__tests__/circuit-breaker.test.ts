import { Hono } from "hono";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GatewayError } from "../../../core/errors";
import {
  circuitBreaker,
  InMemoryCircuitBreakerStore,
} from "../circuit-breaker";

describe("circuitBreaker", () => {
  let store: InMemoryCircuitBreakerStore;

  beforeEach(() => {
    store = new InMemoryCircuitBreakerStore();
  });

  afterEach(() => {
    store.clear();
  });

  function createApp(
    config: Parameters<typeof circuitBreaker>[0],
    responses: Array<{ status: number; body?: Record<string, unknown> }>
  ) {
    const app = new Hono();
    const policy = circuitBreaker(config);
    let callCount = 0;

    app.use("/*", async (c, next) => {
      try {
        await policy.handler(c, next);
      } catch (err) {
        if (err instanceof GatewayError) {
          const res = c.json(
            { error: err.code, message: err.message },
            err.statusCode as 503
          );
          if (err.headers) {
            for (const [key, value] of Object.entries(err.headers)) {
              c.res.headers.set(key, value);
            }
          }
          return res;
        }
        throw err;
      }
    });

    app.get("/test", (c) => {
      const idx = Math.min(callCount, responses.length - 1);
      callCount++;
      const resp = responses[idx];
      return c.json(resp.body ?? { attempt: callCount }, resp.status as 200);
    });

    return { app, getCallCount: () => callCount };
  }

  // --- Closed state ---

  it("should pass through when circuit is closed", async () => {
    const { app } = createApp({ store, failureThreshold: 5 }, [
      { status: 200 },
    ]);

    const res = await app.request("/test");
    expect(res.status).toBe(200);
  });

  it("should allow failures below threshold", async () => {
    const { app, getCallCount } = createApp({ store, failureThreshold: 3 }, [
      { status: 500 },
    ]);

    await app.request("/test");
    await app.request("/test");

    // Still closed after 2 failures (threshold is 3)
    const snap = await store.getState("/test");
    expect(snap.state).toBe("closed");
    expect(getCallCount()).toBe(2);
  });

  it("should open circuit after reaching failure threshold", async () => {
    const { app } = createApp({ store, failureThreshold: 3 }, [
      { status: 500 },
    ]);

    await app.request("/test");
    await app.request("/test");
    await app.request("/test");

    const snap = await store.getState("/test");
    expect(snap.state).toBe("open");
  });

  // --- Open state ---

  it("should reject requests when circuit is open", async () => {
    const { app } = createApp(
      { store, failureThreshold: 2, resetTimeoutMs: 30000 },
      [{ status: 500 }]
    );

    // Trip the circuit
    await app.request("/test");
    await app.request("/test");

    // Next request should be rejected without hitting upstream
    const res = await app.request("/test");
    expect(res.status).toBe(503);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("circuit_open");
  });

  it("should set retry-after header when circuit is open", async () => {
    const { app } = createApp(
      { store, failureThreshold: 1, resetTimeoutMs: 10000 },
      [{ status: 500 }]
    );

    await app.request("/test");
    const res = await app.request("/test");

    expect(res.status).toBe(503);
    const retryAfter = res.headers.get("retry-after");
    expect(retryAfter).toBeDefined();
    expect(Number(retryAfter)).toBeGreaterThan(0);
    expect(Number(retryAfter)).toBeLessThanOrEqual(10);
  });

  // --- Half-open state ---

  it("should transition to half-open after reset timeout", async () => {
    vi.useFakeTimers();

    const { app } = createApp(
      { store, failureThreshold: 1, resetTimeoutMs: 5000 },
      [{ status: 500 }, { status: 200 }]
    );

    // Trip the circuit
    await app.request("/test");

    // Advance past reset timeout
    vi.advanceTimersByTime(5100);

    // Should allow a probe request
    const res = await app.request("/test");
    expect(res.status).toBe(200);

    vi.useRealTimers();
  });

  it("should close circuit on successful probe in half-open", async () => {
    vi.useFakeTimers();

    const { app } = createApp(
      { store, failureThreshold: 1, resetTimeoutMs: 5000 },
      [{ status: 500 }, { status: 200 }]
    );

    // Trip the circuit
    await app.request("/test");

    vi.advanceTimersByTime(5100);

    // Successful probe
    await app.request("/test");

    const snap = await store.getState("/test");
    expect(snap.state).toBe("closed");

    vi.useRealTimers();
  });

  it("should re-open circuit on failed probe in half-open", async () => {
    vi.useFakeTimers();

    const { app } = createApp(
      { store, failureThreshold: 1, resetTimeoutMs: 5000 },
      [{ status: 500 }] // All requests fail
    );

    // Trip the circuit
    await app.request("/test");

    vi.advanceTimersByTime(5100);

    // Failed probe
    await app.request("/test");

    const snap = await store.getState("/test");
    expect(snap.state).toBe("open");

    vi.useRealTimers();
  });

  // --- Custom failure detection ---

  it("should use custom failureOn status codes", async () => {
    const { app } = createApp(
      { store, failureThreshold: 1, failureOn: [418] },
      [{ status: 418 }]
    );

    await app.request("/test");

    const snap = await store.getState("/test");
    expect(snap.state).toBe("open");
  });

  it("should not treat non-failure statuses as failures", async () => {
    const { app } = createApp(
      { store, failureThreshold: 1, failureOn: [500] },
      [{ status: 400 }] // 400 is not in failureOn
    );

    await app.request("/test");

    const snap = await store.getState("/test");
    expect(snap.state).toBe("closed");
  });

  // --- Key extraction ---

  it("should use custom key extractor", async () => {
    const { app } = createApp(
      {
        store,
        failureThreshold: 1,
        key: () => "custom-circuit",
      },
      [{ status: 500 }]
    );

    await app.request("/test");

    const snap = await store.getState("custom-circuit");
    expect(snap.state).toBe("open");
  });

  it("should isolate circuits by key", async () => {
    const app = new Hono();
    const policy = circuitBreaker({
      store,
      failureThreshold: 1,
    });

    app.use("/*", async (c, next) => {
      try {
        await policy.handler(c, next);
      } catch (err) {
        if (err instanceof GatewayError) {
          return c.json({ error: err.code }, err.statusCode as 503);
        }
        throw err;
      }
    });

    app.get("/route-a", (c) => c.json({ error: "fail" }, 500));
    app.get("/route-b", (c) => c.json({ ok: true }));

    // Trip circuit on route-a
    await app.request("/route-a");

    // route-b should still work
    const res = await app.request("/route-b");
    expect(res.status).toBe(200);
  });

  // --- Configuration ---

  it("should have priority 30", async () => {
    const policy = circuitBreaker({ store });
    expect(policy.priority).toBe(30);
    expect(policy.name).toBe("circuit-breaker");
  });

  it("should use default failure threshold of 5", async () => {
    const { app } = createApp({ store }, [{ status: 500 }]);

    for (let i = 0; i < 4; i++) {
      await app.request("/test");
    }
    const snap1 = await store.getState("/test");
    expect(snap1.state).toBe("closed");

    await app.request("/test");
    const snap2 = await store.getState("/test");
    expect(snap2.state).toBe("open");
  });

  // --- Store tests ---

  describe("InMemoryCircuitBreakerStore", () => {
    it("should return default snapshot for unknown key", async () => {
      const snap = await store.getState("unknown");
      expect(snap.state).toBe("closed");
      expect(snap.failureCount).toBe(0);
      expect(snap.successCount).toBe(0);
    });

    it("should track failures", async () => {
      await store.recordFailure("test");
      await store.recordFailure("test");
      const snap = await store.getState("test");
      expect(snap.failureCount).toBe(2);
    });

    it("should track successes", async () => {
      await store.recordSuccess("test");
      const snap = await store.getState("test");
      expect(snap.successCount).toBe(1);
    });

    it("should reset counters on transition to closed", async () => {
      await store.recordFailure("test");
      await store.recordFailure("test");
      await store.transition("test", "closed");
      const snap = await store.getState("test");
      expect(snap.failureCount).toBe(0);
      expect(snap.successCount).toBe(0);
    });

    it("should reset success count on transition to half-open", async () => {
      await store.recordSuccess("test");
      await store.transition("test", "half-open");
      const snap = await store.getState("test");
      expect(snap.successCount).toBe(0);
    });

    it("should remove key on reset", async () => {
      await store.recordFailure("test");
      await store.reset("test");
      const snap = await store.getState("test");
      expect(snap.failureCount).toBe(0);
    });

    it("should clear all entries", async () => {
      await store.recordFailure("a");
      await store.recordFailure("b");
      store.clear();
      const snapA = await store.getState("a");
      const snapB = await store.getState("b");
      expect(snapA.failureCount).toBe(0);
      expect(snapB.failureCount).toBe(0);
    });

    it("should destroy all state via destroy()", async () => {
      await store.recordFailure("x");
      await store.recordFailure("y");
      store.destroy();
      const snapX = await store.getState("x");
      const snapY = await store.getState("y");
      expect(snapX.failureCount).toBe(0);
      expect(snapY.failureCount).toBe(0);
    });
  });

  // --- Store failure resilience ---

  describe("store failure resilience", () => {
    function createCrashingStore(
      methods: Partial<
        Record<
          keyof import("../circuit-breaker").CircuitBreakerStore,
          "throw" | "reject"
        >
      >
    ) {
      const real = new InMemoryCircuitBreakerStore();
      const handler = (
        method: keyof import("../circuit-breaker").CircuitBreakerStore
      ) => {
        const mode = methods[method];
        if (mode === "throw")
          return () => {
            throw new Error(`${method} crashed`);
          };
        if (mode === "reject")
          return () => Promise.reject(new Error(`${method} timeout`));
        return (...args: unknown[]) =>
          (real[method] as (...a: unknown[]) => unknown)(...args);
      };
      return {
        getState: handler(
          "getState"
        ) as import("../circuit-breaker").CircuitBreakerStore["getState"],
        recordSuccess: handler(
          "recordSuccess"
        ) as import("../circuit-breaker").CircuitBreakerStore["recordSuccess"],
        recordFailure: handler(
          "recordFailure"
        ) as import("../circuit-breaker").CircuitBreakerStore["recordFailure"],
        transition: handler(
          "transition"
        ) as import("../circuit-breaker").CircuitBreakerStore["transition"],
        reset: handler(
          "reset"
        ) as import("../circuit-breaker").CircuitBreakerStore["reset"],
      };
    }

    it("should fail-open (assume closed) when store.getState() throws", async () => {
      const crashingStore = createCrashingStore({ getState: "throw" });
      const { app } = createApp({ store: crashingStore, failureThreshold: 5 }, [
        { status: 200 },
      ]);

      const res = await app.request("/test");
      expect(res.status).toBe(200);
    });

    it("should fail-open when store.getState() rejects", async () => {
      const crashingStore = createCrashingStore({ getState: "reject" });
      const { app } = createApp({ store: crashingStore, failureThreshold: 5 }, [
        { status: 200 },
      ]);

      const res = await app.request("/test");
      expect(res.status).toBe(200);
    });

    it("should not crash when store.recordFailure() throws in closed state", async () => {
      const crashingStore = createCrashingStore({ recordFailure: "throw" });
      const { app } = createApp({ store: crashingStore, failureThreshold: 1 }, [
        { status: 500 },
      ]);

      // Upstream returns 500 → policy tries recordFailure → store throws →
      // should degrade gracefully, still return the 500 response
      const res = await app.request("/test");
      expect(res.status).toBe(500);
    });

    it("should not crash when store.recordSuccess() throws in closed state", async () => {
      const crashingStore = createCrashingStore({ recordSuccess: "throw" });
      const { app } = createApp({ store: crashingStore, failureThreshold: 5 }, [
        { status: 200 },
      ]);

      const res = await app.request("/test");
      expect(res.status).toBe(200);
    });

    it("should not crash when store.transition() throws after threshold", async () => {
      // recordFailure works but transition crashes
      const crashingStore = createCrashingStore({ transition: "throw" });
      const { app } = createApp({ store: crashingStore, failureThreshold: 1 }, [
        { status: 500 },
      ]);

      // recordFailure succeeds, threshold met → transition throws → should not crash
      const res = await app.request("/test");
      expect(res.status).toBe(500);
    });

    it("should still propagate upstream errors when store crashes in catch path", async () => {
      const crashingStore = createCrashingStore({ recordFailure: "reject" });

      const app = new Hono();
      const policy = circuitBreaker({
        store: crashingStore,
        failureThreshold: 1,
      });
      let caughtError: Error | null = null;

      // Hono's compose catches per-handler errors and routes them to onError,
      // so we use app.onError to verify the original error propagates intact.
      app.onError((err, c) => {
        caughtError = err instanceof Error ? err : null;
        return c.json({ error: "caught" }, 502);
      });

      app.use("/*", async (c, next) => {
        await policy.handler(c, next);
      });

      app.get("/test", () => {
        throw new Error("upstream exploded");
      });

      // Upstream throws → catch path tries recordFailure → store rejects →
      // original error should still be re-thrown, not replaced by store error
      const res = await app.request("/test");
      expect(res.status).toBe(502);
      expect(caughtError).not.toBeNull();
      expect(caughtError!.message).toBe("upstream exploded");
    });

    it("should return upstream response body intact when store crashes", async () => {
      const crashingStore = createCrashingStore({ recordSuccess: "reject" });
      const { app } = createApp({ store: crashingStore, failureThreshold: 5 }, [
        { status: 200, body: { data: "important" } },
      ]);

      const res = await app.request("/test");
      expect(res.status).toBe(200);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.data).toBe("important");
    });
  });

  // --- onStateChange callback ---

  describe("onStateChange", () => {
    it("should call onStateChange when circuit transitions from closed to open", async () => {
      const transitions: Array<{ key: string; from: string; to: string }> = [];
      const { app } = createApp(
        {
          store,
          failureThreshold: 2,
          onStateChange: (key, from, to) => {
            transitions.push({ key, from, to });
          },
        },
        [{ status: 500 }]
      );

      await app.request("/test");
      await app.request("/test");

      expect(transitions).toHaveLength(1);
      expect(transitions[0]).toEqual({
        key: "/test",
        from: "closed",
        to: "open",
      });
    });

    it("should call onStateChange for open -> half-open -> closed transitions", async () => {
      vi.useFakeTimers();

      const transitions: Array<{ key: string; from: string; to: string }> = [];
      const { app } = createApp(
        {
          store,
          failureThreshold: 1,
          resetTimeoutMs: 5000,
          onStateChange: (key, from, to) => {
            transitions.push({ key, from, to });
          },
        },
        [{ status: 500 }, { status: 200 }]
      );

      // Trip the circuit: closed -> open
      await app.request("/test");

      vi.advanceTimersByTime(5100);

      // Probe: open -> half-open, then half-open -> closed
      await app.request("/test");

      expect(transitions).toHaveLength(3);
      expect(transitions[0]).toEqual({
        key: "/test",
        from: "closed",
        to: "open",
      });
      expect(transitions[1]).toEqual({
        key: "/test",
        from: "open",
        to: "half-open",
      });
      expect(transitions[2]).toEqual({
        key: "/test",
        from: "half-open",
        to: "closed",
      });

      vi.useRealTimers();
    });

    it("should call onStateChange for half-open -> open on failed probe", async () => {
      vi.useFakeTimers();

      const transitions: Array<{ key: string; from: string; to: string }> = [];
      const { app } = createApp(
        {
          store,
          failureThreshold: 1,
          resetTimeoutMs: 5000,
          onStateChange: (key, from, to) => {
            transitions.push({ key, from, to });
          },
        },
        [{ status: 500 }] // All requests fail
      );

      // Trip the circuit
      await app.request("/test");

      vi.advanceTimersByTime(5100);

      // Failed probe: half-open -> open
      await app.request("/test");

      expect(transitions).toHaveLength(3);
      expect(transitions[2]).toEqual({
        key: "/test",
        from: "half-open",
        to: "open",
      });

      vi.useRealTimers();
    });

    it("should not crash when onStateChange throws", async () => {
      const { app } = createApp(
        {
          store,
          failureThreshold: 1,
          onStateChange: () => {
            throw new Error("callback crashed");
          },
        },
        [{ status: 500 }]
      );

      // Should not throw even though callback crashes
      const res = await app.request("/test");
      expect(res.status).toBe(500);

      // Circuit should still have transitioned despite callback error
      const snap = await store.getState("/test");
      expect(snap.state).toBe("open");
    });

    it("should not crash when async onStateChange rejects", async () => {
      const { app } = createApp(
        {
          store,
          failureThreshold: 1,
          onStateChange: async () => {
            throw new Error("async callback rejected");
          },
        },
        [{ status: 500 }]
      );

      const res = await app.request("/test");
      expect(res.status).toBe(500);

      const snap = await store.getState("/test");
      expect(snap.state).toBe("open");
    });
  });
});
