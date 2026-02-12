---
editUrl: false
next: false
prev: false
title: "AdminConfig"
---

Defined in: src/core/types.ts:182

Configuration for the admin introspection API.

## Properties

### auth()?

> `optional` **auth**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: src/core/types.ts:188

Optional auth check — return `false` to deny access.

#### Parameters

##### c

`Context`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

***

### enabled

> **enabled**: `boolean`

Defined in: src/core/types.ts:184

Enable admin routes. Default: `false`.

***

### metrics?

> `optional` **metrics**: [`MetricsCollector`](/api/index/interfaces/metricscollector/)

Defined in: src/core/types.ts:190

MetricsCollector instance for the `/metrics` endpoint.

***

### prefix?

> `optional` **prefix**: `string`

Defined in: src/core/types.ts:186

Path prefix for admin routes. Default: `"___gateway"`.
