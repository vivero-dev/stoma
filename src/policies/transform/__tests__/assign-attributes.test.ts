import { describe, expect, it } from "vitest";
import { createPolicyTestHarness } from "../../sdk";
import { assignAttributes } from "../assign-attributes";

describe("assignAttributes", () => {
  it("should have name 'assign-attributes' and priority 50", () => {
    const policy = assignAttributes({
      attributes: { key: "value" },
    });
    expect(policy.name).toBe("assign-attributes");
    expect(policy.priority).toBe(50);
  });

  it("should set static string attributes on context", async () => {
    const { request } = createPolicyTestHarness(
      assignAttributes({ attributes: { tenant: "acme" } }),
      {
        upstream: async (c) => {
          return c.json({ tenant: c.get("tenant") });
        },
      }
    );

    const res = await request("/test");
    const body = (await res.json()) as { tenant: string };
    expect(body.tenant).toBe("acme");
  });

  it("should set dynamic (function) attributes on context", async () => {
    const { request } = createPolicyTestHarness(
      assignAttributes({
        attributes: {
          requestPath: (c) => new URL(c.req.url).pathname,
        },
      }),
      {
        upstream: async (c) => {
          return c.json({ requestPath: c.get("requestPath") });
        },
      }
    );

    const res = await request("/hello");
    const body = (await res.json()) as { requestPath: string };
    expect(body.requestPath).toBe("/hello");
  });

  it("should handle async dynamic attributes", async () => {
    const { request } = createPolicyTestHarness(
      assignAttributes({
        attributes: {
          delayed: async () => {
            await new Promise((r) => setTimeout(r, 1));
            return "async-value";
          },
        },
      }),
      {
        upstream: async (c) => {
          return c.json({ delayed: c.get("delayed") });
        },
      }
    );

    const res = await request("/test");
    const body = (await res.json()) as { delayed: string };
    expect(body.delayed).toBe("async-value");
  });

  it("should set multiple attributes in one call", async () => {
    const { request } = createPolicyTestHarness(
      assignAttributes({
        attributes: {
          a: "alpha",
          b: "bravo",
          c: (ctx) => `method-${ctx.req.method}`,
        },
      }),
      {
        upstream: async (c) => {
          return c.json({
            a: c.get("a"),
            b: c.get("b"),
            c: c.get("c"),
          });
        },
      }
    );

    const res = await request("/test");
    const body = (await res.json()) as { a: string; b: string; c: string };
    expect(body.a).toBe("alpha");
    expect(body.b).toBe("bravo");
    expect(body.c).toBe("method-GET");
  });

  it("should make attributes readable by downstream handlers via c.get()", async () => {
    const { request } = createPolicyTestHarness(
      assignAttributes({
        attributes: { downstream: "visible" },
      }),
      {
        upstream: async (c) => {
          const value = c.get("downstream");
          return c.json({ captured: value });
        },
      }
    );

    const res = await request("/test");
    const body = (await res.json()) as { captured: string };
    expect(body.captured).toBe("visible");
  });

  it("should pass through with empty attributes object", async () => {
    const { request } = createPolicyTestHarness(
      assignAttributes({ attributes: {} })
    );

    const res = await request("/test");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
  });

  it("should skip when skip condition returns true", async () => {
    const { request } = createPolicyTestHarness(
      assignAttributes({
        attributes: { skipped: "should-not-appear" },
        skip: () => true,
      }),
      {
        upstream: async (c) => {
          return c.json({ skipped: c.get("skipped") ?? null });
        },
      }
    );

    const res = await request("/test");
    const body = (await res.json()) as { skipped: string | null };
    expect(body.skipped).toBeNull();
  });

  it("should not skip when skip condition returns false", async () => {
    const { request } = createPolicyTestHarness(
      assignAttributes({
        attributes: { present: "yes" },
        skip: () => false,
      }),
      {
        upstream: async (c) => {
          return c.json({ present: c.get("present") });
        },
      }
    );

    const res = await request("/test");
    const body = (await res.json()) as { present: string };
    expect(body.present).toBe("yes");
  });
});
