import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ConsoleSpanExporter,
  generateOtelSpanId,
  OTLPSpanExporter,
  type ReadableSpan,
  SemConv,
  SpanBuilder,
  shouldSample,
} from "../tracing";

/** Captured fetch call arguments. */
interface CapturedFetch {
  url: string | URL | Request;
  init?: RequestInit;
}

// ---------------------------------------------------------------------------
// SpanBuilder
// ---------------------------------------------------------------------------

describe("SpanBuilder", () => {
  it("should create a span with all constructor args and return correct ReadableSpan", () => {
    const builder = new SpanBuilder(
      "GET /users",
      "SERVER",
      "abcdef1234567890abcdef1234567890",
      "1234567890abcdef",
      "fedcba0987654321",
      1000
    );

    const span = builder.end();

    expect(span.name).toBe("GET /users");
    expect(span.kind).toBe("SERVER");
    expect(span.traceId).toBe("abcdef1234567890abcdef1234567890");
    expect(span.spanId).toBe("1234567890abcdef");
    expect(span.parentSpanId).toBe("fedcba0987654321");
    expect(span.startTimeMs).toBe(1000);
    expect(span.endTimeMs).toBeGreaterThanOrEqual(1000);
    expect(span.attributes).toEqual({});
    expect(span.status).toEqual({ code: "UNSET" });
    expect(span.events).toEqual([]);
  });

  it("should default startTimeMs to Date.now() when not provided", () => {
    const before = Date.now();
    const builder = new SpanBuilder(
      "test",
      "INTERNAL",
      "abcdef1234567890abcdef1234567890",
      "1234567890abcdef"
    );
    const after = Date.now();

    expect(builder.startTimeMs).toBeGreaterThanOrEqual(before);
    expect(builder.startTimeMs).toBeLessThanOrEqual(after);
  });

  it("should omit parentSpanId when not provided", () => {
    const builder = new SpanBuilder(
      "root",
      "SERVER",
      "abcdef1234567890abcdef1234567890",
      "1234567890abcdef"
    );
    const span = builder.end();
    expect(span.parentSpanId).toBeUndefined();
  });

  it("should chain setAttribute calls correctly", () => {
    const builder = new SpanBuilder(
      "test",
      "SERVER",
      "abcdef1234567890abcdef1234567890",
      "1234567890abcdef"
    );

    const result = builder
      .setAttribute("http.method", "GET")
      .setAttribute("http.status_code", 200)
      .setAttribute("cache.hit", true);

    // Chainable - returns same instance
    expect(result).toBe(builder);

    const span = builder.end();
    expect(span.attributes).toEqual({
      "http.method": "GET",
      "http.status_code": 200,
      "cache.hit": true,
    });
  });

  it("should overwrite attributes with the same key", () => {
    const builder = new SpanBuilder(
      "test",
      "SERVER",
      "abcdef1234567890abcdef1234567890",
      "1234567890abcdef"
    );

    builder.setAttribute("key", "first").setAttribute("key", "second");

    const span = builder.end();
    expect(span.attributes.key).toBe("second");
  });

  it("should record events with timestamps via addEvent", () => {
    const builder = new SpanBuilder(
      "test",
      "SERVER",
      "abcdef1234567890abcdef1234567890",
      "1234567890abcdef"
    );

    const before = Date.now();
    builder.addEvent("cache.miss");
    builder.addEvent("db.query", { table: "users", rows: 42 });
    const after = Date.now();

    const span = builder.end();
    expect(span.events).toHaveLength(2);

    expect(span.events[0].name).toBe("cache.miss");
    expect(span.events[0].timeMs).toBeGreaterThanOrEqual(before);
    expect(span.events[0].timeMs).toBeLessThanOrEqual(after);
    expect(span.events[0].attributes).toBeUndefined();

    expect(span.events[1].name).toBe("db.query");
    expect(span.events[1].attributes).toEqual({ table: "users", rows: 42 });
  });

  it("should set status to UNSET by default", () => {
    const builder = new SpanBuilder(
      "test",
      "SERVER",
      "abcdef1234567890abcdef1234567890",
      "1234567890abcdef"
    );
    const span = builder.end();
    expect(span.status).toEqual({ code: "UNSET" });
  });

  it("should set status OK without message", () => {
    const builder = new SpanBuilder(
      "test",
      "SERVER",
      "abcdef1234567890abcdef1234567890",
      "1234567890abcdef"
    );
    builder.setStatus("OK");
    const span = builder.end();
    expect(span.status).toEqual({ code: "OK" });
  });

  it("should set status ERROR with message", () => {
    const builder = new SpanBuilder(
      "test",
      "SERVER",
      "abcdef1234567890abcdef1234567890",
      "1234567890abcdef"
    );
    builder.setStatus("ERROR", "Connection refused");
    const span = builder.end();
    expect(span.status).toEqual({
      code: "ERROR",
      message: "Connection refused",
    });
  });

  it("should return defensive copies of attributes and events from end()", () => {
    const builder = new SpanBuilder(
      "test",
      "SERVER",
      "abcdef1234567890abcdef1234567890",
      "1234567890abcdef"
    );

    builder.setAttribute("key", "value");
    builder.addEvent("event1");

    const span = builder.end();

    // Mutating the returned span should not affect subsequent calls
    span.attributes.key = "mutated";
    span.events.push({ name: "injected", timeMs: 0 });

    const span2 = builder.end();
    expect(span2.attributes.key).toBe("value");
    expect(span2.events).toHaveLength(1);
    expect(span2.events[0].name).toBe("event1");
  });

  it("should return consistent endTimeMs across multiple end() calls", () => {
    const builder = new SpanBuilder(
      "test",
      "SERVER",
      "abcdef1234567890abcdef1234567890",
      "1234567890abcdef",
      undefined,
      1000
    );

    const span1 = builder.end();
    const span2 = builder.end();

    expect(span1.endTimeMs).toBe(span2.endTimeMs);
  });
});

