---
editUrl: false
next: false
prev: false
title: "ScopeConfig"
---

Defined in: [src/core/scope.ts:39](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/core/scope.ts#L39)

Configuration for a route scope (group).

## Type Parameters

### TBindings

`TBindings` = `Record`\<`string`, `unknown`\>

Worker bindings type, propagated to child routes.

## Properties

### metadata?

> `optional` **metadata**: `Record`\<`string`, `unknown`\>

Defined in: [src/core/scope.ts:47](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/core/scope.ts#L47)

Metadata merged into every child route (child wins on conflict)

***

### policies?

> `optional` **policies**: [`Policy`](/api/index/interfaces/policy/)[]

Defined in: [src/core/scope.ts:43](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/core/scope.ts#L43)

Policies prepended to every child route's pipeline policies

***

### prefix

> **prefix**: `string`

Defined in: [src/core/scope.ts:41](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/core/scope.ts#L41)

Path prefix prepended to all child routes (e.g. "/api/v1")

***

### routes

> **routes**: [`RouteConfig`](/api/index/interfaces/routeconfig/)\<`TBindings`\>[]

Defined in: [src/core/scope.ts:45](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/core/scope.ts#L45)

Child routes to scope
