import { describe, expect, it } from "vitest";
import { createPolicyTestHarness } from "../../sdk";
import type { GenerateHttpSignatureConfig } from "../generate-http-signature";
import { generateHttpSignature } from "../generate-http-signature";
import {
  algorithmToCrypto,
  buildSignatureBase,
  fromBase64,
  parseSignatureParams,
} from "../http-signature-base";

const TEST_SECRET = "test-hmac-secret-key-for-http-signatures";
const TEST_KEY_ID = "test-key-1";

function makeConfig(
  overrides?: Partial<GenerateHttpSignatureConfig>
): GenerateHttpSignatureConfig {
  return {
    keyId: TEST_KEY_ID,
    secret: TEST_SECRET,
    algorithm: "hmac-sha256",
    ...overrides,
  } as GenerateHttpSignatureConfig;
}

describe("generateHttpSignature", () => {
  it("should sign a request with HMAC and set Signature + Signature-Input headers", async () => {
    const { request } = createPolicyTestHarness(
      generateHttpSignature(makeConfig()),
      {
        upstream: async (c) => {
          const sig = c.req.header("Signature");
          const sigInput = c.req.header("Signature-Input");
          return c.json({ signature: sig, signatureInput: sigInput });
        },
      }
    );

    const res = await request("/api/users");
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      signature: string;
      signatureInput: string;
    };
    expect(body.signature).toBeTruthy();
    expect(body.signatureInput).toBeTruthy();
    // Signature format: sig1=:<base64>:
    expect(body.signature).toMatch(/^sig1=:[A-Za-z0-9+/]+=*:$/);
    // Signature-Input format: sig1=("@method" ...);created=...;keyid="..."
    expect(body.signatureInput).toContain("sig1=");
    expect(body.signatureInput).toContain(`keyid="${TEST_KEY_ID}"`);
  });

  it("should include default components (@method, @path, @authority)", async () => {
    const { request } = createPolicyTestHarness(
      generateHttpSignature(makeConfig()),
      {
        upstream: async (c) => {
          return c.json({ signatureInput: c.req.header("Signature-Input") });
        },
      }
    );

    const res = await request("/test/path");
    const body = (await res.json()) as { signatureInput: string };
    expect(body.signatureInput).toContain('"@method"');
    expect(body.signatureInput).toContain('"@path"');
    expect(body.signatureInput).toContain('"@authority"');
  });

  it("should include custom components including header values", async () => {
    const { request } = createPolicyTestHarness(
      generateHttpSignature(
        makeConfig({ components: ["@method", "content-type", "x-custom"] })
      ),
      {
        upstream: async (c) => {
          return c.json({ signatureInput: c.req.header("Signature-Input") });
        },
      }
    );

    const res = await request("/test", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-custom": "custom-value",
      },
      body: "{}",
    });
    const body = (await res.json()) as { signatureInput: string };
    expect(body.signatureInput).toContain('"@method"');
    expect(body.signatureInput).toContain('"content-type"');
    expect(body.signatureInput).toContain('"x-custom"');
  });

  it("should use a custom label", async () => {
    const { request } = createPolicyTestHarness(
      generateHttpSignature(makeConfig({ label: "my-sig" })),
      {
        upstream: async (c) => {
          return c.json({
            signature: c.req.header("Signature"),
            signatureInput: c.req.header("Signature-Input"),
          });
        },
      }
    );

    const res = await request("/test");
    const body = (await res.json()) as {
      signature: string;
      signatureInput: string;
    };
    expect(body.signature).toMatch(/^my-sig=:/);
    expect(body.signatureInput).toMatch(/^my-sig=/);
  });

  it("should include expires parameter when configured", async () => {
    const { request } = createPolicyTestHarness(
      generateHttpSignature(makeConfig({ expires: 60 })),
      {
        upstream: async (c) => {
          return c.json({ signatureInput: c.req.header("Signature-Input") });
        },
      }
    );

    const res = await request("/test");
    const body = (await res.json()) as { signatureInput: string };
    expect(body.signatureInput).toMatch(/;expires=\d+/);
  });

  it("should include nonce parameter when enabled", async () => {
    const { request } = createPolicyTestHarness(
      generateHttpSignature(makeConfig({ nonce: true })),
      {
        upstream: async (c) => {
          return c.json({ signatureInput: c.req.header("Signature-Input") });
        },
      }
    );

    const res = await request("/test");
    const body = (await res.json()) as { signatureInput: string };
    expect(body.signatureInput).toMatch(/;nonce="[a-f0-9]+"/);
  });

  it("should throw config error when neither secret nor privateKey provided", async () => {
    const { request } = createPolicyTestHarness(
      generateHttpSignature({
        keyId: TEST_KEY_ID,
        algorithm: "hmac-sha256",
      } as GenerateHttpSignatureConfig)
    );

    const res = await request("/test");
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("config_error");
  });

  it("should respect skip logic", async () => {
    const { request } = createPolicyTestHarness(
      generateHttpSignature(makeConfig({ skip: () => true })),
      {
        upstream: async (c) => {
          return c.json({
            hasSignature: c.req.header("Signature") !== undefined,
          });
        },
      }
    );

    const res = await request("/test");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { hasSignature: boolean };
    expect(body.hasSignature).toBe(false);
  });

  it("should use custom header names", async () => {
    const { request } = createPolicyTestHarness(
      generateHttpSignature(
        makeConfig({
          signatureHeaderName: "X-Sig",
          signatureInputHeaderName: "X-Sig-Input",
        })
      ),
      {
        upstream: async (c) => {
          return c.json({
            xSig: c.req.header("X-Sig"),
            xSigInput: c.req.header("X-Sig-Input"),
            regularSig: c.req.header("Signature") ?? null,
          });
        },
      }
    );

    const res = await request("/test");
    const body = (await res.json()) as {
      xSig: string;
      xSigInput: string;
      regularSig: string | null;
    };
    expect(body.xSig).toBeTruthy();
    expect(body.xSigInput).toBeTruthy();
    expect(body.regularSig).toBeNull();
  });

  it("should produce a valid signature that can be verified", async () => {
    let capturedSignature = "";
    let capturedInput = "";
    let capturedUrl = "";
    let capturedMethod = "";

    const { request } = createPolicyTestHarness(
      generateHttpSignature(makeConfig()),
      {
        upstream: async (c) => {
          capturedSignature = c.req.header("Signature") ?? "";
          capturedInput = c.req.header("Signature-Input") ?? "";
          capturedUrl = c.req.url;
          capturedMethod = c.req.method;
          return c.json({ ok: true });
        },
      }
    );

    await request("/api/test", { method: "GET" });

    // Parse the captured headers and verify the signature
    const sigMatch = capturedSignature.match(/^sig1=:([A-Za-z0-9+/]+=*):$/);
    expect(sigMatch).toBeTruthy();
    const signatureBytes = fromBase64(sigMatch![1]);

    const inputValue = capturedInput.replace("sig1=", "");
    const { components } = parseSignatureParams(inputValue);

    // Reconstruct the signature base
    const fakeRequest = new Request(capturedUrl, { method: capturedMethod });
    const base = buildSignatureBase(components, inputValue, fakeRequest);

    // Verify using crypto.subtle
    const { importAlg, signAlg } = algorithmToCrypto("hmac-sha256");
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(TEST_SECRET),
      importAlg,
      false,
      ["verify"]
    );
    const valid = await crypto.subtle.verify(
      signAlg,
      key,
      signatureBytes,
      encoder.encode(base)
    );
    expect(valid).toBe(true);
  });

  it("should include algorithm in signature params", async () => {
    const { request } = createPolicyTestHarness(
      generateHttpSignature(makeConfig()),
      {
        upstream: async (c) => {
          return c.json({ signatureInput: c.req.header("Signature-Input") });
        },
      }
    );

    const res = await request("/test");
    const body = (await res.json()) as { signatureInput: string };
    expect(body.signatureInput).toContain('alg="hmac-sha256"');
  });

  it("should include created timestamp in signature params", async () => {
    const now = Math.floor(Date.now() / 1000);
    const { request } = createPolicyTestHarness(
      generateHttpSignature(makeConfig()),
      {
        upstream: async (c) => {
          return c.json({ signatureInput: c.req.header("Signature-Input") });
        },
      }
    );

    const res = await request("/test");
    const body = (await res.json()) as { signatureInput: string };
    const match = body.signatureInput.match(/;created=(\d+)/);
    expect(match).toBeTruthy();
    const created = Number.parseInt(match![1], 10);
    // Should be within 5 seconds of now
    expect(Math.abs(created - now)).toBeLessThan(5);
  });

  it("should handle POST request with body", async () => {
    const { request } = createPolicyTestHarness(
      generateHttpSignature(
        makeConfig({ components: ["@method", "@path", "content-type"] })
      ),
      {
        upstream: async (c) => {
          return c.json({
            signature: c.req.header("Signature"),
            signatureInput: c.req.header("Signature-Input"),
          });
        },
      }
    );

    const res = await request("/api/data", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ foo: "bar" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      signature: string;
      signatureInput: string;
    };
    expect(body.signature).toBeTruthy();
    expect(body.signatureInput).toContain('"content-type"');
  });

  it("should have correct policy name and priority", () => {
    const policy = generateHttpSignature(makeConfig());
    expect(policy.name).toBe("generate-http-signature");
    expect(policy.priority).toBe(95); // Priority.PROXY
  });
});
