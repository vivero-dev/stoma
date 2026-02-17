---
editUrl: false
next: false
prev: false
title: "ScopeConfig"
---

Defined in: [packages/gateway/src/core/scope.ts:39](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/scope.ts#L39)

Configuration for a route scope (group).

## Type Parameters

### TBindings

`TBindings` = `Record`\<`string`, `unknown`\>

Worker bindings type, propagated to child routes.

## Properties

### metadata?

> `optional` **metadata**: `Record`\<`string`, `unknown`\>

Defined in: [packages/gateway/src/core/scope.ts:47](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/scope.ts#L47)

Metadata merged into every child route (child wins on conflict)

***

### policies?

> `optional` **policies**: [`Policy`](/api/index/interfaces/policy/)[]

Defined in: [packages/gateway/src/core/scope.ts:43](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/scope.ts#L43)

Policies prepended to every child route's pipeline policies

***

### prefix

> **prefix**: `string`

Defined in: [packages/gateway/src/core/scope.ts:41](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/scope.ts#L41)

Path prefix prepended to all child routes (e.g. "/api/v1")

***

### routes

> **routes**: [`RouteConfig`](/api/index/interfaces/routeconfig/)\<`TBindings`\>[]

Defined in: [packages/gateway/src/core/scope.ts:45](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/scope.ts#L45)

Child routes to scope
