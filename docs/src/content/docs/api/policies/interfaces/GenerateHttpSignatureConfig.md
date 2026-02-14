---
editUrl: false
next: false
prev: false
title: "GenerateHttpSignatureConfig"
---

Defined in: [src/policies/auth/generate-http-signature.ts:22](https://github.com/HomeGrower-club/stoma/blob/64d47b2a9c6564c1291a5dd9d515f24b13c13c53/src/policies/auth/generate-http-signature.ts#L22)

Configuration for the generateHttpSignature policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### algorithm

> **algorithm**: `string`

Defined in: [src/policies/auth/generate-http-signature.ts:30](https://github.com/HomeGrower-club/stoma/blob/64d47b2a9c6564c1291a5dd9d515f24b13c13c53/src/policies/auth/generate-http-signature.ts#L30)

Signing algorithm identifier (e.g. "hmac-sha256", "rsa-pss-sha512", "rsa-v1_5-sha256").

***

### components?

> `optional` **components**: `string`[]

Defined in: [src/policies/auth/generate-http-signature.ts:32](https://github.com/HomeGrower-club/stoma/blob/64d47b2a9c6564c1291a5dd9d515f24b13c13c53/src/policies/auth/generate-http-signature.ts#L32)

Components to include in signature. Default: ["@method", "@path", "@authority"].

***

### expires?

> `optional` **expires**: `number`

Defined in: [src/policies/auth/generate-http-signature.ts:40](https://github.com/HomeGrower-club/stoma/blob/64d47b2a9c6564c1291a5dd9d515f24b13c13c53/src/policies/auth/generate-http-signature.ts#L40)

Signature expiry in seconds from creation. Optional.

***

### keyId

> **keyId**: `string`

Defined in: [src/policies/auth/generate-http-signature.ts:24](https://github.com/HomeGrower-club/stoma/blob/64d47b2a9c6564c1291a5dd9d515f24b13c13c53/src/policies/auth/generate-http-signature.ts#L24)

Key identifier included in signature parameters.

***

### label?

> `optional` **label**: `string`

Defined in: [src/policies/auth/generate-http-signature.ts:38](https://github.com/HomeGrower-club/stoma/blob/64d47b2a9c6564c1291a5dd9d515f24b13c13c53/src/policies/auth/generate-http-signature.ts#L38)

Signature label. Default: "sig1".

***

### nonce?

> `optional` **nonce**: `boolean`

Defined in: [src/policies/auth/generate-http-signature.ts:42](https://github.com/HomeGrower-club/stoma/blob/64d47b2a9c6564c1291a5dd9d515f24b13c13c53/src/policies/auth/generate-http-signature.ts#L42)

Include a nonce parameter. Default: false.

***

### privateKey?

> `optional` **privateKey**: `JsonWebKey`

Defined in: [src/policies/auth/generate-http-signature.ts:28](https://github.com/HomeGrower-club/stoma/blob/64d47b2a9c6564c1291a5dd9d515f24b13c13c53/src/policies/auth/generate-http-signature.ts#L28)

RSA private key as JWK.

***

### secret?

> `optional` **secret**: `string`

Defined in: [src/policies/auth/generate-http-signature.ts:26](https://github.com/HomeGrower-club/stoma/blob/64d47b2a9c6564c1291a5dd9d515f24b13c13c53/src/policies/auth/generate-http-signature.ts#L26)

HMAC secret for signing.

***

### signatureHeaderName?

> `optional` **signatureHeaderName**: `string`

Defined in: [src/policies/auth/generate-http-signature.ts:34](https://github.com/HomeGrower-club/stoma/blob/64d47b2a9c6564c1291a5dd9d515f24b13c13c53/src/policies/auth/generate-http-signature.ts#L34)

Signature header name. Default: "Signature".

***

### signatureInputHeaderName?

> `optional` **signatureInputHeaderName**: `string`

Defined in: [src/policies/auth/generate-http-signature.ts:36](https://github.com/HomeGrower-club/stoma/blob/64d47b2a9c6564c1291a5dd9d515f24b13c13c53/src/policies/auth/generate-http-signature.ts#L36)

Signature-Input header name. Default: "Signature-Input".

***

### skip()?

> `optional` **skip**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [src/policies/types.ts:90](https://github.com/HomeGrower-club/stoma/blob/64d47b2a9c6564c1291a5dd9d515f24b13c13c53/src/policies/types.ts#L90)

Skip this policy when condition returns true

#### Parameters

##### c

`unknown`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

#### Inherited from

[`PolicyConfig`](/api/index/interfaces/policyconfig/).[`skip`](/api/index/interfaces/policyconfig/#skip)
