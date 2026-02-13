---
editUrl: false
next: false
prev: false
title: "RequestValidationConfig"
---

Defined in: [packages/stoma/src/policies/transform/request-validation.ts:20](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/transform/request-validation.ts#L20)

Configuration for the requestValidation policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### contentTypes?

> `optional` **contentTypes**: `string`[]

Defined in: [packages/stoma/src/policies/transform/request-validation.ts:38](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/transform/request-validation.ts#L38)

Only validate these content types.
Requests with other content types pass through without validation.
Default: `["application/json"]`.

***

### errorMessage?

> `optional` **errorMessage**: `string`

Defined in: [packages/stoma/src/policies/transform/request-validation.ts:40](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/transform/request-validation.ts#L40)

Custom error message prefix. Default: `"Request validation failed"`.

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

> `optional` **validate**: (`body`) => `boolean` \| `ValidationResult`

Defined in: [packages/stoma/src/policies/transform/request-validation.ts:25](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/transform/request-validation.ts#L25)

Synchronous validation function.
Return `true`/`false` or an object with optional error details.

#### Parameters

##### body

`unknown`

#### Returns

`boolean` \| `ValidationResult`

***

### validateAsync()?

> `optional` **validateAsync**: (`body`) => `Promise`\<`boolean` \| `ValidationResult`\>

Defined in: [packages/stoma/src/policies/transform/request-validation.ts:30](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/transform/request-validation.ts#L30)

Async validation function (e.g., for remote schema validation).
If both `validate` and `validateAsync` are provided, `validateAsync` takes precedence.

#### Parameters

##### body

`unknown`

#### Returns

`Promise`\<`boolean` \| `ValidationResult`\>
