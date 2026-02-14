---
editUrl: false
next: false
prev: false
title: "GatewayInstance"
---

Defined in: [src/core/types.ts:262](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/core/types.ts#L262)

The instantiated gateway — a configured Hono app

## Properties

### \_registry

> **\_registry**: [`GatewayRegistry`](/api/index/interfaces/gatewayregistry/)

Defined in: [src/core/types.ts:270](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/core/types.ts#L270)

Internal registry for admin introspection

***

### app

> **app**: `Hono`

Defined in: [src/core/types.ts:264](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/core/types.ts#L264)

The underlying Hono app, ready to be exported as a Worker

***

### name

> **name**: `string`

Defined in: [src/core/types.ts:268](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/core/types.ts#L268)

Gateway name

***

### routeCount

> **routeCount**: `number`

Defined in: [src/core/types.ts:266](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/core/types.ts#L266)

Registered route count
