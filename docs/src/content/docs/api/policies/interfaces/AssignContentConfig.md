---
editUrl: false
next: false
prev: false
title: "AssignContentConfig"
---

Defined in: src/policies/transform/assign-content.ts:16

Configuration for the assignContent policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### contentTypes?

> `optional` **contentTypes**: `string`[]

Defined in: src/policies/transform/assign-content.ts:22

Only modify bodies with these content types. Default: `["application/json"]`.

***

### request?

> `optional` **request**: `Record`\<`string`, `unknown`\>

Defined in: src/policies/transform/assign-content.ts:18

Fields to set/override in the JSON request body.

***

### response?

> `optional` **response**: `Record`\<`string`, `unknown`\>

Defined in: src/policies/transform/assign-content.ts:20

Fields to set/override in the JSON response body.

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
