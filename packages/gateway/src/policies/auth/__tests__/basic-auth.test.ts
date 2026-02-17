import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { GatewayError } from "../../../core/errors";
import { basicAuth } from "../basic-auth";

function encodeBasic(username: string, password: string): string {
  return `Basic ${btoa(`${username}:${password}`)}`;
}

function makeApp(config: Parameters<typeof basicAuth>[0]): Hono {
  const app = new Hono();
  const policy = basicAuth(config);

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

describe("basicAuth", () => {
  // --- Valid scenarios ---

  it("should allow request with valid credentials", async () => {
    const app = makeApp({
      validate: (username, password) =>
        username === "admin" && password === "secret",
    });
    const res = await app.request("/test", {
      headers: { authorization: encodeBasic("admin", "secret") },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("should support async validator", async () => {
    const app = makeApp({
      validate: async (username, password) => {
        await new Promise((r) => setTimeout(r, 1));
        return username === "admin" && password === "secret";
      },
    });
    const res = await app.request("/test", {
      headers: { authorization: encodeBasic("admin", "secret") },
    });
    expect(res.status).toBe(200);
  });

  it("should use custom realm", async () => {
    const app = makeApp({
      realm: "Admin Area",
      validate: () => false,
    });
    const res = await app.request("/test", {
      headers: { authorization: encodeBasic("admin", "wrong") },
    });
    expect(res.status).toBe(403);
    expect(res.headers.get("www-authenticate")).toBe(
      'Basic realm="Admin Area"'
    );
  });

  // --- Error handling ---

  it("should reject request with no Authorization header (401, WWW-Authenticate)", async () => {
    const app = makeApp({
      validate: () => true,
    });
    const res = await app.request("/test");
    expect(res.status).toBe(401);
    expect(res.headers.get("www-authenticate")).toBe(
      'Basic realm="Restricted"'
    );
  });

  it("should reject request with non-Basic auth scheme (401)", async () => {
    const app = makeApp({
      validate: () => true,
    });
    const res = await app.request("/test", {
      headers: { authorization: "Bearer some-token" },
    });
    expect(res.status).toBe(401);
    expect(res.headers.get("www-authenticate")).toBe(
      'Basic realm="Restricted"'
    );
  });

  it("should reject request with invalid base64 (401)", async () => {
    const app = makeApp({
      validate: () => true,
    });
    const res = await app.request("/test", {
      headers: { authorization: "Basic !!!invalid-base64!!!" },
    });
    expect(res.status).toBe(401);
  });

  it("should reject request with invalid credentials (403)", async () => {
    const app = makeApp({
      validate: (username, password) =>
        username === "admin" && password === "secret",
    });
    const res = await app.request("/test", {
      headers: { authorization: encodeBasic("admin", "wrong") },
    });
    expect(res.status).toBe(403);
  });

  it("should reject malformed Basic header (no colon separator)", async () => {
    const app = makeApp({
      validate: () => true,
    });
    // Base64 encode a string without a colon
    const encoded = btoa("nocolon");
    const res = await app.request("/test", {
      headers: { authorization: `Basic ${encoded}` },
    });
    expect(res.status).toBe(401);
  });

  // --- Edge cases ---

  it("should handle password containing colons", async () => {
    const app = makeApp({
      validate: (username, password) =>
        username === "user" && password === "pass:with:colons",
    });
    const res = await app.request("/test", {
      headers: { authorization: encodeBasic("user", "pass:with:colons") },
    });
    expect(res.status).toBe(200);
  });

  it("should handle empty password", async () => {
    const app = makeApp({
      validate: (username, password) => username === "user" && password === "",
    });
    const res = await app.request("/test", {
      headers: { authorization: encodeBasic("user", "") },
    });
    expect(res.status).toBe(200);
  });

  it("should handle empty username", async () => {
    const app = makeApp({
      validate: (username, password) =>
        username === "" && password === "secret",
    });
    const res = await app.request("/test", {
      headers: { authorization: encodeBasic("", "secret") },
    });
    expect(res.status).toBe(200);
  });

  // --- Security-specific tests ---

  describe("realm header injection", () => {
    it("should escape double quotes in realm to prevent header injection", async () => {
      const app = makeApp({
        realm: 'Evil" inject',
        validate: () => false,
      });
      const res = await app.request("/test", {
        headers: { authorization: encodeBasic("u", "p") },
      });
      expect(res.status).toBe(403);
      const wwwAuth = res.headers.get("www-authenticate") ?? "";
      // Quotes should be escaped
      expect(wwwAuth).not.toContain('"Evil"');
      expect(wwwAuth).toContain('\\"');
    });

    it("should strip CRLF from realm to prevent header injection", async () => {
      const app = makeApp({
        realm: "Evil\r\nX-Injected: yes",
        validate: () => false,
      });
      const res = await app.request("/test");
      expect(res.status).toBe(401);
      const wwwAuth = res.headers.get("www-authenticate") ?? "";
      expect(wwwAuth).not.toContain("\r");
      expect(wwwAuth).not.toContain("\n");
    });
  });

  describe("credential parsing edge cases", () => {
    it("should handle password with multiple colons correctly", async () => {
      const app = makeApp({
        validate: (username, password) =>
          username === "admin" && password === "p:a:s:s",
      });
      const res = await app.request("/test", {
        headers: { authorization: encodeBasic("admin", "p:a:s:s") },
      });
      expect(res.status).toBe(200);
    });

    it("should handle both username and password empty", async () => {
      let receivedUser = "unset";
      let receivedPass = "unset";
      const app = makeApp({
        validate: (username, password) => {
          receivedUser = username;
          receivedPass = password;
          return true;
        },
      });
      const res = await app.request("/test", {
        headers: { authorization: encodeBasic("", "") },
      });
      expect(res.status).toBe(200);
      expect(receivedUser).toBe("");
      expect(receivedPass).toBe("");
    });

    it("should reject base64 that decodes to string without colon", async () => {
      const app = makeApp({
        validate: () => true,
      });
      const encoded = btoa("nocolonseparator");
      const res = await app.request("/test", {
        headers: { authorization: `Basic ${encoded}` },
      });
      expect(res.status).toBe(401);
    });

    it("should reject when only 'Basic' is sent with no encoded part", async () => {
      const app = makeApp({
        validate: () => true,
      });
      const res = await app.request("/test", {
        headers: { authorization: "Basic " },
      });
      // atob("") returns "" which has no colon, so should be 401
      expect(res.status).toBe(401);
    });
  });
});
