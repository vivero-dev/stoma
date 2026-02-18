---
editUrl: false
next: false
prev: false
title: "RouteConfig"
---

Defined in: [packages/gateway/src/core/types.ts:145](https://github.com/HomeGrower-club/stoma/blob/b366835e3781c3a030f80027e784272dddf630da/packages/gateway/src/core/types.ts#L145)

Individual route configuration.

## Type Parameters

### TBindings

`TBindings` = `Record`\<`string`, `unknown`\>

Worker bindings type, propagated from [GatewayConfig](/api/index/interfaces/gatewayconfig/).

## Properties

### metadata?

> `optional` **metadata**: `Record`\<`string`, `unknown`\>

Defined in: [packages/gateway/src/core/types.ts:153](https://github.com/HomeGrower-club/stoma/blob/b366835e3781c3a030f80027e784272dddf630da/packages/gateway/src/core/types.ts#L153)

Route-level metadata for logging/observability

***

### methods?

> `optional` **methods**: [`HttpMethod`](/api/index/type-aliases/httpmethod/)[]

Defined in: [packages/gateway/src/core/types.ts:149](https://github.com/HomeGrower-club/stoma/blob/b366835e3781c3a030f80027e784272dddf630da/packages/gateway/src/core/types.ts#L149)

Allowed HTTP methods. Defaults to all.

***

### path

> **path**: `string`

Defined in: [packages/gateway/src/core/types.ts:147](https://github.com/HomeGrower-club/stoma/blob/b366835e3781c3a030f80027e784272dddf630da/packages/gateway/src/core/types.ts#L147)

Route path pattern (Hono syntax, e.g. "/users/:id")

***

### pipeline

> **pipeline**: [`PipelineConfig`](/api/index/interfaces/pipelineconfig/)\<`TBindings`\>

Defined in: [packages/gateway/src/core/types.ts:151](https://github.com/HomeGrower-club/stoma/blob/b366835e3781c3a030f80027e784272dddf630da/packages/gateway/src/core/types.ts#L151)

Pipeline to process this route
