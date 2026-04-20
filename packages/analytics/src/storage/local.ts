import type {
  CompactorStorage,
  StorageReader,
  StorageWriter,
} from "../types.js";

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

  /** Resolve a key to a full path and verify it stays within basePath. */
  async function safePath(key: string): Promise<string> {
    const { resolve, sep } = await import("node:path");
    if (!key || !key.trim()) {
      throw new Error("Storage key must not be empty");
    }
    const resolved = resolve(basePath, key);
    if (!resolved.startsWith(basePath + sep) && resolved !== basePath) {
      throw new Error("Storage key must not escape basePath");
    }
    return resolved;
  }

  return {
    async list(prefix: string): Promise<string[]> {
      const { readdir } = await import("node:fs/promises");
      const { resolve, relative, sep } = await import("node:path");

      const dir = resolve(basePath, prefix || ".");
      if (!dir.startsWith(basePath + sep) && dir !== basePath) {
        return [];
      }
      const keys: string[] = [];

      try {
        const entries = await readdir(dir, {
          recursive: true,
          withFileTypes: true,
        });
        for (const entry of entries) {
          if (!entry.isFile()) continue;
          const fullPath = resolve(entry.parentPath, entry.name);
          const relPath = relative(basePath, fullPath);
          if (relPath.startsWith("..")) continue;
          keys.push(relPath);
        }
      } catch (err) {
        const code = (err as NodeJS.ErrnoException).code;
        if (code === "ENOENT" || code === "ENOTDIR") return [];
        throw err;
      }

      return keys;
    },

    async read(key: string): Promise<string> {
      const { readFile } = await import("node:fs/promises");
      const fullPath = await safePath(key);
      return readFile(fullPath, "utf-8");
    },

    async readBinary(key: string): Promise<Uint8Array> {
      const { readFile } = await import("node:fs/promises");
      const fullPath = await safePath(key);
      return new Uint8Array(await readFile(fullPath));
    },

    async delete(key: string): Promise<void> {
      const { unlink, readdir, rmdir } = await import("node:fs/promises");
      const { dirname, sep } = await import("node:path");
      const fullPath = await safePath(key);
      await unlink(fullPath);

      // Clean up empty parent directories up to basePath
      let dir = dirname(fullPath);
      while (dir.startsWith(basePath + sep) && dir !== basePath) {
        try {
          const entries = await readdir(dir);
          if (entries.length > 0) break;
          await rmdir(dir);
          dir = dirname(dir);
        } catch {
          break;
        }
      }
    },

    async write(key: string, data: Uint8Array): Promise<void> {
      const { writeFile, mkdir } = await import("node:fs/promises");
      const { dirname } = await import("node:path");
      const fullPath = await safePath(key);
      await mkdir(dirname(fullPath), { recursive: true });
      await writeFile(fullPath, data);
    },
  };
}
