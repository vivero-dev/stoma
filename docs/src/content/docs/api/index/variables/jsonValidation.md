---
editUrl: false
next: false
prev: false
title: "jsonValidation"
---

> `const` **jsonValidation**: (`config?`) => [`Policy`](/api/index/interfaces/policy/)

Defined in: [src/policies/transform/json-validation.ts:61](https://github.com/HomeGrower-club/stoma/blob/08b5f2db5f15b4e339eff6647be9d231bf97a776/src/policies/transform/json-validation.ts#L61)

Pluggable JSON body validation policy.

Validates the request body using a user-provided function. When no
`validate` function is configured, checks that the body is parseable JSON.
Requests with content types not in the configured list pass through
without validation.

## Parameters

### config?

[`JsonValidationConfig`](/api/policies/interfaces/jsonvalidationconfig/)

## Returns

[`Policy`](/api/index/interfaces/policy/)

## Example

```ts
import { jsonValidation } from "@homegrower-club/stoma";

// With Zod
jsonValidation({
  validate: (body) => {
    const result = myZodSchema.safeParse(body);
    return {
      valid: result.success,
      errors: result.success ? undefined : result.error.issues.map(i => i.message),
    };
  },
});

// Just validate JSON is parseable (no validate function)
jsonValidation();
```
