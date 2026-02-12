---
editUrl: false
next: false
prev: false
title: "OAuth2Config"
---

Defined in: src/policies/auth/oauth2.ts:13

Configuration for the oauth2 policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### cacheTtlSeconds?

> `optional` **cacheTtlSeconds**: `number`

Defined in: src/policies/auth/oauth2.ts:33

Cache introspection results for this many seconds. Default: 0 (no cache).

***

### clientId?

> `optional` **clientId**: `string`

Defined in: src/policies/auth/oauth2.ts:17

Client ID for authenticating with the introspection endpoint.

***

### clientSecret?

> `optional` **clientSecret**: `string`

Defined in: src/policies/auth/oauth2.ts:19

Client secret for authenticating with the introspection endpoint.

***

### forwardTokenInfo?

> `optional` **forwardTokenInfo**: `Record`\<`string`, `string`\>

Defined in: src/policies/auth/oauth2.ts:31

Map introspection response fields to request headers. Only applies with introspection.

***

### headerName?

> `optional` **headerName**: `string`

Defined in: src/policies/auth/oauth2.ts:25

Header name when tokenLocation is "header". Default: "authorization".

***

### headerPrefix?

> `optional` **headerPrefix**: `string`

Defined in: src/policies/auth/oauth2.ts:27

Prefix to strip from header value. Default: "Bearer".

***

### introspectionTimeoutMs?

> `optional` **introspectionTimeoutMs**: `number`

Defined in: src/policies/auth/oauth2.ts:37

Introspection endpoint fetch timeout in milliseconds. Default: 5000.

***

### introspectionUrl?

> `optional` **introspectionUrl**: `string`

Defined in: src/policies/auth/oauth2.ts:15

OAuth2 token introspection endpoint (RFC 7662).

***

### localValidate()?

> `optional` **localValidate**: (`token`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: src/policies/auth/oauth2.ts:21

Local validation function as alternative to introspection. Takes precedence if both provided.

#### Parameters

##### token

`string`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

***

### queryParam?

> `optional` **queryParam**: `string`

Defined in: src/policies/auth/oauth2.ts:29

Query param name when tokenLocation is "query". Default: "access_token".

***

### requiredScopes?

> `optional` **requiredScopes**: `string`[]

Defined in: src/policies/auth/oauth2.ts:35

Required scopes — token must have ALL of these (space-separated scope string).

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

### tokenLocation?

> `optional` **tokenLocation**: `"query"` \| `"header"`

Defined in: src/policies/auth/oauth2.ts:23

Where to look for the token. Default: "header".
