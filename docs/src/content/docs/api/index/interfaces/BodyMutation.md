---
editUrl: false
next: false
prev: false
title: "BodyMutation"
---

Defined in: [src/core/protocol.ts:223](https://github.com/HomeGrower-club/stoma/blob/7a6bc5c6595d42b4d2edc385006b88a77065ce23/src/core/protocol.ts#L223)

Replace or clear the message body.

## Properties

### content?

> `optional` **content**: `string` \| `ArrayBuffer`

Defined in: [src/core/protocol.ts:228](https://github.com/HomeGrower-club/stoma/blob/7a6bc5c6595d42b4d2edc385006b88a77065ce23/src/core/protocol.ts#L228)

New body content. Required for `"replace"`, ignored for `"clear"`.

***

### op

> **op**: `"replace"` \| `"clear"`

Defined in: [src/core/protocol.ts:226](https://github.com/HomeGrower-club/stoma/blob/7a6bc5c6595d42b4d2edc385006b88a77065ce23/src/core/protocol.ts#L226)

`"replace"` substitutes the body, `"clear"` removes it entirely.

***

### type

> **type**: `"body"`

Defined in: [src/core/protocol.ts:224](https://github.com/HomeGrower-club/stoma/blob/7a6bc5c6595d42b4d2edc385006b88a77065ce23/src/core/protocol.ts#L224)
