---
editUrl: false
next: false
prev: false
title: "GenerateJwtConfig"
---

Defined in: [packages/gateway/src/policies/auth/generate-jwt.ts:16](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/generate-jwt.ts#L16)

Configuration for the generateJwt policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### algorithm

> **algorithm**: `"HS256"` \| `"HS384"` \| `"HS512"` \| `"RS256"` \| `"RS384"` \| `"RS512"`

Defined in: [packages/gateway/src/policies/auth/generate-jwt.ts:18](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/generate-jwt.ts#L18)

Signing algorithm

***

### audience?

> `optional` **audience**: `string`

Defined in: [packages/gateway/src/policies/auth/generate-jwt.ts:34](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/generate-jwt.ts#L34)

Audience claim

***

### claims?

> `optional` **claims**: `Record`\<`string`, `unknown`\> \| (`c`) => `Record`\<`string`, `unknown`\> \| `Promise`\<`Record`\<`string`, `unknown`\>\>

Defined in: [packages/gateway/src/policies/auth/generate-jwt.ts:24](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/generate-jwt.ts#L24)

Claims to include. Static record or dynamic function.

***

### expiresIn?

> `optional` **expiresIn**: `number`

Defined in: [packages/gateway/src/policies/auth/generate-jwt.ts:30](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/generate-jwt.ts#L30)

Token lifetime in seconds. Default: 3600 (1 hour)

***

### headerName?

> `optional` **headerName**: `string`

Defined in: [packages/gateway/src/policies/auth/generate-jwt.ts:36](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/generate-jwt.ts#L36)

Header name for the generated token. Default: "Authorization"

***

### issuer?

> `optional` **issuer**: `string`

Defined in: [packages/gateway/src/policies/auth/generate-jwt.ts:32](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/generate-jwt.ts#L32)

Issuer claim

***

### privateKey?

> `optional` **privateKey**: `JsonWebKey`

Defined in: [packages/gateway/src/policies/auth/generate-jwt.ts:22](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/generate-jwt.ts#L22)

RSA private key as JWK (for RS* algorithms)

***

### secret?

> `optional` **secret**: `string`

Defined in: [packages/gateway/src/policies/auth/generate-jwt.ts:20](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/generate-jwt.ts#L20)

HMAC secret (for HS* algorithms)

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

### tokenPrefix?

> `optional` **tokenPrefix**: `string`

Defined in: [packages/gateway/src/policies/auth/generate-jwt.ts:38](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/generate-jwt.ts#L38)

Token prefix. Default: "Bearer"
