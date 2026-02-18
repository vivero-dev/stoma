/**
 * IndexedDB-backed rate limit store for the browser playground.
 *
 * Persists rate limit counters across service worker restarts using IndexedDB.
 * Expiry is checked on read - no background cleanup interval needed.
 *
 * This file lives in docs/ only. It is NOT part of the Stoma library.
 */
import type { RateLimitStore } from "@vivero/stoma";

/** Shape of each rate limit entry stored in IndexedDB. */
interface RateLimitEntry {
  count: number;
  resetAt: number; // epoch ms
}

const DB_NAME = "stoma-playground";
const STORE_NAME = "rate-limits";
const DB_VERSION = 1;

/**
 * Open (or create) the IndexedDB database.
 * Called on every operation to handle the case where the DB was deleted
 * externally (e.g. via the playground "Reset" button).
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Read a single key from the object store.
 * Returns `undefined` if the key doesn't exist.
 */
function idbGet(
  db: IDBDatabase,
  key: string
): Promise<RateLimitEntry | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);
    request.onsuccess = () =>
      resolve(request.result as RateLimitEntry | undefined);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Write a single key to the object store.
 */
function idbPut(
  db: IDBDatabase,
  key: string,
  value: RateLimitEntry
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(value, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Rate limit store backed by IndexedDB.
 *
 * Each key maps to a `{ count, resetAt }` entry. When the window expires
 * (resetAt < now), a new window is started automatically.
 */
export class IDBRateLimitStore implements RateLimitStore {
  private db: IDBDatabase | null = null;

  async increment(
    key: string,
    windowSeconds: number
  ): Promise<{ count: number; resetAt: number }> {
    // Lazily open the database on first use
    if (!this.db) {
      this.db = await openDB();
    }

    const now = Date.now();
    const existing = await idbGet(this.db, key);

    // If there's a valid (non-expired) entry, increment it
    if (existing && existing.resetAt > now) {
      const updated: RateLimitEntry = {
        count: existing.count + 1,
        resetAt: existing.resetAt,
      };
      await idbPut(this.db, key, updated);
      return updated;
    }

    // Otherwise, start a new window
    const entry: RateLimitEntry = {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    };
    await idbPut(this.db, key, entry);
    return entry;
  }

  /** Close the database connection. */
  destroy(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
