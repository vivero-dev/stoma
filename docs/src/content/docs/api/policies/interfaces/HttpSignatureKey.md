---
editUrl: false
next: false
prev: false
title: "HttpSignatureKey"
---

Defined in: [packages/stoma/src/policies/auth/verify-http-signature.ts:20](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/auth/verify-http-signature.ts#L20)

Configuration for the verifyHttpSignature policy.

## Properties

### algorithm

> **algorithm**: `string`

Defined in: [packages/stoma/src/policies/auth/verify-http-signature.ts:26](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/auth/verify-http-signature.ts#L26)

Algorithm identifier.

***

### publicKey?

> `optional` **publicKey**: `JsonWebKey`

Defined in: [packages/stoma/src/policies/auth/verify-http-signature.ts:24](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/auth/verify-http-signature.ts#L24)

RSA public key as JWK.

***

### secret?

> `optional` **secret**: `string`

Defined in: [packages/stoma/src/policies/auth/verify-http-signature.ts:22](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/auth/verify-http-signature.ts#L22)

HMAC secret.
