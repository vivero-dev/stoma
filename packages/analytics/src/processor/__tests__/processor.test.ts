import { describe, expect, it, vi } from "vitest";
import { ANALYTICS_TYPE, type AnalyticsEntry, type StorageReader, type StorageWriter, type ParquetWriter } from "../../types.js";
import { createProcessor } from "../index.js";

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

function createMockSource(files: Record<string, string>): StorageReader {
  return {
    list: vi.fn(async () => Object.keys(files)),
    read: vi.fn(async (key: string) => {
      if (!(key in files)) throw new Error(`Not found: ${key}`);
      return files[key];
    }),
    delete: vi.fn(async () => {}),
  };
}

function createMockDestination(): StorageWriter & {
  written: Map<string, Uint8Array>;
} {
  const written = new Map<string, Uint8Array>();
  return {
    written,
    write: vi.fn(async (key: string, data: Uint8Array) => {
      written.set(key, data);
    }),
  };
}

function createMockParquetWriter(): ParquetWriter {
  return {
    toParquet: vi.fn(async (entries: AnalyticsEntry[]) => {
      const ndjson = entries.map((e) => JSON.stringify(e)).join("\n");
      return new TextEncoder().encode(ndjson);
    }),
  };
}

describe("createProcessor", () => {
  it("should process standard NDJSON files", async () => {
    const entry1 = makeEntry({ statusCode: 200 });
    const entry2 = makeEntry({ statusCode: 201 });

    const source = createMockSource({
      "logs/file1.ndjson": JSON.stringify(entry1) + "\n" + JSON.stringify(entry2),
    });
    const destination = createMockDestination();
    const parquetWriter = createMockParquetWriter();

    const processor = createProcessor({
      source,
      destination,
      parquetWriter,
      format: "standard",
      sourcePrefix: "logs/",
    });

    const result = await processor.run();

    expect(result.filesProcessed).toBe(1);
    expect(result.entriesExtracted).toBe(2);
    expect(result.parquetFilesWritten).toBe(1);
    expect(result.errors).toHaveLength(0);
    expect(destination.written.size).toBe(1);
  });

  it("should process Cloudflare trace event files", async () => {
    const entry = makeEntry();
    const traceEvent = JSON.stringify({
      Logs: [{ Level: "log", Message: [JSON.stringify(entry)] }],
    });

    const source = createMockSource({
      "logs/trace1.ndjson": traceEvent,
    });
    const destination = createMockDestination();
    const parquetWriter = createMockParquetWriter();

    const processor = createProcessor({
      source,
      destination,
      parquetWriter,
      format: "cloudflare",
      sourcePrefix: "logs/",
    });

    const result = await processor.run();

    expect(result.filesProcessed).toBe(1);
    expect(result.entriesExtracted).toBe(1);
    expect(result.parquetFilesWritten).toBe(1);
  });

  it("should skip non-analytics lines", async () => {
    const entry = makeEntry();
    const content = [
      JSON.stringify({ _type: "other", msg: "ignored" }),
      JSON.stringify(entry),
      "plain text line",
      "",
    ].join("\n");

    const source = createMockSource({ "file.ndjson": content });
    const destination = createMockDestination();
    const parquetWriter = createMockParquetWriter();

    const processor = createProcessor({
      source,
      destination,
      parquetWriter,
      format: "standard",
    });

    const result = await processor.run();

    expect(result.entriesExtracted).toBe(1);
  });

  it("should batch entries by maxEntriesPerFile", async () => {
    const entries = Array.from({ length: 5 }, (_, i) =>
      makeEntry({ statusCode: 200 + i })
    );
    const content = entries.map((e) => JSON.stringify(e)).join("\n");

    const source = createMockSource({ "file.ndjson": content });
    const destination = createMockDestination();
    const parquetWriter = createMockParquetWriter();

    const processor = createProcessor({
      source,
      destination,
      parquetWriter,
      format: "standard",
      maxEntriesPerFile: 2,
    });

    const result = await processor.run();

    expect(result.entriesExtracted).toBe(5);
    expect(result.parquetFilesWritten).toBe(3); // 2+2+1
    expect(destination.written.size).toBe(3);
  });

  it("should delete processed files when deleteProcessed is true", async () => {
    const source = createMockSource({
      "file1.ndjson": JSON.stringify(makeEntry()),
      "file2.ndjson": JSON.stringify(makeEntry()),
    });
    const destination = createMockDestination();
    const parquetWriter = createMockParquetWriter();

    const processor = createProcessor({
      source,
      destination,
      parquetWriter,
      format: "standard",
      deleteProcessed: true,
    });

    const result = await processor.run();

    expect(result.filesDeleted).toBe(2);
    expect(source.delete).toHaveBeenCalledTimes(2);
  });

  it("should not delete files when deleteProcessed is false", async () => {
    const source = createMockSource({
      "file.ndjson": JSON.stringify(makeEntry()),
    });
    const destination = createMockDestination();
    const parquetWriter = createMockParquetWriter();

    const processor = createProcessor({
      source,
      destination,
      parquetWriter,
      format: "standard",
      deleteProcessed: false,
    });

    const result = await processor.run();

    expect(result.filesDeleted).toBe(0);
    expect(source.delete).not.toHaveBeenCalled();
  });

  it("should handle source.list failures gracefully", async () => {
    const source: StorageReader = {
      list: vi.fn(async () => { throw new Error("R2 unavailable"); }),
      read: vi.fn(async () => ""),
      delete: vi.fn(async () => {}),
    };
    const destination = createMockDestination();
    const parquetWriter = createMockParquetWriter();

    const processor = createProcessor({
      source,
      destination,
      parquetWriter,
      format: "standard",
    });

    const result = await processor.run();

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("R2 unavailable");
    expect(result.filesProcessed).toBe(0);
  });

  it("should handle source.read failures gracefully", async () => {
    const source: StorageReader = {
      list: vi.fn(async () => ["file1.ndjson", "file2.ndjson"]),
      read: vi.fn(async (key: string) => {
        if (key === "file1.ndjson") throw new Error("read failed");
        return JSON.stringify(makeEntry());
      }),
      delete: vi.fn(async () => {}),
    };
    const destination = createMockDestination();
    const parquetWriter = createMockParquetWriter();

    const processor = createProcessor({
      source,
      destination,
      parquetWriter,
      format: "standard",
    });

    const result = await processor.run();

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("read failed");
    expect(result.filesProcessed).toBe(1);
    expect(result.entriesExtracted).toBe(1);
  });

  it("should produce no output files when no entries are found", async () => {
    const source = createMockSource({
      "file.ndjson": "not json\nalso not analytics\n",
    });
    const destination = createMockDestination();
    const parquetWriter = createMockParquetWriter();

    const processor = createProcessor({
      source,
      destination,
      parquetWriter,
      format: "standard",
    });

    const result = await processor.run();

    expect(result.filesProcessed).toBe(1);
    expect(result.entriesExtracted).toBe(0);
    expect(result.parquetFilesWritten).toBe(0);
    expect(destination.written.size).toBe(0);
  });

  it("should include durationMs in the result", async () => {
    const source = createMockSource({});
    const destination = createMockDestination();
    const parquetWriter = createMockParquetWriter();

    const processor = createProcessor({
      source,
      destination,
      parquetWriter,
      format: "standard",
    });

    const result = await processor.run();

    expect(typeof result.durationMs).toBe("number");
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("should write Parquet files with partitioned keys", async () => {
    const source = createMockSource({
      "file.ndjson": JSON.stringify(makeEntry()),
    });
    const destination = createMockDestination();
    const parquetWriter = createMockParquetWriter();

    const processor = createProcessor({
      source,
      destination,
      parquetWriter,
      format: "standard",
      destinationPrefix: "output",
    });

    await processor.run();

    const keys = [...destination.written.keys()];
    expect(keys).toHaveLength(1);
    expect(keys[0]).toMatch(/^output\/\d{4}\/\d{2}\/\d{2}\/\d{2}\//);
    expect(keys[0]).toMatch(/\.parquet$/);
  });
});
