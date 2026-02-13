---
editUrl: false
next: false
prev: false
title: "JsonValidationConfig"
---

Defined in: [packages/stoma/src/policies/transform/json-validation.ts:20](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/transform/json-validation.ts#L20)

Configuration for the jsonValidation policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### contentTypes?

> `optional` **contentTypes**: `string`[]

Defined in: [packages/stoma/src/policies/transform/json-validation.ts:24](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/transform/json-validation.ts#L24)

Content types to validate. Default: ["application/json"]

***

### errorDetail?

> `optional` **errorDetail**: `boolean`

Defined in: [packages/stoma/src/policies/transform/json-validation.ts:28](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/transform/json-validation.ts#L28)

Include validation errors in response. Default: true

***

### rejectStatus?

> `optional` **rejectStatus**: `number`

Defined in: [packages/stoma/src/policies/transform/json-validation.ts:26](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/transform/json-validation.ts#L26)

HTTP status code on validation failure. Default: 422

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

***

### validate()?

> `optional` **validate**: (`body`) => [`JsonValidationResult`](/api/policies/interfaces/jsonvalidationresult/) \| `Promise`\<[`JsonValidationResult`](/api/policies/interfaces/jsonvalidationresult/)\>

Defined in: [packages/stoma/src/policies/transform/json-validation.ts:22](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/transform/json-validation.ts#L22)

Custom validation function. Takes parsed body, returns validation result.

#### Parameters

##### body

`unknown`

#### Returns

[`JsonValidationResult`](/api/policies/interfaces/jsonvalidationresult/) \| `Promise`\<[`JsonValidationResult`](/api/policies/interfaces/jsonvalidationresult/)\>
