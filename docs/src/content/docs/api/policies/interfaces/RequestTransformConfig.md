---
editUrl: false
next: false
prev: false
title: "RequestTransformConfig"
---

Defined in: src/policies/transform/transform.ts:9

Configuration for requestTransform and responseTransform policies.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### removeHeaders?

> `optional` **removeHeaders**: `string`[]

Defined in: src/policies/transform/transform.ts:13

Header names to remove from the outgoing request.

***

### renameHeaders?

> `optional` **renameHeaders**: `Record`\<`string`, `string`\>

Defined in: src/policies/transform/transform.ts:15

Rename headers: keys are old names, values are new names.

***

### setHeaders?

> `optional` **setHeaders**: `Record`\<`string`, `string`\>

Defined in: src/policies/transform/transform.ts:11

Headers to add or overwrite on the outgoing request.

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
