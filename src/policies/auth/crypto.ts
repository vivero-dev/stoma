/**
 * Shared cryptographic utilities for auth policies (JWT, JWS).
 *
 * Consolidates base64url encoding/decoding, HMAC/RSA algorithm mapping,
 * and JWKS fetching with a unified cache. Extracted to avoid duplication
 * between jwt-auth and jws.
 *
 * @module auth/crypto
 */
import { GatewayError } from "../../core/errors";

// --- Base64URL ---

/** Decode a base64url string to a UTF-8 string. */
export function base64UrlDecode(str: string): string {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const paddedLength = padded + "=".repeat((4 - (padded.length % 4)) % 4);
  return atob(paddedLength);
}

/** Decode a base64url string to a Uint8Array. */
export function base64UrlToBuffer(str: string): Uint8Array {
  const binary = base64UrlDecode(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Encode a Uint8Array to a base64url string (no padding). */
export function base64UrlEncodeBytes(data: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Encode a string to a base64url string (no padding). */
export function base64UrlEncodeString(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// --- Algorithm mapping ---

/** Map a JWT/JWS HMAC algorithm string to a WebCrypto hash name. Returns `null` for unsupported algorithms. */
export function hmacAlgorithm(alg: string): string | null {
  switch (alg) {
    case "HS256":
      return "SHA-256";
    case "HS384":
      return "SHA-384";
    case "HS512":
      return "SHA-512";
    default:
      return null;
  }
}

/** Map a JWT/JWS RSA algorithm string to WebCrypto import parameters. Returns `null` for unsupported algorithms. */
export function rsaAlgorithm(
  alg: string
): { name: string; hash: string } | null {
  switch (alg) {
    case "RS256":
      return { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" };
    case "RS384":
      return { name: "RSASSA-PKCS1-v1_5", hash: "SHA-384" };
    case "RS512":
      return { name: "RSASSA-PKCS1-v1_5", hash: "SHA-512" };
    default:
      return null;
  }
}

// --- JWKS fetching + cache ---

const DEFAULT_JWKS_CACHE_TTL_MS = 300_000; // 5 minutes
const DEFAULT_JWKS_TIMEOUT_MS = 10_000; // 10 seconds

/** Unified JWKS cache shared between jwt-auth and jws. */
const jwksCache = new Map<string, { keys: JsonWebKey[]; expiresAt: number }>();

/**
 * Fetch and cache a JWKS endpoint.
 *
 * @param url - The JWKS endpoint URL.
 * @param cacheTtlMs - Cache TTL in milliseconds. Default: 300000 (5 minutes).
 * @param timeoutMs - Fetch timeout in milliseconds. Default: 10000 (10 seconds).
 * @returns An array of JWK keys from the endpoint.
 * @throws {GatewayError} 502 on fetch failure or timeout.
 */
export async function fetchJwks(
  url: string,
  cacheTtlMs?: number,
  timeoutMs?: number
): Promise<JsonWebKey[]> {
  const cached = jwksCache.get(url);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.keys;
  }

  const timeout = timeoutMs ?? DEFAULT_JWKS_TIMEOUT_MS;
  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(timeout) });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new GatewayError(
        502,
        "jwks_error",
        `JWKS fetch timed out after ${timeout}ms: ${url}`
      );
    }
    throw new GatewayError(
      502,
      "jwks_error",
      `Failed to fetch JWKS from ${url}: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (!response.ok) {
    throw new GatewayError(
      502,
      "jwks_error",
      `Failed to fetch JWKS from ${url}: ${response.status}`
    );
  }

  const ttl = cacheTtlMs ?? DEFAULT_JWKS_CACHE_TTL_MS;
  const data = (await response.json()) as { keys: JsonWebKey[] };
  jwksCache.set(url, { keys: data.keys, expiresAt: Date.now() + ttl });
  return data.keys;
}

/** Clear the unified JWKS cache. Exported for testing. */
export function clearJwksCache(): void {
  jwksCache.clear();
}
