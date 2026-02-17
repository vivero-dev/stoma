import { describe, expect, it, vi } from "vitest";
import type {
  CompactorStorage,
  ParquetMerger,
} from "../../types.js";
import {
  createCompactor,
  groupByPartition,
  filterBeforeCutoff,
} from "../index.js";

function createMockStorage(
  files: Record<string, Uint8Array>
): CompactorStorage & { written: Map<string, Uint8Array> } {
  const written = new Map<string, Uint8Array>();
  return {
    written,
    list: vi.fn(async (prefix: string) =>
      Object.keys(files).filter((k) => k.startsWith(prefix))
    ),
    readBinary: vi.fn(async (key: string) => {
      if (!(key in files)) throw new Error(`Not found: ${key}`);
      return files[key];
    }),
    write: vi.fn(async (key: string, data: Uint8Array) => {
      written.set(key, data);
    }),
    delete: vi.fn(async () => {}),
  };
}

function createMockMerger(): ParquetMerger {
  return {
    merge: vi.fn(async (fragments: Uint8Array[]) => {
      // Concatenate all fragments as a simple merge simulation
      const total = fragments.reduce((sum, f) => sum + f.length, 0);
      const merged = new Uint8Array(total);
      let offset = 0;
      for (const f of fragments) {
        merged.set(f, offset);
        offset += f.length;
      }
      return merged;
    }),
  };
}

const fakeParquet = (id: string) => new TextEncoder().encode(`parquet-${id}`);

