/**
 * Lightweight OpenTelemetry-compatible tracing for edge runtimes.
 *
 * Provides span creation, OTLP/HTTP JSON export via `fetch()`, and
 * head-based sampling - all without any runtime dependencies beyond
 * the Web Platform APIs available in Cloudflare Workers.
 *
 * Follows the OTel data model but uses own lightweight types to avoid
 * pulling in `@opentelemetry/api` (which is not edge-compatible).
 *
 * @module tracing
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SpanKind = "SERVER" | "CLIENT" | "INTERNAL";
export type SpanStatusCode = "UNSET" | "OK" | "ERROR";

/** An immutable representation of a completed span. */
export interface ReadableSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind: SpanKind;
  startTimeMs: number;
  endTimeMs: number;
  attributes: Record<string, string | number | boolean>;
  status: { code: SpanStatusCode; message?: string };
  events: SpanEvent[];
}

/** A timestamped event recorded during a span's lifetime. */
export interface SpanEvent {
  name: string;
  timeMs: number;
  attributes?: Record<string, string | number | boolean>;
}

/**
 * Pluggable span exporter interface.
 *
 * Implementations ship completed spans to a backend (OTLP collector,
 * console, or any custom destination). Export is expected to be called
 * via `waitUntil()` so it does not block the response.
 */
export interface SpanExporter {
  export(spans: ReadableSpan[]): Promise<void>;
  shutdown?(): Promise<void>;
}

/** Configuration for gateway-level tracing. */
export interface TracingConfig {
  exporter: SpanExporter;
  serviceName?: string;
  serviceVersion?: string;
  /** Head-based sampling rate [0.0, 1.0]. Default: 1.0 */
  sampleRate?: number;
}

// ---------------------------------------------------------------------------
// Semantic Conventions (HTTP subset)
// ---------------------------------------------------------------------------

/**
 * OTel semantic convention attribute keys (HTTP subset).
 *
 * Uses the stable HTTP semconv names from the OpenTelemetry specification.
 * @see https://opentelemetry.io/docs/specs/semconv/http/
 */
export const SemConv = {
  HTTP_METHOD: "http.request.method",
  HTTP_ROUTE: "http.route",
  HTTP_STATUS_CODE: "http.response.status_code",
  URL_PATH: "url.path",
  SERVER_ADDRESS: "server.address",
} as const;

// ---------------------------------------------------------------------------
// SpanBuilder
// ---------------------------------------------------------------------------

/**
 * Mutable span builder - accumulates attributes, events, and status
 * during a request lifecycle. Call {@link end} to produce an immutable
 * {@link ReadableSpan}.
 */
export class SpanBuilder {
  private _attributes: Record<string, string | number | boolean> = {};
  private _events: SpanEvent[] = [];
  private _status: { code: SpanStatusCode; message?: string } = {
    code: "UNSET",
  };
  private _endTimeMs?: number;

  constructor(
    public readonly name: string,
    public readonly kind: SpanKind,
    public readonly traceId: string,
    public readonly spanId: string,
    public readonly parentSpanId?: string,
    public readonly startTimeMs: number = Date.now()
  ) {}

  /** Set a single attribute. Chainable. */
  setAttribute(key: string, value: string | number | boolean): this {
    this._attributes[key] = value;
    return this;
  }

  /** Record a timestamped event with optional attributes. Chainable. */
  addEvent(
    name: string,
    attributes?: Record<string, string | number | boolean>
  ): this {
    this._events.push({ name, timeMs: Date.now(), attributes });
    return this;
  }

  /** Set the span status. Chainable. */
  setStatus(code: SpanStatusCode, message?: string): this {
    this._status = { code, message };
    return this;
  }

  /**
   * Finalize the span and return an immutable {@link ReadableSpan}.
   *
   * Sets `endTimeMs` on first call; subsequent calls return the same
   * snapshot with defensive copies of mutable fields.
   */
  end(): ReadableSpan {
    this._endTimeMs = this._endTimeMs ?? Date.now();
    return {
      traceId: this.traceId,
      spanId: this.spanId,
      parentSpanId: this.parentSpanId,
      name: this.name,
      kind: this.kind,
      startTimeMs: this.startTimeMs,
      endTimeMs: this._endTimeMs,
      attributes: { ...this._attributes },
      status: { ...this._status },
      events: [...this._events],
    };
  }
}

// ---------------------------------------------------------------------------
// OTLP JSON helpers
// ---------------------------------------------------------------------------

/** Map SpanKind to OTLP numeric kind. */
const SPAN_KIND_MAP: Record<SpanKind, number> = {
  INTERNAL: 1, // SPAN_KIND_INTERNAL
  SERVER: 2, // SPAN_KIND_SERVER
  CLIENT: 3, // SPAN_KIND_CLIENT
};

/** Map SpanStatusCode to OTLP numeric status code. */
const STATUS_CODE_MAP: Record<SpanStatusCode, number> = {
  UNSET: 0, // STATUS_CODE_UNSET
  OK: 1, // STATUS_CODE_OK
  ERROR: 2, // STATUS_CODE_ERROR
};

/**
 * Convert an attribute value to the OTLP `AnyValue` wire format.
 *
 * @returns Object with exactly one of `stringValue`, `intValue`, or `boolValue`.
 */
function toOtlpAttributeValue(
  value: string | number | boolean
): Record<string, string | number | boolean> {
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { boolValue: value };
  // OTLP distinguishes int vs double; we use intValue for integers.
  if (Number.isInteger(value)) return { intValue: value };
  return { doubleValue: value };
}

