---
editUrl: false
next: false
prev: false
title: "DurableObjectRateLimitStore"
---

Defined in: [packages/gateway/src/adapters/durable-object.ts:100](https://github.com/HomeGrower-club/stoma/blob/b366835e3781c3a030f80027e784272dddf630da/packages/gateway/src/adapters/durable-object.ts#L100)

Rate limit store backed by a Durable Object.

Each rate limit key maps to a unique DO instance, providing strongly
consistent atomic counters that survive Worker eviction and work
across isolates.

## Example

```ts
import { DurableObjectRateLimitStore } from "@vivero/stoma/adapters";

const store = new DurableObjectRateLimitStore(env.RATE_LIMITER);
rateLimit({ max: 100, store });
```

## Implements

- [`RateLimitStore`](/api/index/interfaces/ratelimitstore/)

## Constructors

### Constructor

> **new DurableObjectRateLimitStore**(`namespace`): `DurableObjectRateLimitStore`

Defined in: [packages/gateway/src/adapters/durable-object.ts:101](https://github.com/HomeGrower-club/stoma/blob/b366835e3781c3a030f80027e784272dddf630da/packages/gateway/src/adapters/durable-object.ts#L101)

#### Parameters

##### namespace

`DurableObjectNamespace`

#### Returns

`DurableObjectRateLimitStore`

## Methods

### increment()

> **increment**(`key`, `windowSeconds`): `Promise`\<\{ `count`: `number`; `resetAt`: `number`; \}\>

Defined in: [packages/gateway/src/adapters/durable-object.ts:103](https://github.com/HomeGrower-club/stoma/blob/b366835e3781c3a030f80027e784272dddf630da/packages/gateway/src/adapters/durable-object.ts#L103)

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
