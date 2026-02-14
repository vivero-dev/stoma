---
editUrl: false
next: false
prev: false
title: "SpanBuilder"
---

Defined in: [src/observability/tracing.ts:90](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/observability/tracing.ts#L90)

Mutable span builder — accumulates attributes, events, and status
during a request lifecycle. Call [end](/api/index/classes/spanbuilder/#end) to produce an immutable
[ReadableSpan](/api/index/interfaces/readablespan/).

## Constructors

### Constructor

> **new SpanBuilder**(`name`, `kind`, `traceId`, `spanId`, `parentSpanId?`, `startTimeMs?`): `SpanBuilder`

Defined in: [src/observability/tracing.ts:98](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/observability/tracing.ts#L98)

#### Parameters

##### name

`string`

##### kind

[`SpanKind`](/api/index/type-aliases/spankind/)

##### traceId

`string`

##### spanId

`string`

##### parentSpanId?

`string`

##### startTimeMs?

`number` = `...`

#### Returns

`SpanBuilder`

## Properties

### kind

> `readonly` **kind**: [`SpanKind`](/api/index/type-aliases/spankind/)

Defined in: [src/observability/tracing.ts:100](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/observability/tracing.ts#L100)

***

### name

> `readonly` **name**: `string`

Defined in: [src/observability/tracing.ts:99](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/observability/tracing.ts#L99)

***

### parentSpanId?

> `readonly` `optional` **parentSpanId**: `string`

Defined in: [src/observability/tracing.ts:103](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/observability/tracing.ts#L103)

***

### spanId

> `readonly` **spanId**: `string`

Defined in: [src/observability/tracing.ts:102](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/observability/tracing.ts#L102)

***

### startTimeMs

> `readonly` **startTimeMs**: `number`

Defined in: [src/observability/tracing.ts:104](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/observability/tracing.ts#L104)

***

### traceId

> `readonly` **traceId**: `string`

Defined in: [src/observability/tracing.ts:101](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/observability/tracing.ts#L101)

## Methods

### addEvent()

> **addEvent**(`name`, `attributes?`): `this`

Defined in: [src/observability/tracing.ts:114](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/observability/tracing.ts#L114)

Record a timestamped event with optional attributes. Chainable.

#### Parameters

##### name

`string`

##### attributes?

`Record`\<`string`, `string` \| `number` \| `boolean`\>

#### Returns

`this`

***

### end()

> **end**(): [`ReadableSpan`](/api/index/interfaces/readablespan/)

Defined in: [src/observability/tracing.ts:134](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/observability/tracing.ts#L134)

Finalize the span and return an immutable [ReadableSpan](/api/index/interfaces/readablespan/).

Sets `endTimeMs` on first call; subsequent calls return the same
snapshot with defensive copies of mutable fields.

#### Returns

[`ReadableSpan`](/api/index/interfaces/readablespan/)

***

### setAttribute()

> **setAttribute**(`key`, `value`): `this`

Defined in: [src/observability/tracing.ts:108](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/observability/tracing.ts#L108)

Set a single attribute. Chainable.

#### Parameters

##### key

`string`

##### value

`string` | `number` | `boolean`

#### Returns

`this`

***

### setStatus()

> **setStatus**(`code`, `message?`): `this`

Defined in: [src/observability/tracing.ts:123](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/observability/tracing.ts#L123)

Set the span status. Chainable.

#### Parameters

##### code

[`SpanStatusCode`](/api/index/type-aliases/spanstatuscode/)

##### message?

`string`

#### Returns

`this`
