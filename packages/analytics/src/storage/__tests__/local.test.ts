import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { localStorageAdapter } from "../local.js";

let testDir: string;

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), "stoma-local-test-"));
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});

describe("localStorageAdapter", () => {
  describe("list()", () => {
    it("returns only files, not directories", async () => {
      const storage = localStorageAdapter({ basePath: testDir });

      // Create a nested structure with files and directories
      await mkdir(join(testDir, "logs", "subdir"), { recursive: true });
      await writeFile(join(testDir, "logs", "file1.ndjson"), "data1");
      await writeFile(join(testDir, "logs", "subdir", "file2.ndjson"), "data2");

      const keys = await storage.list("logs");

      expect(keys).toHaveLength(2);
      expect(keys).toContain("logs/file1.ndjson");
      expect(keys).toContain("logs/subdir/file2.ndjson");
      // Should NOT include "subdir" as a bare directory entry
      for (const key of keys) {
        expect(key).toMatch(/\.ndjson$/);
      }
    });

    it("handles ENOENT gracefully (returns empty array)", async () => {
      const storage = localStorageAdapter({ basePath: testDir });

      const keys = await storage.list("nonexistent");

      expect(keys).toEqual([]);
    });

    it("handles nested files correctly", async () => {
      const storage = localStorageAdapter({ basePath: testDir });

      await mkdir(join(testDir, "a", "b", "c"), { recursive: true });
      await writeFile(join(testDir, "a", "top.txt"), "t");
      await writeFile(join(testDir, "a", "b", "mid.txt"), "m");
      await writeFile(join(testDir, "a", "b", "c", "deep.txt"), "d");

      const keys = await storage.list("a");

      expect(keys).toHaveLength(3);
      expect(keys).toContain("a/top.txt");
      expect(keys).toContain("a/b/mid.txt");
      expect(keys).toContain("a/b/c/deep.txt");
    });

    it("returns empty array for empty directory", async () => {
      const storage = localStorageAdapter({ basePath: testDir });

      await mkdir(join(testDir, "empty"), { recursive: true });

      const keys = await storage.list("empty");

      expect(keys).toEqual([]);
    });
  });

  describe("read()", () => {
    it("reads file contents as string", async () => {
      const storage = localStorageAdapter({ basePath: testDir });

      await writeFile(join(testDir, "test.txt"), "hello world");

      const content = await storage.read("test.txt");

      expect(content).toBe("hello world");
    });
  });

  describe("readBinary()", () => {
    it("reads file contents as Uint8Array", async () => {
      const storage = localStorageAdapter({ basePath: testDir });

      const data = new Uint8Array([1, 2, 3, 4, 5]);
      await writeFile(join(testDir, "binary.bin"), data);

      const result = await storage.readBinary("binary.bin");

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result).toEqual(data);
    });
  });

  describe("write()", () => {
    it("creates directories and writes data", async () => {
      const storage = localStorageAdapter({ basePath: testDir });

      const data = new TextEncoder().encode("written content");
      await storage.write("nested/dir/output.txt", data);

      const content = await readFile(
        join(testDir, "nested", "dir", "output.txt"),
        "utf-8"
      );
      expect(content).toBe("written content");
    });
  });

  describe("delete()", () => {
    it("removes files", async () => {
      const storage = localStorageAdapter({ basePath: testDir });

      await writeFile(join(testDir, "to-delete.txt"), "bye");
      await storage.delete("to-delete.txt");

      await expect(storage.read("to-delete.txt")).rejects.toThrow();
    });

    it("cleans up empty parent directories after delete", async () => {
      const { existsSync } = await import("node:fs");
      const storage = localStorageAdapter({ basePath: testDir });

      await storage.write(
        "deep/nested/dir/file.txt",
        new TextEncoder().encode("temp")
      );
      await storage.delete("deep/nested/dir/file.txt");

      expect(existsSync(join(testDir, "deep", "nested", "dir"))).toBe(false);
      expect(existsSync(join(testDir, "deep"))).toBe(false);
    });
  });

  // --- Path traversal prevention ---

  describe("path traversal prevention", () => {
    it("rejects keys with ../ that escape basePath", async () => {
      const storage = localStorageAdapter({ basePath: testDir });
      await expect(
        storage.write("../escape.txt", new TextEncoder().encode("bad"))
      ).rejects.toThrow(/basePath/);
    });

    it("rejects read with ../ path traversal", async () => {
      const storage = localStorageAdapter({ basePath: testDir });
      await expect(storage.read("../escape.txt")).rejects.toThrow(/basePath/);
    });

    it("rejects delete with ../ path traversal", async () => {
      const storage = localStorageAdapter({ basePath: testDir });
      await expect(storage.delete("../escape.txt")).rejects.toThrow(/basePath/);
    });

    it("returns empty array for list with ../ prefix", async () => {
      const storage = localStorageAdapter({ basePath: testDir });
      const keys = await storage.list("../");
      expect(keys).toEqual([]);
    });

    it("rejects empty keys", async () => {
      const storage = localStorageAdapter({ basePath: testDir });
      await expect(
        storage.write("", new TextEncoder().encode("bad"))
      ).rejects.toThrow(/empty/);
      await expect(storage.read("")).rejects.toThrow(/empty/);
    });
  });

  // --- list() edge cases ---

  describe("list() edge cases", () => {
    it("returns empty array when prefix matches a file (ENOTDIR)", async () => {
      const storage = localStorageAdapter({ basePath: testDir });
      await writeFile(join(testDir, "file.txt"), "data");
      const keys = await storage.list("file.txt");
      expect(keys).toEqual([]);
    });
  });
});
