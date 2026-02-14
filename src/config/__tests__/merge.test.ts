import { describe, expect, it } from "vitest";
import { GatewayError } from "../../core/errors";
import { createGateway } from "../../core/gateway";
import type {
  AdminConfig,
  DebugHeadersConfig,
  RouteConfig,
} from "../../core/types";
import type { Policy } from "../../policies/types";
import { mergeConfigs } from "../merge";

// ── Test helpers ──

// biome-ignore lint/suspicious/noExplicitAny: minimal test helper
const route = (path: string): RouteConfig<any> => ({
  path,
  pipeline: {
    upstream: {
      type: "handler" as const,
      // biome-ignore lint/suspicious/noExplicitAny: minimal test helper
      handler: (c: any) => c.json({ ok: true }),
    },
  },
});

const policy = (name: string, priority = 100): Policy => ({
  name,
  priority,
  // biome-ignore lint/suspicious/noExplicitAny: minimal test helper
  handler: async (_c: any, next: any) => next(),
});

// ── Route concatenation ──

describe("mergeConfigs - route concatenation", () => {
  it("should concatenate routes from multiple configs", () => {
    const merged = mergeConfigs(
      { routes: [route("/a")] },
      { routes: [route("/b"), route("/c")] }
    );

    expect(merged.routes).toHaveLength(3);
    expect(merged.routes.map((r) => r.path)).toEqual(["/a", "/b", "/c"]);
  });

  it("should preserve route order (left to right)", () => {
    const merged = mergeConfigs(
      { routes: [route("/first")] },
      { routes: [route("/second")] },
      { routes: [route("/third")] }
    );

    expect(merged.routes.map((r) => r.path)).toEqual([
      "/first",
      "/second",
      "/third",
    ]);
  });

  it("should allow duplicate route paths from different configs", () => {
    const merged = mergeConfigs(
      { routes: [route("/api")] },
      { routes: [route("/api")] }
    );

    expect(merged.routes).toHaveLength(2);
  });

  it("should handle configs with no routes field (undefined)", () => {
    const merged = mergeConfigs(
      { routes: [route("/a")] },
      { name: "no-routes" },
      { routes: [route("/b")] }
    );

    expect(merged.routes).toHaveLength(2);
    expect(merged.routes.map((r) => r.path)).toEqual(["/a", "/b"]);
  });
});

// ── Policy deduplication ──

describe("mergeConfigs - policy deduplication", () => {
  it("should deduplicate policies by name (later config wins)", () => {
    const earlyPolicy = policy("auth", 10);
    const laterPolicy = policy("auth", 20);

    const merged = mergeConfigs(
      { routes: [route("/a")], policies: [earlyPolicy] },
      { routes: [route("/b")], policies: [laterPolicy] }
    );

    expect(merged.policies).toHaveLength(1);
    expect(merged.policies![0]).toBe(laterPolicy);
    expect(merged.policies![0].priority).toBe(20);
  });

  it("should accumulate policies with different names", () => {
    const merged = mergeConfigs(
      { routes: [route("/a")], policies: [policy("auth")] },
      { routes: [route("/b")], policies: [policy("rate-limit")] }
    );

    expect(merged.policies).toHaveLength(2);
    expect(merged.policies!.map((p) => p.name)).toEqual(["auth", "rate-limit"]);
  });

  it("should handle mix of duplicate and unique policy names", () => {
    const corsV1 = policy("cors", 5);
    const corsV2 = policy("cors", 10);
    const auth = policy("auth", 15);
    const rateLimit = policy("rate-limit", 20);

    const merged = mergeConfigs(
      { routes: [route("/a")], policies: [corsV1, auth] },
      { routes: [route("/b")], policies: [corsV2, rateLimit] }
    );

    expect(merged.policies).toHaveLength(3);
    const names = merged.policies!.map((p) => p.name);
    expect(names).toContain("cors");
    expect(names).toContain("auth");
    expect(names).toContain("rate-limit");
    // cors should be v2 (later wins)
    const mergedCors = merged.policies!.find((p) => p.name === "cors");
    expect(mergedCors).toBe(corsV2);
  });

  it("should not set policies field when no configs provide policies", () => {
    const merged = mergeConfigs(
      { routes: [route("/a")] },
      { routes: [route("/b")] }
    );

    expect(merged.policies).toBeUndefined();
  });
});

