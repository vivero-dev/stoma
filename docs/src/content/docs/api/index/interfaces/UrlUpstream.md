---
editUrl: false
next: false
prev: false
title: "UrlUpstream"
---

Defined in: [packages/gateway/src/core/types.ts:183](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/types.ts#L183)

Proxy to a remote URL. The gateway clones the request, rewrites headers,
and forwards it via `fetch()`. SSRF protection ensures the rewritten URL
stays on the same origin as the target.

## Properties

### headers?

> `optional` **headers**: `Record`\<`string`, `string`\>

Defined in: [packages/gateway/src/core/types.ts:190](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/types.ts#L190)

Headers to add/override on the forwarded request.

***

### rewritePath()?

> `optional` **rewritePath**: (`path`) => `string`

Defined in: [packages/gateway/src/core/types.ts:188](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/types.ts#L188)

Rewrite the path before forwarding. Must not change the origin.

#### Parameters

##### path

`string`

#### Returns

`string`

***

### target

> **target**: `string`

Defined in: [packages/gateway/src/core/types.ts:186](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/types.ts#L186)

Target URL (e.g. `"https://api.example.com"`). Validated at config time.

***

### type

> **type**: `"url"`

Defined in: [packages/gateway/src/core/types.ts:184](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/types.ts#L184)
