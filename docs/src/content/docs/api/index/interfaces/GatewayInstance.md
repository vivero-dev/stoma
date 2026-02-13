---
editUrl: false
next: false
prev: false
title: "GatewayInstance"
---

Defined in: [packages/stoma/src/core/types.ts:215](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/core/types.ts#L215)

The instantiated gateway — a configured Hono app

## Properties

### \_registry

> **\_registry**: [`GatewayRegistry`](/api/index/interfaces/gatewayregistry/)

Defined in: [packages/stoma/src/core/types.ts:223](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/core/types.ts#L223)

Internal registry for admin introspection

***

### app

> **app**: `Hono`

Defined in: [packages/stoma/src/core/types.ts:217](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/core/types.ts#L217)

The underlying Hono app, ready to be exported as a Worker

***

### name

> **name**: `string`

Defined in: [packages/stoma/src/core/types.ts:221](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/core/types.ts#L221)

Gateway name

***

### routeCount

> **routeCount**: `number`

Defined in: [packages/stoma/src/core/types.ts:219](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/core/types.ts#L219)

Registered route count
