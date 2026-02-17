import { Hono } from "hono";
import { beforeEach, describe, expect, it } from "vitest";
import { createContextInjector } from "../../../core/pipeline";
import { InMemoryMetricsCollector } from "../../../observability/metrics";
import { metricsReporter } from "../metrics-reporter";

describe("metricsReporter", () => {
  let collector: InMemoryMetricsCollector;

  beforeEach(() => {
    collector = new InMemoryMetricsCollector();
  });

  function createApp(
    extraMiddleware?: Parameters<typeof Hono.prototype.use>[1]
  ) {
    const app = new Hono();
    const injector = createContextInjector("test-gw", "/test");
    const reporter = metricsReporter({ collector });

    app.use("/*", injector);
    if (extraMiddleware) {
      app.use("/*", extraMiddleware);
    }
    app.use("/*", reporter.handler);
    app.get("/test", (c) => c.json({ ok: true }));
    app.post("/test", (c) => c.json({ ok: true }, 201));
    app.get("/error", (c) => c.json({ error: "not found" }, 404));
    app.get("/server-error", (c) => c.json({ error: "fail" }, 500));

    return app;
  }

  it("should have name 'metrics-reporter' and priority 1", () => {
    const policy = metricsReporter({ collector });
    expect(policy.name).toBe("metrics-reporter");
    expect(policy.priority).toBe(1);
  });

  it("should increment gateway_requests_total on each request", async () => {
    const app = createApp();
    await app.request("/test");

    const snap = collector.snapshot();
    expect(snap.counters.gateway_requests_total).toBeDefined();
    expect(snap.counters.gateway_requests_total[0].value).toBe(1);
  });

  it("should record gateway_request_duration_ms histogram", async () => {
    const app = createApp();
    await app.request("/test");

    const snap = collector.snapshot();
    expect(snap.histograms.gateway_request_duration_ms).toBeDefined();
    expect(snap.histograms.gateway_request_duration_ms[0].values).toHaveLength(
      1
    );
    expect(
      snap.histograms.gateway_request_duration_ms[0].values[0]
    ).toBeGreaterThanOrEqual(0);
  });

  it("should tag metrics with method, path, status, gateway", async () => {
    const app = createApp();
    await app.request("/test");

    const snap = collector.snapshot();
    const tags = snap.counters.gateway_requests_total[0].tags;
    expect(tags?.method).toBe("GET");
    expect(tags?.path).toBe("/test");
    expect(tags?.status).toBe("200");
    expect(tags?.gateway).toBe("test-gw");
  });

  it("should increment error counter for 4xx responses", async () => {
    const app = createApp();
    await app.request("/error");

    const snap = collector.snapshot();
    expect(snap.counters.gateway_request_errors_total).toBeDefined();
    expect(snap.counters.gateway_request_errors_total[0].value).toBe(1);
    expect(snap.counters.gateway_request_errors_total[0].tags?.status).toBe(
      "404"
    );
  });

  it("should increment error counter for 5xx responses", async () => {
    const app = createApp();
    await app.request("/server-error");

    const snap = collector.snapshot();
    expect(snap.counters.gateway_request_errors_total).toBeDefined();
    expect(snap.counters.gateway_request_errors_total[0].tags?.status).toBe(
      "500"
    );
  });

  it("should not increment error counter for 2xx responses", async () => {
    const app = createApp();
    await app.request("/test");

    const snap = collector.snapshot();
    expect(snap.counters.gateway_request_errors_total).toBeUndefined();
  });

  it("should accumulate counts across multiple requests", async () => {
    const app = createApp();
    await app.request("/test");
    await app.request("/test");
    await app.request("/test");

    const snap = collector.snapshot();
    expect(snap.counters.gateway_requests_total[0].value).toBe(3);
    expect(snap.histograms.gateway_request_duration_ms[0].values).toHaveLength(
      3
    );
  });

  it("should distinguish different methods in tags", async () => {
    const app = createApp();
    await app.request("/test", { method: "GET" });
    await app.request("/test", { method: "POST" });

    const snap = collector.snapshot();
    expect(snap.counters.gateway_requests_total).toHaveLength(2);
  });

  it("should record per-policy timing when available", async () => {
    // Simulate a policy that sets _policyTimings
    const fakePolicyMiddleware = async (
      c: { set: (key: string, value: unknown) => void },
      next: () => Promise<void>
    ) => {
      c.set("_policyTimings", [
        { name: "jwt-auth", durationMs: 5 },
        { name: "rate-limit", durationMs: 2 },
      ]);
      await next();
    };

    const app = createApp(
      fakePolicyMiddleware as Parameters<typeof Hono.prototype.use>[1]
    );
    await app.request("/test");

    const snap = collector.snapshot();
    expect(snap.histograms.gateway_policy_duration_ms).toBeDefined();
    // Two policy timings recorded
    expect(
      snap.histograms.gateway_policy_duration_ms.length
    ).toBeGreaterThanOrEqual(2);
  });

  it("should merge tags assigned by assignMetrics", async () => {
    const setMetricTags = async (
      c: { set: (key: string, value: unknown) => void },
      next: () => Promise<void>
    ) => {
      c.set("_metricsTags", { region: "us-east-1", service: "api" });
      await next();
    };

    const app = createApp(
      setMetricTags as Parameters<typeof Hono.prototype.use>[1]
    );
    await app.request("/test");

    const snap = collector.snapshot();
    const requestTags = snap.counters.gateway_requests_total[0].tags;
    expect(requestTags?.region).toBe("us-east-1");
    expect(requestTags?.service).toBe("api");

    const policyTags = snap.histograms.gateway_request_duration_ms[0].tags;
    expect(policyTags?.region).toBe("us-east-1");
    expect(policyTags?.service).toBe("api");
  });

  it("should handle requests with no gateway context gracefully", async () => {
    const app = new Hono();
    const reporter = metricsReporter({ collector });

    // No context injector - context will be undefined
    app.use("/*", reporter.handler);
    app.get("/test", (c) => c.json({ ok: true }));

    const res = await app.request("/test");
    expect(res.status).toBe(200);

    const snap = collector.snapshot();
    expect(snap.counters.gateway_requests_total[0].tags?.gateway).toBe(
      "unknown"
    );
  });

  it("should not break the request pipeline", async () => {
    const app = createApp();
    const res = await app.request("/test");

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });
});
