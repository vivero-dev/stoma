---
editUrl: false
next: false
prev: false
title: "DebugHeadersConfig"
---

Defined in: [packages/stoma/src/core/types.ts:101](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/core/types.ts#L101)

Configuration for client-requested debug headers.

## Properties

### allow?

> `optional` **allow**: `string`[]

Defined in: [packages/stoma/src/core/types.ts:105](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/core/types.ts#L105)

Allowlist of debug header names clients can request. When set, only these headers are emitted. Default: all.

***

### requestHeader?

> `optional` **requestHeader**: `string`

Defined in: [packages/stoma/src/core/types.ts:103](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/core/types.ts#L103)

Request header name clients use to request debug values. Default: `"x-stoma-debug"`.
