---
editUrl: false
next: false
prev: false
title: "GatewayInstance"
---

Defined in: src/core/types.ts:215

The instantiated gateway — a configured Hono app

## Properties

### \_registry

> **\_registry**: [`GatewayRegistry`](/api/index/interfaces/gatewayregistry/)

Defined in: src/core/types.ts:223

Internal registry for admin introspection

***

### app

> **app**: `Hono`

Defined in: src/core/types.ts:217

The underlying Hono app, ready to be exported as a Worker

***

### name

> **name**: `string`

Defined in: src/core/types.ts:221

Gateway name

***

### routeCount

> **routeCount**: `number`

Defined in: src/core/types.ts:219

Registered route count
