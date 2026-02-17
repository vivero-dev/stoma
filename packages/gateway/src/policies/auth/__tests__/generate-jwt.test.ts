import { describe, expect, it } from "vitest";
import { createPolicyTestHarness } from "../../sdk";
import type { GenerateJwtConfig } from "../generate-jwt";
import { generateJwt } from "../generate-jwt";

const TEST_SECRET = "super-secret-test-key-that-is-long-enough";

function base64UrlDecode(str: string): string {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const paddedLength = padded + "=".repeat((4 - (padded.length % 4)) % 4);
  return atob(paddedLength);
}

/** Verify an HMAC JWT signature using crypto.subtle */
async function verifyHmacJwt(
  token: string,
  secret: string,
  alg: "HS256" | "HS384" | "HS512" = "HS256"
): Promise<boolean> {
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const hashAlg =
    alg === "HS256" ? "SHA-256" : alg === "HS384" ? "SHA-384" : "SHA-512";
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: hashAlg },
    false,
    ["verify"]
  );

  const data = encoder.encode(`${parts[0]}.${parts[1]}`);
  const sigBytes = Uint8Array.from(base64UrlDecode(parts[2]), (ch) =>
    ch.charCodeAt(0)
  );
  return crypto.subtle.verify("HMAC", key, sigBytes, data);
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split(".");
  return JSON.parse(base64UrlDecode(parts[1]));
}

function decodeJwtHeader(token: string): Record<string, unknown> {
  const parts = token.split(".");
  return JSON.parse(base64UrlDecode(parts[0]));
}

