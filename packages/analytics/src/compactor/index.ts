import type { CompactorConfig, CompactorResult } from "../types.js";

/**
 * Create a compactor that merges small Parquet fragment files into larger
 * compacted files, one per time partition.
 *
 * Runs after the ingest processor to reduce file count for efficient
 * DuckDB querying. Idempotent — re-running on already-compacted partitions
 * is a no-op.
 */
export function createCompactor(config: CompactorConfig) {
  const {
    storage,
    merger,
    prefix = "analytics",
    granularity = "day",
    before = new Date(Date.now() - 24 * 60 * 60 * 1000),
    deleteFragments = true,
  } = config;

  return {
    async run(): Promise<CompactorResult> {
      const startTime = Date.now();
      const result: CompactorResult = {
        partitionsCompacted: 0,
        fragmentsRead: 0,
        fragmentsDeleted: 0,
        compactedFilesWritten: 0,
        durationMs: 0,
        errors: [],
      };

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

      const partitions = groupByPartition(allFiles, prefix, granularity);
      const eligible = filterBeforeCutoff(partitions, granularity, before);

      for (const [partitionKey, allPartitionFiles] of eligible) {
        // Separate compacted file from fragment files
        const compactedPath = `${prefix}/${partitionKey}/compacted.parquet`;
        const fragments = allPartitionFiles.filter(
          (f) => f !== compactedPath
        );

        // Skip if no new fragments to compact
        if (fragments.length === 0) continue;

        try {
          // Read all files in the partition (fragments + existing compacted)
          const fileBuffers: Uint8Array[] = [];
          for (const path of allPartitionFiles) {
            const buffer = await storage.readBinary(path);
            fileBuffers.push(buffer);
            result.fragmentsRead++;
          }

          // Merge into a single compacted Parquet file
          const compactedBytes = await merger.merge(fileBuffers);

          await storage.write(compactedPath, compactedBytes);
          result.compactedFilesWritten++;
          result.partitionsCompacted++;

          // Delete only the fragment files (compacted.parquet is overwritten)
          if (deleteFragments) {
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
          }
        } catch (err) {
          result.errors.push(
            `Failed to compact partition ${partitionKey}: ${err instanceof Error ? err.message : String(err)}`
          );
        }
      }

      result.durationMs = Date.now() - startTime;
      return result;
    },
  };
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
