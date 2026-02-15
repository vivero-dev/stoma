import { describe, expect, it, vi } from "vitest";
import { createInMemoryLock, createInMemoryFileTracker } from "../lock-memory.js";
import { createStorageLock, createStorageFileTracker } from "../lock-storage.js";
import { createProcessor } from "../index.js";
import {
  ANALYTICS_TYPE,
  type AnalyticsEntry,
  type StorageReader,
  type StorageWriter,
  type ParquetWriter,
} from "../../types.js";

// ── Helpers ──────────────────────────────────────────────────────────────

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

function createMockStorageAdapter() {
  const store = new Map<string, Uint8Array>();
  return {
    store,
    read: vi.fn(async (key: string) => {
      const data = store.get(key);
      if (!data) throw new Error(`Not found: ${key}`);
      return new TextDecoder().decode(data);
    }),
    write: vi.fn(async (key: string, data: Uint8Array) => {
      store.set(key, data);
    }),
    delete: vi.fn(async (key: string) => {
      store.delete(key);
    }),
  };
}

// ── In-Memory Lock Tests ─────────────────────────────────────────────────

describe("createInMemoryLock", () => {
  it("should acquire and release a lock", async () => {
    const lock = createInMemoryLock();

    const acquired = await lock.acquire("test", "owner-1", 5000);
    expect(acquired).toBe(true);
    expect(await lock.isLocked("test")).toBe(true);

    await lock.release("test", "owner-1");
    expect(await lock.isLocked("test")).toBe(false);
  });

  it("should fail concurrent acquire", async () => {
    const lock = createInMemoryLock();

    const first = await lock.acquire("test", "owner-1", 5000);
    expect(first).toBe(true);

    const second = await lock.acquire("test", "owner-2", 5000);
    expect(second).toBe(false);
  });

  it("should allow re-acquire after expiry", async () => {
    const lock = createInMemoryLock();

    // Acquire with very short TTL
    await lock.acquire("test", "owner-1", 1);

    // Wait for expiry
    await new Promise((r) => setTimeout(r, 10));

    const acquired = await lock.acquire("test", "owner-2", 5000);
    expect(acquired).toBe(true);
  });

  it("should only release for the correct owner", async () => {
    const lock = createInMemoryLock();

    await lock.acquire("test", "owner-1", 5000);

    // Wrong owner — should not release
    await lock.release("test", "owner-2");
    expect(await lock.isLocked("test")).toBe(true);

    // Correct owner — should release
    await lock.release("test", "owner-1");
    expect(await lock.isLocked("test")).toBe(false);
  });

  it("should report unlocked for non-existent key", async () => {
    const lock = createInMemoryLock();
    expect(await lock.isLocked("nonexistent")).toBe(false);
  });

  it("should report unlocked for expired lock via isLocked", async () => {
    const lock = createInMemoryLock();
    await lock.acquire("test", "owner-1", 1);
    await new Promise((r) => setTimeout(r, 10));
    expect(await lock.isLocked("test")).toBe(false);
  });
});

// ── In-Memory File Tracker Tests ────────────────────────────────────────

describe("createInMemoryFileTracker", () => {
  it("should mark and check processed files", async () => {
    const tracker = createInMemoryFileTracker();

    expect(await tracker.isProcessed("file1.ndjson")).toBe(false);

    await tracker.markProcessed("file1.ndjson");
    expect(await tracker.isProcessed("file1.ndjson")).toBe(true);
  });

  it("should unmark files", async () => {
    const tracker = createInMemoryFileTracker();

    await tracker.markProcessed("file1.ndjson");
    expect(await tracker.isProcessed("file1.ndjson")).toBe(true);

    await tracker.unmark("file1.ndjson");
    expect(await tracker.isProcessed("file1.ndjson")).toBe(false);
  });

  it("should handle multiple files independently", async () => {
    const tracker = createInMemoryFileTracker();

    await tracker.markProcessed("file1.ndjson");
    await tracker.markProcessed("file2.ndjson");

    expect(await tracker.isProcessed("file1.ndjson")).toBe(true);
    expect(await tracker.isProcessed("file2.ndjson")).toBe(true);
    expect(await tracker.isProcessed("file3.ndjson")).toBe(false);
  });
});

