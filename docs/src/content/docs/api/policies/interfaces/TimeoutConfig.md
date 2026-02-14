---
editUrl: false
next: false
prev: false
title: "TimeoutConfig"
---

Defined in: [src/policies/resilience/timeout.ts:10](https://github.com/HomeGrower-club/stoma/blob/7a6bc5c6595d42b4d2edc385006b88a77065ce23/src/policies/resilience/timeout.ts#L10)

Configuration for the timeout policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### message?

> `optional` **message**: `string`

Defined in: [src/policies/resilience/timeout.ts:14](https://github.com/HomeGrower-club/stoma/blob/7a6bc5c6595d42b4d2edc385006b88a77065ce23/src/policies/resilience/timeout.ts#L14)

Error message when timeout fires.

***

### skip()?

> `optional` **skip**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [src/policies/types.ts:90](https://github.com/HomeGrower-club/stoma/blob/7a6bc5c6595d42b4d2edc385006b88a77065ce23/src/policies/types.ts#L90)

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

Defined in: [src/policies/resilience/timeout.ts:16](https://github.com/HomeGrower-club/stoma/blob/7a6bc5c6595d42b4d2edc385006b88a77065ce23/src/policies/resilience/timeout.ts#L16)

HTTP status code when timeout fires. Default: 504.

***

### timeoutMs?

> `optional` **timeoutMs**: `number`

Defined in: [src/policies/resilience/timeout.ts:12](https://github.com/HomeGrower-club/stoma/blob/7a6bc5c6595d42b4d2edc385006b88a77065ce23/src/policies/resilience/timeout.ts#L12)

Timeout in milliseconds. Default: 30000.
