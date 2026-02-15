import type { Context } from "hono";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cors } from "../../policies/transform/cors";
import { proxy } from "../../policies/proxy";
import type { Policy } from "../../policies/types";
import { GatewayError } from "../errors";
import { createGateway } from "../gateway";
import type { HttpMethod, RouteConfig } from "../types";

function echoHandler(c: Context) {
  return c.json({ path: c.req.path, method: c.req.method });
}

/** Methods that Hono supports as direct method calls */
const HONO_METHODS: HttpMethod[] = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
];

function makeRoute(overrides?: Partial<RouteConfig>): RouteConfig {
  return {
    path: "/test",
    methods: HONO_METHODS,
    pipeline: {
      upstream: { type: "handler", handler: echoHandler },
    },
    ...overrides,
  };
}

// ── Valid scenarios ──

describe("createGateway - valid scenarios", () => {
  it("should create a gateway with a single route and handler upstream", async () => {
    const gw = createGateway({
      routes: [makeRoute()],
    });

    const res = await gw.app.request("/test");
    const body = (await res.json()) as Record<string, unknown>;

    expect(res.status).toBe(200);
    expect(body.path).toBe("/test");
  });

  it("should create a gateway with multiple routes", async () => {
    const gw = createGateway({
      routes: [makeRoute({ path: "/alpha" }), makeRoute({ path: "/beta" })],
    });

    const resA = await gw.app.request("/alpha");
    const resB = await gw.app.request("/beta");

    expect(resA.status).toBe(200);
    expect(resB.status).toBe(200);

    const bodyA = (await resA.json()) as Record<string, unknown>;
    const bodyB = (await resB.json()) as Record<string, unknown>;
    expect(bodyA.path).toBe("/alpha");
    expect(bodyB.path).toBe("/beta");
  });

  it("should apply basePath prefix to all routes", async () => {
    const gw = createGateway({
      basePath: "/api",
      routes: [makeRoute({ path: "/users" })],
    });

    const res = await gw.app.request("/api/users");
    expect(res.status).toBe(200);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body.path).toBe("/api/users");
  });

  it("should use default gateway name when none provided", () => {
    const gw = createGateway({
      routes: [makeRoute()],
    });

    expect(gw.name).toBe("edge-gateway");
  });

  it("should use custom gateway name when provided", () => {
    const gw = createGateway({
      name: "my-custom-gw",
      routes: [makeRoute()],
    });

    expect(gw.name).toBe("my-custom-gw");
  });

  it("should register routes for all HTTP methods when methods not specified", async () => {
    const gw = createGateway({
      routes: [makeRoute()],
    });

    for (const method of HONO_METHODS) {
      const res = await gw.app.request("/test", { method });
      expect(res.status).toBe(200);
    }

    // 6 methods for 1 route (HONO_METHODS excludes HEAD which Hono handles via GET)
    expect(gw.routeCount).toBe(6);
  });

  it("should register routes only for specified methods", async () => {
    const gw = createGateway({
      routes: [makeRoute({ methods: ["GET", "POST"] })],
    });

    const getRes = await gw.app.request("/test", { method: "GET" });
    const postRes = await gw.app.request("/test", { method: "POST" });
    expect(getRes.status).toBe(200);
    expect(postRes.status).toBe(200);

    // DELETE should 404
    const deleteRes = await gw.app.request("/test", { method: "DELETE" });
    expect(deleteRes.status).toBe(404);

    expect(gw.routeCount).toBe(2);
  });
});

// ── Boundary conditions ──

describe("createGateway - boundary conditions", () => {
  it("should handle routes with trailing slashes in basePath", async () => {
    const gw = createGateway({
      basePath: "/api/",
      routes: [makeRoute({ path: "/items" })],
    });

    const res = await gw.app.request("/api/items");
    expect(res.status).toBe(200);
  });

  it("should handle routes with no policies in pipeline", async () => {
    const gw = createGateway({
      routes: [
        {
          path: "/bare",
          methods: ["GET"],
          pipeline: {
            upstream: { type: "handler", handler: echoHandler },
          },
        },
      ],
    });

    const res = await gw.app.request("/bare");
    expect(res.status).toBe(200);
  });

  it("should handle routes with empty policies array", async () => {
    const gw = createGateway({
      routes: [
        {
          path: "/empty-policies",
          methods: ["GET"],
          pipeline: {
            policies: [],
            upstream: { type: "handler", handler: echoHandler },
          },
        },
      ],
    });

    const res = await gw.app.request("/empty-policies");
    expect(res.status).toBe(200);
  });
});

