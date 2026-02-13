---
editUrl: false
next: false
prev: false
title: "InMemoryRateLimitStore"
---

Defined in: [src/policies/traffic/rate-limit.ts:45](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/policies/traffic/rate-limit.ts#L45)

Sliding-window rate limiting with pluggable counter storage (priority 20).

## Implements

- [`RateLimitStore`](/api/index/interfaces/ratelimitstore/)

## Constructors

### Constructor

> **new InMemoryRateLimitStore**(`options?`): `InMemoryRateLimitStore`

Defined in: [src/policies/traffic/rate-limit.ts:52](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/policies/traffic/rate-limit.ts#L52)

#### Parameters

##### options?

`number` | [`InMemoryRateLimitStoreOptions`](/api/index/interfaces/inmemoryratelimitstoreoptions/)

#### Returns

`InMemoryRateLimitStore`

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [src/policies/traffic/rate-limit.ts:106](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/policies/traffic/rate-limit.ts#L106)

Stop the cleanup interval (for testing)

#### Returns

`void`

#### Implementation of

[`RateLimitStore`](/api/index/interfaces/ratelimitstore/).[`destroy`](/api/index/interfaces/ratelimitstore/#destroy)

***

### increment()

> **increment**(`key`, `windowSeconds`): `Promise`\<\{ `count`: `number`; `resetAt`: `number`; \}\>

Defined in: [src/policies/traffic/rate-limit.ts:69](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/policies/traffic/rate-limit.ts#L69)

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

Defined in: [src/policies/traffic/rate-limit.ts:114](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/policies/traffic/rate-limit.ts#L114)

Reset all counters (for testing)

#### Returns

`void`
