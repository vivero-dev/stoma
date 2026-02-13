---
editUrl: false
next: false
prev: false
title: "PipelineConfig"
---

Defined in: [src/core/types.ts:161](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/core/types.ts#L161)

Pipeline: ordered chain of policies leading to an upstream.

## Type Parameters

### TBindings

`TBindings` = `Record`\<`string`, `unknown`\>

Worker bindings type, propagated from [RouteConfig](/api/index/interfaces/routeconfig/).

## Properties

### policies?

> `optional` **policies**: [`Policy`](/api/index/interfaces/policy/)[]

Defined in: [src/core/types.ts:163](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/core/types.ts#L163)

Policies executed in order before the upstream

***

### upstream

> **upstream**: [`UpstreamConfig`](/api/index/type-aliases/upstreamconfig/)\<`TBindings`\>

Defined in: [src/core/types.ts:165](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/core/types.ts#L165)

Upstream target configuration
