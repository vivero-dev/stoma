---
editUrl: false
next: false
prev: false
title: "PolicyContinue"
---

Defined in: [src/core/protocol.ts:153](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/core/protocol.ts#L153)

Allow processing to continue, optionally with mutations.

Equivalent to `await next()` in HTTP middleware, or ext_proc
`CommonResponse` with header/body mutations.

## Properties

### action

> **action**: `"continue"`

Defined in: [src/core/protocol.ts:154](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/core/protocol.ts#L154)

***

### mutations?

> `optional` **mutations**: [`Mutation`](/api/index/type-aliases/mutation/)[]

Defined in: [src/core/protocol.ts:156](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/core/protocol.ts#L156)

Mutations to apply before continuing to the next policy or upstream.
