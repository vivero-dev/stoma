---
editUrl: false
next: false
prev: false
title: "RateLimiterDO"
---

Defined in: [src/adapters/durable-object.ts:27](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/adapters/durable-object.ts#L27)

Durable Object that maintains an atomic rate limit counter.

Each unique rate limit key maps to one DO instance via `idFromName(key)`.
The counter auto-expires using the DO alarm API.

**Consumer setup**: Export this class from your Worker entry point and
reference it in `wrangler.toml`:

```toml
[[durable_objects.bindings]]
name = "RATE_LIMITER"
class_name = "RateLimiterDO"
```

```ts
// worker entry
export { RateLimiterDO } from "@homegrower-club/stoma/adapters";
```

## Implements

- `DurableObject`

## Constructors

### Constructor

> **new RateLimiterDO**(`state`): `RateLimiterDO`

Defined in: [src/adapters/durable-object.ts:30](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/adapters/durable-object.ts#L30)

#### Parameters

##### state

`DurableObjectState`

#### Returns

`RateLimiterDO`

## Methods

### alarm()

> **alarm**(): `Promise`\<`void`\>

Defined in: [src/adapters/durable-object.ts:60](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/adapters/durable-object.ts#L60)

#### Returns

`Promise`\<`void`\>

#### Implementation of

`DurableObject.alarm`

***

### fetch()

> **fetch**(`request`): `Promise`\<`Response`\>

Defined in: [src/adapters/durable-object.ts:34](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/adapters/durable-object.ts#L34)

#### Parameters

##### request

`Request`

#### Returns

`Promise`\<`Response`\>

#### Implementation of

`DurableObject.fetch`
