import { describe, expect, it } from "vitest";
import { timingSafeEqual } from "../timing-safe";

describe("timingSafeEqual", () => {
  it("should return true for identical strings", () => {
    expect(timingSafeEqual("hello", "hello")).toBe(true);
    expect(timingSafeEqual("", "")).toBe(true);
    expect(timingSafeEqual("a", "a")).toBe(true);
  });

  it("should return false for different strings", () => {
    expect(timingSafeEqual("hello", "world")).toBe(false);
    expect(timingSafeEqual("abc", "abd")).toBe(false);
    expect(timingSafeEqual("a", "b")).toBe(false);
  });

  it("should return false for different lengths", () => {
    expect(timingSafeEqual("short", "longer-string")).toBe(false);
    expect(timingSafeEqual("longer-string", "short")).toBe(false);
    expect(timingSafeEqual("", "notempty")).toBe(false);
    expect(timingSafeEqual("notempty", "")).toBe(false);
  });

  it("should handle unicode strings", () => {
    expect(timingSafeEqual("héllo", "héllo")).toBe(true);
    expect(timingSafeEqual("héllo", "hello")).toBe(false);
  });

  it("should handle API key-like strings", () => {
    const key1 = "sk_test_abc123def456ghi789";
    const key2 = "sk_test_abc123def456ghi789";
    const key3 = "sk_test_abc123def456ghi780";
    expect(timingSafeEqual(key1, key2)).toBe(true);
    expect(timingSafeEqual(key1, key3)).toBe(false);
  });

  it("should differentiate strings that differ only in last character", () => {
    expect(timingSafeEqual("abcdefg1", "abcdefg2")).toBe(false);
  });
});