/** Convert a flat attributes map to the OTLP `KeyValue[]` format. */
function toOtlpAttributes(
  attrs: Record<string, string | number | boolean>
): Array<{ key: string; value: Record<string, string | number | boolean> }> {
  return Object.entries(attrs).map(([key, value]) => ({
    key,
    value: toOtlpAttributeValue(value),
  }));
}

/** Milliseconds to nanoseconds, returned as a string (OTLP convention). */
function msToNanos(ms: number): string {
  // Avoid BigInt for maximum runtime compatibility; ms precision is
  // sufficient and fits safely in a JS number when multiplied by 1e6.
  return String(ms * 1_000_000);
}

/**
 * Convert an array of {@link ReadableSpan} to the OTLP JSON wire format.
 *
 * Produces the `ExportTraceServiceRequest` structure:
 * `{ resourceSpans: [{ resource, scopeSpans: [{ scope, spans }] }] }`
 *
 * @see https://opentelemetry.io/docs/specs/otlp/#otlphttp-request
 */
function toOtlpPayload(
  spans: ReadableSpan[],
  serviceName: string,
  serviceVersion?: string
): object {
  const resourceAttributes: Array<{
    key: string;
    value: Record<string, string | number | boolean>;
  }> = [{ key: "service.name", value: { stringValue: serviceName } }];

  if (serviceVersion) {
    resourceAttributes.push({
      key: "service.version",
      value: { stringValue: serviceVersion },
    });
  }

  const otlpSpans = spans.map((span) => {
    const otlpSpan: Record<string, unknown> = {
      traceId: span.traceId,
      spanId: span.spanId,
      name: span.name,
      kind: SPAN_KIND_MAP[span.kind],
      startTimeUnixNano: msToNanos(span.startTimeMs),
      endTimeUnixNano: msToNanos(span.endTimeMs),
      attributes: toOtlpAttributes(span.attributes),
      status: {
        code: STATUS_CODE_MAP[span.status.code],
        ...(span.status.message ? { message: span.status.message } : {}),
      },
      events: span.events.map((event) => ({
        name: event.name,
        timeUnixNano: msToNanos(event.timeMs),
        ...(event.attributes
          ? { attributes: toOtlpAttributes(event.attributes) }
          : {}),
      })),
    };

    if (span.parentSpanId) {
      otlpSpan.parentSpanId = span.parentSpanId;
    }

    return otlpSpan;
  });

  return {
    resourceSpans: [
      {
        resource: { attributes: resourceAttributes },
        scopeSpans: [
          {
            scope: { name: "stoma-gateway" },
            spans: otlpSpans,
          },
        ],
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Built-in Exporters
// ---------------------------------------------------------------------------

/**
 * OTLP/HTTP JSON span exporter.
 *
 * Ships spans to an OpenTelemetry Collector (or compatible endpoint)
 * using `fetch()` with the OTLP JSON encoding. Designed for edge
 * runtimes - no gRPC, no protobuf, no Node.js dependencies.
 *
 * Export calls should be dispatched via `waitUntil()` so they do not
 * block the response path.
 */
export class OTLPSpanExporter implements SpanExporter {
  private readonly endpoint: string;
  private readonly headers: Record<string, string>;
  private readonly timeoutMs: number;
  private readonly serviceName: string;
  private readonly serviceVersion?: string;

  constructor(config: {
    endpoint: string;
    headers?: Record<string, string>;
    timeoutMs?: number;
    serviceName?: string;
    serviceVersion?: string;
  }) {
    this.endpoint = config.endpoint;
    this.headers = config.headers ?? {};
    this.timeoutMs = config.timeoutMs ?? 10_000;
    this.serviceName = config.serviceName ?? "stoma-gateway";
    this.serviceVersion = config.serviceVersion;
  }

  async export(spans: ReadableSpan[]): Promise<void> {
    if (spans.length === 0) return;

    const payload = toOtlpPayload(spans, this.serviceName, this.serviceVersion);

    await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...this.headers,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(this.timeoutMs),
    });
  }
}

/**
 * Console span exporter for development and debugging.
 *
 * Logs each span to `console.debug()` with a compact one-line format
 * showing name, kind, duration, trace/span IDs, and status.
 */
export class ConsoleSpanExporter implements SpanExporter {
  async export(spans: ReadableSpan[]): Promise<void> {
    for (const span of spans) {
      console.debug(
        `[trace] ${span.name} ${span.kind} ${span.endTimeMs - span.startTimeMs}ms` +
          ` trace=${span.traceId} span=${span.spanId}` +
          (span.parentSpanId ? ` parent=${span.parentSpanId}` : "") +
          ` status=${span.status.code}`
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Sampling
// ---------------------------------------------------------------------------

/**
 * Determine whether a request should be sampled based on the configured rate.
 *
 * @param sampleRate - Sampling probability in [0.0, 1.0].
 * @returns `true` if the request should be traced.
 */
export function shouldSample(sampleRate: number): boolean {
  if (sampleRate >= 1.0) return true;
  if (sampleRate <= 0.0) return false;
  return Math.random() < sampleRate;
}

// ---------------------------------------------------------------------------
// ID Generation
// ---------------------------------------------------------------------------

/**
 * Generate a 16-character lowercase hex span ID (8 random bytes).
 *
 * Uses `crypto.getRandomValues()` which is available in all edge runtimes
 * (Cloudflare Workers, Deno, Bun, Node 19+).
 */
export function generateOtelSpanId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
