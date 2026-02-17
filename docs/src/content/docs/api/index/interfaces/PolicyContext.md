---
editUrl: false
next: false
prev: false
title: "PolicyContext"
---

Defined in: [packages/gateway/src/policies/types.ts:94](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/types.ts#L94)

Context available to policies during execution

## Properties

### adapter?

> `optional` **adapter**: [`GatewayAdapter`](/api/index/interfaces/gatewayadapter/)

Defined in: [packages/gateway/src/policies/types.ts:120](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/types.ts#L120)

Runtime adapter providing store implementations and runtime-specific capabilities.

***

### debug()

> **debug**: (`namespace`) => [`DebugLogger`](/api/index/type-aliases/debuglogger/)

Defined in: [packages/gateway/src/policies/types.ts:118](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/types.ts#L118)

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

Defined in: [packages/gateway/src/policies/types.ts:100](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/types.ts#L100)

Gateway name

***

### requestId

> **requestId**: `string`

Defined in: [packages/gateway/src/policies/types.ts:96](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/types.ts#L96)

Unique request ID for tracing

***

### routePath

> **routePath**: `string`

Defined in: [packages/gateway/src/policies/types.ts:102](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/types.ts#L102)

Matched route path pattern

***

### spanId

> **spanId**: `string`

Defined in: [packages/gateway/src/policies/types.ts:106](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/types.ts#L106)

W3C Trace Context - 16-hex span ID for this gateway request.

***

### startTime

> **startTime**: `number`

Defined in: [packages/gateway/src/policies/types.ts:98](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/types.ts#L98)

Timestamp when the request entered the gateway

***

### traceId

> **traceId**: `string`

Defined in: [packages/gateway/src/policies/types.ts:104](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/types.ts#L104)

W3C Trace Context - 32-hex trace ID (propagated or generated).
