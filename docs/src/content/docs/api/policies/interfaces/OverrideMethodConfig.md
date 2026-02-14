---
editUrl: false
next: false
prev: false
title: "OverrideMethodConfig"
---

Defined in: [src/policies/transform/override-method.ts:15](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/policies/transform/override-method.ts#L15)

Configuration for the overrideMethod policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### allowedMethods?

> `optional` **allowedMethods**: `string`[]

Defined in: [src/policies/transform/override-method.ts:19](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/policies/transform/override-method.ts#L19)

Methods allowed as overrides. Default: `["GET", "PUT", "PATCH", "DELETE"]`.

***

### header?

> `optional` **header**: `string`

Defined in: [src/policies/transform/override-method.ts:17](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/policies/transform/override-method.ts#L17)

Header name to read the override method from. Default: `"X-HTTP-Method-Override"`.

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
