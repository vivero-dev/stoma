---
editUrl: false
next: false
prev: false
title: "PolicyHandlerContext"
---

Defined in: [src/policies/sdk/define-policy.ts:34](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/sdk/define-policy.ts#L34)

Context injected into every `definePolicy` handler invocation.

Provides the fully-merged config, a pre-namespaced debug logger,
and the gateway context (request ID, trace ID, etc.).

## Type Parameters

### TConfig

`TConfig`

## Properties

### config

> **config**: `TConfig`

Defined in: [src/policies/sdk/define-policy.ts:36](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/sdk/define-policy.ts#L36)

Fully merged config (defaults + user overrides).

***

### debug

> **debug**: [`DebugLogger`](/api/index/type-aliases/debuglogger/)

Defined in: [src/policies/sdk/define-policy.ts:38](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/sdk/define-policy.ts#L38)

Debug logger pre-namespaced to `stoma:policy:{name}`. Always callable.

***

### gateway

> **gateway**: [`PolicyContext`](/api/index/interfaces/policycontext/) \| `undefined`

Defined in: [src/policies/sdk/define-policy.ts:42](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/sdk/define-policy.ts#L42)

Gateway context, or `undefined` when running outside a gateway pipeline.

***

### trace

> **trace**: [`TraceReporter`](/api/index/type-aliases/tracereporter/)

Defined in: [src/policies/sdk/define-policy.ts:40](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/sdk/define-policy.ts#L40)

Trace reporter — always callable, no-op when tracing is not active.
