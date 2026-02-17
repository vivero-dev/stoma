---
editUrl: false
next: false
prev: false
title: "TestAdapter"
---

Defined in: [packages/gateway/src/adapters/testing.ts:9](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/testing.ts#L9)

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

Defined in: [packages/gateway/src/adapters/testing.ts:33](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/testing.ts#L33)

Reset the collected promises.

#### Returns

`void`

***

### waitAll()

> **waitAll**(): `Promise`\<`void`\>

Defined in: [packages/gateway/src/adapters/testing.ts:22](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/testing.ts#L22)

Await all pending background work collected via `waitUntil`.

#### Returns

`Promise`\<`void`\>

***

### waitUntil()

> **waitUntil**(`promise`): `void`

Defined in: [packages/gateway/src/adapters/testing.ts:15](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/testing.ts#L15)

Add a promise to the background work queue.

#### Parameters

##### promise

`Promise`\<`unknown`\>

#### Returns

`void`

#### Implementation of

[`GatewayAdapter`](/api/index/interfaces/gatewayadapter/).[`waitUntil`](/api/index/interfaces/gatewayadapter/#waituntil)
