---
editUrl: false
next: false
prev: false
title: "mergeConfigs"
---

> **mergeConfigs**\<`TBindings`\>(...`configs`): [`GatewayConfig`](/api/index/interfaces/gatewayconfig/)\<`TBindings`\>

Defined in: [packages/gateway/src/config/merge.ts:46](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/config/merge.ts#L46)

Merge multiple partial gateway configs into a single complete config.

Merge semantics by field:
- **routes** - concatenated (all routes from all configs, in order)
- **policies** - deduplicated by `name` (later config wins on conflict)
- **admin**, **debugHeaders** - shallow-merged when both are objects;
  last-defined wins when types differ (boolean vs object)
- All other scalar fields - last-defined wins (undefined values are skipped)

## Type Parameters

### TBindings

`TBindings` = `Record`\<`string`, `unknown`\>

Worker bindings type, propagated to routes.

## Parameters

### configs

...`Partial`\<[`GatewayConfig`](/api/index/interfaces/gatewayconfig/)\<`TBindings`\>\>[]

Partial configs to merge (left to right, later wins).

## Returns

[`GatewayConfig`](/api/index/interfaces/gatewayconfig/)\<`TBindings`\>

A merged GatewayConfig.

## Throws

If the merged result has zero routes.
