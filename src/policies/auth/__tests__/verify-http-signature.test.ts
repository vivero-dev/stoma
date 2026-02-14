import { describe, expect, it } from "vitest";
import { createPolicyTestHarness } from "../../sdk";
import {
  algorithmToCrypto,
  buildSignatureBase,
  buildSignatureParams,
  toBase64,
} from "../http-signature-base";
import type { VerifyHttpSignatureConfig } from "../verify-http-signature";
import { verifyHttpSignature } from "../verify-http-signature";

const TEST_SECRET = "test-hmac-secret-key-for-http-signatures";
const TEST_KEY_ID = "test-key-1";

/**
 * Helper: sign a request and return the Signature + Signature-Input header values.
 */
async function signRequest(
  url: string,
  method: string,
  opts?: {
    keyId?: string;
    secret?: string;
    algorithm?: string;
    components?: string[];
    label?: string;
    expires?: number;
    nonce?: string;
    created?: number;
    headers?: Record<string, string>;
  }
): Promise<{ signature: string; signatureInput: string }> {
  const keyId = opts?.keyId ?? TEST_KEY_ID;
  const secret = opts?.secret ?? TEST_SECRET;
  const algorithm = opts?.algorithm ?? "hmac-sha256";
  const components = opts?.components ?? ["@method", "@path", "@authority"];
  const label = opts?.label ?? "sig1";
  const created = opts?.created ?? Math.floor(Date.now() / 1000);

  const paramsObj: {
    created: number;
    keyId: string;
    expires?: number;
    nonce?: string;
    algorithm?: string;
  } = { created, keyId, algorithm };

  if (opts?.expires !== undefined) {
    paramsObj.expires = opts.expires;
  }
  if (opts?.nonce !== undefined) {
    paramsObj.nonce = opts.nonce;
  }

  const signatureParamsStr = buildSignatureParams(components, paramsObj);

  const reqHeaders = new Headers(opts?.headers);
  const fakeRequest = new Request(url, { method, headers: reqHeaders });
  const signatureBase = buildSignatureBase(
    components,
    signatureParamsStr,
    fakeRequest
  );

  const { importAlg, signAlg } = algorithmToCrypto(algorithm);
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    importAlg,
    false,
    ["sign"]
  );
  const signatureBytes = await crypto.subtle.sign(
    signAlg,
    key,
    encoder.encode(signatureBase)
  );

  const signatureB64 = toBase64(signatureBytes);

  return {
    signatureInput: `${label}=${signatureParamsStr}`,
    signature: `${label}=:${signatureB64}:`,
  };
}

function makeConfig(
  overrides?: Partial<VerifyHttpSignatureConfig>
): VerifyHttpSignatureConfig {
  return {
    keys: {
      [TEST_KEY_ID]: {
        secret: TEST_SECRET,
        algorithm: "hmac-sha256",
      },
    },
    ...overrides,
  } as VerifyHttpSignatureConfig;
}

