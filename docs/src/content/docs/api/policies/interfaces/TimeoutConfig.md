---
editUrl: false
next: false
prev: false
title: "TimeoutConfig"
---

Defined in: [src/policies/resilience/timeout.ts:10](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/policies/resilience/timeout.ts#L10)

Configuration for the timeout policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### message?

> `optional` **message**: `string`

Defined in: [src/policies/resilience/timeout.ts:14](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/policies/resilience/timeout.ts#L14)

Error message when timeout fires.

***

### skip()?

> `optional` **skip**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [src/policies/types.ts:33](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/policies/types.ts#L33)

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

Defined in: [src/policies/resilience/timeout.ts:16](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/policies/resilience/timeout.ts#L16)

HTTP status code when timeout fires. Default: 504.

***

### timeoutMs?

> `optional` **timeoutMs**: `number`

Defined in: [src/policies/resilience/timeout.ts:12](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/policies/resilience/timeout.ts#L12)

Timeout in milliseconds. Default: 30000.
