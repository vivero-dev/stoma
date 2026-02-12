---
editUrl: false
next: false
prev: false
title: "RetryConfig"
---

Defined in: src/policies/resilience/retry.ts:20

Configuration for the retry policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### backoff?

> `optional` **backoff**: `"fixed"` \| `"exponential"`

Defined in: src/policies/resilience/retry.ts:26

Backoff strategy. Default: "exponential".

***

### baseDelayMs?

> `optional` **baseDelayMs**: `number`

Defined in: src/policies/resilience/retry.ts:28

Base delay in ms for backoff. Default: 200.

***

### maxDelayMs?

> `optional` **maxDelayMs**: `number`

Defined in: src/policies/resilience/retry.ts:30

Maximum delay in ms. Default: 5000.

***

### maxRetries?

> `optional` **maxRetries**: `number`

Defined in: src/policies/resilience/retry.ts:22

Maximum number of retries. Default: 3.

***

### retryCountHeader?

> `optional` **retryCountHeader**: `string`

Defined in: src/policies/resilience/retry.ts:34

Response header name for the retry count. Default: `"x-retry-count"`.

***

### retryMethods?

> `optional` **retryMethods**: `string`[]

Defined in: src/policies/resilience/retry.ts:32

HTTP methods eligible for retry. Default: idempotent methods.

***

### retryOn?

> `optional` **retryOn**: `number`[]

Defined in: src/policies/resilience/retry.ts:24

Status codes that trigger a retry. Default: [502, 503, 504].

***

### skip()?

> `optional` **skip**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: src/policies/types.ts:33

Skip this policy when condition returns true

#### Parameters

##### c

`unknown`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

#### Inherited from

[`PolicyConfig`](/api/index/interfaces/policyconfig/).[`skip`](/api/index/interfaces/policyconfig/#skip)
