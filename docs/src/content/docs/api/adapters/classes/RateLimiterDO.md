---
editUrl: false
next: false
prev: false
title: "RateLimiterDO"
---

Defined in: [packages/gateway/src/adapters/durable-object.ts:34](https://github.com/HomeGrower-club/stoma/blob/b366835e3781c3a030f80027e784272dddf630da/packages/gateway/src/adapters/durable-object.ts#L34)

Durable Object that maintains an atomic rate limit counter.

Each unique rate limit key maps to one DO instance via `idFromName(key)`.
The counter auto-expires using the DO alarm API.

**Consumer setup**: Export this class from your Worker entry point and
reference it in `wrangler.jsonc`:

```jsonc
{
  "durable_objects": {
    "bindings": [
      {
        "name": "RATE_LIMITER",
        "class_name": "RateLimiterDO"
      }
    ]
  }
}
```

```ts
// worker entry
export { RateLimiterDO } from "@vivero/stoma/adapters";
```

## Implements

- `DurableObject`

## Constructors

### Constructor

> **new RateLimiterDO**(`state`): `RateLimiterDO`

Defined in: [packages/gateway/src/adapters/durable-object.ts:37](https://github.com/HomeGrower-club/stoma/blob/b366835e3781c3a030f80027e784272dddf630da/packages/gateway/src/adapters/durable-object.ts#L37)

#### Parameters

##### state

`DurableObjectState`

#### Returns

`RateLimiterDO`

## Methods

### alarm()

> **alarm**(): `Promise`\<`void`\>

Defined in: [packages/gateway/src/adapters/durable-object.ts:73](https://github.com/HomeGrower-club/stoma/blob/b366835e3781c3a030f80027e784272dddf630da/packages/gateway/src/adapters/durable-object.ts#L73)

#### Returns

`Promise`\<`void`\>

#### Implementation of

`DurableObject.alarm`

***

### fetch()

> **fetch**(`request`): `Promise`\<`Response`\>

Defined in: [packages/gateway/src/adapters/durable-object.ts:41](https://github.com/HomeGrower-club/stoma/blob/b366835e3781c3a030f80027e784272dddf630da/packages/gateway/src/adapters/durable-object.ts#L41)

#### Parameters

##### request

`Request`

#### Returns

`Promise`\<`Response`\>

#### Implementation of

`DurableObject.fetch`
