---
editUrl: false
next: false
prev: false
title: "requestValidation"
---

> `const` **requestValidation**: (`config?`) => [`Policy`](/api/index/interfaces/policy/)

Defined in: [src/policies/transform/request-validation.ts:81](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/policies/transform/request-validation.ts#L81)

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
