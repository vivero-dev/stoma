---
editUrl: false
next: false
prev: false
title: "RouteConfig"
---

Defined in: src/core/types.ts:109

Individual route configuration

## Properties

### metadata?

> `optional` **metadata**: `Record`\<`string`, `unknown`\>

Defined in: src/core/types.ts:117

Route-level metadata for logging/observability

***

### methods?

> `optional` **methods**: [`HttpMethod`](/api/index/type-aliases/httpmethod/)[]

Defined in: src/core/types.ts:113

Allowed HTTP methods. Defaults to all.

***

### path

> **path**: `string`

Defined in: src/core/types.ts:111

Route path pattern (Hono syntax, e.g. "/users/:id")

***

### pipeline

> **pipeline**: [`PipelineConfig`](/api/index/interfaces/pipelineconfig/)

Defined in: src/core/types.ts:115

Pipeline to process this route
