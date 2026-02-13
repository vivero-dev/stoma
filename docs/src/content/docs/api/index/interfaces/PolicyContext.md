---
editUrl: false
next: false
prev: false
title: "PolicyContext"
---

Defined in: [packages/stoma/src/policies/types.ts:37](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/types.ts#L37)

Context available to policies during execution

## Properties

### adapter?

> `optional` **adapter**: [`GatewayAdapter`](/api/index/interfaces/gatewayadapter/)

Defined in: [packages/stoma/src/policies/types.ts:63](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/types.ts#L63)

Runtime adapter providing store implementations and runtime-specific capabilities.

***

### debug()

> **debug**: (`namespace`) => [`DebugLogger`](/api/index/type-aliases/debuglogger/)

Defined in: [packages/stoma/src/policies/types.ts:61](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/types.ts#L61)

Get a debug logger for the given namespace.
Returns a no-op when debug is disabled (zero overhead).

#### Parameters

##### namespace

`string`

#### Returns

[`DebugLogger`](/api/index/type-aliases/debuglogger/)

#### Example

```ts
const ctx = getGatewayContext(c);
const debug = ctx?.debug("stoma:policy:cache");
debug?.("HIT", cacheKey);
```

***

### gatewayName

> **gatewayName**: `string`

Defined in: [packages/stoma/src/policies/types.ts:43](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/types.ts#L43)

Gateway name

***

### requestId

> **requestId**: `string`

Defined in: [packages/stoma/src/policies/types.ts:39](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/types.ts#L39)

Unique request ID for tracing

***

### routePath

> **routePath**: `string`

Defined in: [packages/stoma/src/policies/types.ts:45](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/types.ts#L45)

Matched route path pattern

***

### spanId

> **spanId**: `string`

Defined in: [packages/stoma/src/policies/types.ts:49](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/types.ts#L49)

W3C Trace Context — 16-hex span ID for this gateway request.

***

### startTime

> **startTime**: `number`

Defined in: [packages/stoma/src/policies/types.ts:41](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/types.ts#L41)

Timestamp when the request entered the gateway

***

### traceId

> **traceId**: `string`

Defined in: [packages/stoma/src/policies/types.ts:47](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/types.ts#L47)

W3C Trace Context — 32-hex trace ID (propagated or generated).
