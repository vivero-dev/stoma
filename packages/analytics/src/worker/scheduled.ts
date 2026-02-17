import { duckdbWasmParquetWriter } from "../parquet/duckdb-wasm.js";
import { createProcessor } from "../processor/index.js";
import { r2Storage } from "../storage/r2.js";

export interface AnalyticsWorkerEnv {
  /** R2 bucket containing raw log files (source). */
  LOGS: R2Bucket;
  /** R2 bucket for processed Parquet output (destination). */
  OUTPUT: R2Bucket;
  /** Log format: "standard" for plain NDJSON, "cloudflare" for Workers Trace Events. */
  FORMAT?: string;
  /** Source key prefix to scan. */
  SOURCE_PREFIX?: string;
  /** Destination key prefix for output. */
  DESTINATION_PREFIX?: string;
  /** Whether to delete processed source files. */
  DELETE_PROCESSED?: string;
}

/**
 * Create a Cloudflare Workers scheduled event handler for analytics processing.
 *
 * @example
 * ```ts
 * import { createAnalyticsHandler } from "@homegrower-club/stoma-analytics/worker";
 *
 * export default {
 *   scheduled: createAnalyticsHandler(),
 * };
 * ```
 */
export function createAnalyticsHandler() {
  return async (
    _event: ScheduledEvent,
    env: AnalyticsWorkerEnv,
    ctx: ExecutionContext
  ) => {
    const processor = createProcessor({
      source: r2Storage({ bucket: env.LOGS }),
      destination: r2Storage({ bucket: env.OUTPUT }),
      parquetWriter: duckdbWasmParquetWriter(),
      format: (env.FORMAT as "standard" | "cloudflare") ?? "cloudflare",
      sourcePrefix: env.SOURCE_PREFIX ?? "",
      destinationPrefix: env.DESTINATION_PREFIX ?? "analytics",
      deleteProcessed: env.DELETE_PROCESSED === "true",
    });

    ctx.waitUntil(
      processor.run().then((result) => {
        console.log(JSON.stringify({ _type: "stoma_analytics_processor", ...result }));
      })
    );
  };
}
