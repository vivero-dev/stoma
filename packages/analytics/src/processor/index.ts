import type {
  AnalyticsEntry,
  ProcessorConfig,
  ProcessorResult,
  ProcessorMetrics,
} from "../types.js";
import { createDebugger, type DebugLogger } from "@homegrower-club/stoma-core";
import { parseCloudflareEvent } from "./formats/cloudflare.js";
import { parseStandardLine } from "./formats/standard.js";

const DEFAULT_FILE_EXTENSIONS = [".ndjson", ".json", ".log"];

function defaultFileFilter(key: string): boolean {
  return DEFAULT_FILE_EXTENSIONS.some((ext) => key.endsWith(ext));
}

async function mapConcurrent<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i]);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker()
  );
  await Promise.all(workers);
  return results;
}

/**
 * Create a processor that reads raw NDJSON logs, extracts analytics entries,
 * converts them to Parquet (or passthrough NDJSON), and writes the output.
 *
 * Memory is bounded by `maxEntriesPerFile` — entries are flushed to the
 * parquet writer in batches as they're extracted, not accumulated across
 * all source files.
 */
export function createProcessor(config: ProcessorConfig) {
  const {
    source,
    destination,
    parquetWriter,
    format,
    sourcePrefix = "",
    destinationPrefix = "analytics",
    deleteProcessed = false,
    maxEntriesPerFile = 100_000,
    fileFilter = defaultFileFilter,
    concurrency = 5,
    debug: debugConfig,
    lock,
    processedTracker,
    lockKey = "processor",
    lockTtlMs = 300_000,
  } = config;

  const debug: DebugLogger = createDebugger("stoma-analytics:processor", debugConfig);
  const ownerId = `processor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    async run(): Promise<ProcessorResult> {
      const startTime = Date.now();
      const metrics: ProcessorMetrics = {
        listDurationMs: 0,
        readDurationMs: 0,
        parseDurationMs: 0,
        writeDurationMs: 0,
        deleteDurationMs: 0,
        filesListed: 0,
        filesFiltered: 0,
        filesDeduped: 0,
      };
      const result: ProcessorResult = {
        filesProcessed: 0,
        entriesExtracted: 0,
        parquetFilesWritten: 0,
        filesDeleted: 0,
        durationMs: 0,
        errors: [],
        metrics,
      };

      // 1. Acquire lock if configured
      if (lock) {
        debug("acquiring lock key=%s ttl=%dms", lockKey, lockTtlMs);
        const acquired = await lock.acquire(lockKey, ownerId, lockTtlMs);
        if (!acquired) {
          debug("lock acquisition failed — another run is in progress");
          result.errors.push("Processor already locked");
          result.durationMs = Date.now() - startTime;
          return result;
        }
        debug("lock acquired owner=%s", ownerId);
      }

      try {
        // 2. List keys from source
        let keys: string[];
        const listStart = Date.now();
        try {
          keys = await source.list(sourcePrefix);
        } catch (err) {
          result.errors.push(
            `Failed to list source files: ${err instanceof Error ? err.message : String(err)}`
          );
          result.durationMs = Date.now() - startTime;
          return result;
        }
        metrics.listDurationMs = Date.now() - listStart;
        metrics.filesListed = keys.length;
        debug("listed %d keys from prefix=%s", keys.length, sourcePrefix);

        // 3. Apply fileFilter
        const filteredKeys = keys.filter(fileFilter);
        metrics.filesFiltered = keys.length - filteredKeys.length;
        debug("filtered %d keys (removed %d)", filteredKeys.length, metrics.filesFiltered);

        // 4. Dedup against processedTracker
        let keysToProcess: string[];
        if (processedTracker) {
          keysToProcess = [];
          for (const key of filteredKeys) {
            const alreadyProcessed = await processedTracker.isProcessed(key);
            if (!alreadyProcessed) {
              keysToProcess.push(key);
            }
          }
          metrics.filesDeduped = filteredKeys.length - keysToProcess.length;
          debug("deduped %d keys (skipped %d already processed)", keysToProcess.length, metrics.filesDeduped);
        } else {
          keysToProcess = filteredKeys;
        }

        // 5. Read files concurrently
        const readStart = Date.now();
        const fileContents = await mapConcurrent(
          keysToProcess,
          concurrency,
          async (key) => {
            try {
              const content = await source.read(key);
              return { key, content, error: null as string | null };
            } catch (err) {
              const msg = `Failed to read ${key}: ${err instanceof Error ? err.message : String(err)}`;
              return { key, content: null as string | null, error: msg };
            }
          }
        );
        metrics.readDurationMs = Date.now() - readStart;

        // 6. Parse entries and flush in batches
        let buffer: AnalyticsEntry[] = [];
        let pendingSourceKeys: string[] = [];
        const processedKeys: string[] = [];

        const flushBuffer = async () => {
          if (buffer.length === 0) return;

          const writeStart = Date.now();
          const keysInBatch = [...pendingSourceKeys];
          pendingSourceKeys = [];

          try {
            const bytes = await parquetWriter.toParquet(buffer);
            const now = new Date();
            const partitionKey = [
              destinationPrefix,
              now.getUTCFullYear().toString(),
              String(now.getUTCMonth() + 1).padStart(2, "0"),
              String(now.getUTCDate()).padStart(2, "0"),
              String(now.getUTCHours()).padStart(2, "0"),
              `${now.getTime()}-${result.parquetFilesWritten}.parquet`,
            ].join("/");

            await destination.write(partitionKey, bytes);
            result.parquetFilesWritten++;
            metrics.writeDurationMs += Date.now() - writeStart;
            debug("flushed %d entries to %s", buffer.length, partitionKey);

            // Mark source files as processed after successful write
            if (processedTracker) {
              for (const sourceKey of keysInBatch) {
                await processedTracker.markProcessed(sourceKey);
              }
              debug("marked %d source keys as processed", keysInBatch.length);
            }
          } catch (err) {
            result.errors.push(
              `Failed to write parquet batch: ${err instanceof Error ? err.message : String(err)}`
            );
          }

          buffer = [];
        };

        const parseStart = Date.now();
        for (const file of fileContents) {
          if (file.error) {
            result.errors.push(file.error);
            continue;
          }

          const lines = file.content!.split("\n");

          for (const line of lines) {
            if (format === "cloudflare" || format === "workers-trace-event") {
              const entries = parseCloudflareEvent(line);
              for (const entry of entries) {
                buffer.push(entry);
                result.entriesExtracted++;
                if (buffer.length >= maxEntriesPerFile) {
                  await flushBuffer();
                }
              }
            } else {
              const entry = parseStandardLine(line);
              if (entry) {
                buffer.push(entry);
                result.entriesExtracted++;
                if (buffer.length >= maxEntriesPerFile) {
                  await flushBuffer();
                }
              }
            }
          }

          result.filesProcessed++;
          processedKeys.push(file.key);
          pendingSourceKeys.push(file.key);
        }
        metrics.parseDurationMs = Date.now() - parseStart;

        // Flush remaining entries
        await flushBuffer();

        // 8. Delete processed files if configured
        if (deleteProcessed) {
          const deleteStart = Date.now();
          for (const key of processedKeys) {
            try {
              await source.delete(key);
              result.filesDeleted++;
            } catch (err) {
              result.errors.push(
                `Failed to delete ${key}: ${err instanceof Error ? err.message : String(err)}`
              );
            }
          }
          metrics.deleteDurationMs = Date.now() - deleteStart;
        }

        debug(
          "run complete: %d files processed, %d entries extracted, %d parquet files written",
          result.filesProcessed,
          result.entriesExtracted,
          result.parquetFilesWritten
        );
      } finally {
        // 9. Release lock
        if (lock) {
          await lock.release(lockKey, ownerId);
          debug("lock released key=%s", lockKey);
        }
      }

      result.durationMs = Date.now() - startTime;
      return result;
    },
  };
}
