---
editUrl: false
next: false
prev: false
title: "UrlUpstream"
---

Defined in: src/core/types.ts:139

Proxy to a remote URL. The gateway clones the request, rewrites headers,
and forwards it via `fetch()`. SSRF protection ensures the rewritten URL
stays on the same origin as the target.

## Properties

### headers?

> `optional` **headers**: `Record`\<`string`, `string`\>

Defined in: src/core/types.ts:146

Headers to add/override on the forwarded request.

***

### rewritePath()?

> `optional` **rewritePath**: (`path`) => `string`

Defined in: src/core/types.ts:144

Rewrite the path before forwarding. Must not change the origin.

#### Parameters

##### path

`string`

#### Returns

`string`

***

### target

> **target**: `string`

Defined in: src/core/types.ts:142

Target URL (e.g. `"https://api.example.com"`). Validated at config time.

***

### type

> **type**: `"url"`

Defined in: src/core/types.ts:140