// ── Storage Lock Tests ──────────────────────────────────────────────────

describe("createStorageLock", () => {
  it("should acquire and release via storage", async () => {
    const storage = createMockStorageAdapter();
    const lock = createStorageLock(storage);

    const acquired = await lock.acquire("test", "owner-1", 5000);
    expect(acquired).toBe(true);
    expect(await lock.isLocked("test")).toBe(true);

    await lock.release("test", "owner-1");
    expect(await lock.isLocked("test")).toBe(false);
  });

  it("should fail concurrent acquire via storage", async () => {
    const storage = createMockStorageAdapter();
    const lock = createStorageLock(storage);

    await lock.acquire("test", "owner-1", 60_000);
    const second = await lock.acquire("test", "owner-2", 60_000);
    expect(second).toBe(false);
  });

  it("should allow re-acquire after expiry via storage", async () => {
    const storage = createMockStorageAdapter();
    const lock = createStorageLock(storage);

    await lock.acquire("test", "owner-1", 1);
    await new Promise((r) => setTimeout(r, 10));

    const acquired = await lock.acquire("test", "owner-2", 5000);
    expect(acquired).toBe(true);
  });

  it("should only release for the correct owner via storage", async () => {
    const storage = createMockStorageAdapter();
    const lock = createStorageLock(storage);

    await lock.acquire("test", "owner-1", 5000);

    await lock.release("test", "wrong-owner");
    expect(await lock.isLocked("test")).toBe(true);

    await lock.release("test", "owner-1");
    expect(await lock.isLocked("test")).toBe(false);
  });
});

// ── Storage File Tracker Tests ──────────────────────────────────────────

describe("createStorageFileTracker", () => {
  it("should mark and check processed files via storage", async () => {
    const storage = createMockStorageAdapter();
    const tracker = createStorageFileTracker(storage);

    expect(await tracker.isProcessed("file1.ndjson")).toBe(false);

    await tracker.markProcessed("file1.ndjson");
    expect(await tracker.isProcessed("file1.ndjson")).toBe(true);
  });

  it("should unmark files via storage", async () => {
    const storage = createMockStorageAdapter();
    const tracker = createStorageFileTracker(storage);

    await tracker.markProcessed("file1.ndjson");
    await tracker.unmark("file1.ndjson");
    expect(await tracker.isProcessed("file1.ndjson")).toBe(false);
  });

  it("should respect maxKeys cap", async () => {
    const storage = createMockStorageAdapter();
    const tracker = createStorageFileTracker(storage, { maxKeys: 3 });

    await tracker.markProcessed("file1.ndjson");
    await tracker.markProcessed("file2.ndjson");
    await tracker.markProcessed("file3.ndjson");
    await tracker.markProcessed("file4.ndjson");

    // file1 should have been evicted (oldest)
    expect(await tracker.isProcessed("file1.ndjson")).toBe(false);
    // Recent files should still be tracked
    expect(await tracker.isProcessed("file2.ndjson")).toBe(true);
    expect(await tracker.isProcessed("file3.ndjson")).toBe(true);
    expect(await tracker.isProcessed("file4.ndjson")).toBe(true);
  });
});

// ── Processor Integration with Lock & Dedup ─────────────────────────────

