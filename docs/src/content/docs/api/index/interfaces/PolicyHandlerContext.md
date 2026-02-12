---
editUrl: false
next: false
prev: false
title: "PolicyHandlerContext"
---

Defined in: src/policies/sdk/define-policy.ts:23

Context injected into every `definePolicy` handler invocation.

Provides the fully-merged config, a pre-namespaced debug logger,
and the gateway context (request ID, trace ID, etc.).

## Type Parameters

### TConfig

`TConfig`

## Properties

### config

> **config**: `TConfig`

Defined in: src/policies/sdk/define-policy.ts:25

Fully merged config (defaults + user overrides).

***

### debug

> **debug**: [`DebugLogger`](/api/index/type-aliases/debuglogger/)

Defined in: src/policies/sdk/define-policy.ts:27

Debug logger pre-namespaced to `stoma:policy:{name}`. Always callable.

***

### gateway

> **gateway**: [`PolicyContext`](/api/index/interfaces/policycontext/) \| `undefined`

Defined in: src/policies/sdk/define-policy.ts:29

Gateway context, or `undefined` when running outside a gateway pipeline.
