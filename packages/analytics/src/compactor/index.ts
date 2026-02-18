import type {
  CompactorConfig,
  CompactorResult,
  CompactorMetrics,
} from "../types.js";
import { isStreamingMerger } from "../types.js";
import { createDebugger, type DebugLogger } from "@vivero/stoma-core";

/**
 * Create a compactor that merges small Parquet fragment files into larger
 * compacted files, one per time partition.
 *
 * Runs after the ingest processor to reduce file count for efficient
 * DuckDB querying. Idempotent — re-running on already-compacted partitions
 * is a no-op.
 *
 * When the merger implements `StreamingParquetMerger`, fragments are merged
 * in chunks of `chunkSize` to bound memory usage. Otherwise all fragments
 * are merged in a single pass (backward compatible).
 */
export function createCompactor(config: CompactorConfig) {
  const {
    storage,
    merger,
    prefix = "analytics",
    granularity = "day",
    before = new Date(Date.now() - 24 * 60 * 60 * 1000),
    deleteFragments = true,
    debug: debugConfig,
    concurrency = 5,
  } = config;

  const debug: DebugLogger = createDebugger(
    "stoma-analytics:compactor",
    debugConfig
  );

  return {
    async run(): Promise<CompactorResult> {
      const startTime = Date.now();
      const metrics: CompactorMetrics = {
        listDurationMs: 0,
        readDurationMs: 0,
        mergeDurationMs: 0,
        writeDurationMs: 0,
        deleteDurationMs: 0,
        partitionsListed: 0,
        partitionsSkipped: 0,
        totalFragmentBytes: 0,
        compactedBytes: 0,
      };
      const result: CompactorResult = {
        partitionsCompacted: 0,
        fragmentsRead: 0,
        fragmentsDeleted: 0,
        compactedFilesWritten: 0,
        durationMs: 0,
        errors: [],
        metrics,
      };

      const listStart = Date.now();
      let allFiles: string[];
      try {
        allFiles = await storage.list(prefix);
      } catch (err) {
        result.errors.push(
          `Failed to list files: ${err instanceof Error ? err.message : String(err)}`
        );
        result.durationMs = Date.now() - startTime;
        return result;
      }
      metrics.listDurationMs = Date.now() - listStart;

      const partitions = groupByPartition(allFiles, prefix, granularity);
      const eligible = filterBeforeCutoff(partitions, granularity, before);
      metrics.partitionsListed = partitions.size;
      metrics.partitionsSkipped = partitions.size - eligible.size;
      debug(
        "listed %d partitions, %d eligible",
        partitions.size,
        eligible.size
      );

      const streaming = isStreamingMerger(merger);

      for (const [partitionKey, allPartitionFiles] of eligible) {
        // Separate compacted file from fragment files
        const compactedPath = `${prefix}/${partitionKey}/compacted.parquet`;
        const fragments = allPartitionFiles.filter(
          (f) => f !== compactedPath
        );

        // Skip if no new fragments to compact
        if (fragments.length === 0) continue;

        try {
          const readStart = Date.now();

          // Read all files in the partition (fragments + existing compacted)
          const fileBuffers: Uint8Array[] = await mapConcurrent(
            allPartitionFiles,
            concurrency,
            async (path) => {
              const buffer = await storage.readBinary(path);
              result.fragmentsRead++;
              metrics.totalFragmentBytes += buffer.byteLength;
              return buffer;
            }
          );
          metrics.readDurationMs += Date.now() - readStart;

          // Merge into a single compacted Parquet file
          const mergeStart = Date.now();
          let compactedBytes: Uint8Array;

          if (streaming && fileBuffers.length > merger.chunkSize) {
            debug(
              "streaming merge for partition %s (%d fragments, chunkSize=%d)",
              partitionKey,
              fileBuffers.length,
              merger.chunkSize
            );
            compactedBytes = await streamingMerge(
              fileBuffers,
              merger,
              merger.chunkSize
            );
          } else {
            compactedBytes = await merger.merge(fileBuffers);
          }
          metrics.mergeDurationMs += Date.now() - mergeStart;
          metrics.compactedBytes += compactedBytes.byteLength;

          const writeStart = Date.now();
          await storage.write(compactedPath, compactedBytes);
          metrics.writeDurationMs += Date.now() - writeStart;
          result.compactedFilesWritten++;
          result.partitionsCompacted++;
          debug(
            "compacted partition %s: %d fragments → %d bytes",
            partitionKey,
            allPartitionFiles.length,
            compactedBytes.byteLength
          );

          // Delete only the fragment files (compacted.parquet is overwritten)
          if (deleteFragments) {
            const deleteStart = Date.now();
            for (const path of fragments) {
              try {
                await storage.delete(path);
                result.fragmentsDeleted++;
              } catch (err) {
                result.errors.push(
                  `Failed to delete ${path}: ${err instanceof Error ? err.message : String(err)}`
                );
              }
            }
            metrics.deleteDurationMs += Date.now() - deleteStart;
          }
        } catch (err) {
          result.errors.push(
            `Failed to compact partition ${partitionKey}: ${err instanceof Error ? err.message : String(err)}`
          );
        }
      }

      result.durationMs = Date.now() - startTime;
      debug(
        "run complete: %d partitions compacted, %d fragments read, %d files written",
        result.partitionsCompacted,
        result.fragmentsRead,
        result.compactedFilesWritten
      );
      return result;
    },
  };
}

