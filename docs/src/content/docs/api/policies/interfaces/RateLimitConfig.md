---
editUrl: false
next: false
prev: false
title: "RateLimitConfig"
---

Defined in: [src/policies/traffic/rate-limit.ts:20](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/traffic/rate-limit.ts#L20)

Configuration for the rateLimit policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### ipHeaders?

> `optional` **ipHeaders**: `string`[]

Defined in: [src/policies/traffic/rate-limit.ts:34](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/traffic/rate-limit.ts#L34)

Ordered list of headers to inspect for the client IP (when `keyBy` is not set). Default: `["cf-connecting-ip", "x-forwarded-for"]`.

***

### keyBy()?

> `optional` **keyBy**: (`c`) => `string` \| `Promise`\<`string`\>

Defined in: [src/policies/traffic/rate-limit.ts:26](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/traffic/rate-limit.ts#L26)

Key extractor — determines the rate limit bucket. Default: client IP.

#### Parameters

##### c

`Context`

#### Returns

`string` \| `Promise`\<`string`\>

***

### max

> **max**: `number`

Defined in: [src/policies/traffic/rate-limit.ts:22](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/traffic/rate-limit.ts#L22)

Maximum requests per window

***

### message?

> `optional` **message**: `string`

Defined in: [src/policies/traffic/rate-limit.ts:32](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/traffic/rate-limit.ts#L32)

Custom response body when limited

***

### skip()?

> `optional` **skip**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [src/policies/types.ts:69](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/types.ts#L69)

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

Defined in: [src/policies/traffic/rate-limit.ts:30](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/traffic/rate-limit.ts#L30)

Response status code when limited. Default: 429.

***

### store?

> `optional` **store**: [`RateLimitStore`](/api/index/interfaces/ratelimitstore/)

Defined in: [src/policies/traffic/rate-limit.ts:28](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/traffic/rate-limit.ts#L28)

Storage backend for counters

***

### windowSeconds?

> `optional` **windowSeconds**: `number`

Defined in: [src/policies/traffic/rate-limit.ts:24](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/traffic/rate-limit.ts#L24)

Time window in seconds. Default: 60.
