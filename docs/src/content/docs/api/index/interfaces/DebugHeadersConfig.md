---
editUrl: false
next: false
prev: false
title: "DebugHeadersConfig"
---

Defined in: [src/core/types.ts:101](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/core/types.ts#L101)

Configuration for client-requested debug headers.

## Properties

### allow?

> `optional` **allow**: `string`[]

Defined in: [src/core/types.ts:105](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/core/types.ts#L105)

Allowlist of debug header names clients can request. When set, only these headers are emitted. Default: all.

***

### requestHeader?

> `optional` **requestHeader**: `string`

Defined in: [src/core/types.ts:103](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/core/types.ts#L103)

Request header name clients use to request debug values. Default: `"x-stoma-debug"`.
