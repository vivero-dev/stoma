import { describe, expect, it } from "vitest";
import { redactFields } from "../redact";

describe("redactFields", () => {
  // --- Basic path matching ---

  it("should redact a top-level field", () => {
    const input = { username: "alice", password: "secret123" };
    const result = redactFields(input, { paths: ["password"] });
    expect(result).toEqual({ username: "alice", password: "[REDACTED]" });
  });

  it("should redact a nested field via dot notation", () => {
    const input = { auth: { token: "abc", user: "alice" } };
    const result = redactFields(input, { paths: ["auth.token"] });
    expect(result).toEqual({ auth: { token: "[REDACTED]", user: "alice" } });
  });

  it("should redact multiple paths", () => {
    const input = { password: "p", secret: "s", name: "alice" };
    const result = redactFields(input, { paths: ["password", "secret"] });
    expect(result).toEqual({
      password: "[REDACTED]",
      secret: "[REDACTED]",
      name: "alice",
    });
  });

  // --- Wildcard matching ---

  it("should redact all fields at a level with wildcard", () => {
    const input = {
      user: { password: "secret1" },
      admin: { password: "secret2" },
    };
    const result = redactFields(input, { paths: ["*.password"] });
    expect(result).toEqual({
      user: { password: "[REDACTED]" },
      admin: { password: "[REDACTED]" },
    });
  });

  it("should redact all top-level values with single wildcard", () => {
    const input = { a: 1, b: 2, c: 3 };
    const result = redactFields(input, { paths: ["*"] });
    expect(result).toEqual({
      a: "[REDACTED]",
      b: "[REDACTED]",
      c: "[REDACTED]",
    });
  });

  // --- Custom replacement ---

  it("should use custom replacement text", () => {
    const input = { password: "secret" };
    const result = redactFields(input, {
      paths: ["password"],
      replacement: "***",
    });
    expect(result).toEqual({ password: "***" });
  });

  // --- Non-object passthrough ---

  it("should pass through string input unchanged", () => {
    expect(redactFields("hello", { paths: ["x"] })).toBe("hello");
  });

  it("should pass through number input unchanged", () => {
    expect(redactFields(42, { paths: ["x"] })).toBe(42);
  });

  it("should pass through null input unchanged", () => {
    expect(redactFields(null, { paths: ["x"] })).toBeNull();
  });

  it("should pass through undefined input unchanged", () => {
    expect(redactFields(undefined, { paths: ["x"] })).toBeUndefined();
  });

  // --- Deep clone safety ---

  it("should not modify the original object", () => {
    const input = { password: "secret", name: "alice" };
    redactFields(input, { paths: ["password"] });
    expect(input.password).toBe("secret");
  });

  // --- Missing paths ---

  it("should ignore paths that don't exist in the object", () => {
    const input = { name: "alice" };
    const result = redactFields(input, { paths: ["nonexistent"] });
    expect(result).toEqual({ name: "alice" });
  });

  // --- Deeply nested ---

  it("should redact deeply nested paths", () => {
    const input = { a: { b: { c: { secret: "value" } } } };
    const result = redactFields(input, { paths: ["a.b.c.secret"] });
    expect(result).toEqual({ a: { b: { c: { secret: "[REDACTED]" } } } });
  });

  // --- Arrays ---

  it("should redact fields inside array elements", () => {
    const input = [
      { password: "p1", name: "a" },
      { password: "p2", name: "b" },
    ];
    const result = redactFields(input, { paths: ["password"] });
    expect(result).toEqual([
      { password: "[REDACTED]", name: "a" },
      { password: "[REDACTED]", name: "b" },
    ]);
  });

  // --- Empty paths ---

  it("should return unchanged clone when paths is empty", () => {
    const input = { password: "secret" };
    const result = redactFields(input, { paths: [] });
    expect(result).toEqual({ password: "secret" });
  });

  // --- Wildcard with nested objects ---

  it("should handle wildcard at intermediate level with nested target", () => {
    const input = {
      users: { credentials: { key: "abc" } },
      admins: { credentials: { key: "def" } },
    };
    const result = redactFields(input, { paths: ["*.credentials.key"] });
    expect(result).toEqual({
      users: { credentials: { key: "[REDACTED]" } },
      admins: { credentials: { key: "[REDACTED]" } },
    });
  });
});
