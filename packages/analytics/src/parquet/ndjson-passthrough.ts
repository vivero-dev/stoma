import type { AnalyticsEntry, ParquetWriter } from "../types.js";

/**
 * Passthrough "writer" that outputs NDJSON instead of Parquet.
 *
 * Useful as a fallback when DuckDB WASM is not available,
 * or for environments that prefer NDJSON output.
 */
export function ndjsonPassthroughWriter(): ParquetWriter {
  return {
    async toParquet(entries: AnalyticsEntry[]): Promise<Uint8Array> {
      const ndjson = entries.map((e) => JSON.stringify(e)).join("\n") + "\n";
      return new TextEncoder().encode(ndjson);
    },
  };
}
