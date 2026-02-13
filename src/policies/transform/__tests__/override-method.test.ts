import { describe, expect, it } from "vitest";
import { createPolicyTestHarness } from "../../sdk";
import { overrideMethod } from "../override-method";

describe("overrideMethod", () => {
  it("should override POST to PUT via X-HTTP-Method-Override", async () => {
    const { request } = createPolicyTestHarness(overrideMethod(), {
      upstream: async (c) => {
        return c.json({ method: c.req.method });
      },
    });

    const res = await request("/test", {
      method: "POST",
      headers: { "X-HTTP-Method-Override": "PUT" },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.method).toBe("PUT");
  });

  it("should override POST to DELETE", async () => {
    const { request } = createPolicyTestHarness(overrideMethod(), {
      upstream: async (c) => {
        return c.json({ method: c.req.method });
      },
    });

    const res = await request("/test", {
      method: "POST",
      headers: { "X-HTTP-Method-Override": "DELETE" },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.method).toBe("DELETE");
  });

  it("should override POST to PATCH", async () => {
    const { request } = createPolicyTestHarness(overrideMethod(), {
      upstream: async (c) => {
        return c.json({ method: c.req.method });
      },
    });

    const res = await request("/test", {
      method: "POST",
      headers: { "X-HTTP-Method-Override": "PATCH" },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.method).toBe("PATCH");
  });

  it("should ignore override header on non-POST requests", async () => {
    const { request } = createPolicyTestHarness(overrideMethod(), {
      upstream: async (c) => {
        return c.json({ method: c.req.method });
      },
    });

    const res = await request("/test", {
      method: "GET",
      headers: { "X-HTTP-Method-Override": "DELETE" },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.method).toBe("GET");
  });

  it("should reject override to disallowed method", async () => {
    const { request } = createPolicyTestHarness(overrideMethod());

    const res = await request("/test", {
      method: "POST",
      headers: { "X-HTTP-Method-Override": "CONNECT" },
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("invalid_method_override");
    expect(body.message).toContain("CONNECT");
  });

  it("should pass through when no override header is present", async () => {
    const { request } = createPolicyTestHarness(overrideMethod(), {
      upstream: async (c) => {
        return c.json({ method: c.req.method });
      },
    });

    const res = await request("/test", { method: "POST" });
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.method).toBe("POST");
  });

  it("should support a custom header name", async () => {
    const { request } = createPolicyTestHarness(
      overrideMethod({ header: "X-Method" }),
      {
        upstream: async (c) => {
          return c.json({ method: c.req.method });
        },
      }
    );

    const res = await request("/test", {
      method: "POST",
      headers: { "X-Method": "PUT" },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.method).toBe("PUT");
  });

  it("should match override method case-insensitively", async () => {
    const { request } = createPolicyTestHarness(overrideMethod(), {
      upstream: async (c) => {
        return c.json({ method: c.req.method });
      },
    });

    const res = await request("/test", {
      method: "POST",
      headers: { "X-HTTP-Method-Override": "put" },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.method).toBe("PUT");
  });

  it("should skip the policy when skip returns true", async () => {
    const { request } = createPolicyTestHarness(
      overrideMethod({ skip: () => true }),
      {
        upstream: async (c) => {
          return c.json({ method: c.req.method });
        },
      }
    );

    const res = await request("/test", {
      method: "POST",
      headers: { "X-HTTP-Method-Override": "DELETE" },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    // Method should NOT be overridden since policy was skipped
    expect(body.method).toBe("POST");
  });

  it("should have priority EARLY (5)", () => {
    const policy = overrideMethod();
    expect(policy.priority).toBe(5);
  });
});
