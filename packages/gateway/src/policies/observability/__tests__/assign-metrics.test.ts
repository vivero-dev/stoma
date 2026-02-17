import { describe, expect, it } from "vitest";
import { createPolicyTestHarness } from "../../sdk";
import { assignMetrics } from "../assign-metrics";

describe("assignMetrics", () => {
  it("should have name 'assign-metrics' and priority 0", () => {
    const policy = assignMetrics({
      tags: { service: "api" },
    });
    expect(policy.name).toBe("assign-metrics");
    expect(policy.priority).toBe(0);
  });

  it("should set static metric tags on context", async () => {
    const { request } = createPolicyTestHarness(
      assignMetrics({ tags: { service: "users-api" } }),
      {
        upstream: async (c) => {
          const tags = c.get("_metricsTags");
          return c.json({ tags });
        },
      }
    );

    const res = await request("/test");
    const body = (await res.json()) as { tags: Record<string, string> };
    expect(body.tags).toEqual({ service: "users-api" });
  });

  it("should set dynamic (function) metric tags", async () => {
    const { request } = createPolicyTestHarness(
      assignMetrics({
        tags: {
          method: (c) => c.req.method,
        },
      }),
      {
        upstream: async (c) => {
          const tags = c.get("_metricsTags");
          return c.json({ tags });
        },
      }
    );

    const res = await request("/test");
    const body = (await res.json()) as { tags: Record<string, string> };
    expect(body.tags).toEqual({ method: "GET" });
  });

  it("should handle async tag resolvers", async () => {
    const { request } = createPolicyTestHarness(
      assignMetrics({
        tags: {
          asyncTag: async () => {
            await new Promise((r) => setTimeout(r, 1));
            return "resolved";
          },
        },
      }),
      {
        upstream: async (c) => {
          const tags = c.get("_metricsTags");
          return c.json({ tags });
        },
      }
    );

    const res = await request("/test");
    const body = (await res.json()) as { tags: Record<string, string> };
    expect(body.tags).toEqual({ asyncTag: "resolved" });
  });

  it("should resolve multiple tags correctly", async () => {
    const { request } = createPolicyTestHarness(
      assignMetrics({
        tags: {
          service: "api",
          version: "v2",
          path: (c) => new URL(c.req.url).pathname,
        },
      }),
      {
        upstream: async (c) => {
          const tags = c.get("_metricsTags");
          return c.json({ tags });
        },
      }
    );

    const res = await request("/hello");
    const body = (await res.json()) as { tags: Record<string, string> };
    expect(body.tags).toEqual({
      service: "api",
      version: "v2",
      path: "/hello",
    });
  });

  it("should make tags readable from downstream via c.get('_metricsTags')", async () => {
    const { request } = createPolicyTestHarness(
      assignMetrics({
        tags: { env: "production", region: "us-east-1" },
      }),
      {
        upstream: async (c) => {
          const tags = c.get("_metricsTags") as Record<string, string>;
          return c.json({
            env: tags.env,
            region: tags.region,
          });
        },
      }
    );

    const res = await request("/test");
    const body = (await res.json()) as { env: string; region: string };
    expect(body.env).toBe("production");
    expect(body.region).toBe("us-east-1");
  });

  it("should pass through with empty tags object", async () => {
    const { request } = createPolicyTestHarness(assignMetrics({ tags: {} }), {
      upstream: async (c) => {
        const tags = c.get("_metricsTags");
        return c.json({ tags });
      },
    });

    const res = await request("/test");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { tags: Record<string, string> };
    expect(body.tags).toEqual({});
  });

  it("should skip when skip condition returns true", async () => {
    const { request } = createPolicyTestHarness(
      assignMetrics({
        tags: { skipped: "yes" },
        skip: () => true,
      }),
      {
        upstream: async (c) => {
          const tags = c.get("_metricsTags") ?? null;
          return c.json({ tags });
        },
      }
    );

    const res = await request("/test");
    const body = (await res.json()) as { tags: Record<string, string> | null };
    expect(body.tags).toBeNull();
  });

  it("should not skip when skip condition returns false", async () => {
    const { request } = createPolicyTestHarness(
      assignMetrics({
        tags: { present: "yes" },
        skip: () => false,
      }),
      {
        upstream: async (c) => {
          const tags = c.get("_metricsTags");
          return c.json({ tags });
        },
      }
    );

    const res = await request("/test");
    const body = (await res.json()) as { tags: Record<string, string> };
    expect(body.tags).toEqual({ present: "yes" });
  });
});
