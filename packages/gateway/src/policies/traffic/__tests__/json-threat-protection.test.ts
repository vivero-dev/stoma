import { describe, expect, it } from "vitest";
import { createPolicyTestHarness } from "../../sdk";
import { jsonThreatProtection } from "../json-threat-protection";

describe("jsonThreatProtection", () => {
  it("should pass valid JSON within all limits", async () => {
    const { request } = createPolicyTestHarness(jsonThreatProtection());
    const res = await request("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Alice", age: 30 }),
    });
    expect(res.status).toBe(200);
  });

  it("should reject JSON exceeding max depth", async () => {
    const { request } = createPolicyTestHarness(
      jsonThreatProtection({ maxDepth: 2 })
    );
    // Depth: root(0) -> a(1) -> b(2) -> c(3) = exceeds maxDepth 2
    const res = await request("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ a: { b: { c: "deep" } } }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("json_threat");
    expect(body.message).toContain("maximum depth");
  });

  it("should reject objects exceeding max keys", async () => {
    const { request } = createPolicyTestHarness(
      jsonThreatProtection({ maxKeys: 3 })
    );
    const obj: Record<string, number> = {};
    for (let i = 0; i < 4; i++) {
      obj[`key${i}`] = i;
    }
    const res = await request("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(obj),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("json_threat");
    expect(body.message).toContain("maximum key count");
  });

  it("should reject string values exceeding max length", async () => {
    const { request } = createPolicyTestHarness(
      jsonThreatProtection({ maxStringLength: 10 })
    );
    const res = await request("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "a".repeat(11) }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("json_threat");
    expect(body.message).toContain("maximum length");
  });

  it("should reject object keys exceeding max string length", async () => {
    const { request } = createPolicyTestHarness(
      jsonThreatProtection({ maxStringLength: 5 })
    );
    const obj: Record<string, string> = {};
    obj["a".repeat(6)] = "value";
    const res = await request("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(obj),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("json_threat");
    expect(body.message).toContain("maximum length");
  });

  it("should reject arrays exceeding max size", async () => {
    const { request } = createPolicyTestHarness(
      jsonThreatProtection({ maxArraySize: 3 })
    );
    const res = await request("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items: [1, 2, 3, 4] }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("json_threat");
    expect(body.message).toContain("maximum size");
  });

  it("should reject body exceeding max body size with 413", async () => {
    const { request } = createPolicyTestHarness(
      jsonThreatProtection({ maxBodySize: 50 })
    );
    const largeBody = JSON.stringify({ data: "x".repeat(100) });
    const res = await request("/test", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "content-length": String(
          new TextEncoder().encode(largeBody).byteLength
        ),
      },
      body: largeBody,
    });
    expect(res.status).toBe(413);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("body_too_large");
  });

  it("should reject invalid JSON with 400", async () => {
    const { request } = createPolicyTestHarness(jsonThreatProtection());
    const res = await request("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not valid json {{{",
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("invalid_json");
  });

  it("should pass empty body through", async () => {
    const { request } = createPolicyTestHarness(jsonThreatProtection());
    const res = await request("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
    });
    expect(res.status).toBe(200);
  });

  it("should skip non-JSON content types", async () => {
    const { request } = createPolicyTestHarness(
      jsonThreatProtection({ maxDepth: 1 })
    );
    // This deeply nested body would fail if inspected, but text/plain is skipped
    const res = await request("/test", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: JSON.stringify({ a: { b: { c: "deep" } } }),
    });
    expect(res.status).toBe(200);
  });

  it("should validate nested objects and arrays recursively", async () => {
    const { request } = createPolicyTestHarness(
      jsonThreatProtection({ maxArraySize: 5, maxKeys: 5 })
    );
    // Valid nested structure
    const validRes = await request("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        users: [{ name: "Alice" }, { name: "Bob" }],
      }),
    });
    expect(validRes.status).toBe(200);

    // Nested array exceeds maxArraySize
    const invalidRes = await request("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        data: { items: [1, 2, 3, 4, 5, 6] },
      }),
    });
    expect(invalidRes.status).toBe(400);
  });

  it("should use default limits (20 depth, 100 keys, etc.)", async () => {
    const policy = jsonThreatProtection();
    expect(policy.name).toBe("json-threat-protection");

    // Build a nested object at exactly depth 20 (should pass)
    let nested: unknown = "leaf";
    for (let i = 0; i < 20; i++) {
      nested = { child: nested };
    }
    const { request } = createPolicyTestHarness(policy);
    const validRes = await request("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(nested),
    });
    expect(validRes.status).toBe(200);

    // Build a nested object at depth 21 (should fail)
    let tooDeep: unknown = "leaf";
    for (let i = 0; i < 21; i++) {
      tooDeep = { child: tooDeep };
    }
    const { request: request2 } = createPolicyTestHarness(
      jsonThreatProtection()
    );
    const invalidRes = await request2("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(tooDeep),
    });
    expect(invalidRes.status).toBe(400);
  });

  it("should accept custom limits", async () => {
    const { request } = createPolicyTestHarness(
      jsonThreatProtection({
        maxDepth: 1,
        maxKeys: 2,
        maxStringLength: 5,
        maxArraySize: 2,
        maxBodySize: 500,
      })
    );
    // Within all custom limits
    const validRes = await request("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ a: "hi", b: 1 }),
    });
    expect(validRes.status).toBe(200);

    // Exceeds custom maxKeys (2)
    const invalidRes = await request("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ a: 1, b: 2, c: 3 }),
    });
    expect(invalidRes.status).toBe(400);
  });

  it("should support skip logic", async () => {
    const { request } = createPolicyTestHarness(
      jsonThreatProtection({
        maxDepth: 1,
        skip: () => true,
      })
    );
    // This deeply nested body would fail, but skip bypasses the policy
    const res = await request("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ a: { b: { c: "deep" } } }),
    });
    expect(res.status).toBe(200);
  });

  it("should have priority EARLY (5)", () => {
    const policy = jsonThreatProtection();
    expect(policy.priority).toBe(5);
    expect(policy.name).toBe("json-threat-protection");
  });
});