// ── Error handling ──

describe("createGateway - error handling", () => {
  it("should throw GatewayError when routes array is empty", () => {
    expect(() => createGateway({ routes: [] })).toThrow(GatewayError);
    expect(() => createGateway({ routes: [] })).toThrow(
      "Gateway requires at least one route"
    );
  });

  it("should throw GatewayError when routes is undefined", () => {
    expect(() =>
      createGateway({ routes: undefined as unknown as RouteConfig[] })
    ).toThrow(GatewayError);
  });

  it("should throw GatewayError for unknown upstream type", () => {
    expect(() =>
      createGateway({
        routes: [
          {
            path: "/bad",
            pipeline: {
              // biome-ignore lint/suspicious/noExplicitAny: intentionally invalid upstream for error testing
              upstream: { type: "unknown" as "handler" } as any,
            },
          },
        ],
      })
    ).toThrow(GatewayError);
    expect(() =>
      createGateway({
        routes: [
          {
            path: "/bad",
            pipeline: {
              // biome-ignore lint/suspicious/noExplicitAny: intentionally invalid upstream for error testing
              upstream: { type: "unknown" as "handler" } as any,
            },
          },
        ],
      })
    ).toThrow("Unknown upstream type: unknown");
  });

  it("should return 502 when service binding is not in env", async () => {
    const gw = createGateway({
      routes: [
        {
          path: "/sb",
          methods: ["GET"],
          pipeline: {
            upstream: { type: "service-binding", service: "MY_SERVICE" },
          },
        },
      ],
    });

    // No adapter provided - dispatchBinding is unavailable
    const res = await gw.app.request("/sb");
    expect(res.status).toBe(502);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("config_error");
    expect(body.message).toContain("MY_SERVICE");
    expect(body.message).toContain("dispatchBinding");
  });

  it("should use custom onError handler when provided", async () => {
    const gw = createGateway({
      routes: [
        {
          path: "/err",
          methods: ["GET"],
          pipeline: {
            upstream: {
              type: "handler",
              handler: () => {
                throw new Error("boom");
              },
            },
          },
        },
      ],
      onError: (_err, c) => {
        return new Response(JSON.stringify({ custom: true, url: c.req.url }), {
          status: 418,
          headers: { "content-type": "application/json" },
        });
      },
    });

    const res = await gw.app.request("/err");
    expect(res.status).toBe(418);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body.custom).toBe(true);
    expect(body.url).toContain("/err");
  });

  it("should return structured JSON error for GatewayError thrown by policies", async () => {
    const failPolicy: Policy = {
      name: "fail-policy",
      handler: async () => {
        throw new GatewayError(403, "forbidden", "You shall not pass");
      },
    };

    const gw = createGateway({
      routes: [
        {
          path: "/guarded",
          methods: ["GET"],
          pipeline: {
            policies: [failPolicy],
            upstream: { type: "handler", handler: echoHandler },
          },
        },
      ],
    });

    const res = await gw.app.request("/guarded");
    expect(res.status).toBe(403);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("forbidden");
    expect(body.message).toBe("You shall not pass");
    expect(body.requestId).toBeDefined();
  });

  it("should return generic 500 for unexpected errors", async () => {
    const gw = createGateway({
      routes: [
        {
          path: "/boom",
          methods: ["GET"],
          pipeline: {
            upstream: {
              type: "handler",
              handler: () => {
                throw new TypeError("unexpected null reference");
              },
            },
          },
        },
      ],
    });

    const res = await gw.app.request("/boom");
    expect(res.status).toBe(500);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("internal_error");
    expect(body.message).toBe("An unexpected error occurred");
  });
});

// ── Upstream fetch errors ──

