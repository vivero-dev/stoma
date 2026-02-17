import { ndjsonPassthroughWriter } from "../parquet/ndjson-passthrough.js";
import { createProcessor } from "../processor/index.js";
import { localStorageAdapter } from "../storage/local.js";

export interface StandaloneOptions {
  /** Path to directory containing raw log files. */
  sourcePath: string;
  /** Path to directory for processed output. */
  outputPath: string;
  /** Log format: "standard" or "cloudflare". */
  format?: "standard" | "cloudflare";
  /** Source key prefix to scan. */
  sourcePrefix?: string;
  /** Destination key prefix for output. */
  destinationPrefix?: string;
  /** Whether to delete processed source files. */
  deleteProcessed?: boolean;
}

/**
 * Run the analytics processor as a standalone Node/Bun CLI task.
 *
 * Uses local filesystem storage and NDJSON passthrough by default.
 * Install `@duckdb/duckdb-wasm` to get Parquet output instead.
 *
 * @example
 * ```ts
 * import { runStandalone } from "@homegrower-club/stoma-analytics/worker";
 *
 * await runStandalone({
 *   sourcePath: "./logs",
 *   outputPath: "./output",
 *   format: "standard",
 *   deleteProcessed: true,
 * });
 * ```
 */
export async function runStandalone(options: StandaloneOptions) {
  const {
    sourcePath,
    outputPath,
    format = "standard",
    sourcePrefix,
    destinationPrefix,
    deleteProcessed,
  } = options;

  // Try to use DuckDB WASM if available, fall back to NDJSON
  let parquetWriter;
  try {
    const { duckdbWasmParquetWriter } = await import(
      "../parquet/duckdb-wasm.js"
    );
    parquetWriter = duckdbWasmParquetWriter();
  } catch {
    parquetWriter = ndjsonPassthroughWriter();
  }

  const processor = createProcessor({
    source: localStorageAdapter({ basePath: sourcePath }),
    destination: localStorageAdapter({ basePath: outputPath }),
    parquetWriter,
    format,
    sourcePrefix,
    destinationPrefix,
    deleteProcessed,
  });

  const result = await processor.run();
  console.log(JSON.stringify(result, null, 2));
  return result;
}
