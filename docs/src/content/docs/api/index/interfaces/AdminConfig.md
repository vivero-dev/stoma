---
editUrl: false
next: false
prev: false
title: "AdminConfig"
---

Defined in: [src/core/types.ts:229](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/core/types.ts#L229)

Configuration for the admin introspection API.

## Properties

### auth()?

> `optional` **auth**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [src/core/types.ts:235](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/core/types.ts#L235)

Optional auth check — return `false` to deny access.

#### Parameters

##### c

`Context`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

***

### enabled

> **enabled**: `boolean`

Defined in: [src/core/types.ts:231](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/core/types.ts#L231)

Enable admin routes. Default: `false`.

***

### metrics?

> `optional` **metrics**: [`MetricsCollector`](/api/index/interfaces/metricscollector/)

Defined in: [src/core/types.ts:237](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/core/types.ts#L237)

MetricsCollector instance for the `/metrics` endpoint.

***

### prefix?

> `optional` **prefix**: `string`

Defined in: [src/core/types.ts:233](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/core/types.ts#L233)

Path prefix for admin routes. Default: `"___gateway"`.
