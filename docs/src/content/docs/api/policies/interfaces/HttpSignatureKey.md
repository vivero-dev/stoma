---
editUrl: false
next: false
prev: false
title: "HttpSignatureKey"
---

Defined in: src/policies/auth/verify-http-signature.ts:20

Configuration for the verifyHttpSignature policy.

## Properties

### algorithm

> **algorithm**: `string`

Defined in: src/policies/auth/verify-http-signature.ts:26

Algorithm identifier.

***

### publicKey?

> `optional` **publicKey**: `JsonWebKey`

Defined in: src/policies/auth/verify-http-signature.ts:24

RSA public key as JWK.

***

### secret?

> `optional` **secret**: `string`

Defined in: src/policies/auth/verify-http-signature.ts:22

HMAC secret.
