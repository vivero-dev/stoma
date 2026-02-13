---
editUrl: false
next: false
prev: false
title: "DurableObjectRateLimitStore"
---

Defined in: [src/adapters/durable-object.ts:87](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/adapters/durable-object.ts#L87)

Rate limit store backed by a Durable Object.

Each rate limit key maps to a unique DO instance, providing strongly
consistent atomic counters that survive Worker eviction and work
across isolates.

## Example

```ts
import { DurableObjectRateLimitStore } from "@homegrower-club/stoma/adapters";

const store = new DurableObjectRateLimitStore(env.RATE_LIMITER);
rateLimit({ max: 100, store });
```

## Implements

- [`RateLimitStore`](/api/index/interfaces/ratelimitstore/)

## Constructors

### Constructor

> **new DurableObjectRateLimitStore**(`namespace`): `DurableObjectRateLimitStore`

Defined in: [src/adapters/durable-object.ts:88](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/adapters/durable-object.ts#L88)

#### Parameters

##### namespace

`DurableObjectNamespace`

#### Returns

`DurableObjectRateLimitStore`

## Methods

### increment()

> **increment**(`key`, `windowSeconds`): `Promise`\<\{ `count`: `number`; `resetAt`: `number`; \}\>

Defined in: [src/adapters/durable-object.ts:90](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/adapters/durable-object.ts#L90)

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
