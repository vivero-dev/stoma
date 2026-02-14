---
editUrl: false
next: false
prev: false
title: "AssignContentConfig"
---

Defined in: [src/policies/transform/assign-content.ts:17](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/policies/transform/assign-content.ts#L17)

Configuration for the assignContent policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### contentTypes?

> `optional` **contentTypes**: `string`[]

Defined in: [src/policies/transform/assign-content.ts:23](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/policies/transform/assign-content.ts#L23)

Only modify bodies with these content types. Default: `["application/json"]`.

***

### request?

> `optional` **request**: `Record`\<`string`, `unknown`\>

Defined in: [src/policies/transform/assign-content.ts:19](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/policies/transform/assign-content.ts#L19)

Fields to set/override in the JSON request body.

***

### response?

> `optional` **response**: `Record`\<`string`, `unknown`\>

Defined in: [src/policies/transform/assign-content.ts:21](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/policies/transform/assign-content.ts#L21)

Fields to set/override in the JSON response body.

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
