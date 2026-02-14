---
editUrl: false
next: false
prev: false
title: "apiKeyAuth"
---

> `const` **apiKeyAuth**: (`config?`) => [`Policy`](/api/index/interfaces/policy/)

Defined in: [src/policies/auth/api-key-auth.ts:71](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/policies/auth/api-key-auth.ts#L71)

Validate API keys from headers or query parameters.

Checks the `X-API-Key` header by default, with an optional query parameter
fallback. The `validate` function can be async to support remote key lookups.

## Parameters

### config?

`ApiKeyAuthConfig`

API key settings with a required `validate` function.

## Returns

[`Policy`](/api/index/interfaces/policy/)

A [Policy](/api/index/interfaces/policy/) at priority 10.

## Example

```ts
// Static key validation
apiKeyAuth({
  validate: (key) => key === env.API_KEY,
});

// Async validation with query parameter fallback
apiKeyAuth({
  headerName: "Authorization",
  queryParam: "api_key",
  validate: async (key) => {
    const result = await kv.get(`api-key:${key}`);
    return result !== null;
  },
});
```
