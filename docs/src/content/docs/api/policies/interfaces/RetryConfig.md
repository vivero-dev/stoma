---
editUrl: false
next: false
prev: false
title: "RetryConfig"
---

Defined in: [packages/gateway/src/policies/resilience/retry.ts:21](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/resilience/retry.ts#L21)

Configuration for the retry policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### backoff?

> `optional` **backoff**: `"fixed"` \| `"exponential"`

Defined in: [packages/gateway/src/policies/resilience/retry.ts:27](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/resilience/retry.ts#L27)

Backoff strategy. Default: "exponential".

***

### baseDelayMs?

> `optional` **baseDelayMs**: `number`

Defined in: [packages/gateway/src/policies/resilience/retry.ts:29](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/resilience/retry.ts#L29)

Base delay in ms for backoff. Default: 200.

***

### maxDelayMs?

> `optional` **maxDelayMs**: `number`

Defined in: [packages/gateway/src/policies/resilience/retry.ts:31](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/resilience/retry.ts#L31)

Maximum delay in ms. Default: 5000.

***

### maxRetries?

> `optional` **maxRetries**: `number`

Defined in: [packages/gateway/src/policies/resilience/retry.ts:23](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/resilience/retry.ts#L23)

Maximum number of retries. Default: 3.

***

### retryCountHeader?

> `optional` **retryCountHeader**: `string`

Defined in: [packages/gateway/src/policies/resilience/retry.ts:35](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/resilience/retry.ts#L35)

Response header name for the retry count. Default: `"x-retry-count"`.

***

### retryMethods?

> `optional` **retryMethods**: `string`[]

Defined in: [packages/gateway/src/policies/resilience/retry.ts:33](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/resilience/retry.ts#L33)

HTTP methods eligible for retry. Default: idempotent methods.

***

### retryOn?

> `optional` **retryOn**: `number`[]

Defined in: [packages/gateway/src/policies/resilience/retry.ts:25](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/resilience/retry.ts#L25)

Status codes that trigger a retry. Default: [502, 503, 504].

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
