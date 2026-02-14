---
editUrl: false
next: false
prev: false
title: "PolicyContext"
---

Defined in: [src/policies/types.ts:73](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/types.ts#L73)

Context available to policies during execution

## Properties

### adapter?

> `optional` **adapter**: [`GatewayAdapter`](/api/index/interfaces/gatewayadapter/)

Defined in: [src/policies/types.ts:99](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/types.ts#L99)

Runtime adapter providing store implementations and runtime-specific capabilities.

***

### debug()

> **debug**: (`namespace`) => [`DebugLogger`](/api/index/type-aliases/debuglogger/)

Defined in: [src/policies/types.ts:97](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/types.ts#L97)

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

Defined in: [src/policies/types.ts:79](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/types.ts#L79)

Gateway name

***

### requestId

> **requestId**: `string`

Defined in: [src/policies/types.ts:75](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/types.ts#L75)

Unique request ID for tracing

***

### routePath

> **routePath**: `string`

Defined in: [src/policies/types.ts:81](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/types.ts#L81)

Matched route path pattern

***

### spanId

> **spanId**: `string`

Defined in: [src/policies/types.ts:85](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/types.ts#L85)

W3C Trace Context — 16-hex span ID for this gateway request.

***

### startTime

> **startTime**: `number`

Defined in: [src/policies/types.ts:77](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/types.ts#L77)

Timestamp when the request entered the gateway

***

### traceId

> **traceId**: `string`

Defined in: [src/policies/types.ts:83](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/types.ts#L83)

W3C Trace Context — 32-hex trace ID (propagated or generated).
