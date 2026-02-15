import type {
  AnalyticsEntry,
  ParquetWriter,
  ParquetMerger,
  StreamingParquetMerger,
} from "../types.js";

/** Minimal DuckDB WASM interface — only what we use */
interface DuckDBInstance {
  connect(): Promise<DuckDBConnection>;
  registerFileBuffer(name: string, buffer: Uint8Array): Promise<void>;
  copyFileToBuffer(path: string): Promise<ArrayBuffer>;
  terminate(): Promise<void>;
}

interface DuckDBConnection {
  query(sql: string): Promise<unknown>;
  close(): Promise<void>;
}

type DuckDBModule = { Database: new () => DuckDBInstance };

// ── DuckDB Instance Pool ───────────────────────────────────────────────

interface DuckDBPool {
  acquire(): Promise<DuckDBInstance>;
  release(db: DuckDBInstance): void;
  destroy(): Promise<void>;
}

function createDuckDBPool(maxSize = 1): DuckDBPool {
  const available: DuckDBInstance[] = [];
  const waiting: Array<(db: DuckDBInstance) => void> = [];
  let currentSize = 0;
  let destroyed = false;

  async function createInstance(): Promise<DuckDBInstance> {
    const duckdb = await loadDuckDB();
    return new duckdb.Database();
  }

  return {
    async acquire(): Promise<DuckDBInstance> {
      if (destroyed) throw new Error("DuckDB pool is destroyed");

      // Return an available instance
      const idle = available.pop();
      if (idle) return idle;

      // Create a new one if under limit
      if (currentSize < maxSize) {
        currentSize++;
        return createInstance();
      }

      // Wait for one to be released
      return new Promise<DuckDBInstance>((resolve) => {
        waiting.push(resolve);
      });
    },

    release(db: DuckDBInstance): void {
      if (destroyed) {
        db.terminate();
        return;
      }

      // If someone is waiting, hand it off directly
      const waiter = waiting.shift();
      if (waiter) {
        waiter(db);
      } else {
        available.push(db);
      }
    },

    async destroy(): Promise<void> {
      destroyed = true;
      for (const db of available) {
        await db.terminate();
      }
      available.length = 0;
      currentSize = 0;
    },
  };
}

let globalPool: DuckDBPool | null = null;

function getPool(): DuckDBPool {
  if (!globalPool) {
    globalPool = createDuckDBPool(1);
  }
  return globalPool;
}

/**
 * Destroy the shared DuckDB instance pool.
 *
 * Call this during test teardown or worker shutdown to release resources.
 */
export async function destroyDuckDBPool(): Promise<void> {
  if (globalPool) {
    await globalPool.destroy();
    globalPool = null;
  }
}

// ── DuckDB Loader ──────────────────────────────────────────────────────

async function loadDuckDB(): Promise<DuckDBModule> {
  try {
    return await import("@duckdb/duckdb-wasm" as string);
  } catch {
    try {
      return await import("@ducklings/workers" as string);
    } catch {
      throw new Error(
        "DuckDB WASM not available. Install @duckdb/duckdb-wasm or a platform-specific build (e.g., @ducklings/workers for Cloudflare)."
      );
    }
  }
}

// ── Parquet Writer ─────────────────────────────────────────────────────

/**
 * ParquetWriter that uses DuckDB WASM to convert entries to Parquet format.
 *
 * Uses DuckDB's native NDJSON bulk loader (`read_ndjson`) instead of row-by-row
 * inserts — this is ~100x faster for large batches because DuckDB processes
 * NDJSON in vectorized column batches internally.
 *
 * DuckDB instances are acquired from a shared pool to avoid the ~50-200ms
 * overhead of creating a new `Database` per call.
 *
 * DuckDB WASM is loaded via dynamic import — users must install `@duckdb/duckdb-wasm`
 * or a platform-specific build (e.g., `@ducklings/workers` for Cloudflare) themselves.
 */
