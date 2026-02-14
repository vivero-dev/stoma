import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { GatewayError } from "../../../core/errors";
import type { JwtAuthConfig } from "../jwt-auth";
import { jwtAuth } from "../jwt-auth";

const TEST_SECRET = "super-secret-test-key-that-is-long-enough";

function withErrorHandler(app: Hono): Hono {
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

function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function createTestJwt(
  payload: Record<string, unknown>,
  secret: string,
  alg: "HS256" | "HS384" | "HS512" = "HS256"
): Promise<string> {
  const header = { alg, typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const encoder = new TextEncoder();
  const hashAlg =
    alg === "HS256" ? "SHA-256" : alg === "HS384" ? "SHA-384" : "SHA-512";
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: hashAlg },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  const encodedSignature = base64UrlEncode(
    String.fromCharCode(...new Uint8Array(signature))
  );

  return `${data}.${encodedSignature}`;
}

function makeApp(config: JwtAuthConfig): Hono {
  const app = new Hono();
  const policy = jwtAuth(config);

  app.use("/*", policy.handler);
  app.get("/test", (c) => c.json({ ok: true }));
  return withErrorHandler(app);
}

describe("jwtAuth", () => {
  // --- Valid scenarios ---

  it("should allow request with valid HMAC-signed JWT (HS256)", async () => {
    const app = makeApp({ secret: TEST_SECRET });
    const token = await createTestJwt(
      { sub: "user-1", exp: Math.floor(Date.now() / 1000) + 3600 },
      TEST_SECRET
    );
    const res = await app.request("/test", {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("should allow request with valid HS384 JWT", async () => {
    const app = makeApp({ secret: TEST_SECRET });
    const token = await createTestJwt(
      { sub: "user-2", exp: Math.floor(Date.now() / 1000) + 3600 },
      TEST_SECRET,
      "HS384"
    );
    const res = await app.request("/test", {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
  });

  it("should allow request with valid HS512 JWT", async () => {
    const app = makeApp({ secret: TEST_SECRET });
    const token = await createTestJwt(
      { sub: "user-3", exp: Math.floor(Date.now() / 1000) + 3600 },
      TEST_SECRET,
      "HS512"
    );
    const res = await app.request("/test", {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
  });

  it("should forward claims as headers when forwardClaims configured", async () => {
    const app = new Hono();
    const policy = jwtAuth({
      secret: TEST_SECRET,
      forwardClaims: { sub: "x-user-id", role: "x-user-role" },
    });

    app.use("/*", policy.handler);
    app.get("/test", (c) => {
      return c.json({
        userId: c.req.header("x-user-id"),
        role: c.req.header("x-user-role"),
      });
    });
    withErrorHandler(app);

    const token = await createTestJwt(
      {
        sub: "user-42",
        role: "admin",
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      TEST_SECRET
    );
    const res = await app.request("/test", {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.userId).toBe("user-42");
    expect(body.role).toBe("admin");
  });

  it("should read token from custom header name", async () => {
    const app = makeApp({ secret: TEST_SECRET, headerName: "x-jwt-token" });
    const token = await createTestJwt(
      { sub: "user-1", exp: Math.floor(Date.now() / 1000) + 3600 },
      TEST_SECRET
    );
    const res = await app.request("/test", {
      headers: { "x-jwt-token": `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
  });

  // --- Boundary conditions ---

  it("should handle JWT with no expiry claim", async () => {
    const app = makeApp({ secret: TEST_SECRET });
    const token = await createTestJwt({ sub: "no-exp" }, TEST_SECRET);
    const res = await app.request("/test", {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
  });

  it("should handle token with empty forwardClaims config", async () => {
    const app = makeApp({ secret: TEST_SECRET, forwardClaims: {} });
    const token = await createTestJwt(
      { sub: "user-1", exp: Math.floor(Date.now() / 1000) + 3600 },
      TEST_SECRET
    );
    const res = await app.request("/test", {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
  });

  it("should handle JWT payload with null claim values in forwardClaims", async () => {
    const app = new Hono();
    const policy = jwtAuth({
      secret: TEST_SECRET,
      forwardClaims: { sub: "x-user-id", missing: "x-missing" },
    });

    app.use("/*", policy.handler);
    app.get("/test", (c) => {
      return c.json({
        userId: c.req.header("x-user-id") ?? null,
        missing: c.req.header("x-missing") ?? null,
      });
    });
    withErrorHandler(app);

    const token = await createTestJwt(
      {
        sub: "user-1",
        missing: null,
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      TEST_SECRET
    );
    const res = await app.request("/test", {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.userId).toBe("user-1");
    expect(body.missing).toBeNull();
  });

  // --- Error handling ---

  it("should reject request with no Authorization header (401)", async () => {
    const app = makeApp({ secret: TEST_SECRET });
    const res = await app.request("/test");
    expect(res.status).toBe(401);
  });

  it("should reject request with wrong prefix", async () => {
    const app = makeApp({ secret: TEST_SECRET });
    const token = await createTestJwt({ sub: "user-1" }, TEST_SECRET);
    const res = await app.request("/test", {
      headers: { authorization: `Token ${token}` },
    });
    expect(res.status).toBe(401);
  });

  it("should reject request with empty token after prefix", async () => {
    const app = makeApp({ secret: TEST_SECRET });
    const res = await app.request("/test", {
      headers: { authorization: "Bearer " },
    });
    expect(res.status).toBe(401);
  });

  it("should reject malformed JWT (not 3 parts)", async () => {
    const app = makeApp({ secret: TEST_SECRET });
    const res = await app.request("/test", {
      headers: { authorization: "Bearer abc.def" },
    });
    expect(res.status).toBe(401);
  });

  it("should reject JWT with invalid base64", async () => {
    const app = makeApp({ secret: TEST_SECRET });
    const res = await app.request("/test", {
      headers: { authorization: "Bearer !!!.@@@.###" },
    });
    expect(res.status).toBe(401);
  });

  it("should reject expired JWT (401)", async () => {
    const app = makeApp({ secret: TEST_SECRET });
    const token = await createTestJwt(
      { sub: "user-1", exp: Math.floor(Date.now() / 1000) - 3600 },
      TEST_SECRET
    );
    const res = await app.request("/test", {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(401);
  });

  it("should reject JWT with wrong issuer when issuer configured", async () => {
    const app = makeApp({ secret: TEST_SECRET, issuer: "expected-issuer" });
    const token = await createTestJwt(
      {
        sub: "user-1",
        iss: "wrong-issuer",
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      TEST_SECRET
    );
    const res = await app.request("/test", {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(401);
  });

  it("should reject JWT with wrong audience when audience configured", async () => {
    const app = makeApp({ secret: TEST_SECRET, audience: "my-app" });
    const token = await createTestJwt(
      {
        sub: "user-1",
        aud: "other-app",
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      TEST_SECRET
    );
    const res = await app.request("/test", {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(401);
  });

  it("should reject JWT with algorithm 'none' (security)", async () => {
    const app = makeApp({ secret: TEST_SECRET });
    const header = base64UrlEncode(JSON.stringify({ alg: "none", typ: "JWT" }));
    const payload = base64UrlEncode(JSON.stringify({ sub: "attacker" }));
    const token = `${header}.${payload}.`;
    const res = await app.request("/test", {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(401);
  });

  it("should reject JWT with invalid HMAC signature", async () => {
    const app = makeApp({ secret: TEST_SECRET });
    const token = await createTestJwt(
      { sub: "user-1", exp: Math.floor(Date.now() / 1000) + 3600 },
      "wrong-secret-key-completely-different"
    );
    const res = await app.request("/test", {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(401);
  });

  it("should throw config error if neither secret nor jwksUrl provided", () => {
    expect(() => jwtAuth({} as JwtAuthConfig)).toThrow(GatewayError);
    expect(() => jwtAuth({} as JwtAuthConfig)).toThrow(
      "jwtAuth requires either 'secret' or 'jwksUrl'"
    );
  });

  // --- Edge cases ---

  it("should handle JWT with extra fields in payload", async () => {
    const app = makeApp({ secret: TEST_SECRET });
    const token = await createTestJwt(
      {
        sub: "user-1",
        exp: Math.floor(Date.now() / 1000) + 3600,
        custom_field: "hello",
        nested: { a: 1 },
      },
      TEST_SECRET
    );
    const res = await app.request("/test", {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
  });

  it("should handle audience as array", async () => {
    const app = makeApp({ secret: TEST_SECRET, audience: "my-app" });
    const token = await createTestJwt(
      {
        sub: "user-1",
        aud: ["other-app", "my-app"],
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      TEST_SECRET
    );
    const res = await app.request("/test", {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
  });

  // --- Security-specific tests ---

  describe("algorithm confusion attacks", () => {
    it("should reject JWT with 'None' (capitalized) algorithm", async () => {
      const app = makeApp({ secret: TEST_SECRET });
      const header = base64UrlEncode(
        JSON.stringify({ alg: "None", typ: "JWT" })
      );
      const payload = base64UrlEncode(JSON.stringify({ sub: "attacker" }));
      const token = `${header}.${payload}.fakesig`;
      const res = await app.request("/test", {
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(401);
    });

    it("should reject JWT with 'NONE' (uppercase) algorithm", async () => {
      const app = makeApp({ secret: TEST_SECRET });
      const header = base64UrlEncode(
        JSON.stringify({ alg: "NONE", typ: "JWT" })
      );
      const payload = base64UrlEncode(JSON.stringify({ sub: "attacker" }));
      const token = `${header}.${payload}.fakesig`;
      const res = await app.request("/test", {
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(401);
    });

    it("should reject JWT with 'nOnE' (mixed case) algorithm", async () => {
      const app = makeApp({ secret: TEST_SECRET });
      const header = base64UrlEncode(
        JSON.stringify({ alg: "nOnE", typ: "JWT" })
      );
      const payload = base64UrlEncode(JSON.stringify({ sub: "attacker" }));
      const token = `${header}.${payload}.`;
      const res = await app.request("/test", {
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(401);
    });

    it("should reject HMAC token with unsupported algorithm (e.g. RS256 against secret)", async () => {
      const app = makeApp({ secret: TEST_SECRET });
      // Craft a token claiming RS256 but signed with HMAC - should be rejected
      // because hmacAlgorithm() only accepts HS256/384/512
      const header = base64UrlEncode(
        JSON.stringify({ alg: "RS256", typ: "JWT" })
      );
      const payload = base64UrlEncode(JSON.stringify({ sub: "attacker" }));
      const token = `${header}.${payload}.fakesig`;
      const res = await app.request("/test", {
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(401);
    });
  });

  describe("error message information disclosure", () => {
    it("should not leak expected issuer in error message", async () => {
      const app = makeApp({ secret: TEST_SECRET, issuer: "secret-issuer" });
      const token = await createTestJwt(
        {
          sub: "user-1",
          iss: "wrong",
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        TEST_SECRET
      );
      const res = await app.request("/test", {
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(401);
      const body = (await res.json()) as { message: string };
      expect(body.message).not.toContain("secret-issuer");
      expect(body.message).toBe("JWT issuer mismatch");
    });

    it("should not leak expected audience in error message", async () => {
      const app = makeApp({ secret: TEST_SECRET, audience: "secret-audience" });
      const token = await createTestJwt(
        {
          sub: "user-1",
          aud: "wrong",
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        TEST_SECRET
      );
      const res = await app.request("/test", {
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(401);
      const body = (await res.json()) as { message: string };
      expect(body.message).not.toContain("secret-audience");
      expect(body.message).toBe("JWT audience mismatch");
    });

    it("should use uniform error code for all auth failures", async () => {
      const app = makeApp({ secret: TEST_SECRET });
      // Test multiple failure modes return the same error code
      const failures = [
        // Missing header
        app.request("/test"),
        // Wrong prefix
        app.request("/test", { headers: { authorization: "Token abc" } }),
        // Expired
        createTestJwt({ sub: "x", exp: 0 }, TEST_SECRET).then((t) =>
          app.request("/test", { headers: { authorization: `Bearer ${t}` } })
        ),
        // Wrong signature
        createTestJwt({ sub: "x" }, "wrong-key-totally-different").then((t) =>
          app.request("/test", { headers: { authorization: `Bearer ${t}` } })
        ),
      ];
      const results = await Promise.all(failures);
      for (const res of results) {
        expect(res.status).toBe(401);
        const body = (await res.json()) as { error: string };
        expect(body.error).toBe("unauthorized");
      }
    });
  });

  describe("header injection via claim forwarding", () => {
    it("should strip CR/LF from forwarded claim values", async () => {
      const app = new Hono();
      const policy = jwtAuth({
        secret: TEST_SECRET,
        forwardClaims: { sub: "x-user-id" },
      });

      app.use("/*", policy.handler);
      app.get("/test", (c) => {
        return c.json({
          userId: c.req.header("x-user-id"),
        });
      });
      withErrorHandler(app);

      // Create a token with a claim containing CRLF injection attempt
      const token = await createTestJwt(
        {
          sub: "user-1\r\nX-Injected: malicious",
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        TEST_SECRET
      );
      const res = await app.request("/test", {
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { userId: string };
      // Value should have CR/LF stripped
      expect(body.userId).not.toContain("\r");
      expect(body.userId).not.toContain("\n");
      expect(body.userId).toBe("user-1X-Injected: malicious");
    });

    it("should strip NUL bytes from forwarded claim values", async () => {
      const app = new Hono();
      const policy = jwtAuth({
        secret: TEST_SECRET,
        forwardClaims: { sub: "x-user-id" },
      });

      app.use("/*", policy.handler);
      app.get("/test", (c) => {
        return c.json({
          userId: c.req.header("x-user-id"),
        });
      });
      withErrorHandler(app);

      const token = await createTestJwt(
        { sub: "user-1\0injected", exp: Math.floor(Date.now() / 1000) + 3600 },
        TEST_SECRET
      );
      const res = await app.request("/test", {
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { userId: string };
      expect(body.userId).not.toContain("\0");
      expect(body.userId).toBe("user-1injected");
    });
  });

  describe("token extraction edge cases", () => {
    it("should reject whitespace-only token after prefix", async () => {
      const app = makeApp({ secret: TEST_SECRET });
      const res = await app.request("/test", {
        headers: { authorization: "Bearer    " },
      });
      expect(res.status).toBe(401);
    });

    it("should reject token with only spaces between dots", async () => {
      const app = makeApp({ secret: TEST_SECRET });
      const res = await app.request("/test", {
        headers: { authorization: "Bearer  . . " },
      });
      expect(res.status).toBe(401);
    });

    it("should reject JWT with 4 parts", async () => {
      const app = makeApp({ secret: TEST_SECRET });
      const res = await app.request("/test", {
        headers: { authorization: "Bearer a.b.c.d" },
      });
      expect(res.status).toBe(401);
    });

    it("should reject JWT with 1 part", async () => {
      const app = makeApp({ secret: TEST_SECRET });
      const res = await app.request("/test", {
        headers: { authorization: "Bearer singlepart" },
      });
      expect(res.status).toBe(401);
    });
  });
});
