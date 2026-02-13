import { describe, expect, it } from "vitest";
import { createPolicyTestHarness } from "../../sdk";
import { regexThreatProtection } from "../regex-threat-protection";

describe("regexThreatProtection", () => {
  it("should block SQL injection pattern in path", async () => {
    const { request } = createPolicyTestHarness(
      regexThreatProtection({
        patterns: [
          {
            regex: "(union|select|drop)\\s",
            targets: ["path"],
            message: "SQL injection detected",
          },
        ],
      })
    );
    const res = await request("/api/users/union select");
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("threat_detected");
    expect(body.message).toBe("SQL injection detected");
  });

  it("should block XSS pattern in headers", async () => {
    const { request } = createPolicyTestHarness(
      regexThreatProtection({
        patterns: [
          {
            regex: "<script",
            targets: ["headers"],
            message: "XSS detected",
          },
        ],
      })
    );
    const res = await request("/test", {
      headers: { "x-custom": "<script>alert('xss')</script>" },
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("threat_detected");
    expect(body.message).toBe("XSS detected");
  });

  it("should block pattern in body", async () => {
    const { request } = createPolicyTestHarness(
      regexThreatProtection({
        patterns: [
          {
            regex: "drop\\s+table",
            targets: ["body"],
          },
        ],
      })
    );
    const res = await request("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: "drop table users" }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("threat_detected");
    expect(body.message).toBe("Request blocked by threat protection");
  });

  it("should block pattern in query string", async () => {
    const { request } = createPolicyTestHarness(
      regexThreatProtection({
        patterns: [
          {
            regex: "union\\s+select",
            targets: ["query"],
            message: "SQL injection in query",
          },
        ],
      })
    );
    const res = await request("/test?q=1%20union%20select%20*");
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("threat_detected");
    expect(body.message).toBe("SQL injection in query");
  });

  it("should allow clean requests", async () => {
    const { request } = createPolicyTestHarness(
      regexThreatProtection({
        patterns: [
          {
            regex: "<script",
            targets: ["path", "headers", "body", "query"],
          },
          {
            regex: "drop\\s+table",
            targets: ["path", "headers", "body", "query"],
          },
        ],
      })
    );
    const res = await request("/api/users?page=1", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Alice" }),
    });
    expect(res.status).toBe(200);
  });

  it("should use custom error message per pattern", async () => {
    const { request } = createPolicyTestHarness(
      regexThreatProtection({
        patterns: [
          {
            regex: "pattern-a",
            targets: ["path"],
            message: "Custom message A",
          },
          {
            regex: "pattern-b",
            targets: ["path"],
            message: "Custom message B",
          },
        ],
      })
    );

    const resA = await request("/pattern-a");
    expect(resA.status).toBe(400);
    const bodyA = (await resA.json()) as Record<string, unknown>;
    expect(bodyA.message).toBe("Custom message A");

    const { request: request2 } = createPolicyTestHarness(
      regexThreatProtection({
        patterns: [
          {
            regex: "pattern-a",
            targets: ["path"],
            message: "Custom message A",
          },
          {
            regex: "pattern-b",
            targets: ["path"],
            message: "Custom message B",
          },
        ],
      })
    );
    const resB = await request2("/pattern-b");
    expect(resB.status).toBe(400);
    const bodyB = (await resB.json()) as Record<string, unknown>;
    expect(bodyB.message).toBe("Custom message B");
  });

  it("should trigger on first matching pattern", async () => {
    const { request } = createPolicyTestHarness(
      regexThreatProtection({
        patterns: [
          {
            regex: "first-match",
            targets: ["path"],
            message: "First",
          },
          {
            regex: "first-match",
            targets: ["path"],
            message: "Second",
          },
        ],
      })
    );
    const res = await request("/first-match");
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.message).toBe("First");
  });

  it("should match case-insensitively by default", async () => {
    const { request } = createPolicyTestHarness(
      regexThreatProtection({
        patterns: [{ regex: "drop\\s+table", targets: ["path"] }],
      })
    );
    const res = await request("/DROP TABLE");
    expect(res.status).toBe(400);
  });

  it("should respect custom flags", async () => {
    const { request } = createPolicyTestHarness(
      regexThreatProtection({
        patterns: [{ regex: "DROP", targets: ["path"] }],
        flags: "", // no flags = case-sensitive
      })
    );
    // Lowercase should pass with case-sensitive matching
    const passRes = await request("/drop");
    expect(passRes.status).toBe(200);

    // Uppercase should fail
    const { request: request2 } = createPolicyTestHarness(
      regexThreatProtection({
        patterns: [{ regex: "DROP", targets: ["path"] }],
        flags: "",
      })
    );
    const failRes = await request2("/DROP");
    expect(failRes.status).toBe(400);
  });

  it("should respect content-type filter for body scanning", async () => {
    const { request } = createPolicyTestHarness(
      regexThreatProtection({
        patterns: [{ regex: "malicious", targets: ["body"] }],
        contentTypes: ["application/json"],
      })
    );
    // text/plain body should not be scanned
    const res = await request("/test", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: "this is malicious content",
    });
    expect(res.status).toBe(200);

    // application/json body should be scanned
    const { request: request2 } = createPolicyTestHarness(
      regexThreatProtection({
        patterns: [{ regex: "malicious", targets: ["body"] }],
        contentTypes: ["application/json"],
      })
    );
    const res2 = await request2("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ data: "malicious content" }),
    });
    expect(res2.status).toBe(400);
  });

  it("should respect maxBodyScanLength", async () => {
    const { request } = createPolicyTestHarness(
      regexThreatProtection({
        patterns: [{ regex: "EVIL", targets: ["body"] }],
        maxBodyScanLength: 20,
        contentTypes: ["text/plain"],
      })
    );
    // Place pattern beyond the scan limit
    const body = `${"A".repeat(30)}EVIL`;
    const res = await request("/test", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body,
    });
    // Should pass because EVIL is beyond the 20-byte scan window
    expect(res.status).toBe(200);
  });

  it("should support skip logic", async () => {
    const { request } = createPolicyTestHarness(
      regexThreatProtection({
        patterns: [{ regex: "blocked", targets: ["path"] }],
        skip: () => true,
      })
    );
    const res = await request("/blocked");
    expect(res.status).toBe(200);
  });

  it("should have priority EARLY (5)", () => {
    const policy = regexThreatProtection({
      patterns: [{ regex: "test", targets: ["path"] }],
    });
    expect(policy.priority).toBe(5);
    expect(policy.name).toBe("regex-threat-protection");
  });
});
