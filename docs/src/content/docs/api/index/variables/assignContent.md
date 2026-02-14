---
editUrl: false
next: false
prev: false
title: "assignContent"
---

> `const` **assignContent**: (`config?`) => [`Policy`](/api/index/interfaces/policy/)

Defined in: [src/policies/transform/assign-content.ts:79](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/policies/transform/assign-content.ts#L79)

Assign content policy.

Injects or overrides fields in JSON request and/or response bodies.
Useful for injecting tenant IDs, timestamps, metadata, or other
fields that should be transparently added by the gateway.

## Parameters

### config?

[`AssignContentConfig`](/api/policies/interfaces/assigncontentconfig/)

## Returns

[`Policy`](/api/index/interfaces/policy/)

## Example

```ts
import { assignContent } from "@homegrower-club/stoma";

assignContent({
  request: {
    tenantId: "acme",
    timestamp: (c) => new Date().toISOString(),
  },
  response: {
    gateway: "stoma",
  },
});
```
