import { afterEach, describe, expect, it } from "vitest";
import { createGateway } from "../core/gateway";
import type { HttpMethod } from "../core/types";
import { jwtAuth } from "../policies/auth/jwt-auth";
import { mock } from "../policies/mock";
import {
  InMemoryRateLimitStore,
  rateLimit,
} from "../policies/traffic/rate-limit";
import type { Policy } from "../policies/types";

// ---------------------------------------------------------------------------
// JWT helpers
// ---------------------------------------------------------------------------

function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function createTestJwt(
  payload: Record<string, unknown>,
  secret: string
): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  const encodedSignature = base64UrlEncode(
    String.fromCharCode(...new Uint8Array(signature))
  );
  return `${data}.${encodedSignature}`;
}

// ---------------------------------------------------------------------------
// Shared constants
// ---------------------------------------------------------------------------

const JWT_SECRET = "integration-test-secret";

const activeStores: InMemoryRateLimitStore[] = [];

afterEach(() => {
  for (const store of activeStores) {
    store.destroy();
  }
  activeStores.length = 0;
});

function createStore() {
  const store = new InMemoryRateLimitStore();
  activeStores.push(store);
  return store;
}

/**
 * Hono doesn't expose .head() - use only methods Hono supports as direct
 * method calls to avoid "app[m] is not a function" when the gateway
 * registers routes with its default full method list.
 */
const SAFE_METHODS: HttpMethod[] = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
];

function handlerUpstream(body: unknown, status = 200) {
  return {
    type: "handler" as const,
    handler: () =>
      new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      }),
  };
}

// ---------------------------------------------------------------------------
// Full lifecycle tests
// ---------------------------------------------------------------------------

describe("Gateway integration - full lifecycle", () => {
  it("should route requests to correct handler based on path", async () => {
    const gw = createGateway({
      routes: [
        {
          path: "/alpha",
          methods: SAFE_METHODS,
          pipeline: {
            upstream: handlerUpstream({ route: "alpha" }),
          },
        },
        {
          path: "/beta",
          methods: SAFE_METHODS,
          pipeline: {
            upstream: handlerUpstream({ route: "beta" }),
          },
        },
      ],
    });

    const resA = await gw.app.request("/alpha");
    expect(resA.status).toBe(200);
    expect(await resA.json()).toEqual({ route: "alpha" });

    const resB = await gw.app.request("/beta");
    expect(resB.status).toBe(200);
    expect(await resB.json()).toEqual({ route: "beta" });
  });

  it("should route requests based on HTTP method", async () => {
    const gw = createGateway({
      routes: [
        {
          path: "/resource",
          methods: ["GET"],
          pipeline: { upstream: handlerUpstream({ method: "get" }) },
        },
        {
          path: "/resource",
          methods: ["POST"],
          pipeline: { upstream: handlerUpstream({ method: "post" }) },
        },
      ],
    });

    const getRes = await gw.app.request("/resource", { method: "GET" });
    expect(getRes.status).toBe(200);
    expect(await getRes.json()).toEqual({ method: "get" });

    const postRes = await gw.app.request("/resource", { method: "POST" });
    expect(postRes.status).toBe(200);
    expect(await postRes.json()).toEqual({ method: "post" });
  });

  it("should return structured JSON 404 for unmatched routes", async () => {
    const gw = createGateway({
      name: "test-gw",
      routes: [
        {
          path: "/exists",
          methods: SAFE_METHODS,
          pipeline: { upstream: handlerUpstream({ ok: true }) },
        },
      ],
    });

    const res = await gw.app.request("/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toMatch(/application\/json/);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toMatchObject({
      error: "not_found",
      statusCode: 404,
      gateway: "test-gw",
    });
    expect(body.message).toContain("/does-not-exist");
  });

  it("should apply basePath to all routes", async () => {
    const gw = createGateway({
      basePath: "/api/v1",
      routes: [
        {
          path: "/users",
          methods: SAFE_METHODS,
          pipeline: { upstream: handlerUpstream({ users: true }) },
        },
      ],
    });

    const res = await gw.app.request("/api/v1/users");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ users: true });

    // Without basePath should 404
    const res2 = await gw.app.request("/users");
    expect(res2.status).toBe(404);
  });

  it("should set x-request-id response header on every request", async () => {
    const gw = createGateway({
      routes: [
        {
          path: "/ping",
          methods: SAFE_METHODS,
          pipeline: { upstream: handlerUpstream({ pong: true }) },
        },
      ],
    });

    const res = await gw.app.request("/ping");
    expect(res.status).toBe(200);
    const requestId = res.headers.get("x-request-id");
    expect(requestId).toBeTruthy();
    // UUID v4 format
    expect(requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });
});

