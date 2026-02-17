---
editUrl: false
next: false
prev: false
title: "PolicyEvalHandlerContext"
---

Defined in: [packages/gateway/src/policies/sdk/define-policy.ts:52](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/sdk/define-policy.ts#L52)

Context injected into `definePolicy` evaluate handlers.

Parallel to [PolicyHandlerContext](/api/index/interfaces/policyhandlercontext/) but protocol-agnostic -
no Hono types. Extends the runtime-facing [PolicyEvalContext](/api/index/interfaces/policyevalcontext/)
with the fully-merged, typed config.

## Extends

- [`PolicyEvalContext`](/api/index/interfaces/policyevalcontext/)

## Type Parameters

### TConfig

`TConfig`

## Properties

### adapter?

> `optional` **adapter**: [`GatewayAdapter`](/api/index/interfaces/gatewayadapter/)

Defined in: [packages/gateway/src/core/protocol.ts:277](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/protocol.ts#L277)

Runtime adapter (stores, waitUntil, etc.).

#### Inherited from

[`PolicyEvalContext`](/api/index/interfaces/policyevalcontext/).[`adapter`](/api/index/interfaces/policyevalcontext/#adapter)

***

### config

> **config**: `TConfig`

Defined in: [packages/gateway/src/policies/sdk/define-policy.ts:54](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/sdk/define-policy.ts#L54)

Fully merged config (defaults + user overrides).

***

### debug

> **debug**: [`DebugLogger`](/api/index/type-aliases/debuglogger/)

Defined in: [packages/gateway/src/core/protocol.ts:269](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/protocol.ts#L269)

Debug logger pre-namespaced to `stoma:policy:{name}`. Always callable.

#### Inherited from

[`PolicyEvalContext`](/api/index/interfaces/policyevalcontext/).[`debug`](/api/index/interfaces/policyevalcontext/#debug)

***

### requestId

> **requestId**: `string`

Defined in: [packages/gateway/src/core/protocol.ts:273](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/protocol.ts#L273)

Unique request ID for correlation.

#### Inherited from

[`PolicyEvalContext`](/api/index/interfaces/policyevalcontext/).[`requestId`](/api/index/interfaces/policyevalcontext/#requestid)

***

### trace

> **trace**: [`TraceReporter`](/api/index/type-aliases/tracereporter/)

Defined in: [packages/gateway/src/core/protocol.ts:271](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/protocol.ts#L271)

Trace reporter - always callable, no-op when tracing is not active.

#### Inherited from

[`PolicyEvalContext`](/api/index/interfaces/policyevalcontext/).[`trace`](/api/index/interfaces/policyevalcontext/#trace)

***

### traceId

> **traceId**: `string`

Defined in: [packages/gateway/src/core/protocol.ts:275](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/protocol.ts#L275)

W3C trace ID (32-hex).

#### Inherited from

[`PolicyEvalContext`](/api/index/interfaces/policyevalcontext/).[`traceId`](/api/index/interfaces/policyevalcontext/#traceid)
