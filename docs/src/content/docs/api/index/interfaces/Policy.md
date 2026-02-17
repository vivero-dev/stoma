---
editUrl: false
next: false
prev: false
title: "Policy"
---

Defined in: [packages/gateway/src/policies/types.ts:35](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/types.ts#L35)

A Policy is a named middleware with priority ordering and optional
protocol-agnostic evaluation.

- [handler](/api/index/interfaces/policy/#handler) - HTTP runtime entry point (Hono middleware).
  Used by [createGateway](/api/index/functions/creategateway/).
- [evaluate](/api/index/interfaces/policy/#evaluate) - Protocol-agnostic entry point. Used by non-HTTP
  runtimes (ext_proc, WebSocket) to invoke the policy without Hono.
- [phases](/api/index/interfaces/policy/#phases) - Which processing phases this policy participates in.
  Used by phase-based runtimes to skip irrelevant policies.
- [httpOnly](/api/index/interfaces/policy/#httponly) - Set to `true` for policies that can ONLY work with
  the HTTP protocol and don't make sense for ext_proc or WebSocket.

## Properties

### evaluate?

> `optional` **evaluate**: [`PolicyEvaluator`](/api/index/interfaces/policyevaluator/)

Defined in: [packages/gateway/src/policies/types.ts:53](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/types.ts#L53)

Protocol-agnostic evaluation entry point.

Used by non-HTTP runtimes (ext_proc, WebSocket) to invoke this
policy without Hono. The HTTP runtime ([createGateway](/api/index/functions/creategateway/)) uses
[handler](/api/index/interfaces/policy/#handler) directly and ignores this field.

Policies that implement `evaluate` work across all runtimes.
Policies that only implement `handler` are HTTP-only.

***

### handler

> **handler**: `MiddlewareHandler`

Defined in: [packages/gateway/src/policies/types.ts:39](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/types.ts#L39)

The Hono middleware handler - HTTP runtime entry point.

***

### httpOnly?

> `optional` **httpOnly**: `true`

Defined in: [packages/gateway/src/policies/types.ts:84](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/types.ts#L84)

Set to `true` for policies that only work with the HTTP protocol.

These policies rely on HTTP-specific concepts (Request/Response objects,
specific headers, HTTP status codes, etc.) and cannot be meaningfully
evaluated in other protocols like ext_proc or WebSocket.

Examples:
- `cors` - uses HTTP-specific `Access-Control-*` headers
- `ssl-enforce` - HTTP-only protocol concept
- `proxy` - HTTP-to-HTTP forwarding
- `mock` - returns HTTP Response objects

Tooling can use this flag to:
- Skip these policies when generating docs for non-HTTP runtimes
- Warn if an HTTP-only policy is used in a non-HTTP gateway config

***

### name

> **name**: `string`

Defined in: [packages/gateway/src/policies/types.ts:37](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/types.ts#L37)

Unique policy name (e.g. "jwt-auth", "rate-limit")

***

### phases?

> `optional` **phases**: [`ProcessingPhase`](/api/index/type-aliases/processingphase/)[]

Defined in: [packages/gateway/src/policies/types.ts:65](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/types.ts#L65)

Processing phases this policy participates in.

Used by phase-based runtimes (ext_proc) to skip policies that don't
apply to the current processing phase. For example, a JWT auth policy
only needs `"request-headers"`, while a response transform policy
needs `"response-headers"` and `"response-body"`.

Default: `["request-headers"]` (most policies only inspect request headers).

***

### priority?

> `optional` **priority**: `number`

Defined in: [packages/gateway/src/policies/types.ts:41](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/types.ts#L41)

Policy priority - lower numbers execute first. Default: 100.
