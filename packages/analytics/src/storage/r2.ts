import type { CompactorStorage, StorageReader, StorageWriter } from "../types.js";

export interface R2StorageOptions {
  bucket: R2Bucket;
}

/**
 * Storage adapter backed by Cloudflare R2.
 *
 * Implements both `StorageReader` and `StorageWriter` using an R2 bucket binding.
 */
export function r2Storage(
  options: R2StorageOptions
): StorageReader & StorageWriter & CompactorStorage {
  const { bucket } = options;

  return {
    async list(prefix: string): Promise<string[]> {
      const keys: string[] = [];
      let cursor: string | undefined;

      do {
        const result = await bucket.list({ prefix, cursor });
        for (const obj of result.objects) {
          keys.push(obj.key);
        }
        cursor = result.truncated ? result.cursor : undefined;
      } while (cursor);

      return keys;
    },

    async read(key: string): Promise<string> {
      const obj = await bucket.get(key);
      if (!obj) throw new Error(`R2 object not found: ${key}`);
      return obj.text();
    },

    async readBinary(key: string): Promise<Uint8Array> {
      const obj = await bucket.get(key);
      if (!obj) throw new Error(`R2 object not found: ${key}`);
      return new Uint8Array(await obj.arrayBuffer());
    },

    async delete(key: string): Promise<void> {
      await bucket.delete(key);
    },

    async write(key: string, data: Uint8Array): Promise<void> {
      await bucket.put(key, data);
    },
  };
}
