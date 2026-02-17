---
editUrl: false
next: false
prev: false
title: "cache"
---

> **cache**(`config?`): [`Policy`](/api/index/interfaces/policy/)

Defined in: [packages/gateway/src/policies/traffic/cache.ts:209](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/cache.ts#L209)

Cache upstream responses to reduce latency and load.

Sets a cache status header on **every** response:
- `HIT` - served from cache
- `MISS` - fetched from upstream, now cached
- `BYPASS` - upstream Cache-Control directive prevented caching
- `SKIP` - not eligible for caching (wrong method or server error status)

Server error responses (5xx) are never cached. Store failures degrade
gracefully via [safeCall](/api/index/functions/safecall/) - a broken cache store never crashes the
request.

For methods with a request body (POST, PUT, PATCH), the default cache key
includes a SHA-256 hash of the body to prevent key collisions across
different payloads.

## Parameters

### config?

[`CacheConfig`](/api/policies/interfaces/cacheconfig/)

Cache TTL, storage backend, and key strategy. All fields optional.

## Returns

[`Policy`](/api/index/interfaces/policy/)

A [Policy](/api/index/interfaces/policy/) at priority 40.

## Example

```ts
// Simple 5-minute in-memory cache for GET requests
cache({ ttlSeconds: 300 });

// Cache with Vary on Accept-Language and custom store
cache({
  ttlSeconds: 600,
  varyHeaders: ["accept-language"],
  store: new CacheApiCacheStore(caches.default),
});
```