/**
 * Streaming merge: process fragments in chunks, feeding the output of one
 * pass as the first input of the next pass. Bounds memory to ~chunkSize
 * fragments at a time.
 */
async function streamingMerge(
  fragments: Uint8Array[],
  merger: { mergeChunk(fragments: Uint8Array[]): Promise<Uint8Array> },
  chunkSize: number
): Promise<Uint8Array> {
  let remaining = [...fragments];

  while (remaining.length > 1) {
    const nextRound: Uint8Array[] = [];
    for (let i = 0; i < remaining.length; i += chunkSize) {
      const chunk = remaining.slice(i, i + chunkSize);
      if (chunk.length === 1) {
        nextRound.push(chunk[0]);
      } else {
        const merged = await merger.mergeChunk(chunk);
        nextRound.push(merged);
      }
    }
    remaining = nextRound;
  }

  return remaining[0];
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
 * Group file paths by their time partition based on the path structure
 * `{prefix}/{YYYY}/{MM}/{DD}/{HH}/{filename}.parquet`.
 */
export function groupByPartition(
  files: string[],
  prefix: string,
  granularity: "hour" | "day" | "month"
): Map<string, string[]> {
  const partitions = new Map<string, string[]>();
  const prefixSlash = prefix.endsWith("/") ? prefix : `${prefix}/`;

  for (const file of files) {
    if (!file.startsWith(prefixSlash)) continue;

    const relativePath = file.slice(prefixSlash.length);
    const parts = relativePath.split("/");

    // Need at least YYYY/MM/DD/filename for day, YYYY/MM/DD/HH/filename for hour
    let partitionKey: string;
    switch (granularity) {
      case "hour":
        if (parts.length < 5) continue;
        partitionKey = `${parts[0]}/${parts[1]}/${parts[2]}/${parts[3]}`;
        break;
      case "day":
        if (parts.length < 4) continue;
        partitionKey = `${parts[0]}/${parts[1]}/${parts[2]}`;
        break;
      case "month":
        if (parts.length < 3) continue;
        partitionKey = `${parts[0]}/${parts[1]}`;
        break;
    }

    const existing = partitions.get(partitionKey) ?? [];
    existing.push(file);
    partitions.set(partitionKey, existing);
  }

  return partitions;
}

/**
 * Filter partitions to only those whose entire time range is before the
 * cutoff date.
 */
export function filterBeforeCutoff(
  partitions: Map<string, string[]>,
  granularity: "hour" | "day" | "month",
  before: Date
): Map<string, string[]> {
  const result = new Map<string, string[]>();

  for (const [key, files] of partitions) {
    const parts = key.split("/").map(Number);

    let partitionEnd: Date;
    switch (granularity) {
      case "hour":
        // End of this hour = start of next hour
        partitionEnd = new Date(
          Date.UTC(parts[0], parts[1] - 1, parts[2], parts[3] + 1)
        );
        break;
      case "day":
        // End of this day = start of next day
        partitionEnd = new Date(
          Date.UTC(parts[0], parts[1] - 1, parts[2] + 1)
        );
        break;
      case "month":
        // End of this month = start of next month
        // parts[1] is 1-indexed, Date.UTC month is 0-indexed,
        // so parts[1] as 0-indexed = next month
        partitionEnd = new Date(Date.UTC(parts[0], parts[1]));
        break;
    }

    if (partitionEnd <= before) {
      result.set(key, files);
    }
  }

  return result;
}
