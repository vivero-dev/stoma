import { afterEach, describe, expect, it, vi } from "vitest";
import {
  base64UrlDecode,
  base64UrlEncodeBytes,
  base64UrlToBuffer,
  clearJwksCache,
  fetchJwks,
  hmacAlgorithm,
  rsaAlgorithm,
} from "../crypto";

describe("auth/crypto", () => {
  afterEach(() => {
    clearJwksCache();
    vi.restoreAllMocks();
  });

  // --- base64url ---

  describe("base64UrlDecode", () => {
    it("should decode a base64url string", () => {
      // "Hello" in base64url is "SGVsbG8"
      expect(base64UrlDecode("SGVsbG8")).toBe("Hello");
    });

    it("should handle padding-needed strings", () => {
      // "Hi" in base64url is "SGk" (needs padding)
      expect(base64UrlDecode("SGk")).toBe("Hi");
    });

    it("should handle url-safe characters", () => {
      // Characters that differ between base64 and base64url
      const decoded = base64UrlDecode("eyJhbGciOiJub25lIn0");
      expect(decoded).toBe('{"alg":"none"}');
    });
  });

  describe("base64UrlToBuffer", () => {
    it("should decode to a Uint8Array", () => {
      const buf = base64UrlToBuffer("SGVsbG8");
      expect(buf).toBeInstanceOf(Uint8Array);
      expect(buf.length).toBe(5);
      expect(buf[0]).toBe(72); // 'H'
    });
  });

  describe("base64UrlEncodeBytes", () => {
    it("should encode a Uint8Array to base64url", () => {
      const input = new TextEncoder().encode("Hello");
      const encoded = base64UrlEncodeBytes(input);
      expect(encoded).toBe("SGVsbG8");
    });

    it("should not include padding", () => {
      const input = new TextEncoder().encode("Hi");
      const encoded = base64UrlEncodeBytes(input);
      expect(encoded).not.toContain("=");
    });

    it("should roundtrip", () => {
      const original = "test data for roundtrip";
      const encoded = base64UrlEncodeBytes(new TextEncoder().encode(original));
      const decoded = base64UrlDecode(encoded);
      expect(decoded).toBe(original);
    });
  });

  // --- algorithm mapping ---

  describe("hmacAlgorithm", () => {
    it("should map HS256 to SHA-256", () => {
      expect(hmacAlgorithm("HS256")).toBe("SHA-256");
    });

    it("should map HS384 to SHA-384", () => {
      expect(hmacAlgorithm("HS384")).toBe("SHA-384");
    });

    it("should map HS512 to SHA-512", () => {
      expect(hmacAlgorithm("HS512")).toBe("SHA-512");
    });

    it("should return null for unsupported algorithms", () => {
      expect(hmacAlgorithm("RS256")).toBeNull();
      expect(hmacAlgorithm("none")).toBeNull();
      expect(hmacAlgorithm("ES256")).toBeNull();
    });
  });

  describe("rsaAlgorithm", () => {
    it("should map RS256 to RSASSA-PKCS1-v1_5 SHA-256", () => {
      expect(rsaAlgorithm("RS256")).toEqual({
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256",
      });
    });

    it("should map RS384 to RSASSA-PKCS1-v1_5 SHA-384", () => {
      expect(rsaAlgorithm("RS384")).toEqual({
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-384",
      });
    });

    it("should map RS512 to RSASSA-PKCS1-v1_5 SHA-512", () => {
      expect(rsaAlgorithm("RS512")).toEqual({
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-512",
      });
    });

    it("should return null for unsupported algorithms", () => {
      expect(rsaAlgorithm("HS256")).toBeNull();
      expect(rsaAlgorithm("ES256")).toBeNull();
    });
  });

  // --- JWKS fetch ---

  describe("fetchJwks", () => {
    it("should fetch and cache JWKS keys", async () => {
      const mockKeys = [{ kty: "RSA", kid: "test-1" }];
      let fetchCount = 0;

      vi.stubGlobal("fetch", async () => {
        fetchCount++;
        return new Response(JSON.stringify({ keys: mockKeys }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      });

      const keys1 = await fetchJwks(
        "https://example.com/.well-known/jwks.json"
      );
      expect(keys1).toEqual(mockKeys);
      expect(fetchCount).toBe(1);

      // Second call should use cache
      const keys2 = await fetchJwks(
        "https://example.com/.well-known/jwks.json"
      );
      expect(keys2).toEqual(mockKeys);
      expect(fetchCount).toBe(1);
    });

    it("should throw GatewayError on non-200 response", async () => {
      vi.stubGlobal("fetch", async () => {
        return new Response("Not Found", { status: 404 });
      });

      await expect(
        fetchJwks("https://example.com/.well-known/jwks.json")
      ).rejects.toThrow("Failed to fetch JWKS");
    });

    it("should throw GatewayError on timeout", async () => {
      vi.stubGlobal("fetch", async (_url: string, opts?: RequestInit) => {
        // Simulate AbortSignal timeout
        if (opts?.signal) {
          const error = new DOMException(
            "The operation was aborted.",
            "TimeoutError"
          );
          throw error;
        }
        return new Response("ok");
      });

      await expect(
        fetchJwks("https://example.com/.well-known/jwks.json", undefined, 100)
      ).rejects.toThrow("JWKS fetch timed out");
    });

    it("should use different cache entries per URL", async () => {
      const keys1 = [{ kty: "RSA", kid: "url1" }];
      const keys2 = [{ kty: "RSA", kid: "url2" }];

      vi.stubGlobal("fetch", async (url: string | Request) => {
        const urlStr = typeof url === "string" ? url : url.url;
        const keys = urlStr.includes("url1") ? keys1 : keys2;
        return new Response(JSON.stringify({ keys }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      });

      const result1 = await fetchJwks("https://example.com/url1/jwks.json");
      const result2 = await fetchJwks("https://example.com/url2/jwks.json");
      expect((result1[0] as JsonWebKey & { kid: string }).kid).toBe("url1");
      expect((result2[0] as JsonWebKey & { kid: string }).kid).toBe("url2");
    });

    it("should respect clearJwksCache", async () => {
      let fetchCount = 0;
      vi.stubGlobal("fetch", async () => {
        fetchCount++;
        return new Response(JSON.stringify({ keys: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      });

      await fetchJwks("https://example.com/jwks.json");
      expect(fetchCount).toBe(1);

      clearJwksCache();

      await fetchJwks("https://example.com/jwks.json");
      expect(fetchCount).toBe(2);
    });
  });
});
