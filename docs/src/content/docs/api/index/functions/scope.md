---
editUrl: false
next: false
prev: false
title: "scope"
---

> **scope**\<`TBindings`\>(`config`): [`RouteConfig`](/api/index/interfaces/routeconfig/)\<`TBindings`\>[]

Defined in: [src/core/scope.ts:98](https://github.com/HomeGrower-club/stoma/blob/08b5f2db5f15b4e339eff6647be9d231bf97a776/src/core/scope.ts#L98)

Group routes under a shared path prefix with shared policies and metadata.

Returns a flat array of transformed [RouteConfig](/api/index/interfaces/routeconfig/) objects ready to be
spread into `GatewayConfig.routes`.

## Type Parameters

### TBindings

`TBindings` = `Record`\<`string`, `unknown`\>

Worker bindings type, propagated to child routes.

## Parameters

### config

[`ScopeConfig`](/api/index/interfaces/scopeconfig/)\<`TBindings`\>

Scope configuration.

## Returns

[`RouteConfig`](/api/index/interfaces/routeconfig/)\<`TBindings`\>[]

Array of route configs with prefix, policies, and metadata applied.
