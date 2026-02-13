---
editUrl: false
next: false
prev: false
title: "RateLimitStore"
---

Defined in: [src/policies/traffic/rate-limit.ts:38](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/traffic/rate-limit.ts#L38)

Pluggable storage backend for rate limit counters

## Methods

### destroy()?

> `optional` **destroy**(): `void`

Defined in: [src/policies/traffic/rate-limit.ts:45](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/traffic/rate-limit.ts#L45)

Optional: cleanup resources (like intervals) used by the store

#### Returns

`void`

***

### increment()

> **increment**(`key`, `windowSeconds`): `Promise`\<\{ `count`: `number`; `resetAt`: `number`; \}\>

Defined in: [src/policies/traffic/rate-limit.ts:40](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/traffic/rate-limit.ts#L40)

Increment the counter for a key, returning the new count and TTL

#### Parameters

##### key

`string`

##### windowSeconds

`number`

#### Returns

`Promise`\<\{ `count`: `number`; `resetAt`: `number`; \}\>
