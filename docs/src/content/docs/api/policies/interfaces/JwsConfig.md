---
editUrl: false
next: false
prev: false
title: "JwsConfig"
---

Defined in: [src/policies/auth/jws.ts:22](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/auth/jws.ts#L22)

Configuration for the jws policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### forwardHeaderName?

> `optional` **forwardHeaderName**: `string`

Defined in: [src/policies/auth/jws.ts:34](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/auth/jws.ts#L34)

Header name for forwarded payload. Default: "X-JWS-Payload"

***

### forwardPayload?

> `optional` **forwardPayload**: `boolean`

Defined in: [src/policies/auth/jws.ts:32](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/auth/jws.ts#L32)

Whether to forward the verified payload as a header. Default: false

***

### headerName?

> `optional` **headerName**: `string`

Defined in: [src/policies/auth/jws.ts:28](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/auth/jws.ts#L28)

Header containing the JWS. Default: "X-JWS-Signature"

***

### jwksCacheTtlMs?

> `optional` **jwksCacheTtlMs**: `number`

Defined in: [src/policies/auth/jws.ts:36](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/auth/jws.ts#L36)

JWKS cache TTL in ms. Default: 300000

***

### jwksTimeoutMs?

> `optional` **jwksTimeoutMs**: `number`

Defined in: [src/policies/auth/jws.ts:38](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/auth/jws.ts#L38)

JWKS fetch timeout in milliseconds. Default: 10000 (10 seconds).

***

### jwksUrl?

> `optional` **jwksUrl**: `string`

Defined in: [src/policies/auth/jws.ts:26](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/auth/jws.ts#L26)

JWKS endpoint for RSA verification

***

### payloadSource?

> `optional` **payloadSource**: `"body"` \| `"embedded"`

Defined in: [src/policies/auth/jws.ts:30](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/auth/jws.ts#L30)

Where the payload comes from for detached JWS. Default: "embedded"

***

### secret?

> `optional` **secret**: `string`

Defined in: [src/policies/auth/jws.ts:24](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/auth/jws.ts#L24)

HMAC secret for verification

***

### skip()?

> `optional` **skip**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [src/policies/types.ts:90](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/types.ts#L90)

Skip this policy when condition returns true

#### Parameters

##### c

`unknown`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

#### Inherited from

[`PolicyConfig`](/api/index/interfaces/policyconfig/).[`skip`](/api/index/interfaces/policyconfig/#skip)
