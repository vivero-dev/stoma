import type { ProcessingLock, ProcessedFileTracker } from "../types.js";

export function createInMemoryLock(): ProcessingLock {
  const locks = new Map<string, { owner: string; expiresAt: number }>();

  return {
    async acquire(lockKey: string, owner: string, ttlMs: number): Promise<boolean> {
      const existing = locks.get(lockKey);
      if (existing && existing.expiresAt > Date.now()) {
        return false; // Already locked by someone (or self)
      }
      locks.set(lockKey, { owner, expiresAt: Date.now() + ttlMs });
      return true;
    },
    async release(lockKey: string, owner: string): Promise<void> {
      const existing = locks.get(lockKey);
      if (existing && existing.owner === owner) {
        locks.delete(lockKey);
      }
    },
    async isLocked(lockKey: string): Promise<boolean> {
      const existing = locks.get(lockKey);
      if (!existing) return false;
      if (existing.expiresAt <= Date.now()) {
        locks.delete(lockKey);
        return false;
      }
      return true;
    },
  };
}

export function createInMemoryFileTracker(): ProcessedFileTracker {
  const processed = new Set<string>();

  return {
    async isProcessed(key: string): Promise<boolean> {
      return processed.has(key);
    },
    async markProcessed(key: string): Promise<void> {
      processed.add(key);
    },
    async unmark(key: string): Promise<void> {
      processed.delete(key);
    },
  };
}
