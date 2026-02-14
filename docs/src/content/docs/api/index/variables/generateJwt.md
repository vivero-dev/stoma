---
editUrl: false
next: false
prev: false
title: "generateJwt"
---

> `const` **generateJwt**: (`config?`) => [`Policy`](/api/index/interfaces/policy/)

Defined in: [src/policies/auth/generate-jwt.ts:88](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/auth/generate-jwt.ts#L88)

Mint JWTs and attach them to the request for upstream consumption.

## Parameters

### config?

[`GenerateJwtConfig`](/api/policies/interfaces/generatejwtconfig/)

## Returns

[`Policy`](/api/index/interfaces/policy/)

## Example

```ts
import { generateJwt } from "@homegrower-club/stoma";

generateJwt({
  algorithm: "HS256",
  secret: env.JWT_SIGNING_SECRET,
  claims: (c) => ({ sub: c.req.header("x-user-id") }),
  issuer: "my-gateway",
  expiresIn: 300,
});
```
