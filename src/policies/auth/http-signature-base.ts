/**
 * Shared utilities for RFC 9421 HTTP Message Signatures.
 *
 * Builds the signature base string and provides crypto helpers
 * used by both `generateHttpSignature` and `verifyHttpSignature`.
 *
 * @module http-signature-base
 */

/**
 * Resolve a derived component value from the request per RFC 9421 Section 2.2.
 */
function resolveDerivedComponent(
  componentId: string,
  request: Request
): string {
  const url = new URL(request.url);
  switch (componentId) {
    case "@method":
      return request.method.toUpperCase();
    case "@path":
      return url.pathname;
    case "@authority":
      return url.host;
    case "@scheme":
      return url.protocol.replace(":", "");
    case "@target-uri":
      return url.href;
    default:
      throw new Error(`Unknown derived component: ${componentId}`);
  }
}

/**
 * Resolve a component value - derived (`@method`, `@path`, etc.) or
 * regular header name (lowercased).
 */
function resolveComponentValue(componentId: string, request: Request): string {
  if (componentId.startsWith("@")) {
    return resolveDerivedComponent(componentId, request);
  }
  // Regular header component - value from request headers
  return request.headers.get(componentId) ?? "";
}

/**
 * Build the signature base string per RFC 9421 Section 2.5.
 *
 * Each line is `"component-id": value`, ending with `"@signature-params": <params>`.
 */
export function buildSignatureBase(
  components: string[],
  signatureParams: string,
  request: Request
): string {
  const lines: string[] = [];
  for (const component of components) {
    const value = resolveComponentValue(component, request);
    lines.push(`"${component}": ${value}`);
  }
  lines.push(`"@signature-params": ${signatureParams}`);
  return lines.join("\n");
}

/**
 * Build the signature params string.
 *
 * Format: `("@method" "@path" ...);created=<ts>;keyid="<id>"[;expires=<ts>][;nonce="<n>"]`
 */
export function buildSignatureParams(
  components: string[],
  params: {
    created: number;
    keyId: string;
    expires?: number;
    nonce?: string;
    algorithm?: string;
  }
): string {
  const componentList = components.map((c) => `"${c}"`).join(" ");
  let result = `(${componentList});created=${params.created};keyid="${params.keyId}"`;
  if (params.algorithm) {
    result += `;alg="${params.algorithm}"`;
  }
  if (params.expires !== undefined) {
    result += `;expires=${params.expires}`;
  }
  if (params.nonce !== undefined) {
    result += `;nonce="${params.nonce}"`;
  }
  return result;
}

/**
 * Parse a signature params string from the Signature-Input header.
 *
 * Input: `("@method" "@path" "content-type");created=1618884473;keyid="test-key"`
 * Returns the component list and key-value parameters.
 */
export function parseSignatureParams(input: string): {
  components: string[];
  params: Record<string, string>;
} {
  // Extract the component list inside parentheses
  const parenMatch = input.match(/^\(([^)]*)\)/);
  if (!parenMatch) {
    throw new Error("Invalid signature params: missing component list");
  }

  const componentStr = parenMatch[1];
  const components = componentStr
    ? (componentStr.match(/"([^"]+)"/g)?.map((s) => s.slice(1, -1)) ?? [])
    : [];

  // Parse params after the closing paren
  const paramStr = input.slice(parenMatch[0].length);
  const params: Record<string, string> = {};
  const paramRegex = /;(\w+)=("([^"]*)"|(\d+))/g;
  let match: RegExpExecArray | null = paramRegex.exec(paramStr);
  while (match !== null) {
    // match[3] is quoted string value, match[4] is unquoted numeric value
    params[match[1]] = match[3] ?? match[4];
    match = paramRegex.exec(paramStr);
  }

  return { components, params };
}

/** Map algorithm identifier to Web Crypto params for import + sign/verify. */
export function algorithmToCrypto(alg: string): {
  importAlg: Parameters<typeof crypto.subtle.importKey>[2];
  signAlg: Parameters<typeof crypto.subtle.sign>[0];
} {
  switch (alg) {
    case "hmac-sha256":
      return {
        importAlg: { name: "HMAC", hash: "SHA-256" },
        signAlg: "HMAC",
      };
    case "rsa-v1_5-sha256":
      return {
        importAlg: { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        signAlg: "RSASSA-PKCS1-v1_5",
      };
    case "rsa-pss-sha512":
      return {
        importAlg: { name: "RSA-PSS", hash: "SHA-512" },
        signAlg: { name: "RSA-PSS", saltLength: 64 },
      };
    default:
      throw new Error(`Unsupported signature algorithm: ${alg}`);
  }
}

/**
 * Import key material for signing.
 */
export async function importSigningKey(
  algorithm: string,
  secret?: string,
  privateKey?: JsonWebKey
): Promise<CryptoKey> {
  const { importAlg } = algorithmToCrypto(algorithm);

  if (algorithm.startsWith("hmac")) {
    if (!secret) throw new Error("HMAC algorithm requires secret");
    const encoder = new TextEncoder();
    return crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      importAlg,
      false,
      ["sign"]
    );
  }

  if (!privateKey) throw new Error("RSA algorithm requires privateKey");
  return crypto.subtle.importKey("jwk", privateKey, importAlg, false, ["sign"]);
}

/**
 * Import key material for verification.
 */
export async function importVerifyKey(
  algorithm: string,
  secret?: string,
  publicKey?: JsonWebKey
): Promise<CryptoKey> {
  const { importAlg } = algorithmToCrypto(algorithm);

  if (algorithm.startsWith("hmac")) {
    if (!secret) throw new Error("HMAC algorithm requires secret");
    const encoder = new TextEncoder();
    return crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      importAlg,
      false,
      ["verify"]
    );
  }

  if (!publicKey) throw new Error("RSA algorithm requires publicKey");
  return crypto.subtle.importKey("jwk", publicKey, importAlg, false, [
    "verify",
  ]);
}

/** Encode bytes to standard base64. */
export function toBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

/** Decode standard base64 to bytes. */
export function fromBase64(str: string): Uint8Array {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
