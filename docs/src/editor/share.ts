/**
 * URL compression utilities for shareable editor links.
 *
 * Uses lz-string for URL-safe compression (60-70% reduction on TypeScript source).
 * New share links use the hash fragment (#code=...) to avoid server round-trips.
 * Legacy EditorLink URLs use query params (?code=base64) and remain supported.
 */
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";

export function compressCode(code: string): string {
  return compressToEncodedURIComponent(code);
}

export function decompressCode(compressed: string): string | null {
  return decompressFromEncodedURIComponent(compressed);
}

export function buildShareUrl(code: string, title?: string): string {
  const hash = new URLSearchParams();
  hash.set("code", compressCode(code));
  if (title) hash.set("title", title);
  return `${window.location.origin}/editor#${hash.toString()}`;
}
