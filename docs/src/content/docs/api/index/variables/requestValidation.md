---
editUrl: false
next: false
prev: false
title: "requestValidation"
---

> `const` **requestValidation**: (`config?`) => [`Policy`](/api/index/interfaces/policy/)

Defined in: [packages/gateway/src/policies/transform/request-validation.ts:78](https://github.com/HomeGrower-club/stoma/blob/b366835e3781c3a030f80027e784272dddf630da/packages/gateway/src/policies/transform/request-validation.ts#L78)

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
import { requestValidation } from "@vivero/stoma";

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