// ── Scalar fields (last-defined wins) ──

describe("mergeConfigs - scalar fields", () => {
  it("should use last-defined name", () => {
    const merged = mergeConfigs(
      { routes: [route("/a")], name: "first" },
      { name: "second" }
    );

    expect(merged.name).toBe("second");
  });

  it("should use last-defined basePath", () => {
    const merged = mergeConfigs(
      { routes: [route("/a")], basePath: "/v1" },
      { basePath: "/v2" }
    );

    expect(merged.basePath).toBe("/v2");
  });

  it("should use last-defined debug", () => {
    const merged = mergeConfigs(
      { routes: [route("/a")], debug: true },
      { debug: "stoma:gateway" }
    );

    expect(merged.debug).toBe("stoma:gateway");
  });

  it("should use last-defined requestIdHeader", () => {
    const merged = mergeConfigs(
      { routes: [route("/a")], requestIdHeader: "x-req-id" },
      { requestIdHeader: "x-trace-id" }
    );

    expect(merged.requestIdHeader).toBe("x-trace-id");
  });

  it("should use last-defined defaultErrorMessage", () => {
    const merged = mergeConfigs(
      { routes: [route("/a")], defaultErrorMessage: "oops" },
      { defaultErrorMessage: "something went wrong" }
    );

    expect(merged.defaultErrorMessage).toBe("something went wrong");
  });

  it("should use last-defined defaultPolicyPriority", () => {
    const merged = mergeConfigs(
      { routes: [route("/a")], defaultPolicyPriority: 50 },
      { defaultPolicyPriority: 200 }
    );

    expect(merged.defaultPolicyPriority).toBe(200);
  });

  it("should use last-defined defaultMethods", () => {
    const merged = mergeConfigs(
      { routes: [route("/a")], defaultMethods: ["GET"] },
      { defaultMethods: ["GET", "POST"] }
    );

    expect(merged.defaultMethods).toEqual(["GET", "POST"]);
  });

  it("should use last-defined onError", () => {
    const handler1 = () => new Response("one");
    const handler2 = () => new Response("two");

    const merged = mergeConfigs(
      { routes: [route("/a")], onError: handler1 },
      { onError: handler2 }
    );

    expect(merged.onError).toBe(handler2);
  });

  it("should use last-defined adapter", () => {
    const adapter1 = {};
    const adapter2 = { rateLimitStore: {} as any };

    const merged = mergeConfigs(
      { routes: [route("/a")], adapter: adapter1 },
      { adapter: adapter2 }
    );

    expect(merged.adapter).toBe(adapter2);
  });

  it("should skip undefined fields (earlier values preserved)", () => {
    const merged = mergeConfigs(
      { routes: [route("/a")], name: "keep-me", basePath: "/v1" },
      { routes: [route("/b")] } // no name or basePath
    );

    expect(merged.name).toBe("keep-me");
    expect(merged.basePath).toBe("/v1");
  });

  it("should not include unset scalar fields in result", () => {
    const merged = mergeConfigs({ routes: [route("/a")] });

    expect(merged).not.toHaveProperty("name");
    expect(merged).not.toHaveProperty("basePath");
    expect(merged).not.toHaveProperty("debug");
    expect(merged).not.toHaveProperty("requestIdHeader");
    expect(merged).not.toHaveProperty("onError");
  });
});

// ── Admin config merge ──

