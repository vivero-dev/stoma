import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryMetricsCollector, toPrometheusText } from "../metrics";

describe("InMemoryMetricsCollector", () => {
  let collector: InMemoryMetricsCollector;

  beforeEach(() => {
    collector = new InMemoryMetricsCollector();
  });

  // --- Counter ---

  it("should increment a counter by 1 by default", () => {
    collector.increment("requests");
    const snap = collector.snapshot();
    expect(snap.counters.requests).toHaveLength(1);
    expect(snap.counters.requests[0].value).toBe(1);
  });

  it("should increment a counter by a custom value", () => {
    collector.increment("requests", 5);
    const snap = collector.snapshot();
    expect(snap.counters.requests[0].value).toBe(5);
  });

  it("should accumulate counter increments", () => {
    collector.increment("requests", 3);
    collector.increment("requests", 7);
    const snap = collector.snapshot();
    expect(snap.counters.requests[0].value).toBe(10);
  });

  it("should track counters with different tags separately", () => {
    collector.increment("requests", 1, { method: "GET" });
    collector.increment("requests", 1, { method: "POST" });
    collector.increment("requests", 1, { method: "GET" });
    const snap = collector.snapshot();
    expect(snap.counters.requests).toHaveLength(2);
    const get = snap.counters.requests.find((e) => e.tags?.method === "GET");
    const post = snap.counters.requests.find((e) => e.tags?.method === "POST");
    expect(get?.value).toBe(2);
    expect(post?.value).toBe(1);
  });

  it("should track counter without tags", () => {
    collector.increment("total");
    const snap = collector.snapshot();
    expect(snap.counters.total[0].tags).toBeUndefined();
  });

  // --- Histogram ---

  it("should record histogram observations", () => {
    collector.histogram("duration", 100);
    collector.histogram("duration", 200);
    const snap = collector.snapshot();
    expect(snap.histograms.duration).toHaveLength(1);
    expect(snap.histograms.duration[0].values).toEqual([100, 200]);
  });

  it("should track histogram with different tags separately", () => {
    collector.histogram("duration", 50, { path: "/a" });
    collector.histogram("duration", 100, { path: "/b" });
    collector.histogram("duration", 75, { path: "/a" });
    const snap = collector.snapshot();
    expect(snap.histograms.duration).toHaveLength(2);
    const a = snap.histograms.duration.find((e) => e.tags?.path === "/a");
    expect(a?.values).toEqual([50, 75]);
  });

  // --- Gauge ---

  it("should set gauge to absolute value", () => {
    collector.gauge("connections", 42);
    const snap = collector.snapshot();
    expect(snap.gauges.connections[0].value).toBe(42);
  });

  it("should overwrite gauge on repeated set", () => {
    collector.gauge("connections", 10);
    collector.gauge("connections", 25);
    const snap = collector.snapshot();
    expect(snap.gauges.connections).toHaveLength(1);
    expect(snap.gauges.connections[0].value).toBe(25);
  });

  it("should track gauges with different tags separately", () => {
    collector.gauge("memory", 100, { zone: "us" });
    collector.gauge("memory", 200, { zone: "eu" });
    const snap = collector.snapshot();
    expect(snap.gauges.memory).toHaveLength(2);
  });

  // --- Snapshot ---

  it("should return empty snapshot initially", () => {
    const snap = collector.snapshot();
    expect(snap.counters).toEqual({});
    expect(snap.histograms).toEqual({});
    expect(snap.gauges).toEqual({});
  });

  it("should return all metric types in snapshot", () => {
    collector.increment("counter");
    collector.histogram("hist", 10);
    collector.gauge("gauge", 5);
    const snap = collector.snapshot();
    expect(Object.keys(snap.counters)).toContain("counter");
    expect(Object.keys(snap.histograms)).toContain("hist");
    expect(Object.keys(snap.gauges)).toContain("gauge");
  });

  // --- Reset ---

  it("should clear all metrics on reset", () => {
    collector.increment("requests", 5);
    collector.histogram("duration", 100);
    collector.gauge("active", 3);
    collector.reset();
    const snap = collector.snapshot();
    expect(snap.counters).toEqual({});
    expect(snap.histograms).toEqual({});
    expect(snap.gauges).toEqual({});
  });

  // --- Tag key stability ---

  it("should merge counters with same tags in different order", () => {
    collector.increment("requests", 1, { method: "GET", status: "200" });
    collector.increment("requests", 1, { status: "200", method: "GET" });
    const snap = collector.snapshot();
    expect(snap.counters.requests).toHaveLength(1);
    expect(snap.counters.requests[0].value).toBe(2);
  });
});

describe("toPrometheusText", () => {
  it("should format counters", () => {
    const text = toPrometheusText({
      counters: {
        requests_total: [{ value: 42, tags: { method: "GET" } }],
      },
      histograms: {},
      gauges: {},
    });
    expect(text).toContain("# TYPE requests_total counter");
    expect(text).toContain('requests_total{method="GET"} 42');
  });

  it("should format histograms with sum and count", () => {
    const text = toPrometheusText({
      counters: {},
      histograms: {
        duration_ms: [{ values: [100, 200, 300], tags: { path: "/api" } }],
      },
      gauges: {},
    });
    expect(text).toContain("# TYPE duration_ms histogram");
    expect(text).toContain('duration_ms_sum{path="/api"} 600');
    expect(text).toContain('duration_ms_count{path="/api"} 3');
  });

  it("should format gauges", () => {
    const text = toPrometheusText({
      counters: {},
      histograms: {},
      gauges: {
        active_connections: [{ value: 10 }],
      },
    });
    expect(text).toContain("# TYPE active_connections gauge");
    expect(text).toContain("active_connections 10");
  });

  it("should format metrics without tags", () => {
    const text = toPrometheusText({
      counters: { total: [{ value: 5 }] },
      histograms: {},
      gauges: {},
    });
    expect(text).toContain("total 5");
    expect(text).not.toContain("{");
  });

  it("should handle empty snapshot", () => {
    const text = toPrometheusText({
      counters: {},
      histograms: {},
      gauges: {},
    });
    expect(text).toBe("");
  });

  it("should sort labels alphabetically", () => {
    const text = toPrometheusText({
      counters: {
        req: [{ value: 1, tags: { z: "1", a: "2" } }],
      },
      histograms: {},
      gauges: {},
    });
    expect(text).toContain('req{a="2",z="1"} 1');
  });
});
