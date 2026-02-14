---
editUrl: false
next: false
prev: false
title: "interrupt"
---

> `const` **interrupt**: (`config`) => [`Policy`](/api/index/interfaces/policy/)

Defined in: [src/policies/traffic/interrupt.ts:49](https://github.com/HomeGrower-club/stoma/blob/6293f5d254fea2989ebdf0b4b444e914a25475fc/src/policies/traffic/interrupt.ts#L49)

Conditionally short-circuit the pipeline and return a static response.

Evaluates a predicate against the incoming request context. When the
condition returns `true`, the pipeline is interrupted — a response is
returned immediately and `next()` is never called (upstream is skipped).
When the condition returns `false`, the pipeline continues normally.

## Parameters

### config

[`InterruptConfig`](/api/policies/interfaces/interruptconfig/)

Condition predicate, status code, body, and headers.

## Returns

[`Policy`](/api/index/interfaces/policy/)

A [Policy](/api/index/interfaces/policy/) at priority 100 (default — users typically set a custom priority).

## Example

```ts
// Maintenance mode
interrupt({
  condition: (c) => c.req.header("x-maintenance") === "true",
  statusCode: 503,
  body: { maintenance: true, message: "Back soon" },
  headers: { "retry-after": "300" },
});

// Health check short-circuit
interrupt({
  condition: (c) => c.req.path === "/healthz",
  body: "ok",
});
```
