---
editUrl: false
next: false
prev: false
title: "rateLimit"
---

> `const` **rateLimit**: (`config?`) => [`Policy`](/api/index/interfaces/policy/)

Defined in: [src/policies/traffic/rate-limit.ts:194](https://github.com/HomeGrower-club/stoma/blob/8ff27bd832ace97bceae4b05831dd71d1ac6ed6a/src/policies/traffic/rate-limit.ts#L194)

Rate limit requests with pluggable storage backends.

Defaults to client IP extraction via `CF-Connecting-IP` or `X-Forwarded-For`.
Sets standard `X-RateLimit-*` response headers on every request and
throws a 429 when the limit is exceeded.

## Parameters

### config?

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
