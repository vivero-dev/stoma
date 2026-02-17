---
editUrl: false
next: false
prev: false
title: "mock"
---

> `const` **mock**: (`config?`) => [`Policy`](/api/index/interfaces/policy/)

Defined in: [packages/gateway/src/policies/mock.ts:63](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/mock.ts#L63)

Return a static mock response, bypassing the upstream entirely.

Useful for development stubs, testing, and placeholder routes. Runs at
priority 999 (always last) and short-circuits - `next()` is never called,
so no upstream request is made. Object bodies are automatically
JSON-serialized with `content-type: application/json`.

## Parameters

### config?

`MockConfig`

Status code, response body, headers, and artificial delay. All fields optional.

## Returns

[`Policy`](/api/index/interfaces/policy/)

A [Policy](/api/index/interfaces/policy/) at priority 999 (replaces the upstream).

## Example

```ts
import { createGateway } from "@homegrower-club/stoma";
import { mock } from "@homegrower-club/stoma/policies";

createGateway({
  routes: [{
    path: "/api/stub",
    pipeline: {
      policies: [
        // Return a JSON stub with 200ms simulated latency
        mock({
          body: { message: "Hello from stub" },
          delayMs: 200,
        }),
      ],
      upstream: { type: "handler", handler: () => new Response() }, // never reached
    },
  }],
});

// Simulate a 503 maintenance page
mock({
  status: 503,
  body: "Service temporarily unavailable",
  headers: { "retry-after": "300" },
});
```