describe("generateJwt", () => {
  it("should generate a valid HS256 JWT on the Authorization header", async () => {
    let capturedToken = "";
    const { request } = createPolicyTestHarness(
      generateJwt({
        algorithm: "HS256",
        secret: TEST_SECRET,
      }),
      {
        upstream: async (c) => {
          capturedToken = c.req.header("Authorization") ?? "";
          return c.json({ ok: true });
        },
      }
    );

    const res = await request("/test");
    expect(res.status).toBe(200);
    expect(capturedToken).toMatch(/^Bearer .+/);

    const token = capturedToken.replace("Bearer ", "");
    const valid = await verifyHmacJwt(token, TEST_SECRET, "HS256");
    expect(valid).toBe(true);

    const header = decodeJwtHeader(token);
    expect(header.alg).toBe("HS256");
    expect(header.typ).toBe("JWT");
  });

  it("should generate a valid HS384 JWT", async () => {
    let capturedToken = "";
    const { request } = createPolicyTestHarness(
      generateJwt({
        algorithm: "HS384",
        secret: TEST_SECRET,
      }),
      {
        upstream: async (c) => {
          capturedToken = c.req.header("Authorization") ?? "";
          return c.json({ ok: true });
        },
      }
    );

    const res = await request("/test");
    expect(res.status).toBe(200);

    const token = capturedToken.replace("Bearer ", "");
    const valid = await verifyHmacJwt(token, TEST_SECRET, "HS384");
    expect(valid).toBe(true);
  });

  it("should generate a valid HS512 JWT", async () => {
    let capturedToken = "";
    const { request } = createPolicyTestHarness(
      generateJwt({
        algorithm: "HS512",
        secret: TEST_SECRET,
      }),
      {
        upstream: async (c) => {
          capturedToken = c.req.header("Authorization") ?? "";
          return c.json({ ok: true });
        },
      }
    );

    const res = await request("/test");
    expect(res.status).toBe(200);

    const token = capturedToken.replace("Bearer ", "");
    const valid = await verifyHmacJwt(token, TEST_SECRET, "HS512");
    expect(valid).toBe(true);
  });

  it("should include dynamic claims from a function", async () => {
    let capturedToken = "";
    const { request } = createPolicyTestHarness(
      generateJwt({
        algorithm: "HS256",
        secret: TEST_SECRET,
        claims: (c) => ({
          sub: c.req.header("x-user-id") ?? "unknown",
          role: "admin",
        }),
      }),
      {
        upstream: async (c) => {
          capturedToken = c.req.header("Authorization") ?? "";
          return c.json({ ok: true });
        },
      }
    );

    const res = await request("/test", {
      headers: { "x-user-id": "user-42" },
    });
    expect(res.status).toBe(200);

    const token = capturedToken.replace("Bearer ", "");
    const payload = decodeJwtPayload(token);
    expect(payload.sub).toBe("user-42");
    expect(payload.role).toBe("admin");
  });

  it("should include static claims", async () => {
    let capturedToken = "";
    const { request } = createPolicyTestHarness(
      generateJwt({
        algorithm: "HS256",
        secret: TEST_SECRET,
        claims: { sub: "static-user", scope: "read:data" },
      }),
      {
        upstream: async (c) => {
          capturedToken = c.req.header("Authorization") ?? "";
          return c.json({ ok: true });
        },
      }
    );

    const res = await request("/test");
    expect(res.status).toBe(200);

    const token = capturedToken.replace("Bearer ", "");
    const payload = decodeJwtPayload(token);
    expect(payload.sub).toBe("static-user");
    expect(payload.scope).toBe("read:data");
  });

  it("should use custom header name and prefix", async () => {
    let capturedHeader = "";
    const { request } = createPolicyTestHarness(
      generateJwt({
        algorithm: "HS256",
        secret: TEST_SECRET,
        headerName: "X-Internal-Token",
        tokenPrefix: "Token",
      }),
      {
        upstream: async (c) => {
          capturedHeader = c.req.header("X-Internal-Token") ?? "";
          return c.json({ ok: true });
        },
      }
    );

    const res = await request("/test");
    expect(res.status).toBe(200);
    expect(capturedHeader).toMatch(/^Token .+/);
  });

  it("should set token without prefix when tokenPrefix is empty", async () => {
    let capturedHeader = "";
    const { request } = createPolicyTestHarness(
      generateJwt({
        algorithm: "HS256",
        secret: TEST_SECRET,
        tokenPrefix: "",
      }),
      {
        upstream: async (c) => {
          capturedHeader = c.req.header("Authorization") ?? "";
          return c.json({ ok: true });
        },
      }
    );

    const res = await request("/test");
    expect(res.status).toBe(200);
    // Should be a raw JWT (3 base64url parts separated by dots)
    expect(capturedHeader.split(".")).toHaveLength(3);
    expect(capturedHeader).not.toMatch(/^Bearer /);
  });

  it("should include default expiry of 1 hour", async () => {
    let capturedToken = "";
    const { request } = createPolicyTestHarness(
      generateJwt({
        algorithm: "HS256",
        secret: TEST_SECRET,
      }),
      {
        upstream: async (c) => {
          capturedToken = c.req.header("Authorization") ?? "";
          return c.json({ ok: true });
        },
      }
    );

    await request("/test");

    const token = capturedToken.replace("Bearer ", "");
    const payload = decodeJwtPayload(token);
    const now = Math.floor(Date.now() / 1000);
    // Default expiry is 3600s (1 hour)
    expect(payload.exp).toBeGreaterThan(now + 3500);
    expect(payload.exp).toBeLessThanOrEqual(now + 3600);
    expect(payload.iat).toBeGreaterThanOrEqual(now - 2);
    expect(payload.iat).toBeLessThanOrEqual(now + 2);
  });

  it("should use custom expiry", async () => {
    let capturedToken = "";
    const { request } = createPolicyTestHarness(
      generateJwt({
        algorithm: "HS256",
        secret: TEST_SECRET,
        expiresIn: 300,
      }),
      {
        upstream: async (c) => {
          capturedToken = c.req.header("Authorization") ?? "";
          return c.json({ ok: true });
        },
      }
    );

    await request("/test");

    const token = capturedToken.replace("Bearer ", "");
    const payload = decodeJwtPayload(token);
    const now = Math.floor(Date.now() / 1000);
    expect(payload.exp).toBeGreaterThan(now + 290);
    expect(payload.exp).toBeLessThanOrEqual(now + 300);
  });

  it("should include issuer and audience claims", async () => {
    let capturedToken = "";
    const { request } = createPolicyTestHarness(
      generateJwt({
        algorithm: "HS256",
        secret: TEST_SECRET,
        issuer: "my-gateway",
        audience: "my-service",
      }),
      {
        upstream: async (c) => {
          capturedToken = c.req.header("Authorization") ?? "";
          return c.json({ ok: true });
        },
      }
    );

    await request("/test");

    const token = capturedToken.replace("Bearer ", "");
    const payload = decodeJwtPayload(token);
    expect(payload.iss).toBe("my-gateway");
    expect(payload.aud).toBe("my-service");
  });

  it("should throw config error when HMAC algorithm used without secret", async () => {
    const { request } = createPolicyTestHarness(
      generateJwt({
        algorithm: "HS256",
      } as GenerateJwtConfig)
    );

    const res = await request("/test");
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string; message: string };
    expect(body.error).toBe("config_error");
    expect(body.message).toContain("secret");
  });

  it("should throw config error when RSA algorithm used without privateKey", async () => {
    const { request } = createPolicyTestHarness(
      generateJwt({
        algorithm: "RS256",
      } as GenerateJwtConfig)
    );

    const res = await request("/test");
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string; message: string };
    expect(body.error).toBe("config_error");
    expect(body.message).toContain("privateKey");
  });

  it("should skip when skip function returns true", async () => {
    let upstreamCalled = false;
    const { request } = createPolicyTestHarness(
      generateJwt({
        algorithm: "HS256",
        secret: TEST_SECRET,
        skip: () => true,
      }),
      {
        upstream: async (c) => {
          upstreamCalled = true;
          // Should not have Authorization header since policy was skipped
          const auth = c.req.header("Authorization");
          return c.json({ hasAuth: !!auth });
        },
      }
    );

    const res = await request("/test");
    expect(res.status).toBe(200);
    expect(upstreamCalled).toBe(true);
    const body = (await res.json()) as { hasAuth: boolean };
    expect(body.hasAuth).toBe(false);
  });

  it("should generate RS256 JWT with a valid RSA key pair", async () => {
    // Generate an RSA key pair for testing
    const keyPair = await crypto.subtle.generateKey(
      {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["sign", "verify"]
    );

    const privateKeyJwk = (await crypto.subtle.exportKey(
      "jwk",
      (keyPair as CryptoKeyPair).privateKey
    )) as JsonWebKey;

    let capturedToken = "";
    const { request } = createPolicyTestHarness(
      generateJwt({
        algorithm: "RS256",
        privateKey: privateKeyJwk,
        claims: { sub: "rsa-user" },
      }),
      {
        upstream: async (c) => {
          capturedToken = c.req.header("Authorization") ?? "";
          return c.json({ ok: true });
        },
      }
    );

    const res = await request("/test");
    expect(res.status).toBe(200);

    const token = capturedToken.replace("Bearer ", "");
    const parts = token.split(".");
    expect(parts).toHaveLength(3);

    // Verify with the public key
    const encoder = new TextEncoder();
    const data = encoder.encode(`${parts[0]}.${parts[1]}`);
    const sigBytes = Uint8Array.from(base64UrlDecode(parts[2]), (ch) =>
      ch.charCodeAt(0)
    );

    const valid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      (keyPair as CryptoKeyPair).publicKey,
      sigBytes,
      data
    );
    expect(valid).toBe(true);

    const payload = decodeJwtPayload(token);
    expect(payload.sub).toBe("rsa-user");
  });

  it("should have priority REQUEST_TRANSFORM (50)", () => {
    const policy = generateJwt({
      algorithm: "HS256",
      secret: TEST_SECRET,
    });
    expect(policy.priority).toBe(50);
    expect(policy.name).toBe("generate-jwt");
  });

  it("should handle async dynamic claims function", async () => {
    let capturedToken = "";
    const { request } = createPolicyTestHarness(
      generateJwt({
        algorithm: "HS256",
        secret: TEST_SECRET,
        claims: async () => {
          // Simulate async operation
          return { sub: "async-user", permission: "granted" };
        },
      }),
      {
        upstream: async (c) => {
          capturedToken = c.req.header("Authorization") ?? "";
          return c.json({ ok: true });
        },
      }
    );

    const res = await request("/test");
    expect(res.status).toBe(200);

    const token = capturedToken.replace("Bearer ", "");
    const payload = decodeJwtPayload(token);
    expect(payload.sub).toBe("async-user");
    expect(payload.permission).toBe("granted");
  });
});
