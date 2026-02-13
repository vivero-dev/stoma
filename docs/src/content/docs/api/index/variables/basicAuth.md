---
editUrl: false
next: false
prev: false
title: "basicAuth"
---

> `const` **basicAuth**: (`config?`) => [`Policy`](/api/index/interfaces/policy/)

Defined in: [src/policies/auth/basic-auth.ts:42](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/auth/basic-auth.ts#L42)

Basic Authentication policy — validate base64-encoded credentials.

Sends a `WWW-Authenticate` header on failure to prompt browser credential dialogs.
The realm is sanitized to prevent header injection.

## Parameters

### config?

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
