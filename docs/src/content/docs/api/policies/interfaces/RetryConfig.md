---
editUrl: false
next: false
prev: false
title: "RetryConfig"
---

Defined in: [packages/stoma/src/policies/resilience/retry.ts:20](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/resilience/retry.ts#L20)

Configuration for the retry policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### backoff?

> `optional` **backoff**: `"fixed"` \| `"exponential"`

Defined in: [packages/stoma/src/policies/resilience/retry.ts:26](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/resilience/retry.ts#L26)

Backoff strategy. Default: "exponential".

***

### baseDelayMs?

> `optional` **baseDelayMs**: `number`

Defined in: [packages/stoma/src/policies/resilience/retry.ts:28](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/resilience/retry.ts#L28)

Base delay in ms for backoff. Default: 200.

***

### maxDelayMs?

> `optional` **maxDelayMs**: `number`

Defined in: [packages/stoma/src/policies/resilience/retry.ts:30](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/resilience/retry.ts#L30)

Maximum delay in ms. Default: 5000.

***

### maxRetries?

> `optional` **maxRetries**: `number`

Defined in: [packages/stoma/src/policies/resilience/retry.ts:22](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/resilience/retry.ts#L22)

Maximum number of retries. Default: 3.

***

### retryCountHeader?

> `optional` **retryCountHeader**: `string`

Defined in: [packages/stoma/src/policies/resilience/retry.ts:34](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/resilience/retry.ts#L34)

Response header name for the retry count. Default: `"x-retry-count"`.

***

### retryMethods?

> `optional` **retryMethods**: `string`[]

Defined in: [packages/stoma/src/policies/resilience/retry.ts:32](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/resilience/retry.ts#L32)

HTTP methods eligible for retry. Default: idempotent methods.

***

### retryOn?

> `optional` **retryOn**: `number`[]

Defined in: [packages/stoma/src/policies/resilience/retry.ts:24](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/resilience/retry.ts#L24)

Status codes that trigger a retry. Default: [502, 503, 504].

***

### skip()?

> `optional` **skip**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [packages/stoma/src/policies/types.ts:33](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/types.ts#L33)

Skip this policy when condition returns true

#### Parameters

##### c

`unknown`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

#### Inherited from

[`PolicyConfig`](/api/index/interfaces/policyconfig/).[`skip`](/api/index/interfaces/policyconfig/#skip)
