---
editUrl: false
next: false
prev: false
title: "ResourceFilterConfig"
---

Defined in: src/policies/traffic/resource-filter.ts:13

Configuration for the resourceFilter policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### applyToArrayItems?

> `optional` **applyToArrayItems**: `boolean`

Defined in: src/policies/traffic/resource-filter.ts:21

Apply filtering to array items. Default: true

***

### contentTypes?

> `optional` **contentTypes**: `string`[]

Defined in: src/policies/traffic/resource-filter.ts:19

Content types to filter. Default: ["application/json"]

***

### fields

> **fields**: `string`[]

Defined in: src/policies/traffic/resource-filter.ts:17

Field paths to filter. Supports dot-notation (e.g. "user.password")

***

### mode

> **mode**: `"allow"` \| `"deny"`

Defined in: src/policies/traffic/resource-filter.ts:15

Filter mode: "deny" removes listed fields, "allow" keeps only listed fields

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
