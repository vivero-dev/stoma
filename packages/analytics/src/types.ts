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

export interface ProcessorConfig {
  source: StorageReader;
  destination: StorageWriter;
  parquetWriter: ParquetWriter;
  format: "standard" | "cloudflare";
  sourcePrefix?: string;
  destinationPrefix?: string;
  deleteProcessed?: boolean;
  maxEntriesPerFile?: number;
}

export interface ProcessorResult {
  filesProcessed: number;
  entriesExtracted: number;
  parquetFilesWritten: number;
  filesDeleted: number;
  durationMs: number;
  errors: string[];
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

export interface CompactorConfig {
  storage: CompactorStorage;
  merger: ParquetMerger;
  prefix?: string;
  granularity?: "hour" | "day" | "month";
  before?: Date;
  deleteFragments?: boolean;
}

export interface CompactorResult {
  partitionsCompacted: number;
  fragmentsRead: number;
  fragmentsDeleted: number;
  compactedFilesWritten: number;
  durationMs: number;
  errors: string[];
}