// ---------------------------------------------------------------------------
// OTLPSpanExporter
// ---------------------------------------------------------------------------

describe("OTLPSpanExporter", () => {
  const originalFetch = globalThis.fetch;
  let fetchCalls: CapturedFetch[];

  beforeEach(() => {
    fetchCalls = [];
    globalThis.fetch = (async (
      input: RequestInfo | URL,
      init?: RequestInit
    ) => {
      fetchCalls.push({ url: input as string | URL | Request, init });
      return new Response("", { status: 200 });
    }) as typeof globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function makeSpan(overrides?: Partial<ReadableSpan>): ReadableSpan {
    return {
      traceId: "aaaa0000bbbb1111cccc2222dddd3333",
      spanId: "1111222233334444",
      name: "GET /api/test",
      kind: "SERVER",
      startTimeMs: 1000,
      endTimeMs: 1050,
      attributes: {},
      status: { code: "OK" },
      events: [],
      ...overrides,
    };
  }

  it("should not call fetch when spans array is empty", async () => {
    const exporter = new OTLPSpanExporter({
      endpoint: "https://collector.example.com/v1/traces",
    });

    await exporter.export([]);
    expect(fetchCalls).toHaveLength(0);
  });

  it("should send correct OTLP JSON payload structure", async () => {
    const exporter = new OTLPSpanExporter({
      endpoint: "https://collector.example.com/v1/traces",
      serviceName: "my-api",
      serviceVersion: "1.2.3",
    });

    await exporter.export([makeSpan()]);

    expect(fetchCalls).toHaveLength(1);
    expect(fetchCalls[0].url).toBe("https://collector.example.com/v1/traces");
    expect(fetchCalls[0].init?.method).toBe("POST");

    const body = JSON.parse(fetchCalls[0].init?.body as string);

    // Top-level structure: resourceSpans
    expect(body.resourceSpans).toHaveLength(1);
    const rs = body.resourceSpans[0];

    // Resource with service.name and service.version
    expect(rs.resource.attributes).toContainEqual({
      key: "service.name",
      value: { stringValue: "my-api" },
    });
    expect(rs.resource.attributes).toContainEqual({
      key: "service.version",
      value: { stringValue: "1.2.3" },
    });

    // scopeSpans
    expect(rs.scopeSpans).toHaveLength(1);
    expect(rs.scopeSpans[0].scope.name).toBe("stoma-gateway");

    // Spans
    const spans = rs.scopeSpans[0].spans;
    expect(spans).toHaveLength(1);
    expect(spans[0].traceId).toBe("aaaa0000bbbb1111cccc2222dddd3333");
    expect(spans[0].spanId).toBe("1111222233334444");
    expect(spans[0].name).toBe("GET /api/test");
  });

  it("should use default serviceName when not configured", async () => {
    const exporter = new OTLPSpanExporter({
      endpoint: "https://collector.example.com/v1/traces",
    });

    await exporter.export([makeSpan()]);

    const body = JSON.parse(fetchCalls[0].init?.body as string);
    expect(body.resourceSpans[0].resource.attributes).toContainEqual({
      key: "service.name",
      value: { stringValue: "stoma-gateway" },
    });
  });

  it("should not include service.version when not configured", async () => {
    const exporter = new OTLPSpanExporter({
      endpoint: "https://collector.example.com/v1/traces",
    });

    await exporter.export([makeSpan()]);

    const body = JSON.parse(fetchCalls[0].init?.body as string);
    const attrs = body.resourceSpans[0].resource.attributes;
    expect(
      attrs.find((a: { key: string }) => a.key === "service.version")
    ).toBeUndefined();
  });

  it("should map SpanKind correctly (SERVER=2, CLIENT=3, INTERNAL=1)", async () => {
    const exporter = new OTLPSpanExporter({
      endpoint: "https://collector.example.com/v1/traces",
    });

    await exporter.export([
      makeSpan({ kind: "SERVER" }),
      makeSpan({ kind: "CLIENT", spanId: "aaaa222233334444" }),
      makeSpan({ kind: "INTERNAL", spanId: "bbbb222233334444" }),
    ]);

    const body = JSON.parse(fetchCalls[0].init?.body as string);
    const spans = body.resourceSpans[0].scopeSpans[0].spans;

    expect(spans[0].kind).toBe(2); // SERVER
    expect(spans[1].kind).toBe(3); // CLIENT
    expect(spans[2].kind).toBe(1); // INTERNAL
  });

  it("should map SpanStatusCode correctly (UNSET=0, OK=1, ERROR=2)", async () => {
    const exporter = new OTLPSpanExporter({
      endpoint: "https://collector.example.com/v1/traces",
    });

    await exporter.export([
      makeSpan({ status: { code: "UNSET" } }),
      makeSpan({ status: { code: "OK" }, spanId: "aaaa222233334444" }),
      makeSpan({
        status: { code: "ERROR", message: "timeout" },
        spanId: "bbbb222233334444",
      }),
    ]);

    const body = JSON.parse(fetchCalls[0].init?.body as string);
    const spans = body.resourceSpans[0].scopeSpans[0].spans;

    expect(spans[0].status.code).toBe(0);
    expect(spans[1].status.code).toBe(1);
    expect(spans[2].status.code).toBe(2);
    expect(spans[2].status.message).toBe("timeout");
  });

  it("should format attributes in OTLP format with correct value types", async () => {
    const exporter = new OTLPSpanExporter({
      endpoint: "https://collector.example.com/v1/traces",
    });

    await exporter.export([
      makeSpan({
        attributes: {
          "http.method": "GET",
          "http.status_code": 200,
          "cache.hit": true,
          "response.time": 1.5,
        },
      }),
    ]);

    const body = JSON.parse(fetchCalls[0].init?.body as string);
    const attrs = body.resourceSpans[0].scopeSpans[0].spans[0].attributes;

    expect(attrs).toContainEqual({
      key: "http.method",
      value: { stringValue: "GET" },
    });
    expect(attrs).toContainEqual({
      key: "http.status_code",
      value: { intValue: 200 },
    });
    expect(attrs).toContainEqual({
      key: "cache.hit",
      value: { boolValue: true },
    });
    expect(attrs).toContainEqual({
      key: "response.time",
      value: { doubleValue: 1.5 },
    });
  });

  it("should convert timestamps from ms to nanoseconds as strings", async () => {
    const exporter = new OTLPSpanExporter({
      endpoint: "https://collector.example.com/v1/traces",
    });

    await exporter.export([makeSpan({ startTimeMs: 1000, endTimeMs: 1050 })]);

    const body = JSON.parse(fetchCalls[0].init?.body as string);
    const span = body.resourceSpans[0].scopeSpans[0].spans[0];

    expect(span.startTimeUnixNano).toBe("1000000000");
    expect(span.endTimeUnixNano).toBe("1050000000");
  });

  it("should include parentSpanId when present", async () => {
    const exporter = new OTLPSpanExporter({
      endpoint: "https://collector.example.com/v1/traces",
    });

    await exporter.export([makeSpan({ parentSpanId: "aaaa0000bbbb1111" })]);

    const body = JSON.parse(fetchCalls[0].init?.body as string);
    const span = body.resourceSpans[0].scopeSpans[0].spans[0];

    expect(span.parentSpanId).toBe("aaaa0000bbbb1111");
  });

  it("should omit parentSpanId when not present", async () => {
    const exporter = new OTLPSpanExporter({
      endpoint: "https://collector.example.com/v1/traces",
    });

    await exporter.export([makeSpan()]);

    const body = JSON.parse(fetchCalls[0].init?.body as string);
    const span = body.resourceSpans[0].scopeSpans[0].spans[0];

    expect(span.parentSpanId).toBeUndefined();
  });

  it("should include events in OTLP format", async () => {
    const exporter = new OTLPSpanExporter({
      endpoint: "https://collector.example.com/v1/traces",
    });

    await exporter.export([
      makeSpan({
        events: [
          { name: "cache.miss", timeMs: 1010 },
          {
            name: "db.query",
            timeMs: 1020,
            attributes: { table: "users" },
          },
        ],
      }),
    ]);

    const body = JSON.parse(fetchCalls[0].init?.body as string);
    const events = body.resourceSpans[0].scopeSpans[0].spans[0].events;

    expect(events).toHaveLength(2);
    expect(events[0].name).toBe("cache.miss");
    expect(events[0].timeUnixNano).toBe("1010000000");
    expect(events[0].attributes).toBeUndefined();

    expect(events[1].name).toBe("db.query");
    expect(events[1].timeUnixNano).toBe("1020000000");
    expect(events[1].attributes).toContainEqual({
      key: "table",
      value: { stringValue: "users" },
    });
  });

  it("should pass custom headers through to fetch", async () => {
    const exporter = new OTLPSpanExporter({
      endpoint: "https://collector.example.com/v1/traces",
      headers: {
        Authorization: "Bearer token123",
        "X-Custom": "custom-value",
      },
    });

    await exporter.export([makeSpan()]);

    const headers = fetchCalls[0].init?.headers as Record<string, string>;
    expect(headers["content-type"]).toBe("application/json");
    expect(headers.Authorization).toBe("Bearer token123");
    expect(headers["X-Custom"]).toBe("custom-value");
  });

  it("should pass an AbortSignal for timeout", async () => {
    const exporter = new OTLPSpanExporter({
      endpoint: "https://collector.example.com/v1/traces",
      timeoutMs: 5000,
    });

    await exporter.export([makeSpan()]);

    const signal = fetchCalls[0].init?.signal;
    expect(signal).toBeDefined();
    expect(signal).toBeInstanceOf(AbortSignal);
  });
});

// ---------------------------------------------------------------------------
// ConsoleSpanExporter
// ---------------------------------------------------------------------------

describe("ConsoleSpanExporter", () => {
  let debugSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
  });

  afterEach(() => {
    debugSpy.mockRestore();
  });

  it("should log each span to console.debug", async () => {
    const exporter = new ConsoleSpanExporter();

    await exporter.export([
      {
        traceId: "aaaa0000bbbb1111cccc2222dddd3333",
        spanId: "1111222233334444",
        name: "GET /api",
        kind: "SERVER",
        startTimeMs: 1000,
        endTimeMs: 1042,
        attributes: {},
        status: { code: "OK" },
        events: [],
      },
    ]);

    expect(debugSpy).toHaveBeenCalledOnce();
    const message = debugSpy.mock.calls[0][0] as string;
    expect(message).toContain("[trace]");
    expect(message).toContain("GET /api");
    expect(message).toContain("SERVER");
    expect(message).toContain("42ms");
    expect(message).toContain("trace=aaaa0000bbbb1111cccc2222dddd3333");
    expect(message).toContain("span=1111222233334444");
    expect(message).toContain("status=OK");
  });

  it("should include parentSpanId when present", async () => {
    const exporter = new ConsoleSpanExporter();

    await exporter.export([
      {
        traceId: "aaaa0000bbbb1111cccc2222dddd3333",
        spanId: "1111222233334444",
        parentSpanId: "5555666677778888",
        name: "db.query",
        kind: "CLIENT",
        startTimeMs: 1000,
        endTimeMs: 1010,
        attributes: {},
        status: { code: "OK" },
        events: [],
      },
    ]);

    const message = debugSpy.mock.calls[0][0] as string;
    expect(message).toContain("parent=5555666677778888");
  });

  it("should omit parentSpanId when not present", async () => {
    const exporter = new ConsoleSpanExporter();

    await exporter.export([
      {
        traceId: "aaaa0000bbbb1111cccc2222dddd3333",
        spanId: "1111222233334444",
        name: "root",
        kind: "SERVER",
        startTimeMs: 1000,
        endTimeMs: 1010,
        attributes: {},
        status: { code: "OK" },
        events: [],
      },
    ]);

    const message = debugSpy.mock.calls[0][0] as string;
    expect(message).not.toContain("parent=");
  });

  it("should log multiple spans", async () => {
    const exporter = new ConsoleSpanExporter();

    await exporter.export([
      {
        traceId: "aaaa0000bbbb1111cccc2222dddd3333",
        spanId: "1111222233334444",
        name: "span-1",
        kind: "SERVER",
        startTimeMs: 1000,
        endTimeMs: 1010,
        attributes: {},
        status: { code: "OK" },
        events: [],
      },
      {
        traceId: "aaaa0000bbbb1111cccc2222dddd3333",
        spanId: "5555666677778888",
        name: "span-2",
        kind: "CLIENT",
        startTimeMs: 1000,
        endTimeMs: 1020,
        attributes: {},
        status: { code: "ERROR" },
        events: [],
      },
    ]);

    expect(debugSpy).toHaveBeenCalledTimes(2);
    expect(debugSpy.mock.calls[0][0] as string).toContain("span-1");
    expect(debugSpy.mock.calls[1][0] as string).toContain("span-2");
  });
});

