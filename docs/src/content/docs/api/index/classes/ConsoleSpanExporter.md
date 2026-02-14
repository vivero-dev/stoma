---
editUrl: false
next: false
prev: false
title: "ConsoleSpanExporter"
---

Defined in: [src/observability/tracing.ts:328](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/observability/tracing.ts#L328)

Console span exporter for development and debugging.

Logs each span to `console.debug()` with a compact one-line format
showing name, kind, duration, trace/span IDs, and status.

## Implements

- [`SpanExporter`](/api/index/interfaces/spanexporter/)

## Constructors

### Constructor

> **new ConsoleSpanExporter**(): `ConsoleSpanExporter`

#### Returns

`ConsoleSpanExporter`

## Methods

### export()

> **export**(`spans`): `Promise`\<`void`\>

Defined in: [src/observability/tracing.ts:329](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/observability/tracing.ts#L329)

#### Parameters

##### spans

[`ReadableSpan`](/api/index/interfaces/readablespan/)[]

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`SpanExporter`](/api/index/interfaces/spanexporter/).[`export`](/api/index/interfaces/spanexporter/#export)
