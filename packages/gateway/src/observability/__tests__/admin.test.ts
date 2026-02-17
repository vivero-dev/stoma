import { describe, expect, it } from "vitest";
import { createGateway, InMemoryMetricsCollector } from "../../index";

// biome-ignore lint/suspicious/noExplicitAny: test convenience for JSON parsing
type Json = any;

describe("Admin introspection API", () => {
  function createTestGateway(adminConfig?: boolean | Record<string, unknown>) {
    return createGateway({
      name: "test-gw",
      admin: adminConfig as Parameters<typeof createGateway>[0]["admin"],
      routes: [
        {
          path: "/api/users",
          methods: ["GET", "POST"],
          pipeline: {
            policies: [
              {
                name: "jwt-auth",
                handler: async (_c, next) => next(),
                priority: 10,
              },
            ],
            upstream: {
              type: "handler",
              handler: (c) => c.json({ users: [] }),
            },
          },
        },
        {
          path: "/api/health",
          methods: ["GET"],
          pipeline: {
            upstream: {
              type: "handler",
              handler: (c) => c.json({ status: "ok" }),
            },
          },
        },
      ],
    });
  }

  // --- Route listing ---

  it("should list all registered routes", async () => {
    const gw = createTestGateway(true);
    const res = await gw.app.request("/___gateway/routes");
    expect(res.status).toBe(200);

    const body: Json = await res.json();
    expect(body.gateway).toBe("test-gw");
    expect(body.routes).toHaveLength(2);
    expect(body.routes[0].path).toBe("/api/users");
    expect(body.routes[0].methods).toEqual(["GET", "POST"]);
    expect(body.routes[0].upstreamType).toBe("handler");
  });

  it("should include policy names in route listing", async () => {
    const gw = createTestGateway(true);
    const res = await gw.app.request("/___gateway/routes");
    const body: Json = await res.json();

    expect(body.routes[0].policyNames).toContain("jwt-auth");
  });

  // --- Policy listing ---

  it("should list all unique policies with priority", async () => {
    const gw = createTestGateway(true);
    const res = await gw.app.request("/___gateway/policies");
    expect(res.status).toBe(200);

    const body: Json = await res.json();
    expect(body.gateway).toBe("test-gw");
    expect(body.policies.length).toBeGreaterThanOrEqual(1);
    expect(
      body.policies.find((p: { name: string }) => p.name === "jwt-auth")
    ).toBeDefined();
  });

  // --- Config ---

  it("should return config with gateway name", async () => {
    const gw = createTestGateway(true);
    const res = await gw.app.request("/___gateway/config");
    expect(res.status).toBe(200);

    const body: Json = await res.json();
    expect(body.gateway).toBe("test-gw");
  });

  // --- Health ---

  it("should return health status", async () => {
    const gw = createTestGateway(true);
    const res = await gw.app.request("/___gateway/health");
    expect(res.status).toBe(200);

    const body: Json = await res.json();
    expect(body.status).toBe("healthy");
    expect(body.gateway).toBe("test-gw");
    expect(body.routeCount).toBe(2);
    expect(body.timestamp).toBeDefined();
  });

  // --- Metrics ---

  it("should return 404 when no metrics collector configured", async () => {
    const gw = createTestGateway(true);
    const res = await gw.app.request("/___gateway/metrics");
    expect(res.status).toBe(404);

    const body: Json = await res.json();
    expect(body.error).toBe("not_configured");
  });

  it("should return Prometheus text when metrics collector is configured", async () => {
    const collector = new InMemoryMetricsCollector();
    collector.increment("gateway_requests_total", 5, { method: "GET" });

    const gw = createTestGateway({ enabled: true, metrics: collector });
    const res = await gw.app.request("/___gateway/metrics");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/plain");

    const text = await res.text();
    expect(text).toContain("gateway_requests_total");
    expect(text).toContain("5");
  });

  // --- Auth ---

  it("should deny access when auth function returns false", async () => {
    const gw = createTestGateway({
      enabled: true,
      auth: () => false,
    });

    const res = await gw.app.request("/___gateway/routes");
    expect(res.status).toBe(403);

    const body: Json = await res.json();
    expect(body.error).toBe("unauthorized");
  });

  it("should allow access when auth function returns true", async () => {
    const gw = createTestGateway({
      enabled: true,
      auth: () => true,
    });

    const res = await gw.app.request("/___gateway/routes");
    expect(res.status).toBe(200);
  });

  it("should support async auth function", async () => {
    const gw = createTestGateway({
      enabled: true,
      auth: async () => Promise.resolve(false),
    });

    const res = await gw.app.request("/___gateway/routes");
    expect(res.status).toBe(403);
  });

  // --- Custom prefix ---

  it("should support custom path prefix", async () => {
    const gw = createTestGateway({
      enabled: true,
      prefix: "_admin",
    });

    const res = await gw.app.request("/_admin/routes");
    expect(res.status).toBe(200);
  });

  // --- Disabled ---

  it("should not register admin routes when disabled", async () => {
    const gw = createTestGateway(false);
    const res = await gw.app.request("/___gateway/routes");
    expect(res.status).toBe(404);
  });

  it("should not register admin routes when admin is { enabled: false }", async () => {
    const gw = createTestGateway({ enabled: false });
    const res = await gw.app.request("/___gateway/routes");
    expect(res.status).toBe(404);
  });

  // --- Registry ---

  it("should expose _registry on gateway instance", () => {
    const gw = createTestGateway(true);
    expect(gw._registry).toBeDefined();
    expect(gw._registry.routes).toHaveLength(2);
    expect(gw._registry.gatewayName).toBe("test-gw");
  });

  it("should include all registered routes in _registry", () => {
    const gw = createTestGateway(true);
    const routePaths = gw._registry.routes.map((r) => r.path);
    expect(routePaths).toContain("/api/users");
    expect(routePaths).toContain("/api/health");
  });
});
