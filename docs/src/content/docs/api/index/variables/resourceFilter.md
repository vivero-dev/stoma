---
editUrl: false
next: false
prev: false
title: "resourceFilter"
---

> `const` **resourceFilter**: (`config?`) => [`Policy`](/api/index/interfaces/policy/)

Defined in: [src/policies/traffic/resource-filter.ts:108](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/traffic/resource-filter.ts#L108)

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