export function duckdbWasmParquetWriter(): ParquetWriter {
  return {
    async toParquet(entries: AnalyticsEntry[]): Promise<Uint8Array> {
      if (entries.length === 0) {
        return new Uint8Array(0);
      }

      // Build NDJSON with dimensions pre-serialized to VARCHAR
      const ndjson = entries
        .map((entry) => {
          const row: Record<string, unknown> = { ...entry };
          row.dimensions = entry.dimensions
            ? JSON.stringify(entry.dimensions)
            : null;
          return JSON.stringify(row);
        })
        .join("\n");

      const inputBuffer = new TextEncoder().encode(ndjson);
      const pool = getPool();
      const db = await pool.acquire();

      try {
        // Register NDJSON as a virtual file for bulk loading
        await db.registerFileBuffer("input.ndjson", inputBuffer);

        const conn = await db.connect();

        try {
          // Bulk-load via DuckDB's native NDJSON reader (vectorized, columnar).
          // Schema matches the lean analytics entry — no requestId, path, clientIp
          // (those belong in request logs, not analytics).
          await conn.query(`
            CREATE TABLE analytics AS
            SELECT * FROM read_ndjson('input.ndjson', columns={
              _type: 'VARCHAR',
              "timestamp": 'VARCHAR',
              gatewayName: 'VARCHAR',
              routePath: 'VARCHAR',
              method: 'VARCHAR',
              statusCode: 'INTEGER',
              durationMs: 'DOUBLE',
              responseSize: 'BIGINT',
              traceId: 'VARCHAR',
              dimensions: 'VARCHAR'
            })
          `);

          // Export to Parquet with ZSTD compression
          await conn.query(
            `COPY analytics TO 'output.parquet' (FORMAT PARQUET, COMPRESSION ZSTD)`
          );
        } finally {
          await conn.close();
        }

        // Read Parquet bytes back from the virtual filesystem
        const bytes = await db.copyFileToBuffer("output.parquet");
        return new Uint8Array(bytes);
      } finally {
        pool.release(db);
      }
    },
  };
}

// ── Parquet Merger ─────────────────────────────────────────────────────

/**
 * ParquetMerger that uses DuckDB WASM to read multiple Parquet fragment
 * files and merge them into a single compacted Parquet file.
 *
 * Used by `createCompactor()` to reduce file count after ingest.
 */
export function duckdbWasmParquetMerger(): ParquetMerger {
  return {
    async merge(fragments: Uint8Array[]): Promise<Uint8Array> {
      if (fragments.length === 0) {
        return new Uint8Array(0);
      }

      const pool = getPool();
      const db = await pool.acquire();

      try {
        // Register each fragment as a virtual file
        const fileNames: string[] = [];
        for (let i = 0; i < fragments.length; i++) {
          const name = `frag_${i}.parquet`;
          await db.registerFileBuffer(name, fragments[i]);
          fileNames.push(name);
        }

        const conn = await db.connect();

        try {
          const fileList = fileNames.map((f) => `'${f}'`).join(", ");
          await conn.query(
            `COPY (SELECT * FROM read_parquet([${fileList}])) TO 'compacted.parquet' (FORMAT PARQUET, COMPRESSION ZSTD, ROW_GROUP_SIZE 100000)`
          );
        } finally {
          await conn.close();
        }

        const bytes = await db.copyFileToBuffer("compacted.parquet");
        return new Uint8Array(bytes);
      } finally {
        pool.release(db);
      }
    },
  };
}

// ── Streaming Parquet Merger ───────────────────────────────────────────

/**
 * StreamingParquetMerger that processes fragments in bounded chunks.
 *
 * Instead of loading all fragments into memory, processes `chunkSize`
 * fragments at a time and feeds the output into the next pass. This
 * bounds memory to approximately `chunkSize` fragment buffers.
 *
 * @param opts.chunkSize - Number of fragments per merge pass. Default: 50.
 */
export function duckdbWasmStreamingMerger(
  opts?: { chunkSize?: number }
): StreamingParquetMerger {
  const chunkSize = opts?.chunkSize ?? 50;

  const baseMerger = duckdbWasmParquetMerger();

  return {
    chunkSize,

    async merge(fragments: Uint8Array[]): Promise<Uint8Array> {
      return baseMerger.merge(fragments);
    },

    async mergeChunk(fragments: Uint8Array[]): Promise<Uint8Array> {
      return baseMerger.merge(fragments);
    },
  };
}
