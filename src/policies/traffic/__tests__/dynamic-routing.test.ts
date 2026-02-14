import { describe, expect, it } from "vitest";
import { createPolicyTestHarness } from "../../sdk";
import { dynamicRouting } from "../dynamic-routing";

describe("dynamicRouting", () => {
  it("should set target context variable for first matching rule", async () => {
    const { request } = createPolicyTestHarness(
      dynamicRouting({
        rules: [
          {
            condition: () => true,
            target: "https://api.internal",
          },
        ],
      }),
      {
        upstream: async (c) => c.json({ target: c.get("_dynamicTarget") }),
      }
    );
    const res = await request("/test");
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.target).toBe("https://api.internal");
  });

  it("should match rule based on header value", async () => {
    const { request } = createPolicyTestHarness(
      dynamicRouting({
        rules: [
          {
            condition: (c) => c.req.header("x-version") === "2",
            target: "https://v2.internal",
          },
        ],
      }),
      {
        upstream: async (c) => c.json({ target: c.get("_dynamicTarget") }),
      }
    );
    const res = await request("/test", {
      headers: { "x-version": "2" },
    });
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.target).toBe("https://v2.internal");
  });

  it("should match rule based on path", async () => {
    const { request } = createPolicyTestHarness(
      dynamicRouting({
        rules: [
          {
            condition: (c) => c.req.path.startsWith("/admin"),
            target: "https://admin.internal",
          },
        ],
      }),
      {
        upstream: async (c) => c.json({ target: c.get("_dynamicTarget") }),
      }
    );
    const res = await request("/admin/users");
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.target).toBe("https://admin.internal");
  });

  it("should set path rewrite context variable", async () => {
    const { request } = createPolicyTestHarness(
      dynamicRouting({
        rules: [
          {
            condition: () => true,
            target: "https://api.internal",
            rewritePath: (path) => path.replace("/api/", "/v2/"),
          },
        ],
      }),
      {
        upstream: async (c) => {
          const rewrite = c.get("_dynamicRewrite") as
            | ((p: string) => string)
            | undefined;
          return c.json({
            target: c.get("_dynamicTarget"),
            rewrite: rewrite?.("/api/users"),
          });
        },
      }
    );
    const res = await request("/test");
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.target).toBe("https://api.internal");
    expect(body.rewrite).toBe("/v2/users");
  });

  it("should set additional headers context variable", async () => {
    const { request } = createPolicyTestHarness(
      dynamicRouting({
        rules: [
          {
            condition: () => true,
            target: "https://api.internal",
            headers: { "x-internal-key": "secret" },
          },
        ],
      }),
      {
        upstream: async (c) =>
          c.json({
            target: c.get("_dynamicTarget"),
            headers: c.get("_dynamicHeaders"),
          }),
      }
    );
    const res = await request("/test");
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.headers).toEqual({ "x-internal-key": "secret" });
  });

  it("should use first matching rule when multiple rules match", async () => {
    const { request } = createPolicyTestHarness(
      dynamicRouting({
        rules: [
          {
            name: "first",
            condition: () => true,
            target: "https://first.internal",
          },
          {
            name: "second",
            condition: () => true,
            target: "https://second.internal",
          },
        ],
      }),
      {
        upstream: async (c) => c.json({ target: c.get("_dynamicTarget") }),
      }
    );
    const res = await request("/test");
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.target).toBe("https://first.internal");
  });

  it("should pass through when no rule matches and fallthrough=true", async () => {
    const { request } = createPolicyTestHarness(
      dynamicRouting({
        rules: [
          {
            condition: () => false,
            target: "https://never.internal",
          },
        ],
        fallthrough: true,
      }),
      {
        upstream: async (c) =>
          c.json({
            target: c.get("_dynamicTarget") ?? null,
            ok: true,
          }),
      }
    );
    const res = await request("/test");
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.target).toBeNull();
    expect(body.ok).toBe(true);
  });

  it("should return 404 when no rule matches and fallthrough=false", async () => {
    const { request } = createPolicyTestHarness(
      dynamicRouting({
        rules: [
          {
            condition: () => false,
            target: "https://never.internal",
          },
        ],
        fallthrough: false,
      })
    );
    const res = await request("/test");
    expect(res.status).toBe(404);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("no_route");
    expect(body.message).toBe("No routing rule matched");
  });

  it("should support async condition", async () => {
    const { request } = createPolicyTestHarness(
      dynamicRouting({
        rules: [
          {
            condition: async () => {
              await new Promise((r) => setTimeout(r, 1));
              return true;
            },
            target: "https://async.internal",
          },
        ],
      }),
      {
        upstream: async (c) => c.json({ target: c.get("_dynamicTarget") }),
      }
    );
    const res = await request("/test");
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.target).toBe("https://async.internal");
  });

  it("should log named rules via debug", async () => {
    const { request } = createPolicyTestHarness(
      dynamicRouting({
        rules: [
          {
            name: "my-rule",
            condition: () => true,
            target: "https://api.internal",
          },
        ],
      })
    );
    // Just verify it completes without error - debug logging is internal
    const res = await request("/test");
    expect(res.status).toBe(200);
  });

  it("should support skip logic", async () => {
    const { request } = createPolicyTestHarness(
      dynamicRouting({
        rules: [
          {
            condition: () => true,
            target: "https://api.internal",
          },
        ],
        fallthrough: false,
        skip: () => true,
      }),
      {
        upstream: async (c) =>
          c.json({ target: c.get("_dynamicTarget") ?? null }),
      }
    );
    // Skip means the policy doesn't run - no target set, no 404 thrown
    const res = await request("/test");
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.target).toBeNull();
  });

  it("should default fallthrough to true", async () => {
    const { request } = createPolicyTestHarness(
      dynamicRouting({
        rules: [
          {
            condition: () => false,
            target: "https://never.internal",
          },
        ],
        // No explicit fallthrough - should default to true
      })
    );
    const res = await request("/test");
    expect(res.status).toBe(200);
  });

  it("should have priority REQUEST_TRANSFORM (50)", () => {
    const policy = dynamicRouting({
      rules: [{ condition: () => true, target: "https://api.internal" }],
    });
    expect(policy.priority).toBe(50);
    expect(policy.name).toBe("dynamic-routing");
  });
});
