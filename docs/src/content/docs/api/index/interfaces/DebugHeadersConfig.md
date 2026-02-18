---
editUrl: false
next: false
prev: false
title: "DebugHeadersConfig"
---

Defined in: [packages/gateway/src/core/types.ts:133](https://github.com/HomeGrower-club/stoma/blob/b366835e3781c3a030f80027e784272dddf630da/packages/gateway/src/core/types.ts#L133)

Configuration for client-requested debug headers.

## Properties

### allow?

> `optional` **allow**: `string`[]

Defined in: [packages/gateway/src/core/types.ts:137](https://github.com/HomeGrower-club/stoma/blob/b366835e3781c3a030f80027e784272dddf630da/packages/gateway/src/core/types.ts#L137)

Allowlist of debug header names clients can request. When set, only these headers are emitted. Default: all.

***

### requestHeader?

> `optional` **requestHeader**: `string`

Defined in: [packages/gateway/src/core/types.ts:135](https://github.com/HomeGrower-club/stoma/blob/b366835e3781c3a030f80027e784272dddf630da/packages/gateway/src/core/types.ts#L135)

Request header name clients use to request debug values. Default: `"x-stoma-debug"`.
