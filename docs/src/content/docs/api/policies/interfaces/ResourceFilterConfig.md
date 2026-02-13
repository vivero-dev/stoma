---
editUrl: false
next: false
prev: false
title: "ResourceFilterConfig"
---

Defined in: [packages/stoma/src/policies/traffic/resource-filter.ts:13](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/traffic/resource-filter.ts#L13)

Configuration for the resourceFilter policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### applyToArrayItems?

> `optional` **applyToArrayItems**: `boolean`

Defined in: [packages/stoma/src/policies/traffic/resource-filter.ts:21](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/traffic/resource-filter.ts#L21)

Apply filtering to array items. Default: true

***

### contentTypes?

> `optional` **contentTypes**: `string`[]

Defined in: [packages/stoma/src/policies/traffic/resource-filter.ts:19](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/traffic/resource-filter.ts#L19)

Content types to filter. Default: ["application/json"]

***

### fields

> **fields**: `string`[]

Defined in: [packages/stoma/src/policies/traffic/resource-filter.ts:17](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/traffic/resource-filter.ts#L17)

Field paths to filter. Supports dot-notation (e.g. "user.password")

***

### mode

> **mode**: `"allow"` \| `"deny"`

Defined in: [packages/stoma/src/policies/traffic/resource-filter.ts:15](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/traffic/resource-filter.ts#L15)

Filter mode: "deny" removes listed fields, "allow" keeps only listed fields

***

### skip()?

> `optional` **skip**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [packages/stoma/src/policies/types.ts:33](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/types.ts#L33)

Skip this policy when condition returns true

#### Parameters

##### c

`unknown`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

#### Inherited from

[`PolicyConfig`](/api/index/interfaces/policyconfig/).[`skip`](/api/index/interfaces/policyconfig/#skip)
