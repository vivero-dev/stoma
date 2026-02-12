---
editUrl: false
next: false
prev: false
title: "TestAdapter"
---

Defined in: src/adapters/testing.ts:9

A GatewayAdapter implementation for unit testing.

Provides a `waitUntil` implementation that collects background promises,
allowing tests to `await adapter.waitAll()` before finishing.

## Implements

- [`GatewayAdapter`](/api/index/interfaces/gatewayadapter/)

## Constructors

### Constructor

> **new TestAdapter**(): `TestAdapter`

#### Returns

`TestAdapter`

## Methods

### reset()

> **reset**(): `void`

Defined in: src/adapters/testing.ts:33

Reset the collected promises.

#### Returns

`void`

***

### waitAll()

> **waitAll**(): `Promise`\<`void`\>

Defined in: src/adapters/testing.ts:22

Await all pending background work collected via `waitUntil`.

#### Returns

`Promise`\<`void`\>

***

### waitUntil()

> **waitUntil**(`promise`): `void`

Defined in: src/adapters/testing.ts:15

Add a promise to the background work queue.

#### Parameters

##### promise

`Promise`\<`unknown`\>

#### Returns

`void`

#### Implementation of

[`GatewayAdapter`](/api/index/interfaces/gatewayadapter/).[`waitUntil`](/api/index/interfaces/gatewayadapter/#waituntil)
