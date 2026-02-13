---
editUrl: false
next: false
prev: false
title: "AssignAttributesConfig"
---

Defined in: [src/policies/transform/assign-attributes.ts:14](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/transform/assign-attributes.ts#L14)

Configuration for the assignAttributes policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### attributes

> **attributes**: `Record`\<`string`, `string` \| (`c`) => `string` \| `Promise`\<`string`\>\>

Defined in: [src/policies/transform/assign-attributes.ts:19](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/transform/assign-attributes.ts#L19)

Key-value pairs to set on the Hono context.
Values can be static strings or functions that receive the context.

***

### skip()?

> `optional` **skip**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [src/policies/types.ts:69](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/types.ts#L69)

Skip this policy when condition returns true

#### Parameters

##### c

`unknown`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

#### Inherited from

[`PolicyConfig`](/api/index/interfaces/policyconfig/).[`skip`](/api/index/interfaces/policyconfig/#skip)
