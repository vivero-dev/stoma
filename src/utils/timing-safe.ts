/**
 * Constant-time string comparison to prevent timing side-channel attacks.
 *
 * Use this when comparing secrets (API keys, tokens, HMAC digests) to
 * prevent an attacker from inferring the correct value by measuring
 * response time differences.
 *
 * @module timing-safe
 */

/**
 * Compare two strings in constant time.
 *
 * Returns `true` if `a` and `b` are identical, `false` otherwise.
 * The comparison always examines every byte of the longer string,
 * preventing timing side-channels that leak prefix information.
 *
 * @param a - First string to compare.
 * @param b - Second string to compare.
 * @returns `true` if the strings are identical.
 *
 * @example
 * ```ts
 * import { timingSafeEqual } from "@homegrower-club/stoma";
 *
 * // Use in API key validators to prevent timing attacks
 * const isValid = timingSafeEqual(providedKey, storedKey);
 * ```
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);

  // Length mismatch - still compare to avoid early exit timing leak
  const maxLen = Math.max(bufA.length, bufB.length);
  let mismatch = bufA.length !== bufB.length ? 1 : 0;

  for (let i = 0; i < maxLen; i++) {
    // Use 0 as fallback for shorter buffer - still accumulates XOR
    const byteA = i < bufA.length ? bufA[i] : 0;
    const byteB = i < bufB.length ? bufB[i] : 0;
    mismatch |= byteA ^ byteB;
  }

  return mismatch === 0;
}
