---
editUrl: false
next: false
prev: false
title: "JwsConfig"
---

Defined in: src/policies/auth/jws.ts:14

Configuration for the jws policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### forwardHeaderName?

> `optional` **forwardHeaderName**: `string`

Defined in: src/policies/auth/jws.ts:26

Header name for forwarded payload. Default: "X-JWS-Payload"

***

### forwardPayload?

> `optional` **forwardPayload**: `boolean`

Defined in: src/policies/auth/jws.ts:24

Whether to forward the verified payload as a header. Default: false

***

### headerName?

> `optional` **headerName**: `string`

Defined in: src/policies/auth/jws.ts:20

Header containing the JWS. Default: "X-JWS-Signature"

***

### jwksCacheTtlMs?

> `optional` **jwksCacheTtlMs**: `number`

Defined in: src/policies/auth/jws.ts:28

JWKS cache TTL in ms. Default: 300000

***

### jwksTimeoutMs?

> `optional` **jwksTimeoutMs**: `number`

Defined in: src/policies/auth/jws.ts:30

JWKS fetch timeout in milliseconds. Default: 10000 (10 seconds).

***

### jwksUrl?

> `optional` **jwksUrl**: `string`

Defined in: src/policies/auth/jws.ts:18

JWKS endpoint for RSA verification

***

### payloadSource?

> `optional` **payloadSource**: `"body"` \| `"embedded"`

Defined in: src/policies/auth/jws.ts:22

Where the payload comes from for detached JWS. Default: "embedded"

***

### secret?

> `optional` **secret**: `string`

Defined in: src/policies/auth/jws.ts:16

HMAC secret for verification

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
