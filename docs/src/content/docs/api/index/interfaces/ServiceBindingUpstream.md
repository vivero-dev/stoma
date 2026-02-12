---
editUrl: false
next: false
prev: false
title: "ServiceBindingUpstream"
---

Defined in: src/core/types.ts:153

Forward to another Cloudflare Worker via a Service Binding.
The binding must be configured in the consumer's `wrangler.toml`.

## Properties

### rewritePath()?

> `optional` **rewritePath**: (`path`) => `string`

Defined in: src/core/types.ts:158

Rewrite the path before forwarding to the bound service.

#### Parameters

##### path

`string`

#### Returns

`string`

***

### service

> **service**: `string`

Defined in: src/core/types.ts:156

Name of the Service Binding in `wrangler.toml` (e.g. `"AUTH_SERVICE"`).

***

### type

> **type**: `"service-binding"`

Defined in: src/core/types.ts:154
