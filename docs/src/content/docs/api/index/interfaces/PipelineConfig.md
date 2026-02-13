---
editUrl: false
next: false
prev: false
title: "PipelineConfig"
---

Defined in: [packages/stoma/src/core/types.ts:121](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/core/types.ts#L121)

Pipeline: ordered chain of policies leading to an upstream

## Properties

### policies?

> `optional` **policies**: [`Policy`](/api/index/interfaces/policy/)[]

Defined in: [packages/stoma/src/core/types.ts:123](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/core/types.ts#L123)

Policies executed in order before the upstream

***

### upstream

> **upstream**: [`UpstreamConfig`](/api/index/type-aliases/upstreamconfig/)

Defined in: [packages/stoma/src/core/types.ts:125](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/core/types.ts#L125)

Upstream target configuration