// ---------------------------------------------------------------------------
// Policy chain execution order
// ---------------------------------------------------------------------------

describe("Gateway integration - policy chain execution order", () => {
  it("should execute global policies before route policies", async () => {
    const executionOrder: string[] = [];

    const globalPolicy: Policy = {
      name: "global-tracker",
      priority: 50,
      handler: async (_c, next) => {
        executionOrder.push("global");
        await next();
      },
    };

    const routePolicy: Policy = {
      name: "route-tracker",
      priority: 60,
      handler: async (_c, next) => {
        executionOrder.push("route");
        await next();
      },
    };

    const gw = createGateway({
      policies: [globalPolicy],
      routes: [
        {
          path: "/test",
          methods: ["GET"],
          pipeline: {
            policies: [routePolicy],
            upstream: handlerUpstream({ ok: true }),
          },
        },
      ],
    });

    await gw.app.request("/test");
    expect(executionOrder).toEqual(["global", "route"]);
  });

  it("should execute policies in priority order (lower first)", async () => {
    const executionOrder: string[] = [];

    const policyA: Policy = {
      name: "policy-a",
      priority: 30,
      handler: async (_c, next) => {
        executionOrder.push("a-30");
        await next();
      },
    };

    const policyB: Policy = {
      name: "policy-b",
      priority: 10,
      handler: async (_c, next) => {
        executionOrder.push("b-10");
        await next();
      },
    };

    const policyC: Policy = {
      name: "policy-c",
      priority: 20,
      handler: async (_c, next) => {
        executionOrder.push("c-20");
        await next();
      },
    };

    const gw = createGateway({
      routes: [
        {
          path: "/test",
          methods: ["GET"],
          pipeline: {
            policies: [policyA, policyB, policyC],
            upstream: handlerUpstream({ ok: true }),
          },
        },
      ],
    });

    await gw.app.request("/test");
    expect(executionOrder).toEqual(["b-10", "c-20", "a-30"]);
  });

  it("should allow route policy to override global policy with same name", async () => {
    const executionOrder: string[] = [];

    const globalPolicy: Policy = {
      name: "shared-policy",
      priority: 50,
      handler: async (_c, next) => {
        executionOrder.push("global-version");
        await next();
      },
    };

    const routeOverride: Policy = {
      name: "shared-policy",
      priority: 50,
      handler: async (_c, next) => {
        executionOrder.push("route-version");
        await next();
      },
    };

    const gw = createGateway({
      policies: [globalPolicy],
      routes: [
        {
          path: "/test",
          methods: ["GET"],
          pipeline: {
            policies: [routeOverride],
            upstream: handlerUpstream({ ok: true }),
          },
        },
      ],
    });

    await gw.app.request("/test");
    // Only the route version should have executed, not both
    expect(executionOrder).toEqual(["route-version"]);
  });

  it("should execute request-log (priority 0) before jwt-auth (priority 10) before rate-limit (priority 20)", async () => {
    const executionOrder: string[] = [];
    createStore();

    const trackingLog: Policy = {
      name: "request-log",
      priority: 0,
      handler: async (_c, next) => {
        executionOrder.push("request-log");
        await next();
      },
    };

    const trackingAuth: Policy = {
      name: "jwt-auth",
      priority: 10,
      handler: async (_c, next) => {
        executionOrder.push("jwt-auth");
        await next();
      },
    };

    const trackingRate: Policy = {
      name: "rate-limit",
      priority: 20,
      handler: async (_c, next) => {
        executionOrder.push("rate-limit");
        await next();
      },
    };

    const gw = createGateway({
      routes: [
        {
          path: "/test",
          methods: ["GET"],
          pipeline: {
            policies: [trackingRate, trackingAuth, trackingLog],
            upstream: handlerUpstream({ ok: true }),
          },
        },
      ],
    });

    await gw.app.request("/test");
    expect(executionOrder).toEqual(["request-log", "jwt-auth", "rate-limit"]);
  });
});

