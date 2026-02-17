import type {
  AnalyticsEntry,
  ProcessorConfig,
  ProcessorResult,
} from "../types.js";
import { parseCloudflareEvent } from "./formats/cloudflare.js";
import { parseStandardLine } from "./formats/standard.js";

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
  } = config;

  return {
    async run(): Promise<ProcessorResult> {
      const startTime = Date.now();
      const result: ProcessorResult = {
        filesProcessed: 0,
        entriesExtracted: 0,
        parquetFilesWritten: 0,
        filesDeleted: 0,
        durationMs: 0,
        errors: [],
      };

      let keys: string[];
      try {
        keys = await source.list(sourcePrefix);
      } catch (err) {
        result.errors.push(
          `Failed to list source files: ${err instanceof Error ? err.message : String(err)}`
        );
        result.durationMs = Date.now() - startTime;
        return result;
      }

      let buffer: AnalyticsEntry[] = [];
      const processedKeys: string[] = [];

      const flushBuffer = async () => {
        if (buffer.length === 0) return;

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
        } catch (err) {
          result.errors.push(
            `Failed to write parquet batch: ${err instanceof Error ? err.message : String(err)}`
          );
        }

        buffer = [];
      };

      for (const key of keys) {
        try {
          const content = await source.read(key);
          const lines = content.split("\n");

          for (const line of lines) {
            if (format === "cloudflare") {
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
          processedKeys.push(key);
        } catch (err) {
          result.errors.push(
            `Failed to read ${key}: ${err instanceof Error ? err.message : String(err)}`
          );
        }
      }

      // Flush remaining entries
      await flushBuffer();

      // Only delete files that were successfully processed
      if (deleteProcessed) {
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
      }

      result.durationMs = Date.now() - startTime;
      return result;
    },
  };
}
