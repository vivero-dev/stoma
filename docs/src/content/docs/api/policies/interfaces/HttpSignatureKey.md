---
editUrl: false
next: false
prev: false
title: "HttpSignatureKey"
---

Defined in: [packages/gateway/src/policies/auth/verify-http-signature.ts:21](https://github.com/HomeGrower-club/stoma/blob/b366835e3781c3a030f80027e784272dddf630da/packages/gateway/src/policies/auth/verify-http-signature.ts#L21)

Configuration for the verifyHttpSignature policy.

## Properties

### algorithm

> **algorithm**: `string`

Defined in: [packages/gateway/src/policies/auth/verify-http-signature.ts:27](https://github.com/HomeGrower-club/stoma/blob/b366835e3781c3a030f80027e784272dddf630da/packages/gateway/src/policies/auth/verify-http-signature.ts#L27)

Algorithm identifier.

***

### publicKey?

> `optional` **publicKey**: `JsonWebKey`

Defined in: [packages/gateway/src/policies/auth/verify-http-signature.ts:25](https://github.com/HomeGrower-club/stoma/blob/b366835e3781c3a030f80027e784272dddf630da/packages/gateway/src/policies/auth/verify-http-signature.ts#L25)

RSA public key as JWK.

***

### secret?

> `optional` **secret**: `string`

Defined in: [packages/gateway/src/policies/auth/verify-http-signature.ts:23](https://github.com/HomeGrower-club/stoma/blob/b366835e3781c3a030f80027e784272dddf630da/packages/gateway/src/policies/auth/verify-http-signature.ts#L23)

HMAC secret.