describe("processor with lock and dedup", () => {
  it("should skip when locked", async () => {
    const lock = createInMemoryLock();
    // Pre-acquire the lock from another owner
    await lock.acquire("processor", "other-owner", 60_000);

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
      lock,
    });

    const result = await processor.run();

    expect(result.filesProcessed).toBe(0);
    expect(result.entriesExtracted).toBe(0);
    expect(result.errors).toContain("Processor already locked");
  });

  it("should skip already-processed files", async () => {
    const tracker = createInMemoryFileTracker();
    await tracker.markProcessed("file1.ndjson");

    const source = createMockSource({
      "file1.ndjson": JSON.stringify(makeEntry({ statusCode: 200 })),
      "file2.ndjson": JSON.stringify(makeEntry({ statusCode: 201 })),
    });
    const destination = createMockDestination();
    const parquetWriter = createMockParquetWriter();

    const processor = createProcessor({
      source,
      destination,
      parquetWriter,
      format: "standard",
      processedTracker: tracker,
    });

    const result = await processor.run();

    expect(result.filesProcessed).toBe(1);
    expect(result.entriesExtracted).toBe(1);
    expect(result.metrics!.filesDeduped).toBe(1);
  });

  it("should mark files after successful write", async () => {
    const tracker = createInMemoryFileTracker();

    const source = createMockSource({
      "file1.ndjson": JSON.stringify(makeEntry()),
    });
    const destination = createMockDestination();
    const parquetWriter = createMockParquetWriter();

    const processor = createProcessor({
      source,
      destination,
      parquetWriter,
      format: "standard",
      processedTracker: tracker,
    });

    await processor.run();

    expect(await tracker.isProcessed("file1.ndjson")).toBe(true);
  });

  it("should release lock even on error", async () => {
    const lock = createInMemoryLock();

    const source: StorageReader = {
      list: vi.fn(async () => ["file.ndjson"]),
      read: vi.fn(async () => {
        throw new Error("storage failure");
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
      lock,
    });

    await processor.run();

    // Lock should be released — another acquire should succeed
    const canAcquire = await lock.acquire("processor", "new-owner", 5000);
    expect(canAcquire).toBe(true);
  });

  it("should filter files by extension (default fileFilter)", async () => {
    const source = createMockSource({
      "file1.ndjson": JSON.stringify(makeEntry()),
      "file2.json": JSON.stringify(makeEntry()),
      "file3.log": JSON.stringify(makeEntry()),
      "file4.parquet": "binary data",
      "file5.txt": "text data",
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

    expect(result.filesProcessed).toBe(3);
    expect(result.metrics!.filesFiltered).toBe(2);
  });

  it("should use custom fileFilter", async () => {
    const source = createMockSource({
      "file1.ndjson": JSON.stringify(makeEntry()),
      "file2.ndjson": JSON.stringify(makeEntry()),
      "skip.ndjson": JSON.stringify(makeEntry()),
    });
    const destination = createMockDestination();
    const parquetWriter = createMockParquetWriter();

    const processor = createProcessor({
      source,
      destination,
      parquetWriter,
      format: "standard",
      fileFilter: (key) => !key.startsWith("skip"),
    });

    const result = await processor.run();

    expect(result.filesProcessed).toBe(2);
    expect(result.metrics!.filesFiltered).toBe(1);
  });

  it("should collect processor metrics", async () => {
    const source = createMockSource({
      "file1.ndjson": JSON.stringify(makeEntry()),
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

    expect(result.metrics).toBeDefined();
    expect(result.metrics!.filesListed).toBe(1);
    expect(result.metrics!.listDurationMs).toBeGreaterThanOrEqual(0);
    expect(result.metrics!.readDurationMs).toBeGreaterThanOrEqual(0);
    expect(result.metrics!.parseDurationMs).toBeGreaterThanOrEqual(0);
    expect(result.metrics!.writeDurationMs).toBeGreaterThanOrEqual(0);
  });

  it("should handle workers-trace-event format same as cloudflare", async () => {
    const entry = makeEntry();
    const traceEvent = JSON.stringify({
      Logs: [{ Level: "log", Message: [JSON.stringify(entry)] }],
    });

    const source = createMockSource({
      "trace.ndjson": traceEvent,
    });
    const destination = createMockDestination();
    const parquetWriter = createMockParquetWriter();

    const processor = createProcessor({
      source,
      destination,
      parquetWriter,
      format: "workers-trace-event",
    });

    const result = await processor.run();

    expect(result.filesProcessed).toBe(1);
    expect(result.entriesExtracted).toBe(1);
  });
});
