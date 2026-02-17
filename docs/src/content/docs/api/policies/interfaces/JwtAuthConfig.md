---
editUrl: false
next: false
prev: false
title: "JwtAuthConfig"
---

Defined in: [packages/gateway/src/policies/auth/jwt-auth.ts:19](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/jwt-auth.ts#L19)

Configuration for the jwtAuth policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### audience?

> `optional` **audience**: `string`

Defined in: [packages/gateway/src/policies/auth/jwt-auth.ts:27](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/jwt-auth.ts#L27)

Expected JWT audience

***

### clockSkewSeconds?

> `optional` **clockSkewSeconds**: `number`

Defined in: [packages/gateway/src/policies/auth/jwt-auth.ts:39](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/jwt-auth.ts#L39)

Clock skew tolerance in seconds for expiry checks. Default: 0.

***

### forwardClaims?

> `optional` **forwardClaims**: `Record`\<`string`, `string`\>

Defined in: [packages/gateway/src/policies/auth/jwt-auth.ts:33](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/jwt-auth.ts#L33)

Claims to inject into request headers for upstream consumption

***

### headerName?

> `optional` **headerName**: `string`

Defined in: [packages/gateway/src/policies/auth/jwt-auth.ts:29](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/jwt-auth.ts#L29)

Header to read the token from. Default: "Authorization"

***

### issuer?

> `optional` **issuer**: `string`

Defined in: [packages/gateway/src/policies/auth/jwt-auth.ts:25](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/jwt-auth.ts#L25)

Expected JWT issuer

***

### jwksCacheTtlMs?

> `optional` **jwksCacheTtlMs**: `number`

Defined in: [packages/gateway/src/policies/auth/jwt-auth.ts:35](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/jwt-auth.ts#L35)

JWKS cache TTL in milliseconds. Default: 300000 (5 minutes).

***

### jwksTimeoutMs?

> `optional` **jwksTimeoutMs**: `number`

Defined in: [packages/gateway/src/policies/auth/jwt-auth.ts:37](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/jwt-auth.ts#L37)

JWKS fetch timeout in milliseconds. Default: 10000 (10 seconds).

***

### jwksUrl?

> `optional` **jwksUrl**: `string`

Defined in: [packages/gateway/src/policies/auth/jwt-auth.ts:23](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/jwt-auth.ts#L23)

JWKS endpoint URL (e.g. Supabase, Auth0)

***

### requireExp?

> `optional` **requireExp**: `boolean`

Defined in: [packages/gateway/src/policies/auth/jwt-auth.ts:41](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/jwt-auth.ts#L41)

Require the `exp` claim to be present. Default: false.

***

### secret?

> `optional` **secret**: `string`

Defined in: [packages/gateway/src/policies/auth/jwt-auth.ts:21](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/jwt-auth.ts#L21)

JWT secret for HMAC verification

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

Defined in: [packages/gateway/src/policies/auth/jwt-auth.ts:31](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/jwt-auth.ts#L31)

Token prefix. Default: "Bearer"
