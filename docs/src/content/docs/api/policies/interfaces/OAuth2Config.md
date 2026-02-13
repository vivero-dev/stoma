---
editUrl: false
next: false
prev: false
title: "OAuth2Config"
---

Defined in: [src/policies/auth/oauth2.ts:14](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/auth/oauth2.ts#L14)

Configuration for the oauth2 policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### cacheTtlSeconds?

> `optional` **cacheTtlSeconds**: `number`

Defined in: [src/policies/auth/oauth2.ts:34](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/auth/oauth2.ts#L34)

Cache introspection results for this many seconds. Default: 0 (no cache).

***

### clientId?

> `optional` **clientId**: `string`

Defined in: [src/policies/auth/oauth2.ts:18](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/auth/oauth2.ts#L18)

Client ID for authenticating with the introspection endpoint.

***

### clientSecret?

> `optional` **clientSecret**: `string`

Defined in: [src/policies/auth/oauth2.ts:20](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/auth/oauth2.ts#L20)

Client secret for authenticating with the introspection endpoint.

***

### forwardTokenInfo?

> `optional` **forwardTokenInfo**: `Record`\<`string`, `string`\>

Defined in: [src/policies/auth/oauth2.ts:32](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/auth/oauth2.ts#L32)

Map introspection response fields to request headers. Only applies with introspection.

***

### headerName?

> `optional` **headerName**: `string`

Defined in: [src/policies/auth/oauth2.ts:26](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/auth/oauth2.ts#L26)

Header name when tokenLocation is "header". Default: "authorization".

***

### headerPrefix?

> `optional` **headerPrefix**: `string`

Defined in: [src/policies/auth/oauth2.ts:28](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/auth/oauth2.ts#L28)

Prefix to strip from header value. Default: "Bearer".

***

### introspectionTimeoutMs?

> `optional` **introspectionTimeoutMs**: `number`

Defined in: [src/policies/auth/oauth2.ts:38](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/auth/oauth2.ts#L38)

Introspection endpoint fetch timeout in milliseconds. Default: 5000.

***

### introspectionUrl?

> `optional` **introspectionUrl**: `string`

Defined in: [src/policies/auth/oauth2.ts:16](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/auth/oauth2.ts#L16)

OAuth2 token introspection endpoint (RFC 7662).

***

### localValidate()?

> `optional` **localValidate**: (`token`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [src/policies/auth/oauth2.ts:22](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/auth/oauth2.ts#L22)

Local validation function as alternative to introspection. Takes precedence if both provided.

#### Parameters

##### token

`string`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

***

### queryParam?

> `optional` **queryParam**: `string`

Defined in: [src/policies/auth/oauth2.ts:30](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/auth/oauth2.ts#L30)

Query param name when tokenLocation is "query". Default: "access_token".

***

### requiredScopes?

> `optional` **requiredScopes**: `string`[]

Defined in: [src/policies/auth/oauth2.ts:36](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/auth/oauth2.ts#L36)

Required scopes — token must have ALL of these (space-separated scope string).

***

### skip()?

> `optional` **skip**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [src/policies/types.ts:69](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/types.ts#L69)

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

Defined in: [src/policies/auth/oauth2.ts:24](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/auth/oauth2.ts#L24)

Where to look for the token. Default: "header".
