---
editUrl: false
next: false
prev: false
title: "InMemoryRateLimitStore"
---

Defined in: [src/policies/traffic/rate-limit.ts:56](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/traffic/rate-limit.ts#L56)

Sliding-window rate limiting with pluggable counter storage (priority 20).

## Implements

- [`RateLimitStore`](/api/index/interfaces/ratelimitstore/)

## Constructors

### Constructor

> **new InMemoryRateLimitStore**(`options?`): `InMemoryRateLimitStore`

Defined in: [src/policies/traffic/rate-limit.ts:63](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/traffic/rate-limit.ts#L63)

#### Parameters

##### options?

`number` | [`InMemoryRateLimitStoreOptions`](/api/index/interfaces/inmemoryratelimitstoreoptions/)

#### Returns

`InMemoryRateLimitStore`

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [src/policies/traffic/rate-limit.ts:123](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/traffic/rate-limit.ts#L123)

Stop the cleanup interval (for testing)

#### Returns

`void`

#### Implementation of

[`RateLimitStore`](/api/index/interfaces/ratelimitstore/).[`destroy`](/api/index/interfaces/ratelimitstore/#destroy)

***

### increment()

> **increment**(`key`, `windowSeconds`): `Promise`\<\{ `count`: `number`; `resetAt`: `number`; \}\>

Defined in: [src/policies/traffic/rate-limit.ts:83](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/traffic/rate-limit.ts#L83)

Increment the counter for a key, returning the new count and TTL

#### Parameters

##### key

`string`

##### windowSeconds

`number`

#### Returns

`Promise`\<\{ `count`: `number`; `resetAt`: `number`; \}\>

#### Implementation of

[`RateLimitStore`](/api/index/interfaces/ratelimitstore/).[`increment`](/api/index/interfaces/ratelimitstore/#increment)

***

### reset()

> **reset**(): `void`

Defined in: [src/policies/traffic/rate-limit.ts:131](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/traffic/rate-limit.ts#L131)

Reset all counters (for testing)

#### Returns

`void`
