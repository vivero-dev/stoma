---
editUrl: false
next: false
prev: false
title: "requestValidation"
---

> `const` **requestValidation**: (`config?`) => [`Policy`](/api/index/interfaces/policy/)

Defined in: [packages/gateway/src/policies/transform/request-validation.ts:78](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/transform/request-validation.ts#L78)

Pluggable request body validation policy.

Validates the request body using a user-provided sync or async function.
Requests with content types not in the configured list pass through
without validation.

## Parameters

### config?

[`RequestValidationConfig`](/api/policies/interfaces/requestvalidationconfig/)

## Returns

[`Policy`](/api/index/interfaces/policy/)

## Example

```ts
import { requestValidation } from "@homegrower-club/stoma";

// Simple boolean validator
requestValidation({
  validate: (body) => body != null && typeof body === "object",
});

// Detailed validation with error messages
requestValidation({
  validate: (body) => {
    const errors: string[] = [];
    if (!body || typeof body !== "object") errors.push("Body must be an object");
    return { valid: errors.length === 0, errors };
  },
});
```
