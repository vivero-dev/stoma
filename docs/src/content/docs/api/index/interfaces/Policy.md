---
editUrl: false
next: false
prev: false
title: "Policy"
---

Defined in: [src/policies/types.ts:33](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/types.ts#L33)

A Policy is a named middleware with priority ordering and optional
protocol-agnostic evaluation.

- [handler](/api/index/interfaces/policy/#handler) — HTTP runtime entry point (Hono middleware).
  Used by [createGateway](/api/index/functions/creategateway/).
- [evaluate](/api/index/interfaces/policy/#evaluate) — Protocol-agnostic entry point. Used by non-HTTP
  runtimes (ext_proc, WebSocket) to invoke the policy without Hono.
- [phases](/api/index/interfaces/policy/#phases) — Which processing phases this policy participates in.
  Used by phase-based runtimes to skip irrelevant policies.

## Properties

### evaluate?

> `optional` **evaluate**: [`PolicyEvaluator`](/api/index/interfaces/policyevaluator/)

Defined in: [src/policies/types.ts:51](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/types.ts#L51)

Protocol-agnostic evaluation entry point.

Used by non-HTTP runtimes (ext_proc, WebSocket) to invoke this
policy without Hono. The HTTP runtime ([createGateway](/api/index/functions/creategateway/)) uses
[handler](/api/index/interfaces/policy/#handler) directly and ignores this field.

Policies that implement `evaluate` work across all runtimes.
Policies that only implement `handler` are HTTP-only.

***

### handler

> **handler**: `MiddlewareHandler`

Defined in: [src/policies/types.ts:37](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/types.ts#L37)

The Hono middleware handler — HTTP runtime entry point.

***

### name

> **name**: `string`

Defined in: [src/policies/types.ts:35](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/types.ts#L35)

Unique policy name (e.g. "jwt-auth", "rate-limit")

***

### phases?

> `optional` **phases**: [`ProcessingPhase`](/api/index/type-aliases/processingphase/)[]

Defined in: [src/policies/types.ts:63](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/types.ts#L63)

Processing phases this policy participates in.

Used by phase-based runtimes (ext_proc) to skip policies that don't
apply to the current processing phase. For example, a JWT auth policy
only needs `"request-headers"`, while a response transform policy
needs `"response-headers"` and `"response-body"`.

Default: `["request-headers"]` (most policies only inspect request headers).

***

### priority?

> `optional` **priority**: `number`

Defined in: [src/policies/types.ts:39](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/types.ts#L39)

Policy priority — lower numbers execute first. Default: 100.