// ---------------------------------------------------------------------------
// shouldSample
// ---------------------------------------------------------------------------

describe("shouldSample", () => {
  it("should always return true for rate 1.0", () => {
    for (let i = 0; i < 100; i++) {
      expect(shouldSample(1.0)).toBe(true);
    }
  });

  it("should always return true for rate > 1.0", () => {
    expect(shouldSample(1.5)).toBe(true);
    expect(shouldSample(100)).toBe(true);
  });

  it("should always return false for rate 0.0", () => {
    for (let i = 0; i < 100; i++) {
      expect(shouldSample(0.0)).toBe(false);
    }
  });

  it("should always return false for rate < 0.0", () => {
    expect(shouldSample(-0.5)).toBe(false);
    expect(shouldSample(-1)).toBe(false);
  });

  it("should return both true and false for rate 0.5 over many calls", () => {
    let trueCount = 0;
    let falseCount = 0;
    const iterations = 1000;

    for (let i = 0; i < iterations; i++) {
      if (shouldSample(0.5)) {
        trueCount++;
      } else {
        falseCount++;
      }
    }

    // With 1000 iterations at 0.5, expect both to be significantly above 0.
    // Using a generous margin to avoid flaky tests.
    expect(trueCount).toBeGreaterThan(100);
    expect(falseCount).toBeGreaterThan(100);
  });
});

