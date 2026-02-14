---
editUrl: false
next: false
prev: false
title: "RequestTransformConfig"
---

Defined in: [src/policies/transform/transform.ts:12](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/policies/transform/transform.ts#L12)

Configuration for requestTransform and responseTransform policies.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### removeHeaders?

> `optional` **removeHeaders**: `string`[]

Defined in: [src/policies/transform/transform.ts:16](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/policies/transform/transform.ts#L16)

Header names to remove from the outgoing request.

***

### renameHeaders?

> `optional` **renameHeaders**: `Record`\<`string`, `string`\>

Defined in: [src/policies/transform/transform.ts:18](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/policies/transform/transform.ts#L18)

Rename headers: keys are old names, values are new names.

***

### setHeaders?

> `optional` **setHeaders**: `Record`\<`string`, `string`\>

Defined in: [src/policies/transform/transform.ts:14](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/policies/transform/transform.ts#L14)

Headers to add or overwrite on the outgoing request.

***

### skip()?

> `optional` **skip**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [src/policies/types.ts:90](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/policies/types.ts#L90)

Skip this policy when condition returns true

#### Parameters

##### c

`unknown`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

#### Inherited from

[`PolicyConfig`](/api/index/interfaces/policyconfig/).[`skip`](/api/index/interfaces/policyconfig/#skip)
