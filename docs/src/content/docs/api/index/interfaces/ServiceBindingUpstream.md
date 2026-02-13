---
editUrl: false
next: false
prev: false
title: "ServiceBindingUpstream"
---

Defined in: [src/core/types.ts:200](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/core/types.ts#L200)

Forward to another Cloudflare Worker via a Service Binding.
The binding must be configured in the consumer's `wrangler.toml`.

## Type Parameters

### TBindings

`TBindings` = `Record`\<`string`, `unknown`\>

Worker bindings type. When provided, `service`
  autocompletes to valid binding names from your Env interface.

## Properties

### rewritePath()?

> `optional` **rewritePath**: (`path`) => `string`

Defined in: [src/core/types.ts:205](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/core/types.ts#L205)

Rewrite the path before forwarding to the bound service.

#### Parameters

##### path

`string`

#### Returns

`string`

***

### service

> **service**: `Extract`\<keyof `TBindings`, `string`\>

Defined in: [src/core/types.ts:203](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/core/types.ts#L203)

Name of the Service Binding in `wrangler.toml` (e.g. `"AUTH_SERVICE"`).

***

### type

> **type**: `"service-binding"`

Defined in: [src/core/types.ts:201](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/core/types.ts#L201)
