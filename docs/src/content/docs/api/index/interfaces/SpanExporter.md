---
editUrl: false
next: false
prev: false
title: "SpanExporter"
---

Defined in: [src/observability/tracing.ts:49](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/observability/tracing.ts#L49)

Pluggable span exporter interface.

Implementations ship completed spans to a backend (OTLP collector,
console, or any custom destination). Export is expected to be called
via `waitUntil()` so it does not block the response.

## Methods

### export()

> **export**(`spans`): `Promise`\<`void`\>

Defined in: [src/observability/tracing.ts:50](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/observability/tracing.ts#L50)

#### Parameters

##### spans

[`ReadableSpan`](/api/index/interfaces/readablespan/)[]

#### Returns

`Promise`\<`void`\>

***

### shutdown()?

> `optional` **shutdown**(): `Promise`\<`void`\>

Defined in: [src/observability/tracing.ts:51](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/observability/tracing.ts#L51)

#### Returns

`Promise`\<`void`\>
