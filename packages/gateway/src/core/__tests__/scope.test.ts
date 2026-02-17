import type { Context } from "hono";
import { describe, expect, it } from "vitest";
import type { Policy } from "../../policies/types";
import { createGateway } from "../gateway";
import { scope } from "../scope";
import type { RouteConfig } from "../types";

function echoHandler(c: Context) {
  return c.json({ path: c.req.path, method: c.req.method });
}

function makeRoute(overrides?: Partial<RouteConfig>): RouteConfig {
  return {
    path: "/test",
    methods: ["GET"],
    pipeline: {
      upstream: { type: "handler", handler: echoHandler },
    },
    ...overrides,
  };
}

function makePolicy(name: string): Policy {
  return {
    name,
    handler: async (_c, next) => {
      await next();
    },
  };
}

// ── Prefix prepending ──

describe("scope - prefix prepending", () => {
  it("should prepend prefix to route path", () => {
    const routes = scope({
      prefix: "/api",
      routes: [makeRoute({ path: "/users" })],
    });

    expect(routes).toHaveLength(1);
    expect(routes[0].path).toBe("/api/users");
  });

  it("should handle prefix without leading slash", () => {
    const routes = scope({
      prefix: "api",
      routes: [makeRoute({ path: "/users" })],
    });

    expect(routes[0].path).toBe("/api/users");
  });

  it("should handle prefix with trailing slash", () => {
    const routes = scope({
      prefix: "/api/",
      routes: [makeRoute({ path: "/users" })],
    });

    expect(routes[0].path).toBe("/api/users");
  });

  it("should handle prefix with both missing leading and trailing slash", () => {
    const routes = scope({
      prefix: "api/v1",
      routes: [makeRoute({ path: "/users" })],
    });

    expect(routes[0].path).toBe("/api/v1/users");
  });

  it("should handle route path without leading slash", () => {
    const routes = scope({
      prefix: "/api",
      routes: [makeRoute({ path: "users" })],
    });

    expect(routes[0].path).toBe("/api/users");
  });

  it("should avoid double slashes at join point", () => {
    const routes = scope({
      prefix: "/api/",
      routes: [makeRoute({ path: "/users" })],
    });

    expect(routes[0].path).not.toContain("//");
    expect(routes[0].path).toBe("/api/users");
  });

  it("should handle root prefix", () => {
    const routes = scope({
      prefix: "/",
      routes: [makeRoute({ path: "/users" })],
    });

    expect(routes[0].path).toBe("/users");
  });

  it("should handle multiple routes", () => {
    const routes = scope({
      prefix: "/api/v1",
      routes: [
        makeRoute({ path: "/users" }),
        makeRoute({ path: "/orders" }),
        makeRoute({ path: "/products" }),
      ],
    });

    expect(routes).toHaveLength(3);
    expect(routes[0].path).toBe("/api/v1/users");
    expect(routes[1].path).toBe("/api/v1/orders");
    expect(routes[2].path).toBe("/api/v1/products");
  });

  it("should handle route with path parameters", () => {
    const routes = scope({
      prefix: "/api",
      routes: [makeRoute({ path: "/users/:id" })],
    });

    expect(routes[0].path).toBe("/api/users/:id");
  });

  it("should handle route with wildcard", () => {
    const routes = scope({
      prefix: "/api",
      routes: [makeRoute({ path: "/proxy/*" })],
    });

    expect(routes[0].path).toBe("/api/proxy/*");
  });
});

// ── Policy prepending ──