describe("createCompactor", () => {
  it("should compact fragments in a day partition", async () => {
    const storage = createMockStorage({
      "analytics/2026/02/14/10/1000-0.parquet": fakeParquet("a"),
      "analytics/2026/02/14/14/2000-0.parquet": fakeParquet("b"),
      "analytics/2026/02/14/23/3000-0.parquet": fakeParquet("c"),
    });

    const compactor = createCompactor({
      storage,
      merger: createMockMerger(),
      granularity: "day",
      before: new Date("2026-02-15T12:00:00Z"),
    });

    const result = await compactor.run();

    expect(result.partitionsCompacted).toBe(1);
    expect(result.fragmentsRead).toBe(3);
    expect(result.compactedFilesWritten).toBe(1);
    expect(result.fragmentsDeleted).toBe(3);
    expect(storage.written.has("analytics/2026/02/14/compacted.parquet")).toBe(
      true
    );
  });

  it("should skip partitions not fully before the cutoff", async () => {
    const storage = createMockStorage({
      // Feb 14 is complete, Feb 15 is still in progress
      "analytics/2026/02/14/10/1000-0.parquet": fakeParquet("a"),
      "analytics/2026/02/15/08/2000-0.parquet": fakeParquet("b"),
    });

    const compactor = createCompactor({
      storage,
      merger: createMockMerger(),
      granularity: "day",
      before: new Date("2026-02-15T12:00:00Z"),
    });

    const result = await compactor.run();

    expect(result.partitionsCompacted).toBe(1);
    expect(result.compactedFilesWritten).toBe(1);
    // Only the 14th was compacted
    expect(storage.written.has("analytics/2026/02/14/compacted.parquet")).toBe(
      true
    );
    expect(storage.written.has("analytics/2026/02/15/compacted.parquet")).toBe(
      false
    );
  });

  it("should skip already-compacted partitions with no new fragments", async () => {
    const storage = createMockStorage({
      "analytics/2026/02/14/compacted.parquet": fakeParquet("existing"),
    });

    const compactor = createCompactor({
      storage,
      merger: createMockMerger(),
      granularity: "day",
      before: new Date("2026-02-15T12:00:00Z"),
    });

    const result = await compactor.run();

    expect(result.partitionsCompacted).toBe(0);
    expect(result.compactedFilesWritten).toBe(0);
  });

  it("should re-compact when new fragments exist alongside compacted file", async () => {
    const storage = createMockStorage({
      "analytics/2026/02/14/compacted.parquet": fakeParquet("old"),
      "analytics/2026/02/14/10/1000-0.parquet": fakeParquet("new"),
    });
    const merger = createMockMerger();

    const compactor = createCompactor({
      storage,
      merger,
      granularity: "day",
      before: new Date("2026-02-15T12:00:00Z"),
    });

    const result = await compactor.run();

    expect(result.partitionsCompacted).toBe(1);
    // Reads both files (compacted + fragment)
    expect(result.fragmentsRead).toBe(2);
    // Only deletes the fragment, not the compacted file
    expect(result.fragmentsDeleted).toBe(1);
    expect(storage.delete).toHaveBeenCalledWith(
      "analytics/2026/02/14/10/1000-0.parquet"
    );
  });

  it("should not delete fragments when deleteFragments is false", async () => {
    const storage = createMockStorage({
      "analytics/2026/02/14/10/1000-0.parquet": fakeParquet("a"),
    });

    const compactor = createCompactor({
      storage,
      merger: createMockMerger(),
      granularity: "day",
      before: new Date("2026-02-15T12:00:00Z"),
      deleteFragments: false,
    });

    const result = await compactor.run();

    expect(result.partitionsCompacted).toBe(1);
    expect(result.fragmentsDeleted).toBe(0);
    expect(storage.delete).not.toHaveBeenCalled();
  });

  it("should compact with hour granularity", async () => {
    const storage = createMockStorage({
      "analytics/2026/02/14/10/1000-0.parquet": fakeParquet("a"),
      "analytics/2026/02/14/10/1000-1.parquet": fakeParquet("b"),
      "analytics/2026/02/14/14/2000-0.parquet": fakeParquet("c"),
    });

    const compactor = createCompactor({
      storage,
      merger: createMockMerger(),
      granularity: "hour",
      before: new Date("2026-02-14T14:00:00Z"),
    });

    const result = await compactor.run();

    // Hour 10 (ends at 11:00) is before 14:00 → compacted
    // Hour 14 (ends at 15:00) is NOT before 14:00 → skipped
    expect(result.partitionsCompacted).toBe(1);
    expect(storage.written.has("analytics/2026/02/14/10/compacted.parquet")).toBe(
      true
    );
    expect(storage.written.has("analytics/2026/02/14/14/compacted.parquet")).toBe(
      false
    );
  });

  it("should compact with month granularity", async () => {
    const storage = createMockStorage({
      "analytics/2026/01/14/10/1000-0.parquet": fakeParquet("a"),
      "analytics/2026/01/28/14/2000-0.parquet": fakeParquet("b"),
      "analytics/2026/02/14/10/3000-0.parquet": fakeParquet("c"),
    });

    const compactor = createCompactor({
      storage,
      merger: createMockMerger(),
      granularity: "month",
      before: new Date("2026-02-01T00:00:00Z"),
    });

    const result = await compactor.run();

    // January (ends Feb 1) is NOT before Feb 1 (equal) → skipped? No wait...
    // partitionEnd <= before: Feb 1 <= Feb 1 → true
    expect(result.partitionsCompacted).toBe(1);
    expect(storage.written.has("analytics/2026/01/compacted.parquet")).toBe(
      true
    );
    expect(storage.written.has("analytics/2026/02/compacted.parquet")).toBe(
      false
    );
  });

  it("should handle storage.list failures gracefully", async () => {
    const storage: CompactorStorage = {
      list: vi.fn(async () => {
        throw new Error("R2 down");
      }),
      readBinary: vi.fn(async () => new Uint8Array()),
      write: vi.fn(async () => {}),
      delete: vi.fn(async () => {}),
    };

    const compactor = createCompactor({
      storage,
      merger: createMockMerger(),
      before: new Date("2026-02-15T12:00:00Z"),
    });

    const result = await compactor.run();

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("R2 down");
    expect(result.partitionsCompacted).toBe(0);
  });

  it("should handle merger failures gracefully", async () => {
    const storage = createMockStorage({
      "analytics/2026/02/14/10/1000-0.parquet": fakeParquet("a"),
    });
    const merger: ParquetMerger = {
      merge: vi.fn(async () => {
        throw new Error("DuckDB OOM");
      }),
    };

    const compactor = createCompactor({
      storage,
      merger,
      before: new Date("2026-02-15T12:00:00Z"),
    });

    const result = await compactor.run();

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("DuckDB OOM");
    expect(result.partitionsCompacted).toBe(0);
  });

  it("should compact multiple partitions", async () => {
    const storage = createMockStorage({
      "analytics/2026/02/12/10/1000-0.parquet": fakeParquet("a"),
      "analytics/2026/02/13/14/2000-0.parquet": fakeParquet("b"),
      "analytics/2026/02/14/08/3000-0.parquet": fakeParquet("c"),
    });

    const compactor = createCompactor({
      storage,
      merger: createMockMerger(),
      granularity: "day",
      before: new Date("2026-02-15T00:00:00Z"),
    });

    const result = await compactor.run();

    expect(result.partitionsCompacted).toBe(3);
    expect(result.compactedFilesWritten).toBe(3);
  });

  it("should include durationMs in the result", async () => {
    const storage = createMockStorage({});

    const compactor = createCompactor({
      storage,
      merger: createMockMerger(),
      before: new Date("2026-02-15T12:00:00Z"),
    });

    const result = await compactor.run();

    expect(typeof result.durationMs).toBe("number");
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("should use custom prefix", async () => {
    const storage = createMockStorage({
      "metrics/2026/02/14/10/1000-0.parquet": fakeParquet("a"),
    });

    const compactor = createCompactor({
      storage,
      merger: createMockMerger(),
      prefix: "metrics",
      before: new Date("2026-02-15T12:00:00Z"),
    });

    const result = await compactor.run();

    expect(result.partitionsCompacted).toBe(1);
    expect(storage.written.has("metrics/2026/02/14/compacted.parquet")).toBe(
      true
    );
  });
});

describe("groupByPartition", () => {
  it("should group files by day partition", () => {
    const files = [
      "analytics/2026/02/14/10/a.parquet",
      "analytics/2026/02/14/14/b.parquet",
      "analytics/2026/02/15/08/c.parquet",
    ];

    const groups = groupByPartition(files, "analytics", "day");

    expect(groups.size).toBe(2);
    expect(groups.get("2026/02/14")).toHaveLength(2);
    expect(groups.get("2026/02/15")).toHaveLength(1);
  });

  it("should group files by hour partition", () => {
    const files = [
      "analytics/2026/02/14/10/a.parquet",
      "analytics/2026/02/14/10/b.parquet",
      "analytics/2026/02/14/14/c.parquet",
    ];

    const groups = groupByPartition(files, "analytics", "hour");

    expect(groups.size).toBe(2);
    expect(groups.get("2026/02/14/10")).toHaveLength(2);
    expect(groups.get("2026/02/14/14")).toHaveLength(1);
  });

  it("should group files by month partition", () => {
    const files = [
      "analytics/2026/01/14/10/a.parquet",
      "analytics/2026/01/28/14/b.parquet",
      "analytics/2026/02/05/08/c.parquet",
    ];

    const groups = groupByPartition(files, "analytics", "month");

    expect(groups.size).toBe(2);
    expect(groups.get("2026/01")).toHaveLength(2);
    expect(groups.get("2026/02")).toHaveLength(1);
  });

  it("should skip files with insufficient path segments", () => {
    const files = [
      "analytics/2026/02/14/10/a.parquet",
      "analytics/2026/02/orphan.txt",
    ];

    const groups = groupByPartition(files, "analytics", "day");

    expect(groups.size).toBe(1);
    expect(groups.get("2026/02/14")).toHaveLength(1);
  });
});

describe("filterBeforeCutoff", () => {
  it("should filter day partitions before cutoff", () => {
    const partitions = new Map([
      ["2026/02/13", ["f1"]],
      ["2026/02/14", ["f2"]],
      ["2026/02/15", ["f3"]],
    ]);

    // Feb 15 starts at midnight, so cutoff at Feb 15 noon means:
    // Feb 13 (ends Feb 14 00:00) → before → included
    // Feb 14 (ends Feb 15 00:00) → before → included
    // Feb 15 (ends Feb 16 00:00) → NOT before → excluded
    const result = filterBeforeCutoff(
      partitions,
      "day",
      new Date("2026-02-15T12:00:00Z")
    );

    expect(result.size).toBe(2);
    expect(result.has("2026/02/13")).toBe(true);
    expect(result.has("2026/02/14")).toBe(true);
    expect(result.has("2026/02/15")).toBe(false);
  });

  it("should use partition end for boundary check", () => {
    const partitions = new Map([["2026/02/14", ["f1"]]]);

    // Cutoff at exactly start of Feb 15 = end of Feb 14 partition
    const result = filterBeforeCutoff(
      partitions,
      "day",
      new Date("2026-02-15T00:00:00Z")
    );

    // partitionEnd (Feb 15 00:00) <= before (Feb 15 00:00) → included
    expect(result.size).toBe(1);
  });
});
