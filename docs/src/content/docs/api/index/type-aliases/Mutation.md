---
editUrl: false
next: false
prev: false
title: "Mutation"
---

> **Mutation** = [`HeaderMutation`](/api/index/interfaces/headermutation/) \| [`BodyMutation`](/api/index/interfaces/bodymutation/) \| [`StatusMutation`](/api/index/interfaces/statusmutation/) \| [`AttributeMutation`](/api/index/interfaces/attributemutation/)

Defined in: [src/core/protocol.ts:205](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/core/protocol.ts#L205)

A discrete modification to apply to the request or response.
Discriminated on `type`.

Designed to map cleanly to ext_proc `HeaderMutation`, `BodyMutation`,
and Envoy dynamic metadata.
