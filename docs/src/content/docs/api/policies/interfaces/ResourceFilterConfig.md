---
editUrl: false
next: false
prev: false
title: "ResourceFilterConfig"
---

Defined in: [packages/gateway/src/policies/traffic/resource-filter.ts:15](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/resource-filter.ts#L15)

Configuration for the resourceFilter policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### applyToArrayItems?

> `optional` **applyToArrayItems**: `boolean`

Defined in: [packages/gateway/src/policies/traffic/resource-filter.ts:23](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/resource-filter.ts#L23)

Apply filtering to array items. Default: true

***

### contentTypes?

> `optional` **contentTypes**: `string`[]

Defined in: [packages/gateway/src/policies/traffic/resource-filter.ts:21](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/resource-filter.ts#L21)

Content types to filter. Default: ["application/json"]

***

### fields

> **fields**: `string`[]

Defined in: [packages/gateway/src/policies/traffic/resource-filter.ts:19](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/resource-filter.ts#L19)

Field paths to filter. Supports dot-notation (e.g. "user.password")

***

### mode

> **mode**: `"allow"` \| `"deny"`

Defined in: [packages/gateway/src/policies/traffic/resource-filter.ts:17](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/resource-filter.ts#L17)

Filter mode: "deny" removes listed fields, "allow" keeps only listed fields

***

### skip()?

> `optional` **skip**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [packages/gateway/src/policies/types.ts:90](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/types.ts#L90)

Skip this policy when condition returns true

#### Parameters

##### c

`unknown`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

#### Inherited from

[`PolicyConfig`](/api/index/interfaces/policyconfig/).[`skip`](/api/index/interfaces/policyconfig/#skip)