describe("createGateway - upstream fetch errors", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("should return 502 with upstream_error when fetch throws a network error", async () => {
    globalThis.fetch = async () => {
      throw new TypeError("fetch failed");
    };

    const gw = createGateway({
      routes: [
        {
          path: "/proxy/*",
          methods: ["GET"],
          pipeline: {
            upstream: {
              type: "url",
              target: "https://unreachable.example.com",
            },
          },
        },
      ],
    });

    const res = await gw.app.request("/proxy/test");
    expect(res.status).toBe(502);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("upstream_error");
    expect(body.message).toContain("unreachable.example.com");
    expect(body.message).toContain("fetch failed");
  });

  it("should re-throw AbortError so the timeout policy can handle it", async () => {
    globalThis.fetch = async () => {
      throw new DOMException("The operation was aborted", "AbortError");
    };

    const gw = createGateway({
      routes: [
        {
          path: "/proxy/*",
          methods: ["GET"],
          pipeline: {
            upstream: {
              type: "url",
              target: "https://slow.example.com",
            },
          },
        },
      ],
    });

    // AbortError is re-thrown and hits the global error handler as an
    // unexpected error (not a GatewayError), producing a generic 500.
    const res = await gw.app.request("/proxy/test");
    expect(res.status).toBe(500);

    const body = (await res.json()) as Record<string, unknown>;
    // Should NOT be "upstream_error" - the timeout policy would normally
    // catch this, but without it the global handler produces a generic error.
    expect(body.error).toBe("internal_error");
  });

  it("should include the upstream host in the 502 error message", async () => {
    globalThis.fetch = async () => {
      throw new Error("getaddrinfo ENOTFOUND api.internal.example.com");
    };

    const gw = createGateway({
      routes: [
        {
          path: "/api/*",
          methods: ["GET"],
          pipeline: {
            upstream: {
              type: "url",
              target: "https://api.internal.example.com",
            },
          },
        },
      ],
    });

    const res = await gw.app.request("/api/users");
    expect(res.status).toBe(502);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("upstream_error");
    expect(body.message).toContain("api.internal.example.com");
  });
});

// ── Edge cases ──

describe("createGateway - edge cases", () => {
  it("should handle concurrent requests to different routes", async () => {
    const gw = createGateway({
      routes: [
        makeRoute({ path: "/a" }),
        makeRoute({ path: "/b" }),
        makeRoute({ path: "/c" }),
      ],
    });

    const [resA, resB, resC] = await Promise.all([
      gw.app.request("/a"),
      gw.app.request("/b"),
      gw.app.request("/c"),
    ]);

    const [bodyA, bodyB, bodyC] = (await Promise.all([
      resA.json(),
      resB.json(),
      resC.json(),
    ])) as Record<string, unknown>[];

    expect(bodyA.path).toBe("/a");
    expect(bodyB.path).toBe("/b");
    expect(bodyC.path).toBe("/c");
  });

  it("should isolate policy context between requests", async () => {
    const capturedRequestIds: string[] = [];

    const capturePolicy: Policy = {
      name: "capture",
      handler: async (c, next) => {
        const ctx = c.get("gateway") as { requestId: string } | undefined;
        if (ctx) capturedRequestIds.push(ctx.requestId);
        await next();
      },
    };

    const gw = createGateway({
      routes: [
        {
          path: "/isolated",
          methods: ["GET"],
          pipeline: {
            policies: [capturePolicy],
            upstream: { type: "handler", handler: echoHandler },
          },
        },
      ],
    });

    await gw.app.request("/isolated");
    await gw.app.request("/isolated");

    expect(capturedRequestIds).toHaveLength(2);
    expect(capturedRequestIds[0]).not.toBe(capturedRequestIds[1]);
  });
});

// ── Security ──