describe("scope - policy prepending", () => {
  it("should prepend scope policies before route policies", () => {
    const scopePolicy = makePolicy("scope-auth");
    const routePolicy = makePolicy("route-transform");

    const routes = scope({
      prefix: "/api",
      policies: [scopePolicy],
      routes: [
        makeRoute({
          path: "/users",
          pipeline: {
            policies: [routePolicy],
            upstream: { type: "handler", handler: echoHandler },
          },
        }),
      ],
    });

    const policies = routes[0].pipeline.policies!;
    expect(policies).toHaveLength(2);
    expect(policies[0].name).toBe("scope-auth");
    expect(policies[1].name).toBe("route-transform");
  });

  it("should handle scope with policies and route without policies", () => {
    const scopePolicy = makePolicy("scope-auth");

    const routes = scope({
      prefix: "/api",
      policies: [scopePolicy],
      routes: [makeRoute({ path: "/users" })],
    });

    const policies = routes[0].pipeline.policies!;
    expect(policies).toHaveLength(1);
    expect(policies[0].name).toBe("scope-auth");
  });

  it("should handle scope without policies and route with policies", () => {
    const routePolicy = makePolicy("route-transform");

    const routes = scope({
      prefix: "/api",
      routes: [
        makeRoute({
          path: "/users",
          pipeline: {
            policies: [routePolicy],
            upstream: { type: "handler", handler: echoHandler },
          },
        }),
      ],
    });

    const policies = routes[0].pipeline.policies!;
    expect(policies).toHaveLength(1);
    expect(policies[0].name).toBe("route-transform");
  });

  it("should not add policies array when neither scope nor route have policies", () => {
    const routes = scope({
      prefix: "/api",
      routes: [makeRoute({ path: "/users" })],
    });

    expect(routes[0].pipeline.policies).toBeUndefined();
  });

  it("should handle multiple scope policies in order", () => {
    const policy1 = makePolicy("first");
    const policy2 = makePolicy("second");
    const policy3 = makePolicy("third");

    const routes = scope({
      prefix: "/api",
      policies: [policy1, policy2, policy3],
      routes: [makeRoute({ path: "/users" })],
    });

    const policies = routes[0].pipeline.policies!;
    expect(policies).toHaveLength(3);
    expect(policies[0].name).toBe("first");
    expect(policies[1].name).toBe("second");
    expect(policies[2].name).toBe("third");
  });

  it("should apply scope policies to all child routes", () => {
    const scopePolicy = makePolicy("shared-auth");

    const routes = scope({
      prefix: "/api",
      policies: [scopePolicy],
      routes: [makeRoute({ path: "/users" }), makeRoute({ path: "/orders" })],
    });

    for (const route of routes) {
      expect(route.pipeline.policies).toBeDefined();
      expect(route.pipeline.policies![0].name).toBe("shared-auth");
    }
  });
});

// ── Metadata merging ──

describe("scope - metadata merging", () => {
  it("should merge scope metadata into route without metadata", () => {
    const routes = scope({
      prefix: "/api",
      metadata: { team: "platform", version: "v1" },
      routes: [makeRoute({ path: "/users" })],
    });

    expect(routes[0].metadata).toEqual({ team: "platform", version: "v1" });
  });

  it("should merge scope metadata with route metadata (child wins)", () => {
    const routes = scope({
      prefix: "/api",
      metadata: { team: "platform", version: "v1" },
      routes: [
        makeRoute({
          path: "/users",
          metadata: { team: "users", owner: "alice" },
        }),
      ],
    });

    expect(routes[0].metadata).toEqual({
      team: "users", // child wins over scope
      version: "v1", // inherited from scope
      owner: "alice", // from child only
    });
  });

  it("should not add metadata when neither scope nor route have it", () => {
    const routes = scope({
      prefix: "/api",
      routes: [makeRoute({ path: "/users" })],
    });

    expect(routes[0].metadata).toBeUndefined();
  });

  it("should preserve route metadata when scope has no metadata", () => {
    const routes = scope({
      prefix: "/api",
      routes: [
        makeRoute({
          path: "/users",
          metadata: { owner: "alice" },
        }),
      ],
    });

    expect(routes[0].metadata).toEqual({ owner: "alice" });
  });

  it("should apply scope metadata to all child routes", () => {
    const routes = scope({
      prefix: "/api",
      metadata: { team: "platform" },
      routes: [
        makeRoute({ path: "/users" }),
        makeRoute({ path: "/orders", metadata: { owner: "bob" } }),
      ],
    });

    expect(routes[0].metadata).toEqual({ team: "platform" });
    expect(routes[1].metadata).toEqual({ team: "platform", owner: "bob" });
  });
});

