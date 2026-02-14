---
editUrl: false
next: false
prev: false
title: "JwtAuthConfig"
---

Defined in: [src/policies/auth/jwt-auth.ts:18](https://github.com/HomeGrower-club/stoma/blob/6293f5d254fea2989ebdf0b4b444e914a25475fc/src/policies/auth/jwt-auth.ts#L18)

Configuration for the jwtAuth policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### audience?

> `optional` **audience**: `string`

Defined in: [src/policies/auth/jwt-auth.ts:26](https://github.com/HomeGrower-club/stoma/blob/6293f5d254fea2989ebdf0b4b444e914a25475fc/src/policies/auth/jwt-auth.ts#L26)

Expected JWT audience

***

### clockSkewSeconds?

> `optional` **clockSkewSeconds**: `number`

Defined in: [src/policies/auth/jwt-auth.ts:38](https://github.com/HomeGrower-club/stoma/blob/6293f5d254fea2989ebdf0b4b444e914a25475fc/src/policies/auth/jwt-auth.ts#L38)

Clock skew tolerance in seconds for expiry checks. Default: 0.

***

### forwardClaims?

> `optional` **forwardClaims**: `Record`\<`string`, `string`\>

Defined in: [src/policies/auth/jwt-auth.ts:32](https://github.com/HomeGrower-club/stoma/blob/6293f5d254fea2989ebdf0b4b444e914a25475fc/src/policies/auth/jwt-auth.ts#L32)

Claims to inject into request headers for upstream consumption

***

### headerName?

> `optional` **headerName**: `string`

Defined in: [src/policies/auth/jwt-auth.ts:28](https://github.com/HomeGrower-club/stoma/blob/6293f5d254fea2989ebdf0b4b444e914a25475fc/src/policies/auth/jwt-auth.ts#L28)

Header to read the token from. Default: "Authorization"

***

### issuer?

> `optional` **issuer**: `string`

Defined in: [src/policies/auth/jwt-auth.ts:24](https://github.com/HomeGrower-club/stoma/blob/6293f5d254fea2989ebdf0b4b444e914a25475fc/src/policies/auth/jwt-auth.ts#L24)

Expected JWT issuer

***

### jwksCacheTtlMs?

> `optional` **jwksCacheTtlMs**: `number`

Defined in: [src/policies/auth/jwt-auth.ts:34](https://github.com/HomeGrower-club/stoma/blob/6293f5d254fea2989ebdf0b4b444e914a25475fc/src/policies/auth/jwt-auth.ts#L34)

JWKS cache TTL in milliseconds. Default: 300000 (5 minutes).

***

### jwksTimeoutMs?

> `optional` **jwksTimeoutMs**: `number`

Defined in: [src/policies/auth/jwt-auth.ts:36](https://github.com/HomeGrower-club/stoma/blob/6293f5d254fea2989ebdf0b4b444e914a25475fc/src/policies/auth/jwt-auth.ts#L36)

JWKS fetch timeout in milliseconds. Default: 10000 (10 seconds).

***

### jwksUrl?

> `optional` **jwksUrl**: `string`

Defined in: [src/policies/auth/jwt-auth.ts:22](https://github.com/HomeGrower-club/stoma/blob/6293f5d254fea2989ebdf0b4b444e914a25475fc/src/policies/auth/jwt-auth.ts#L22)

JWKS endpoint URL (e.g. Supabase, Auth0)

***

### requireExp?

> `optional` **requireExp**: `boolean`

Defined in: [src/policies/auth/jwt-auth.ts:40](https://github.com/HomeGrower-club/stoma/blob/6293f5d254fea2989ebdf0b4b444e914a25475fc/src/policies/auth/jwt-auth.ts#L40)

Require the `exp` claim to be present. Default: false.

***

### secret?

> `optional` **secret**: `string`

Defined in: [src/policies/auth/jwt-auth.ts:20](https://github.com/HomeGrower-club/stoma/blob/6293f5d254fea2989ebdf0b4b444e914a25475fc/src/policies/auth/jwt-auth.ts#L20)

JWT secret for HMAC verification

***

### skip()?

> `optional` **skip**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [src/policies/types.ts:90](https://github.com/HomeGrower-club/stoma/blob/6293f5d254fea2989ebdf0b4b444e914a25475fc/src/policies/types.ts#L90)

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

Defined in: [src/policies/auth/jwt-auth.ts:30](https://github.com/HomeGrower-club/stoma/blob/6293f5d254fea2989ebdf0b4b444e914a25475fc/src/policies/auth/jwt-auth.ts#L30)

Token prefix. Default: "Bearer"
