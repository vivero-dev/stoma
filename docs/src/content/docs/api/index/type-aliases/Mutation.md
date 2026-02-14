---
editUrl: false
next: false
prev: false
title: "Mutation"
---

> **Mutation** = [`HeaderMutation`](/api/index/interfaces/headermutation/) \| [`BodyMutation`](/api/index/interfaces/bodymutation/) \| [`StatusMutation`](/api/index/interfaces/statusmutation/) \| [`AttributeMutation`](/api/index/interfaces/attributemutation/)

Defined in: [src/core/protocol.ts:205](https://github.com/HomeGrower-club/stoma/blob/7a6bc5c6595d42b4d2edc385006b88a77065ce23/src/core/protocol.ts#L205)

A discrete modification to apply to the request or response.
Discriminated on `type`.

Designed to map cleanly to ext_proc `HeaderMutation`, `BodyMutation`,
and Envoy dynamic metadata.
