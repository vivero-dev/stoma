---
editUrl: false
next: false
prev: false
title: "GenerateHttpSignatureConfig"
---

Defined in: [packages/stoma/src/policies/auth/generate-http-signature.ts:20](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/auth/generate-http-signature.ts#L20)

Configuration for the generateHttpSignature policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### algorithm

> **algorithm**: `string`

Defined in: [packages/stoma/src/policies/auth/generate-http-signature.ts:28](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/auth/generate-http-signature.ts#L28)

Signing algorithm identifier (e.g. "hmac-sha256", "rsa-pss-sha512", "rsa-v1_5-sha256").

***

### components?

> `optional` **components**: `string`[]

Defined in: [packages/stoma/src/policies/auth/generate-http-signature.ts:30](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/auth/generate-http-signature.ts#L30)

Components to include in signature. Default: ["@method", "@path", "@authority"].

***

### expires?

> `optional` **expires**: `number`

Defined in: [packages/stoma/src/policies/auth/generate-http-signature.ts:38](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/auth/generate-http-signature.ts#L38)

Signature expiry in seconds from creation. Optional.

***

### keyId

> **keyId**: `string`

Defined in: [packages/stoma/src/policies/auth/generate-http-signature.ts:22](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/auth/generate-http-signature.ts#L22)

Key identifier included in signature parameters.

***

### label?

> `optional` **label**: `string`

Defined in: [packages/stoma/src/policies/auth/generate-http-signature.ts:36](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/auth/generate-http-signature.ts#L36)

Signature label. Default: "sig1".

***

### nonce?

> `optional` **nonce**: `boolean`

Defined in: [packages/stoma/src/policies/auth/generate-http-signature.ts:40](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/auth/generate-http-signature.ts#L40)

Include a nonce parameter. Default: false.

***

### privateKey?

> `optional` **privateKey**: `JsonWebKey`

Defined in: [packages/stoma/src/policies/auth/generate-http-signature.ts:26](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/auth/generate-http-signature.ts#L26)

RSA private key as JWK.

***

### secret?

> `optional` **secret**: `string`

Defined in: [packages/stoma/src/policies/auth/generate-http-signature.ts:24](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/auth/generate-http-signature.ts#L24)

HMAC secret for signing.

***

### signatureHeaderName?

> `optional` **signatureHeaderName**: `string`

Defined in: [packages/stoma/src/policies/auth/generate-http-signature.ts:32](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/auth/generate-http-signature.ts#L32)

Signature header name. Default: "Signature".

***

### signatureInputHeaderName?

> `optional` **signatureInputHeaderName**: `string`

Defined in: [packages/stoma/src/policies/auth/generate-http-signature.ts:34](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/auth/generate-http-signature.ts#L34)

Signature-Input header name. Default: "Signature-Input".

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
