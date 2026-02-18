---
editUrl: false
next: false
prev: false
title: "TimeoutConfig"
---

Defined in: [packages/gateway/src/policies/resilience/timeout.ts:10](https://github.com/HomeGrower-club/stoma/blob/b366835e3781c3a030f80027e784272dddf630da/packages/gateway/src/policies/resilience/timeout.ts#L10)

Configuration for the timeout policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### message?

> `optional` **message**: `string`

Defined in: [packages/gateway/src/policies/resilience/timeout.ts:14](https://github.com/HomeGrower-club/stoma/blob/b366835e3781c3a030f80027e784272dddf630da/packages/gateway/src/policies/resilience/timeout.ts#L14)

Error message when timeout fires.

***

### skip()?

> `optional` **skip**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [packages/gateway/src/policies/types.ts:90](https://github.com/HomeGrower-club/stoma/blob/b366835e3781c3a030f80027e784272dddf630da/packages/gateway/src/policies/types.ts#L90)

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

Defined in: [packages/gateway/src/policies/resilience/timeout.ts:16](https://github.com/HomeGrower-club/stoma/blob/b366835e3781c3a030f80027e784272dddf630da/packages/gateway/src/policies/resilience/timeout.ts#L16)

HTTP status code when timeout fires. Default: 504.

***

### timeoutMs?

> `optional` **timeoutMs**: `number`

Defined in: [packages/gateway/src/policies/resilience/timeout.ts:12](https://github.com/HomeGrower-club/stoma/blob/b366835e3781c3a030f80027e784272dddf630da/packages/gateway/src/policies/resilience/timeout.ts#L12)

Timeout in milliseconds. Default: 30000.
