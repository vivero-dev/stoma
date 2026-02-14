/**
 * Performance tests for the policy trace system.
 *
 * Verifies that trace instrumentation adds negligible overhead to the
 * normal (non-tracing) request path. Runs batches of requests through
 * a realistic multi-policy pipeline with and without the `x-stoma-debug:
 * trace` header and asserts the overhead stays within bounds.
 *
 * These are NOT micro-benchmarks - they run in the workerd test pool
 * alongside the rest of the test suite. They exist to catch regressions,
 * not to produce publishable numbers.
 */

import type { Context } from "hono";
import { describe, expect, it } from "vitest";
import { Priority } from "../../policies/sdk";
import type { Policy } from "../../policies/types";
import { createGateway } from "../gateway";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function echoHandler(c: Context) {
  return c.json({ ok: true });
}

/** Simulates a realistic pipeline with several priority layers. */
function buildPolicies(): Policy[] {
  return [
    {
      name: "early-policy",
      priority: Priority.EARLY,
      handler: async (_c, next) => {
        await next();
      },
    },
    {
      name: "auth-policy",
      priority: Priority.AUTH,
      handler: async (_c, next) => {
        await next();
      },
    },
    {
      name: "rate-limit-policy",
      priority: Priority.RATE_LIMIT,
      handler: async (_c, next) => {
        await next();
      },
    },
    {
      name: "cache-policy",
      priority: Priority.CACHE,
      handler: async (_c, next) => {
        await next();
      },
    },
    {
      name: "transform-policy",
      priority: Priority.REQUEST_TRANSFORM,
      handler: async (_c, next) => {
        await next();
      },
    },
  ];
}

/**
 * Run `count` sequential requests and return the median duration in ms.
 * Uses `Date.now()` (ms precision) which is sufficient for batch timing.
 */
async function measureMedian(
  app: {
    request: (path: string, init?: RequestInit) => Response | Promise<Response>;
  },
  path: string,
  headers: Record<string, string> | undefined,
  count: number
): Promise<number> {
  const durations: number[] = [];
  for (let i = 0; i < count; i++) {
    const start = Date.now();
    await app.request(path, headers ? { headers } : undefined);
    durations.push(Date.now() - start);
  }
  durations.sort((a, b) => a - b);
  return durations[Math.floor(durations.length / 2)];
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Policy Trace - performance", () => {
  // Shared gateway for all perf tests - constructed once with debug + trace
  // support enabled so the activation path depends only on the request header.
  const gw = createGateway({
    debugHeaders: true,
    routes: [
      {
        path: "/perf",
        pipeline: {
          policies: buildPolicies(),
          upstream: { type: "handler", handler: echoHandler },
        },
      },
    ],
  });

  const WARMUP = 50;
  const ITERATIONS = 200;

  it("should add <2ms median overhead per request with 5-policy pipeline", async () => {
    // Warm up JIT / hidden classes
    for (let i = 0; i < WARMUP; i++) {
      await gw.app.request("/perf");
      await gw.app.request("/perf", { headers: { "x-stoma-debug": "trace" } });
    }

    // Measure baseline (no tracing)
    const baselineMs = await measureMedian(
      gw.app,
      "/perf",
      undefined,
      ITERATIONS
    );

    // Measure with tracing active
    const tracingMs = await measureMedian(
      gw.app,
      "/perf",
      { "x-stoma-debug": "trace" },
      ITERATIONS
    );

    const overheadMs = tracingMs - baselineMs;

    // The overhead should be less than 2ms per request for a 5-policy pipeline.
    // In practice it's usually <0.5ms, but we use a generous bound to avoid
    // flaky failures in CI where workerd cold starts can add jitter.
    expect(overheadMs).toBeLessThan(2);
  });

  it("should produce no x-stoma-trace header on the non-tracing path", async () => {
    const res = await gw.app.request("/perf");
    expect(res.status).toBe(200);
    expect(res.headers.get("x-stoma-trace")).toBeNull();
  });

  it("should produce x-stoma-trace header on the tracing path", async () => {
    const res = await gw.app.request("/perf", {
      headers: { "x-stoma-debug": "trace" },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("x-stoma-trace")).not.toBeNull();
  });

  it("should handle 500 sequential traced requests without degradation", async () => {
    const count = 500;
    const durations: number[] = [];

    for (let i = 0; i < count; i++) {
      const start = Date.now();
      const res = await gw.app.request("/perf", {
        headers: { "x-stoma-debug": "trace" },
      });
      durations.push(Date.now() - start);
      expect(res.status).toBe(200);
    }

    // Compare first quartile to last quartile - latency should not grow
    // over time (no memory leak / unbounded accumulation).
    const q1Slice = durations.slice(0, Math.floor(count / 4));
    const q4Slice = durations.slice(Math.floor((count * 3) / 4));
    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

    const q1Avg = avg(q1Slice);
    const q4Avg = avg(q4Slice);

    // Last quarter should not be more than 2x the first quarter.
    // A growing ratio would indicate a leak or accumulation issue.
    expect(q4Avg).toBeLessThan(Math.max(q1Avg * 2, 2));
  });

  it("should keep trace JSON payload under 4KB for a 5-policy pipeline", async () => {
    const res = await gw.app.request("/perf", {
      headers: { "x-stoma-debug": "trace" },
    });

    const traceHeader = res.headers.get("x-stoma-trace")!;
    expect(traceHeader).toBeDefined();

    // Trace header size should be reasonable - under 4KB for 5 policies.
    // Large trace payloads bloat response headers and can hit header size limits.
    const byteLength = new TextEncoder().encode(traceHeader).byteLength;
    expect(byteLength).toBeLessThan(4096);
  });
});
