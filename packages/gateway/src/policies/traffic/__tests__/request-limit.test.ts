import { describe, expect, it } from "vitest";
import { createPolicyTestHarness } from "../../sdk";
import { requestLimit } from "../request-limit";

describe("requestLimit", () => {
  it("should allow requests under the limit", async () => {
    const { request } = createPolicyTestHarness(
      requestLimit({ maxBytes: 1024 })
    );
    const res = await request("/test", {
      method: "POST",
      headers: { "content-length": "512" },
      body: "x".repeat(512),
    });
    expect(res.status).toBe(200);
  });

  it("should allow requests at exactly the limit", async () => {
    const { request } = createPolicyTestHarness(
      requestLimit({ maxBytes: 1024 })
    );
    const res = await request("/test", {
      method: "POST",
      headers: { "content-length": "1024" },
      body: "x".repeat(1024),
    });
    expect(res.status).toBe(200);
  });

  it("should block requests over the limit with 413", async () => {
    const { request } = createPolicyTestHarness(
      requestLimit({ maxBytes: 1024 })
    );
    const res = await request("/test", {
      method: "POST",
      headers: { "content-length": "2048" },
      body: "x".repeat(2048),
    });
    expect(res.status).toBe(413);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("request_too_large");
    expect(body.message).toBe("Request body too large");
  });

  it("should use custom error message", async () => {
    const { request } = createPolicyTestHarness(
      requestLimit({ maxBytes: 100, message: "Payload exceeds 100 bytes" })
    );
    const res = await request("/test", {
      method: "POST",
      headers: { "content-length": "200" },
      body: "x".repeat(200),
    });
    expect(res.status).toBe(413);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.message).toBe("Payload exceeds 100 bytes");
  });

  it("should pass requests with no Content-Length header", async () => {
    const { request } = createPolicyTestHarness(
      requestLimit({ maxBytes: 1024 })
    );
    const res = await request("/test");
    expect(res.status).toBe(200);
  });

  it("should work with zero-length bodies", async () => {
    const { request } = createPolicyTestHarness(
      requestLimit({ maxBytes: 1024 })
    );
    const res = await request("/test", {
      method: "POST",
      headers: { "content-length": "0" },
    });
    expect(res.status).toBe(200);
  });

  it("should support skip logic", async () => {
    const { request } = createPolicyTestHarness(
      requestLimit({ maxBytes: 100, skip: () => true })
    );
    const res = await request("/test", {
      method: "POST",
      headers: { "content-length": "9999" },
      body: "x".repeat(9999),
    });
    expect(res.status).toBe(200);
  });

  it("should have priority EARLY (5)", () => {
    const policy = requestLimit({ maxBytes: 1024 });
    expect(policy.priority).toBe(5);
    expect(policy.name).toBe("request-limit");
  });
});
