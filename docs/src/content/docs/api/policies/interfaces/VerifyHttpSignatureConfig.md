---
editUrl: false
next: false
prev: false
title: "VerifyHttpSignatureConfig"
---

Defined in: [packages/gateway/src/policies/auth/verify-http-signature.ts:30](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/verify-http-signature.ts#L30)

Configuration for the verifyHttpSignature policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### keys

> **keys**: `Record`\<`string`, [`HttpSignatureKey`](/api/policies/interfaces/httpsignaturekey/)\>

Defined in: [packages/gateway/src/policies/auth/verify-http-signature.ts:32](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/verify-http-signature.ts#L32)

Map of keyId to key material.

***

### label?

> `optional` **label**: `string`

Defined in: [packages/gateway/src/policies/auth/verify-http-signature.ts:42](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/verify-http-signature.ts#L42)

Expected signature label. Default: "sig1".

***

### maxAge?

> `optional` **maxAge**: `number`

Defined in: [packages/gateway/src/policies/auth/verify-http-signature.ts:36](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/verify-http-signature.ts#L36)

Max signature age in seconds. Default: 300 (5 min).

***

### requiredComponents?

> `optional` **requiredComponents**: `string`[]

Defined in: [packages/gateway/src/policies/auth/verify-http-signature.ts:34](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/verify-http-signature.ts#L34)

Components that MUST be in the signature. Default: ["@method"].

***

### signatureHeaderName?

> `optional` **signatureHeaderName**: `string`

Defined in: [packages/gateway/src/policies/auth/verify-http-signature.ts:38](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/verify-http-signature.ts#L38)

Signature header name. Default: "Signature".

***

### signatureInputHeaderName?

> `optional` **signatureInputHeaderName**: `string`

Defined in: [packages/gateway/src/policies/auth/verify-http-signature.ts:40](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/verify-http-signature.ts#L40)

Signature-Input header name. Default: "Signature-Input".

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
