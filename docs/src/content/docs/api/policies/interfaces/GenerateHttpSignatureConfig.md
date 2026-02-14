---
editUrl: false
next: false
prev: false
title: "GenerateHttpSignatureConfig"
---

Defined in: [src/policies/auth/generate-http-signature.ts:21](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/auth/generate-http-signature.ts#L21)

Configuration for the generateHttpSignature policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### algorithm

> **algorithm**: `string`

Defined in: [src/policies/auth/generate-http-signature.ts:29](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/auth/generate-http-signature.ts#L29)

Signing algorithm identifier (e.g. "hmac-sha256", "rsa-pss-sha512", "rsa-v1_5-sha256").

***

### components?

> `optional` **components**: `string`[]

Defined in: [src/policies/auth/generate-http-signature.ts:31](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/auth/generate-http-signature.ts#L31)

Components to include in signature. Default: ["@method", "@path", "@authority"].

***

### expires?

> `optional` **expires**: `number`

Defined in: [src/policies/auth/generate-http-signature.ts:39](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/auth/generate-http-signature.ts#L39)

Signature expiry in seconds from creation. Optional.

***

### keyId

> **keyId**: `string`

Defined in: [src/policies/auth/generate-http-signature.ts:23](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/auth/generate-http-signature.ts#L23)

Key identifier included in signature parameters.

***

### label?

> `optional` **label**: `string`

Defined in: [src/policies/auth/generate-http-signature.ts:37](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/auth/generate-http-signature.ts#L37)

Signature label. Default: "sig1".

***

### nonce?

> `optional` **nonce**: `boolean`

Defined in: [src/policies/auth/generate-http-signature.ts:41](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/auth/generate-http-signature.ts#L41)

Include a nonce parameter. Default: false.

***

### privateKey?

> `optional` **privateKey**: `JsonWebKey`

Defined in: [src/policies/auth/generate-http-signature.ts:27](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/auth/generate-http-signature.ts#L27)

RSA private key as JWK.

***

### secret?

> `optional` **secret**: `string`

Defined in: [src/policies/auth/generate-http-signature.ts:25](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/auth/generate-http-signature.ts#L25)

HMAC secret for signing.

***

### signatureHeaderName?

> `optional` **signatureHeaderName**: `string`

Defined in: [src/policies/auth/generate-http-signature.ts:33](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/auth/generate-http-signature.ts#L33)

Signature header name. Default: "Signature".

***

### signatureInputHeaderName?

> `optional` **signatureInputHeaderName**: `string`

Defined in: [src/policies/auth/generate-http-signature.ts:35](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/auth/generate-http-signature.ts#L35)

Signature-Input header name. Default: "Signature-Input".

***

### skip()?

> `optional` **skip**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [src/policies/types.ts:69](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/types.ts#L69)

Skip this policy when condition returns true

#### Parameters

##### c

`unknown`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

#### Inherited from

[`PolicyConfig`](/api/index/interfaces/policyconfig/).[`skip`](/api/index/interfaces/policyconfig/#skip)
