---
"@homegrower-club/stoma": patch
---

Production adapters, IPv6 support, security hardening, DX improvements

### Features

- **Redis adapter** (`stoma/adapters/redis`): Production-ready stores for rate limiting (atomic Lua script), circuit breaker (JSON + TTL), and caching (base64 envelope). Zero dependencies — works with ioredis, node-redis v4, or any client satisfying the `RedisClient` interface. Configurable key prefix, selective store enable/disable, and `setWithTTL` override for libraries with different SET signatures.
- **PostgreSQL adapter** (`stoma/adapters/postgres`): Production-ready stores using atomic upsert for rate limiting, JSON rows for circuit breaker state, and base64 body storage for caching. Ships `POSTGRES_SCHEMA_SQL` for one-time table setup. Includes `cleanup()` methods for expired entry removal.
- **IPv6 support**: Full IPv6 parsing in CIDR utilities and IP extraction. `ipFilter` and `geoIpFilter` now correctly handle IPv6 addresses, `::ffff:`-mapped IPv4, and mixed-format CIDR ranges. Extensive test coverage (200+ new CIDR/IP tests).
- **`definePolicy` evaluate support**: All auth policies (jwt-auth, api-key-auth, basic-auth, oauth2, rbac, jws) now expose protocol-agnostic `evaluate.onRequest` alongside the existing Hono `handler`, completing the migration started in rc.1.
- **Runtime adapters now provide stores**: `nodeAdapter()`, `bunAdapter()`, and `denoAdapter()` delegate to `memoryAdapter()` so rate limiting, circuit breaking, and caching work out of the box without additional configuration.

### Security

- **OAuth2 token caching**: Fixed token cache poisoning — cached tokens are now validated against the current request's required scopes, not just the scopes from the original caching request.
- **RBAC header injection**: `rbac` policy now strips any pre-existing role/scope headers from the incoming request before checking authorization, preventing clients from spoofing role claims.
- **IP filter normalization**: IPv4-mapped IPv6 addresses (e.g. `::ffff:10.0.0.1`) are now normalized before matching against CIDR rules, preventing bypass via address format manipulation.

### Fixes

- **`onError` callback type**: Changed from `(error: Error, c: unknown)` to `(error: Error, c: Context)` — enables type-safe access to `c.req`, `c.json()`, etc. in custom error handlers.
- **Durable Object adapter types**: Fixed type mismatches in the DO rate limit store and adapter factory.
- **Request log policy**: Fixed edge case in response body logging.

### DX Improvements

- **New exports from main entry**: `errorToResponse()`, `defaultErrorResponse()`, `safeCall`, `isDebugRequested`, `isTraceRequested`, `noopTraceReporter` — all useful for custom policy authors and error handling customization.
- **`destroy()` on store interfaces**: `CircuitBreakerStore` and `CacheStore` now have an optional `destroy()` method for cleanup, matching the existing pattern on `RateLimitStore`. In-memory implementations clear their state.
- **Vitest Cloudflare pool**: Test runner split into standard and Cloudflare-specific pools (`@cloudflare/vitest-pool-workers`) for Durable Object tests.
- **Docs**: New "Runtime Adapters" guide covering adapter selection, Cloudflare/Redis/Postgres/memory setup, and custom adapter authoring. Validated examples for Redis and Postgres adapters.
