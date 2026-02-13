import type { Context } from "hono";
import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import {
  isTraceRequested,
  noopTraceReporter,
  type PolicyTraceDetail,
  policyTrace,
  TRACE_DETAILS_KEY,
  TRACE_REQUESTED_KEY,
} from "../trace";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Use a loose env type so c.set/c.get accept arbitrary keys.
type AnyEnv = { Variables: Record<string, unknown> };

/**
 * Create a minimal Hono app that runs a callback with the Hono context.
 * Optionally pre-sets trace requested.
 */
function createApp(
  traceActive: boolean,
  handler: (c: Context<AnyEnv>) => void
) {
  const app = new Hono<AnyEnv>();
  app.get("/test", (c) => {
    if (traceActive) {
      c.set(TRACE_REQUESTED_KEY, true);
    }
    handler(c);
    return c.json({ ok: true });
  });
  return app;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("policyTrace()", () => {
  it("should return noopTraceReporter when tracing is not active", async () => {
    const app = createApp(false, (c) => {
      const trace = policyTrace(c as Context, "test-policy");
      expect(trace).toBe(noopTraceReporter);
    });

    await app.request("/test");
  });

  it("should return a reporter that stores detail when tracing is active", async () => {
    const app = createApp(true, (c) => {
      const trace = policyTrace(c as Context, "test-policy");
      expect(trace).not.toBe(noopTraceReporter);

      trace("allowed", { key: "abc", count: 1 });

      const details = c.get(TRACE_DETAILS_KEY) as Map<
        string,
        PolicyTraceDetail
      >;
      expect(details).toBeDefined();
      expect(details.get("test-policy")).toEqual({
        action: "allowed",
        data: { key: "abc", count: 1 },
      });
    });

    await app.request("/test");
  });

  it("should store details independently for multiple policies", async () => {
    const app = createApp(true, (c) => {
      const traceA = policyTrace(c as Context, "policy-a");
      const traceB = policyTrace(c as Context, "policy-b");

      traceA("HIT", { key: "k1" });
      traceB("rejected", { reason: "invalid" });

      const details = c.get(TRACE_DETAILS_KEY) as Map<
        string,
        PolicyTraceDetail
      >;
      expect(details.size).toBe(2);
      expect(details.get("policy-a")).toEqual({
        action: "HIT",
        data: { key: "k1" },
      });
      expect(details.get("policy-b")).toEqual({
        action: "rejected",
        data: { reason: "invalid" },
      });
    });

    await app.request("/test");
  });

  it("should allow calling trace without data", async () => {
    const app = createApp(true, (c) => {
      const trace = policyTrace(c as Context, "simple");
      trace("passed");

      const details = c.get(TRACE_DETAILS_KEY) as Map<
        string,
        PolicyTraceDetail
      >;
      expect(details.get("simple")).toEqual({
        action: "passed",
        data: undefined,
      });
    });

    await app.request("/test");
  });

  it("should overwrite previous detail on repeated calls", async () => {
    const app = createApp(true, (c) => {
      const trace = policyTrace(c as Context, "cache");
      trace("MISS", { key: "k1" });
      trace("HIT", { key: "k1" });

      const details = c.get(TRACE_DETAILS_KEY) as Map<
        string,
        PolicyTraceDetail
      >;
      expect(details.get("cache")!.action).toBe("HIT");
    });

    await app.request("/test");
  });
});

describe("isTraceRequested()", () => {
  it("should return false when trace is not requested", async () => {
    const app = createApp(false, (c) => {
      expect(isTraceRequested(c as Context)).toBe(false);
    });

    await app.request("/test");
  });

  it("should return true when trace is requested", async () => {
    const app = createApp(true, (c) => {
      expect(isTraceRequested(c as Context)).toBe(true);
    });

    await app.request("/test");
  });
});

describe("noopTraceReporter", () => {
  it("should be callable without error", () => {
    expect(() => noopTraceReporter("test")).not.toThrow();
    expect(() => noopTraceReporter("test", { key: "val" })).not.toThrow();
  });
});
