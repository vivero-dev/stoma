---
editUrl: false
next: false
prev: false
title: "ReadableSpan"
---

Defined in: [packages/gateway/src/observability/tracing.ts:22](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/observability/tracing.ts#L22)

An immutable representation of a completed span.

## Properties

### attributes

> **attributes**: `Record`\<`string`, `string` \| `number` \| `boolean`\>

Defined in: [packages/gateway/src/observability/tracing.ts:30](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/observability/tracing.ts#L30)

***

### endTimeMs

> **endTimeMs**: `number`

Defined in: [packages/gateway/src/observability/tracing.ts:29](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/observability/tracing.ts#L29)

***

### events

> **events**: [`SpanEvent`](/api/index/interfaces/spanevent/)[]

Defined in: [packages/gateway/src/observability/tracing.ts:32](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/observability/tracing.ts#L32)

***

### kind

> **kind**: [`SpanKind`](/api/index/type-aliases/spankind/)

Defined in: [packages/gateway/src/observability/tracing.ts:27](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/observability/tracing.ts#L27)

***

### name

> **name**: `string`

Defined in: [packages/gateway/src/observability/tracing.ts:26](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/observability/tracing.ts#L26)

***

### parentSpanId?

> `optional` **parentSpanId**: `string`

Defined in: [packages/gateway/src/observability/tracing.ts:25](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/observability/tracing.ts#L25)

***

### spanId

> **spanId**: `string`

Defined in: [packages/gateway/src/observability/tracing.ts:24](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/observability/tracing.ts#L24)

***

### startTimeMs

> **startTimeMs**: `number`

Defined in: [packages/gateway/src/observability/tracing.ts:28](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/observability/tracing.ts#L28)

***

### status

> **status**: `object`

Defined in: [packages/gateway/src/observability/tracing.ts:31](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/observability/tracing.ts#L31)

#### code

> **code**: [`SpanStatusCode`](/api/index/type-aliases/spanstatuscode/)

#### message?

> `optional` **message**: `string`

***

### traceId

> **traceId**: `string`

Defined in: [packages/gateway/src/observability/tracing.ts:23](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/observability/tracing.ts#L23)
