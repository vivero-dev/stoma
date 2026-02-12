---
editUrl: false
next: false
prev: false
title: "overrideMethod"
---

> `const` **overrideMethod**: (`config?`) => [`Policy`](/api/index/interfaces/policy/)

Defined in: src/policies/transform/override-method.ts:41

Override the HTTP method of a POST request via a header.

Only applies to POST requests — the industry-standard approach for
tunneling other methods through POST. Non-POST requests with the
override header are ignored.

## Parameters

### config?

[`OverrideMethodConfig`](/api/policies/interfaces/overridemethodconfig/)

Header name and allowed override methods.

## Returns

[`Policy`](/api/index/interfaces/policy/)

A policy at priority 5 (EARLY).

## Example

```ts
// Default: reads X-HTTP-Method-Override header
overrideMethod();

// Custom header and restricted methods
overrideMethod({ header: "X-Method", allowedMethods: ["PUT", "PATCH"] });
```
