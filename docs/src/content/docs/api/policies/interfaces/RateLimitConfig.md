---
editUrl: false
next: false
prev: false
title: "RateLimitConfig"
---

Defined in: [packages/gateway/src/policies/traffic/rate-limit.ts:12](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/rate-limit.ts#L12)

Configuration for the rateLimit policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### ipHeaders?

> `optional` **ipHeaders**: `string`[]

Defined in: [packages/gateway/src/policies/traffic/rate-limit.ts:26](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/rate-limit.ts#L26)

Ordered list of headers to inspect for the client IP (when `keyBy` is not set). Default: `["cf-connecting-ip", "x-forwarded-for"]`.

***

### keyBy()?

> `optional` **keyBy**: (`c`) => `string` \| `Promise`\<`string`\>

Defined in: [packages/gateway/src/policies/traffic/rate-limit.ts:18](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/rate-limit.ts#L18)

Key extractor - determines the rate limit bucket. Default: client IP.

#### Parameters

##### c

`Context`

#### Returns

`string` \| `Promise`\<`string`\>

***

### max

> **max**: `number`

Defined in: [packages/gateway/src/policies/traffic/rate-limit.ts:14](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/rate-limit.ts#L14)

Maximum requests per window

***

### message?

> `optional` **message**: `string`

Defined in: [packages/gateway/src/policies/traffic/rate-limit.ts:24](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/rate-limit.ts#L24)

Custom response body when limited

***

### skip()?

> `optional` **skip**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [packages/gateway/src/policies/types.ts:90](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/types.ts#L90)

Skip this policy when condition returns true

#### Parameters

##### c

`unknown`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

#### Inherited from

[`PolicyConfig`](/api/index/interfaces/policyconfig/).[`skip`](/api/index/interfaces/policyconfig/#skip)

***

### statusCode?

> `optional` **statusCode**: `number`

Defined in: [packages/gateway/src/policies/traffic/rate-limit.ts:22](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/rate-limit.ts#L22)

Response status code when limited. Default: 429.

***

### store?

> `optional` **store**: [`RateLimitStore`](/api/index/interfaces/ratelimitstore/)

Defined in: [packages/gateway/src/policies/traffic/rate-limit.ts:20](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/rate-limit.ts#L20)

Storage backend for counters

***

### windowSeconds?

> `optional` **windowSeconds**: `number`

Defined in: [packages/gateway/src/policies/traffic/rate-limit.ts:16](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/rate-limit.ts#L16)

Time window in seconds. Default: 60.