// ---------------------------------------------------------------------------
// Auth + rate limit combined
// ---------------------------------------------------------------------------

describe("Gateway integration - auth + rate limit combined", () => {
  it("should reject unauthenticated requests before rate limiting", async () => {
    const store = createStore();
    const gw = createGateway({
      routes: [
        {
          path: "/protected",
          methods: ["GET"],
          pipeline: {
            policies: [
              jwtAuth({ secret: JWT_SECRET }),
              rateLimit({ max: 100, store }),
            ],
            upstream: handlerUpstream({ ok: true }),
          },
        },
      ],
    });

    const res = await gw.app.request("/protected");
    expect(res.status).toBe(401);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("unauthorized");
    // Rate limit headers should NOT be present since auth failed first (priority 10 < 20)
    expect(res.headers.get("x-ratelimit-limit")).toBeNull();
  });

  it("should rate limit authenticated requests", async () => {
    const store = createStore();
    const token = await createTestJwt(
      { sub: "user-1", exp: Math.floor(Date.now() / 1000) + 3600 },
      JWT_SECRET
    );

    const gw = createGateway({
      routes: [
        {
          path: "/protected",
          methods: ["GET"],
          pipeline: {
            policies: [
              jwtAuth({ secret: JWT_SECRET }),
              rateLimit({ max: 2, store, keyBy: () => "fixed-key" }),
            ],
            upstream: handlerUpstream({ ok: true }),
          },
        },
      ],
    });

    // Requests 1 and 2 should succeed
    const res1 = await gw.app.request("/protected", {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res1.status).toBe(200);

    const res2 = await gw.app.request("/protected", {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res2.status).toBe(200);

    // Request 3 should be rate limited
    const res3 = await gw.app.request("/protected", {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res3.status).toBe(429);
    const body = (await res3.json()) as Record<string, unknown>;
    expect(body.error).toBe("rate_limited");
  });

  it("should allow authenticated requests under rate limit", async () => {
    const store = createStore();
    const token = await createTestJwt(
      { sub: "user-1", exp: Math.floor(Date.now() / 1000) + 3600 },
      JWT_SECRET
    );

    const gw = createGateway({
      routes: [
        {
          path: "/protected",
          methods: ["GET"],
          pipeline: {
            policies: [
              jwtAuth({ secret: JWT_SECRET }),
              rateLimit({ max: 10, store, keyBy: () => "fixed-key" }),
            ],
            upstream: {
              type: "handler",
              handler: (c) => c.json({ data: "secret-stuff" }),
            },
          },
        },
      ],
    });

    const res = await gw.app.request("/protected", {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: "secret-stuff" });
    // Rate limit headers propagate when using c.json() (Hono-native response)
    expect(res.headers.get("x-ratelimit-remaining")).toBe("9");
  });
});

// ---------------------------------------------------------------------------
// Multi-route gateway
// ---------------------------------------------------------------------------

describe("Gateway integration - multi-route gateway", () => {
  it("should apply different policies to different routes (public vs protected)", async () => {
    const token = await createTestJwt(
      { sub: "user-1", exp: Math.floor(Date.now() / 1000) + 3600 },
      JWT_SECRET
    );

    const gw = createGateway({
      routes: [
        {
          path: "/public",
          methods: ["GET"],
          pipeline: {
            upstream: handlerUpstream({ public: true }),
          },
        },
        {
          path: "/protected",
          methods: ["GET"],
          pipeline: {
            policies: [jwtAuth({ secret: JWT_SECRET })],
            upstream: handlerUpstream({ protected: true }),
          },
        },
      ],
    });

    // Public route should work without auth
    const publicRes = await gw.app.request("/public");
    expect(publicRes.status).toBe(200);
    expect(await publicRes.json()).toEqual({ public: true });

    // Protected route should reject without auth
    const noAuthRes = await gw.app.request("/protected");
    expect(noAuthRes.status).toBe(401);

    // Protected route should work with auth
    const authRes = await gw.app.request("/protected", {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(authRes.status).toBe(200);
    expect(await authRes.json()).toEqual({ protected: true });
  });

  it("should share global rate limit across routes", async () => {
    const store = createStore();
    const gw = createGateway({
      policies: [rateLimit({ max: 2, store, keyBy: () => "shared-key" })],
      routes: [
        {
          path: "/route-a",
          methods: ["GET"],
          pipeline: { upstream: handlerUpstream({ a: true }) },
        },
        {
          path: "/route-b",
          methods: ["GET"],
          pipeline: { upstream: handlerUpstream({ b: true }) },
        },
      ],
    });

    const r1 = await gw.app.request("/route-a");
    expect(r1.status).toBe(200);

    const r2 = await gw.app.request("/route-b");
    expect(r2.status).toBe(200);

    // Third request to either route should be rate limited
    const r3 = await gw.app.request("/route-a");
    expect(r3.status).toBe(429);
  });

  it("should isolate route-specific policies", async () => {
    const storeA = createStore();
    const storeB = createStore();

    const gw = createGateway({
      routes: [
        {
          path: "/route-a",
          methods: ["GET"],
          pipeline: {
            policies: [
              rateLimit({ max: 1, store: storeA, keyBy: () => "a-key" }),
            ],
            upstream: handlerUpstream({ a: true }),
          },
        },
        {
          path: "/route-b",
          methods: ["GET"],
          pipeline: {
            policies: [
              rateLimit({ max: 1, store: storeB, keyBy: () => "b-key" }),
            ],
            upstream: handlerUpstream({ b: true }),
          },
        },
      ],
    });

    // Both routes should succeed on first request
    const r1a = await gw.app.request("/route-a");
    expect(r1a.status).toBe(200);

    const r1b = await gw.app.request("/route-b");
    expect(r1b.status).toBe(200);

    // Both are now rate limited (different stores, but each used its 1 request)
    const r2a = await gw.app.request("/route-a");
    expect(r2a.status).toBe(429);

    const r2b = await gw.app.request("/route-b");
    expect(r2b.status).toBe(429);
  });
});

// ---------------------------------------------------------------------------
// Error handling end-to-end
// ---------------------------------------------------------------------------

describe("Gateway integration - error handling end-to-end", () => {
  it("should return structured JSON error for auth failure", async () => {
    const gw = createGateway({
      routes: [
        {
          path: "/secure",
          methods: ["GET"],
          pipeline: {
            policies: [jwtAuth({ secret: JWT_SECRET })],
            upstream: handlerUpstream({ ok: true }),
          },
        },
      ],
    });

    const res = await gw.app.request("/secure");
    expect(res.status).toBe(401);
    expect(res.headers.get("content-type")).toBe("application/json");
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toMatchObject({
      error: "unauthorized",
      message: "Missing authentication token",
      statusCode: 401,
    });
    expect(body.requestId).toBeTruthy();
  });

  it("should return structured JSON error for rate limit exceeded", async () => {
    const store = createStore();
    const gw = createGateway({
      routes: [
        {
          path: "/limited",
          methods: ["GET"],
          pipeline: {
            policies: [rateLimit({ max: 0, store, keyBy: () => "k" })],
            upstream: handlerUpstream({ ok: true }),
          },
        },
      ],
    });

    const res = await gw.app.request("/limited");
    expect(res.status).toBe(429);
    expect(res.headers.get("content-type")).toBe("application/json");
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toMatchObject({
      error: "rate_limited",
      message: "Rate limit exceeded",
      statusCode: 429,
    });
    expect(body.requestId).toBeTruthy();
  });

  it("should return 500 with generic message for unexpected handler errors", async () => {
    const gw = createGateway({
      routes: [
        {
          path: "/boom",
          methods: ["GET"],
          pipeline: {
            upstream: {
              type: "handler",
              handler: () => {
                throw new Error("Unexpected internal failure");
              },
            },
          },
        },
      ],
    });

    const res = await gw.app.request("/boom");
    expect(res.status).toBe(500);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toMatchObject({
      error: "internal_error",
      message: "An unexpected error occurred",
      statusCode: 500,
    });
  });

  it("should use custom onError handler when configured", async () => {
    const gw = createGateway({
      onError: (err, _c) => {
        return new Response(
          JSON.stringify({ custom: true, msg: err.message }),
          { status: 503, headers: { "content-type": "application/json" } }
        );
      },
      routes: [
        {
          path: "/fail",
          methods: ["GET"],
          pipeline: {
            upstream: {
              type: "handler",
              handler: () => {
                throw new Error("custom error scenario");
              },
            },
          },
        },
      ],
    });

    const res = await gw.app.request("/fail");
    expect(res.status).toBe(503);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.custom).toBe(true);
    expect(body.msg).toBe("custom error scenario");
  });

  it("should include requestId in all error responses", async () => {
    const gw = createGateway({
      routes: [
        {
          path: "/auth-err",
          methods: ["GET"],
          pipeline: {
            policies: [jwtAuth({ secret: JWT_SECRET })],
            upstream: handlerUpstream({ ok: true }),
          },
        },
        {
          path: "/handler-err",
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
    });

    const authRes = await gw.app.request("/auth-err");
    const authBody = (await authRes.json()) as Record<string, unknown>;
    expect(authBody.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );

    const handlerRes = await gw.app.request("/handler-err");
    const handlerBody = (await handlerRes.json()) as Record<string, unknown>;
    expect(handlerBody.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });
});

// ---------------------------------------------------------------------------
// Mock upstream
// ---------------------------------------------------------------------------

describe("Gateway integration - mock upstream", () => {
  it("should return mock response when mock policy is used", async () => {
    // Use mock as the sole handler via a handler upstream that delegates to
    // mock's handler directly, since mock returns a Response without calling
    // next() and the pipeline wrapper needs to return it.
    const mockPolicy = mock({ status: 201, body: "created" });
    const gw = createGateway({
      routes: [
        {
          path: "/mock",
          methods: ["GET"],
          pipeline: {
            upstream: {
              type: "handler",
              handler: (c) =>
                mockPolicy.handler(c, async () => {}) as Promise<Response>,
            },
          },
        },
      ],
    });

    const res = await gw.app.request("/mock");
    expect(res.status).toBe(201);
    expect(await res.text()).toBe("created");
  });

  it("should support mock with JSON body", async () => {
    const mockPolicy = mock({ body: { items: [1, 2, 3], total: 3 } });
    const gw = createGateway({
      routes: [
        {
          path: "/mock-json",
          methods: ["GET"],
          pipeline: {
            upstream: {
              type: "handler",
              handler: (c) =>
                mockPolicy.handler(c, async () => {}) as Promise<Response>,
            },
          },
        },
      ],
    });

    const res = await gw.app.request("/mock-json");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/json");
    expect(await res.json()).toEqual({ items: [1, 2, 3], total: 3 });
  });
});

// ---------------------------------------------------------------------------
// Handler upstream
// ---------------------------------------------------------------------------

describe("Gateway integration - handler upstream", () => {
  it("should pass Hono context to handler upstream", async () => {
    const gw = createGateway({
      routes: [
        {
          path: "/echo/:name",
          methods: SAFE_METHODS,
          pipeline: {
            upstream: {
              type: "handler",
              handler: (c) => {
                const name = c.req.param("name");
                return new Response(JSON.stringify({ name }), {
                  headers: { "content-type": "application/json" },
                });
              },
            },
          },
        },
      ],
    });

    const res = await gw.app.request("/echo/world");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ name: "world" });
  });

  it("should allow handler upstream to read request headers and body", async () => {
    const gw = createGateway({
      routes: [
        {
          path: "/echo-headers",
          methods: ["POST"],
          pipeline: {
            upstream: {
              type: "handler",
              handler: async (c) => {
                const customHeader = c.req.header("x-custom");
                const body = await c.req.text();
                return new Response(
                  JSON.stringify({
                    customHeader,
                    body,
                  }),
                  { headers: { "content-type": "application/json" } }
                );
              },
            },
          },
        },
      ],
    });

    const res = await gw.app.request("/echo-headers", {
      method: "POST",
      headers: { "x-custom": "hello-world", "content-type": "text/plain" },
      body: "request-body-content",
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as Record<string, unknown>;
    expect(data.customHeader).toBe("hello-world");
    expect(data.body).toBe("request-body-content");
  });
});
