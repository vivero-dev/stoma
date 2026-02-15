/// <reference types="@cloudflare/workers-types" />
import { duckdbWasmParquetWriter } from "../parquet/duckdb-wasm.js";
import { createProcessor } from "../processor/index.js";
import { r2Storage } from "../storage/r2.js";
import type { ProcessorResult } from "../types.js";

export interface AnalyticsHandlerOptions {
  onResult?: (result: ProcessorResult) => void;
  onError?: (error: unknown) => void;
}

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
export function createAnalyticsHandler(opts?: AnalyticsHandlerOptions) {
  const onResult =
    opts?.onResult ??
    ((result: ProcessorResult) => {
      console.log(
        JSON.stringify({ _type: "stoma_analytics_processor", ...result })
      );
    });

  const onError =
    opts?.onError ??
    ((error: unknown) => {
      console.error(
        JSON.stringify({
          _type: "stoma_analytics_processor_error",
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        })
      );
    });

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
      processor.run().then(onResult).catch(onError)
    );
  };
}
