---
editUrl: false
next: false
prev: false
title: "verifyHttpSignature"
---

> `const` **verifyHttpSignature**: (`config`) => [`Policy`](/api/index/interfaces/policy/)

Defined in: [packages/gateway/src/policies/auth/verify-http-signature.ts:45](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/verify-http-signature.ts#L45)

Verify RFC 9421 HTTP Message Signatures on inbound requests with key ID lookup (priority 10).

## Parameters

### config

[`VerifyHttpSignatureConfig`](/api/policies/interfaces/verifyhttpsignatureconfig/)

## Returns

[`Policy`](/api/index/interfaces/policy/)
