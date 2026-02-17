import type { AnalyticsEntry, ParquetWriter } from "../types.js";

/**
 * ParquetWriter that uses DuckDB WASM to convert entries to Parquet format.
 *
 * Uses DuckDB's native NDJSON bulk loader (`read_ndjson`) instead of row-by-row
 * inserts — this is ~100x faster for large batches because DuckDB processes
 * NDJSON in vectorized column batches internally.
 *
 * DuckDB WASM is loaded via dynamic import — users must install `@duckdb/duckdb-wasm`
 * or `@ducklings/workers` (for Cloudflare Workers) as a dependency themselves.
 */
export function duckdbWasmParquetWriter(): ParquetWriter {
  return {
    async toParquet(entries: AnalyticsEntry[]): Promise<Uint8Array> {
      if (entries.length === 0) {
        return new Uint8Array(0);
      }

      // Dynamic import — not a declared dependency
      let duckdb: {
        Database: new () => DuckDBInstance;
      };

      try {
        duckdb = await import("@duckdb/duckdb-wasm" as string);
      } catch {
        try {
          duckdb = await import("@ducklings/workers" as string);
        } catch {
          throw new Error(
            "DuckDB WASM not available. Install @duckdb/duckdb-wasm or @ducklings/workers."
          );
        }
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
      const db = new duckdb.Database();

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
        await db.terminate();
      }
    },
  };
}

/**
 * ParquetMerger that uses DuckDB WASM to read multiple Parquet fragment
 * files and merge them into a single compacted Parquet file.
 *
 * Used by `createCompactor()` to reduce file count after ingest.
 */
export function duckdbWasmParquetMerger(): import("../types.js").ParquetMerger {
  return {
    async merge(fragments: Uint8Array[]): Promise<Uint8Array> {
      if (fragments.length === 0) {
        return new Uint8Array(0);
      }

      let duckdb: {
        Database: new () => DuckDBInstance;
      };

      try {
        duckdb = await import("@duckdb/duckdb-wasm" as string);
      } catch {
        try {
          duckdb = await import("@ducklings/workers" as string);
        } catch {
          throw new Error(
            "DuckDB WASM not available. Install @duckdb/duckdb-wasm or @ducklings/workers."
          );
        }
      }

      const db = new duckdb.Database();

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
        await db.terminate();
      }
    },
  };
}

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
