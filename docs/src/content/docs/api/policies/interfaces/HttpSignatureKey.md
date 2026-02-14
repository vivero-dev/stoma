---
editUrl: false
next: false
prev: false
title: "HttpSignatureKey"
---

Defined in: [src/policies/auth/verify-http-signature.ts:21](https://github.com/HomeGrower-club/stoma/blob/64d47b2a9c6564c1291a5dd9d515f24b13c13c53/src/policies/auth/verify-http-signature.ts#L21)

Configuration for the verifyHttpSignature policy.

## Properties

### algorithm

> **algorithm**: `string`

Defined in: [src/policies/auth/verify-http-signature.ts:27](https://github.com/HomeGrower-club/stoma/blob/64d47b2a9c6564c1291a5dd9d515f24b13c13c53/src/policies/auth/verify-http-signature.ts#L27)

Algorithm identifier.

***

### publicKey?

> `optional` **publicKey**: `JsonWebKey`

Defined in: [src/policies/auth/verify-http-signature.ts:25](https://github.com/HomeGrower-club/stoma/blob/64d47b2a9c6564c1291a5dd9d515f24b13c13c53/src/policies/auth/verify-http-signature.ts#L25)

RSA public key as JWK.

***

### secret?

> `optional` **secret**: `string`

Defined in: [src/policies/auth/verify-http-signature.ts:23](https://github.com/HomeGrower-club/stoma/blob/64d47b2a9c6564c1291a5dd9d515f24b13c13c53/src/policies/auth/verify-http-signature.ts#L23)

HMAC secret.
