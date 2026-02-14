---
editUrl: false
next: false
prev: false
title: "DurableObjectRateLimitStore"
---

Defined in: [src/adapters/durable-object.ts:94](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/adapters/durable-object.ts#L94)

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

Defined in: [src/adapters/durable-object.ts:95](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/adapters/durable-object.ts#L95)

#### Parameters

##### namespace

`DurableObjectNamespace`

#### Returns

`DurableObjectRateLimitStore`

## Methods

### increment()

> **increment**(`key`, `windowSeconds`): `Promise`\<\{ `count`: `number`; `resetAt`: `number`; \}\>

Defined in: [src/adapters/durable-object.ts:97](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/adapters/durable-object.ts#L97)

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
