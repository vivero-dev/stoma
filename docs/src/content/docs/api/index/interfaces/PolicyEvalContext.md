---
editUrl: false
next: false
prev: false
title: "PolicyEvalContext"
---

Defined in: [packages/gateway/src/core/protocol.ts:267](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/protocol.ts#L267)

Runtime-facing evaluation context provided to policy evaluators.

This is the base context without typed config - runtimes construct
this from their native request representation. The policy SDK
([definePolicy](/api/index/functions/definepolicy/)) extends this with a typed `config` field
via `PolicyEvalHandlerContext`.

## Extended by

- [`PolicyEvalHandlerContext`](/api/index/interfaces/policyevalhandlercontext/)

## Properties

### adapter?

> `optional` **adapter**: [`GatewayAdapter`](/api/index/interfaces/gatewayadapter/)

Defined in: [packages/gateway/src/core/protocol.ts:277](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/protocol.ts#L277)

Runtime adapter (stores, waitUntil, etc.).

***

### debug

> **debug**: [`DebugLogger`](/api/index/type-aliases/debuglogger/)

Defined in: [packages/gateway/src/core/protocol.ts:269](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/protocol.ts#L269)

Debug logger pre-namespaced to `stoma:policy:{name}`. Always callable.

***

### requestId

> **requestId**: `string`

Defined in: [packages/gateway/src/core/protocol.ts:273](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/protocol.ts#L273)

Unique request ID for correlation.

***

### trace

> **trace**: [`TraceReporter`](/api/index/type-aliases/tracereporter/)

Defined in: [packages/gateway/src/core/protocol.ts:271](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/protocol.ts#L271)

Trace reporter - always callable, no-op when tracing is not active.

***

### traceId

> **traceId**: `string`

Defined in: [packages/gateway/src/core/protocol.ts:275](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/protocol.ts#L275)

W3C trace ID (32-hex).
