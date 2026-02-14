import { afterEach, describe, expect, it, vi } from "vitest";
import { createPolicyTestHarness } from "../../sdk";
import { clearOAuth2Cache, oauth2 } from "../oauth2";

interface ErrorBody {
  error: string;
  message: string;
  statusCode: number;
}

interface ForwardedBody {
  userId: string;
  scope: string;
}

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  clearOAuth2Cache();
});

function mockIntrospection(response: Record<string, unknown>, status = 200) {
  globalThis.fetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(response), {
      status,
      headers: { "content-type": "application/json" },
    })
  );
}

describe("oauth2", () => {
  // --- Local validation ---

  it("should pass with valid local validation", async () => {
    const { request } = createPolicyTestHarness(
      oauth2({
        localValidate: (token) => token === "valid-token",
      })
    );
    const res = await request("/test", {
      headers: { authorization: "Bearer valid-token" },
    });
    expect(res.status).toBe(200);
  });

  it("should reject with invalid local validation", async () => {
    const { request } = createPolicyTestHarness(
      oauth2({
        localValidate: (token) => token === "valid-token",
      })
    );
    const res = await request("/test", {
      headers: { authorization: "Bearer bad-token" },
    });
    expect(res.status).toBe(401);
    const body = (await res.json()) as ErrorBody;
    expect(body.error).toBe("unauthorized");
  });

  // --- Introspection ---

  it("should pass with active introspection response", async () => {
    mockIntrospection({ active: true, sub: "user-123" });
    const { request } = createPolicyTestHarness(
      oauth2({
        introspectionUrl: "https://auth.example.com/introspect",
        clientId: "my-client",
        clientSecret: "my-secret",
      })
    );
    const res = await request("/test", {
      headers: { authorization: "Bearer some-token" },
    });
    expect(res.status).toBe(200);
  });

  it("should reject with inactive introspection response", async () => {
    mockIntrospection({ active: false });
    const { request } = createPolicyTestHarness(
      oauth2({
        introspectionUrl: "https://auth.example.com/introspect",
        clientId: "my-client",
        clientSecret: "my-secret",
      })
    );
    const res = await request("/test", {
      headers: { authorization: "Bearer expired-token" },
    });
    expect(res.status).toBe(401);
    const body = (await res.json()) as ErrorBody;
    expect(body.error).toBe("unauthorized");
    expect(body.message).toBe("Token is not active");
  });

  it("should send correct Basic auth header to introspection endpoint", async () => {
    mockIntrospection({ active: true });
    const { request } = createPolicyTestHarness(
      oauth2({
        introspectionUrl: "https://auth.example.com/introspect",
        clientId: "my-client",
        clientSecret: "my-secret",
      })
    );
    await request("/test", {
      headers: { authorization: "Bearer some-token" },
    });

    const mockFetch = globalThis.fetch as ReturnType<typeof vi.fn>;
    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe("https://auth.example.com/introspect");
    expect(opts.method).toBe("POST");
    expect(opts.headers.authorization).toBe(
      `Basic ${btoa("my-client:my-secret")}`
    );
    expect(opts.body).toBe("token=some-token");
  });

  // --- Token extraction ---

  it("should extract token from query param", async () => {
    const { request } = createPolicyTestHarness(
      oauth2({
        tokenLocation: "query",
        localValidate: (token) => token === "query-token",
      })
    );
    const res = await request("/test?access_token=query-token");
    expect(res.status).toBe(200);
  });

  it("should return 401 when no token is present", async () => {
    const { request } = createPolicyTestHarness(
      oauth2({
        localValidate: () => true,
      })
    );
    const res = await request("/test");
    expect(res.status).toBe(401);
    const body = (await res.json()) as ErrorBody;
    expect(body.error).toBe("unauthorized");
    expect(body.message).toBe("Missing access token");
  });

  // --- Forward token info ---

  it("should forward introspection fields as headers", async () => {
    mockIntrospection({ active: true, sub: "user-456", scope: "read write" });
    const { request } = createPolicyTestHarness(
      oauth2({
        introspectionUrl: "https://auth.example.com/introspect",
        clientId: "c",
        clientSecret: "s",
        forwardTokenInfo: {
          sub: "X-User-Id",
          scope: "X-User-Scope",
        },
      }),
      {
        upstream: async (c) => {
          return c.json({
            userId: c.req.header("X-User-Id"),
            scope: c.req.header("X-User-Scope"),
          });
        },
      }
    );
    const res = await request("/test", {
      headers: { authorization: "Bearer tok" },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as ForwardedBody;
    expect(body.userId).toBe("user-456");
    expect(body.scope).toBe("read write");
  });

  // --- Required scopes ---

  it("should pass when token has all required scopes", async () => {
    mockIntrospection({ active: true, scope: "read write admin" });
    const { request } = createPolicyTestHarness(
      oauth2({
        introspectionUrl: "https://auth.example.com/introspect",
        clientId: "c",
        clientSecret: "s",
        requiredScopes: ["read", "write"],
      })
    );
    const res = await request("/test", {
      headers: { authorization: "Bearer tok" },
    });
    expect(res.status).toBe(200);
  });

  it("should return 403 when token is missing required scopes", async () => {
    mockIntrospection({ active: true, scope: "read" });
    const { request } = createPolicyTestHarness(
      oauth2({
        introspectionUrl: "https://auth.example.com/introspect",
        clientId: "c",
        clientSecret: "s",
        requiredScopes: ["read", "write"],
      })
    );
    const res = await request("/test", {
      headers: { authorization: "Bearer tok" },
    });
    expect(res.status).toBe(403);
    const body = (await res.json()) as ErrorBody;
    expect(body.error).toBe("forbidden");
    expect(body.message).toBe("Insufficient scope");
  });

  // --- Caching ---

  it("should cache introspection results and not call fetch twice", async () => {
    mockIntrospection({ active: true, sub: "cached-user" });
    const { request } = createPolicyTestHarness(
      oauth2({
        introspectionUrl: "https://auth.example.com/introspect",
        clientId: "c",
        clientSecret: "s",
        cacheTtlSeconds: 60,
      })
    );

    // First request - calls fetch
    const res1 = await request("/test", {
      headers: { authorization: "Bearer cached-token" },
    });
    expect(res1.status).toBe(200);

    // Second request - should use cache
    const res2 = await request("/test", {
      headers: { authorization: "Bearer cached-token" },
    });
    expect(res2.status).toBe(200);

    const mockFetch = globalThis.fetch as ReturnType<typeof vi.fn>;
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  // --- Custom header ---

  it("should support custom header name and prefix", async () => {
    const { request } = createPolicyTestHarness(
      oauth2({
        headerName: "x-api-token",
        headerPrefix: "Token",
        localValidate: (token) => token === "custom-tok",
      })
    );
    const res = await request("/test", {
      headers: { "x-api-token": "Token custom-tok" },
    });
    expect(res.status).toBe(200);
  });

  // --- No validator configured ---

  it("should throw config error at construction when neither localValidate nor introspectionUrl is configured", () => {
    expect(() => oauth2({})).toThrow(
      "oauth2 requires either introspectionUrl or localValidate"
    );
  });

  // --- Skip logic ---

  it("should skip when skip function returns true", async () => {
    const { request } = createPolicyTestHarness(
      oauth2({
        localValidate: () => false, // Would reject
        skip: () => true,
      })
    );
    // No token - would normally 401, but skip bypasses
    const res = await request("/test");
    expect(res.status).toBe(200);
  });

  // --- Async local validation ---

  it("should support async local validation", async () => {
    const { request } = createPolicyTestHarness(
      oauth2({
        localValidate: async (token) => {
          await new Promise((r) => setTimeout(r, 1));
          return token === "async-valid";
        },
      })
    );
    const res = await request("/test", {
      headers: { authorization: "Bearer async-valid" },
    });
    expect(res.status).toBe(200);
  });

  // --- Security: Unbounded Cache Vulnerability ---

  it("SECURITY: should limit cache size to prevent memory exhaustion", async () => {
    /**
     * This test demonstrates the unbounded cache vulnerability in oauth2.
     *
     * The introspectionCache is a Map with no size limit. An attacker can
     * exhaust server memory by making requests with many unique tokens.
     *
     * EXPECTED: The cache should have a maximum size with LRU eviction.
     * CURRENT BEHAVIOR: Unbounded Map allows memory exhaustion.
     */

    // Create a fresh instance with a small cache to test the limit behavior
    // We need to verify that caching is bounded
    let fetchCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      fetchCount++;
      return Promise.resolve(
        new Response(JSON.stringify({ active: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      );
    });

    const { request: request2 } = createPolicyTestHarness(
      oauth2({
        introspectionUrl: "https://auth.example.com/introspect",
        cacheTtlSeconds: 3600, // Long TTL to make the issue worse
      })
    );

    // Make many requests with unique tokens (exceeds default max of 100)
    // A properly bounded cache should eventually evict old entries
    const numTokens = 150;
    for (let i = 0; i < numTokens; i++) {
      await request2("/test", {
        headers: { authorization: `Bearer token-${i}` },
      });
    }

    // Now repeat some of the first tokens - they should be cache misses
    // if the cache has a size limit and evicted them
    const initialFetchCount = fetchCount;
    for (let i = 0; i < 10; i++) {
      await request2("/test", {
        headers: { authorization: `Bearer token-${i}` },
      });
    }

    // SECURITY ISSUE:
    // With unbounded cache: fetchCount === initialFetchCount (all repeats are cached)
    // With bounded cache (max 100): fetchCount > initialFetchCount (evicted)
    //
    // This test expects bounded behavior - if cache is unbounded, it will fail
    // because the initial tokens are still cached
    expect(fetchCount).toBeGreaterThan(initialFetchCount);
  });
});
