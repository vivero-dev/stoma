---
editUrl: false
next: false
prev: false
title: "PolicyHandlerContext"
---

Defined in: [packages/stoma/src/policies/sdk/define-policy.ts:24](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/sdk/define-policy.ts#L24)

Context injected into every `definePolicy` handler invocation.

Provides the fully-merged config, a pre-namespaced debug logger,
and the gateway context (request ID, trace ID, etc.).

## Type Parameters

### TConfig

`TConfig`

## Properties

### config

> **config**: `TConfig`

Defined in: [packages/stoma/src/policies/sdk/define-policy.ts:26](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/sdk/define-policy.ts#L26)

Fully merged config (defaults + user overrides).

***

### debug

> **debug**: [`DebugLogger`](/api/index/type-aliases/debuglogger/)

Defined in: [packages/stoma/src/policies/sdk/define-policy.ts:28](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/sdk/define-policy.ts#L28)

Debug logger pre-namespaced to `stoma:policy:{name}`. Always callable.

***

### gateway

> **gateway**: [`PolicyContext`](/api/index/interfaces/policycontext/) \| `undefined`

Defined in: [packages/stoma/src/policies/sdk/define-policy.ts:32](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/sdk/define-policy.ts#L32)

Gateway context, or `undefined` when running outside a gateway pipeline.

***

### trace

> **trace**: [`TraceReporter`](/api/index/type-aliases/tracereporter/)

Defined in: [packages/stoma/src/policies/sdk/define-policy.ts:30](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/sdk/define-policy.ts#L30)

Trace reporter — always callable, no-op when tracing is not active.
