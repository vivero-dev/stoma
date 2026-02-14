---
editUrl: false
next: false
prev: false
title: "scope"
---

> **scope**\<`TBindings`\>(`config`): [`RouteConfig`](/api/index/interfaces/routeconfig/)\<`TBindings`\>[]

Defined in: [src/core/scope.ts:98](https://github.com/HomeGrower-club/stoma/blob/7a6bc5c6595d42b4d2edc385006b88a77065ce23/src/core/scope.ts#L98)

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
