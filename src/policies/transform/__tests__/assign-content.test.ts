import type { Context } from "hono";
import { describe, expect, it } from "vitest";
import { createPolicyTestHarness } from "../../sdk";
import { assignContent } from "../assign-content";

describe("assignContent", () => {
  it("should inject a field into request body", async () => {
    let receivedBody: Record<string, unknown> = {};

    const { request } = createPolicyTestHarness(
      assignContent({
        request: { tenantId: "acme" },
      }),
      {
        upstream: async (c) => {
          receivedBody = (await c.req.json()) as Record<string, unknown>;
          return c.json({ ok: true });
        },
      }
    );

    await request("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Alice" }),
    });

    expect(receivedBody.name).toBe("Alice");
    expect(receivedBody.tenantId).toBe("acme");
  });

  it("should override existing field in request body", async () => {
    let receivedBody: Record<string, unknown> = {};

    const { request } = createPolicyTestHarness(
      assignContent({
        request: { role: "admin" },
      }),
      {
        upstream: async (c) => {
          receivedBody = (await c.req.json()) as Record<string, unknown>;
          return c.json({ ok: true });
        },
      }
    );

    await request("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role: "user", name: "Alice" }),
    });

    expect(receivedBody.role).toBe("admin");
    expect(receivedBody.name).toBe("Alice");
  });

  it("should inject a field into response body", async () => {
    const { request } = createPolicyTestHarness(
      assignContent({
        response: { gateway: "stoma" },
      }),
      {
        upstream: async (c) => c.json({ data: "hello" }),
      }
    );

    const res = await request("/test");
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.data).toBe("hello");
    expect(body.gateway).toBe("stoma");
  });

  it("should resolve dynamic request field (function)", async () => {
    let receivedBody: Record<string, unknown> = {};

    const { request } = createPolicyTestHarness(
      assignContent({
        request: {
          path: (c: Context) => new URL(c.req.url).pathname,
        },
      }),
      {
        upstream: async (c) => {
          receivedBody = (await c.req.json()) as Record<string, unknown>;
          return c.json({ ok: true });
        },
      }
    );

    await request("/api/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(receivedBody.path).toBe("/api/users");
  });

  it("should resolve dynamic response field (function)", async () => {
    const { request } = createPolicyTestHarness(
      assignContent({
        response: {
          method: (c: Context) => c.req.method,
        },
      }),
      {
        upstream: async (c) => c.json({ ok: true }),
      }
    );

    const res = await request("/test", { method: "POST" });
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.method).toBe("POST");
  });

  it("should resolve async dynamic field", async () => {
    let receivedBody: Record<string, unknown> = {};

    const { request } = createPolicyTestHarness(
      assignContent({
        request: {
          asyncValue: async () => {
            await new Promise((r) => setTimeout(r, 1));
            return "resolved";
          },
        },
      }),
      {
        upstream: async (c) => {
          receivedBody = (await c.req.json()) as Record<string, unknown>;
          return c.json({ ok: true });
        },
      }
    );

    await request("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(receivedBody.asyncValue).toBe("resolved");
  });

  it("should skip modification for non-JSON content type", async () => {
    let receivedRawBody = "";

    const { request } = createPolicyTestHarness(
      assignContent({
        request: { injected: "yes" },
      }),
      {
        upstream: async (c) => {
          receivedRawBody = await c.req.text();
          return c.json({ ok: true });
        },
      }
    );

    await request("/test", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: "plain text body",
    });

    // Body should be unmodified
    expect(receivedRawBody).toBe("plain text body");
  });

  it("should handle request with no body", async () => {
    let receivedBody: Record<string, unknown> = {};

    const { request } = createPolicyTestHarness(
      assignContent({
        request: { injected: "yes" },
      }),
      {
        upstream: async (c) => {
          receivedBody = (await c.req.json()) as Record<string, unknown>;
          return c.json({ ok: true });
        },
      }
    );

    // GET with application/json content-type but no body
    await request("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
    });

    expect(receivedBody.injected).toBe("yes");
  });

  it("should apply both request and response modifications", async () => {
    let receivedBody: Record<string, unknown> = {};

    const { request } = createPolicyTestHarness(
      assignContent({
        request: { reqField: "from-gateway" },
        response: { resField: "from-gateway" },
      }),
      {
        upstream: async (c) => {
          receivedBody = (await c.req.json()) as Record<string, unknown>;
          return c.json({ original: true });
        },
      }
    );

    const res = await request("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ data: "hello" }),
    });

    // Request was modified
    expect(receivedBody.data).toBe("hello");
    expect(receivedBody.reqField).toBe("from-gateway");

    // Response was modified
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.original).toBe(true);
    expect(body.resField).toBe("from-gateway");
  });

  it("should work with only request modification configured", async () => {
    const { request } = createPolicyTestHarness(
      assignContent({
        request: { added: true },
      }),
      {
        upstream: async (c) => c.json({ upstream: true }),
      }
    );

    const res = await request("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });

    // Response should be unmodified
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.upstream).toBe(true);
    expect(body).not.toHaveProperty("added");
  });

  it("should work with only response modification configured", async () => {
    let receivedBody: Record<string, unknown> = {};

    const { request } = createPolicyTestHarness(
      assignContent({
        response: { added: true },
      }),
      {
        upstream: async (c) => {
          receivedBody = (await c.req.json()) as Record<string, unknown>;
          return c.json({ upstream: true });
        },
      }
    );

    const res = await request("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ original: "data" }),
    });

    // Request body should be unmodified
    expect(receivedBody.original).toBe("data");
    expect(receivedBody).not.toHaveProperty("added");

    // Response should be modified
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.upstream).toBe(true);
    expect(body.added).toBe(true);
  });

  it("should support skip logic", async () => {
    const { request } = createPolicyTestHarness(
      assignContent({
        response: { injected: "yes" },
        skip: () => true,
      }),
      {
        upstream: async (c) => c.json({ clean: true }),
      }
    );

    const res = await request("/test");
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.clean).toBe(true);
    expect(body).not.toHaveProperty("injected");
  });

  it("should have priority REQUEST_TRANSFORM (50)", () => {
    const policy = assignContent({
      request: { field: "value" },
    });
    expect(policy.priority).toBe(50);
    expect(policy.name).toBe("assign-content");
  });
});
