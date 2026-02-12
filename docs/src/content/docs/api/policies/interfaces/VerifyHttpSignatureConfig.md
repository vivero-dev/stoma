---
editUrl: false
next: false
prev: false
title: "VerifyHttpSignatureConfig"
---

Defined in: src/policies/auth/verify-http-signature.ts:29

Configuration for the verifyHttpSignature policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### keys

> **keys**: `Record`\<`string`, [`HttpSignatureKey`](/api/policies/interfaces/httpsignaturekey/)\>

Defined in: src/policies/auth/verify-http-signature.ts:31

Map of keyId to key material.

***

### label?

> `optional` **label**: `string`

Defined in: src/policies/auth/verify-http-signature.ts:41

Expected signature label. Default: "sig1".

***

### maxAge?

> `optional` **maxAge**: `number`

Defined in: src/policies/auth/verify-http-signature.ts:35

Max signature age in seconds. Default: 300 (5 min).

***

### requiredComponents?

> `optional` **requiredComponents**: `string`[]

Defined in: src/policies/auth/verify-http-signature.ts:33

Components that MUST be in the signature. Default: ["@method"].

***

### signatureHeaderName?

> `optional` **signatureHeaderName**: `string`

Defined in: src/policies/auth/verify-http-signature.ts:37

Signature header name. Default: "Signature".

***

### signatureInputHeaderName?

> `optional` **signatureInputHeaderName**: `string`

Defined in: src/policies/auth/verify-http-signature.ts:39

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
