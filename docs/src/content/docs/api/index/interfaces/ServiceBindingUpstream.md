---
editUrl: false
next: false
prev: false
title: "ServiceBindingUpstream"
---

Defined in: [src/core/types.ts:153](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/core/types.ts#L153)

Forward to another Cloudflare Worker via a Service Binding.
The binding must be configured in the consumer's `wrangler.toml`.

## Properties

### rewritePath()?

> `optional` **rewritePath**: (`path`) => `string`

Defined in: [src/core/types.ts:158](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/core/types.ts#L158)

Rewrite the path before forwarding to the bound service.

#### Parameters

##### path

`string`

#### Returns

`string`

***

### service

> **service**: `string`

Defined in: [src/core/types.ts:156](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/core/types.ts#L156)

Name of the Service Binding in `wrangler.toml` (e.g. `"AUTH_SERVICE"`).

***

### type

> **type**: `"service-binding"`

Defined in: [src/core/types.ts:154](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/core/types.ts#L154)
