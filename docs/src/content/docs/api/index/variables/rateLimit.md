---
editUrl: false
next: false
prev: false
title: "rateLimit"
---

> `const` **rateLimit**: (`config`) => [`Policy`](/api/index/interfaces/policy/)

Defined in: [packages/gateway/src/policies/traffic/rate-limit.ts:194](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/rate-limit.ts#L194)

Rate limit requests with pluggable storage backends.

Defaults to client IP extraction via `CF-Connecting-IP` or `X-Forwarded-For`.
Sets standard `X-RateLimit-*` response headers on every request and
throws a 429 when the limit is exceeded.

## Parameters

### config

[`RateLimitConfig`](/api/policies/interfaces/ratelimitconfig/)

Rate limit settings. `max` is required; other fields have sensible defaults.

## Returns

[`Policy`](/api/index/interfaces/policy/)

A [Policy](/api/index/interfaces/policy/) at priority 20 (runs after auth).

## Example

```ts
// 100 requests per minute per IP (in-memory)
rateLimit({ max: 100 });

// Custom key + Cloudflare KV store
rateLimit({
  max: 50,
  windowSeconds: 300,
  keyBy: (c) => c.req.header("x-user-id") ?? "anonymous",
  store: new KVRateLimitStore(env.RATE_LIMIT_KV),
});
```
