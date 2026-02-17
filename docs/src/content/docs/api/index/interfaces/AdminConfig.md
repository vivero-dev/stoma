---
editUrl: false
next: false
prev: false
title: "AdminConfig"
---

Defined in: [packages/gateway/src/core/types.ts:229](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/types.ts#L229)

Configuration for the admin introspection API.

## Properties

### auth()?

> `optional` **auth**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [packages/gateway/src/core/types.ts:235](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/types.ts#L235)

Optional auth check - return `false` to deny access.

#### Parameters

##### c

`Context`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

***

### enabled

> **enabled**: `boolean`

Defined in: [packages/gateway/src/core/types.ts:231](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/types.ts#L231)

Enable admin routes. Default: `false`.

***

### metrics?

> `optional` **metrics**: [`MetricsCollector`](/api/index/interfaces/metricscollector/)

Defined in: [packages/gateway/src/core/types.ts:237](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/types.ts#L237)

MetricsCollector instance for the `/metrics` endpoint.

***

### prefix?

> `optional` **prefix**: `string`

Defined in: [packages/gateway/src/core/types.ts:233](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/types.ts#L233)

Path prefix for admin routes. Default: `"___gateway"`.
