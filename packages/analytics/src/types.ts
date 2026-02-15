export const ANALYTICS_TYPE = "stoma_analytics" as const;

export interface AnalyticsEntry {
  _type: typeof ANALYTICS_TYPE;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Gateway name from config (low cardinality) */
  gatewayName: string;
  /** Matched route pattern, e.g. "/users/*" (low cardinality) */
  routePath: string;
  /** HTTP method (low cardinality) */
  method: string;
  /** HTTP status code (low cardinality) */
  statusCode: number;
  /** End-to-end latency in milliseconds (aggregatable) */
  durationMs: number;
  /** Response body size in bytes (aggregatable) */
  responseSize: number;
  /** W3C trace ID for drill-down correlation to request logs */
  traceId?: string;
  /** Extensible low-cardinality key/value metadata */
  dimensions?: Record<string, string | number | boolean>;
}

export interface StorageReader {
  list(prefix: string): Promise<string[]>;
  read(key: string): Promise<string>;
  delete(key: string): Promise<void>;
}

export interface StorageWriter {
  write(key: string, data: Uint8Array): Promise<void>;
}

export interface ParquetWriter {
  toParquet(entries: AnalyticsEntry[]): Promise<Uint8Array>;
}

// ── Processing Lock ────────────────────────────────────────────────────

export interface ProcessingLock {
  acquire(lockKey: string, owner: string, ttlMs: number): Promise<boolean>;
  release(lockKey: string, owner: string): Promise<void>;
  isLocked(lockKey: string): Promise<boolean>;
}

export interface ProcessedFileTracker {
  isProcessed(key: string): Promise<boolean>;
  markProcessed(key: string): Promise<void>;
  unmark(key: string): Promise<void>;
}

// ── Processor ──────────────────────────────────────────────────────────

export interface ProcessorConfig {
  source: StorageReader;
  destination: StorageWriter;
  parquetWriter: ParquetWriter;
  format: "standard" | "cloudflare" | "workers-trace-event";
  sourcePrefix?: string;
  destinationPrefix?: string;
  deleteProcessed?: boolean;
  maxEntriesPerFile?: number;
  /** Filter keys returned by list(). Default: accept .ndjson, .json, .log files. */
  fileFilter?: (key: string) => boolean;
  /** Max parallel file reads. Default: 5. */
  concurrency?: number;
  /** Controls debug output. true = all, string = namespace pattern. */
  debug?: boolean | string;
  /** Processing lock to prevent overlapping runs. */
  lock?: ProcessingLock;
  /** Tracker to skip already-processed files. */
  processedTracker?: ProcessedFileTracker;
  /** Lock key for this processor instance. Default: "processor". */
  lockKey?: string;
  /** Lock TTL in milliseconds. Default: 300_000 (5 minutes). */
  lockTtlMs?: number;
}

// ── Processor Metrics ──────────────────────────────────────────────────

export interface ProcessorMetrics {
  listDurationMs: number;
  readDurationMs: number;
  parseDurationMs: number;
  writeDurationMs: number;
  deleteDurationMs: number;
  filesListed: number;
  filesFiltered: number;
  filesDeduped: number;
}

export interface ProcessorResult {
  filesProcessed: number;
  entriesExtracted: number;
  parquetFilesWritten: number;
  filesDeleted: number;
  durationMs: number;
  errors: string[];
  metrics?: ProcessorMetrics;
}

// ── Compactor ──────────────────────────────────────────────────────────

export interface CompactorStorage {
  list(prefix: string): Promise<string[]>;
  readBinary(key: string): Promise<Uint8Array>;
  write(key: string, data: Uint8Array): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface ParquetMerger {
  merge(fragments: Uint8Array[]): Promise<Uint8Array>;
}

export interface StreamingParquetMerger extends ParquetMerger {
  chunkSize: number;
  mergeChunk(fragments: Uint8Array[]): Promise<Uint8Array>;
}

export function isStreamingMerger(
  m: ParquetMerger
): m is StreamingParquetMerger {
  return "chunkSize" in m && "mergeChunk" in m;
}

export interface CompactorConfig {
  storage: CompactorStorage;
  merger: ParquetMerger;
  prefix?: string;
  granularity?: "hour" | "day" | "month";
  before?: Date;
  deleteFragments?: boolean;
  /** Controls debug output. true = all, string = namespace pattern. */
  debug?: boolean | string;
  /** Max parallel fragment reads. Default: 5. */
  concurrency?: number;
}

// ── Compactor Metrics ──────────────────────────────────────────────────

export interface CompactorMetrics {
  listDurationMs: number;
  readDurationMs: number;
  mergeDurationMs: number;
  writeDurationMs: number;
  deleteDurationMs: number;
  partitionsListed: number;
  partitionsSkipped: number;
  totalFragmentBytes: number;
  compactedBytes: number;
}

export interface CompactorResult {
  partitionsCompacted: number;
  fragmentsRead: number;
  fragmentsDeleted: number;
  compactedFilesWritten: number;
  durationMs: number;
  errors: string[];
  metrics?: CompactorMetrics;
}
