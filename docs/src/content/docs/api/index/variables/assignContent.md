---
editUrl: false
next: false
prev: false
title: "assignContent"
---

> `const` **assignContent**: (`config?`) => [`Policy`](/api/index/interfaces/policy/)

Defined in: [packages/stoma/src/policies/transform/assign-content.ts:76](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/transform/assign-content.ts#L76)

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
