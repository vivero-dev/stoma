---
editUrl: false
next: false
prev: false
title: "UrlUpstream"
---

Defined in: [src/core/types.ts:139](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/core/types.ts#L139)

Proxy to a remote URL. The gateway clones the request, rewrites headers,
and forwards it via `fetch()`. SSRF protection ensures the rewritten URL
stays on the same origin as the target.

## Properties

### headers?

> `optional` **headers**: `Record`\<`string`, `string`\>

Defined in: [src/core/types.ts:146](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/core/types.ts#L146)

Headers to add/override on the forwarded request.

***

### rewritePath()?

> `optional` **rewritePath**: (`path`) => `string`

Defined in: [src/core/types.ts:144](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/core/types.ts#L144)

Rewrite the path before forwarding. Must not change the origin.

#### Parameters

##### path

`string`

#### Returns

`string`

***

### target

> **target**: `string`

Defined in: [src/core/types.ts:142](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/core/types.ts#L142)

Target URL (e.g. `"https://api.example.com"`). Validated at config time.

***

### type

> **type**: `"url"`

Defined in: [src/core/types.ts:140](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/core/types.ts#L140)
