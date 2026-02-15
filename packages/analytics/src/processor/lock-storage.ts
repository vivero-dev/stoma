import type { ProcessingLock, ProcessedFileTracker, StorageReader, StorageWriter } from "../types.js";

interface LockData {
  owner: string;
  expiresAt: number;
}

type StorageAdapter = Pick<StorageReader, "read" | "delete"> & Pick<StorageWriter, "write">;

export function createStorageLock(storage: StorageAdapter): ProcessingLock {
  return {
    async acquire(lockKey: string, owner: string, ttlMs: number): Promise<boolean> {
      const path = `__locks/${lockKey}.json`;
      try {
        const content = await storage.read(path);
        const data: LockData = JSON.parse(content);
        if (data.expiresAt > Date.now()) {
          return false; // Still locked
        }
      } catch {
        // No lock file or read error — proceed to acquire
      }
      const lockData: LockData = { owner, expiresAt: Date.now() + ttlMs };
      await storage.write(path, new TextEncoder().encode(JSON.stringify(lockData)));
      return true;
    },
    async release(lockKey: string, owner: string): Promise<void> {
      const path = `__locks/${lockKey}.json`;
      try {
        const content = await storage.read(path);
        const data: LockData = JSON.parse(content);
        if (data.owner === owner) {
          await storage.delete(path);
        }
      } catch {
        // No lock to release
      }
    },
    async isLocked(lockKey: string): Promise<boolean> {
      const path = `__locks/${lockKey}.json`;
      try {
        const content = await storage.read(path);
        const data: LockData = JSON.parse(content);
        return data.expiresAt > Date.now();
      } catch {
        return false;
      }
    },
  };
}

interface TrackerManifest {
  keys: string[];
}

export function createStorageFileTracker(
  storage: StorageAdapter,
  opts?: { maxKeys?: number }
): ProcessedFileTracker {
  const maxKeys = opts?.maxKeys ?? 10_000;
  const manifestPath = "__processed/manifest.json";

  async function readManifest(): Promise<Set<string>> {
    try {
      const content = await storage.read(manifestPath);
      const data: TrackerManifest = JSON.parse(content);
      return new Set(data.keys);
    } catch {
      return new Set();
    }
  }

  async function writeManifest(keys: Set<string>): Promise<void> {
    // If over maxKeys, keep only the most recent (last added)
    let arr = Array.from(keys);
    if (arr.length > maxKeys) {
      arr = arr.slice(arr.length - maxKeys);
    }
    const data: TrackerManifest = { keys: arr };
    await storage.write(manifestPath, new TextEncoder().encode(JSON.stringify(data)));
  }

  return {
    async isProcessed(key: string): Promise<boolean> {
      const keys = await readManifest();
      return keys.has(key);
    },
    async markProcessed(key: string): Promise<void> {
      const keys = await readManifest();
      keys.add(key);
      await writeManifest(keys);
    },
    async unmark(key: string): Promise<void> {
      const keys = await readManifest();
      keys.delete(key);
      await writeManifest(keys);
    },
  };
}
