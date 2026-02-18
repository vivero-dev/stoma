---
editUrl: false
next: false
prev: false
title: "assignContent"
---

> `const` **assignContent**: (`config?`) => [`Policy`](/api/index/interfaces/policy/)

Defined in: [packages/gateway/src/policies/transform/assign-content.ts:79](https://github.com/HomeGrower-club/stoma/blob/b366835e3781c3a030f80027e784272dddf630da/packages/gateway/src/policies/transform/assign-content.ts#L79)

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
import { assignContent } from "@vivero/stoma";

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
