import type { CompactorStorage, StorageReader, StorageWriter } from "../types.js";

export interface LocalStorageOptions {
  basePath: string;
}

/**
 * Storage adapter backed by the local filesystem via `fs/promises`.
 *
 * Implements both `StorageReader` and `StorageWriter`.
 * Uses dynamic imports for `node:fs/promises` and `node:path` to
 * avoid bundling Node.js builtins in edge runtimes.
 */
export function localStorageAdapter(
  options: LocalStorageOptions
): StorageReader & StorageWriter & CompactorStorage {
  const { basePath } = options;

  return {
    async list(prefix: string): Promise<string[]> {
      const { readdir } = await import("node:fs/promises");
      const { join } = await import("node:path");

      const dir = join(basePath, prefix);
      const keys: string[] = [];

      try {
        const entries = await readdir(dir, { recursive: true });
        for (const entry of entries) {
          const key = prefix ? `${prefix}/${entry}` : entry;
          keys.push(key);
        }
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
        throw err;
      }

      return keys;
    },

    async read(key: string): Promise<string> {
      const { readFile } = await import("node:fs/promises");
      const { join } = await import("node:path");
      return readFile(join(basePath, key), "utf-8");
    },

    async readBinary(key: string): Promise<Uint8Array> {
      const { readFile } = await import("node:fs/promises");
      const { join } = await import("node:path");
      return new Uint8Array(await readFile(join(basePath, key)));
    },

    async delete(key: string): Promise<void> {
      const { unlink } = await import("node:fs/promises");
      const { join } = await import("node:path");
      await unlink(join(basePath, key));
    },

    async write(key: string, data: Uint8Array): Promise<void> {
      const { writeFile, mkdir } = await import("node:fs/promises");
      const { join, dirname } = await import("node:path");
      const fullPath = join(basePath, key);
      await mkdir(dirname(fullPath), { recursive: true });
      await writeFile(fullPath, data);
    },
  };
}
