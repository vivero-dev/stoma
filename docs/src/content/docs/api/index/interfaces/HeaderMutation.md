---
editUrl: false
next: false
prev: false
title: "HeaderMutation"
---

Defined in: [src/core/protocol.ts:212](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/core/protocol.ts#L212)

Add, remove, or append a header value.

## Properties

### name

> **name**: `string`

Defined in: [src/core/protocol.ts:217](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/core/protocol.ts#L217)

Header name (case-insensitive).

***

### op

> **op**: `"set"` \| `"remove"` \| `"append"`

Defined in: [src/core/protocol.ts:215](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/core/protocol.ts#L215)

`"set"` replaces, `"remove"` deletes, `"append"` adds without replacing.

***

### type

> **type**: `"header"`

Defined in: [src/core/protocol.ts:213](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/core/protocol.ts#L213)

***

### value?

> `optional` **value**: `string`

Defined in: [src/core/protocol.ts:219](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/core/protocol.ts#L219)

Header value. Required for `"set"` and `"append"`, ignored for `"remove"`.
