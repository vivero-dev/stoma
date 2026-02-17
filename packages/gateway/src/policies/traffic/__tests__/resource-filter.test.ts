import { describe, expect, it } from "vitest";
import { createPolicyTestHarness } from "../../sdk";
import { resourceFilter } from "../resource-filter";

describe("resourceFilter", () => {
  it("should remove specified fields in deny mode", async () => {
    const { request } = createPolicyTestHarness(
      resourceFilter({ mode: "deny", fields: ["password", "secret"] }),
      {
        upstream: async (c) =>
          c.json({
            username: "alice",
            password: "s3cret",
            secret: "key",
            role: "admin",
          }),
      }
    );
    const res = await request("/test");
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.username).toBe("alice");
    expect(body.role).toBe("admin");
    expect(body.password).toBeUndefined();
    expect(body.secret).toBeUndefined();
  });

  it("should keep only specified fields in allow mode", async () => {
    const { request } = createPolicyTestHarness(
      resourceFilter({ mode: "allow", fields: ["id", "name"] }),
      {
        upstream: async (c) =>
          c.json({
            id: 1,
            name: "Alice",
            email: "a@b.com",
            password: "s3cret",
          }),
      }
    );
    const res = await request("/test");
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.id).toBe(1);
    expect(body.name).toBe("Alice");
    expect(body.email).toBeUndefined();
    expect(body.password).toBeUndefined();
  });

  it("should handle dot-notation paths in deny mode", async () => {
    const { request } = createPolicyTestHarness(
      resourceFilter({ mode: "deny", fields: ["user.password", "user.ssn"] }),
      {
        upstream: async (c) =>
          c.json({
            user: {
              name: "Alice",
              password: "s3cret",
              ssn: "123-45-6789",
              email: "a@b.com",
            },
          }),
      }
    );
    const res = await request("/test");
    const body = (await res.json()) as Record<string, unknown>;
    const user = body.user as Record<string, unknown>;
    expect(user.name).toBe("Alice");
    expect(user.email).toBe("a@b.com");
    expect(user.password).toBeUndefined();
    expect(user.ssn).toBeUndefined();
  });

  it("should handle dot-notation paths in allow mode", async () => {
    const { request } = createPolicyTestHarness(
      resourceFilter({ mode: "allow", fields: ["user.name", "user.email"] }),
      {
        upstream: async (c) =>
          c.json({
            user: { name: "Alice", email: "a@b.com", password: "s3cret" },
            metadata: { created: "2024-01-01" },
          }),
      }
    );
    const res = await request("/test");
    const body = (await res.json()) as Record<string, unknown>;
    const user = body.user as Record<string, unknown>;
    expect(user.name).toBe("Alice");
    expect(user.email).toBe("a@b.com");
    expect(user.password).toBeUndefined();
    expect(body.metadata).toBeUndefined();
  });

  it("should filter array items when applyToArrayItems is true (default)", async () => {
    const { request } = createPolicyTestHarness(
      resourceFilter({ mode: "deny", fields: ["password"] }),
      {
        upstream: async (c) =>
          c.json([
            { name: "Alice", password: "a" },
            { name: "Bob", password: "b" },
          ]),
      }
    );
    const res = await request("/test");
    const body = (await res.json()) as Array<Record<string, unknown>>;
    expect(body).toHaveLength(2);
    expect(body[0].name).toBe("Alice");
    expect(body[0].password).toBeUndefined();
    expect(body[1].name).toBe("Bob");
    expect(body[1].password).toBeUndefined();
  });

  it("should not filter array items when applyToArrayItems is false", async () => {
    const { request } = createPolicyTestHarness(
      resourceFilter({
        mode: "deny",
        fields: ["password"],
        applyToArrayItems: false,
      }),
      {
        upstream: async (c) =>
          c.json([
            { name: "Alice", password: "a" },
            { name: "Bob", password: "b" },
          ]),
      }
    );
    const res = await request("/test");
    const body = (await res.json()) as Array<Record<string, unknown>>;
    expect(body).toHaveLength(2);
    // Items should still have password since applyToArrayItems is false
    expect(body[0].password).toBe("a");
    expect(body[1].password).toBe("b");
  });

  it("should pass through non-JSON responses unchanged", async () => {
    const { request } = createPolicyTestHarness(
      resourceFilter({ mode: "deny", fields: ["password"] }),
      {
        upstream: async (c) => c.text("plain text response"),
      }
    );
    const res = await request("/test");
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toBe("plain text response");
  });

  it("should be a no-op with empty fields array", async () => {
    const { request } = createPolicyTestHarness(
      resourceFilter({ mode: "deny", fields: [] }),
      {
        upstream: async (c) =>
          c.json({ username: "alice", password: "s3cret" }),
      }
    );
    const res = await request("/test");
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.username).toBe("alice");
    expect(body.password).toBe("s3cret");
  });

  it("should handle deeply nested dot-notation paths", async () => {
    const { request } = createPolicyTestHarness(
      resourceFilter({ mode: "deny", fields: ["a.b.c"] }),
      {
        upstream: async (c) =>
          c.json({ a: { b: { c: "secret", d: "keep" }, x: "keep" } }),
      }
    );
    const res = await request("/test");
    const body = (await res.json()) as Record<string, unknown>;
    const a = body.a as Record<string, unknown>;
    const b = a.b as Record<string, unknown>;
    expect(b.c).toBeUndefined();
    expect(b.d).toBe("keep");
    expect(a.x).toBe("keep");
  });

  it("should gracefully handle non-existent field paths", async () => {
    const { request } = createPolicyTestHarness(
      resourceFilter({ mode: "deny", fields: ["nonexistent", "a.b.c"] }),
      {
        upstream: async (c) => c.json({ name: "Alice", role: "admin" }),
      }
    );
    const res = await request("/test");
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.name).toBe("Alice");
    expect(body.role).toBe("admin");
  });

  it("should preserve response status and headers", async () => {
    const { request } = createPolicyTestHarness(
      resourceFilter({ mode: "deny", fields: ["password"] }),
      {
        upstream: async (c) => {
          c.status(201);
          c.header("x-custom", "preserved");
          return c.json({ name: "Alice", password: "s3cret" });
        },
      }
    );
    const res = await request("/test");
    expect(res.status).toBe(201);
    expect(res.headers.get("x-custom")).toBe("preserved");
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.name).toBe("Alice");
    expect(body.password).toBeUndefined();
  });

  it("should support skip logic", async () => {
    const { request } = createPolicyTestHarness(
      resourceFilter({
        mode: "deny",
        fields: ["password"],
        skip: () => true,
      }),
      {
        upstream: async (c) => c.json({ name: "Alice", password: "s3cret" }),
      }
    );
    const res = await request("/test");
    const body = (await res.json()) as Record<string, unknown>;
    // Password should still be present since policy was skipped
    expect(body.password).toBe("s3cret");
  });

  it("should have priority RESPONSE_TRANSFORM (92)", () => {
    const policy = resourceFilter({ mode: "deny", fields: ["x"] });
    expect(policy.priority).toBe(92);
    expect(policy.name).toBe("resource-filter");
  });

  it("should support custom content types", async () => {
    const { request } = createPolicyTestHarness(
      resourceFilter({
        mode: "deny",
        fields: ["password"],
        contentTypes: ["application/vnd.api+json"],
      }),
      {
        upstream: async (c) => {
          // Respond with standard JSON content type - should not be filtered
          return c.json({ name: "Alice", password: "s3cret" });
        },
      }
    );
    const res = await request("/test");
    const body = (await res.json()) as Record<string, unknown>;
    // Should NOT be filtered because response content-type is application/json, not application/vnd.api+json
    expect(body.password).toBe("s3cret");
  });
});