// ── Preservation of other fields ──

describe("scope - field preservation", () => {
  it("should preserve route methods", () => {
    const routes = scope({
      prefix: "/api",
      routes: [makeRoute({ path: "/users", methods: ["GET", "POST"] })],
    });

    expect(routes[0].methods).toEqual(["GET", "POST"]);
  });

  it("should preserve upstream configuration", () => {
    const handler = echoHandler;
    const routes = scope({
      prefix: "/api",
      routes: [
        makeRoute({
          path: "/users",
          pipeline: {
            upstream: { type: "handler", handler },
          },
        }),
      ],
    });

    expect(routes[0].pipeline.upstream).toEqual({
      type: "handler",
      handler,
    });
  });
});

// ── Nesting ──

describe("scope - nesting", () => {
  it("should support nested scopes (inner output fed to outer)", () => {
    const innerRoutes = scope({
      prefix: "/v1",
      routes: [makeRoute({ path: "/users" }), makeRoute({ path: "/orders" })],
    });

    const outerRoutes = scope({
      prefix: "/api",
      routes: innerRoutes,
    });

    expect(outerRoutes).toHaveLength(2);
    expect(outerRoutes[0].path).toBe("/api/v1/users");
    expect(outerRoutes[1].path).toBe("/api/v1/orders");
  });

  it("should accumulate policies from nested scopes", () => {
    const innerPolicy = makePolicy("inner-auth");
    const outerPolicy = makePolicy("outer-cors");

    const innerRoutes = scope({
      prefix: "/v1",
      policies: [innerPolicy],
      routes: [makeRoute({ path: "/users" })],
    });

    const outerRoutes = scope({
      prefix: "/api",
      policies: [outerPolicy],
      routes: innerRoutes,
    });

    const policies = outerRoutes[0].pipeline.policies!;
    expect(policies).toHaveLength(2);
    // Outer policies prepend before inner (which already includes inner scope policies)
    expect(policies[0].name).toBe("outer-cors");
    expect(policies[1].name).toBe("inner-auth");
  });

  it("should accumulate metadata from nested scopes (inner wins over outer)", () => {
    const innerRoutes = scope({
      prefix: "/v1",
      metadata: { version: "v1", team: "inner" },
      routes: [makeRoute({ path: "/users" })],
    });

    const outerRoutes = scope({
      prefix: "/api",
      metadata: { team: "outer", org: "acme" },
      routes: innerRoutes,
    });

    // Inner scope already merged its metadata into child routes.
    // Outer scope merges its metadata as base, child (which has inner metadata) wins.
    expect(outerRoutes[0].metadata).toEqual({
      org: "acme", // from outer scope
      team: "inner", // inner wins over outer
      version: "v1", // from inner scope
    });
  });

  it("should support three levels of nesting", () => {
    const level3 = scope({
      prefix: "/items",
      routes: [makeRoute({ path: "/:id" })],
    });

    const level2 = scope({
      prefix: "/v2",
      routes: level3,
    });

    const level1 = scope({
      prefix: "/api",
      routes: level2,
    });

    expect(level1[0].path).toBe("/api/v2/items/:id");
  });
});

// ── Empty/edge cases ──

