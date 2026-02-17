---
editUrl: false
next: false
prev: false
title: "JsonValidationConfig"
---

Defined in: [packages/gateway/src/policies/transform/json-validation.ts:21](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/transform/json-validation.ts#L21)

Configuration for the jsonValidation policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### contentTypes?

> `optional` **contentTypes**: `string`[]

Defined in: [packages/gateway/src/policies/transform/json-validation.ts:27](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/transform/json-validation.ts#L27)

Content types to validate. Default: ["application/json"]

***

### errorDetail?

> `optional` **errorDetail**: `boolean`

Defined in: [packages/gateway/src/policies/transform/json-validation.ts:31](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/transform/json-validation.ts#L31)

Include validation errors in response. Default: true

***

### rejectStatus?

> `optional` **rejectStatus**: `number`

Defined in: [packages/gateway/src/policies/transform/json-validation.ts:29](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/transform/json-validation.ts#L29)

HTTP status code on validation failure. Default: 422

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

***

### validate()?

> `optional` **validate**: (`body`) => [`JsonValidationResult`](/api/policies/interfaces/jsonvalidationresult/) \| `Promise`\<[`JsonValidationResult`](/api/policies/interfaces/jsonvalidationresult/)\>

Defined in: [packages/gateway/src/policies/transform/json-validation.ts:23](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/transform/json-validation.ts#L23)

Custom validation function. Takes parsed body, returns validation result.

#### Parameters

##### body

`unknown`

#### Returns

[`JsonValidationResult`](/api/policies/interfaces/jsonvalidationresult/) \| `Promise`\<[`JsonValidationResult`](/api/policies/interfaces/jsonvalidationresult/)\>
