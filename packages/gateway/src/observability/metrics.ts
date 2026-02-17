/**
 * Pluggable metrics collection for the gateway pipeline.
 *
 * Defines the {@link MetricsCollector} interface and provides an
 * {@link InMemoryMetricsCollector} for testing and development.
 * The {@link toPrometheusText} function serializes a snapshot to
 * Prometheus text exposition format.
 *
 * @module metrics
 */

/** A single tagged metric data point. */
export interface TaggedValue {
  value: number;
  tags?: Record<string, string>;
}

/** A histogram data point with accumulated values. */
export interface HistogramEntry {
  values: number[];
  tags?: Record<string, string>;
}

/** Point-in-time snapshot of all collected metrics. */
export interface MetricsSnapshot {
  counters: Record<string, TaggedValue[]>;
  histograms: Record<string, HistogramEntry[]>;
  gauges: Record<string, TaggedValue[]>;
}

/**
 * Pluggable metrics collector interface.
 *
 * Implementations can ship metrics to Prometheus, Datadog, CloudWatch,
 * or any other backend. The gateway pipeline records request counts,
 * latencies, and error rates through this interface.
 */
export interface MetricsCollector {
  /** Increment a counter by `value` (default 1). */
  increment(name: string, value?: number, tags?: Record<string, string>): void;
  /** Record a histogram observation. */
  histogram(name: string, value: number, tags?: Record<string, string>): void;
  /** Set a gauge to an absolute value. */
  gauge(name: string, value: number, tags?: Record<string, string>): void;
  /** Return a point-in-time snapshot of all metrics. */
  snapshot(): MetricsSnapshot;
  /** Reset all metrics to zero. */
  reset(): void;
}

/**
 * Serialize a tag map to a stable sorted key for deduplication.
 * Tags are sorted alphabetically to ensure consistent keys.
 */
function tagKey(tags?: Record<string, string>): string {
  if (!tags || Object.keys(tags).length === 0) return "";
  return Object.entries(tags)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join(",");
}

/**
 * In-memory metrics collector for testing, development, and admin API.
 *
 * Accumulates counters, histograms, and gauges in plain arrays/maps.
 * Not intended for high-throughput production use - prefer shipping
 * metrics to a dedicated backend for production workloads.
 */
export class InMemoryMetricsCollector implements MetricsCollector {
  private counters = new Map<string, Map<string, TaggedValue>>();
  private histograms = new Map<string, Map<string, HistogramEntry>>();
  private gauges = new Map<string, Map<string, TaggedValue>>();

  increment(name: string, value = 1, tags?: Record<string, string>): void {
    const key = tagKey(tags);
    let metricMap = this.counters.get(name);
    if (!metricMap) {
      metricMap = new Map();
      this.counters.set(name, metricMap);
    }
    const existing = metricMap.get(key);
    if (existing) {
      existing.value += value;
    } else {
      metricMap.set(key, { value, tags });
    }
  }

  histogram(name: string, value: number, tags?: Record<string, string>): void {
    const key = tagKey(tags);
    let metricMap = this.histograms.get(name);
    if (!metricMap) {
      metricMap = new Map();
      this.histograms.set(name, metricMap);
    }
    const existing = metricMap.get(key);
    if (existing) {
      existing.values.push(value);
    } else {
      metricMap.set(key, { values: [value], tags });
    }
  }

  gauge(name: string, value: number, tags?: Record<string, string>): void {
    const key = tagKey(tags);
    let metricMap = this.gauges.get(name);
    if (!metricMap) {
      metricMap = new Map();
      this.gauges.set(name, metricMap);
    }
    metricMap.set(key, { value, tags });
  }

  snapshot(): MetricsSnapshot {
    const snap: MetricsSnapshot = {
      counters: {},
      histograms: {},
      gauges: {},
    };

    for (const [name, metricMap] of this.counters) {
      snap.counters[name] = Array.from(metricMap.values());
    }
    for (const [name, metricMap] of this.histograms) {
      snap.histograms[name] = Array.from(metricMap.values());
    }
    for (const [name, metricMap] of this.gauges) {
      snap.gauges[name] = Array.from(metricMap.values());
    }

    return snap;
  }

  reset(): void {
    this.counters.clear();
    this.histograms.clear();
    this.gauges.clear();
  }
}

/**
 * Serialize a metrics snapshot to Prometheus text exposition format.
 *
 * Produces lines like:
 * ```
 * gateway_requests_total{method="GET",status="200"} 42
 * gateway_request_duration_ms_sum{method="GET"} 1234
 * gateway_request_duration_ms_count{method="GET"} 10
 * ```
 *
 * @param snapshot - The metrics snapshot to serialize.
 * @returns Prometheus text exposition format string.
 */
export function toPrometheusText(snapshot: MetricsSnapshot): string {
  const lines: string[] = [];

  // Counters
  for (const [name, entries] of Object.entries(snapshot.counters)) {
    lines.push(`# TYPE ${name} counter`);
    for (const entry of entries) {
      lines.push(`${name}${formatLabels(entry.tags)} ${entry.value}`);
    }
  }

  // Histograms - emit sum and count
  for (const [name, entries] of Object.entries(snapshot.histograms)) {
    lines.push(`# TYPE ${name} histogram`);
    for (const entry of entries) {
      const labels = formatLabels(entry.tags);
      const sum = entry.values.reduce((a, b) => a + b, 0);
      const count = entry.values.length;
      lines.push(`${name}_sum${labels} ${sum}`);
      lines.push(`${name}_count${labels} ${count}`);
    }
  }

  // Gauges
  for (const [name, entries] of Object.entries(snapshot.gauges)) {
    lines.push(`# TYPE ${name} gauge`);
    for (const entry of entries) {
      lines.push(`${name}${formatLabels(entry.tags)} ${entry.value}`);
    }
  }

  return lines.join("\n");
}

/** Escape a label value per Prometheus exposition format spec. */
function escapeLabelValue(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");
}

function formatLabels(tags?: Record<string, string>): string {
  if (!tags || Object.keys(tags).length === 0) return "";
  const parts = Object.entries(tags)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}="${escapeLabelValue(v)}"`);
  return `{${parts.join(",")}}`;
}
