import { describe, expect, it } from "vitest";
import {
  formatTraceparent,
  generateSpanId,
  generateTraceContext,
  parseTraceparent,
} from "../trace-context";

describe("parseTraceparent", () => {
  it("should parse a valid traceparent header", () => {
    const result = parseTraceparent(
      "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01"
    );
    expect(result).toEqual({
      version: "00",
      traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
      parentId: "00f067aa0ba902b7",
      flags: "01",
    });
  });

  it("should return null for null input", () => {
    expect(parseTraceparent(null)).toBeNull();
  });

  it("should return null for empty string", () => {
    expect(parseTraceparent("")).toBeNull();
  });

  it("should return null for malformed header (missing parts)", () => {
    expect(parseTraceparent("00-abc-def-01")).toBeNull();
  });

  it("should return null for invalid hex characters", () => {
    expect(
      parseTraceparent(
        "00-ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ-00f067aa0ba902b7-01"
      )
    ).toBeNull();
  });

  it("should return null for version ff (reserved)", () => {
    expect(
      parseTraceparent(
        "ff-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01"
      )
    ).toBeNull();
  });

  it("should return null for all-zero trace ID", () => {
    expect(
      parseTraceparent(
        "00-00000000000000000000000000000000-00f067aa0ba902b7-01"
      )
    ).toBeNull();
  });

  it("should return null for all-zero parent ID", () => {
    expect(
      parseTraceparent(
        "00-4bf92f3577b34da6a3ce929d0e0e4736-0000000000000000-01"
      )
    ).toBeNull();
  });

  it("should handle leading/trailing whitespace", () => {
    const result = parseTraceparent(
      "  00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01  "
    );
    expect(result).not.toBeNull();
    expect(result!.traceId).toBe("4bf92f3577b34da6a3ce929d0e0e4736");
  });

  it("should parse unsampled flags (00)", () => {
    const result = parseTraceparent(
      "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00"
    );
    expect(result).not.toBeNull();
    expect(result!.flags).toBe("00");
  });
});

describe("generateTraceContext", () => {
  it("should generate version 00", () => {
    const ctx = generateTraceContext();
    expect(ctx.version).toBe("00");
  });

  it("should generate a 32-char hex traceId", () => {
    const ctx = generateTraceContext();
    expect(ctx.traceId).toMatch(/^[0-9a-f]{32}$/);
  });

  it("should generate a 16-char hex parentId", () => {
    const ctx = generateTraceContext();
    expect(ctx.parentId).toMatch(/^[0-9a-f]{16}$/);
  });

  it("should set sampled flag 01", () => {
    const ctx = generateTraceContext();
    expect(ctx.flags).toBe("01");
  });

  it("should generate unique trace IDs", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateTraceContext().traceId);
    }
    expect(ids.size).toBe(100);
  });
});

describe("formatTraceparent", () => {
  it("should format a trace context to a valid traceparent string", () => {
    const result = formatTraceparent({
      version: "00",
      traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
      parentId: "00f067aa0ba902b7",
      flags: "01",
    });
    expect(result).toBe(
      "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01"
    );
  });

  it("should round-trip with parseTraceparent", () => {
    const original = "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01";
    const parsed = parseTraceparent(original)!;
    const formatted = formatTraceparent(parsed);
    expect(formatted).toBe(original);
  });

  it("should round-trip generated context", () => {
    const ctx = generateTraceContext();
    const formatted = formatTraceparent(ctx);
    const reparsed = parseTraceparent(formatted);
    expect(reparsed).toEqual(ctx);
  });
});

describe("generateSpanId", () => {
  it("should generate a 16-char hex string", () => {
    const spanId = generateSpanId();
    expect(spanId).toMatch(/^[0-9a-f]{16}$/);
  });

  it("should generate unique span IDs", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateSpanId());
    }
    expect(ids.size).toBe(100);
  });
});
