---
editUrl: false
next: false
prev: false
title: "DebugHeadersConfig"
---

Defined in: [src/core/types.ts:133](https://github.com/HomeGrower-club/stoma/blob/6293f5d254fea2989ebdf0b4b444e914a25475fc/src/core/types.ts#L133)

Configuration for client-requested debug headers.

## Properties

### allow?

> `optional` **allow**: `string`[]

Defined in: [src/core/types.ts:137](https://github.com/HomeGrower-club/stoma/blob/6293f5d254fea2989ebdf0b4b444e914a25475fc/src/core/types.ts#L137)

Allowlist of debug header names clients can request. When set, only these headers are emitted. Default: all.

***

### requestHeader?

> `optional` **requestHeader**: `string`

Defined in: [src/core/types.ts:135](https://github.com/HomeGrower-club/stoma/blob/6293f5d254fea2989ebdf0b4b444e914a25475fc/src/core/types.ts#L135)

Request header name clients use to request debug values. Default: `"x-stoma-debug"`.
