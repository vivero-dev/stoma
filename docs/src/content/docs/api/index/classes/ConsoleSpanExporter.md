---
editUrl: false
next: false
prev: false
title: "ConsoleSpanExporter"
---

Defined in: [src/observability/tracing.ts:332](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/observability/tracing.ts#L332)

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

Defined in: [src/observability/tracing.ts:333](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/observability/tracing.ts#L333)

#### Parameters

##### spans

[`ReadableSpan`](/api/index/interfaces/readablespan/)[]

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`SpanExporter`](/api/index/interfaces/spanexporter/).[`export`](/api/index/interfaces/spanexporter/#export)
