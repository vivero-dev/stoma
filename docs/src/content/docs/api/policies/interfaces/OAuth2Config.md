---
editUrl: false
next: false
prev: false
title: "OAuth2Config"
---

Defined in: [src/policies/auth/oauth2.ts:15](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/policies/auth/oauth2.ts#L15)

Configuration for the oauth2 policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### cacheMaxEntries?

> `optional` **cacheMaxEntries**: `number`

Defined in: [src/policies/auth/oauth2.ts:37](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/policies/auth/oauth2.ts#L37)

Maximum number of tokens to cache. Default: 100.

***

### cacheTtlSeconds?

> `optional` **cacheTtlSeconds**: `number`

Defined in: [src/policies/auth/oauth2.ts:35](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/policies/auth/oauth2.ts#L35)

Cache introspection results for this many seconds. Default: 0 (no cache).

***

### clientId?

> `optional` **clientId**: `string`

Defined in: [src/policies/auth/oauth2.ts:19](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/policies/auth/oauth2.ts#L19)

Client ID for authenticating with the introspection endpoint.

***

### clientSecret?

> `optional` **clientSecret**: `string`

Defined in: [src/policies/auth/oauth2.ts:21](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/policies/auth/oauth2.ts#L21)

Client secret for authenticating with the introspection endpoint.

***

### forwardTokenInfo?

> `optional` **forwardTokenInfo**: `Record`\<`string`, `string`\>

Defined in: [src/policies/auth/oauth2.ts:33](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/policies/auth/oauth2.ts#L33)

Map introspection response fields to request headers. Only applies with introspection.

***

### headerName?

> `optional` **headerName**: `string`

Defined in: [src/policies/auth/oauth2.ts:27](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/policies/auth/oauth2.ts#L27)

Header name when tokenLocation is "header". Default: "authorization".

***

### headerPrefix?

> `optional` **headerPrefix**: `string`

Defined in: [src/policies/auth/oauth2.ts:29](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/policies/auth/oauth2.ts#L29)

Prefix to strip from header value. Default: "Bearer".

***

### introspectionTimeoutMs?

> `optional` **introspectionTimeoutMs**: `number`

Defined in: [src/policies/auth/oauth2.ts:41](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/policies/auth/oauth2.ts#L41)

Introspection endpoint fetch timeout in milliseconds. Default: 5000.

***

### introspectionUrl?

> `optional` **introspectionUrl**: `string`

Defined in: [src/policies/auth/oauth2.ts:17](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/policies/auth/oauth2.ts#L17)

OAuth2 token introspection endpoint (RFC 7662).

***

### localValidate()?

> `optional` **localValidate**: (`token`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [src/policies/auth/oauth2.ts:23](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/policies/auth/oauth2.ts#L23)

Local validation function as alternative to introspection. Takes precedence if both provided.

#### Parameters

##### token

`string`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

***

### queryParam?

> `optional` **queryParam**: `string`

Defined in: [src/policies/auth/oauth2.ts:31](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/policies/auth/oauth2.ts#L31)

Query param name when tokenLocation is "query". Default: "access_token".

***

### requiredScopes?

> `optional` **requiredScopes**: `string`[]

Defined in: [src/policies/auth/oauth2.ts:39](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/policies/auth/oauth2.ts#L39)

Required scopes — token must have ALL of these (space-separated scope string).

***

### skip()?

> `optional` **skip**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [src/policies/types.ts:90](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/policies/types.ts#L90)

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

Defined in: [src/policies/auth/oauth2.ts:25](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/policies/auth/oauth2.ts#L25)

Where to look for the token. Default: "header".
