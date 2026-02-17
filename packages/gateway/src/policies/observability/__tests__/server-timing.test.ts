import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { createContextInjector } from "../../../core/pipeline";
import { serverTiming } from "../server-timing";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type PolicyTimingEntry = { name: string; durationMs: number };

// Realistic inclusive (onion-model) timings as produced by policiesToMiddleware().
// Ordered innermost-first: rate-limit finishes first, then jwt-auth, then cors.
// Each entry's durationMs includes all downstream policies + upstream.
const SAMPLE_TIMINGS: PolicyTimingEntry[] = [
  { name: "rate-limit", durationMs: 3.2 }, // innermost: self=3.2 (includes upstream)
  { name: "jwt-auth", durationMs: 15.9 }, // self=15.9-3.2=12.7
  { name: "cors", durationMs: 16.0 }, // self=16.0-15.9=0.1
];

/**
 * Build a test app with the server-timing policy.
 *
 * An optional `timings` array is injected via middleware to simulate
 * the `_policyTimings` data that policiesToMiddleware() normally sets.
 */
function createApp(
  config?: Parameters<typeof serverTiming>[0],
  opts?: {
    timings?: PolicyTimingEntry[];
    debugHeaders?: boolean;
  }
) {
  const app = new Hono();
  const injector = createContextInjector(
    "test-gw",
    "/test",
    undefined,
    undefined,
    undefined,
    opts?.debugHeaders
  );
  const policy = serverTiming(config);

  app.use("/*", injector);

  // Inject fake policy timings before the server-timing policy runs
  if (opts?.timings) {
    const timingsMiddleware = async (
      c: { set: (key: string, value: unknown) => void },
      next: () => Promise<void>
    ) => {
      c.set("_policyTimings", opts.timings);
      await next();
    };
    app.use(
      "/*",
      timingsMiddleware as Parameters<typeof Hono.prototype.use>[1]
    );
  }

  app.use("/*", policy.handler);
  app.get("/test", (c) => c.json({ ok: true }));

  return { app, policy };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("serverTiming", () => {
  // -- Metadata -------------------------------------------------------------

  it("should have name 'server-timing' and priority 1", () => {
    const policy = serverTiming();
    expect(policy.name).toBe("server-timing");
    expect(policy.priority).toBe(1);
  });

  // -- Visibility: always ---------------------------------------------------

  describe('visibility: "always"', () => {
    it("should emit headers without debug request header", async () => {
      const { app } = createApp(
        { visibility: "always" },
        { timings: SAMPLE_TIMINGS }
      );

      const res = await app.request("/test");
      expect(res.status).toBe(200);
      expect(res.headers.get("server-timing")).toBeTruthy();
      expect(res.headers.get("x-response-time")).toBeTruthy();
    });
  });

  // -- Visibility: debug-only (default) ------------------------------------

  describe('visibility: "debug-only" (default)', () => {
    it("should NOT emit headers when no debug header is sent", async () => {
      const { app } = createApp(
        undefined, // default visibility = debug-only
        { timings: SAMPLE_TIMINGS, debugHeaders: true }
      );

      const res = await app.request("/test");
      expect(res.status).toBe(200);
      expect(res.headers.get("server-timing")).toBeNull();
      expect(res.headers.get("x-response-time")).toBeNull();
    });

    it("should emit headers when x-stoma-debug request header is sent", async () => {
      const { app } = createApp(undefined, {
        timings: SAMPLE_TIMINGS,
        debugHeaders: true,
      });

      const res = await app.request("/test", {
        headers: { "x-stoma-debug": "*" },
      });
      expect(res.status).toBe(200);
      expect(res.headers.get("server-timing")).toBeTruthy();
      expect(res.headers.get("x-response-time")).toBeTruthy();
    });
  });

  // -- Visibility: conditional ----------------------------------------------

  describe('visibility: "conditional"', () => {
    it("should emit headers when visibilityFn returns true", async () => {
      const { app } = createApp(
        {
          visibility: "conditional",
          visibilityFn: () => true,
        },
        { timings: SAMPLE_TIMINGS }
      );

      const res = await app.request("/test");
      expect(res.status).toBe(200);
      expect(res.headers.get("server-timing")).toBeTruthy();
    });

    it("should NOT emit headers when visibilityFn returns false", async () => {
      const { app } = createApp(
        {
          visibility: "conditional",
          visibilityFn: () => false,
        },
        { timings: SAMPLE_TIMINGS }
      );

      const res = await app.request("/test");
      expect(res.status).toBe(200);
      expect(res.headers.get("server-timing")).toBeNull();
      expect(res.headers.get("x-response-time")).toBeNull();
    });

    it("should support async visibilityFn", async () => {
      const { app } = createApp(
        {
          visibility: "conditional",
          visibilityFn: async () => true,
        },
        { timings: SAMPLE_TIMINGS }
      );

      const res = await app.request("/test");
      expect(res.headers.get("server-timing")).toBeTruthy();
    });
  });

  // -- Server-Timing format -------------------------------------------------

  describe("Server-Timing header format", () => {
    it("should include per-policy entries", async () => {
      const { app } = createApp(
        { visibility: "always", includeTotal: false },
        { timings: SAMPLE_TIMINGS }
      );

      const res = await app.request("/test");
      const header = res.headers.get("server-timing")!;
      expect(header).toContain("cors;dur=");
      expect(header).toContain("jwt-auth;dur=");
      expect(header).toContain("rate-limit;dur=");
    });

    it("should include a total entry by default", async () => {
      const { app } = createApp(
        { visibility: "always" },
        { timings: SAMPLE_TIMINGS }
      );

      const res = await app.request("/test");
      const header = res.headers.get("server-timing")!;
      expect(header).toMatch(/total;dur=\d/);
    });

    it("should omit total when includeTotal=false", async () => {
      const { app } = createApp(
        { visibility: "always", includeTotal: false },
        { timings: SAMPLE_TIMINGS }
      );

      const res = await app.request("/test");
      const header = res.headers.get("server-timing")!;
      expect(header).not.toContain("total;");
    });

    it("should respect precision config", async () => {
      const { app } = createApp(
        { visibility: "always", precision: 3, includeTotal: false },
        { timings: [{ name: "test-policy", durationMs: 1.23456 }] }
      );

      const res = await app.request("/test");
      const header = res.headers.get("server-timing")!;
      expect(header).toBe("test-policy;dur=1.235");
    });

    it("should include descriptions from descriptionFn", async () => {
      const { app } = createApp(
        {
          visibility: "always",
          includeTotal: false,
          descriptionFn: (name) => `Policy: ${name}`,
        },
        { timings: [{ name: "cors", durationMs: 0.5 }] }
      );

      const res = await app.request("/test");
      const header = res.headers.get("server-timing")!;
      expect(header).toContain('desc="Policy: cors"');
    });

    it("should emit self-time, not inclusive onion-model time", async () => {
      const { app } = createApp(
        { visibility: "always", includeTotal: false },
        { timings: SAMPLE_TIMINGS }
      );

      const res = await app.request("/test");
      const header = res.headers.get("server-timing")!;

      // Parse durations from the header
      const durations: Record<string, number> = {};
      for (const entry of header.split(",")) {
        const parts = entry.trim().split(";");
        const name = parts[0];
        const durPart = parts.find((p) => p.trim().startsWith("dur="));
        if (name && durPart) {
          durations[name] = Number.parseFloat(durPart.trim().slice(4));
        }
      }

      // Self-times computed from inclusive timings:
      //   cors_self = 16.0 - 15.9 = 0.1
      //   jwt-auth_self = 15.9 - 3.2 = 12.7
      //   rate-limit_self = 3.2 (innermost)
      expect(durations.cors).toBeCloseTo(0.1, 1);
      expect(durations["jwt-auth"]).toBeCloseTo(12.7, 1);
      expect(durations["rate-limit"]).toBeCloseTo(3.2, 1);
    });

    it("should output in execution order (outermost first)", async () => {
      const { app } = createApp(
        { visibility: "always", includeTotal: false },
        { timings: SAMPLE_TIMINGS }
      );

      const res = await app.request("/test");
      const header = res.headers.get("server-timing")!;
      const names = header.split(",").map((e) => e.trim().split(";")[0]);

      // Execution order: cors (outermost, priority 5) → jwt-auth → rate-limit (innermost)
      expect(names).toEqual(["cors", "jwt-auth", "rate-limit"]);
    });

    it("should show correct self-time for slow-endpoint scenario", async () => {
      // Simulates: cors wraps timeout, both show ~1000ms inclusive
      const slowTimings: PolicyTimingEntry[] = [
        { name: "timeout", durationMs: 1000 }, // innermost
        { name: "cors", durationMs: 1000 }, // wraps timeout
      ];
      const { app } = createApp(
        { visibility: "always", includeTotal: false },
        { timings: slowTimings }
      );

      const res = await app.request("/test");
      const header = res.headers.get("server-timing")!;

      const durations: Record<string, number> = {};
      for (const entry of header.split(",")) {
        const parts = entry.trim().split(";");
        const name = parts[0];
        const durPart = parts.find((p) => p.trim().startsWith("dur="));
        if (name && durPart) {
          durations[name] = Number.parseFloat(durPart.trim().slice(4));
        }
      }

      // cors self-time should be ~0, timeout should be ~1000
      expect(durations.cors).toBeCloseTo(0, 0);
      expect(durations.timeout).toBeCloseTo(1000, 0);
    });

    it("should sanitize metric names with invalid characters", async () => {
      const { app } = createApp(
        { visibility: "always", includeTotal: false },
        { timings: [{ name: "my.policy/v2", durationMs: 1 }] }
      );

      const res = await app.request("/test");
      const header = res.headers.get("server-timing")!;
      expect(header).toContain("my_policy_v2;dur=");
    });
  });

  // -- X-Response-Time header -----------------------------------------------

  describe("X-Response-Time header", () => {
    it("should emit with ms suffix", async () => {
      const { app } = createApp({ visibility: "always" });

      const res = await app.request("/test");
      const header = res.headers.get("x-response-time")!;
      expect(header).toMatch(/^\d+\.\d+ms$/);
    });

    it("should respect precision", async () => {
      const { app } = createApp({ visibility: "always", precision: 0 });

      const res = await app.request("/test");
      const header = res.headers.get("x-response-time")!;
      expect(header).toMatch(/^\d+ms$/);
    });
  });

  // -- Config toggles -------------------------------------------------------

  describe("config toggles", () => {
    it("should not emit Server-Timing when serverTimingHeader=false", async () => {
      const { app } = createApp(
        { visibility: "always", serverTimingHeader: false },
        { timings: SAMPLE_TIMINGS }
      );

      const res = await app.request("/test");
      expect(res.headers.get("server-timing")).toBeNull();
      expect(res.headers.get("x-response-time")).toBeTruthy();
    });

    it("should not emit X-Response-Time when responseTimeHeader=false", async () => {
      const { app } = createApp(
        { visibility: "always", responseTimeHeader: false },
        { timings: SAMPLE_TIMINGS }
      );

      const res = await app.request("/test");
      expect(res.headers.get("server-timing")).toBeTruthy();
      expect(res.headers.get("x-response-time")).toBeNull();
    });
  });

  // -- Validation -----------------------------------------------------------

  describe("validation", () => {
    it("should throw when visibility=conditional without visibilityFn", () => {
      expect(() => serverTiming({ visibility: "conditional" })).toThrow(
        'visibility "conditional" requires a visibilityFn'
      );
    });
  });

  // -- Edge cases -----------------------------------------------------------

  describe("edge cases", () => {
    it("should handle empty timings array", async () => {
      const { app } = createApp(
        { visibility: "always", includeTotal: false },
        { timings: [] }
      );

      const res = await app.request("/test");
      // No per-policy entries and no total → no header
      expect(res.headers.get("server-timing")).toBeNull();
      expect(res.headers.get("x-response-time")).toBeTruthy();
    });

    it("should handle undefined timings (no pipeline instrumentation)", async () => {
      const { app } = createApp({ visibility: "always" });

      const res = await app.request("/test");
      // Still emits total entry
      const header = res.headers.get("server-timing")!;
      expect(header).toMatch(/total;dur=\d/);
      expect(res.headers.get("x-response-time")).toBeTruthy();
    });

    it("should handle skip condition", async () => {
      const { app } = createApp(
        { visibility: "always", skip: () => true },
        { timings: SAMPLE_TIMINGS }
      );

      const res = await app.request("/test");
      expect(res.headers.get("server-timing")).toBeNull();
      expect(res.headers.get("x-response-time")).toBeNull();
    });

    it("should not break the request pipeline", async () => {
      const { app } = createApp(
        { visibility: "always" },
        { timings: SAMPLE_TIMINGS }
      );

      const res = await app.request("/test");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ ok: true });
    });
  });
});
