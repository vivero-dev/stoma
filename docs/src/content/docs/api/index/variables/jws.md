---
editUrl: false
next: false
prev: false
title: "jws"
---

> `const` **jws**: (`config?`) => [`Policy`](/api/index/interfaces/policy/)

Defined in: [packages/gateway/src/policies/auth/jws.ts:72](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/jws.ts#L72)

Verify JWS compact serialization signatures on requests.

The `none` algorithm is always rejected to prevent signature bypass attacks.
Config validation (`secret` or `jwksUrl` required) is performed at construction
time - a missing config throws immediately, not on first request.

## Parameters

### config?

[`JwsConfig`](/api/policies/interfaces/jwsconfig/)

## Returns

[`Policy`](/api/index/interfaces/policy/)

## Example

```ts
import { jws } from "@homegrower-club/stoma";

// HMAC verification with embedded payload
jws({ secret: env.JWS_SECRET });

// Detached JWS - payload comes from the request body
jws({ secret: env.JWS_SECRET, payloadSource: "body" });
```
