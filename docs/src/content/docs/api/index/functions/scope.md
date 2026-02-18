---
editUrl: false
next: false
prev: false
title: "scope"
---

> **scope**\<`TBindings`\>(`config`): [`RouteConfig`](/api/index/interfaces/routeconfig/)\<`TBindings`\>[]

Defined in: [packages/gateway/src/core/scope.ts:105](https://github.com/HomeGrower-club/stoma/blob/b366835e3781c3a030f80027e784272dddf630da/packages/gateway/src/core/scope.ts#L105)

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
