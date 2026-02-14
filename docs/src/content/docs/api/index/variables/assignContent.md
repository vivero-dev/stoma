---
editUrl: false
next: false
prev: false
title: "assignContent"
---

> `const` **assignContent**: (`config?`) => [`Policy`](/api/index/interfaces/policy/)

Defined in: [src/policies/transform/assign-content.ts:79](https://github.com/HomeGrower-club/stoma/blob/08b5f2db5f15b4e339eff6647be9d231bf97a776/src/policies/transform/assign-content.ts#L79)

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
