import { describe, expect, it } from "vitest";
import { ANALYTICS_TYPE, type AnalyticsEntry } from "../../types.js";
import { ndjsonPassthroughWriter } from "../ndjson-passthrough.js";

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

describe("ndjsonPassthroughWriter", () => {
  it("should convert entries to NDJSON bytes", async () => {
    const writer = ndjsonPassthroughWriter();
    const entries = [
      makeEntry({ statusCode: 200 }),
      makeEntry({ statusCode: 404 }),
    ];

    const bytes = await writer.toParquet(entries);
    const text = new TextDecoder().decode(bytes);
    const lines = text.trim().split("\n");

    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0]).statusCode).toBe(200);
    expect(JSON.parse(lines[1]).statusCode).toBe(404);
  });

  it("should produce trailing newline", async () => {
    const writer = ndjsonPassthroughWriter();
    const bytes = await writer.toParquet([makeEntry()]);
    const text = new TextDecoder().decode(bytes);

    expect(text.endsWith("\n")).toBe(true);
  });

  it("should handle empty entries array", async () => {
    const writer = ndjsonPassthroughWriter();
    const bytes = await writer.toParquet([]);
    const text = new TextDecoder().decode(bytes);

    expect(text).toBe("\n");
  });
});
