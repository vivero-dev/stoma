---
editUrl: false
next: false
prev: false
title: "ResponseTransformConfig"
---

Defined in: [src/policies/transform/transform.ts:18](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/policies/transform/transform.ts#L18)

Configuration for requestTransform and responseTransform policies.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### removeHeaders?

> `optional` **removeHeaders**: `string`[]

Defined in: [src/policies/transform/transform.ts:22](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/policies/transform/transform.ts#L22)

Header names to remove from the response.

***

### renameHeaders?

> `optional` **renameHeaders**: `Record`\<`string`, `string`\>

Defined in: [src/policies/transform/transform.ts:24](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/policies/transform/transform.ts#L24)

Rename headers: keys are old names, values are new names.

***

### setHeaders?

> `optional` **setHeaders**: `Record`\<`string`, `string`\>

Defined in: [src/policies/transform/transform.ts:20](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/policies/transform/transform.ts#L20)

Headers to add or overwrite on the response.

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
