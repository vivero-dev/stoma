import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { GatewayError } from "../../../core/errors";
import { apiKeyAuth } from "../api-key-auth";

const VALID_KEY = "sk_test_valid_api_key_12345";
const INVALID_KEY = "sk_test_invalid_key";

function makeApp(config: Parameters<typeof apiKeyAuth>[0]): Hono {
  const app = new Hono();
  const policy = apiKeyAuth(config);

  app.use("/*", policy.handler);
  app.get("/test", (c) => c.json({ ok: true }));
  app.onError((err, c) => {
    if (err instanceof GatewayError) {
      return c.json(
        { error: err.code, message: err.message },
        err.statusCode as 401
      );
    }
    throw err;
  });
  return app;
}

describe("apiKeyAuth", () => {
  // --- Valid scenarios ---

  it("should allow request with valid API key in header", async () => {
    const app = makeApp({ validate: (key) => key === VALID_KEY });
    const res = await app.request("/test", {
      headers: { "x-api-key": VALID_KEY },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("should allow request with valid API key in query parameter", async () => {
    const app = makeApp({
      queryParam: "api_key",
      validate: (key) => key === VALID_KEY,
    });
    const res = await app.request(`/test?api_key=${VALID_KEY}`);
    expect(res.status).toBe(200);
  });

  it("should use custom header name when configured", async () => {
    const app = makeApp({
      headerName: "x-custom-auth",
      validate: (key) => key === VALID_KEY,
    });
    const res = await app.request("/test", {
      headers: { "x-custom-auth": VALID_KEY },
    });
    expect(res.status).toBe(200);
  });

  it("should support async validator", async () => {
    const app = makeApp({
      validate: async (key) => {
        await new Promise((r) => setTimeout(r, 1));
        return key === VALID_KEY;
      },
    });
    const res = await app.request("/test", {
      headers: { "x-api-key": VALID_KEY },
    });
    expect(res.status).toBe(200);
  });

  // --- Boundary conditions ---

  it("should use default header name 'x-api-key' when not configured", async () => {
    const app = makeApp({ validate: (key) => key === VALID_KEY });
    // Key in default header should work
    const res = await app.request("/test", {
      headers: { "x-api-key": VALID_KEY },
    });
    expect(res.status).toBe(200);

    // Key in non-default header should fail
    const res2 = await app.request("/test", {
      headers: { authorization: VALID_KEY },
    });
    expect(res2.status).toBe(401);
  });

  // --- Error handling ---

  it("should reject request with no API key (401)", async () => {
    const app = makeApp({ validate: (key) => key === VALID_KEY });
    const res = await app.request("/test");
    expect(res.status).toBe(401);
  });

  it("should reject request with invalid API key (403)", async () => {
    const app = makeApp({ validate: (key) => key === VALID_KEY });
    const res = await app.request("/test", {
      headers: { "x-api-key": INVALID_KEY },
    });
    expect(res.status).toBe(403);
  });

  it("should reject when key in header fails validation", async () => {
    const app = makeApp({
      validate: () => false,
    });
    const res = await app.request("/test", {
      headers: { "x-api-key": "any-key" },
    });
    expect(res.status).toBe(403);
  });

  // --- Edge cases ---

  it("should prefer header over query parameter when both present", async () => {
    let receivedKey = "";
    const app = makeApp({
      queryParam: "api_key",
      validate: (key) => {
        receivedKey = key;
        return key === "header-key";
      },
    });
    const res = await app.request("/test?api_key=query-key", {
      headers: { "x-api-key": "header-key" },
    });
    expect(res.status).toBe(200);
    expect(receivedKey).toBe("header-key");
  });

  it("should handle empty string API key", async () => {
    const app = makeApp({
      validate: () => true,
    });
    // Empty header value - Hono treats empty string header as missing
    const res = await app.request("/test", {
      headers: { "x-api-key": "" },
    });
    // Empty string header is treated as no key present
    expect(res.status).toBe(401);
  });

  // --- Security-specific tests ---

  describe("timing attack resistance", () => {
    it("should delegate validation timing to the provided validate function", async () => {
      // The apiKeyAuth policy calls the user-provided validate function.
      // Timing safety is the responsibility of the validate implementation.
      // This test verifies that the policy does not short-circuit before calling validate.
      let validateCalled = false;
      const app = makeApp({
        validate: (key) => {
          validateCalled = true;
          return key === VALID_KEY;
        },
      });
      await app.request("/test", {
        headers: { "x-api-key": INVALID_KEY },
      });
      expect(validateCalled).toBe(true);
    });
  });

  describe("key extraction edge cases", () => {
    it("should not use query param when queryParam config is not set", async () => {
      const app = makeApp({
        // queryParam is NOT configured
        validate: (key) => key === VALID_KEY,
      });
      const res = await app.request(`/test?api_key=${VALID_KEY}`);
      expect(res.status).toBe(401);
    });

    it("should fallback to query param only when header is missing", async () => {
      let receivedKey = "";
      const app = makeApp({
        queryParam: "key",
        validate: (key) => {
          receivedKey = key;
          return true;
        },
      });
      // Only query param
      const res = await app.request("/test?key=from-query");
      expect(res.status).toBe(200);
      expect(receivedKey).toBe("from-query");
    });

    it("should reject when both header and query are empty", async () => {
      const app = makeApp({
        queryParam: "api_key",
        validate: () => true,
      });
      const res = await app.request("/test");
      expect(res.status).toBe(401);
    });
  });

  describe("forwardKeyIdentity", () => {
    it("should set identity header after successful validation", async () => {
      let forwardedIdentity: string | null = null;
      const app = new Hono();
      const policy = apiKeyAuth({
        validate: (key) => key === VALID_KEY,
        forwardKeyIdentity: {
          headerName: "x-api-client",
          identityFn: () => "test-client",
        },
      });
      app.use("/*", policy.handler);
      app.get("/test", (c) => {
        forwardedIdentity = c.req.header("x-api-client") ?? null;
        return c.json({ ok: true });
      });

      const res = await app.request("/test", {
        headers: { "x-api-key": VALID_KEY },
      });
      expect(res.status).toBe(200);
      expect(forwardedIdentity).toBe("test-client");
    });

    it("should support async identityFn", async () => {
      let forwardedIdentity: string | null = null;
      const app = new Hono();
      const policy = apiKeyAuth({
        validate: (key) => key === VALID_KEY,
        forwardKeyIdentity: {
          headerName: "x-client-id",
          identityFn: async (key) => {
            await new Promise((r) => setTimeout(r, 1));
            return `client-for-${key.slice(0, 7)}`;
          },
        },
      });
      app.use("/*", policy.handler);
      app.get("/test", (c) => {
        forwardedIdentity = c.req.header("x-client-id") ?? null;
        return c.json({ ok: true });
      });

      const res = await app.request("/test", {
        headers: { "x-api-key": VALID_KEY },
      });
      expect(res.status).toBe(200);
      expect(forwardedIdentity).toBe("client-for-sk_test");
    });

    it("should sanitize identity value (strip CR/LF/NUL)", async () => {
      let forwardedIdentity: string | null = null;
      const app = new Hono();
      const policy = apiKeyAuth({
        validate: () => true,
        forwardKeyIdentity: {
          headerName: "x-identity",
          identityFn: () => "client\r\n\0injected",
        },
      });
      app.use("/*", policy.handler);
      app.get("/test", (c) => {
        forwardedIdentity = c.req.header("x-identity") ?? null;
        return c.json({ ok: true });
      });

      const res = await app.request("/test", {
        headers: { "x-api-key": "any-key" },
      });
      expect(res.status).toBe(200);
      expect(forwardedIdentity).toBe("clientinjected");
    });

    it("should not forward identity when validation fails", async () => {
      let identityFnCalled = false;
      const app = makeApp({
        validate: () => false,
        forwardKeyIdentity: {
          headerName: "x-identity",
          identityFn: () => {
            identityFnCalled = true;
            return "should-not-run";
          },
        },
      });

      const res = await app.request("/test", {
        headers: { "x-api-key": "bad-key" },
      });
      expect(res.status).toBe(403);
      expect(identityFnCalled).toBe(false);
    });
  });
});