describe("verifyHttpSignature", () => {
  it("should verify an HMAC-signed request", async () => {
    const { signature, signatureInput } = await signRequest(
      "http://localhost/api/test",
      "GET"
    );

    const { request } = createPolicyTestHarness(
      verifyHttpSignature(makeConfig())
    );

    const res = await request("/api/test", {
      headers: {
        Signature: signature,
        "Signature-Input": signatureInput,
      },
    });
    expect(res.status).toBe(200);
  });

  it("should reject missing Signature header", async () => {
    const { signatureInput } = await signRequest(
      "http://localhost/test",
      "GET"
    );

    const { request } = createPolicyTestHarness(
      verifyHttpSignature(makeConfig())
    );

    const res = await request("/test", {
      headers: { "Signature-Input": signatureInput },
    });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string; message: string };
    expect(body.error).toBe("signature_invalid");
    expect(body.message).toContain("Missing Signature header");
  });

  it("should reject missing Signature-Input header", async () => {
    const { signature } = await signRequest("http://localhost/test", "GET");

    const { request } = createPolicyTestHarness(
      verifyHttpSignature(makeConfig())
    );

    const res = await request("/test", {
      headers: { Signature: signature },
    });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string; message: string };
    expect(body.error).toBe("signature_invalid");
    expect(body.message).toContain("Missing Signature-Input header");
  });

  it("should reject expired signature (maxAge exceeded)", async () => {
    const oldCreated = Math.floor(Date.now() / 1000) - 600; // 10 min ago
    const { signature, signatureInput } = await signRequest(
      "http://localhost/test",
      "GET",
      { created: oldCreated }
    );

    const { request } = createPolicyTestHarness(
      verifyHttpSignature(makeConfig({ maxAge: 300 }))
    );

    const res = await request("/test", {
      headers: {
        Signature: signature,
        "Signature-Input": signatureInput,
      },
    });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { message: string };
    expect(body.message).toContain("maxAge exceeded");
  });

  it("should reject when expires parameter is past", async () => {
    const pastExpiry = Math.floor(Date.now() / 1000) - 60; // 1 min ago
    const { signature, signatureInput } = await signRequest(
      "http://localhost/test",
      "GET",
      { expires: pastExpiry }
    );

    const { request } = createPolicyTestHarness(
      verifyHttpSignature(makeConfig())
    );

    const res = await request("/test", {
      headers: {
        Signature: signature,
        "Signature-Input": signatureInput,
      },
    });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { message: string };
    expect(body.message).toContain("expires parameter");
  });

  it("should reject unknown keyId", async () => {
    const { signature, signatureInput } = await signRequest(
      "http://localhost/test",
      "GET",
      { keyId: "unknown-key" }
    );

    const { request } = createPolicyTestHarness(
      verifyHttpSignature(makeConfig())
    );

    const res = await request("/test", {
      headers: {
        Signature: signature,
        "Signature-Input": signatureInput,
      },
    });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { message: string };
    expect(body.message).toContain("Unknown key identifier");
  });

  it("should reject missing required components", async () => {
    const { signature, signatureInput } = await signRequest(
      "http://localhost/test",
      "GET",
      { components: ["@method"] } // only @method, missing @path
    );

    const { request } = createPolicyTestHarness(
      verifyHttpSignature(
        makeConfig({ requiredComponents: ["@method", "@path"] })
      )
    );

    const res = await request("/test", {
      headers: {
        Signature: signature,
        "Signature-Input": signatureInput,
      },
    });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { message: string };
    expect(body.message).toContain("@path");
  });

  it("should reject invalid signature (wrong secret)", async () => {
    const { signature, signatureInput } = await signRequest(
      "http://localhost/test",
      "GET",
      { secret: "wrong-secret-key-completely-different" }
    );

    const { request } = createPolicyTestHarness(
      verifyHttpSignature(makeConfig())
    );

    const res = await request("/test", {
      headers: {
        Signature: signature,
        "Signature-Input": signatureInput,
      },
    });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { message: string };
    expect(body.message).toContain("Signature verification failed");
  });

  it("should accept custom header names", async () => {
    const { signature, signatureInput } = await signRequest(
      "http://localhost/test",
      "GET"
    );

    const { request } = createPolicyTestHarness(
      verifyHttpSignature(
        makeConfig({
          signatureHeaderName: "X-Sig",
          signatureInputHeaderName: "X-Sig-Input",
        })
      )
    );

    const res = await request("/test", {
      headers: {
        "X-Sig": signature,
        "X-Sig-Input": signatureInput,
      },
    });
    expect(res.status).toBe(200);
  });

  it("should respect skip logic", async () => {
    const { request } = createPolicyTestHarness(
      verifyHttpSignature(makeConfig({ skip: () => true }))
    );

    // No signature headers at all - should pass because skipped
    const res = await request("/test");
    expect(res.status).toBe(200);
  });

  it("should throw config error when keys map is empty", async () => {
    const { request } = createPolicyTestHarness(
      verifyHttpSignature({ keys: {} } as VerifyHttpSignatureConfig)
    );

    const res = await request("/test", {
      headers: {
        Signature: "sig1=:abc=:",
        "Signature-Input": 'sig1=("@method");created=1234;keyid="x"',
      },
    });
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("config_error");
  });

  it("should accept a valid signature with custom label", async () => {
    const { signature, signatureInput } = await signRequest(
      "http://localhost/test",
      "GET",
      { label: "my-sig" }
    );

    const { request } = createPolicyTestHarness(
      verifyHttpSignature(makeConfig({ label: "my-sig" }))
    );

    const res = await request("/test", {
      headers: {
        Signature: signature,
        "Signature-Input": signatureInput,
      },
    });
    expect(res.status).toBe(200);
  });

  it("should verify signature with header components", async () => {
    const { signature, signatureInput } = await signRequest(
      "http://localhost/test",
      "POST",
      {
        components: ["@method", "@path", "content-type"],
        headers: { "content-type": "application/json" },
      }
    );

    const { request } = createPolicyTestHarness(
      verifyHttpSignature(makeConfig())
    );

    const res = await request("/test", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Signature: signature,
        "Signature-Input": signatureInput,
      },
      body: "{}",
    });
    expect(res.status).toBe(200);
  });

  it("should have correct policy name and priority", () => {
    const policy = verifyHttpSignature(makeConfig());
    expect(policy.name).toBe("verify-http-signature");
    expect(policy.priority).toBe(10); // Priority.AUTH
  });

  it("should accept a fresh signature within maxAge", async () => {
    const { signature, signatureInput } = await signRequest(
      "http://localhost/test",
      "GET",
      { created: Math.floor(Date.now() / 1000) - 10 } // 10 seconds ago
    );

    const { request } = createPolicyTestHarness(
      verifyHttpSignature(makeConfig({ maxAge: 300 }))
    );

    const res = await request("/test", {
      headers: {
        Signature: signature,
        "Signature-Input": signatureInput,
      },
    });
    expect(res.status).toBe(200);
  });
});
