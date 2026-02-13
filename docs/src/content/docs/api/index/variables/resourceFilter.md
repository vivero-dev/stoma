---
editUrl: false
next: false
prev: false
title: "resourceFilter"
---

> `const` **resourceFilter**: (`config?`) => [`Policy`](/api/index/interfaces/policy/)

Defined in: [src/policies/traffic/resource-filter.ts:105](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/policies/traffic/resource-filter.ts#L105)

Strip or allow fields from JSON responses.

## Parameters

### config?

[`ResourceFilterConfig`](/api/policies/interfaces/resourcefilterconfig/)

## Returns

[`Policy`](/api/index/interfaces/policy/)

## Example

```ts
import { resourceFilter } from "@homegrower-club/stoma";

// Remove sensitive fields
resourceFilter({
  mode: "deny",
  fields: ["password", "user.ssn"],
});

// Keep only specific fields
resourceFilter({
  mode: "allow",
  fields: ["id", "name", "email"],
});
```