describe("mergeConfigs - admin config", () => {
  it("should shallow-merge admin objects", () => {
    const merged = mergeConfigs(
      {
        routes: [route("/a")],
        admin: { enabled: true, prefix: "___gw" } as AdminConfig,
      },
      {
        admin: { enabled: true, prefix: "___admin" } as AdminConfig,
      }
    );

    const admin = merged.admin as AdminConfig;
    expect(admin.enabled).toBe(true);
    expect(admin.prefix).toBe("___admin");
  });

  it("should preserve keys from earlier admin object not overridden", () => {
    const authFn = () => true;

    const merged = mergeConfigs(
      {
        routes: [route("/a")],
        admin: { enabled: true, prefix: "___gw", auth: authFn } as AdminConfig,
      },
      {
        admin: { enabled: false } as AdminConfig,
      }
    );

    const admin = merged.admin as AdminConfig;
    expect(admin.enabled).toBe(false);
    expect(admin.prefix).toBe("___gw");
    expect(admin.auth).toBe(authFn);
  });

  it("should handle boolean admin overriding object admin", () => {
    const merged = mergeConfigs(
      {
        routes: [route("/a")],
        admin: { enabled: true, prefix: "___gw" } as AdminConfig,
      },
      { admin: false }
    );

    expect(merged.admin).toBe(false);
  });

  it("should handle object admin overriding boolean admin", () => {
    const merged = mergeConfigs(
      { routes: [route("/a")], admin: true },
      { admin: { enabled: true, prefix: "___custom" } as AdminConfig }
    );

    const admin = merged.admin as AdminConfig;
    expect(admin.enabled).toBe(true);
    expect(admin.prefix).toBe("___custom");
  });

  it("should handle boolean true overriding boolean false", () => {
    const merged = mergeConfigs(
      { routes: [route("/a")], admin: false },
      { admin: true }
    );

    expect(merged.admin).toBe(true);
  });
});

// ── DebugHeaders config merge ──

describe("mergeConfigs - debugHeaders config", () => {
  it("should shallow-merge debugHeaders objects", () => {
    const merged = mergeConfigs(
      {
        routes: [route("/a")],
        debugHeaders: {
          requestHeader: "x-debug",
          allow: ["x-cache-key"],
        } as DebugHeadersConfig,
      },
      {
        debugHeaders: { allow: ["x-cache-ttl"] } as DebugHeadersConfig,
      }
    );

    const dh = merged.debugHeaders as DebugHeadersConfig;
    expect(dh.requestHeader).toBe("x-debug");
    expect(dh.allow).toEqual(["x-cache-ttl"]);
  });

  it("should handle boolean debugHeaders overriding object", () => {
    const merged = mergeConfigs(
      {
        routes: [route("/a")],
        debugHeaders: { requestHeader: "x-debug" } as DebugHeadersConfig,
      },
      { debugHeaders: false }
    );

    expect(merged.debugHeaders).toBe(false);
  });

  it("should handle object debugHeaders overriding boolean", () => {
    const merged = mergeConfigs(
      { routes: [route("/a")], debugHeaders: true },
      { debugHeaders: { requestHeader: "x-my-debug" } as DebugHeadersConfig }
    );

    const dh = merged.debugHeaders as DebugHeadersConfig;
    expect(dh.requestHeader).toBe("x-my-debug");
  });
});

// ── Error conditions ──

describe("mergeConfigs - error conditions", () => {
  it("should throw GatewayError when merged routes array is empty", () => {
    expect(() => mergeConfigs({ routes: [] })).toThrow(GatewayError);
    expect(() => mergeConfigs({ routes: [] })).toThrow("zero routes");
  });

  it("should throw GatewayError when no configs provide routes", () => {
    expect(() => mergeConfigs({ name: "no-routes" })).toThrow(GatewayError);
  });

  it("should throw GatewayError when called with no arguments", () => {
    expect(() => mergeConfigs()).toThrow(GatewayError);
  });

  it("should throw GatewayError when all configs have empty route arrays", () => {
    expect(() => mergeConfigs({ routes: [] }, { routes: [] })).toThrow(
      GatewayError
    );
  });
});

