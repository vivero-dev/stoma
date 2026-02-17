---
editUrl: false
next: false
prev: false
title: "RequestValidationConfig"
---

Defined in: [packages/gateway/src/policies/transform/request-validation.ts:21](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/transform/request-validation.ts#L21)

Configuration for the requestValidation policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### contentTypes?

> `optional` **contentTypes**: `string`[]

Defined in: [packages/gateway/src/policies/transform/request-validation.ts:37](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/transform/request-validation.ts#L37)

Only validate these content types.
Requests with other content types pass through without validation.
Default: `["application/json"]`.

***

### errorMessage?

> `optional` **errorMessage**: `string`

Defined in: [packages/gateway/src/policies/transform/request-validation.ts:39](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/transform/request-validation.ts#L39)

Custom error message prefix. Default: `"Request validation failed"`.

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

> `optional` **validate**: (`body`) => `boolean` \| `ValidationResult`

Defined in: [packages/gateway/src/policies/transform/request-validation.ts:26](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/transform/request-validation.ts#L26)

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

Defined in: [packages/gateway/src/policies/transform/request-validation.ts:31](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/transform/request-validation.ts#L31)

Async validation function (e.g., for remote schema validation).
If both `validate` and `validateAsync` are provided, `validateAsync` takes precedence.

#### Parameters

##### body

`unknown`

#### Returns

`Promise`\<`boolean` \| `ValidationResult`\>
