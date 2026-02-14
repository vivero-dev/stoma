---
editUrl: false
next: false
prev: false
title: "dynamicRouting"
---

> `const` **dynamicRouting**: (`config?`) => [`Policy`](/api/index/interfaces/policy/)

Defined in: [src/policies/traffic/dynamic-routing.ts:63](https://github.com/HomeGrower-club/stoma/blob/8ff27bd832ace97bceae4b05831dd71d1ac6ed6a/src/policies/traffic/dynamic-routing.ts#L63)

Evaluate routing rules and expose the first match on request context.

Evaluates rules in order. The first matching rule's target, rewritePath,
and headers are set as context variables for downstream consumption.

## Parameters

### config?

[`DynamicRoutingConfig`](/api/policies/interfaces/dynamicroutingconfig/)

Routing rules and fallthrough behavior.

## Returns

[`Policy`](/api/index/interfaces/policy/)

A [Policy](/api/index/interfaces/policy/) at priority 50 (REQUEST_TRANSFORM).

## Example

```ts
dynamicRouting({
  rules: [
    {
      name: "v2-api",
      condition: (c) => c.req.header("x-api-version") === "2",
      target: "https://api-v2.internal",
      rewritePath: (path) => path.replace("/api/", "/v2/"),
    },
    {
      name: "default",
      condition: () => true,
      target: "https://api-v1.internal",
    },
  ],
});
```
