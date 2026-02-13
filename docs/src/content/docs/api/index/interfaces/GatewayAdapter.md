---
editUrl: false
next: false
prev: false
title: "GatewayAdapter"
---

Defined in: [packages/stoma/src/adapters/types.ts:6](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/adapters/types.ts#L6)

Bag of optional store implementations and runtime capabilities for a given runtime.

## Properties

### cacheStore?

> `optional` **cacheStore**: [`CacheStore`](/api/index/interfaces/cachestore/)

Defined in: [packages/stoma/src/adapters/types.ts:9](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/adapters/types.ts#L9)

***

### circuitBreakerStore?

> `optional` **circuitBreakerStore**: [`CircuitBreakerStore`](/api/index/interfaces/circuitbreakerstore/)

Defined in: [packages/stoma/src/adapters/types.ts:8](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/adapters/types.ts#L8)

***

### dispatchBinding()?

> `optional` **dispatchBinding**: (`service`, `request`) => `Promise`\<`Response`\>

Defined in: [packages/stoma/src/adapters/types.ts:14](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/adapters/types.ts#L14)

Dispatch a request to a named service binding or sidecar.

#### Parameters

##### service

`string`

##### request

`Request`

#### Returns

`Promise`\<`Response`\>

***

### rateLimitStore?

> `optional` **rateLimitStore**: [`RateLimitStore`](/api/index/interfaces/ratelimitstore/)

Defined in: [packages/stoma/src/adapters/types.ts:7](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/adapters/types.ts#L7)

***

### waitUntil()?

> `optional` **waitUntil**: (`promise`) => `void`

Defined in: [packages/stoma/src/adapters/types.ts:12](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/adapters/types.ts#L12)

Schedule background work that outlives the response (e.g. Cloudflare `executionCtx.waitUntil`).

#### Parameters

##### promise

`Promise`\<`unknown`\>

#### Returns

`void`
