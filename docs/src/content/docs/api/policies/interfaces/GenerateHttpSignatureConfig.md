---
editUrl: false
next: false
prev: false
title: "GenerateHttpSignatureConfig"
---

Defined in: src/policies/auth/generate-http-signature.ts:20

Configuration for the generateHttpSignature policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### algorithm

> **algorithm**: `string`

Defined in: src/policies/auth/generate-http-signature.ts:28

Signing algorithm identifier (e.g. "hmac-sha256", "rsa-pss-sha512", "rsa-v1_5-sha256").

***

### components?

> `optional` **components**: `string`[]

Defined in: src/policies/auth/generate-http-signature.ts:30

Components to include in signature. Default: ["@method", "@path", "@authority"].

***

### expires?

> `optional` **expires**: `number`

Defined in: src/policies/auth/generate-http-signature.ts:38

Signature expiry in seconds from creation. Optional.

***

### keyId

> **keyId**: `string`

Defined in: src/policies/auth/generate-http-signature.ts:22

Key identifier included in signature parameters.

***

### label?

> `optional` **label**: `string`

Defined in: src/policies/auth/generate-http-signature.ts:36

Signature label. Default: "sig1".

***

### nonce?

> `optional` **nonce**: `boolean`

Defined in: src/policies/auth/generate-http-signature.ts:40

Include a nonce parameter. Default: false.

***

### privateKey?

> `optional` **privateKey**: `JsonWebKey`

Defined in: src/policies/auth/generate-http-signature.ts:26

RSA private key as JWK.

***

### secret?

> `optional` **secret**: `string`

Defined in: src/policies/auth/generate-http-signature.ts:24

HMAC secret for signing.

***

### signatureHeaderName?

> `optional` **signatureHeaderName**: `string`

Defined in: src/policies/auth/generate-http-signature.ts:32

Signature header name. Default: "Signature".

***

### signatureInputHeaderName?

> `optional` **signatureInputHeaderName**: `string`

Defined in: src/policies/auth/generate-http-signature.ts:34

Signature-Input header name. Default: "Signature-Input".

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
