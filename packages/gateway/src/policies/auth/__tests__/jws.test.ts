import { describe, expect, it } from "vitest";
import { createPolicyTestHarness } from "../../sdk";
import type { JwsConfig } from "../jws";
import { jws } from "../jws";

const TEST_SECRET = "super-secret-test-key-that-is-long-enough";

function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlEncodeBytes(data: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Create a JWS compact serialization with HMAC */
async function createTestJws(
  payload: string,
  secret: string,
  alg: "HS256" | "HS384" | "HS512" = "HS256",
  options?: { detached?: boolean }
): Promise<string> {
  const header = { alg, typ: "JOSE" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encoder = new TextEncoder();
  const encodedPayload = base64UrlEncodeBytes(encoder.encode(payload));

  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const hashAlg =
    alg === "HS256" ? "SHA-256" : alg === "HS384" ? "SHA-384" : "SHA-512";

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: hashAlg },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(signingInput)
  );
  const encodedSignature = base64UrlEncodeBytes(new Uint8Array(signature));

  if (options?.detached) {
    // Detached JWS: header..signature (empty payload section)
    return `${encodedHeader}..${encodedSignature}`;
  }

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

describe("jws", () => {
  // --- Valid scenarios ---

  it("should verify a valid HMAC JWS with embedded payload", async () => {
    const testPayload = JSON.stringify({ data: "test" });
    const jwsToken = await createTestJws(testPayload, TEST_SECRET);

    const { request } = createPolicyTestHarness(jws({ secret: TEST_SECRET }));

    const res = await request("/test", {
      headers: { "X-JWS-Signature": jwsToken },
    });
    expect(res.status).toBe(200);
  });

  it("should verify HS384 JWS", async () => {
    const testPayload = "hello-world";
    const jwsToken = await createTestJws(testPayload, TEST_SECRET, "HS384");

    const { request } = createPolicyTestHarness(jws({ secret: TEST_SECRET }));

    const res = await request("/test", {
      headers: { "X-JWS-Signature": jwsToken },
    });
    expect(res.status).toBe(200);
  });

  it("should verify HS512 JWS", async () => {
    const testPayload = "payload-data";
    const jwsToken = await createTestJws(testPayload, TEST_SECRET, "HS512");

    const { request } = createPolicyTestHarness(jws({ secret: TEST_SECRET }));

    const res = await request("/test", {
      headers: { "X-JWS-Signature": jwsToken },
    });
    expect(res.status).toBe(200);
  });

  it("should verify detached JWS (payload from body)", async () => {
    const bodyContent = '{"action":"transfer","amount":100}';
    // Create a detached JWS - the signing input uses the payload,
    // but the compact serialization has an empty payload section
    const header = { alg: "HS256", typ: "JOSE" };
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encoder = new TextEncoder();
    const encodedPayload = base64UrlEncodeBytes(encoder.encode(bodyContent));

    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(TEST_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(signingInput)
    );
    const encodedSignature = base64UrlEncodeBytes(new Uint8Array(signature));
    const detachedJws = `${encodedHeader}..${encodedSignature}`;

    const { request } = createPolicyTestHarness(
      jws({ secret: TEST_SECRET, payloadSource: "body" })
    );

    const res = await request("/test", {
      method: "POST",
      headers: {
        "X-JWS-Signature": detachedJws,
        "Content-Type": "application/json",
      },
      body: bodyContent,
    });
    expect(res.status).toBe(200);
  });

  it("should forward verified payload as header when forwardPayload is true", async () => {
    const testPayload = JSON.stringify({ sub: "user-1" });
    const jwsToken = await createTestJws(testPayload, TEST_SECRET);

    let forwardedPayload = "";
    const { request } = createPolicyTestHarness(
      jws({
        secret: TEST_SECRET,
        forwardPayload: true,
        forwardHeaderName: "X-Verified-Data",
      }),
      {
        upstream: async (c) => {
          forwardedPayload = c.req.header("X-Verified-Data") ?? "";
          return c.json({ ok: true });
        },
      }
    );

    const res = await request("/test", {
      headers: { "X-JWS-Signature": jwsToken },
    });
    expect(res.status).toBe(200);
    expect(forwardedPayload).toContain("user-1");
  });

  it("should use default X-JWS-Payload header for forwarded payload", async () => {
    const testPayload = "simple-data";
    const jwsToken = await createTestJws(testPayload, TEST_SECRET);

    let forwardedPayload = "";
    const { request } = createPolicyTestHarness(
      jws({
        secret: TEST_SECRET,
        forwardPayload: true,
      }),
      {
        upstream: async (c) => {
          forwardedPayload = c.req.header("X-JWS-Payload") ?? "";
          return c.json({ ok: true });
        },
      }
    );

    const res = await request("/test", {
      headers: { "X-JWS-Signature": jwsToken },
    });
    expect(res.status).toBe(200);
    expect(forwardedPayload).toBe("simple-data");
  });

  it("should use custom header name for JWS input", async () => {
    const testPayload = "test";
    const jwsToken = await createTestJws(testPayload, TEST_SECRET);

    const { request } = createPolicyTestHarness(
      jws({ secret: TEST_SECRET, headerName: "X-Custom-Sig" })
    );

    const res = await request("/test", {
      headers: { "X-Custom-Sig": jwsToken },
    });
    expect(res.status).toBe(200);
  });

  // --- Error handling ---

  it("should return 401 when JWS header is missing", async () => {
    const { request } = createPolicyTestHarness(jws({ secret: TEST_SECRET }));

    const res = await request("/test");
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("jws_missing");
  });

  it("should return 401 for invalid HMAC signature", async () => {
    const testPayload = "test-data";
    const jwsToken = await createTestJws(
      testPayload,
      "wrong-secret-completely-different-key"
    );

    const { request } = createPolicyTestHarness(jws({ secret: TEST_SECRET }));

    const res = await request("/test", {
      headers: { "X-JWS-Signature": jwsToken },
    });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("jws_invalid");
  });

  it("should return 401 for malformed JWS (not 3 parts)", async () => {
    const { request } = createPolicyTestHarness(jws({ secret: TEST_SECRET }));

    const res = await request("/test", {
      headers: { "X-JWS-Signature": "only-two.parts" },
    });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string; message: string };
    expect(body.error).toBe("jws_invalid");
    expect(body.message).toContain("3 parts");
  });

  it("should return 401 for JWS with invalid header encoding", async () => {
    const { request } = createPolicyTestHarness(jws({ secret: TEST_SECRET }));

    const res = await request("/test", {
      headers: { "X-JWS-Signature": "!!!invalid.payload.sig" },
    });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("jws_invalid");
  });

  it("should throw config error at construction when neither secret nor jwksUrl provided", () => {
    expect(() => jws({} as JwsConfig)).toThrow(
      "jws requires either 'secret' or 'jwksUrl'"
    );
  });

  it("should return 401 for unsupported algorithm", async () => {
    // Craft a JWS with an unsupported algorithm
    const header = base64UrlEncode(JSON.stringify({ alg: "ES256" }));
    const payload = base64UrlEncode("test");
    const fakeJws = `${header}.${payload}.fakesig`;

    const { request } = createPolicyTestHarness(jws({ secret: TEST_SECRET }));

    const res = await request("/test", {
      headers: { "X-JWS-Signature": fakeJws },
    });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string; message: string };
    expect(body.error).toBe("jws_invalid");
    expect(body.message).toContain("Unsupported");
  });

  // --- Skip ---

  it("should skip verification when skip function returns true", async () => {
    const { request } = createPolicyTestHarness(
      jws({
        secret: TEST_SECRET,
        skip: () => true,
      })
    );

    // No JWS header - should pass because policy is skipped
    const res = await request("/test");
    expect(res.status).toBe(200);
  });

  // --- Metadata ---

  it("should have priority AUTH (10) and name 'jws'", () => {
    const policy = jws({ secret: TEST_SECRET });
    expect(policy.priority).toBe(10);
    expect(policy.name).toBe("jws");
  });

  it("should return 401 for JWS with 4 parts", async () => {
    const { request } = createPolicyTestHarness(jws({ secret: TEST_SECRET }));

    const res = await request("/test", {
      headers: { "X-JWS-Signature": "a.b.c.d" },
    });
    expect(res.status).toBe(401);
  });
});
