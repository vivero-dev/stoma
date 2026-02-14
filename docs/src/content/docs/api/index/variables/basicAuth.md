---
editUrl: false
next: false
prev: false
title: "basicAuth"
---

> `const` **basicAuth**: (`config`) => [`Policy`](/api/index/interfaces/policy/)

Defined in: [src/policies/auth/basic-auth.ts:43](https://github.com/HomeGrower-club/stoma/blob/64d47b2a9c6564c1291a5dd9d515f24b13c13c53/src/policies/auth/basic-auth.ts#L43)

Basic Authentication policy - validate base64-encoded credentials.

Sends a `WWW-Authenticate` header on failure to prompt browser credential dialogs.
The realm is sanitized to prevent header injection.

## Parameters

### config

`BasicAuthConfig`

Validation function and optional realm name.

## Returns

[`Policy`](/api/index/interfaces/policy/)

A [Policy](/api/index/interfaces/policy/) at priority 10.

## Example

```ts
basicAuth({
  realm: "Admin Area",
  validate: async (username, password) => {
    return username === "admin" && password === env.ADMIN_PASSWORD;
  },
});
```
