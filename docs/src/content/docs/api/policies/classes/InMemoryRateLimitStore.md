---
editUrl: false
next: false
prev: false
title: "InMemoryRateLimitStore"
---

Defined in: [packages/gateway/src/policies/traffic/rate-limit.ts:61](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/rate-limit.ts#L61)

Default in-memory rate limit store backed by a `Map`.

The store is bounded by `maxKeys` (default 100,000) to prevent unbounded
memory growth from unique rate-limit keys. When the store reaches capacity
and no expired entries can be evicted, it **fails closed** - returning
`MAX_SAFE_INTEGER` as the count to trigger rate limiting. This is an
intentional security design: memory safety takes priority over availability.

Note the distinction between store-level and policy-level failure modes:
- **Store at capacity** (this class): fail-closed - reject the request
- **Store throws/times out** (policy handler via `safeCall`): fail-open - allow the request

## Implements

- [`RateLimitStore`](/api/index/interfaces/ratelimitstore/)

## Constructors

### Constructor

> **new InMemoryRateLimitStore**(`options?`): `InMemoryRateLimitStore`

Defined in: [packages/gateway/src/policies/traffic/rate-limit.ts:68](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/rate-limit.ts#L68)

#### Parameters

##### options?

`number` | [`InMemoryRateLimitStoreOptions`](/api/index/interfaces/inmemoryratelimitstoreoptions/)

#### Returns

`InMemoryRateLimitStore`

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [packages/gateway/src/policies/traffic/rate-limit.ts:137](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/rate-limit.ts#L137)

Stop the cleanup interval (for testing)

#### Returns

`void`

#### Implementation of

[`RateLimitStore`](/api/index/interfaces/ratelimitstore/).[`destroy`](/api/index/interfaces/ratelimitstore/#destroy)

***

### increment()

> **increment**(`key`, `windowSeconds`): `Promise`\<\{ `count`: `number`; `resetAt`: `number`; \}\>

Defined in: [packages/gateway/src/policies/traffic/rate-limit.ts:97](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/rate-limit.ts#L97)

Increment the counter for a key within the given time window.

When the store reaches `maxKeys` capacity and no expired entries can
be evicted, returns `{ count: MAX_SAFE_INTEGER, resetAt }` to trigger
rate limiting (fail-closed). This prevents unbounded memory growth at
the cost of potentially rejecting legitimate requests - an intentional
security trade-off where memory safety takes priority over availability.

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

Defined in: [packages/gateway/src/policies/traffic/rate-limit.ts:145](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/rate-limit.ts#L145)

Reset all counters (for testing)

#### Returns

`void`
