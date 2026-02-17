---
editUrl: false
next: false
prev: false
title: "ServiceBindingUpstream"
---

Defined in: [packages/gateway/src/core/types.ts:200](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/types.ts#L200)

Forward to another Cloudflare Worker via a Service Binding.
The binding must be configured in the consumer's `wrangler.jsonc`.

## Type Parameters

### TBindings

`TBindings` = `Record`\<`string`, `unknown`\>

Worker bindings type. When provided, `service`
  autocompletes to valid binding names from your Env interface.

## Properties

### rewritePath()?

> `optional` **rewritePath**: (`path`) => `string`

Defined in: [packages/gateway/src/core/types.ts:205](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/types.ts#L205)

Rewrite the path before forwarding to the bound service.

#### Parameters

##### path

`string`

#### Returns

`string`

***

### service

> **service**: `Extract`\<keyof `TBindings`, `string`\>

Defined in: [packages/gateway/src/core/types.ts:203](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/types.ts#L203)

Name of the Service Binding in `wrangler.jsonc` (e.g. `"AUTH_SERVICE"`).

***

### type

> **type**: `"service-binding"`

Defined in: [packages/gateway/src/core/types.ts:201](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/types.ts#L201)
