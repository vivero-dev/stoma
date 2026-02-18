// Types
export {
  ANALYTICS_TYPE,
  type AnalyticsEntry,
  type StorageReader,
  type StorageWriter,
  type ParquetWriter,
  type ProcessorConfig,
  type ProcessorResult,
  type ProcessorMetrics,
  type CompactorStorage,
  type ParquetMerger,
  type StreamingParquetMerger,
  isStreamingMerger,
  type CompactorConfig,
  type CompactorResult,
  type CompactorMetrics,
  type ProcessingLock,
  type ProcessedFileTracker,
} from "./types.js";

// Policy
export { analyticsLog, type AnalyticsLogConfig } from "./policy/analytics.js";

// Processor
export { createProcessor } from "./processor/index.js";
export { parseStandardLine } from "./processor/formats/standard.js";
export { parseCloudflareEvent } from "./processor/formats/cloudflare.js";
export { parseWorkersTraceEvent } from "./processor/formats/workers-trace-event.js";

// Lock & Deduplication
export {
  createInMemoryLock,
  createInMemoryFileTracker,
} from "./processor/lock-memory.js";
export {
  createStorageLock,
  createStorageFileTracker,
} from "./processor/lock-storage.js";

// Compactor
export { createCompactor } from "./compactor/index.js";

// Storage
export { r2Storage } from "./storage/r2.js";
export { localStorageAdapter } from "./storage/local.js";

// Parquet
export { duckdbWasmParquetWriter } from "./parquet/duckdb-wasm.js";
export { duckdbWasmParquetMerger } from "./parquet/duckdb-wasm.js";
export {
  duckdbWasmStreamingMerger,
  destroyDuckDBPool,
} from "./parquet/duckdb-wasm.js";
export { ndjsonPassthroughWriter } from "./parquet/ndjson-passthrough.js";

// Worker
export { createAnalyticsHandler } from "./worker/scheduled.js";

// Debug (re-exported from @vivero/stoma-core)
export {
  createDebugger,
  createDebugFactory,
  type DebugLogger,
} from "@vivero/stoma-core";
