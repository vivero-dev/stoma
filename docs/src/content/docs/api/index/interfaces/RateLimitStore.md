---
editUrl: false
next: false
prev: false
title: "RateLimitStore"
---

Defined in: [src/policies/traffic/rate-limit.ts:30](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/policies/traffic/rate-limit.ts#L30)

Pluggable storage backend for rate limit counters

## Methods

### destroy()?

> `optional` **destroy**(): `void`

Defined in: [src/policies/traffic/rate-limit.ts:34](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/policies/traffic/rate-limit.ts#L34)

Optional: cleanup resources (like intervals) used by the store

#### Returns

`void`

***

### increment()

> **increment**(`key`, `windowSeconds`): `Promise`\<\{ `count`: `number`; `resetAt`: `number`; \}\>

Defined in: [src/policies/traffic/rate-limit.ts:32](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/policies/traffic/rate-limit.ts#L32)

Increment the counter for a key, returning the new count and TTL

#### Parameters

##### key

`string`

##### windowSeconds

`number`

#### Returns

`Promise`\<\{ `count`: `number`; `resetAt`: `number`; \}\>
