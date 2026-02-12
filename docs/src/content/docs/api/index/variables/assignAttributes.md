---
editUrl: false
next: false
prev: false
title: "assignAttributes"
---

> `const` **assignAttributes**: (`config?`) => [`Policy`](/api/index/interfaces/policy/)

Defined in: src/policies/transform/assign-attributes.ts:40

Set key-value attributes on the Hono request context.

## Parameters

### config?

[`AssignAttributesConfig`](/api/policies/interfaces/assignattributesconfig/)

Must include `attributes` — a record of keys to values or resolver functions.

## Returns

[`Policy`](/api/index/interfaces/policy/)

A [Policy](/api/index/interfaces/policy/) at priority 50 (REQUEST_TRANSFORM).

## Example

```ts
import { assignAttributes } from "@homegrower-club/stoma";

assignAttributes({
  attributes: {
    "x-tenant": "acme",
    "x-request-path": (c) => new URL(c.req.url).pathname,
  },
});
```