// ---------------------------------------------------------------------------
// generateOtelSpanId
// ---------------------------------------------------------------------------

describe("generateOtelSpanId", () => {
  it("should return a 16-character hex string", () => {
    const id = generateOtelSpanId();
    expect(id).toMatch(/^[0-9a-f]{16}$/);
  });

  it("should return exactly 16 characters", () => {
    const id = generateOtelSpanId();
    expect(id).toHaveLength(16);
  });

  it("should generate unique IDs across multiple calls", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateOtelSpanId());
    }
    // With 8 random bytes (2^64 possibilities), 100 calls should all be unique.
    expect(ids.size).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// SemConv
// ---------------------------------------------------------------------------

describe("SemConv", () => {
  it("should have HTTP_METHOD matching OTel spec", () => {
    expect(SemConv.HTTP_METHOD).toBe("http.request.method");
  });

  it("should have HTTP_ROUTE matching OTel spec", () => {
    expect(SemConv.HTTP_ROUTE).toBe("http.route");
  });

  it("should have HTTP_STATUS_CODE matching OTel spec", () => {
    expect(SemConv.HTTP_STATUS_CODE).toBe("http.response.status_code");
  });

  it("should have URL_PATH matching OTel spec", () => {
    expect(SemConv.URL_PATH).toBe("url.path");
  });

  it("should have SERVER_ADDRESS matching OTel spec", () => {
    expect(SemConv.SERVER_ADDRESS).toBe("server.address");
  });
});
