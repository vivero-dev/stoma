/**
 * Entry point for the Stoma ESM bundle used by the editor's in-browser compiler.
 *
 * Re-exports everything the editor user might need from Stoma, Hono adapters,
 * and the IDB rate limit store used in the playground. This gets bundled into
 * a single self-contained ESM file at `public/stoma-bundle.esm.js`.
 */

// Core Stoma API - everything from the main entry point
export * from "@homegrower-club/stoma";

// Adapters users might reference
export { CacheApiCacheStore } from "@homegrower-club/stoma/adapters/cloudflare";
export { memoryAdapter } from "@homegrower-club/stoma/adapters/memory";

// SDK for custom policy authors
export * as sdk from "@homegrower-club/stoma/sdk";

// IDB rate limit store used by the playground gateway config
export { IDBRateLimitStore } from "../playground/stores/idb-rate-limit-store";
