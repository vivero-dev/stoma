import { describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import { createPolicyTestHarness } from "@homegrower-club/stoma/sdk";
import { analyticsLog } from "../analytics.js";
import { ANALYTICS_TYPE, type AnalyticsEntry } from "../../types.js";

describe("analyticsLog policy", () => {
  it("should emit an analytics entry via the default sink", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const { request } = createPolicyTestHarness(analyticsLog());
    const res = await request("/test");

    expect(res.status).toBe(200);
    expect(logSpy).toHaveBeenCalledOnce();

    const logged = JSON.parse(logSpy.mock.calls[0][0]) as AnalyticsEntry;
    expect(logged._type).toBe(ANALYTICS_TYPE);
    expect(logged.method).toBe("GET");
    expect(logged.statusCode).toBe(200);
    expect(typeof logged.durationMs).toBe("number");
    expect(typeof logged.timestamp).toBe("string");

    logSpy.mockRestore();
  });

  it("should use a custom sink when provided", async () => {
    const entries: AnalyticsEntry[] = [];
    const sink = (entry: AnalyticsEntry) => entries.push(entry);

    const { request } = createPolicyTestHarness(analyticsLog({ sink }));
    await request("/hello");

    expect(entries).toHaveLength(1);
    expect(entries[0]._type).toBe(ANALYTICS_TYPE);
  });

  it("should include static dimensions", async () => {
    const entries: AnalyticsEntry[] = [];

    const { request } = createPolicyTestHarness(
      analyticsLog({
        dimensions: { env: "test", region: "us-east-1" },
        sink: (e) => entries.push(e),
      })
    );

    await request("/test");

    expect(entries[0].dimensions).toEqual({
      env: "test",
      region: "us-east-1",
    });
  });

  it("should include dynamic dimensions from extractDimensions", async () => {
    const entries: AnalyticsEntry[] = [];

    const { request } = createPolicyTestHarness(
      analyticsLog({
        extractDimensions: (c) => ({
          userAgent: c.req.header("user-agent") ?? "unknown",
        }),
        sink: (e) => entries.push(e),
      })
    );

    await request("/test", {
      headers: { "User-Agent": "test-bot/1.0" },
    });

    expect(entries[0].dimensions).toEqual({
      userAgent: "test-bot/1.0",
    });
  });

  it("should merge static and dynamic dimensions", async () => {
    const entries: AnalyticsEntry[] = [];

    const { request } = createPolicyTestHarness(
      analyticsLog({
        dimensions: { env: "staging" },
        extractDimensions: () => ({ version: "v2" }),
        sink: (e) => entries.push(e),
      })
    );

    await request("/test");

    expect(entries[0].dimensions).toEqual({
      env: "staging",
      version: "v2",
    });
  });

  it("should extract dimensions from Hono context via get()", async () => {
    const entries: AnalyticsEntry[] = [];
    const policy = analyticsLog({
      extractDimensions: (c) => ({
        plan: String(c.get("plan") ?? "free"),
      }),
      sink: (e) => entries.push(e),
    });

    // Build a raw Hono app to inject a context value before the policy
    const app = new Hono<{ Variables: { plan: string } }>();
    app.use("/*", async (c, next) => {
      c.set("plan", "pro");
      await next();
    });
    app.use("/*", policy.handler);
    app.all("/*", (c) => c.json({ ok: true }));

    await app.request("/test");

    expect(entries).toHaveLength(1);
    expect(entries[0].dimensions).toEqual({ plan: "pro" });
  });

  it("should not break the request on sink failure", async () => {
    const sink = () => {
      throw new Error("sink exploded");
    };

    const { request } = createPolicyTestHarness(analyticsLog({ sink }));
    const res = await request("/test");

    expect(res.status).toBe(200);
  });

  it("should record correct status code for non-200 responses", async () => {
    const entries: AnalyticsEntry[] = [];

    const { request } = createPolicyTestHarness(
      analyticsLog({ sink: (e) => entries.push(e) }),
      {
        upstream: async (c) => {
          return c.json({ error: "not found" }, 404);
        },
      }
    );

    await request("/missing");

    expect(entries[0].statusCode).toBe(404);
  });

  it("should not include requestId, path, or clientIp (those belong in request logs)", async () => {
    const entries: AnalyticsEntry[] = [];

    const { request } = createPolicyTestHarness(
      analyticsLog({ sink: (e) => entries.push(e) })
    );

    await request("/test", {
      headers: { "cf-connecting-ip": "1.2.3.4" },
    });

    const entry = entries[0] as unknown as Record<string, unknown>;
    expect(entry.requestId).toBeUndefined();
    expect(entry.path).toBeUndefined();
    expect(entry.clientIp).toBeUndefined();
  });

  it("should include routePath from gateway context", async () => {
    const entries: AnalyticsEntry[] = [];

    const { request } = createPolicyTestHarness(
      analyticsLog({ sink: (e) => entries.push(e) })
    );

    await request("/test");

    expect(typeof entries[0].routePath).toBe("string");
  });

  it("should include responseSize", async () => {
    const entries: AnalyticsEntry[] = [];

    const { request } = createPolicyTestHarness(
      analyticsLog({ sink: (e) => entries.push(e) })
    );

    await request("/test");

    expect(typeof entries[0].responseSize).toBe("number");
  });

  it("should omit dimensions when none are set", async () => {
    const entries: AnalyticsEntry[] = [];

    const { request } = createPolicyTestHarness(
      analyticsLog({ sink: (e) => entries.push(e) })
    );

    await request("/test");

    expect(entries[0].dimensions).toBeUndefined();
  });

  it("should handle POST requests", async () => {
    const entries: AnalyticsEntry[] = [];

    const { request } = createPolicyTestHarness(
      analyticsLog({ sink: (e) => entries.push(e) })
    );

    await request("/test", { method: "POST" });

    expect(entries[0].method).toBe("POST");
  });
});
