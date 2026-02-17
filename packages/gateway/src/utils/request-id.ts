/**
 * Generate a unique request ID using the Web Crypto API.
 *
 * Returns a v4 UUID. Available in Cloudflare Workers, Deno, Node 19+,
 * and modern browsers.
 *
 * @returns A v4 UUID string (e.g. `"a1b2c3d4-e5f6-7890-abcd-ef1234567890"`).
 */
export function generateRequestId(): string {
  return crypto.randomUUID();
}