describe("createGateway - security", () => {
  it("should reject rewritePath that changes upstream origin (SSRF protection)", async () => {
    const gw = createGateway({
      routes: [
        {
          path: "/proxy/*",
          methods: ["GET"],
          pipeline: {
            upstream: {
              type: "url",
              target: "https://api.example.com",
              // Attacker-controlled path rewrite that tries to change origin
              rewritePath: () => "https://evil.internal:8080/steal-data",
            },
          },
        },
      ],
    });

    const res = await gw.app.request("/proxy/anything");
    expect(res.status).toBe(502);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("upstream_error");
    expect(body.message).toContain("must not change the upstream origin");
  });

  it("should reject rewritePath that uses protocol-relative URL to change host", async () => {
    const gw = createGateway({
      routes: [
        {
          path: "/proxy/*",
          methods: ["GET"],
          pipeline: {
            upstream: {
              type: "url",
              target: "https://api.example.com",
              // Protocol-relative URL attempt
              rewritePath: () => "//evil.com/steal",
            },
          },
        },
      ],
    });

    const res = await gw.app.request("/proxy/anything");
    // The URL constructor with base should resolve //evil.com as a path change
    // to https://evil.com - our origin check should catch this
    expect(res.status).toBe(502);
  });

  it("should not leak internal error messages to clients", async () => {
    const gw = createGateway({
      routes: [
        {
          path: "/boom",
          methods: ["GET"],
          pipeline: {
            upstream: {
              type: "handler",
              handler: () => {
                throw new Error(
                  "database connection string: postgres://admin:secret@internal:5432/db"
                );
              },
            },
          },
        },
      ],
    });

    const res = await gw.app.request("/boom");
    expect(res.status).toBe(500);
    const body = (await res.json()) as Record<string, unknown>;
    // Generic message, no internal details leaked
    expect(body.message).toBe("An unexpected error occurred");
    expect(body.message).not.toContain("postgres://");
    expect(body.message).not.toContain("secret");
  });

  it("should set x-request-id to prevent spoofing/tracing issues", async () => {
    const gw = createGateway({
      routes: [makeRoute()],
    });

    const res = await gw.app.request("/test");
    const requestId = res.headers.get("x-request-id");
    // Verify it's a valid UUID v4 format
    expect(requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });

  it("should handle OPTIONS preflight when CORS policy is present and route restricts methods", async () => {
    const gw = createGateway({
      policies: [cors({ origins: "https://example.com", methods: ["GET"] })],
      routes: [
        {
          path: "/projects",
          methods: ["GET"],
          pipeline: {
            upstream: { type: "handler", handler: echoHandler },
          },
        },
      ],
    });

    // OPTIONS preflight should be handled by CORS, not 404
    const res = await gw.app.request("/projects", {
      method: "OPTIONS",
      headers: {
        origin: "https://example.com",
        "access-control-request-method": "GET",
      },
    });

    expect(res.status).not.toBe(404);
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe(
      "https://example.com"
    );
  });

  it("should handle OPTIONS preflight with route-level CORS policy", async () => {
    const gw = createGateway({
      routes: [
        {
          path: "/data",
          methods: ["POST"],
          pipeline: {
            policies: [cors({ origins: "*" })],
            upstream: { type: "handler", handler: echoHandler },
          },
        },
      ],
    });

    const res = await gw.app.request("/data", {
      method: "OPTIONS",
      headers: {
        origin: "https://example.com",
        "access-control-request-method": "POST",
      },
    });

    expect(res.status).toBe(204);
  });

  it("should not inject OPTIONS when no CORS policy is present", async () => {
    const gw = createGateway({
      routes: [
        {
          path: "/no-cors",
          methods: ["GET"],
          pipeline: {
            upstream: { type: "handler", handler: echoHandler },
          },
        },
      ],
    });

    const res = await gw.app.request("/no-cors", { method: "OPTIONS" });
    expect(res.status).toBe(404);
  });

  it("should not duplicate OPTIONS when already in route methods", async () => {
    const gw = createGateway({
      policies: [cors({ origins: "*" })],
      routes: [
        {
          path: "/explicit",
          methods: ["GET", "OPTIONS"],
          pipeline: {
            upstream: { type: "handler", handler: echoHandler },
          },
        },
      ],
    });

    const res = await gw.app.request("/explicit", {
      method: "OPTIONS",
      headers: {
        origin: "https://example.com",
        "access-control-request-method": "GET",
      },
    });

    expect(res.status).toBe(204);
    // routeCount should be 2 (GET + OPTIONS), not 3
    expect(gw.routeCount).toBe(2);
  });

  it("should preserve inbound host header when proxy preserveHost is enabled", async () => {
    const originalFetch = globalThis.fetch;
    let capturedHost: string | null = null;

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const request =
        input instanceof Request ? input : new Request(input, init);
      capturedHost = request.headers.get("host");
      return new Response("ok", { status: 200 });
    };

    try {
      const gw = createGateway({
        routes: [
          {
            path: "/proxy/*",
            methods: ["GET"],
            pipeline: {
              policies: [proxy({ preserveHost: true })],
              upstream: {
                type: "url",
                target: "https://api.example.com",
              },
            },
          },
        ],
      });

      const res = await gw.app.request("/proxy/test", {
        headers: {
          host: "incoming.example.com",
        },
      });

      expect(res.status).toBe(200);
      expect(capturedHost).toBe("incoming.example.com");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
