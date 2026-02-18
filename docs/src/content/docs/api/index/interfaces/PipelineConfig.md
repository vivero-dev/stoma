---
editUrl: false
next: false
prev: false
title: "PipelineConfig"
---

Defined in: [packages/gateway/src/core/types.ts:161](https://github.com/HomeGrower-club/stoma/blob/b366835e3781c3a030f80027e784272dddf630da/packages/gateway/src/core/types.ts#L161)

Pipeline: ordered chain of policies leading to an upstream.

## Type Parameters

### TBindings

`TBindings` = `Record`\<`string`, `unknown`\>

Worker bindings type, propagated from [RouteConfig](/api/index/interfaces/routeconfig/).

## Properties

### policies?

> `optional` **policies**: [`Policy`](/api/index/interfaces/policy/)[]

Defined in: [packages/gateway/src/core/types.ts:163](https://github.com/HomeGrower-club/stoma/blob/b366835e3781c3a030f80027e784272dddf630da/packages/gateway/src/core/types.ts#L163)

Policies executed in order before the upstream

***

### upstream

> **upstream**: [`UpstreamConfig`](/api/index/type-aliases/upstreamconfig/)\<`TBindings`\>

Defined in: [packages/gateway/src/core/types.ts:165](https://github.com/HomeGrower-club/stoma/blob/b366835e3781c3a030f80027e784272dddf630da/packages/gateway/src/core/types.ts#L165)

Upstream target configuration