describe("scope - edge cases", () => {
  it("should handle empty routes array", () => {
    const routes = scope({
      prefix: "/api",
      routes: [],
    });

    expect(routes).toEqual([]);
  });

  it("should handle empty policies array", () => {
    const routes = scope({
      prefix: "/api",
      policies: [],
      routes: [makeRoute({ path: "/users" })],
    });

    // Empty scope policies + no route policies = no policies
    expect(routes[0].pipeline.policies).toBeUndefined();
  });

  it("should handle empty metadata object", () => {
    const routes = scope({
      prefix: "/api",
      metadata: {},
      routes: [makeRoute({ path: "/users" })],
    });

    expect(routes[0].metadata).toBeUndefined();
  });

  it("should not mutate original route objects", () => {
    const originalRoute = makeRoute({
      path: "/users",
      metadata: { owner: "alice" },
    });
    const originalPath = originalRoute.path;
    const originalMetadata = { ...originalRoute.metadata };

    scope({
      prefix: "/api",
      metadata: { team: "platform" },
      policies: [makePolicy("auth")],
      routes: [originalRoute],
    });

    expect(originalRoute.path).toBe(originalPath);
    expect(originalRoute.metadata).toEqual(originalMetadata);
  });
});

// ── Integration with createGateway ──

describe("scope - integration with createGateway", () => {
  it("should produce routes that work with createGateway", async () => {
    const routes = scope({
      prefix: "/api/v1",
      routes: [makeRoute({ path: "/users" }), makeRoute({ path: "/orders" })],
    });

    const gw = createGateway({ routes });

    const usersRes = await gw.app.request("/api/v1/users");
    const ordersRes = await gw.app.request("/api/v1/orders");

    expect(usersRes.status).toBe(200);
    expect(ordersRes.status).toBe(200);

    const usersBody = (await usersRes.json()) as Record<string, unknown>;
    const ordersBody = (await ordersRes.json()) as Record<string, unknown>;

    expect(usersBody.path).toBe("/api/v1/users");
    expect(ordersBody.path).toBe("/api/v1/orders");
  });

  it("should execute scope policies in gateway pipeline", async () => {
    const executionOrder: string[] = [];

    const scopePolicy: Policy = {
      name: "scope-tracker",
      handler: async (_c, next) => {
        executionOrder.push("scope-policy");
        await next();
      },
    };

    const routePolicy: Policy = {
      name: "route-tracker",
      handler: async (_c, next) => {
        executionOrder.push("route-policy");
        await next();
      },
    };

    const routes = scope({
      prefix: "/api",
      policies: [scopePolicy],
      routes: [
        {
          path: "/test",
          methods: ["GET"] as const,
          pipeline: {
            policies: [routePolicy],
            upstream: { type: "handler" as const, handler: echoHandler },
          },
        },
      ],
    });

    const gw = createGateway({ routes });
    const res = await gw.app.request("/api/test");

    expect(res.status).toBe(200);
    expect(executionOrder).toEqual(["scope-policy", "route-policy"]);
  });

  it("should work with nested scopes in createGateway", async () => {
    const innerRoutes = scope({
      prefix: "/v1",
      routes: [makeRoute({ path: "/health" })],
    });

    const outerRoutes = scope({
      prefix: "/api",
      routes: innerRoutes,
    });

    const gw = createGateway({ routes: outerRoutes });
    const res = await gw.app.request("/api/v1/health");

    expect(res.status).toBe(200);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body.path).toBe("/api/v1/health");
  });

  it("should work alongside non-scoped routes in createGateway", async () => {
    const scopedRoutes = scope({
      prefix: "/api",
      routes: [makeRoute({ path: "/users" })],
    });

    const gw = createGateway({
      routes: [makeRoute({ path: "/health" }), ...scopedRoutes],
    });

    const healthRes = await gw.app.request("/health");
    const usersRes = await gw.app.request("/api/users");

    expect(healthRes.status).toBe(200);
    expect(usersRes.status).toBe(200);

    const healthBody = (await healthRes.json()) as Record<string, unknown>;
    const usersBody = (await usersRes.json()) as Record<string, unknown>;

    expect(healthBody.path).toBe("/health");
    expect(usersBody.path).toBe("/api/users");
  });
});
