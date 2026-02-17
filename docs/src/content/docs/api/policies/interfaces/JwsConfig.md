---
editUrl: false
next: false
prev: false
title: "JwsConfig"
---

Defined in: [packages/gateway/src/policies/auth/jws.ts:23](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/jws.ts#L23)

Configuration for the jws policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### forwardHeaderName?

> `optional` **forwardHeaderName**: `string`

Defined in: [packages/gateway/src/policies/auth/jws.ts:35](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/jws.ts#L35)

Header name for forwarded payload. Default: "X-JWS-Payload"

***

### forwardPayload?

> `optional` **forwardPayload**: `boolean`

Defined in: [packages/gateway/src/policies/auth/jws.ts:33](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/jws.ts#L33)

Whether to forward the verified payload as a header. Default: false

***

### headerName?

> `optional` **headerName**: `string`

Defined in: [packages/gateway/src/policies/auth/jws.ts:29](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/jws.ts#L29)

Header containing the JWS. Default: "X-JWS-Signature"

***

### jwksCacheTtlMs?

> `optional` **jwksCacheTtlMs**: `number`

Defined in: [packages/gateway/src/policies/auth/jws.ts:37](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/jws.ts#L37)

JWKS cache TTL in ms. Default: 300000

***

### jwksTimeoutMs?

> `optional` **jwksTimeoutMs**: `number`

Defined in: [packages/gateway/src/policies/auth/jws.ts:39](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/jws.ts#L39)

JWKS fetch timeout in milliseconds. Default: 10000 (10 seconds).

***

### jwksUrl?

> `optional` **jwksUrl**: `string`

Defined in: [packages/gateway/src/policies/auth/jws.ts:27](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/jws.ts#L27)

JWKS endpoint for RSA verification

***

### payloadSource?

> `optional` **payloadSource**: `"body"` \| `"embedded"`

Defined in: [packages/gateway/src/policies/auth/jws.ts:31](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/jws.ts#L31)

Where the payload comes from for detached JWS. Default: "embedded"

***

### secret?

> `optional` **secret**: `string`

Defined in: [packages/gateway/src/policies/auth/jws.ts:25](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/jws.ts#L25)

HMAC secret for verification

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
