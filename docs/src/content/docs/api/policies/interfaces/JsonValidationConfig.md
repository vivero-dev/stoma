---
editUrl: false
next: false
prev: false
title: "JsonValidationConfig"
---

Defined in: [src/policies/transform/json-validation.ts:21](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/transform/json-validation.ts#L21)

Configuration for the jsonValidation policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### contentTypes?

> `optional` **contentTypes**: `string`[]

Defined in: [src/policies/transform/json-validation.ts:27](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/transform/json-validation.ts#L27)

Content types to validate. Default: ["application/json"]

***

### errorDetail?

> `optional` **errorDetail**: `boolean`

Defined in: [src/policies/transform/json-validation.ts:31](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/transform/json-validation.ts#L31)

Include validation errors in response. Default: true

***

### rejectStatus?

> `optional` **rejectStatus**: `number`

Defined in: [src/policies/transform/json-validation.ts:29](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/transform/json-validation.ts#L29)

HTTP status code on validation failure. Default: 422

***

### skip()?

> `optional` **skip**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [src/policies/types.ts:90](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/types.ts#L90)

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

Defined in: [src/policies/transform/json-validation.ts:23](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/transform/json-validation.ts#L23)

Custom validation function. Takes parsed body, returns validation result.

#### Parameters

##### body

`unknown`

#### Returns

[`JsonValidationResult`](/api/policies/interfaces/jsonvalidationresult/) \| `Promise`\<[`JsonValidationResult`](/api/policies/interfaces/jsonvalidationresult/)\>
