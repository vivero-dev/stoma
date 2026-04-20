---
"@vivero/stoma": patch
"@vivero/stoma-cli": patch
"@vivero/stoma-core": patch
---

Bug fixes, test infrastructure, yarn → pnpm migration

### Bug Fixes

- **Circuit breaker**: `recordSuccess` now resets `failureCount` (was tracking total failures instead of consecutive). Transition to `half-open` now resets `failureCount` for a clean probe phase.
- **Error responses**: `errorToResponse` clamps invalid HTTP status codes (< 100 or > 599) to 500, preventing `Response` constructor crashes.
- **IP extraction**: `trustedProxies` now validates the rightmost IP (the proxy) in `X-Forwarded-For` instead of the leftmost (the client), fixing a bug that made the feature non-functional. Empty `trustedProxies` array is now treated as "not configured" instead of rejecting all IPs.
- **Redact utility**: `redactFields` no longer crashes on objects containing non-serializable values (Symbols, functions) — falls back to JSON clone when `structuredClone` fails.
- **SDK helpers**: `setDebugHeader` silently ignores empty/whitespace header names.
- **Storage adapter** (analytics): Path traversal prevention — all operations now validate that resolved paths stay within `basePath`. Also fixes `list()` crash on file prefixes (ENOTDIR), empty key handling, and empty parent directory cleanup on delete.
- **Parser guards** (analytics): `parseStandardLine` and `parseWorkersTraceEvent` no longer crash on non-string input. `isValidEntry` rejects `NaN` numeric values via `Number.isFinite()`.
- **File tracker** (analytics): Negative `maxKeys` no longer silently truncates all tracked keys.

### Infrastructure

- **yarn → pnpm**: Migrated the monorepo from Yarn v4 to pnpm v10. Simplified the publish script from `yarn pack` + `npm publish` workaround to direct `pnpm publish` (native workspace protocol resolution + provenance support). Updated all CI workflows, setup-env action, and documentation.
- **Unified test runner**: Single `vitest run` from root via `vitest.config.ts` with `test.projects`, replacing `yarn workspaces foreach` which swallowed output. Cloudflare Workers durable-object tests now run in CI alongside all other tests.
- **Vitest v4 + Cloudflare pool v0.14**: Bumped vitest to 4.1.4 and `@cloudflare/vitest-pool-workers` to 0.14.7 across all packages. Renamed `vitest.cloudflare.ts` → `vitest.cloudflare.config.ts` to match vitest v4 project naming requirements.
