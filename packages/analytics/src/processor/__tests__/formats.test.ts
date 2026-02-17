import { describe, expect, it } from "vitest";
import { ANALYTICS_TYPE, type AnalyticsEntry } from "../../types.js";
import { parseCloudflareEvent } from "../formats/cloudflare.js";
import { parseStandardLine } from "../formats/standard.js";

function makeEntry(overrides?: Partial<AnalyticsEntry>): AnalyticsEntry {
  return {
    _type: ANALYTICS_TYPE,
    timestamp: "2026-02-15T00:00:00.000Z",
    gatewayName: "test-gw",
    routePath: "/api/*",
    method: "GET",
    statusCode: 200,
    durationMs: 42,
    responseSize: 1024,
    ...overrides,
  };
}

describe("parseStandardLine", () => {
  it("should parse a valid analytics entry", () => {
    const entry = makeEntry();
    const result = parseStandardLine(JSON.stringify(entry));
    expect(result).toEqual(entry);
  });

  it("should return null for empty lines", () => {
    expect(parseStandardLine("")).toBeNull();
    expect(parseStandardLine("  \n  ")).toBeNull();
  });

  it("should return null for invalid JSON", () => {
    expect(parseStandardLine("{not json")).toBeNull();
  });

  it("should return null for wrong _type", () => {
    const line = JSON.stringify({ _type: "other", foo: "bar" });
    expect(parseStandardLine(line)).toBeNull();
  });

  it("should return null for missing required fields", () => {
    const partial = { _type: ANALYTICS_TYPE, timestamp: "now" };
    expect(parseStandardLine(JSON.stringify(partial))).toBeNull();
  });

  it("should parse entries with optional traceId", () => {
    const entry = makeEntry({ traceId: "abc123" });
    const result = parseStandardLine(JSON.stringify(entry));
    expect(result?.traceId).toBe("abc123");
  });

  it("should parse entries with dimensions", () => {
    const entry = makeEntry({ dimensions: { region: "us-east-1" } });
    const result = parseStandardLine(JSON.stringify(entry));
    expect(result?.dimensions).toEqual({ region: "us-east-1" });
  });
});

describe("parseCloudflareEvent", () => {
  it("should extract analytics entries from Workers Trace Events", () => {
    const entry = makeEntry();
    const traceEvent = {
      Event: { Request: {} },
      Logs: [
        {
          Level: "log",
          Message: [JSON.stringify(entry)],
          TimestampMs: Date.now(),
        },
      ],
      Outcome: "ok",
    };

    const results = parseCloudflareEvent(JSON.stringify(traceEvent));
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(entry);
  });

  it("should extract multiple entries from a single trace event", () => {
    const entry1 = makeEntry({ statusCode: 200 });
    const entry2 = makeEntry({ statusCode: 404 });
    const traceEvent = {
      Logs: [
        { Level: "log", Message: [JSON.stringify(entry1)] },
        { Level: "log", Message: [JSON.stringify(entry2)] },
      ],
    };

    const results = parseCloudflareEvent(JSON.stringify(traceEvent));
    expect(results).toHaveLength(2);
  });

  it("should skip non-analytics log messages", () => {
    const traceEvent = {
      Logs: [
        { Level: "log", Message: ["plain text log"] },
        { Level: "log", Message: [JSON.stringify({ _type: "other" })] },
        {
          Level: "log",
          Message: [JSON.stringify(makeEntry())],
        },
      ],
    };

    const results = parseCloudflareEvent(JSON.stringify(traceEvent));
    expect(results).toHaveLength(1);
  });

  it("should handle object messages (not just strings)", () => {
    const entry = makeEntry();
    const traceEvent = {
      Logs: [{ Level: "log", Message: [entry] }],
    };

    const results = parseCloudflareEvent(JSON.stringify(traceEvent));
    expect(results).toHaveLength(1);
  });

  it("should return empty array for invalid JSON", () => {
    expect(parseCloudflareEvent("{bad json")).toEqual([]);
  });

  it("should return empty array for events with no Logs", () => {
    expect(parseCloudflareEvent(JSON.stringify({ Event: {} }))).toEqual([]);
  });

  it("should return empty array for empty lines", () => {
    expect(parseCloudflareEvent("")).toEqual([]);
    expect(parseCloudflareEvent("   ")).toEqual([]);
  });
});
