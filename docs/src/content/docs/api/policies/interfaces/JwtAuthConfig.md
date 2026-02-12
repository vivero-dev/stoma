---
editUrl: false
next: false
prev: false
title: "JwtAuthConfig"
---

Defined in: src/policies/auth/jwt-auth.ts:11

Configuration for the jwtAuth policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### audience?

> `optional` **audience**: `string`

Defined in: src/policies/auth/jwt-auth.ts:19

Expected JWT audience

***

### clockSkewSeconds?

> `optional` **clockSkewSeconds**: `number`

Defined in: src/policies/auth/jwt-auth.ts:31

Clock skew tolerance in seconds for expiry checks. Default: 0.

***

### forwardClaims?

> `optional` **forwardClaims**: `Record`\<`string`, `string`\>

Defined in: src/policies/auth/jwt-auth.ts:25

Claims to inject into request headers for upstream consumption

***

### headerName?

> `optional` **headerName**: `string`

Defined in: src/policies/auth/jwt-auth.ts:21

Header to read the token from. Default: "Authorization"

***

### issuer?

> `optional` **issuer**: `string`

Defined in: src/policies/auth/jwt-auth.ts:17

Expected JWT issuer

***

### jwksCacheTtlMs?

> `optional` **jwksCacheTtlMs**: `number`

Defined in: src/policies/auth/jwt-auth.ts:27

JWKS cache TTL in milliseconds. Default: 300000 (5 minutes).

***

### jwksTimeoutMs?

> `optional` **jwksTimeoutMs**: `number`

Defined in: src/policies/auth/jwt-auth.ts:29

JWKS fetch timeout in milliseconds. Default: 10000 (10 seconds).

***

### jwksUrl?

> `optional` **jwksUrl**: `string`

Defined in: src/policies/auth/jwt-auth.ts:15

JWKS endpoint URL (e.g. Supabase, Auth0)

***

### requireExp?

> `optional` **requireExp**: `boolean`

Defined in: src/policies/auth/jwt-auth.ts:33

Require the `exp` claim to be present. Default: false.

***

### secret?

> `optional` **secret**: `string`

Defined in: src/policies/auth/jwt-auth.ts:13

JWT secret for HMAC verification

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

***

### tokenPrefix?

> `optional` **tokenPrefix**: `string`

Defined in: src/policies/auth/jwt-auth.ts:23

Token prefix. Default: "Bearer"