// ── TBindings generic type safety ──

describe("mergeConfigs - generic type safety", () => {
  it("should propagate TBindings through to routes", () => {
    interface MyEnv {
      AUTH_SERVICE: Fetcher;
    }

    // This is a compile-time type check - if TBindings doesn't flow through,
    // TypeScript would error on the service-binding route.
    const merged = mergeConfigs<MyEnv>(
      {
        routes: [
          {
            path: "/auth/*",
            pipeline: {
              upstream: { type: "service-binding", service: "AUTH_SERVICE" },
            },
          },
        ],
      },
      {
        routes: [route("/api")],
      }
    );

    expect(merged.routes).toHaveLength(2);
  });
});

// ── Integration with createGateway ──

describe("mergeConfigs - integration with createGateway", () => {
  it("should produce a config that createGateway accepts", async () => {
    const merged = mergeConfigs(
      { name: "test-gw", basePath: "/api" },
      { routes: [route("/users")], policies: [policy("cors", 5)] },
      { routes: [route("/items")] }
    );

    const gw = createGateway(merged);

    expect(gw.name).toBe("test-gw");
    expect(gw.routeCount).toBeGreaterThan(0);

    const res = await gw.app.request("/api/users");
    expect(res.status).toBe(200);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body.ok).toBe(true);
  });

  it("should work with route-level policies after merge", async () => {
    let policyExecuted = false;

    const trackPolicy: Policy = {
      name: "tracker",
      priority: 10,
      handler: async (_c, next) => {
        policyExecuted = true;
        await next();
      },
    };

    const merged = mergeConfigs(
      { routes: [route("/a")], policies: [trackPolicy] },
      { routes: [route("/b")] }
    );

    const gw = createGateway(merged);
    await gw.app.request("/a");

    expect(policyExecuted).toBe(true);
  });
});

// ── Edge cases ──

describe("mergeConfigs - edge cases", () => {
  it("should work with a single config", () => {
    const merged = mergeConfigs({
      routes: [route("/only")],
      name: "single",
    });

    expect(merged.routes).toHaveLength(1);
    expect(merged.name).toBe("single");
  });

  it("should work with many configs", () => {
    const configs = Array.from({ length: 10 }, (_, i) => ({
      routes: [route(`/route-${i}`)],
    }));

    const merged = mergeConfigs(...configs);
    expect(merged.routes).toHaveLength(10);
  });

  it("should handle config with only scalar fields (no routes)", () => {
    // This alone would throw, but combined with a route-bearing config it's fine
    const merged = mergeConfigs(
      { name: "base", debug: true, basePath: "/v1" },
      { routes: [route("/a")] }
    );

    expect(merged.name).toBe("base");
    expect(merged.debug).toBe(true);
    expect(merged.basePath).toBe("/v1");
    expect(merged.routes).toHaveLength(1);
  });

  it("should handle empty policies array (no policies added)", () => {
    const merged = mergeConfigs(
      { routes: [route("/a")], policies: [] },
      { routes: [route("/b")] }
    );

    expect(merged.policies).toBeUndefined();
  });

  it("should allow debug to be set to false explicitly", () => {
    const merged = mergeConfigs(
      { routes: [route("/a")], debug: true },
      { debug: false }
    );

    expect(merged.debug).toBe(false);
  });

  it("should preserve route metadata through merge", () => {
    const merged = mergeConfigs({
      routes: [
        {
          ...route("/a"),
          metadata: { version: "v2", owner: "team-a" },
        },
      ],
    });

    expect(merged.routes[0].metadata).toEqual({
      version: "v2",
      owner: "team-a",
    });
  });

  it("should preserve route methods through merge", () => {
    const merged = mergeConfigs({
      routes: [
        {
          ...route("/a"),
          methods: ["GET", "POST"],
        },
      ],
    });

    expect(merged.routes[0].methods).toEqual(["GET", "POST"]);
  });
});
