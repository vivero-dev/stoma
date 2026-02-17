---
editUrl: false
next: false
prev: false
title: "ServerTimingConfig"
---

Defined in: [packages/gateway/src/policies/observability/server-timing.ts:25](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/observability/server-timing.ts#L25)

Configuration for the [serverTiming](/api/index/variables/servertiming/) policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### descriptionFn()?

> `optional` **descriptionFn**: (`name`) => `string`

Defined in: [packages/gateway/src/policies/observability/server-timing.ts:35](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/observability/server-timing.ts#L35)

Optional function to generate a description for each timing entry.

#### Parameters

##### name

`string`

#### Returns

`string`

***

### includeTotal?

> `optional` **includeTotal**: `boolean`

Defined in: [packages/gateway/src/policies/observability/server-timing.ts:33](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/observability/server-timing.ts#L33)

Add a `total` entry to `Server-Timing`. Default: `true`.

***

### precision?

> `optional` **precision**: `number`

Defined in: [packages/gateway/src/policies/observability/server-timing.ts:31](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/observability/server-timing.ts#L31)

Number of decimal places for duration values. Default: `1`.

***

### responseTimeHeader?

> `optional` **responseTimeHeader**: `boolean`

Defined in: [packages/gateway/src/policies/observability/server-timing.ts:29](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/observability/server-timing.ts#L29)

Emit the `X-Response-Time` header with total gateway time. Default: `true`.

***

### serverTimingHeader?

> `optional` **serverTimingHeader**: `boolean`

Defined in: [packages/gateway/src/policies/observability/server-timing.ts:27](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/observability/server-timing.ts#L27)

Emit the `Server-Timing` header with per-policy breakdown. Default: `true`.

***

### skip()?

> `optional` **skip**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [packages/gateway/src/policies/types.ts:90](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/types.ts#L90)

Skip this policy when condition returns true

#### Parameters

##### c

`unknown`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

#### Inherited from

[`PolicyConfig`](/api/index/interfaces/policyconfig/).[`skip`](/api/index/interfaces/policyconfig/#skip)

***

### visibility?

> `optional` **visibility**: [`ServerTimingVisibility`](/api/index/type-aliases/servertimingvisibility/)

Defined in: [packages/gateway/src/policies/observability/server-timing.ts:37](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/observability/server-timing.ts#L37)

Controls when timing headers are emitted. Default: `"debug-only"`.

***

### visibilityFn()?

> `optional` **visibilityFn**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [packages/gateway/src/policies/observability/server-timing.ts:39](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/observability/server-timing.ts#L39)

Required when `visibility` is `"conditional"`. Called per-request to decide.

#### Parameters

##### c

`Context`

#### Returns

`boolean` \| `Promise`\<`boolean`\>
