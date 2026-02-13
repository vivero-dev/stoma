---
editUrl: false
next: false
prev: false
title: "OAuth2Config"
---

Defined in: [packages/stoma/src/policies/auth/oauth2.ts:13](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/auth/oauth2.ts#L13)

Configuration for the oauth2 policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### cacheTtlSeconds?

> `optional` **cacheTtlSeconds**: `number`

Defined in: [packages/stoma/src/policies/auth/oauth2.ts:33](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/auth/oauth2.ts#L33)

Cache introspection results for this many seconds. Default: 0 (no cache).

***

### clientId?

> `optional` **clientId**: `string`

Defined in: [packages/stoma/src/policies/auth/oauth2.ts:17](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/auth/oauth2.ts#L17)

Client ID for authenticating with the introspection endpoint.

***

### clientSecret?

> `optional` **clientSecret**: `string`

Defined in: [packages/stoma/src/policies/auth/oauth2.ts:19](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/auth/oauth2.ts#L19)

Client secret for authenticating with the introspection endpoint.

***

### forwardTokenInfo?

> `optional` **forwardTokenInfo**: `Record`\<`string`, `string`\>

Defined in: [packages/stoma/src/policies/auth/oauth2.ts:31](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/auth/oauth2.ts#L31)

Map introspection response fields to request headers. Only applies with introspection.

***

### headerName?

> `optional` **headerName**: `string`

Defined in: [packages/stoma/src/policies/auth/oauth2.ts:25](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/auth/oauth2.ts#L25)

Header name when tokenLocation is "header". Default: "authorization".

***

### headerPrefix?

> `optional` **headerPrefix**: `string`

Defined in: [packages/stoma/src/policies/auth/oauth2.ts:27](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/auth/oauth2.ts#L27)

Prefix to strip from header value. Default: "Bearer".

***

### introspectionTimeoutMs?

> `optional` **introspectionTimeoutMs**: `number`

Defined in: [packages/stoma/src/policies/auth/oauth2.ts:37](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/auth/oauth2.ts#L37)

Introspection endpoint fetch timeout in milliseconds. Default: 5000.

***

### introspectionUrl?

> `optional` **introspectionUrl**: `string`

Defined in: [packages/stoma/src/policies/auth/oauth2.ts:15](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/auth/oauth2.ts#L15)

OAuth2 token introspection endpoint (RFC 7662).

***

### localValidate()?

> `optional` **localValidate**: (`token`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [packages/stoma/src/policies/auth/oauth2.ts:21](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/auth/oauth2.ts#L21)

Local validation function as alternative to introspection. Takes precedence if both provided.

#### Parameters

##### token

`string`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

***

### queryParam?

> `optional` **queryParam**: `string`

Defined in: [packages/stoma/src/policies/auth/oauth2.ts:29](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/auth/oauth2.ts#L29)

Query param name when tokenLocation is "query". Default: "access_token".

***

### requiredScopes?

> `optional` **requiredScopes**: `string`[]

Defined in: [packages/stoma/src/policies/auth/oauth2.ts:35](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/auth/oauth2.ts#L35)

Required scopes — token must have ALL of these (space-separated scope string).

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

### tokenLocation?

> `optional` **tokenLocation**: `"query"` \| `"header"`

Defined in: [packages/stoma/src/policies/auth/oauth2.ts:23](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/auth/oauth2.ts#L23)

Where to look for the token. Default: "header".
